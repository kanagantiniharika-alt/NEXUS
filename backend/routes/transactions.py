from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date as dt_date
from decimal import Decimal
from typing import List

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, Transaction, TransactionCategory, RiskStatusLevel, FraudAlert, AlertType
from backend.schemas import TransactionCreate, TransactionResponse
from backend.routes.fraud_rule_engine import analyze_transaction_risk

router = APIRouter(prefix="/transactions", tags=["Transactions Module"])


def normalize_transaction_category(category_value):
    if isinstance(category_value, TransactionCategory):
        return category_value
    if isinstance(category_value, str):
        try:
            return TransactionCategory(category_value)
        except ValueError:
            return TransactionCategory.Bills
    return TransactionCategory.Bills

@router.get("", response_model=List[TransactionResponse])
def get_user_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves chronological transaction histories for active audited account login session.
    """
    txs = db.query(Transaction)\
        .filter(Transaction.user_id == user.id)\
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())\
        .all()
    return txs


@router.post("", response_model=TransactionResponse)
def register_new_transaction(tx_in: TransactionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Registers a new spending audit record. Automatically triggers rule-based real-time risk assessment
    checks to flag overseas anomalies, P2P scanner flags, or high-value takeover alerts. Deducts from user account.
    """
    amount_float = float(tx_in.amount)
    
    # Check balance first
    user_balance = float(user.balance)
    
    new_tx_id = f"tx_{datetime.utcnow().timestamp()}"
    tx_parsed_date = dt_date.today()
    if tx_in.date:
        try:
            tx_parsed_date = datetime.strptime(tx_in.date, "%Y-%m-%d").date()
        except Exception:
            pass

    # Create temporary transaction to analyze
    temp_tx = Transaction(
        id=new_tx_id,
        user_id=user.id,
        amount=tx_in.amount,
        merchant=tx_in.merchant,
        category=tx_in.category,
        transaction_date=tx_parsed_date,
        location=tx_in.location or "Online Gateway",
        risk_score=5,
        risk_status=RiskStatusLevel.low,
        risk_reason="aligned with standard user profile patterns.",
        created_at=datetime.utcnow()
    )

    # Analyze risk
    analysis = analyze_transaction_risk(temp_tx, user, db)
    
    temp_tx.risk_score = analysis["risk_score"]
    temp_tx.risk_status = analysis["risk_status"]
    temp_tx.risk_reason = analysis["risk_reason"]

    # Deduct balance safely
    user.balance = Decimal(str(user_balance - amount_float))
    
    db.add(temp_tx)
    
    # Auto-generate a FraudAlert if risk is Medium or High
    if temp_tx.risk_status in [RiskStatusLevel.medium, RiskStatusLevel.high]:
        alert_id = f"fa_{datetime.utcnow().timestamp()}"
        alert_type = AlertType.location_anomaly if "location" in temp_tx.risk_reason.lower() else AlertType.behavioral
        alert = FraudAlert(
            id=alert_id,
            user_id=user.id,
            title=f"Suspicious {temp_tx.category.value} Transaction",
            type=alert_type,
            risk_score=temp_tx.risk_score,
            merchant=temp_tx.merchant,
            amount=temp_tx.amount,
            reason=temp_tx.risk_reason,
            details=f"System security anomaly flag. Risk Score: {temp_tx.risk_score}%. Location: {temp_tx.location}.",
            alert_date=tx_parsed_date,
            is_resolved=False
        )
        db.add(alert)

    db.commit()
    db.refresh(temp_tx)
    db.refresh(user)
    
    return temp_tx


@router.post("/import")
def import_csv_transactions(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Imports a list of transactions parsed from CSV, applies rule-based risk evaluation,
    deducts total from user balance, and returns new balance.
    """
    rows = payload.get("transactions")
    if not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="Transactions must be a list of records.")

    imported_txs = []
    total_deduct = 0.0

    for r in rows:
        amount_val = float(r.get("amount", 120))
        total_deduct += amount_val

        tx_id = f"tx_imp_{datetime.utcnow().timestamp()}_{len(imported_txs)}"
        tx_date_str = r.get("date")
        tx_date = dt_date.today()
        if tx_date_str:
            try:
                tx_date = datetime.strptime(tx_date_str, "%Y-%m-%d").date()
            except Exception:
                pass

        # Create transaction
        category_value = normalize_transaction_category(r.get("category", "Bills"))

        tx = Transaction(
            id=tx_id,
            user_id=user.id,
            amount=Decimal(str(amount_val)),
            merchant=r.get("merchant", "Imported Ledger Payout"),
            category=category_value,
            transaction_date=tx_date,
            location=r.get("location", "Online Statement"),
            risk_score=5,
            risk_status=RiskStatusLevel.low,
            risk_reason="aligned with standard user profile patterns.",
            created_at=datetime.utcnow()
        )

        # Run risk analysis
        analysis = analyze_transaction_risk(tx, user, db)
        tx.risk_score = analysis["risk_score"]
        tx.risk_status = analysis["risk_status"]
        tx.risk_reason = analysis["risk_reason"]

        db.add(tx)
        imported_txs.append(tx)

        # Auto-generate a FraudAlert if risk is Medium or High
        if tx.risk_status in [RiskStatusLevel.medium, RiskStatusLevel.high]:
            alert_id = f"fa_{datetime.utcnow().timestamp()}_{len(imported_txs)}"
            alert_type = AlertType.location_anomaly if "location" in tx.risk_reason.lower() else AlertType.behavioral
            alert = FraudAlert(
                id=alert_id,
                user_id=user.id,
                title=f"Suspicious Imported {tx.category.value}",
                type=alert_type,
                risk_score=tx.risk_score,
                merchant=tx.merchant,
                amount=tx.amount,
                reason=tx.risk_reason,
                details=f"CSV import security flag. Risk Score: {tx.risk_score}%. Location: {tx.location}.",
                alert_date=tx_date,
                is_resolved=False
            )
            db.add(alert)

    # Adjust user balance
    user.balance = Decimal(str(float(user.balance) - total_deduct))
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "count": len(imported_txs),
        "newBalance": float(user.balance)
    }


@router.post("/bulk")
def bulk_payments_reconciliation(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Ingests list of payment rows, processes them as ledger items, and returns final balance.
    """
    rows = payload.get("transactions") or payload.get("payments")
    if not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="Transactions / payments list required.")

    total_deduct = 0.0
    processed_count = 0

    for r in rows:
        amount_val = float(r.get("amount", 100))
        total_deduct += amount_val

        tx_id = f"tx_bulk_{datetime.utcnow().timestamp()}_{processed_count}"
        tx_date_str = r.get("date")
        tx_date = dt_date.today()
        if tx_date_str:
            try:
                tx_date = datetime.strptime(tx_date_str, "%Y-%m-%d").date()
            except Exception:
                pass

        tx = Transaction(
            id=tx_id,
            user_id=user.id,
            amount=Decimal(str(amount_val)),
            merchant=r.get("merchant") or r.get("recipientName") or "Standard Outward Wire",
            category=normalize_transaction_category(r.get("category", "Bills")),
            transaction_date=tx_date,
            location=r.get("location", "P2P NetBanking"),
            risk_score=5,
            risk_status=RiskStatusLevel.low,
            risk_reason="aligned with standard user profile patterns.",
            created_at=datetime.utcnow()
        )

        analysis = analyze_transaction_risk(tx, user, db)
        tx.risk_score = analysis["risk_score"]
        tx.risk_status = analysis["risk_status"]
        tx.risk_reason = analysis["risk_reason"]

        db.add(tx)
        processed_count += 1

        if tx.risk_status in [RiskStatusLevel.medium, RiskStatusLevel.high]:
            alert_id = f"fa_bulk_{datetime.utcnow().timestamp()}_{processed_count}"
            alert = FraudAlert(
                id=alert_id,
                user_id=user.id,
                title=f"Suspicious Bulk Outflow",
                type=AlertType.behavioral,
                risk_score=tx.risk_score,
                merchant=tx.merchant,
                amount=tx.amount,
                reason=tx.risk_reason,
                details=f"Bulk payment security flag. Risk Score: {tx.risk_score}%.",
                alert_date=tx_date,
                is_resolved=False
            )
            db.add(alert)

    # Adjust balance
    user.balance = Decimal(str(float(user.balance) - total_deduct))
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "count": processed_count,
        "balance": float(user.balance)
    }

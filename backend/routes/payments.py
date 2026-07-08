from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, SavedCard, SavedBankAccount, Transaction, TransactionCategory, RiskStatusLevel
from backend.schemas import SavedCardCreate, SavedBankAccountCreate, TopupRequest

router = APIRouter(prefix="/payments", tags=["Payment Methods & Wallet Manager"])

# In-memory store for frozen payment method IDs to represent state dynamically without schema alterations
FROZEN_METHODS = set()

@router.get("")
def get_user_payment_methods(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Lists saved digital payment profiles, bank entities, or cards registered for this user profile.
    """
    cards = db.query(SavedCard).filter(SavedCard.user_id == user.id).all()
    banks = db.query(SavedBankAccount).filter(SavedBankAccount.user_id == user.id).all()

    # Seed defaults if completely brand new
    if not cards and not banks:
        default_card = SavedCard(
            id=f"pay_card_{datetime.utcnow().timestamp()}",
            user_id=user.id,
            card_holder=user.name,
            card_number="4111222233331049", # representation
            expiry="12/28",
            card_type="Visa Premium Signature"
        )
        default_bank = SavedBankAccount(
            id=f"pay_bank_{datetime.utcnow().timestamp()}",
            user_id=user.id,
            account_holder=user.name,
            bank_name="HDFC Private Wealth",
            account_number="50100234901923",
            ifsc="HDFC0000123",
            balance=Decimal("12000.00")
        )
        db.add(default_card)
        db.add(default_bank)
        db.commit()
        cards = [default_card]
        banks = [default_bank]

    # Convert to matching frontend schemas structure
    methods = []
    for c in cards:
        methods.append({
            "id": c.id,
            "type": "card",
            "name": f"{c.card_type} card",
            "issuer": c.card_type.split(" ")[0],
            "lastFour": c.card_number[-4:],
            "expiry": c.expiry,
            "holder": c.card_holder,
            "isFrozen": c.id in FROZEN_METHODS
        })
    for b in banks:
        methods.append({
            "id": b.id,
            "type": "bank",
            "name": b.bank_name,
            "issuer": b.bank_name,
            "lastFour": b.account_number[-4:],
            "expiry": "N/A",
            "holder": b.account_holder,
            "isFrozen": b.id in FROZEN_METHODS
        })

    return {"methods": methods}


@router.post("")
def create_payment_method(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Adds a new premium Visa/MasterCard credit profile or bank routing linkage.
    """
    method_type = payload.get("type")
    if method_type not in ["card", "bank"]:
        raise HTTPException(status_code=400, detail="Invalid payment method type specified. Must be 'card' or 'bank'.")

    method_id = f"pay_{datetime.utcnow().timestamp()}"

    if method_type == "card":
        card_holder = payload.get("holder") or user.name
        card_number = payload.get("lastFour") or "4111333344445555"
        expiry = payload.get("expiry") or "09/30"
        card_type = payload.get("issuer") or "Visa"

        db_card = SavedCard(
            id=method_id,
            user_id=user.id,
            card_holder=card_holder,
            card_number=card_number,
            expiry=expiry,
            card_type=card_type
        )
        db.add(db_card)
        db.commit()

        return {
            "id": method_id,
            "type": "card",
            "name": f"{card_type} card",
            "issuer": card_type,
            "lastFour": card_number[-4:],
            "expiry": expiry,
            "holder": card_holder,
            "isFrozen": False,
            "success": True
        }
    else:
        account_holder = payload.get("holder") or user.name
        bank_name = payload.get("issuer") or payload.get("name") or "National Bank"
        account_number = payload.get("lastFour") or "12349000"
        ifsc = "NATL0000101"

        db_bank = SavedBankAccount(
            id=method_id,
            user_id=user.id,
            account_holder=account_holder,
            bank_name=bank_name,
            account_number=account_number,
            ifsc=ifsc,
            balance=Decimal("50000.00")
        )
        db.add(db_bank)
        db.commit()

        return {
            "id": method_id,
            "type": "bank",
            "name": bank_name,
            "issuer": bank_name,
            "lastFour": account_number[-4:],
            "expiry": "N/A",
            "holder": account_holder,
            "isFrozen": False,
            "success": True
        }


@router.delete("/{method_id}")
def delete_payment_method(method_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Removes payment option linkages from active database records.
    """
    card = db.query(SavedCard).filter(SavedCard.id == method_id, SavedCard.user_id == user.id).first()
    if card:
        db.delete(card)
        db.commit()
        return {"success": True}

    bank = db.query(SavedBankAccount).filter(SavedBankAccount.id == method_id, SavedBankAccount.user_id == user.id).first()
    if bank:
        db.delete(bank)
        db.commit()
        return {"success": True}

    raise HTTPException(status_code=404, detail="Target saved payment option not found.")


@router.post("/topup")
def account_wallet_topup(req: TopupRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Authenticates direct manual cash balance sweeps. Triggers deposit record increments and records audit ledger transaction.
    """
    topup_val = Decimal(str(req.amount))
    if topup_val <= 0:
        raise HTTPException(status_code=400, detail="Topup balance sweeps must be strictly positive.")

    billing_label = "Secure Gateway Transfer"
    
    # Safely search card or bank to derive label representation
    card = db.query(SavedCard).filter(SavedCard.id == req.account_id, SavedCard.user_id == user.id).first()
    if card:
        billing_label = f"{card.card_type} Card (*{card.card_number[-4:]})"
    else:
        bank = db.query(SavedBankAccount).filter(SavedBankAccount.id == req.account_id, SavedBankAccount.user_id == user.id).first()
        if bank:
            billing_label = f"{bank.bank_name} Bank (*{bank.account_number[-4:]})"

    # Increase account balance
    user.balance = Decimal(str(user.balance)) + topup_val

    # Write a record transactions ledger line represents incoming money
    tx_id = f"tx_topup_{datetime.utcnow().timestamp()}"
    topup_tx = Transaction(
        id=tx_id,
        user_id=user.id,
        amount=topup_val,
        merchant="Nexus Private Wallet Topup",
        category=TransactionCategory.Bills, # Mapped Category for input balances representation
        transaction_date=datetime.utcnow().today(),
        location=billing_label,
        risk_score=0,
        risk_status=RiskStatusLevel.low,
        risk_reason="Automated direct manual topup. Account validity cleared."
    )
    db.add(topup_tx)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "balance": float(user.balance),
        "transaction": {
            "id": topup_tx.id,
            "amount": float(topup_tx.amount),
            "merchant": topup_tx.merchant,
            "category": "Bills",
            "date": str(topup_tx.transaction_date),
            "location": topup_tx.location,
            "riskScore": 0,
            "riskStatus": "low",
            "riskReason": topup_tx.risk_reason
        }
    }


@router.post("/{method_id}/toggle-freeze")
def toggle_freeze_method(method_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Toggles the frozen lock status of a saved payment method.
    """
    card = db.query(SavedCard).filter(SavedCard.id == method_id, SavedCard.user_id == user.id).first()
    bank = db.query(SavedBankAccount).filter(SavedBankAccount.id == method_id, SavedBankAccount.user_id == user.id).first()
    
    if not card and not bank:
        raise HTTPException(status_code=404, detail="Payment method not found.")
        
    if method_id in FROZEN_METHODS:
        FROZEN_METHODS.remove(method_id)
        is_frozen = False
    else:
        FROZEN_METHODS.add(method_id)
        is_frozen = True
        
    return {"success": True, "isFrozen": is_frozen}


@router.post("/freeze-all")
def freeze_all_methods(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Shields all linked payment cards/accounts by temporarily freezing them.
    """
    cards = db.query(SavedCard).filter(SavedCard.user_id == user.id).all()
    banks = db.query(SavedBankAccount).filter(SavedBankAccount.user_id == user.id).all()
    
    for c in cards:
        FROZEN_METHODS.add(c.id)
    for b in banks:
        FROZEN_METHODS.add(b.id)
        
    return {"success": True, "isFrozen": True}

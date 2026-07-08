from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import datetime
import uuid

from backend.database import get_db
from sqlalchemy.sql import func
from backend.routes.auth import get_current_user
from backend.models import FriendExpense, FriendExpenseMember, FriendSettlement, User

router = APIRouter(prefix="/friendsplit", tags=["Friend Expense Splitter"])


def to_decimal(v):
    try:
        return Decimal(str(v))
    except Exception:
        return Decimal(0)


@router.post("/create")
def create_friendsplit(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    title = payload.get("title")
    total_amount = to_decimal(payload.get("total_amount", 0))
    paid_by = payload.get("paid_by")
    members = payload.get("members", [])  # list of {name, percent?, amount?}
    split_mode = payload.get("split_mode", "equal")
    notes = payload.get("notes")

    if not title or total_amount <= 0 or not members or not paid_by:
        raise HTTPException(status_code=400, detail="Invalid payload for creating friend expense.")

    # persist expense
    expense = FriendExpense(
        id=f"exp_{uuid.uuid4()}",
        user_id=user.id,
        title=title,
        total_amount=total_amount,
        paid_by=paid_by,
        split_mode=split_mode,
        notes=notes
    )
    db.add(expense)
    db.flush()

    # compute contributions
    computed_members = []
    if split_mode == "equal":
        total_people = len(members) + 1
        share = (total_amount / Decimal(total_people)).quantize(Decimal("0.01"))
        for m in members:
            member = FriendExpenseMember(
                id=f"mem_{uuid.uuid4()}",
                expense_id=expense.id,
                name=m.get("name"),
                contribution_amount=m.get("contribution_amount"),
                contribution_percent=m.get("contribution_percent"),
                owes_amount=share
            )
            db.add(member)
            computed_members.append(member)

        payer_share = share
        diff = total_amount - (share * Decimal(total_people))
        if diff != 0:
            payer_share = (payer_share + diff).quantize(Decimal("0.01"))

        payer_member = FriendExpenseMember(
            id=f"mem_{uuid.uuid4()}",
            expense_id=expense.id,
            name=paid_by,
            contribution_amount=None,
            contribution_percent=None,
            owes_amount=payer_share
        )
        db.add(payer_member)
        computed_members.append(payer_member)
    else:
        # custom: based on provided percentages or amounts
        total_alloc = Decimal(0)
        for m in members:
            if m.get("contribution_percent") is not None:
                amt = (to_decimal(m.get("contribution_percent")) / Decimal(100) * total_amount).quantize(Decimal("0.01"))
            elif m.get("contribution_amount") is not None:
                amt = to_decimal(m.get("contribution_amount")).quantize(Decimal("0.01"))
            else:
                amt = Decimal(0)
            total_alloc += amt
            member = FriendExpenseMember(
                id=f"mem_{uuid.uuid4()}",
                expense_id=expense.id,
                name=m.get("name"),
                contribution_amount=m.get("contribution_amount"),
                contribution_percent=m.get("contribution_percent"),
                owes_amount=amt
            )
            db.add(member)
            computed_members.append(member)

        if total_alloc > total_amount:
            raise HTTPException(status_code=400, detail="Allocated contribution exceeds total amount.")

        payer_amount = (total_amount - total_alloc).quantize(Decimal("0.01"))
        payer_member = FriendExpenseMember(
            id=f"mem_{uuid.uuid4()}",
            expense_id=expense.id,
            name=paid_by,
            contribution_amount=None,
            contribution_percent=None,
            owes_amount=payer_amount
        )
        db.add(payer_member)
        computed_members.append(payer_member)

    db.flush()

    # create settlements: everyone except paid_by pays to paid_by their owes_amount
    settlements = []
    for m in computed_members:
        if m.name == paid_by:
            continue
        amt = to_decimal(m.owes_amount)
        if amt > 0:
            s = FriendSettlement(
                id=f"settle_{uuid.uuid4()}",
                expense_id=expense.id,
                from_member=m.name,
                to_member=paid_by,
                amount=amt
            )
            db.add(s)
            settlements.append(s)

    db.commit()

    return {
        "success": True,
        "expense": {
            "id": expense.id,
            "title": expense.title,
            "total_amount": float(expense.total_amount),
            "paid_by": expense.paid_by,
            "split_mode": expense.split_mode,
            "members": [
                {
                    "id": m.id,
                    "name": m.name,
                    "owes_amount": float(m.owes_amount) if m.owes_amount is not None else None,
                    "contribution_amount": float(m.contribution_amount) if m.contribution_amount is not None else None,
                    "contribution_percent": float(m.contribution_percent) if m.contribution_percent is not None else None,
                    "is_settled": m.is_settled
                } for m in computed_members
            ],
            "settlements": [
                {"id": s.id, "from": s.from_member, "to": s.to_member, "amount": float(s.amount), "is_settled": s.is_settled} for s in settlements
            ]
        }
    }


@router.get("/history")
def get_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # fetch expenses created by user
    exps = db.query(FriendExpense).filter(FriendExpense.user_id == user.id).order_by(FriendExpense.created_at.desc()).all()
    out = []
    for e in exps:
        members = db.query(FriendExpenseMember).filter(FriendExpenseMember.expense_id == e.id).all()
        settlements = db.query(FriendSettlement).filter(FriendSettlement.expense_id == e.id).all()
        out.append({
            "id": e.id,
            "title": e.title,
            "total_amount": float(e.total_amount),
            "paid_by": e.paid_by,
            "members": [{"id": m.id, "name": m.name, "owes_amount": float(m.owes_amount) if m.owes_amount is not None else None, "is_settled": m.is_settled} for m in members],
            "settlements": [{"id": s.id, "from": s.from_member, "to": s.to_member, "amount": float(s.amount), "is_settled": s.is_settled} for s in settlements],
            "created_at": e.created_at.isoformat()
        })
    return {"success": True, "history": out}


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # compute totals where user is payer (lent) or owes (borrowed)
    user_name = user.name
    lent_total = db.query(FriendSettlement).filter(FriendSettlement.to_member == user_name).with_entities(func.coalesce(func.sum(FriendSettlement.amount), 0)).scalar() if True else 0
    borrowed_total = db.query(FriendSettlement).filter(FriendSettlement.from_member == user_name).with_entities(func.coalesce(func.sum(FriendSettlement.amount), 0)).scalar() if True else 0

    # pending settlements
    pending = db.query(FriendSettlement).filter(((FriendSettlement.to_member == user_name) | (FriendSettlement.from_member == user_name)) & (FriendSettlement.is_settled == False)).with_entities(func.coalesce(func.sum(FriendSettlement.amount), 0)).scalar()

    # most frequent partner
    partners = db.query(FriendSettlement).filter((FriendSettlement.to_member == user_name) | (FriendSettlement.from_member == user_name)).all()
    freq = {}
    for p in partners:
        other = p.from_member if p.to_member == user_name else p.to_member
        freq[other] = freq.get(other, 0) + float(p.amount)
    most_freq = max(freq.items(), key=lambda x: x[1])[0] if freq else None

    return {
        "success": True,
        "total_lent": float(lent_total) if lent_total is not None else 0.0,
        "total_borrowed": float(borrowed_total) if borrowed_total is not None else 0.0,
        "pending": float(pending) if pending is not None else 0.0,
        "most_frequent_partner": most_freq
    }


@router.put("/settle/{settlement_id}")
def settle_payment(settlement_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(FriendSettlement).filter(FriendSettlement.id == settlement_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if s.is_settled:
        return {"success": True, "message": "Already settled"}
    s.is_settled = True
    s.settled_at = datetime.utcnow()
    db.commit()
    return {"success": True, "settlement": {"id": s.id, "is_settled": s.is_settled, "settled_at": s.settled_at.isoformat()}}

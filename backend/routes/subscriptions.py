from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from typing import List

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, Subscription, BillingInterval
from backend.schemas import SubscriptionResponse, SubscriptionCreate

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions Manager"])

@router.get("", response_model=List[SubscriptionResponse])
def get_user_subscriptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Lists verified recurring digital subscription platforms registered to this profile,
    providing automated recommendations on potential compromises.
    """
    subs = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.is_active == True).all()

    # Seed defaults if empty
    if not subs:
        defaults = [
            Subscription(
                id=f"sub_1_{datetime.utcnow().timestamp()}",
                user_id=user.id,
                name="Netflix Premium UHD",
                cost=Decimal("649.00"),
                billing_interval=BillingInterval.monthly,
                category="Entertainment",
                savings_potential=Decimal("150.00"),
                recommendation="Downgrade to Standard 1080p plan. Saves ₹150 monthly with identical mobile screen casting limits.",
                is_active=True
            ),
            Subscription(
                id=f"sub_2_{datetime.utcnow().timestamp()}",
                user_id=user.id,
                name="Spotify Family Pack",
                cost=Decimal("179.00"),
                billing_interval=BillingInterval.monthly,
                category="Entertainment",
                savings_potential=Decimal("119.00"),
                recommendation="Switch to single-student profile. Saves ₹119 monthly with zero playlist metadata degradation.",
                is_active=True
            ),
            Subscription(
                id=f"sub_3_{datetime.utcnow().timestamp()}",
                user_id=user.id,
                name="GitHub Copilot AI",
                cost=Decimal("820.00"),
                billing_interval=BillingInterval.monthly,
                category="Education",
                savings_potential=Decimal("0.00"),
                recommendation="Keep Active: Critical developer utility. High direct correlation with career goal timelines.",
                is_active=True
            ),
            Subscription(
                id=f"sub_4_{datetime.utcnow().timestamp()}",
                user_id=user.id,
                name="Gym Membership Vault",
                cost=Decimal("2200.00"),
                billing_interval=BillingInterval.monthly,
                category="Healthcare",
                savings_potential=Decimal("2200.00"),
                recommendation="Consolidate duplicate charges: Zero activity tracked in last 45 days. Fully cancel package or transition to active pay-per-visit slots.",
                is_active=True
            )
        ]
        db.add_all(defaults)
        db.commit()
        subs = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.is_active == True).all()

    return subs


@router.post("", response_model=SubscriptionResponse)
def add_new_subscription(sub_in: SubscriptionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Registers a recurring monthly or yearly subscription invoice.
    """
    cost_val = Decimal(str(sub_in.cost))
    savings_potential = Decimal("0.00")
    recommendation = "Maintain regular subscription; no redundancy checks cataloged."

    if cost_val > Decimal("500.00"):
        savings_potential = cost_val * Decimal("0.20")
        recommendation = f"Switch to basic annual billing cycle to compromise pricing, potential savings of ₹{savings_potential} monthly."

    sub_id = f"sub_{datetime.utcnow().timestamp()}"
    new_sub = Subscription(
        id=sub_id,
        user_id=user.id,
        name=sub_in.name,
        cost=cost_val,
        billing_interval=sub_in.billing_interval,
        category=sub_in.category or "Entertainment",
        savings_potential=savings_potential,
        recommendation=recommendation,
        is_active=True
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@router.delete("/{sub_id}", status_code=status.HTTP_200_OK)
def cancel_active_subscription(sub_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Disables/Deactivates a target recurring subscription within the platform database.
    """
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Selected subscription plan could not be located.")

    sub.is_active = False
    db.commit()
    return {"success": True, "message": "Subscription cancelled successfully."}

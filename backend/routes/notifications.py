from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, FraudAlert, FinancialGoal

router = APIRouter(prefix="/notifications", tags=["Notifications Engine"])

@router.get("")
def get_user_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dynamically compiles notifications from FraudAlert and FinancialGoal database records.
    """
    alerts = db.query(FraudAlert).filter(FraudAlert.user_id == user.id).all()
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).all()

    notifications = []

    # 1. Map FraudAlerts to security threat notifications
    for a in alerts:
        notifications.append({
            "id": f"noti_f_{a.id}",
            "title": a.title,
            "description": a.reason,
            "type": "security_threat",
            "timestamp": a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat(),
            "read": a.is_resolved,
            "severity": "danger" if a.risk_score > 75 else "warning"
        })

    # 2. Map FinancialGoals to goal milestone notifications
    for g in goals:
        pct = int((float(g.saved_amount) / float(g.target_amount) * 100)) if float(g.target_amount) > 0 else 0
        
        # Only notify if some progress is made
        if pct > 0:
            notifications.append({
                "id": f"noti_g_{g.id}",
                "title": f"Goal Milestone Reached! 🎉",
                "description": f"Objective vault active! '{g.name}' tracker is currently at {pct}% progress.",
                "type": "goal_milestone",
                "timestamp": g.updated_at.isoformat() if g.updated_at else datetime.utcnow().isoformat(),
                "read": False,
                "severity": "success" if pct == 100 else "info"
            })

    # Fallback default notifications if completely empty
    if not notifications:
        notifications = [
            {
                "id": "noti_default_1",
                "title": "Welcome to Nexus Interface",
                "description": "API connection authenticated successfully. Secure firewall active.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat(),
                "read": False,
                "severity": "info"
            }
        ]

    # Sort chronologically (most recent first)
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    return notifications


@router.post("/{noti_id}/read")
def read_notification(noti_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Marks a notification as read. If it's a fraud alert notification, resolves the alert in the database.
    """
    if noti_id.startswith("noti_f_"):
        alert_id = noti_id[7:]
        alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id, FraudAlert.user_id == user.id).first()
        if alert:
            alert.is_resolved = True
            db.commit()
            return {"success": True}
            
    return {"success": True}


@router.post("/read-all")
def read_all_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Marks all notifications as read. Resolves all fraud alerts.
    """
    alerts = db.query(FraudAlert).filter(FraudAlert.user_id == user.id, FraudAlert.is_resolved == False).all()
    for a in alerts:
         a.is_resolved = True
    db.commit()
    return {"success": True}


@router.delete("/{noti_id}")
def delete_notification(noti_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Deletes a notification. For fraud alerts, deletes the database record.
    """
    if noti_id.startswith("noti_f_"):
        alert_id = noti_id[7:]
        alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id, FraudAlert.user_id == user.id).first()
        if alert:
             db.delete(alert)
             db.commit()
             return {"success": True}
             
    return {"success": True}

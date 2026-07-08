from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, StudentProfile, UserRole

router = APIRouter(prefix="/student", tags=["Student Hub & Campus Finance Module"])

@router.get("/profile")
def get_student_metrics(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns student pocket balances, hostel budgets, book outlays, and educational scores.
    """
    if user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active accountant profile is selected as Professional. Toggle to Student Mode first."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            pocket_money=Decimal("5000.00"),
            allowance=Decimal("10000.00"),
            hostel_budget=Decimal("3000.00"),
            food_budget=Decimal("2500.00"),
            books_budget=Decimal("1000.00"),
            courses_budget=Decimal("1500.00"),
            travel_budget=Decimal("1000.00"),
            career_goals=["Complete AI Engineering Degree", "Automate Expense Sweeping"]
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "profile": {
            "pocketMoney": float(profile.pocket_money),
            "allowance": float(profile.allowance),
            "semesterBudget": {
                "hostel": float(profile.hostel_budget),
                "food": float(profile.food_budget),
                "books": float(profile.books_budget),
                "courses": float(profile.courses_budget),
                "travel": float(profile.travel_budget)
            },
            "financeScore": int(user.finance_score),
            "careerGoals": profile.career_goals
        },
        "scores": {
            "savings": 82,
            "discipline": 74,
            "overall": int(user.finance_score)
        }
    }


@router.post("/profile")
def update_student_profile(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Allows students to adjust their category semesters limits or career goals dynamically.
    """
    if user.role != UserRole.student:
        raise HTTPException(
            status_code=400,
            detail="Standard account role is professional. Cannot save metrics."
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id)
        db.add(profile)

    if "pocketMoney" in payload:
        profile.pocket_money = Decimal(str(payload["pocketMoney"]))
    if "allowance" in payload:
        profile.allowance = Decimal(str(payload["allowance"]))
    
    semester = payload.get("semesterBudget")
    if semester:
        if "hostel" in semester:
            profile.hostel_budget = Decimal(str(semester["hostel"]))
        if "food" in semester:
            profile.food_budget = Decimal(str(semester["food"]))
        if "books" in semester:
            profile.books_budget = Decimal(str(semester["books"]))
        if "courses" in semester:
            profile.courses_budget = Decimal(str(semester["courses"]))
        if "travel" in semester:
            profile.travel_budget = Decimal(str(semester["travel"]))

    if "careerGoals" in payload:
        profile.career_goals = payload["careerGoals"]

    db.commit()
    return {"success": True}

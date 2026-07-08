from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from typing import List

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, FinancialGoal, Transaction
from backend.schemas import FinancialGoalCreate, GoalDeposit

router = APIRouter(prefix="/goals", tags=["Savings Goals Module"])


def build_goal_recommendations(user: User, txs: List[Transaction], goal_name: str, target: float, saved: float, monthly_needed: float, deadline_months: int):
    income = float(user.income)
    balance = float(user.balance)
    total_spent = sum(float(t.amount) for t in txs)
    current_capacity = max(0.0, income - total_spent)
    remaining = max(0.0, target - saved)
    progress_pct = int(min(100, (saved / target) * 100)) if target > 0 else 0

    category_totals = {}
    for t in txs:
        category_totals[t.category.value] = category_totals.get(t.category.value, 0.0) + float(t.amount)
    food_spent = category_totals.get("Food", 0.0)
    shopping_spent = category_totals.get("Shopping", 0.0)

    debt_ratio = (total_spent / income * 100) if income > 0 else 0.0
    recommendations = []

    if remaining <= 0:
        recommendations.append({
            "id": "rec_goal_complete",
            "type": "goal_complete",
            "text": f"This goal is already funded. Consider redirecting future savings to your next priority or an emergency buffer."
        })
        plan_text = f"No further contributions needed for {goal_name}."
        return recommendations, plan_text

    if current_capacity >= monthly_needed:
        recommendations.append({
            "id": "rec_capacity_ok",
            "type": "cashflow",
            "text": f"Your current monthly cashflow supports ₹{monthly_needed:,.2f} in goal savings. Keep this momentum for {deadline_months} months."
        })
    else:
        shortfall = monthly_needed - current_capacity
        recommendations.append({
            "id": "rec_capacity_gap",
            "type": "cashflow_deficit",
            "text": f"Your available savings of ₹{current_capacity:,.2f} is ₹{shortfall:,.2f} below the goal target contribution. Trim high-impact spend categories first."
        })

    if food_spent > 0.15 * income:
        savings_food = round(food_spent * 0.18, 2)
        recommendations.append({
            "id": "rec_food_reduce",
            "type": "spending_cut",
            "category": "Food",
            "estimated_monthly_savings": savings_food,
            "text": f"Reduce food spending by 18% to free about ₹{savings_food:,.2f} for your savings plan each month."
        })
    if shopping_spent > 0.10 * income:
        savings_shop = round(shopping_spent * 0.22, 2)
        recommendations.append({
            "id": "rec_shopping_opt",
            "type": "behavioral",
            "category": "Shopping",
            "estimated_monthly_savings": savings_shop,
            "text": f"A 72-hour pause before discretionary shopping can unlock roughly ₹{savings_shop:,.2f} per month for goals."
        })

    if debt_ratio > 65.0:
        recommendations.append({
            "id": "rec_debt_management",
            "type": "debt_management",
            "text": "Your monthly spending ratio is elevated. Prioritize the highest-impact savings actions before adding new recurring obligations."
        })
    else:
        recommendations.append({
            "id": "rec_subscriptions",
            "type": "subscription_optimization",
            "text": "Review active subscriptions and shift to annual or student plans where available to preserve goal runway."
        })

    if balance > 0 and remaining / balance < 0.30:
        recommendations.append({
            "id": "rec_one_time_boost",
            "type": "one_time_boost",
            "text": f"A one-time contribution of ₹{remaining:,.2f} from your current wallet balance would fully close the remaining goal gap."
        })

    plan_text = (
        f"Aim to save ₹{monthly_needed:,.2f} per month for the next {deadline_months} months, while channeling discretionary spend savings into this goal."
        if monthly_needed > 0 else f"No additional monthly savings are required for {goal_name}."
    )

    return recommendations, plan_text


@router.get("", response_model=List[dict])
def get_user_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetches all active and archived personal savings vault and goals for authenticated profile.
    """
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).order_by(FinancialGoal.created_at.desc()).all()
    
    mapped_goals = []
    for g in goals:
        recommendations, plan_text = build_goal_recommendations(
            user,
            txs,
            g.name,
            float(g.target_amount),
            float(g.saved_amount),
            float(g.monthly_savings_needed),
            g.deadline_months
        )
        if g.savings_plan:
            recommendations.insert(0, {
                "id": "rec_plan_summary",
                "type": "plan_summary",
                "text": g.savings_plan
            })

        mapped_goals.append({
            "id": g.id,
            "user_id": g.user_id,
            "name": g.name,
            "targetAmount": float(g.target_amount),
            "savedAmount": float(g.saved_amount),
            "target_amount": float(g.target_amount),
            "saved_amount": float(g.saved_amount),
            "progressPercent": int(min(100, (float(g.saved_amount) / float(g.target_amount) * 100))) if float(g.target_amount) > 0 else 0,
            "deadlineMonths": g.deadline_months,
            "deadline_months": g.deadline_months,
            "monthlySavingsNeeded": float(g.monthly_savings_needed),
            "monthly_savings_needed": float(g.monthly_savings_needed),
            "category": g.category,
            "probability": float(g.probability),
            "savingsPlan": plan_text,
            "savings_plan": plan_text,
            "recommendations": recommendations,
            "created_at": g.created_at,
            "updated_at": g.updated_at
        })
    return mapped_goals


@router.post("", response_model=dict)
def create_new_goal(goal_in: FinancialGoalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Provisions a new savings goal container. Dynamically calculates likelihood of goal success
    and generates tailored recommendations based on actual user transactions ledger.
    """
    goal_name = goal_in.name or "Savings Vault"
    target = float(goal_in.target_amount)
    saved = float(goal_in.saved_amount or 0)
    term = int(goal_in.deadline_months)
    category = goal_in.category or "Asset Locker"
    
    installment = round((target - saved) / term, 2)
    if installment < 0:
         installment = 0.0

    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    recommendations, plan_text = build_goal_recommendations(user, txs, goal_name, target, saved, installment, term)

    income = float(user.income)
    total_spent = sum(float(t.amount) for t in txs)
    current_savings = max(0.0, income - total_spent)
    debt_ratio = (total_spent / income * 100) if income > 0 else 0.0

    if installment <= 0:
        probability = 100.0
    else:
        savings_coverage = current_savings / installment if installment > 0 else 0
        probability = min(99.0, max(15.0, savings_coverage * 85.0))

    goal_id = f"goal_{datetime.utcnow().timestamp()}"
    new_goal = FinancialGoal(
        id=goal_id,
        user_id=user.id,
        name=goal_name,
        target_amount=Decimal(str(target)),
        saved_amount=Decimal(str(saved)),
        deadline_months=term,
        monthly_savings_needed=Decimal(str(installment)),
        category=category,
        probability=Decimal(str(probability)),
        savings_plan=plan_text
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return {
        "id": new_goal.id,
        "user_id": new_goal.user_id,
        "name": new_goal.name,
        "targetAmount": float(new_goal.target_amount),
        "savedAmount": float(new_goal.saved_amount),
        "target_amount": float(new_goal.target_amount),
        "saved_amount": float(new_goal.saved_amount),
        "deadlineMonths": new_goal.deadline_months,
        "deadline_months": new_goal.deadline_months,
        "monthlySavingsNeeded": float(new_goal.monthly_savings_needed),
        "monthly_savings_needed": float(new_goal.monthly_savings_needed),
        "category": new_goal.category,
        "probability": float(new_goal.probability),
        "savingsPlan": new_goal.savings_plan,
        "savings_plan": new_goal.savings_plan,
        "recommendations": recommendations,
        "created_at": new_goal.created_at,
        "updated_at": new_goal.updated_at
    }


@router.post("/{goal_id}/deposit", response_model=dict)
def deposit_to_goal(goal_id: str, deposit_in: GoalDeposit, source: str = "wallet", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Executes a deposit transfer into a specific savings goal from a selected source.
    Deducts from wallet balance if applicable.
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Requested savings goal could not be found.")

    deposit_amt = Decimal(str(deposit_in.amount))
    source_val = deposit_in.source or source

    if deposit_amt <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deposit amount must be greater than zero."
        )

    if source_val == "wallet":
        user_balance = Decimal(str(user.balance))
        if user_balance < deposit_amt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds inside main wallet. Balance: ₹{user_balance}"
            )
        user.balance = user_balance - deposit_amt

    goal.saved_amount = Decimal(str(goal.saved_amount)) + deposit_amt
    db.commit()
    db.refresh(goal)
    db.refresh(user)
    
    return {
        "success": True,
        "newBalance": float(user.balance),
        "balance": float(user.balance),
        "goal": {
            "id": goal.id,
            "name": goal.name,
            "targetAmount": float(goal.target_amount),
            "savedAmount": float(goal.saved_amount),
            "category": goal.category
        }
    }


@router.delete("/{goal_id}")
def delete_goal(goal_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Archives / deletes active savings goal.
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")
    
    db.delete(goal)
    db.commit()
    return {"success": True}


@router.get("/insights")
async def get_goals_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns dynamic savings insights compiled directly from user goals progress in the database.
    Optionally accelerated via Gemini.
    """
    from backend.services.gemini import get_gemini_client, query_gemini_structured
    from google.genai import types
    
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).all()
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    
    income = float(user.income)
    total_spent = sum(float(t.amount) for t in txs)
    current_savings = max(0.0, income - total_spent)

    total_target = sum(float(g.target_amount) for g in goals)
    total_saved = sum(float(g.saved_amount) for g in goals)
    avg_probability = sum(float(g.probability) for g in goals) / len(goals) if goals else 0.0
    pct = int((total_saved / total_target * 100)) if total_target > 0 else 0

    client = get_gemini_client()
    if client:
        prompt = f"""
        You are Nexus, a financial AI assistant. The user has an income of {income}, total monthly spend of {total_spent}, and current savings of {current_savings}.
        They have {len(goals)} active savings goals. Total target amount: {total_target}. Total saved amount: {total_saved}.
        Average success probability: {avg_probability:.1f}%.
        
        Generate exactly 2 short, punchy strategic insights or compound savings vectors to accelerate their financial goals.
        Use **bolding** for numbers or key actions. Ensure they are directly actionable.
        """
        schema = {
            "type": "object",
            "properties": {
                "insights": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of 2 short strategic insights."
                }
            },
            "required": ["insights"]
        }
        fallback_json = '{"insights": []}'
        res_text = await query_gemini_structured(prompt, response_schema=schema, fallback_response=fallback_json)
        import json
        try:
            data = json.loads(res_text)
            if data.get("insights"):
                return {"insights": data["insights"]}
        except Exception as e:
            pass
            
    insights = []

    if goals:
        insights.append(f"You have saved **₹{total_saved:,.2f}** ({pct}% of combined goals).")
        insights.append(f"Average success probability across active goals: **{avg_probability:.1f}%**")
    else:
        insights.append("No active savings goals detected. Create a goal to get personalized recommendations.")

    if current_savings > 0:
        insights.append(f"Projected quarterly savings (based on current income/expense): **₹{current_savings * 3:,.2f}**.")
    else:
        insights.append("High expenditures detected relative to income. Consider pruning discretionary subscriptions.")

    return {"insights": insights}


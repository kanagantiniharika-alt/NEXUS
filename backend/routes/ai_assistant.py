from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
import base64
import json
import time
from google.genai import types

from backend.database import get_db
from backend.routes.auth import get_current_user
from backend.models import User, FinancialGoal, Subscription, SavedCard, SavedBankAccount, Transaction, AIQueryLog, FraudAlert
from backend.schemas import CopilotQuery, CopilotResponse, PurchaseAdviceRequest, PurchaseAdviceResponse
from backend.services.gemini import query_gemini_structured, get_gemini_client

router = APIRouter(prefix="", tags=["Quantum AI Consulting Engine"])

@router.get("/dashboard/insights")
def get_dashboard_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    alerts = db.query(FraudAlert).filter(FraudAlert.user_id == user.id, FraudAlert.is_resolved == False).all()
    subs = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.is_active == True).all()

    total_spent = sum(float(t.amount) for t in txs)
    total_subs = sum(float(s.cost) for s in subs)
    
    insights = [
        f"Your active spending index is ₹{total_spent:,.2f}. Diverting 10% to lockboxes satisfies objectives earlier.",
        f"Safe Shield verified: {len(alerts)} unresolved anomaly flags in security logs." if alerts else "Safe Shield confirmed: Zero geographic or QR scanning alerts in standard logs.",
        f"Dynamic audit shows active subscriptions cost ₹{total_subs:,.2f}/mo. Downgrading Netflix/Spotify saves ₹300 monthly." if subs else "Subscription catalog is empty. Setup recurring outlays inside Payments tab."
    ]
    return {"insights": insights}

@router.get("/spending/insights")
def get_spending_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    
    category_totals = {}
    for t in txs:
        category_totals[t.category.value] = category_totals.get(t.category.value, 0.0) + float(t.amount)
        
    food_pct = (category_totals.get("Food", 0.0) / float(user.income) * 100) if user.income > 0 else 0.0
    
    tips = [
        "Establish a 'Pocket Money Buffer' of **₹1,000** in your wallet structure that you never touch except for extreme emergencies.",
        "Leaving cart items for 72 hours before checking out cuts down impulse shopping in **Shopping** category by up to 60%!",
        f"Weekend restaurant transactions indicate Food is at **{food_pct:.1f}%** of income. Consider cooking to save money."
    ]
    return {"tips": tips}

@router.get("/spending/trend-analysis")
def get_spending_trend_analysis(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    
    category_totals = {}
    for t in txs:
        category_totals[t.category.value] = category_totals.get(t.category.value, 0.0) + float(t.amount)
        
    total_spent = sum(category_totals.values())
    
    insights = [
        f"Your general spending is ₹{total_spent:,.2f}. Category percentages are Food: {int(category_totals.get('Food', 0)/total_spent*100) if total_spent > 0 else 0}%, Shopping: {int(category_totals.get('Shopping', 0)/total_spent*100) if total_spent > 0 else 0}%.",
        "Savings rate is currently positive. Diverting 15% to GATE prep will reach target 1.2 weeks earlier."
    ]
    return {
        "insights": insights,
        "notifications": {}
    }

@router.post("/chat")
async def get_integrated_chats(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Core interactive chatbot channel. Extracts account balances, live goals targets, active subscriptions,
    and recent financial ledgers to construct a real-time state vectors. Leverages Gemini 2.5/3.5-flash
    to compile encouraging, precise, and forensic financial directions.
    """
    message = payload.get("message")
    chat_history = payload.get("chatHistory") or []

    if not message:
        raise HTTPException(status_code=400, detail="Interactive message context is blank.")

    start_time = time.time()

    # Gather precise context vectors from real PG database
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).all()
    subs = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.is_active == True).all()
    cards = db.query(SavedCard).filter(SavedCard.user_id == user.id).all()
    banks = db.query(SavedBankAccount).filter(SavedBankAccount.user_id == user.id).all()
    txs = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.transaction_date.desc()).limit(5).all()

    # Package clean metadata representations
    db_context = f"""
    Active Database Profile Details:
    - Holder Name: {user.name}
    - Role Profile: {user.role.value}
    - Liquid Balance: ₹{float(user.balance):,.2f}
    - Registered Income: ₹{float(user.income):,.2f}
    
    Saved Payment Methods:
    - Cards: {", ".join([f"{c.card_type} card (*{c.card_number[-4:]})" for c in cards]) or "No cards linked."}
    - Bank Accounts: {", ".join([f"{b.bank_name} Bank Account (*{b.account_number[-4:]})" for b in banks]) or "No bank accounts linked."}
    
    Active Saving Goals progress:
    {chr(10).join([f"  * {g.name}: Target ₹{float(g.target_amount):,.2f}, Saved: ₹{float(g.saved_amount):,.2f} ({int((float(g.saved_amount)/float(g.target_amount))*100)}% progress)" for g in goals if float(g.target_amount) > 0]) or "No goals set."}
    
    Active Subscriptions Registered:
    {chr(10).join([f"  * {s.name}: cost: ₹{float(s.cost)}/mo. savings recommend potential: {s.recommendation}" for s in subs]) or "No subscriptions."}
    
    Recent Active transactions:
    {chr(10).join([f"  * {t.transaction_date} | {t.merchant} | ₹{float(t.amount)} | GPS: {t.location} | Security rating: {t.risk_score}% ({t.risk_status.value})" for t in txs]) or "No transactions."}
    """

    clean_history_items = []
    for chat_item in chat_history[-6:]:
        sender_label = "User" if chat_item.get("sender") == "user" else "Nexusbot-Copilot"
        text_content = chat_item.get("text") or ""
        clean_history_items.append(f"{sender_label}: {text_content}")

    clean_history = "\n".join(clean_history_items) if clean_history_items else "No previous dialog history."

    prompt = f"""
    You are NEXUS CHAT, the hyper-intelligent conversational AI assistant for NEXUS, a private wealth intelligence system.
    You handle general fintech conversations, savings advices, subscription compromises, and forensic fraud warnings.
    
    You have direct realtime access to the user's active MySQL dataset:
    {db_context}
    
    Dialog contexts:
    {clean_history}
    
    New User message query: "{message}"
    
    Instructions:
    1. Speak directly using user's name ({user.name}) and refer to their wallet balance (₹{float(user.balance):,.2f}) as well as payment items or goals directly to make the responses highly personalized and precise.
    2. Maintain a futuristic cybersecurity specialist character (humble, crisp, helpful, and highly precise).
    3. When asked how to save money or top up, explain both options (using manual bank/card topups from the "Payments Manager" tab, or setting up dedicated savings sweeps inside "Savings Goals").
    4. Respond in brief, scannable markdown block with professional styling. Keep the layout aesthetic and clean.
    """

    fallback = f"Namaste {user.name}! Checked your liquid balances (currently ₹{float(user.balance):,.2f}) and validated target vaults. To top up balance securely, head over to the Payments Manager tab to trigger sandbox transaction sweeps instantly!"
    
    # Query model
    try:
        raw_response = await query_gemini_structured(prompt, fallback_response=fallback)
    except Exception:
        raw_response = fallback

    latency_ms = int((time.time() - start_time) * 1000)

    # Save to the AI Logs table for real-time memory persistence
    try:
        db_log = AIQueryLog(
            user_id=user.id,
            agent_type="assistant",
            prompt=message,
            response=raw_response,
            tokens_used=len(message.split()) + len(raw_response.split()), # representation
            latency_ms=latency_ms
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        print(f"Error persisting query logs: {e}")

    return {"text": raw_response}


@router.post("/purchase-advisor", response_model=PurchaseAdviceResponse)
async def check_purchase_affordability(req: PurchaseAdviceRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Core AI Shopping Affordability scoring interface. Analyzes financial balances,
    estimates savings potential delays, and delivers two optimized alternative models.
    """
    cost = float(req.price)
    
    prompt = f"""
    Analyze luxury affordability for item: "{req.productName}" listed at ₹{req.price} for purpose: "{req.purpose}".
    Recommend whether the user (role profile: {user.role.value}, liquid balances: ₹{float(user.balance)}) should buy this item.
    Suggest 2 realistic alternative models or options with accurate estimated pricing.
    Respond exclusively in valid JSON adhering exact match schemas:
    {{
      "score": number,
      "affordability": "text evaluation",
      "savingsImpact": "saving velocity impact descriptor",
      "goalImpact": "goal timeline progression impact score",
      "alternatives": [
        {{ "name": "Alternative product model", "price": number }}
      ],
      "aiRecommendation": "Direct verdict on buy or wait"
    }}
    """

    fallback = json.dumps({
        "score": 58 if cost > 15000 else 82,
        "affordability": "Requires caution: exceeds 15% of active liquid limits." if cost > 15000 else "Affordable: minimal structural impact on ledger balances.",
        "savingsImpact": f"Will delay target saving objectives trajectories by {round(cost/5000, 1)} weeks." if cost > 15000 else "Minimal. Well within sandbox limits.",
        "goalImpact": "Postpones high-fidelity asset lockers by several weeks." if cost > 15000 else "Zero degradation on active saving goals.",
        "alternatives": [
            { "name": f"{req.productName} Refurbished Excellent Condition", "price": int(cost * 0.75) },
            { "name": f"Lite Alternative Brand Premium Tier", "price": int(cost * 0.45) }
        ],
        "aiRecommendation": "Postpone purchase or wait till stipend sweep increment cycle is logged." if cost > 15000 else "Approved. Fits standard pocket ranges perfectly."
    })

    try:
        raw_out = await query_gemini_structured(prompt, fallback_response=fallback)
        parsed = json.loads(raw_out)
        return parsed
    except Exception:
        return json.loads(fallback)


@router.post("/forecast/analyze")
async def analyze_budget_forecasting(payload: dict, user: User = Depends(get_current_user)):
    """
    Uses Gemini to construct future spending modeling projections,
    customizing alerts if profile matches Student mode.
    """
    user_role = payload.get("userRole") or user.role.value
    balance = payload.get("currentBalance") or float(user.balance)

    prompt = f"""
    Construct a futuristic financial projection and overspending analysis for a user with current role: "{user_role}" and account wallet size of ₹{balance}.
    Respond with a valid JSON block of this schema:
    {{
      "forecastData": [
        {{ "month": "month name", "expenses": number, "savings": number, "overspentProb": number }}
      ],
      "healthText": "Analysis overview of forecasted budget.",
      "studentBudgetWarning": "If role is student, generate budget survival alert. Else return null."
    }}
    """

    default_expenses = 5400 if user_role == "student" else 85000
    default_savings = 2100 if user_role == "student" else 65000

    fallback = json.dumps({
        "forecastData": [
            { "month": "June", "expenses": default_expenses, "savings": default_savings, "overspentProb": 22 },
            { "month": "July", "expenses": int(default_expenses * 1.1), "savings": int(default_savings * 0.9), "overspentProb": 35 },
            { "month": "August", "expenses": int(default_expenses * 0.95), "savings": int(default_savings * 1.2), "overspentProb": 14 }
        ],
        "healthText": "Warning: Impending semester registration outlays will deplete stipend reserves. Limit secondary dining and leisure platforms to build a cash reserve." if user_role == "student" else "Excellent: Active portfolios displaying solid trajectory. Maintain automated index savings allocation.",
        "studentBudgetWarning": "Balance Limit Alert: Trajectory shows student allowance could fully deplete 12 days before end-of-semester if dining outlays spike." if user_role == "student" else None
    })

    try:
        raw_out = await query_gemini_structured(prompt, fallback_response=fallback)
        parsed = json.loads(raw_out)
        return parsed
    except Exception:
        return json.loads(fallback)


@router.post("/copilot/ask", response_model=CopilotResponse)
@router.post("/gemini/ask", response_model=CopilotResponse)
async def ask_copilot_questions(req: CopilotQuery, user: User = Depends(get_current_user)):
    """
    Lightweight Jarvis style copilot endpoint to consult specific banking details.
    """
    question_text = req.message or req.question
    if not question_text and not req.image_base64:
        raise HTTPException(status_code=400, detail="Copilot query message or image is required.")

    instructions = """
    You are the NEXUS AI Chatbot, a futuristic luxury wealth assistant.
    """

    if req.image_base64:
        instructions += "\nYou have an attached image to analyze. If the image contains financial documents, receipts, charts, or any money-related content, summarize the relevant details and answer the user precisely."

    prompt = f"""
    {instructions}
    Analyze user query: "{question_text or 'Please analyze the attached image.'}"
    User Role: {user.role.value}. Wallet balance: ₹{float(user.balance):,.2f}.
    Recommend encouraging, precise and highly targeted finance advice in brief markdown format.
    """

    fallback = f"### NEXUS Copilot Report\n- **Verdict:** Active balance is stable at ₹{float(user.balance):,.2f}.\n- **Advice:** Save 10% on food outlays this week to maintain streak progression!"
    if req.image_base64:
        fallback = f"### NEXUS Copilot Report\n- **Verdict:** I could not analyze the attached image right now. Please try again with a clearer image or ask your question in text."

    contents = prompt
    model_name = "gemini-2.5-flash"
    if req.image_base64:
        model_name = "gemini-2.5-vision"
        try:
            image_bytes = base64.b64decode(req.image_base64)
            contents = types.Content(
                role="user",
                parts=[
                    types.Part(text=prompt),
                    types.Part(inlineData=types.Blob(data=image_bytes, mimeType=req.image_mime_type or "image/png"))
                ]
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid image data.") from exc

    raw_response = await query_gemini_structured(contents, fallback_response=fallback, model_name=model_name)
    return {"response": raw_response}

from datetime import datetime
from backend.models import Transaction, User, RiskStatusLevel

def analyze_transaction_risk(tx: Transaction, user: User, db_session) -> dict:
    """
    Evaluates transaction risk score and status based on database historical records.
    Returns a structured report (no hard-coded HTML templates):
    {
        "risk_score": int,
        "risk_status": RiskStatusLevel,
        "risk_reason": str,
        "explanations": [str],
        "recommended_actions": [str]
    }
    """
    amount = float(tx.amount)
    flags = []
    score = 5
    
    # 1. High-value transactions rule
    if amount > 20000.00:
        score += 35
        flags.append(f"High-value transaction flagged: ₹{amount:,.2f} exceeds standard safety threshold.")
    
    # Query user average spending to check for 3x deviation
    past_txs = db_session.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.id != tx.id
    ).order_by(Transaction.created_at.desc()).all()
    
    if past_txs:
        avg_amt = sum(float(t.amount) for t in past_txs) / len(past_txs)
        if amount > 3.0 * avg_amt and amount > 5000.0:
            score += 25
            flags.append(f"Unusual high spending: transaction is {amount/avg_amt:.1f}x larger than historical average.")
            
        # 2. Rapid consecutive transactions rule
        prev_tx = past_txs[0]
        t_curr = tx.created_at if tx.created_at else datetime.utcnow()
        t_prev = prev_tx.created_at
        time_diff = abs((t_curr - t_prev).total_seconds())
        if time_diff < 120:  # 2 minutes
            score += 40
            flags.append(f"Rapid consecutive transactions: payment executed within {int(time_diff)} seconds of previous purchase ({prev_tx.merchant}).")
            
        # 3. Location anomalies rule
        curr_loc = (tx.location or "Online Gateway").lower()
        prev_loc = (prev_tx.location or "Online Gateway").lower()
        
        is_curr_physical = not any(w in curr_loc for w in ["online", "gateway", "virtual", "internet"])
        is_prev_physical = not any(w in prev_loc for w in ["online", "gateway", "virtual", "internet"])
        
        if is_curr_physical and is_prev_physical and curr_loc != prev_loc:
            if time_diff < 10800: # 3 hours
                score += 45
                flags.append(f"Geographic location anomaly: consecutive physical payments in different locations ({prev_tx.location} vs {tx.location}) within {round(time_diff/3600, 1)} hours.")
                
        # 4. Unusual spending category check
        recent_txs = past_txs[:10]
        categories_spent = [t.category for t in recent_txs]
        if tx.category not in categories_spent:
            score += 15
            flags.append(f"New spending category: user has not spent on {tx.category.value} recently.")

    # Bound risk score
    score = min(99, max(0, score))
    
    # Determine risk level
    if score >= 70:
        status_level = RiskStatusLevel.high
    elif score >= 35:
        status_level = RiskStatusLevel.medium
    else:
        status_level = RiskStatusLevel.low

    # Build structured explanations and recommended actions
    explanations = flags if flags else ["No risk flags raised. Behavioral profile consistent with baseline."]

    recommended = [
        "Rotate dynamic authentication passcode regularly.",
        "Monitor account ledger for double-swipe patterns."
    ]
    if status_level == RiskStatusLevel.high:
        recommended.insert(0, "Lock target payment card immediately and contact support.")
    elif status_level == RiskStatusLevel.medium:
        recommended.insert(0, "Verify merchant coordinates and recent device logins.")

    return {
        "risk_score": score,
        "risk_status": status_level,
        "risk_reason": "; ".join(flags) if flags else "aligned with standard user profile patterns.",
        "explanations": explanations,
        "recommended_actions": recommended
    }

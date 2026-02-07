"""
Bonus Abuse Detection Algorithm

Detects referrals designed to harvest bonuses without genuine trading:
- Minimal trading after deposit
- Immediate withdrawal after bonus credit
- Low client-to-active-trader conversion
- Suspicious deposit/withdrawal patterns
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict


def parse_timestamp(ts: str) -> datetime:
    """Parse ISO timestamp string to datetime"""
    if isinstance(ts, datetime):
        return ts
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except:
        return datetime.now()


def calculate_client_quality_score(client: Dict) -> Dict[str, Any]:
    """
    Calculate quality score for a referred client.
    Lower score = more suspicious of bonus abuse.
    """
    score = 100  # Start with perfect score
    flags = []
    
    trades = client.get("trades", [])
    deposit = client.get("initial_deposit", 0)
    balance = client.get("current_balance", 0)
    is_active = client.get("is_active", True)
    
    # Check 1: Number of trades (fewer = more suspicious)
    num_trades = len(trades)
    if num_trades == 0:
        score -= 40
        flags.append("no_trading_activity")
    elif num_trades < 5:
        score -= 25
        flags.append("minimal_trading")
    elif num_trades < 10:
        score -= 10
        flags.append("low_trading_volume")
    
    # Check 2: Trading volume relative to deposit
    if trades and deposit > 0:
        total_volume = sum(t.get("volume", 0) for t in trades)
        volume_ratio = total_volume / deposit
        
        if volume_ratio < 0.1:
            score -= 20
            flags.append("very_low_volume_ratio")
        elif volume_ratio < 0.5:
            score -= 10
            flags.append("low_volume_ratio")
    
    # Check 3: Quick withdrawal pattern
    withdrawal_date = client.get("withdrawal_date")
    signup_date = client.get("signup_date")
    
    if withdrawal_date and signup_date:
        try:
            signup = parse_timestamp(signup_date)
            withdrawal = parse_timestamp(withdrawal_date)
            days_to_withdrawal = (withdrawal - signup).days
            
            if days_to_withdrawal <= 3:
                score -= 30
                flags.append("immediate_withdrawal")
            elif days_to_withdrawal <= 7:
                score -= 15
                flags.append("quick_withdrawal")
        except:
            pass
    
    # Check 4: Balance vs deposit (significant withdrawal = suspicious)
    if deposit > 0:
        balance_ratio = balance / deposit
        if balance_ratio < 0.2:
            score -= 15
            flags.append("most_funds_withdrawn")
        elif balance_ratio < 0.5:
            score -= 5
            flags.append("significant_withdrawal")
    
    # Check 5: Account activity status
    if not is_active:
        score -= 10
        flags.append("inactive_account")
    
    # Check 6: Small initial deposit (typical of bonus hunting)
    if deposit < 200:
        score -= 10
        flags.append("minimal_deposit")
    
    return {
        "client_id": client["client_id"],
        "quality_score": max(0, score),
        "is_suspicious": score < 50,
        "flags": flags,
        "metrics": {
            "num_trades": num_trades,
            "initial_deposit": deposit,
            "current_balance": balance,
            "is_active": is_active
        }
    }


def detect_bonus_abuse_pattern(clients: List[Dict], 
                                threshold_score: int = 50) -> List[Dict]:
    """
    Detect clients exhibiting bonus abuse patterns.
    """
    suspicious_clients = []
    
    for client in clients:
        quality = calculate_client_quality_score(client)
        
        if quality["is_suspicious"]:
            suspicious_clients.append({
                "client_id": client["client_id"],
                "client_name": client.get("name", "Unknown"),
                "partner_id": client["referred_by"],
                "quality_score": quality["quality_score"],
                "flags": quality["flags"],
                "metrics": quality["metrics"],
                "evidence_summary": generate_abuse_evidence(client, quality)
            })
    
    # Sort by score (lowest = most suspicious)
    suspicious_clients.sort(key=lambda x: x["quality_score"])
    
    return suspicious_clients


def generate_abuse_evidence(client: Dict, quality: Dict) -> str:
    """Generate evidence summary for bonus abuse"""
    
    parts = []
    flags = quality["flags"]
    
    if "no_trading_activity" in flags:
        parts.append("No trading activity recorded after signup.")
    elif "minimal_trading" in flags:
        parts.append(f"Only {quality['metrics']['num_trades']} trades executed.")
    
    if "immediate_withdrawal" in flags:
        parts.append("Funds withdrawn within 3 days of deposit.")
    elif "quick_withdrawal" in flags:
        parts.append("Funds withdrawn within first week.")
    
    if "most_funds_withdrawn" in flags:
        pct = (1 - quality['metrics']['current_balance'] / max(1, quality['metrics']['initial_deposit'])) * 100
        parts.append(f"{pct:.0f}% of deposited funds withdrawn.")
    
    if "minimal_deposit" in flags:
        parts.append(f"Small initial deposit: ${quality['metrics']['initial_deposit']:.2f}.")
    
    if "inactive_account" in flags:
        parts.append("Account is now inactive.")
    
    return " ".join(parts) if parts else "Multiple low-quality indicators detected."


def analyze_partner_referral_quality(partners: List[Dict], 
                                      clients: List[Dict]) -> List[Dict]:
    """
    Analyze referral quality for each partner.
    Partners with many low-quality referrals are suspicious.
    """
    partner_analysis = []
    
    # Group clients by partner
    partner_clients = defaultdict(list)
    for client in clients:
        partner_clients[client["referred_by"]].append(client)
    
    for partner in partners:
        partner_id = partner["partner_id"]
        referred_clients = partner_clients.get(partner_id, [])
        
        if not referred_clients:
            continue
        
        # Calculate quality scores for all referred clients
        quality_scores = [calculate_client_quality_score(c) for c in referred_clients]
        
        suspicious_count = sum(1 for q in quality_scores if q["is_suspicious"])
        avg_quality = sum(q["quality_score"] for q in quality_scores) / len(quality_scores)
        
        # Calculate conversion rate (active traders)
        active_count = sum(1 for c in referred_clients if c.get("is_active", False))
        conversion_rate = active_count / len(referred_clients)
        
        # Partner is suspicious if many low-quality referrals
        is_suspicious = (
            suspicious_count / len(referred_clients) > 0.3 or
            avg_quality < 50 or
            conversion_rate < 0.25
        )
        
        if is_suspicious:
            partner_analysis.append({
                "partner_id": partner_id,
                "partner_name": partner.get("name", "Unknown"),
                "partner_type": partner.get("type", "unknown"),
                "total_referrals": len(referred_clients),
                "suspicious_referrals": suspicious_count,
                "suspicious_ratio": round(suspicious_count / len(referred_clients), 3),
                "avg_client_quality": round(avg_quality, 1),
                "conversion_rate": round(conversion_rate, 3),
                "estimated_fraud_value": round(
                    sum(c.get("initial_deposit", 0) for c in referred_clients 
                        if calculate_client_quality_score(c)["is_suspicious"]) * 0.15, 2
                ),
                "evidence_summary": generate_partner_evidence(
                    partner, referred_clients, suspicious_count, conversion_rate
                )
            })
    
    # Sort by suspicious ratio
    partner_analysis.sort(key=lambda x: x["suspicious_ratio"], reverse=True)
    
    return partner_analysis


def generate_partner_evidence(partner: Dict, clients: List[Dict],
                               suspicious_count: int, conversion_rate: float) -> str:
    """Generate evidence summary for partner-level bonus abuse"""
    
    parts = []
    total = len(clients)
    
    parts.append(f"Partner has {total} referrals with {suspicious_count} flagged as suspicious.")
    parts.append(f"Client conversion rate: {conversion_rate:.0%} (below 25% is concerning).")
    
    # Check for patterns
    inactive_count = sum(1 for c in clients if not c.get("is_active", True))
    if inactive_count / total > 0.5:
        parts.append(f"{inactive_count}/{total} referred clients are now inactive.")
    
    # Check deposit patterns
    deposits = [c.get("initial_deposit", 0) for c in clients]
    avg_deposit = sum(deposits) / len(deposits) if deposits else 0
    if avg_deposit < 300:
        parts.append(f"Average deposit ${avg_deposit:.2f} is suspiciously low.")
    
    return " ".join(parts)


def detect_bonus_abuse(clients: List[Dict], partners: List[Dict]) -> Dict[str, Any]:
    """
    Main entry point for bonus abuse detection.
    """
    suspicious_clients = detect_bonus_abuse_pattern(clients)
    partner_analysis = analyze_partner_referral_quality(partners, clients)
    
    return {
        "total_suspicious_clients": len(suspicious_clients),
        "total_suspicious_partners": len(partner_analysis),
        "total_estimated_fraud_value": sum(p["estimated_fraud_value"] for p in partner_analysis),
        "suspicious_clients": suspicious_clients[:50],  # Top 50
        "suspicious_partners": partner_analysis
    }

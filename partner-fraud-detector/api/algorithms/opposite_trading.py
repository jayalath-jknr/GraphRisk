"""
Opposite Trading Detection Algorithm

Detects coordinated opposite position-taking between accounts:
- Same/similar instruments
- Correlated timing (within minutes)
- Profit splitting patterns
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import math


def parse_timestamp(ts: str) -> datetime:
    """Parse ISO timestamp string to datetime"""
    if isinstance(ts, datetime):
        return ts
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))


def calculate_timing_correlation(trades1: List[Dict], trades2: List[Dict], 
                                  time_window_minutes: int = 10) -> float:
    """
    Calculate timing correlation between two sets of trades.
    Returns a score from 0 to 1, where 1 means perfect correlation.
    """
    if not trades1 or not trades2:
        return 0.0
    
    correlations = 0
    total_comparisons = 0
    
    for t1 in trades1:
        t1_time = parse_timestamp(t1["timestamp"])
        t1_instrument = t1["instrument"]
        
        for t2 in trades2:
            t2_time = parse_timestamp(t2["timestamp"])
            t2_instrument = t2["instrument"]
            
            # Check if same instrument
            if t1_instrument == t2_instrument:
                total_comparisons += 1
                
                # Check timing proximity
                time_diff = abs((t1_time - t2_time).total_seconds()) / 60
                if time_diff <= time_window_minutes:
                    # Higher correlation for closer timing
                    correlations += 1 - (time_diff / time_window_minutes)
    
    if total_comparisons == 0:
        return 0.0
    
    return min(1.0, correlations / total_comparisons)


def detect_opposite_directions(trades1: List[Dict], trades2: List[Dict],
                               time_window_minutes: int = 10) -> List[Dict]:
    """
    Find trade pairs where directions are opposite within time window.
    """
    opposite_pairs = []
    
    for t1 in trades1:
        t1_time = parse_timestamp(t1["timestamp"])
        t1_instrument = t1["instrument"]
        t1_direction = t1["direction"]
        
        for t2 in trades2:
            t2_time = parse_timestamp(t2["timestamp"])
            t2_instrument = t2["instrument"]
            t2_direction = t2["direction"]
            
            # Check conditions for opposite trading
            if (t1_instrument == t2_instrument and
                t1_direction != t2_direction and
                abs((t1_time - t2_time).total_seconds()) / 60 <= time_window_minutes):
                
                opposite_pairs.append({
                    "trade1": t1,
                    "trade2": t2,
                    "instrument": t1_instrument,
                    "time_diff_seconds": abs((t1_time - t2_time).total_seconds()),
                    "volume_similarity": min(t1["volume"], t2["volume"]) / max(t1["volume"], t2["volume"])
                })
    
    return opposite_pairs


def calculate_pnl_correlation(trades1: List[Dict], trades2: List[Dict]) -> float:
    """
    Calculate profit/loss correlation. 
    Opposite trading schemes often show inverse P&L patterns.
    Returns -1 to 1, where -1 indicates perfect inverse correlation.
    """
    if len(trades1) < 2 or len(trades2) < 2:
        return 0.0
    
    pnl1 = [t.get("profit_loss", 0) for t in trades1]
    pnl2 = [t.get("profit_loss", 0) for t in trades2]
    
    # Align by length
    min_len = min(len(pnl1), len(pnl2))
    pnl1 = pnl1[:min_len]
    pnl2 = pnl2[:min_len]
    
    # Calculate Pearson correlation
    mean1 = sum(pnl1) / len(pnl1)
    mean2 = sum(pnl2) / len(pnl2)
    
    numerator = sum((a - mean1) * (b - mean2) for a, b in zip(pnl1, pnl2))
    
    var1 = sum((a - mean1) ** 2 for a in pnl1)
    var2 = sum((b - mean2) ** 2 for b in pnl2)
    
    denominator = math.sqrt(var1 * var2)
    
    if denominator == 0:
        return 0.0
    
    return numerator / denominator


def detect_opposite_trading(clients: List[Dict], threshold: float = 0.6) -> List[Dict]:
    """
    Main detection function for opposite trading schemes.
    
    Args:
        clients: List of client records with trades
        threshold: Minimum correlation score to flag as suspicious
        
    Returns:
        List of detected opposite trading pairs with evidence
    """
    detected_schemes = []
    
    # Group clients by partner for cross-partner analysis
    partner_clients = defaultdict(list)
    for client in clients:
        partner_clients[client["referred_by"]].append(client)
    
    partners = list(partner_clients.keys())
    
    # Compare clients across different partners
    for i, partner1 in enumerate(partners):
        for partner2 in partners[i+1:]:
            clients1 = partner_clients[partner1]
            clients2 = partner_clients[partner2]
            
            for client1 in clients1:
                trades1 = client1.get("trades", [])
                if not trades1:
                    continue
                    
                for client2 in clients2:
                    trades2 = client2.get("trades", [])
                    if not trades2:
                        continue
                    
                    # Calculate various correlation metrics
                    timing_corr = calculate_timing_correlation(trades1, trades2)
                    opposite_pairs = detect_opposite_directions(trades1, trades2)
                    pnl_corr = calculate_pnl_correlation(trades1, trades2)
                    
                    # Calculate overall suspicion score
                    opposite_ratio = len(opposite_pairs) / min(len(trades1), len(trades2)) if min(len(trades1), len(trades2)) > 0 else 0
                    
                    # Combine metrics (opposite trading has inverse P&L correlation)
                    suspicion_score = (
                        timing_corr * 0.3 +
                        opposite_ratio * 0.4 +
                        max(0, -pnl_corr) * 0.3  # Inverse correlation is suspicious
                    )
                    
                    if suspicion_score >= threshold:
                        # Calculate estimated fraud value
                        total_volume = sum(t["volume"] for t in trades1) + sum(t["volume"] for t in trades2)
                        avg_profit = abs(sum(t.get("profit_loss", 0) for t in trades1)) + abs(sum(t.get("profit_loss", 0) for t in trades2))
                        
                        detected_schemes.append({
                            "scheme_type": "opposite_trading",
                            "partner_a": partner1,
                            "partner_b": partner2,
                            "client_a": client1["client_id"],
                            "client_b": client2["client_id"],
                            "client_a_name": client1.get("name", "Unknown"),
                            "client_b_name": client2.get("name", "Unknown"),
                            "confidence_score": round(suspicion_score, 3),
                            "timing_correlation": round(timing_corr, 3),
                            "opposite_trade_ratio": round(opposite_ratio, 3),
                            "pnl_correlation": round(pnl_corr, 3),
                            "num_opposite_pairs": len(opposite_pairs),
                            "total_trades_analyzed": len(trades1) + len(trades2),
                            "estimated_fraud_value": round(avg_profit * 0.5, 2),
                            "evidence_summary": generate_evidence_summary(
                                client1, client2, opposite_pairs, timing_corr, pnl_corr
                            ),
                            "top_opposite_pairs": opposite_pairs[:5]  # Top 5 examples
                        })
    
    # Sort by confidence score
    detected_schemes.sort(key=lambda x: x["confidence_score"], reverse=True)
    
    return detected_schemes


def generate_evidence_summary(client1: Dict, client2: Dict, 
                              opposite_pairs: List[Dict],
                              timing_corr: float, pnl_corr: float) -> str:
    """Generate human-readable evidence summary"""
    
    summary_parts = []
    
    summary_parts.append(
        f"Detected {len(opposite_pairs)} coordinated opposite trades between "
        f"{client1.get('name', client1['client_id'])} and {client2.get('name', client2['client_id'])}."
    )
    
    if timing_corr > 0.7:
        summary_parts.append(f"Trading timing is highly correlated ({timing_corr:.0%}).")
    elif timing_corr > 0.4:
        summary_parts.append(f"Trading timing shows moderate correlation ({timing_corr:.0%}).")
    
    if pnl_corr < -0.5:
        summary_parts.append(f"Profit/loss shows inverse correlation ({pnl_corr:.2f}), consistent with profit-splitting scheme.")
    
    if opposite_pairs:
        instruments = set(p["instrument"] for p in opposite_pairs)
        summary_parts.append(f"Opposite trades concentrated in: {', '.join(instruments)}.")
    
    return " ".join(summary_parts)


def analyze_partner_network(partners: List[Dict], clients: List[Dict]) -> Dict[str, Any]:
    """
    Analyze the partner network for opposite trading patterns.
    Returns aggregated results.
    """
    schemes = detect_opposite_trading(clients)
    
    # Aggregate by partner
    partner_involvement = defaultdict(lambda: {"schemes": 0, "total_value": 0, "clients": set()})
    
    for scheme in schemes:
        partner_involvement[scheme["partner_a"]]["schemes"] += 1
        partner_involvement[scheme["partner_a"]]["total_value"] += scheme["estimated_fraud_value"]
        partner_involvement[scheme["partner_a"]]["clients"].add(scheme["client_a"])
        
        partner_involvement[scheme["partner_b"]]["schemes"] += 1
        partner_involvement[scheme["partner_b"]]["total_value"] += scheme["estimated_fraud_value"]
        partner_involvement[scheme["partner_b"]]["clients"].add(scheme["client_b"])
    
    # Convert sets to counts
    for partner_id in partner_involvement:
        partner_involvement[partner_id]["clients"] = len(partner_involvement[partner_id]["clients"])
    
    return {
        "total_schemes_detected": len(schemes),
        "total_estimated_fraud_value": sum(s["estimated_fraud_value"] for s in schemes),
        "partner_involvement": dict(partner_involvement),
        "schemes": schemes
    }

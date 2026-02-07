"""
Mirror Trading Detection Algorithm

Detects accounts that trade in lockstep:
- Same instruments
- Same direction  
- Similar volumes
- Coordinated entry/exit timing
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict
import math


def parse_timestamp(ts: str) -> datetime:
    """Parse ISO timestamp string to datetime"""
    if isinstance(ts, datetime):
        return ts
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))


def calculate_trade_similarity(trade1: Dict, trade2: Dict, time_window_minutes: int = 5) -> float:
    """
    Calculate similarity score between two trades.
    Returns 0-1 where 1 is perfect match.
    """
    score = 0.0
    max_score = 4.0  # 4 components
    
    # Same instrument
    if trade1["instrument"] == trade2["instrument"]:
        score += 1.0
    
    # Same direction
    if trade1["direction"] == trade2["direction"]:
        score += 1.0
    
    # Similar volume (within 20%)
    vol_ratio = min(trade1["volume"], trade2["volume"]) / max(trade1["volume"], trade2["volume"])
    if vol_ratio >= 0.8:
        score += 1.0
    elif vol_ratio >= 0.5:
        score += 0.5
    
    # Close timing
    t1 = parse_timestamp(trade1["timestamp"])
    t2 = parse_timestamp(trade2["timestamp"])
    time_diff_minutes = abs((t1 - t2).total_seconds()) / 60
    
    if time_diff_minutes <= time_window_minutes:
        score += 1.0 - (time_diff_minutes / time_window_minutes)
    
    return score / max_score


def find_matching_trades(trades1: List[Dict], trades2: List[Dict], 
                         time_window_minutes: int = 5,
                         min_similarity: float = 0.7) -> List[Dict]:
    """
    Find matching trade pairs between two sets of trades.
    """
    matches = []
    used_indices = set()
    
    for t1 in trades1:
        best_match = None
        best_similarity = min_similarity
        best_idx = -1
        
        for idx, t2 in enumerate(trades2):
            if idx in used_indices:
                continue
                
            similarity = calculate_trade_similarity(t1, t2, time_window_minutes)
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = t2
                best_idx = idx
        
        if best_match and best_idx >= 0:
            used_indices.add(best_idx)
            matches.append({
                "trade1": t1,
                "trade2": best_match,
                "similarity": best_similarity,
                "instrument": t1["instrument"],
                "direction": t1["direction"]
            })
    
    return matches


def detect_mirror_group(clients: List[Dict], min_group_size: int = 3,
                        min_mirror_ratio: float = 0.5) -> List[Dict]:
    """
    Detect groups of clients with mirror trading patterns.
    """
    groups = []
    
    # Get all clients with sufficient trades
    active_clients = [c for c in clients if len(c.get("trades", [])) >= 10]
    
    # Group clients by partner first (mirror trading often within same partner)
    partner_clients = defaultdict(list)
    for client in active_clients:
        partner_clients[client["referred_by"]].append(client)
    
    for partner_id, partner_client_list in partner_clients.items():
        if len(partner_client_list) < min_group_size:
            continue
        
        # Build similarity matrix
        n = len(partner_client_list)
        similarity_matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(i + 1, n):
                trades1 = partner_client_list[i].get("trades", [])
                trades2 = partner_client_list[j].get("trades", [])
                
                matches = find_matching_trades(trades1, trades2)
                match_ratio = len(matches) / min(len(trades1), len(trades2)) if min(len(trades1), len(trades2)) > 0 else 0
                
                similarity_matrix[i][j] = match_ratio
                similarity_matrix[j][i] = match_ratio
        
        # Find clusters of similar trading behavior
        # Simple greedy clustering
        clustered = set()
        
        for i in range(n):
            if i in clustered:
                continue
            
            cluster = [i]
            for j in range(i + 1, n):
                if j in clustered:
                    continue
                
                # Check if j is similar to all members of cluster
                is_similar = all(
                    similarity_matrix[j][k] >= min_mirror_ratio
                    for k in cluster
                )
                
                if is_similar:
                    cluster.append(j)
            
            if len(cluster) >= min_group_size:
                cluster_clients = [partner_client_list[idx] for idx in cluster]
                
                # Calculate group metrics
                all_trades = []
                for c in cluster_clients:
                    all_trades.extend(c.get("trades", []))
                
                # Find common instruments
                instrument_counts = defaultdict(int)
                for t in all_trades:
                    instrument_counts[t["instrument"]] += 1
                
                top_instruments = sorted(instrument_counts.items(), key=lambda x: -x[1])[:3]
                
                groups.append({
                    "scheme_type": "mirror_trading",
                    "partner_id": partner_id,
                    "group_size": len(cluster),
                    "client_ids": [c["client_id"] for c in cluster_clients],
                    "client_names": [c.get("name", "Unknown") for c in cluster_clients],
                    "confidence_score": round(sum(
                        similarity_matrix[cluster[i]][cluster[j]]
                        for i in range(len(cluster))
                        for j in range(i + 1, len(cluster))
                    ) / max(1, len(cluster) * (len(cluster) - 1) / 2), 3),
                    "total_trades": len(all_trades),
                    "common_instruments": [inst for inst, _ in top_instruments],
                    "estimated_fraud_value": round(
                        sum(abs(t.get("profit_loss", 0)) for t in all_trades) * 0.3, 2
                    ),
                    "evidence_summary": generate_mirror_evidence(
                        cluster_clients, top_instruments
                    )
                })
                
                clustered.update(cluster)
    
    # Sort by confidence
    groups.sort(key=lambda x: x["confidence_score"], reverse=True)
    
    return groups


def generate_mirror_evidence(clients: List[Dict], top_instruments: List[tuple]) -> str:
    """Generate human-readable evidence summary for mirror trading"""
    
    summary_parts = []
    
    summary_parts.append(
        f"Detected {len(clients)} accounts trading in lockstep under same partner."
    )
    
    total_trades = sum(len(c.get("trades", [])) for c in clients)
    summary_parts.append(f"Combined {total_trades} trades analyzed.")
    
    if top_instruments:
        instruments = [inst for inst, _ in top_instruments]
        summary_parts.append(f"Concentrated trading in: {', '.join(instruments)}.")
    
    # Check signup date clustering
    signup_dates = []
    for c in clients:
        try:
            signup_dates.append(parse_timestamp(c.get("signup_date", "")))
        except:
            pass
    
    if len(signup_dates) >= 2:
        date_range = (max(signup_dates) - min(signup_dates)).days
        if date_range <= 7:
            summary_parts.append(f"All accounts signed up within {date_range} days.")
    
    return " ".join(summary_parts)


def detect_mirror_trading(clients: List[Dict]) -> Dict[str, Any]:
    """
    Main entry point for mirror trading detection.
    """
    groups = detect_mirror_group(clients)
    
    return {
        "total_groups_detected": len(groups),
        "total_clients_involved": sum(g["group_size"] for g in groups),
        "total_estimated_fraud_value": sum(g["estimated_fraud_value"] for g in groups),
        "groups": groups
    }

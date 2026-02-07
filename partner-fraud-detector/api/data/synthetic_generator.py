"""
Synthetic Data Generator for Partner/Affiliate Fraud Detection Demo

Generates realistic partner networks with embedded fraud patterns:
- Opposite trading schemes
- Mirror trading patterns
- Bonus abuse
- Commission fraud
"""

import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import hashlib

# Seed for reproducibility
random.seed(42)

# Configuration
NUM_MASTER_PARTNERS = 8
NUM_SUB_AFFILIATES_RANGE = (3, 12)
NUM_CLIENTS_PER_AFFILIATE_RANGE = (5, 25)
NUM_TRADES_PER_CLIENT_RANGE = (10, 100)
FRAUD_RATE = 0.15  # 15% of partners involved in fraud

INSTRUMENTS = [
    "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY", "XAU/USD", "BTC/USD"
]

COUNTRIES = [
    "United States", "United Kingdom", "Germany", "France", "Japan",
    "Australia", "Canada", "Singapore", "UAE", "Brazil"
]


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID"""
    return f"{prefix}{hashlib.md5(str(random.random()).encode()).hexdigest()[:8]}"


def generate_partner_name() -> str:
    """Generate a realistic partner/company name"""
    prefixes = ["Alpha", "Beta", "Delta", "Prime", "Global", "Elite", "Pro", "Master", "Capital", "Trading"]
    suffixes = ["Partners", "Media", "Marketing", "Affiliates", "Group", "Solutions", "Network", "Digital", "Ventures"]
    return f"{random.choice(prefixes)} {random.choice(suffixes)}"


def generate_client_name() -> str:
    """Generate a realistic client name"""
    first_names = ["James", "Maria", "Chen", "Ahmed", "Elena", "Raj", "Sofia", "Yuki", "Michael", "Anna",
                   "David", "Lisa", "Kevin", "Emma", "Alex", "Sarah", "John", "Nina", "Carlos", "Fatima"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Chen", "Wang", "Kim", "Patel", "Singh", "Tanaka", "Mueller", "Costa", "Ali", "Petrov"]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def generate_timestamp(base_date: datetime, offset_days: int = 0, offset_hours: int = 0) -> str:
    """Generate ISO timestamp"""
    dt = base_date + timedelta(days=offset_days, hours=offset_hours, minutes=random.randint(0, 59))
    return dt.isoformat()


def generate_trade(client_id: str, timestamp: datetime, instrument: str = None, 
                   direction: str = None, volume: float = None) -> Dict[str, Any]:
    """Generate a single trade"""
    return {
        "trade_id": generate_id("TRD"),
        "client_id": client_id,
        "timestamp": timestamp.isoformat(),
        "instrument": instrument or random.choice(INSTRUMENTS),
        "direction": direction or random.choice(["BUY", "SELL"]),
        "volume": volume or round(random.uniform(0.1, 10.0), 2),
        "price": round(random.uniform(1.0, 50000.0), 4),
        "profit_loss": round(random.uniform(-500, 500), 2)
    }


def generate_legitimate_client(client_id: str, partner_id: str, signup_date: datetime) -> Dict[str, Any]:
    """Generate a legitimate client with normal trading behavior"""
    deposit = round(random.uniform(500, 50000), 2)
    trades = []
    current_date = signup_date + timedelta(days=random.randint(1, 7))
    
    num_trades = random.randint(*NUM_TRADES_PER_CLIENT_RANGE)
    for _ in range(num_trades):
        current_date += timedelta(hours=random.randint(1, 72))
        trades.append(generate_trade(client_id, current_date))
    
    total_pnl = sum(t["profit_loss"] for t in trades)
    
    return {
        "client_id": client_id,
        "name": generate_client_name(),
        "referred_by": partner_id,
        "signup_date": signup_date.isoformat(),
        "country": random.choice(COUNTRIES),
        "initial_deposit": deposit,
        "current_balance": round(deposit + total_pnl, 2),
        "total_trades": len(trades),
        "is_active": random.random() > 0.2,
        "trades": trades,
        "fraud_flags": []
    }


def generate_bonus_abuse_client(client_id: str, partner_id: str, signup_date: datetime) -> Dict[str, Any]:
    """Generate a client exhibiting bonus abuse patterns"""
    deposit = round(random.uniform(100, 500), 2)  # Minimal deposit
    
    # 1-2 minimal trades
    trades = []
    trade_date = signup_date + timedelta(days=1)
    for _ in range(random.randint(1, 2)):
        trades.append(generate_trade(client_id, trade_date, volume=round(random.uniform(0.01, 0.1), 2)))
        trade_date += timedelta(minutes=random.randint(5, 30))
    
    # Immediate withdrawal indicator
    return {
        "client_id": client_id,
        "name": generate_client_name(),
        "referred_by": partner_id,
        "signup_date": signup_date.isoformat(),
        "country": random.choice(COUNTRIES),
        "initial_deposit": deposit,
        "current_balance": round(deposit * 0.1, 2),  # Most withdrawn
        "total_trades": len(trades),
        "is_active": False,
        "trades": trades,
        "withdrawal_date": (signup_date + timedelta(days=random.randint(2, 5))).isoformat(),
        "fraud_flags": ["bonus_abuse_pattern", "minimal_trading", "quick_withdrawal"]
    }


def generate_opposite_trading_pair(
    client1_id: str, client2_id: str, 
    partner1_id: str, partner2_id: str,
    signup_date: datetime
) -> tuple:
    """Generate two clients engaged in opposite trading scheme"""
    deposit = round(random.uniform(5000, 20000), 2)
    trades1, trades2 = [], []
    
    current_date = signup_date + timedelta(days=random.randint(1, 3))
    num_coordinated_trades = random.randint(15, 40)
    
    for _ in range(num_coordinated_trades):
        current_date += timedelta(hours=random.randint(4, 24))
        instrument = random.choice(INSTRUMENTS)
        volume = round(random.uniform(1.0, 5.0), 2)
        
        # Coordinated timing (within 5 minutes)
        time_offset = timedelta(minutes=random.randint(0, 5))
        
        # Opposite directions
        base_direction = random.choice(["BUY", "SELL"])
        opposite_direction = "SELL" if base_direction == "BUY" else "BUY"
        
        profit = round(random.uniform(100, 500), 2)
        
        trades1.append({
            **generate_trade(client1_id, current_date, instrument, base_direction, volume),
            "profit_loss": profit if random.random() > 0.5 else -profit
        })
        trades2.append({
            **generate_trade(client2_id, current_date + time_offset, instrument, opposite_direction, volume),
            "profit_loss": -trades1[-1]["profit_loss"]  # Opposite P&L
        })
    
    client1 = {
        "client_id": client1_id,
        "name": generate_client_name(),
        "referred_by": partner1_id,
        "signup_date": signup_date.isoformat(),
        "country": random.choice(COUNTRIES),
        "initial_deposit": deposit,
        "current_balance": round(deposit + sum(t["profit_loss"] for t in trades1), 2),
        "total_trades": len(trades1),
        "is_active": True,
        "trades": trades1,
        "fraud_flags": ["opposite_trading_scheme", f"coordinated_with:{client2_id}"]
    }
    
    client2 = {
        "client_id": client2_id,
        "name": generate_client_name(),
        "referred_by": partner2_id,
        "signup_date": (signup_date + timedelta(days=random.randint(-3, 3))).isoformat(),
        "country": random.choice(COUNTRIES),
        "initial_deposit": deposit,
        "current_balance": round(deposit + sum(t["profit_loss"] for t in trades2), 2),
        "total_trades": len(trades2),
        "is_active": True,
        "trades": trades2,
        "fraud_flags": ["opposite_trading_scheme", f"coordinated_with:{client1_id}"]
    }
    
    return client1, client2


def generate_mirror_trading_group(
    client_ids: List[str], partner_id: str, signup_date: datetime
) -> List[Dict[str, Any]]:
    """Generate a group of clients with mirror trading patterns"""
    clients = []
    deposit = round(random.uniform(2000, 10000), 2)
    
    # Generate shared trading pattern
    num_trades = random.randint(20, 50)
    base_trades = []
    current_date = signup_date + timedelta(days=random.randint(1, 5))
    
    for _ in range(num_trades):
        current_date += timedelta(hours=random.randint(2, 12))
        instrument = random.choice(INSTRUMENTS[:5])  # Limited instrument set
        volume = round(random.uniform(0.5, 2.0), 2)
        direction = random.choice(["BUY", "SELL"])
        base_trades.append((current_date, instrument, volume, direction))
    
    for client_id in client_ids:
        trades = []
        for base_date, instrument, volume, direction in base_trades:
            # Slight timing variation (1-3 minutes)
            trade_time = base_date + timedelta(minutes=random.randint(0, 3))
            # Slight volume variation
            trade_volume = round(volume * random.uniform(0.9, 1.1), 2)
            trades.append(generate_trade(client_id, trade_time, instrument, direction, trade_volume))
        
        clients.append({
            "client_id": client_id,
            "name": generate_client_name(),
            "referred_by": partner_id,
            "signup_date": signup_date.isoformat(),
            "country": random.choice(COUNTRIES),
            "initial_deposit": deposit,
            "current_balance": round(deposit + sum(t["profit_loss"] for t in trades), 2),
            "total_trades": len(trades),
            "is_active": True,
            "trades": trades,
            "fraud_flags": ["mirror_trading_pattern", f"group_size:{len(client_ids)}"]
        })
    
    return clients


def generate_partner_hierarchy() -> Dict[str, Any]:
    """Generate the complete partner/affiliate network with fraud patterns"""
    
    base_date = datetime(2025, 6, 1)
    
    partners = []
    clients = []
    fraud_rings = []
    
    # Track partners for fraud schemes
    all_partner_ids = []
    fraud_partner_ids = []
    
    # Generate master partners and sub-affiliates
    for i in range(NUM_MASTER_PARTNERS):
        master_id = generate_id("MP")
        master_signup = base_date + timedelta(days=random.randint(0, 30))
        
        is_fraud_master = random.random() < FRAUD_RATE
        
        master = {
            "partner_id": master_id,
            "name": generate_partner_name(),
            "type": "master",
            "parent_id": None,
            "signup_date": master_signup.isoformat(),
            "country": random.choice(COUNTRIES),
            "commission_rate": round(random.uniform(0.3, 0.5), 2),
            "total_referrals": 0,
            "total_commission": 0,
            "is_suspicious": is_fraud_master,
            "sub_affiliates": []
        }
        
        all_partner_ids.append(master_id)
        if is_fraud_master:
            fraud_partner_ids.append(master_id)
        
        # Generate sub-affiliates
        num_subs = random.randint(*NUM_SUB_AFFILIATES_RANGE)
        for _ in range(num_subs):
            sub_id = generate_id("SA")
            sub_signup = master_signup + timedelta(days=random.randint(7, 60))
            
            is_fraud_sub = is_fraud_master or random.random() < FRAUD_RATE * 0.5
            
            sub = {
                "partner_id": sub_id,
                "name": generate_partner_name(),
                "type": "sub_affiliate",
                "parent_id": master_id,
                "signup_date": sub_signup.isoformat(),
                "country": random.choice(COUNTRIES),
                "commission_rate": round(random.uniform(0.15, 0.35), 2),
                "total_referrals": 0,
                "total_commission": 0,
                "is_suspicious": is_fraud_sub
            }
            
            master["sub_affiliates"].append(sub_id)
            all_partner_ids.append(sub_id)
            if is_fraud_sub:
                fraud_partner_ids.append(sub_id)
            
            # Generate clients for sub-affiliate
            num_clients = random.randint(*NUM_CLIENTS_PER_AFFILIATE_RANGE)
            sub_clients = []
            
            for _ in range(num_clients):
                client_id = generate_id("CL")
                client_signup = sub_signup + timedelta(days=random.randint(1, 90))
                
                # Decide client type based on partner fraud status
                if is_fraud_sub and random.random() < 0.4:
                    # Bonus abuse client
                    client = generate_bonus_abuse_client(client_id, sub_id, client_signup)
                else:
                    # Legitimate client
                    client = generate_legitimate_client(client_id, sub_id, client_signup)
                
                sub_clients.append(client)
                sub["total_referrals"] += 1
                sub["total_commission"] += round(random.uniform(50, 500), 2)
            
            clients.extend(sub_clients)
            partners.append(sub)
        
        partners.append(master)
    
    # Generate opposite trading fraud rings
    num_fraud_rings = max(2, len(fraud_partner_ids) // 2)
    for ring_idx in range(num_fraud_rings):
        if len(fraud_partner_ids) < 2:
            break
            
        # Select two partners for the ring
        partner1 = random.choice(fraud_partner_ids)
        partner2 = random.choice([p for p in fraud_partner_ids if p != partner1])
        
        ring_clients = []
        num_pairs = random.randint(3, 8)
        
        for _ in range(num_pairs):
            client1_id = generate_id("CL")
            client2_id = generate_id("CL")
            signup_date = base_date + timedelta(days=random.randint(30, 120))
            
            c1, c2 = generate_opposite_trading_pair(
                client1_id, client2_id, partner1, partner2, signup_date
            )
            ring_clients.extend([c1, c2])
            clients.extend([c1, c2])
        
        fraud_rings.append({
            "ring_id": generate_id("RING"),
            "type": "opposite_trading",
            "partners_involved": [partner1, partner2],
            "clients_involved": [c["client_id"] for c in ring_clients],
            "estimated_fraud_value": round(random.uniform(10000, 100000), 2),
            "detection_confidence": round(random.uniform(0.75, 0.98), 2),
            "first_detected": (base_date + timedelta(days=random.randint(60, 150))).isoformat()
        })
    
    # Generate mirror trading groups
    for partner_id in random.sample(fraud_partner_ids, min(3, len(fraud_partner_ids))):
        group_size = random.randint(3, 6)
        client_ids = [generate_id("CL") for _ in range(group_size)]
        signup_date = base_date + timedelta(days=random.randint(40, 100))
        
        mirror_clients = generate_mirror_trading_group(client_ids, partner_id, signup_date)
        clients.extend(mirror_clients)
        
        fraud_rings.append({
            "ring_id": generate_id("RING"),
            "type": "mirror_trading",
            "partners_involved": [partner_id],
            "clients_involved": client_ids,
            "estimated_fraud_value": round(random.uniform(5000, 50000), 2),
            "detection_confidence": round(random.uniform(0.70, 0.95), 2),
            "first_detected": (base_date + timedelta(days=random.randint(80, 160))).isoformat()
        })
    
    # Calculate partner statistics
    for partner in partners:
        partner_clients = [c for c in clients if c["referred_by"] == partner["partner_id"]]
        partner["total_referrals"] = len(partner_clients)
        partner["active_clients"] = sum(1 for c in partner_clients if c.get("is_active", False))
        partner["total_volume"] = round(sum(
            sum(t.get("volume", 0) for t in c.get("trades", []))
            for c in partner_clients
        ), 2)
        partner["fraud_flags"] = []
        
        # Add fraud flags
        suspicious_clients = [c for c in partner_clients if c.get("fraud_flags")]
        if suspicious_clients:
            partner["fraud_flags"].append(f"suspicious_clients:{len(suspicious_clients)}")
        
        # Check for low conversion rate (bonus abuse indicator)
        if partner["total_referrals"] > 10:
            conversion_rate = partner["active_clients"] / partner["total_referrals"]
            if conversion_rate < 0.3:
                partner["fraud_flags"].append(f"low_conversion_rate:{round(conversion_rate, 2)}")
    
    return {
        "generated_at": datetime.now().isoformat(),
        "date_range": {
            "start": base_date.isoformat(),
            "end": (base_date + timedelta(days=180)).isoformat()
        },
        "statistics": {
            "total_partners": len(partners),
            "total_clients": len(clients),
            "total_trades": sum(len(c.get("trades", [])) for c in clients),
            "fraud_rings_detected": len(fraud_rings),
            "suspicious_partners": len([p for p in partners if p.get("is_suspicious")])
        },
        "partners": partners,
        "clients": clients,
        "fraud_rings": fraud_rings,
        "edges": generate_network_edges(partners, clients)
    }


def generate_network_edges(partners: List[Dict], clients: List[Dict]) -> List[Dict]:
    """Generate edges for network visualization"""
    edges = []
    
    # Partner hierarchy edges
    for partner in partners:
        if partner.get("parent_id"):
            edges.append({
                "source": partner["parent_id"],
                "target": partner["partner_id"],
                "type": "hierarchy",
                "weight": 1
            })
    
    # Partner to client edges
    for client in clients:
        edges.append({
            "source": client["referred_by"],
            "target": client["client_id"],
            "type": "referral",
            "weight": 0.5
        })
    
    # Fraud connection edges (for visualization)
    for client in clients:
        for flag in client.get("fraud_flags", []):
            if flag.startswith("coordinated_with:"):
                coordinated_id = flag.split(":")[1]
                edges.append({
                    "source": client["client_id"],
                    "target": coordinated_id,
                    "type": "fraud_connection",
                    "weight": 2
                })
    
    return edges


def main():
    """Generate and save synthetic dataset"""
    print("Generating synthetic partner fraud dataset...")
    data = generate_partner_hierarchy()
    
    print(f"Generated:")
    print(f"  - {data['statistics']['total_partners']} partners")
    print(f"  - {data['statistics']['total_clients']} clients")
    print(f"  - {data['statistics']['total_trades']} trades")
    print(f"  - {data['statistics']['fraud_rings_detected']} fraud rings")
    
    # Save to file
    output_path = "demo_dataset.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nDataset saved to {output_path}")
    return data


if __name__ == "__main__":
    main()

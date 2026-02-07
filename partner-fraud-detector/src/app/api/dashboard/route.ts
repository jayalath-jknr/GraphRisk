import { NextResponse } from 'next/server';
import demoData from './demo_dataset.json';

// Types
interface Partner {
  partner_id: string;
  name: string;
  type: string;
  parent_id: string | null;
  signup_date: string;
  country: string;
  commission_rate: number;
  total_referrals: number;
  total_commission: number;
  is_suspicious: boolean;
  sub_affiliates?: string[];
  fraud_flags?: string[];
  active_clients?: number;
  total_volume?: number;
}

interface Client {
  client_id: string;
  name: string;
  referred_by: string;
  signup_date: string;
  country: string;
  initial_deposit: number;
  current_balance: number;
  total_trades: number;
  is_active: boolean;
  trades: Trade[];
  fraud_flags: string[];
  withdrawal_date?: string;
}

interface Trade {
  trade_id: string;
  client_id: string;
  timestamp: string;
  instrument: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  price: number;
  profit_loss: number;
}

interface FraudRing {
  ring_id: string;
  type: string;
  partners_involved: string[];
  clients_involved: string[];
  estimated_fraud_value: number;
  detection_confidence: number;
  first_detected: string;
}

interface DemoData {
  generated_at: string;
  date_range: { start: string; end: string };
  statistics: {
    total_partners: number;
    total_clients: number;
    total_trades: number;
    fraud_rings_detected: number;
    suspicious_partners: number;
  };
  partners: Partner[];
  clients: Client[];
  fraud_rings: FraudRing[];
  edges: Array<{ source: string; target: string; type: string; weight: number }>;
}

// Type assertion for imported JSON
const data = demoData as DemoData;

export async function GET() {
  try {
    // Calculate dashboard statistics
    const stats = {
      totalPartners: data.partners.length,
      totalClients: data.clients.length,
      totalTrades: data.statistics.total_trades,
      activeAlerts: data.fraud_rings.length,
      suspiciousPartners: data.partners.filter(p => p.is_suspicious).length,
      estimatedFraudValue: data.fraud_rings.reduce((sum, r) => sum + r.estimated_fraud_value, 0),
      highRiskPartners: data.partners.filter(p => p.fraud_flags && p.fraud_flags.length > 1).length,
    };

    // Get recent alerts (fraud rings)
    const recentAlerts = data.fraud_rings.map(ring => ({
      id: ring.ring_id,
      type: ring.type,
      severity: ring.detection_confidence > 0.85 ? 'critical' : ring.detection_confidence > 0.7 ? 'high' : 'medium',
      partnersInvolved: ring.partners_involved.length,
      clientsInvolved: ring.clients_involved.length,
      estimatedValue: ring.estimated_fraud_value,
      confidence: ring.detection_confidence,
      detectedAt: ring.first_detected,
      partnerNames: ring.partners_involved.map(pid => 
        data.partners.find(p => p.partner_id === pid)?.name || pid
      ),
    })).sort((a, b) => b.confidence - a.confidence);

    // Get partner risk scores
    const partnerRisks = data.partners
      .filter(p => p.is_suspicious || (p.fraud_flags && p.fraud_flags.length > 0))
      .map(partner => {
        const involvedRings = data.fraud_rings.filter(r => 
          r.partners_involved.includes(partner.partner_id)
        );
        return {
          partnerId: partner.partner_id,
          partnerName: partner.name,
          partnerType: partner.type,
          riskScore: Math.min(100, 
            (partner.fraud_flags?.length || 0) * 15 + 
            involvedRings.length * 25 +
            (partner.is_suspicious ? 20 : 0)
          ),
          flagCount: partner.fraud_flags?.length || 0,
          totalReferrals: partner.total_referrals,
          fraudRingsInvolved: involvedRings.length,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        recentAlerts: recentAlerts.slice(0, 10),
        topRiskPartners: partnerRisks,
        dateRange: data.date_range,
        generatedAt: data.generated_at,
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

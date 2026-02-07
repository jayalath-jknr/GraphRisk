import { NextResponse } from 'next/server';
import demoData from '../dashboard/demo_dataset.json';

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
}

interface Partner {
    partner_id: string;
    name: string;
    type: string;
    parent_id: string | null;
    signup_date: string;
    country: string;
    is_suspicious: boolean;
    total_referrals: number;
    fraud_flags?: string[];
    sub_affiliates?: string[];
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
    partners: Partner[];
    clients: Client[];
    fraud_rings: FraudRing[];
}

const data = demoData as DemoData;

// Calculate timing correlation between trades
function calculateTimingCorrelation(trades1: Trade[], trades2: Trade[]): number {
    if (!trades1.length || !trades2.length) return 0;

    let correlations = 0;
    let comparisons = 0;

    for (const t1 of trades1) {
        for (const t2 of trades2) {
            if (t1.instrument === t2.instrument) {
                comparisons++;
                const time1 = new Date(t1.timestamp).getTime();
                const time2 = new Date(t2.timestamp).getTime();
                const diffMinutes = Math.abs(time1 - time2) / (1000 * 60);

                if (diffMinutes <= 10) {
                    correlations += 1 - (diffMinutes / 10);
                }
            }
        }
    }

    return comparisons > 0 ? Math.min(1, correlations / comparisons) : 0;
}

// Detect opposite trading patterns
function detectOppositeTradingSchemes(): Array<{
    schemeId: string;
    type: 'opposite_trading';
    partnerA: { id: string; name: string };
    partnerB: { id: string; name: string };
    clientA: { id: string; name: string };
    clientB: { id: string; name: string };
    confidence: number;
    timingCorrelation: number;
    oppositePairs: number;
    estimatedValue: number;
    evidence: string;
}> {
    const schemes: ReturnType<typeof detectOppositeTradingSchemes> = [];

    // Group clients by partner
    const partnerClients: Record<string, Client[]> = {};
    for (const client of data.clients) {
        if (!partnerClients[client.referred_by]) {
            partnerClients[client.referred_by] = [];
        }
        partnerClients[client.referred_by].push(client);
    }

    const partnerIds = Object.keys(partnerClients);

    // Compare across partners
    for (let i = 0; i < partnerIds.length; i++) {
        for (let j = i + 1; j < partnerIds.length; j++) {
            const clients1 = partnerClients[partnerIds[i]];
            const clients2 = partnerClients[partnerIds[j]];

            for (const c1 of clients1) {
                if (!c1.trades?.length) continue;

                for (const c2 of clients2) {
                    if (!c2.trades?.length) continue;

                    // Check for opposite trading signals
                    const timing = calculateTimingCorrelation(c1.trades, c2.trades);

                    // Count opposite direction trades
                    let oppositePairs = 0;
                    for (const t1 of c1.trades) {
                        for (const t2 of c2.trades) {
                            if (t1.instrument === t2.instrument && t1.direction !== t2.direction) {
                                const timeDiff = Math.abs(
                                    new Date(t1.timestamp).getTime() - new Date(t2.timestamp).getTime()
                                ) / (1000 * 60);
                                if (timeDiff <= 10) oppositePairs++;
                            }
                        }
                    }

                    const oppositeRatio = oppositePairs / Math.min(c1.trades.length, c2.trades.length);
                    const confidence = (timing * 0.4 + oppositeRatio * 0.6);

                    if (confidence >= 0.5) {
                        const partner1 = data.partners.find(p => p.partner_id === partnerIds[i]);
                        const partner2 = data.partners.find(p => p.partner_id === partnerIds[j]);

                        schemes.push({
                            schemeId: `OPP-${c1.client_id.slice(-4)}-${c2.client_id.slice(-4)}`,
                            type: 'opposite_trading',
                            partnerA: { id: partnerIds[i], name: partner1?.name || 'Unknown' },
                            partnerB: { id: partnerIds[j], name: partner2?.name || 'Unknown' },
                            clientA: { id: c1.client_id, name: c1.name },
                            clientB: { id: c2.client_id, name: c2.name },
                            confidence: Math.round(confidence * 100) / 100,
                            timingCorrelation: Math.round(timing * 100) / 100,
                            oppositePairs,
                            estimatedValue: Math.round(
                                (Math.abs(c1.initial_deposit) + Math.abs(c2.initial_deposit)) * confidence * 0.3
                            ),
                            evidence: `${oppositePairs} opposite trades detected with ${Math.round(timing * 100)}% timing correlation`
                        });
                    }
                }
            }
        }
    }

    return schemes.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}

// Detect bonus abuse patterns
function detectBonusAbuse(): Array<{
    clientId: string;
    clientName: string;
    partnerId: string;
    partnerName: string;
    qualityScore: number;
    flags: string[];
    deposit: number;
    tradesCount: number;
    evidence: string;
}> {
    const suspicious: ReturnType<typeof detectBonusAbuse> = [];

    for (const client of data.clients) {
        const flags: string[] = [];
        let score = 100;

        // Check trade count
        if (!client.trades?.length) {
            score -= 40;
            flags.push('no_trades');
        } else if (client.trades.length < 5) {
            score -= 25;
            flags.push('minimal_trades');
        }

        // Check withdrawal pattern
        if (client.current_balance < client.initial_deposit * 0.2) {
            score -= 20;
            flags.push('major_withdrawal');
        }

        // Check deposit size
        if (client.initial_deposit < 200) {
            score -= 10;
            flags.push('small_deposit');
        }

        // Check activity
        if (!client.is_active) {
            score -= 15;
            flags.push('inactive');
        }

        if (score < 60 && flags.length >= 2) {
            const partner = data.partners.find(p => p.partner_id === client.referred_by);
            suspicious.push({
                clientId: client.client_id,
                clientName: client.name,
                partnerId: client.referred_by,
                partnerName: partner?.name || 'Unknown',
                qualityScore: Math.max(0, score),
                flags,
                deposit: client.initial_deposit,
                tradesCount: client.trades?.length || 0,
                evidence: `Quality score: ${score}. Flags: ${flags.join(', ')}`
            });
        }
    }

    return suspicious.sort((a, b) => a.qualityScore - b.qualityScore).slice(0, 30);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        let result: {
            oppositeTrading?: ReturnType<typeof detectOppositeTradingSchemes>;
            bonusAbuse?: ReturnType<typeof detectBonusAbuse>;
            fraudRings?: FraudRing[];
            summary?: {
                totalSchemes: number;
                totalEstimatedValue: number;
                highConfidenceAlerts: number;
            };
        } = {};

        if (type === 'all' || type === 'opposite') {
            result.oppositeTrading = detectOppositeTradingSchemes();
        }

        if (type === 'all' || type === 'bonus') {
            result.bonusAbuse = detectBonusAbuse();
        }

        if (type === 'all' || type === 'rings') {
            result.fraudRings = data.fraud_rings;
        }

        // Add summary
        const allSchemes = [
            ...(result.oppositeTrading || []),
            ...(result.bonusAbuse?.map(b => ({ confidence: (100 - b.qualityScore) / 100, estimatedValue: b.deposit * 0.1 })) || [])
        ];

        result.summary = {
            totalSchemes: allSchemes.length + (result.fraudRings?.length || 0),
            totalEstimatedValue: Math.round(
                allSchemes.reduce((sum, s) => sum + (s.estimatedValue || 0), 0) +
                (result.fraudRings?.reduce((sum, r) => sum + r.estimated_fraud_value, 0) || 0)
            ),
            highConfidenceAlerts: allSchemes.filter(s => s.confidence >= 0.75).length
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Detection API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to run fraud detection' },
            { status: 500 }
        );
    }
}

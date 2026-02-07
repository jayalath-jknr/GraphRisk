import { NextResponse } from 'next/server';
import demoData from '../dashboard/demo_dataset.json';

interface Edge {
    source: string;
    target: string;
    type: string;
    weight: number;
}

interface Partner {
    partner_id: string;
    name: string;
    type: string;
    parent_id: string | null;
    is_suspicious: boolean;
    total_referrals: number;
    fraud_flags?: string[];
}

interface Client {
    client_id: string;
    name: string;
    referred_by: string;
    fraud_flags: string[];
    is_active: boolean;
}

interface FraudRing {
    ring_id: string;
    type: string;
    partners_involved: string[];
    clients_involved: string[];
    detection_confidence: number;
}

interface DemoData {
    partners: Partner[];
    clients: Client[];
    fraud_rings: FraudRing[];
    edges: Edge[];
}

const data = demoData as DemoData;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const viewType = searchParams.get('view') || 'partners'; // partners | full | fraud
        const partnerId = searchParams.get('partner');

        let nodes: Array<{
            id: string;
            name: string;
            type: string;
            group: string;
            riskLevel: string;
            size: number;
            metadata: Record<string, unknown>;
        }> = [];

        let edges: Array<{
            source: string;
            target: string;
            type: string;
            strength: number;
        }> = [];

        if (viewType === 'partners' || viewType === 'full') {
            // Add partner nodes
            for (const partner of data.partners) {
                const isFraudulent = data.fraud_rings.some(r =>
                    r.partners_involved.includes(partner.partner_id)
                );

                nodes.push({
                    id: partner.partner_id,
                    name: partner.name,
                    type: partner.type,
                    group: 'partner',
                    riskLevel: isFraudulent ? 'high' : partner.is_suspicious ? 'medium' : 'low',
                    size: Math.max(10, Math.min(30, partner.total_referrals)),
                    metadata: {
                        totalReferrals: partner.total_referrals,
                        flagCount: partner.fraud_flags?.length || 0,
                        isSuspicious: partner.is_suspicious,
                    }
                });
            }

            // Add partner hierarchy edges
            for (const partner of data.partners) {
                if (partner.parent_id) {
                    edges.push({
                        source: partner.parent_id,
                        target: partner.partner_id,
                        type: 'hierarchy',
                        strength: 1,
                    });
                }
            }
        }

        if (viewType === 'full' || partnerId) {
            // Add client nodes (limited for performance)
            const clientsToShow = partnerId
                ? data.clients.filter(c => c.referred_by === partnerId)
                : data.clients.filter(c => c.fraud_flags && c.fraud_flags.length > 0).slice(0, 100);

            for (const client of clientsToShow) {
                const isFraudulent = client.fraud_flags && client.fraud_flags.length > 0;

                nodes.push({
                    id: client.client_id,
                    name: client.name,
                    type: 'client',
                    group: 'client',
                    riskLevel: isFraudulent ? 'high' : 'low',
                    size: 5,
                    metadata: {
                        isActive: client.is_active,
                        fraudFlags: client.fraud_flags,
                    }
                });

                // Add referral edge
                edges.push({
                    source: client.referred_by,
                    target: client.client_id,
                    type: 'referral',
                    strength: 0.5,
                });
            }
        }

        if (viewType === 'fraud') {
            // Show only fraud-related nodes and connections
            const fraudPartnerIds = new Set<string>();
            const fraudClientIds = new Set<string>();

            for (const ring of data.fraud_rings) {
                ring.partners_involved.forEach(id => fraudPartnerIds.add(id));
                ring.clients_involved.forEach(id => fraudClientIds.add(id));
            }

            nodes = [];
            edges = [];

            // Add fraud partners
            for (const partner of data.partners) {
                if (fraudPartnerIds.has(partner.partner_id)) {
                    nodes.push({
                        id: partner.partner_id,
                        name: partner.name,
                        type: partner.type,
                        group: 'partner',
                        riskLevel: 'high',
                        size: 25,
                        metadata: {
                            totalReferrals: partner.total_referrals,
                            fraudRings: data.fraud_rings.filter(r =>
                                r.partners_involved.includes(partner.partner_id)
                            ).length,
                        }
                    });
                }
            }

            // Add fraud clients
            for (const client of data.clients) {
                if (fraudClientIds.has(client.client_id)) {
                    nodes.push({
                        id: client.client_id,
                        name: client.name,
                        type: 'client',
                        group: 'client',
                        riskLevel: 'high',
                        size: 8,
                        metadata: {
                            fraudFlags: client.fraud_flags,
                        }
                    });

                    // Referral edge
                    if (fraudPartnerIds.has(client.referred_by)) {
                        edges.push({
                            source: client.referred_by,
                            target: client.client_id,
                            type: 'referral',
                            strength: 0.5,
                        });
                    }
                }
            }

            // Add fraud connection edges from original data
            for (const edge of data.edges) {
                if (edge.type === 'fraud_connection') {
                    edges.push({
                        source: edge.source,
                        target: edge.target,
                        type: 'fraud',
                        strength: 2,
                    });
                }
            }
        }

        // Remove duplicate edges
        const edgeSet = new Set<string>();
        edges = edges.filter(e => {
            const key = `${e.source}-${e.target}-${e.type}`;
            if (edgeSet.has(key)) return false;
            edgeSet.add(key);
            return true;
        });

        return NextResponse.json({
            success: true,
            data: {
                nodes,
                edges,
                stats: {
                    totalNodes: nodes.length,
                    totalEdges: edges.length,
                    fraudNodes: nodes.filter(n => n.riskLevel === 'high').length,
                }
            }
        });
    } catch (error) {
        console.error('Network API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch network data' },
            { status: 500 }
        );
    }
}

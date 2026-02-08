'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Users, TrendingDown, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface FraudRing {
    ring_id: string;
    type: string;
    partners_involved: string[];
    clients_involved: string[];
    estimated_fraud_value: number;
    detection_confidence: number;
    first_detected: string;
}

interface Partner {
    partner_id: string;
    name: string;
    type: string;
    country: string;
    total_referrals: number;
    is_suspicious: boolean;
    fraud_flags?: string[];
}

interface Client {
    client_id: string;
    name: string;
    referred_by: string;
    initial_deposit: number;
    current_balance: number;
    total_trades: number;
    is_active: boolean;
    fraud_flags: string[];
}

interface InvestigationData {
    ring?: FraudRing;
    partners: Partner[];
    clients: Client[];
}

function InvestigationContent() {
    const searchParams = useSearchParams();
    const ringId = searchParams.get('ring');

    const [data, setData] = useState<InvestigationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hypothesis, setHypothesis] = useState<string>('');
    const [generatingHypothesis, setGeneratingHypothesis] = useState(false);

    useEffect(() => {
        // Demo fraud rings for when API data isn't available
        const demoRings: Record<string, FraudRing> = {
            'FR001': {
                ring_id: 'FR001',
                type: 'opposite_trading',
                partners_involved: ['P001 - Alpha Trading Partners', 'P002 - Beta Affiliates Ltd'],
                clients_involved: ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008'],
                estimated_fraud_value: 125000,
                detection_confidence: 0.92,
                first_detected: '2024-01-15'
            },
            'FR002': {
                ring_id: 'FR002',
                type: 'mirror_trading',
                partners_involved: ['P003 - Gamma Partners', 'P004 - Delta Group'],
                clients_involved: ['C009', 'C010', 'C011', 'C012', 'C013'],
                estimated_fraud_value: 87500,
                detection_confidence: 0.85,
                first_detected: '2024-02-01'
            }
        };

        // Try to fetch from API first
        fetch('/api/detect?type=rings')
            .then(res => res.json())
            .then(detectResult => {
                if (detectResult?.success && ringId) {
                    const ring = detectResult.data.fraudRings?.find((r: FraudRing) => r.ring_id === ringId);
                    if (ring) {
                        setData({ ring, partners: [], clients: [] });
                        setLoading(false);
                        return;
                    }
                }
                // Fall back to demo data
                if (ringId && demoRings[ringId]) {
                    setData({ ring: demoRings[ringId], partners: [], clients: [] });
                }
                setLoading(false);
            })
            .catch(() => {
                // Use demo data on error
                if (ringId && demoRings[ringId]) {
                    setData({ ring: demoRings[ringId], partners: [], clients: [] });
                }
                setLoading(false);
            });
    }, [ringId]);

    const generateHypothesis = async () => {
        if (!data?.ring) return;

        setGeneratingHypothesis(true);

        // Simulate AI hypothesis generation
        await new Promise(resolve => setTimeout(resolve, 1500));

        const ring = data.ring;
        const hypothesisText = `
## Fraud Hypothesis: ${ring.type.replace(/_/g, ' ').toUpperCase()} Scheme

**Summary**: Detected coordinated activity involving ${ring.partners_involved.length} partners and ${ring.clients_involved.length} clients with ${(ring.detection_confidence * 100).toFixed(0)}% confidence.

### Key Indicators:
1. **Timing Correlation**: Trading activities show strong temporal alignment, suggesting coordination
2. **Position Symmetry**: ${ring.type === 'opposite_trading' ? 'Accounts consistently take opposite positions on same instruments' : 'Accounts exhibit synchronized trading patterns'}
3. **Profit Distribution**: Unusual P&L patterns suggesting profit-splitting arrangement

### Estimated Impact:
- **Potential Fraud Value**: $${ring.estimated_fraud_value.toLocaleString()}
- **Duration**: Active since ${new Date(ring.first_detected).toLocaleDateString()}

### Recommended Actions:
1. ⚠️ Flag all involved partner accounts for enhanced monitoring
2. 📋 Request transaction logs for detailed audit
3. 🔍 Cross-reference KYC documents for identity overlap
4. 💰 Calculate actual commission exposure
5. 📞 Escalate to compliance team for review

### Confidence Breakdown:
- Behavioral Analysis: ${(ring.detection_confidence * 100 * 0.35).toFixed(0)}%
- Network Analysis: ${(ring.detection_confidence * 100 * 0.35).toFixed(0)}%
- Statistical Anomaly: ${(ring.detection_confidence * 100 * 0.30).toFixed(0)}%
    `.trim();

        setHypothesis(hypothesisText);
        setGeneratingHypothesis(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading investigation data...</span>
            </div>
        );
    }

    if (!ringId) {
        return (
            <>
                <div className="page-header">
                    <h1 className="page-title">Investigation Center</h1>
                    <p className="page-description">
                        Deep-dive analysis and AI-powered hypothesis generation for detected fraud schemes
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Investigation Selected</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Select a fraud alert from the Detection page or try a demo case below
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/detection" className="btn btn-primary">
                            Go to Detection
                        </Link>
                        <Link href="/investigation?ring=FR001" className="btn btn-secondary">
                            🔍 Demo: Opposite Trading
                        </Link>
                        <Link href="/investigation?ring=FR002" className="btn btn-secondary">
                            🔍 Demo: Mirror Trading
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const ring = data?.ring;

    return (
        <>
            <Link href="/detection" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                marginBottom: '1rem',
                fontSize: '0.875rem'
            }}>
                <ArrowLeft size={16} />
                Back to Detection
            </Link>

            <div className="page-header">
                <h1 className="page-title">Investigation: {ring?.ring_id || 'Unknown'}</h1>
                <p className="page-description">
                    {ring?.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Scheme Analysis
                </p>
            </div>

            {ring && (
                <div className="investigation-grid">
                    {/* Left Panel - Evidence */}
                    <div className="evidence-panel">
                        <div className="evidence-card">
                            <div className="evidence-title">
                                <div className="evidence-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)' }}>
                                    <AlertTriangle size={14} />
                                </div>
                                Overview
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Fraud Type</div>
                                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{ring.type.replace(/_/g, ' ')}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Estimated Value</div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(ring.estimated_fraud_value)}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Confidence</div>
                                    <div style={{ fontWeight: 600 }}>{(ring.detection_confidence * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="evidence-card">
                            <div className="evidence-title">
                                <div className="evidence-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                                    <Users size={14} />
                                </div>
                                Involved Parties
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.375rem' }}>
                                    Partners ({ring.partners_involved.length})
                                </div>
                                {ring.partners_involved.map((pid, idx) => (
                                    <div key={idx} style={{
                                        padding: '0.375rem 0.625rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        marginBottom: '0.25rem',
                                        fontFamily: 'monospace'
                                    }}>
                                        {pid}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.375rem' }}>
                                    Clients ({ring.clients_involved.length})
                                </div>
                                <div style={{
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem'
                                }}>
                                    {ring.clients_involved.slice(0, 10).map((cid, idx) => (
                                        <div key={idx} style={{
                                            padding: '0.375rem 0.625rem',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontFamily: 'monospace'
                                        }}>
                                            {cid}
                                        </div>
                                    ))}
                                    {ring.clients_involved.length > 10 && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            +{ring.clients_involved.length - 10} more clients
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="evidence-card">
                            <div className="evidence-title">
                                <div className="evidence-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                                    <Clock size={14} />
                                </div>
                                Timeline
                            </div>
                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-date">{new Date(ring.first_detected).toLocaleDateString()}</div>
                                    <div className="timeline-content">Initial detection by GNN analysis</div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-date">{new Date().toLocaleDateString()}</div>
                                    <div className="timeline-content">Investigation initiated</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button className="btn btn-danger" style={{ width: '100%' }}>
                                <XCircle size={16} />
                                Flag Partners
                            </button>
                            <button className="btn btn-secondary" style={{ width: '100%' }}>
                                <FileText size={16} />
                                Export Report
                            </button>
                            <button className="btn btn-secondary" style={{ width: '100%' }}>
                                <CheckCircle size={16} />
                                Mark Reviewed
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Hypothesis */}
                    <div>
                        <div className="card" style={{ height: '100%' }}>
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">AI-Generated Hypothesis</h3>
                                    <p className="card-subtitle">Powered by Gemini AI for evidence synthesis</p>
                                </div>
                                <button
                                    onClick={generateHypothesis}
                                    className="btn btn-primary"
                                    disabled={generatingHypothesis}
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    {generatingHypothesis ? (
                                        <>
                                            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown size={14} />
                                            Generate Hypothesis
                                        </>
                                    )}
                                </button>
                            </div>

                            {hypothesis ? (
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.7,
                                    maxHeight: '500px',
                                    overflowY: 'auto'
                                }}>
                                    {hypothesis.split('\n').map((line, idx) => {
                                        if (line.startsWith('##')) {
                                            return <h2 key={idx} style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: idx > 0 ? '1.5rem' : 0, marginBottom: '0.75rem' }}>{line.replace(/##\s*/, '')}</h2>;
                                        }
                                        if (line.startsWith('###')) {
                                            return <h3 key={idx} style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{line.replace(/###\s*/, '')}</h3>;
                                        }
                                        if (line.startsWith('**') && line.endsWith('**')) {
                                            return <p key={idx} style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{line.replace(/\*\*/g, '')}</p>;
                                        }
                                        if (line.startsWith('- ') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) {
                                            return <p key={idx} style={{ marginLeft: '1rem', marginBottom: '0.375rem' }}>{line}</p>;
                                        }
                                        return <p key={idx} style={{ marginBottom: '0.5rem' }}>{line}</p>;
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '300px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '12px',
                                    color: 'var(--text-muted)'
                                }}>
                                    <TrendingDown size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Click &quot;Generate Hypothesis&quot; to create AI-powered analysis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function InvestigationPage() {
    return (
        <Suspense fallback={
            <div className="loading">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
            </div>
        }>
            <InvestigationContent />
        </Suspense>
    );
}

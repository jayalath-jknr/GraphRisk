'use client';

import { useEffect, useState } from 'react';
import { Search, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface OppositeTrading {
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
}

interface BonusAbuse {
    clientId: string;
    clientName: string;
    partnerId: string;
    partnerName: string;
    qualityScore: number;
    flags: string[];
    deposit: number;
    tradesCount: number;
    evidence: string;
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

interface DetectionData {
    oppositeTrading: OppositeTrading[];
    bonusAbuse: BonusAbuse[];
    fraudRings: FraudRing[];
    summary: {
        totalSchemes: number;
        totalEstimatedValue: number;
        highConfidenceAlerts: number;
    };
}

export default function DetectionPage() {
    const [data, setData] = useState<DetectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'opposite' | 'bonus' | 'rings'>('opposite');
    const [searchTerm, setSearchTerm] = useState('');

    const runDetection = () => {
        setLoading(true);
        fetch('/api/detect?type=all')
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setData(result.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        runDetection();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const filteredOppositeTrading = data?.oppositeTrading?.filter(item =>
        item.partnerA.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partnerB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientA.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientB.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const filteredBonusAbuse = data?.bonusAbuse?.filter(item =>
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Running fraud detection analysis...</span>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Fraud Detection Analysis</h1>
                <p className="page-description">
                    AI-powered analysis detecting opposite trading, mirror trading, bonus abuse, and commission fraud patterns
                </p>
            </div>

            {/* Summary Stats */}
            {data?.summary && (
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon red">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-value">{data.summary.totalSchemes}</div>
                        <div className="stat-label">Total Schemes Detected</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <span style={{ fontSize: '1.5rem' }}>$</span>
                        </div>
                        <div className="stat-value">{formatCurrency(data.summary.totalEstimatedValue)}</div>
                        <div className="stat-label">Total Estimated Fraud Value</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow">
                            <span style={{ fontSize: '1.5rem' }}>⚠</span>
                        </div>
                        <div className="stat-value">{data.summary.highConfidenceAlerts}</div>
                        <div className="stat-label">High Confidence Alerts (&gt;75%)</div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{
                    flex: 1,
                    minWidth: '250px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0 1rem'
                }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search partners or clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '0.75rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            outline: 'none'
                        }}
                    />
                </div>
                <button onClick={runDetection} className="btn btn-primary">
                    <RefreshCw size={16} />
                    Re-run Analysis
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    className={`network-btn ${activeTab === 'opposite' ? 'active' : ''}`}
                    onClick={() => setActiveTab('opposite')}
                >
                    🔄 Opposite Trading ({data?.oppositeTrading?.length || 0})
                </button>
                <button
                    className={`network-btn ${activeTab === 'bonus' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bonus')}
                >
                    💰 Bonus Abuse ({data?.bonusAbuse?.length || 0})
                </button>
                <button
                    className={`network-btn ${activeTab === 'rings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rings')}
                >
                    🕸️ Fraud Rings ({data?.fraudRings?.length || 0})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'opposite' && (
                <div className="alert-list">
                    {filteredOppositeTrading.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No opposite trading schemes found matching search criteria</p>
                        </div>
                    ) : (
                        filteredOppositeTrading.map((scheme) => (
                            <Link
                                key={scheme.schemeId}
                                href={`/investigation?scheme=${scheme.schemeId}`}
                                className={`alert-card ${scheme.confidence > 0.75 ? 'critical' : scheme.confidence > 0.5 ? 'high' : 'medium'}`}
                            >
                                <span className="alert-badge opposite_trading">Opposite Trading</span>
                                <div className="alert-content">
                                    <div className="alert-title">
                                        {scheme.partnerA.name} ↔ {scheme.partnerB.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Clients: {scheme.clientA.name} vs {scheme.clientB.name}
                                    </div>
                                    <div className="alert-meta">
                                        <span>{scheme.oppositePairs} opposite trades</span>
                                        <span>{(scheme.timingCorrelation * 100).toFixed(0)}% timing correlation</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="alert-value">{formatCurrency(scheme.estimatedValue)}</div>
                                    <div className="confidence-bar">
                                        <div
                                            className={`confidence-fill ${scheme.confidence > 0.75 ? 'high' : scheme.confidence > 0.5 ? 'medium' : 'low'}`}
                                            style={{ width: `${scheme.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        {(scheme.confidence * 100).toFixed(0)}% confidence
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'bonus' && (
                <div className="alert-list">
                    {filteredBonusAbuse.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No bonus abuse patterns found matching search criteria</p>
                        </div>
                    ) : (
                        filteredBonusAbuse.map((abuse) => (
                            <div
                                key={abuse.clientId}
                                className={`alert-card ${abuse.qualityScore < 30 ? 'critical' : abuse.qualityScore < 50 ? 'high' : 'medium'}`}
                            >
                                <span className="alert-badge bonus_abuse">Bonus Abuse</span>
                                <div className="alert-content">
                                    <div className="alert-title">{abuse.clientName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Referred by: {abuse.partnerName}
                                    </div>
                                    <div className="alert-meta">
                                        <span>Quality Score: {abuse.qualityScore}/100</span>
                                        <span>{abuse.tradesCount} trades</span>
                                        <span>Deposit: {formatCurrency(abuse.deposit)}</span>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                        {abuse.flags.map((flag, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '0.125rem 0.5rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--color-danger)'
                                                }}
                                            >
                                                {flag.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'rings' && (
                <div className="alert-list">
                    {data?.fraudRings?.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No fraud rings detected</p>
                        </div>
                    ) : (
                        data?.fraudRings?.map((ring) => (
                            <Link
                                key={ring.ring_id}
                                href={`/investigation?ring=${ring.ring_id}`}
                                className={`alert-card ${ring.detection_confidence > 0.85 ? 'critical' : 'high'}`}
                            >
                                <span className={`alert-badge ${ring.type}`}>
                                    {ring.type.replace(/_/g, ' ')}
                                </span>
                                <div className="alert-content">
                                    <div className="alert-title">Fraud Ring: {ring.ring_id}</div>
                                    <div className="alert-meta">
                                        <span>{ring.partners_involved.length} partners involved</span>
                                        <span>{ring.clients_involved.length} clients involved</span>
                                        <span>Detected: {new Date(ring.first_detected).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="alert-value">{formatCurrency(ring.estimated_fraud_value)}</div>
                                    <div className="confidence-bar">
                                        <div
                                            className={`confidence-fill ${ring.detection_confidence > 0.85 ? 'high' : 'medium'}`}
                                            style={{ width: `${ring.detection_confidence * 100}%` }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        {(ring.detection_confidence * 100).toFixed(0)}% confidence
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Users, TrendingUp, Shield, Activity, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  statistics: {
    totalPartners: number;
    totalClients: number;
    totalTrades: number;
    activeAlerts: number;
    suspiciousPartners: number;
    estimatedFraudValue: number;
    highRiskPartners: number;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    partnersInvolved: number;
    clientsInvolved: number;
    estimatedValue: number;
    confidence: number;
    detectedAt: string;
    partnerNames: string[];
  }>;
  topRiskPartners: Array<{
    partnerId: string;
    partnerName: string;
    partnerType: string;
    riskScore: number;
    flagCount: number;
    totalReferrals: number;
    fraudRingsInvolved: number;
  }>;
  dateRange: { start: string; end: string };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading">
        <span style={{ color: 'var(--color-danger)' }}>Failed to load dashboard data</span>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'opposite_trading': 'Opposite Trading',
      'mirror_trading': 'Mirror Trading',
      'bonus_abuse': 'Bonus Abuse',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fraud Detection Dashboard</h1>
        <p className="page-description">
          Real-time monitoring of partner and affiliate fraud patterns using AI-powered Graph Neural Networks
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-value">{data.statistics.activeAlerts}</div>
          <div className="stat-label">Active Fraud Alerts</div>
          <div className="stat-change negative">
            <span>Requires attention</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Shield size={24} />
          </div>
          <div className="stat-value">{data.statistics.suspiciousPartners}</div>
          <div className="stat-label">Suspicious Partners</div>
          <div className="stat-change negative">
            <span>{((data.statistics.suspiciousPartners / data.statistics.totalPartners) * 100).toFixed(1)}% of total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign size={24} />
          </div>
          <div className="stat-value">{formatCurrency(data.statistics.estimatedFraudValue)}</div>
          <div className="stat-label">Estimated Fraud Value</div>
          <div className="stat-change negative">
            <span>Potential losses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-value">{formatNumber(data.statistics.totalPartners)}</div>
          <div className="stat-label">Total Partners</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Activity size={24} />
          </div>
          <div className="stat-value">{formatNumber(data.statistics.totalClients)}</div>
          <div className="stat-label">Total Clients</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-value">{formatNumber(data.statistics.totalTrades)}</div>
          <div className="stat-label">Total Trades</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Fraud Alerts</h3>
              <p className="card-subtitle">Detected patterns requiring investigation</p>
            </div>
            <Link href="/detection" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
              View All
            </Link>
          </div>
          <div className="alert-list">
            {data.recentAlerts.slice(0, 5).map((alert) => (
              <Link
                key={alert.id}
                href={`/investigation?ring=${alert.id}`}
                className={`alert-card ${alert.severity}`}
              >
                <span className={`alert-badge ${alert.type}`}>
                  {getTypeLabel(alert.type)}
                </span>
                <div className="alert-content">
                  <div className="alert-title">
                    {alert.partnerNames.slice(0, 2).join(' ↔ ')}
                    {alert.partnerNames.length > 2 && ` +${alert.partnerNames.length - 2} more`}
                  </div>
                  <div className="alert-meta">
                    <span>{alert.partnersInvolved} partners</span>
                    <span>{alert.clientsInvolved} clients</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="alert-value">{formatCurrency(alert.estimatedValue)}</div>
                  <div className="confidence-bar">
                    <div
                      className={`confidence-fill ${alert.confidence > 0.85 ? 'high' : alert.confidence > 0.7 ? 'medium' : 'low'}`}
                      style={{ width: `${alert.confidence * 100}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {(alert.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Risk Partners */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">High-Risk Partners</h3>
              <p className="card-subtitle">Partners with highest fraud indicators</p>
            </div>
            <Link href="/network?view=fraud" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
              View Network
            </Link>
          </div>
          <table className="risk-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Type</th>
                <th>Risk Score</th>
                <th>Referrals</th>
                <th>Fraud Rings</th>
              </tr>
            </thead>
            <tbody>
              {data.topRiskPartners.slice(0, 6).map((partner) => (
                <tr key={partner.partnerId}>
                  <td>
                    <Link href={`/investigation?partner=${partner.partnerId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {partner.partnerName}
                    </Link>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {partner.partnerType.replace('_', ' ')}
                  </td>
                  <td>
                    <div className="risk-score">
                      <span style={{
                        color: partner.riskScore > 70 ? 'var(--color-danger)' : partner.riskScore > 40 ? 'var(--color-warning)' : 'var(--color-success)',
                        fontWeight: 600
                      }}>
                        {partner.riskScore}
                      </span>
                      <div className="risk-score-bar">
                        <div
                          className="risk-score-fill"
                          style={{
                            width: `${partner.riskScore}%`,
                            background: partner.riskScore > 70 ? 'var(--color-danger)' : partner.riskScore > 40 ? 'var(--color-warning)' : 'var(--color-success)'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{partner.totalReferrals}</td>
                  <td>
                    {partner.fraudRingsInvolved > 0 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                        {partner.fraudRingsInvolved}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/detection" className="btn btn-primary">
          <Shield size={18} />
          Run Full Analysis
        </Link>
        <Link href="/network" className="btn btn-secondary">
          <Activity size={18} />
          Explore Network
        </Link>
      </div>
    </>
  );
}

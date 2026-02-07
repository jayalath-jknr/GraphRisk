'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;

interface GraphNode {
    id: string;
    name: string;
    type: string;
    group: string;
    riskLevel: string;
    size: number;
    metadata: Record<string, unknown>;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    strength: number;
}

interface NetworkData {
    nodes: GraphNode[];
    edges: GraphLink[];
    stats: {
        totalNodes: number;
        totalEdges: number;
        fraudNodes: number;
    };
}

export default function NetworkPage() {
    const [data, setData] = useState<NetworkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<'partners' | 'fraud' | 'full'>('fraud');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/network?view=${viewType}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setData(result.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [viewType]);

    useEffect(() => {
        if (data && graphRef.current) {
            setTimeout(() => {
                graphRef.current?.zoomToFit(400);
            }, 500);
        }
    }, [data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getNodeColor = useCallback((node: any) => {
        if (node.riskLevel === 'high') return '#ef4444';
        if (node.riskLevel === 'medium') return '#f59e0b';
        if (node.group === 'partner') {
            return node.type === 'master' ? '#6366f1' : '#3b82f6';
        }
        return '#64748b';
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getLinkColor = useCallback((link: any) => {
        if (link.type === 'fraud') return 'rgba(239, 68, 68, 0.8)';
        if (link.type === 'hierarchy') return 'rgba(99, 102, 241, 0.4)';
        return 'rgba(148, 163, 184, 0.2)';
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node as GraphNode);
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading network data...</span>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Partner Network Visualization</h1>
                <p className="page-description">
                    Interactive graph showing partner relationships, referral networks, and detected fraud connections
                </p>
            </div>

            <div className="network-container">
                <div className="network-controls">
                    <button
                        className={`network-btn ${viewType === 'fraud' ? 'active' : ''}`}
                        onClick={() => setViewType('fraud')}
                    >
                        🔴 Fraud Focus
                    </button>
                    <button
                        className={`network-btn ${viewType === 'partners' ? 'active' : ''}`}
                        onClick={() => setViewType('partners')}
                    >
                        🔵 Partners Only
                    </button>
                    <button
                        className={`network-btn ${viewType === 'full' ? 'active' : ''}`}
                        onClick={() => setViewType('full')}
                    >
                        🌐 Full Network
                    </button>
                </div>

                {data && (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={{ nodes: data.nodes, links: data.edges }}
                        nodeColor={getNodeColor}
                        nodeRelSize={4}
                        nodeVal={(node: any) => node.size || 5}
                        nodeLabel={(node: any) => {
                            return `${node.name} (${node.type})\nRisk: ${node.riskLevel}`;
                        }}
                        linkColor={getLinkColor}
                        linkWidth={(link: any) => link.strength || 1}
                        linkDirectionalParticles={(link: any) => link.type === 'fraud' ? 4 : 0}
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleColor={() => '#ef4444'}
                        onNodeClick={(node: any) => handleNodeClick(node)}
                        backgroundColor="#0a0a0f"
                        width={typeof window !== 'undefined' ? window.innerWidth - 100 : 1200}
                        height={580}
                        cooldownTicks={100}
                        onEngineStop={() => graphRef.current?.zoomToFit(400)}
                    />
                )}

                <div className="network-legend">
                    <div className="legend-item">
                        <span className="legend-dot master"></span>
                        <span>Master Partner</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot sub"></span>
                        <span>Sub-Affiliate</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot client"></span>
                        <span>Client</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot fraud"></span>
                        <span>Fraud Detected</span>
                    </div>
                </div>
            </div>

            {/* Network Stats */}
            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{data?.stats.totalNodes || 0}</div>
                    <div className="stat-label">Total Nodes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{data?.stats.totalEdges || 0}</div>
                    <div className="stat-label">Connections</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
                        {data?.stats.fraudNodes || 0}
                    </div>
                    <div className="stat-label">Fraud-Related Nodes</div>
                </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">Selected: {selectedNode.name}</h3>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedNode(null)}
                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        >
                            Close
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>ID</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{selectedNode.id}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Type</div>
                            <div style={{ textTransform: 'capitalize' }}>{selectedNode.type}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Risk Level</div>
                            <div style={{
                                color: selectedNode.riskLevel === 'high' ? 'var(--color-danger)' :
                                    selectedNode.riskLevel === 'medium' ? 'var(--color-warning)' : 'var(--color-success)',
                                textTransform: 'capitalize',
                                fontWeight: 600
                            }}>
                                {selectedNode.riskLevel}
                            </div>
                        </div>
                    </div>
                    {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Additional Info</div>
                            <pre style={{
                                background: 'var(--bg-tertiary)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                overflow: 'auto'
                            }}>
                                {JSON.stringify(selectedNode.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

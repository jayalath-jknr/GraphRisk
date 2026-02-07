# GraphRisk - Partner & Affiliate Fraud Detection System

## Project Overview
AI-powered fraud detection system using Graph Neural Networks (GNN) to detect fraudulent behavior by partners and affiliates including:
- Opposite trading schemes
- Mirror trading patterns
- Bonus abuse
- Commission fraud
- Client recycling
- Traffic fraud

## Technology Stack
- **Backend**: Python with FastAPI for serverless API
- **ML/AI**: PyTorch Geometric for GNN models (GAT, GCN, GIN)
- **Frontend**: Next.js with React
- **Visualization**: D3.js / React Force Graph for network mapping
- **AI Explanations**: Gemini API for hypothesis generation
- **Deployment**: Vercel (Next.js frontend + Python serverless functions)

## Project Structure
```
GraphRisk/
├── fraud-detection-gnn/     # Existing GNN models (GAT, GCN, GIN)
│   ├── models.py            # Neural network architectures
│   ├── datasets.py          # Data loading utilities
│   ├── trainer.py           # Training pipeline
│   └── *.yaml               # Model configurations
├── partner-fraud-detector/  # Main application (TO BE CREATED)
│   ├── api/                 # Python serverless functions
│   ├── src/                 # Next.js frontend
│   ├── lib/                 # Shared utilities
│   └── public/              # Static assets
└── claude.md                # This memory file
```

## Key Design Decisions
1. **Vercel-Compatible Architecture**: Using Next.js with Python serverless functions
2. **Graph-Based Detection**: Leveraging existing GNN models for relationship analysis
3. **Synthetic Data**: Generating realistic partner/affiliate network data for demo
4. **Explainable AI**: Using LLM to generate human-readable fraud hypotheses

## Development Progress
- [x] Analyzed existing fraud-detection-gnn codebase
- [x] Identified GNN models: GAT, GCN, GIN
- [x] Researched Vercel deployment strategies
- [ ] Implementation plan pending approval
- [ ] Application development pending

## Important Notes
- Original GNN models use Elliptic dataset (Bitcoin transactions)
- Need to adapt for partner/affiliate relationship graphs
- Vercel serverless has 10s timeout (free) / 60s (Pro) - consider model optimization

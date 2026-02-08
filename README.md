<p align="center">
  <h1 align="center">🔍 GraphRisk</h1>
  <p align="center">
    <strong>AI-Powered Partner & Affiliate Fraud Detection</strong>
  </p>
  <p align="center">
    Real-time graph analysis with explainable evidence for trading partner ecosystems
  </p>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-detection-algorithms">Algorithms</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Gemini-API-8E75B2?style=flat-square&logo=google" alt="Gemini API">
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel" alt="Vercel">
</p>

---

## 🎯 Overview

GraphRisk is an enterprise-grade fraud detection system that uses **Graph Neural Networks (GNN)** to detect partner and affiliate fraud patterns. Unlike traditional transaction-based systems, GraphRisk treats fraud as a **network problem**, analyzing relationships between partners, sub-affiliates, and clients.

> *"From weeks of investigation to same-day detection"*

### Key Insight

**Fraud hides in relationships, not individual transactions.** GraphRisk analyzes timing correlations, position symmetry, shared entities, and client quality to uncover coordinated fraud schemes.

---

## 🚀 Features

### 🔗 Network-Based Fraud Detection
| Feature | Description |
|---------|-------------|
| **Relationship Mapping** | Visualize partner hierarchies and client networks |
| **Opposite Trading Detection** | Identify coordinated opposite positions with timing correlation |
| **Mirror Trading Patterns** | Detect synchronized trading across accounts |
| **Client Clustering** | Find groups with suspiciously similar behavior |

### 📊 Business Behavior Analysis
| Feature | Description |
|---------|-------------|
| **Bonus Abuse Detection** | Flag referrals with minimal trading and quick withdrawals |
| **Commission Anomalies** | Detect earnings inconsistent with legitimate business |
| **Client Quality Scoring** | Assess referral quality and conversion patterns |

### 🧠 Explainable Investigation Support
| Feature | Description |
|---------|-------------|
| **AI-Generated Hypotheses** | Gemini-powered fraud explanations |
| **Evidence Synthesis** | Automated gathering of supporting data |
| **Confidence Scoring** | Statistical confidence for each detection |
| **Impact Calculation** | Quantify potential fraud losses |

### 🗺️ Interactive Visualization
| Feature | Description |
|---------|-------------|
| **Force-Directed Network Graph** | Explore partner relationships dynamically |
| **Fraud Focus View** | Highlight only fraud-related connections |
| **Real-time Analysis** | Live detection across the network |

---

## 🎬 Demo

<p align="center">
  <a href="https://www.youtube.com/watch?v=xDpQ699mev0">
    <img src="https://img.youtube.com/vi/xDpQ699mev0/maxresdefault.jpg" alt="GraphRisk Demo Video" width="700">
  </a>
  <br>
  <em>▶️ Click to watch the demo video</em>
</p>

🌐 **Live Demo:** [graph-risk.vercel.app](https://graph-risk.vercel.app)

### Demo Flow
1. **Dashboard** → View alerts, suspicious partners, and total risk exposure
2. **Network** → Interactive graph with "Fraud Focus" toggle
3. **Detection** → Analyze specific fraud patterns with confidence scores
4. **Investigation** → AI-powered hypothesis generation and evidence synthesis

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Python 3.8+ *(optional, for data generation)*

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jayalath-jknr/GraphRisk.git
cd GraphRisk/partner-fraud-detector

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (optional)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `GEMINI_API_KEY` | Google Gemini API key for AI explanations | Optional |
| `OPENAI_API_KEY` | OpenAI API key (alternative) | Optional |

> **Note:** The application works without API keys using fallback explanations.

---

## 📁 Project Structure

```
GraphRisk/
├── partner-fraud-detector/          # Main application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Main dashboard
│   │   │   ├── network/page.tsx      # Network visualization
│   │   │   ├── detection/page.tsx    # Fraud detection analysis
│   │   │   ├── investigation/page.tsx # Deep-dive investigation
│   │   │   └── api/
│   │   │       ├── dashboard/route.ts # Dashboard data API
│   │   │       ├── network/route.ts   # Network graph API
│   │   │       └── detect/route.ts    # Detection algorithms API
│   │   └── globals.css               # Global styles
│   ├── api/
│   │   ├── algorithms/               # Python detection algorithms
│   │   │   ├── opposite_trading.py
│   │   │   ├── mirror_trading.py
│   │   │   └── bonus_abuse.py
│   │   └── data/
│   │       └── synthetic_generator.py # Demo data generator
│   ├── docs/                         # Documentation & presentations
│   └── vercel.json                   # Deployment config
│
└── fraud-detection-gnn/              # Reference GNN implementation
```

---

## 🎯 Detection Algorithms

### 🔄 Opposite Trading Detection
Identifies coordinated opposite-position schemes where partners place opposing trades to guarantee one side profits.

| Signal | Threshold |
|--------|-----------|
| **Timing Correlation** | Trades within 10-minute windows |
| **Direction Analysis** | Opposite BUY/SELL on same instruments |
| **P&L Correlation** | Inverse profit patterns suggesting profit-splitting |

### 🪞 Mirror Trading Detection
Detects synchronized trading groups that may indicate coordinated manipulation.

| Signal | Threshold |
|--------|-----------|
| **Instrument Matching** | Same assets traded |
| **Volume Similarity** | Within 20% tolerance |
| **Timing Alignment** | Coordinated entry/exit |

### 💰 Bonus Abuse Detection
Flags suspicious referral patterns designed to exploit bonus programs.

| Signal | Threshold |
|--------|-----------|
| **Minimal Trading** | <5 trades after deposit |
| **Quick Withdrawal** | Funds removed within days |
| **Low Conversion** | Poor referral-to-active-trader ratio |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Custom CSS with glassmorphism & dark theme |
| **Visualization** | react-force-graph-2d, Recharts |
| **Backend** | Next.js API Routes (TypeScript) |
| **ML Algorithms** | Custom fraud detection (Python) |
| **AI** | Google Gemini API for hypothesis generation |
| **Deployment** | Vercel (serverless) |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Demo Data

The application includes synthetic demo data with:

- **8 master partners** with 50+ sub-affiliates
- **500+ clients** with trading activity
- **Embedded fraud patterns** for testing
- **6 months** of simulated transactions

### Regenerate Demo Data

```bash
python api/data/synthetic_generator.py
```

---

## � Business Value

| Metric | Before GraphRisk | After GraphRisk |
|--------|------------------|-----------------|
| **Detection Time** | 2-4 weeks | Same day |
| **Investigation** | Days per case | Minutes |
| **Evidence** | Manual spreadsheets | Auto-generated proof |
| **False Positives** | High | Lower with explanations |

> **ROI:** Catching one $100K fraud ring = months of operational savings

---

## 🗺️ Roadmap

| Version | Feature |
|---------|---------|
| v1.1 | Analyst feedback → continuous learning |
| v1.2 | Cross-level attribution → trace root partner |
| v1.3 | Drift detection → catch new fraud techniques |
| v2.0 | One-click audit export |

---

## �📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Base GNN architecture inspired by [fraud-detection-gnn](https://github.com/arxyzan/fraud-detection-gnn)
- Network visualization powered by [react-force-graph](https://github.com/vasturiano/react-force-graph)
- Built for the [lablab.ai](https://lablab.ai) hackathon

> **Note:** The `fraud-detection-gnn/` folder contains the reference implementation from the original repository. All credit for that implementation belongs to the respective owner.

---

<p align="center">
  Made with ❤️ for proactive, evidence-driven fraud defense
</p>

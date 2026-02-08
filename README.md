##GraphRisk - AI-Powered Partner & Affiliate Fraud Detection
An enterprise-grade fraud detection system using Graph Neural Networks (GNN) to detect partner and affiliate fraud patterns including opposite trading, mirror trading, bonus abuse, and commission fraud.

🚀 Features
Network-Based Fraud Detection
Relationship Mapping: Visualize partner hierarchies and client networks
Opposite Trading Detection: Identify coordinated opposite positions with timing correlation
Mirror Trading Patterns: Detect synchronized trading across accounts
Client Clustering: Find groups with suspiciously similar behavior
Business Behavior Analysis
Bonus Abuse Detection: Flag referrals with minimal trading and quick withdrawals
Commission Anomalies: Detect earnings inconsistent with legitimate business
Client Quality Scoring: Assess referral quality and conversion patterns
Explainable Investigation Support
AI-Generated Hypotheses: Gemini-powered fraud explanations
Evidence Synthesis: Automated gathering of supporting data
Confidence Scoring: Statistical confidence for each detection
Impact Calculation: Quantify potential fraud losses
Interactive Visualization
Force-Directed Network Graph: Explore partner relationships
Fraud Focus View: Highlight only fraud-related connections
Real-time Analysis: Live detection across the network
🛠️ Technology Stack
Frontend: Next.js 15, React 19, TypeScript
Styling: Custom CSS with glassmorphism & dark theme
Visualization: react-force-graph-2d, Recharts
Backend: Next.js API Routes (TypeScript)
ML Algorithms: Custom fraud detection (opposite trading, mirror trading, bonus abuse)
AI: Google Gemini API for hypothesis generation
Deployment: Vercel
📦 Installation
# Clone the repository
git clone https://github.com/yourusername/GraphRisk.git
cd GraphRisk/partner-fraud-detector

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
Open http://localhost:3000 to view the application.

🔧 Environment Variables
Variable	Description	Required
GEMINI_API_KEY	Google Gemini API key for AI explanations	Optional
OPENAI_API_KEY	OpenAI API key (alternative)	Optional
📁 Project Structure
partner-fraud-detector/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── network/page.tsx      # Network visualization
│   │   ├── detection/page.tsx    # Fraud detection analysis
│   │   ├── investigation/page.tsx # Deep-dive investigation
│   │   └── api/
│   │       ├── dashboard/route.ts # Dashboard data API
│   │       ├── network/route.ts   # Network graph API
│   │       └── detect/route.ts    # Detection algorithms API
│   └── globals.css               # Global styles
├── api/
│   ├── algorithms/               # Python detection algorithms
│   │   ├── opposite_trading.py
│   │   ├── mirror_trading.py
│   │   └── bonus_abuse.py
│   └── data/
│       └── synthetic_generator.py # Demo data generator
└── vercel.json                   # Deployment config
🎯 Detection Algorithms
Opposite Trading Detection
Identifies coordinated opposite-position schemes:

Timing Correlation: Trades within 10-minute windows
Direction Analysis: Opposite BUY/SELL on same instruments
P&L Correlation: Inverse profit patterns suggesting profit-splitting
Mirror Trading Detection
Detects synchronized trading groups:

Instrument Matching: Same assets traded
Volume Similarity: Within 20% tolerance
Timing Alignment: Coordinated entry/exit
Bonus Abuse Detection
Flags suspicious referral patterns:

Minimal Trading: <5 trades after deposit
Quick Withdrawal: Funds removed within days
Low Conversion: Poor referral-to-active-trader ratio
🚢 Deployment
Vercel (Recommended)
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
Manual Build
npm run build
npm start
📊 Demo Data
The application includes synthetic demo data with:

8 master partners with 50+ sub-affiliates
500+ clients with trading activity
Embedded fraud patterns for testing
6 months of simulated transactions
To regenerate demo data:

python api/data/synthetic_generator.py
📄 License
MIT License - see LICENSE file for details.

🙏 Acknowledgments
Base GNN architecture inspired by fraud-detection-gnn
Network visualization powered by react-force-graph
GraphRisk Application was build Based Upon findings from https://github.com/arxyzan/fraud-detection-gnn and the folder (fraud-detection-gnn) is included in the project and the implementation belongs to the respective owner

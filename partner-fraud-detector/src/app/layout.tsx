import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GraphRisk - Partner Fraud Detection",
  description: "AI-powered partner and affiliate fraud detection using Graph Neural Networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="header">
            <div className="logo">
              <div className="logo-icon">🔍</div>
              <span className="logo-text">GraphRisk</span>
            </div>
            <nav className="nav">
              <Link href="/" className="nav-link">Dashboard</Link>
              <Link href="/network" className="nav-link">Network</Link>
              <Link href="/detection" className="nav-link">Detection</Link>
              <Link href="/investigation" className="nav-link">Investigation</Link>
            </nav>
          </header>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

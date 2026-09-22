import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketClock — Schedule-Aware Liquidity Manager for Meteora DLMM",
  description:
    "Post-graduation automated liquidity manager on Meteora DLMM for tokenized equities and RWAs. Synchronizes bin ranges and dynamic-fee decay with reference market open/close schedules.",
  keywords: [
    "Meteora",
    "DLMM",
    "Solana",
    "Tokenized Stocks",
    "Stocklana",
    "DeFi",
    "Liquidity Manager",
    "Automated Market Maker",
  ],
  authors: [{ name: "MarketClock Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-graphite-950 text-graphite-100 antialiased market-grid-bg selection:bg-state-open/20 selection:text-state-open">
        <div className="chart-drift-overlay min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

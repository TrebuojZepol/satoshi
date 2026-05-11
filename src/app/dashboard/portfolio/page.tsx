import { PortfolioClient } from "@/components/portfolio/portfolio-client";

export default function PortfolioPage() {
  return (
    <div className="space-y-6" data-testid="page-portfolio">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio analytics</h1>
        <p className="text-muted-foreground">
          Historical snapshots are generated at seed time for charting.
        </p>
      </div>
      <PortfolioClient />
    </div>
  );
}

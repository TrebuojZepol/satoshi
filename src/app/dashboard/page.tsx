import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardHomePage() {
  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Navigate modules using the sidebar. All balances and settlements are mocked.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="overview-card-swap">
          <CardHeader>
            <CardTitle className="text-base">Batch swap</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Submit limit orders into the next clearing batch.</p>
            <Button asChild size="sm">
              <Link href="/dashboard/swap">Go to swap</Link>
            </Button>
          </CardContent>
        </Card>
        <Card data-testid="overview-card-vaults">
          <CardHeader>
            <CardTitle className="text-base">DLC vaults</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Manage collateralized debt positions with health gauges.</p>
            <Button asChild size="sm">
              <Link href="/dashboard/vaults">Open vaults</Link>
            </Button>
          </CardContent>
        </Card>
        <Card data-testid="overview-card-susd">
          <CardHeader>
            <CardTitle className="text-base">sUSD</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Inspect supply, peg, and rate levers for the stablecoin module.</p>
            <Button asChild size="sm">
              <Link href="/dashboard/susd">View sUSD</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

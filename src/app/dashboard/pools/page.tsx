import { PoolsClient } from "@/components/pools/pools-client";

export default function PoolsPage() {
  return (
    <div className="space-y-6" data-testid="page-pools">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Liquidity & staking</h1>
        <p className="text-muted-foreground">
          TVL and reserves are seeded; staking updates the stakes table.
        </p>
      </div>
      <PoolsClient />
    </div>
  );
}

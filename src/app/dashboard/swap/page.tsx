import { BatchAuctionPanel } from "@/components/batch/BatchAuctionPanel";

export default function SwapPage() {
  return (
    <div className="space-y-6" data-testid="page-swap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Batch auction swap</h1>
        <p className="text-muted-foreground">
          Orders clear at a uniform price each simulated Bitcoin block.
        </p>
      </div>
      <BatchAuctionPanel />
    </div>
  );
}

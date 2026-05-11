import { SusdClient } from "@/components/susd/susd-client";

export default function SusdPage() {
  return (
    <div className="space-y-6" data-testid="page-susd">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">sUSD stablecoin</h1>
        <p className="text-muted-foreground">
          Metrics are seeded in SQLite; rate levers PATCH the metrics row.
        </p>
      </div>
      <SusdClient />
    </div>
  );
}

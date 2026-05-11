import { VaultsClient } from "@/components/vault/vaults-client";

export default function VaultsPage() {
  return (
    <div className="space-y-6" data-testid="page-vaults">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DLC vaults</h1>
        <p className="text-muted-foreground">
          Vaults are stored in SQLite; actions call mock DLC settlement APIs.
        </p>
      </div>
      <VaultsClient />
    </div>
  );
}

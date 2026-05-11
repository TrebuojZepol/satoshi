"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletCookieSync } from "@/components/wallet/wallet-cookie-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={200}>
        <WalletCookieSync />
        {children}
        <Toaster richColors theme="dark" position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

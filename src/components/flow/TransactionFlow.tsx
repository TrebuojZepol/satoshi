"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TxStep = {
  id: string;
  label: string;
  status: "pending" | "broadcast" | "confirming" | "confirmed" | "error";
  confirmations?: number;
  targetConfirmations?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  steps: TxStep[];
  errorMessage?: string | null;
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    testId?: string;
  };
  testId?: string;
};

export function TransactionFlow({
  open,
  onOpenChange,
  title,
  description,
  steps,
  errorMessage,
  primaryAction,
  testId = "transaction-flow",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={testId}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <ol className="space-y-3" data-testid={`${testId}-steps`}>
          {steps.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-border bg-background/40 p-3"
              data-testid={`${testId}-step-${s.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.label}</span>
                <span
                  className={cn(
                    "font-data text-xs uppercase",
                    s.status === "confirmed" && "text-success",
                    s.status === "error" && "text-destructive",
                    (s.status === "pending" ||
                      s.status === "broadcast" ||
                      s.status === "confirming") &&
                      "text-muted-foreground",
                  )}
                >
                  {s.status}
                </span>
              </div>
              {typeof s.confirmations === "number" &&
              typeof s.targetConfirmations === "number" ? (
                <p className="mt-1 font-data text-xs text-muted-foreground">
                  Confirmations {s.confirmations}/{s.targetConfirmations}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        {errorMessage ? (
          <p className="text-sm text-destructive" data-testid={`${testId}-error`}>
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          {primaryAction ? (
            <Button
              type="button"
              onClick={() => void primaryAction.onClick()}
              disabled={primaryAction.disabled || primaryAction.loading}
              data-testid={primaryAction.testId ?? `${testId}-primary`}
            >
              {primaryAction.loading ? "Working…" : primaryAction.label}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            data-testid={`${testId}-close`}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

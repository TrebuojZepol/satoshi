"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[bitvault] dashboard error", error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-lg border border-destructive/50 bg-card p-6"
          data-testid="dashboard-error-boundary"
        >
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button
            type="button"
            className="mt-4"
            variant="secondary"
            onClick={() => this.setState({ error: null })}
            data-testid="dashboard-error-retry"
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

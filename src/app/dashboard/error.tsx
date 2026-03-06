"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold">Failed to load this section</h2>
      <p className="mb-4 text-muted-foreground">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Please try again."}
      </p>
      <Button onClick={reset} variant="outline">
        Retry
      </Button>
    </div>
  );
}

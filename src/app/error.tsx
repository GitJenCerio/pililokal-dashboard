"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error.digest, error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-destructive">
          Something went wrong
        </h1>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. Please try again, or contact your admin if
          the issue persists.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}

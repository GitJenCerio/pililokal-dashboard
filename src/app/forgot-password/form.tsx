"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "./action";

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordResetAction(formData);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else if (result.error) {
      // Show error if any (e.g. validation)
      setSuccess(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        If an account exists with that email, you&apos;ll receive a password reset link shortly.
        Check your inbox and spam folder.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@pililokal.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

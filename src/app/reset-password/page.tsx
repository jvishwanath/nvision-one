"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await authService.updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border p-5 bg-card text-center">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NVision One</p>
            <h1 className="text-xl font-semibold">Password Updated</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Link href="/login" className="inline-block w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium text-center">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border p-5 bg-card">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NVision One</p>
          <h1 className="text-xl font-semibold">Set New Password</h1>
        </div>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="password"
          placeholder="New password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="password"
          placeholder="Confirm new password"
          minLength={8}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

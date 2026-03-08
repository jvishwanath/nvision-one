"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      await authService.forgotPassword(email.trim(), redirectTo);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border p-5 bg-card text-center">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NVision One</p>
            <h1 className="text-xl font-semibold">Check Your Email</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
            Check your inbox and spam folder.
          </p>
          <Link href="/login" className="inline-block text-sm underline text-muted-foreground hover:text-foreground">
            Back to login
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
          <h1 className="text-xl font-semibold">Reset Password</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="text-sm text-muted-foreground">
          Remember your password? <Link className="underline" href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

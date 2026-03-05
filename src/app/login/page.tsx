"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await login(email.trim(), password);
    if (ok) {
      router.replace("/");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border p-5 bg-card">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">NVision One</p>
          <h1 className="text-xl font-semibold">Login</h1>
        </div>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="password"
          placeholder="Password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm text-muted-foreground">
          No account? <Link className="underline" href="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}

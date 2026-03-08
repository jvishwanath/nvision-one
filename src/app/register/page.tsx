"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store";

export default function RegisterPage() {
  const { register, login, loading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await register(email.trim(), password, name.trim());
    if (ok) {
      const loggedIn = await login(email.trim(), password);
      if (loggedIn) {
        window.location.replace("/");
      }
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border p-5 bg-card">
        <h1 className="text-xl font-semibold">Create account</h1>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-background"
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          {loading ? "Creating account..." : "Create account"}
        </button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link className="underline" href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to process reset request.");
        return;
      }

      setMessage(
        data.message ??
          "If the account exists, an Atomix admin can reset it."
      );
      setEmail("");
    } catch {
      setError("Unable to process reset request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <div className="atomix-hero-grid absolute inset-0 opacity-45" />
      <div className="atomix-hero-orb atomix-hero-orb-a" />
      <div className="atomix-hero-orb atomix-hero-orb-b" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-200"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>

          <a
            href="https://twentyeightlab.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-[0.22em] text-slate-500 transition hover:text-cyan-200"
          >
            Powered by Twenty Eight Labs
          </a>
        </header>

        <section className="grid flex-1 grid-cols-1 items-center gap-10 py-10 lg:grid-cols-12">
          <div className="hidden lg:col-span-7 lg:block">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                <ShieldCheck size={16} />
                Account recovery workflow
              </div>

              <h1 className="text-5xl font-black tracking-tight">
                Recover access
                <span className="block text-cyan-300">
                  without exposing account state.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Submit your Atomix account email. For safety, the app does not
                reveal whether the account exists; an admin can reset the
                password from User Administration.
              </p>
            </div>

            <div className="atomix-login-visual mt-10 max-w-2xl rounded-[2rem] border border-cyan-300/20 bg-slate-950/75 p-6 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Reset Guardrails
                  </p>
                  <h2 className="text-2xl font-bold">Admin-mediated reset</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 atomix-logo-pulse">
                  <KeyRound size={24} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Private", "No account enumeration"],
                  ["Controlled", "Admin reset required"],
                  ["Immediate", "New password applies on save"],
                ].map(([title, detail]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <p className="font-bold text-white">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-cyan-300/20 bg-slate-950/85 p-7 shadow-2xl backdrop-blur md:p-8 atomix-glow">
              <div className="mb-7 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 atomix-logo-pulse">
                  <Mail className="text-cyan-300" size={26} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-cyan-300">
                    Password Reset
                  </h1>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Atomix Access
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Account email
                  </span>
                  <input
                    type="email"
                    placeholder="admin@atomix.local"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  />
                </label>

                {message && (
                  <p className="flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
                    {message}
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  Request reset
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

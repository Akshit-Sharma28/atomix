"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Shield,
  Sparkles,
} from "lucide-react";

import {
  Suspense,
  useState,
} from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword,
    setShowPassword] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const callbackUrl =
      searchParams.get(
        "callbackUrl"
      ) ?? "/dashboard";

    const result =
      await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

    if (result?.error) {
      setError(
        "Invalid email or password"
      );

      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <div className="atomix-hero-grid absolute inset-0 opacity-45" />
      <div className="atomix-hero-orb atomix-hero-orb-a" />
      <div className="atomix-hero-orb atomix-hero-orb-b" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-200"
          >
            <ArrowLeft size={16} />
            Back to home
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
                <Sparkles size={16} />
                Secure access to Atomix operations
              </div>

              <h1 className="text-5xl font-black tracking-tight">
                Continue your
                <span className="block text-cyan-300">
                  AI-powered governance work.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Sign in to manage projects, findings, reports, reviewers,
                remediation timelines, and Atomix Copilot workflows.
              </p>
            </div>

            <div className="atomix-login-visual mt-10 max-w-2xl rounded-[2rem] border border-cyan-300/20 bg-slate-950/75 p-6 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Operational Snapshot
                  </p>
                  <h2 className="text-2xl font-bold">Risk command center</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 atomix-logo-pulse">
                  <Shield size={24} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Critical", "5", "text-red-300"],
                  ["Open", "11", "text-blue-300"],
                  ["Closed", "1", "text-emerald-300"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`mt-2 text-3xl font-black ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-black/30 p-4">
                <div className="mb-3 h-2 w-28 rounded-full bg-cyan-300/80" />
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-slate-700" />
                  <div className="h-2 w-3/4 rounded-full bg-slate-700" />
                  <div className="h-2 w-1/2 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-cyan-300/20 bg-slate-950/85 p-7 shadow-2xl backdrop-blur md:p-8 atomix-glow">
              <div className="mb-7 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 atomix-logo-pulse">
                  <LockKeyhole
                    className="text-cyan-300"
                    size={26}
                  />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-cyan-300">
                    ATOMIX
                  </h1>

                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Secure Login
                  </p>
                </div>
              </div>

              <div className="mb-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-slate-100">
                  Welcome back.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Authenticate to access your security dashboard, AI copilot,
                  findings, and reports.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Email
                  </span>
                  <input
                    type="email"
                    placeholder="admin@atomix.local"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    Password
                  </span>
                  <div className="relative mt-2">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-cyan-200"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>

                {error && (
                  <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-cyan-300 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Signing in..."
                    : "Login to Atomix"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/forgot-password"
                    )
                  }
                  className="text-sm text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot password?
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

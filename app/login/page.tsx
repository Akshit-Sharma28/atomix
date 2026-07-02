"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
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
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <div className="atomix-hero-grid absolute inset-0 opacity-45" />
      <div className="atomix-hero-orb atomix-hero-orb-a" />
      <div className="atomix-hero-orb atomix-hero-orb-b" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4">
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

        <section className="grid flex-1 grid-cols-1 items-center gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles size={16} />
              Secure governance workspace
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-5xl xl:text-6xl">
              Sign in to
              <span className="block text-cyan-300">
                Atomix Governance.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Access a governed workspace for scope readiness, review
              coordination, evidence tracking, retest status, SLA signals, and
              leadership reporting.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Scope readiness", "prerequisites and review boundaries"],
                ["Capacity signals", "assignments and weekly updates"],
                ["Evidence quality", "artifacts, scans, and peer review"],
                ["Delivery insight", "SLA, retest, and reporting views"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
              <p className="text-sm leading-6 text-slate-300">
                Atomix acts as a coordination layer for security review
                governance, helping teams maintain clear ownership, evidence
                traceability, and timely delivery follow-up.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-cyan-300/20 bg-slate-950/85 p-5 shadow-2xl backdrop-blur atomix-glow sm:p-7">
            <div className="mb-6 flex min-w-0 items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 atomix-logo-pulse sm:h-14 sm:w-14">
                <Image
                  src="/atomix-mark.svg"
                  alt=""
                  width={42}
                  height={42}
                  priority
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black text-cyan-300 sm:text-3xl">
                  ATOMIX
                </h1>

                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.18em]">
                  Governance Login
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="text-cyan-300" size={18} />
                <p className="text-sm font-semibold text-slate-100">
                  Secure role workspace
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Atomix opens the right operating view for your work, with
                governed access to relevant records, workflows, and AI-assisted
                review actions.
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
                  onChange={(event) => setEmail(event.target.value)}
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-cyan-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Login to Atomix"}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>

              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot password?
                </button>
                <Link
                  href="/"
                  className="text-slate-500 transition hover:text-slate-300"
                >
                  Learn more
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

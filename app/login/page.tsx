"use client";

import { signIn } from "next-auth/react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  Shield,
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
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-slate-950
      px-4
      "
    >
      <div
        className="
        w-full
        max-w-md
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-8
        "
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield
            className="text-cyan-400"
            size={32}
          />

          <div>
            <h1
              className="
              text-3xl
              font-black
              text-cyan-400
              "
            >
              ATOMIX
            </h1>

            <p className="text-xs text-slate-400">
              AI Security Platform
            </p>
          </div>
        </div>

        <p className="text-slate-400 mb-8">
          Sign in to continue
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
            className="
            w-full
            p-3
            rounded-xl
            bg-slate-950
            border
            border-slate-700
            "
          />

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
              className="
              w-full
              p-3
              pr-12
              rounded-xl
              bg-slate-950
              border
              border-slate-700
              "
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-400
              "
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
            w-full
            p-3
            rounded-xl
            bg-cyan-500
            text-black
            font-semibold
            disabled:opacity-50
            "
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/forgot-password"
              )
            }
            className="
            text-sm
            text-cyan-400
            hover:text-cyan-300
            "
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

import {
  signOut,
  useSession,
} from "next-auth/react";

import {
  LogOut,
  ChevronDown,
  User,
  Eye,
  RotateCcw,
  PawPrint,
} from "lucide-react";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";

import {
  getServerPetPreference,
  getServerPetPersona,
  type PetPersona,
  readPetPersona,
  readPetPreference,
  savePetPersona,
  savePetPreference,
  subscribeToPetPreference,
} from "@/components/pet/pet-preference";

type ActiveUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  previewedBy?: ActiveUser | null;
};

type SwitchableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function UserMenu() {
  const {
    data: session,
  } = useSession();

  const [activeUser, setActiveUser] =
    useState<ActiveUser | null>(null);

  const [open, setOpen] =
    useState(false);

  const [switchableUsers, setSwitchableUsers] =
    useState<SwitchableUser[]>([]);

  const [switching, setSwitching] =
    useState(false);

  const petEnabled = useSyncExternalStore(
    subscribeToPetPreference,
    readPetPreference,
    getServerPetPreference,
  );
  const petPersona = useSyncExternalStore(
    subscribeToPetPreference,
    readPetPersona,
    getServerPetPersona,
  );

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadActiveUser() {
      try {
        const response =
          await fetch("/api/auth/me", {
            cache: "no-store",
          });

        const data =
          await response.json();

        if (!ignore) {
          setActiveUser(
            data.user ?? null
          );
        }
      } catch {
        if (!ignore) {
          setActiveUser(null);
        }
      }
    }

    loadActiveUser();

    return () => {
      ignore = true;
    };
  }, []);

  const loadSwitchableUsers = useCallback(async () => {
    try {
      const response =
        await fetch("/api/auth/switch-user", {
          cache: "no-store",
        });

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      setSwitchableUsers(data.users ?? []);
    } catch {
      setSwitchableUsers([]);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSwitchableUsers);
  }, [loadSwitchableUsers]);

  useEffect(() => {
    if (open) {
      void Promise.resolve().then(loadSwitchableUsers);
    }
  }, [loadSwitchableUsers, open]);

  const displayUser: ActiveUser =
    activeUser ??
    (session?.user as ActiveUser | undefined) ??
    {};

  const initials =
    displayUser?.name
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";

  async function previewUser(userId: string) {
    if (!userId) {
      return;
    }

    setSwitching(true);
    window.dispatchEvent(
      new CustomEvent("atomix:pending", {
        detail: {
          label: "Changing user",
          detail:
            "Please wait while Atomix loads the selected role preview.",
        },
      })
    );

    await fetch("/api/auth/switch-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
      }),
    });

    window.location.reload();
  }

  async function clearPreview() {
    setSwitching(true);
    window.dispatchEvent(
      new CustomEvent("atomix:pending", {
        detail: {
          label: "Changing user",
          detail:
            "Please wait while Atomix restores the logged-in admin.",
        },
      })
    );

    await fetch("/api/auth/switch-user", {
      method: "DELETE",
    });

    window.location.reload();
  }

  return (
    <div
      className="relative"
      ref={menuRef}
    >
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
        flex
        items-center
        gap-3
        px-3
        py-2
        rounded-xl
        border
        border-slate-800
        bg-slate-900/60
        backdrop-blur-xl
        hover:border-cyan-500/30
        transition-all
        "
      >
        <div
          className="
          w-8
          h-8
          rounded-full
          bg-cyan-500
          text-black
          font-bold
          text-xs
          flex
          items-center
          justify-center
          "
        >
          {initials}
        </div>

        <div className="text-left">
          <p
            className="
            text-sm
            font-semibold
            text-white
            leading-none
            "
          >
            {displayUser?.name}
          </p>

          <p
            className="
            text-xs
            text-cyan-400
            "
          >
            {displayUser?.role}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`
            text-slate-500
            transition-transform
            duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
          absolute
          right-0
          mt-2
          w-64
          bg-slate-900/90
          backdrop-blur-xl
          border
          border-slate-800
          rounded-2xl
          shadow-2xl
          p-3
          z-50
          "
        >
          <div
            className="
            flex
            items-center
            gap-3
            pb-3
            border-b
            border-slate-800
            "
          >
            <div
              className="
              w-10
              h-10
              rounded-full
              bg-cyan-500
              text-black
              font-bold
              flex
              items-center
              justify-center
              "
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-white">
                {displayUser?.name}
              </p>

              <p
                className="
                text-xs
                text-slate-400
                truncate
                "
              >
                {displayUser?.email}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <span
              className="
              inline-flex
              px-2
              py-1
              rounded-full
              bg-cyan-500/10
              text-cyan-400
              text-xs
              border
              border-cyan-500/20
              "
            >
              {displayUser?.role}
            </span>

            {(displayUser as ActiveUser)?.previewedBy && (
              <span className="ml-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                Preview mode
              </span>
            )}
          </div>

          {switchableUsers.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Eye size={13} />
                Admin role preview
              </div>

              <select
                value={(displayUser as ActiveUser)?.id ?? ""}
                disabled={switching}
                onChange={(event) =>
                  previewUser(event.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white outline-none focus:border-cyan-400"
              >
                {switchableUsers.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} · {user.role}
                  </option>
                ))}
              </select>

              {(displayUser as ActiveUser)?.previewedBy && (
                <button
                  onClick={clearPreview}
                  disabled={switching}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/10 disabled:opacity-60"
                >
                  <RotateCcw size={14} />
                  Return to logged-in admin
                </button>
              )}
            </div>
          )}

          <Link
            href="/profile"
            className="
            mt-3
            w-full
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-lg
            text-slate-300
            hover:bg-slate-800
            transition-all
            "
          >
            <User size={16} />
            Profile
          </Link>

          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-slate-300">
            <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PawPrint size={16} />
              <div>
                <p className="text-sm leading-none">Atomix pet</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {petEnabled ? "Companion is visible" : "Companion is hidden"}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={petEnabled}
              aria-label="Show Atomix pet"
              onClick={() => savePetPreference(!petEnabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                petEnabled
                  ? "border-cyan-300/40 bg-cyan-400"
                  : "border-slate-700 bg-slate-800"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  petEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            </div>

            {petEnabled && (
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1">
                {([
                  ["beacon", "Beacon"],
                  ["orb", "Orb"],
                  ["droid", "Droid"],
                ] as [PetPersona, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => savePetPersona(value)}
                    className={`rounded-md px-1.5 py-1.5 text-[10px] font-bold transition ${
                      petPersona === value
                        ? "bg-cyan-400 text-slate-950"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() =>
              signOut({
                callbackUrl:
                  "/login",
              })
            }
            className="
            mt-2
            w-full
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-lg
            text-red-400
            hover:bg-red-500/10
            transition-all
            "
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

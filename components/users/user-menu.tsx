"use client";

import {
  signOut,
  useSession,
} from "next-auth/react";

import {
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";

import {
  useState,
  useRef,
  useEffect,
} from "react";

export default function UserMenu() {
  const {
    data: session,
  } = useSession();

  const [open, setOpen] =
    useState(false);

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

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";

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
            {session?.user?.name}
          </p>

          <p
            className="
            text-xs
            text-cyan-400
            "
          >
            {(session?.user as any)?.role}
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
                {session?.user?.name}
              </p>

              <p
                className="
                text-xs
                text-slate-400
                truncate
                "
              >
                {session?.user?.email}
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
              {(session?.user as any)?.role}
            </span>
          </div>

          <button
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
          </button>

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
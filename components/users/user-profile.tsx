"use client";

import {
  useSession,
} from "next-auth/react";

export default function UserProfile() {
  const {
    data: session,
  } = useSession();

  const name =
    session?.user?.name ??
    "User";

  const role =
    (session?.user as any)
      ?.role ?? "";

  const initials =
    name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className="
      flex
      items-center
      gap-3
      px-3
      py-2
      rounded-xl
      border
      border-slate-800
      bg-slate-900
      "
    >
      <div
        className="
        h-10
        w-10
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

      <div>
        <p className="text-sm font-semibold">
          {name}
        </p>

        <p
          className="
          text-xs
          text-cyan-400
          "
        >
          {role}
        </p>
      </div>
    </div>
  );
}
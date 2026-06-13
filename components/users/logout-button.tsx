"use client";

import {
  signOut,
} from "next-auth/react";

import {
  LogOut,
} from "lucide-react";

interface Props {
  compact?: boolean;
}

export default function LogoutButton({
  compact = false,
}: Props) {
  if (compact) {
    return (
      <button
        onClick={() =>
          signOut({
            callbackUrl:
              "/login",
          })
        }
        className="
        flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-red-500/10
        border
        border-red-500/20
        text-red-400
        hover:bg-red-500/20
        "
      >
        <LogOut size={16} />
        Logout
      </button>
    );
  }

  return null;
}
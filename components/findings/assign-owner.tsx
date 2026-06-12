"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  role: string;
}

interface Props {
  findingId: string;
  users: User[];
}

export default function AssignOwner({
  findingId,
  users,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  async function assignOwner(
    ownerId: string
  ) {
    if (!ownerId) return;

    try {
      setLoading(true);

      await fetch(
        "/api/findings/assign-owner",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            findingId,
            ownerId,
          }),
        }
      );

      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-6
      "
    >
      <h3
        className="
        text-xl
        font-semibold
        mb-4
        "
      >
        Assign Owner
      </h3>

      <select
        disabled={loading}
        onChange={(e) =>
          assignOwner(
            e.target.value
          )
        }
        className="
        w-full
        bg-slate-800
        border
        border-slate-700
        rounded-xl
        px-4
        py-3
        text-white
        "
      >
        <option value="">
          Select User
        </option>

        {users.map((user) => (
          <option
            key={user.id}
            value={user.id}
          >
            {user.name}
            {" - "}
            {user.role}
          </option>
        ))}
      </select>

      {loading && (
        <p className="text-cyan-400 mt-3 text-sm">
          Assigning...
        </p>
      )}
    </div>
  );
}
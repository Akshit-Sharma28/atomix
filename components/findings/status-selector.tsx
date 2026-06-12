"use client";

import { useState } from "react";

interface Props {
  findingId: string;
  currentStatus: string;
}

const statuses = [
  "Open",
  "Assigned",
  "In Progress",
  "Ready For Validation",
  "Validated",
  "Closed",
  "Risk Accepted",
];

export default function StatusSelector({
  findingId,
  currentStatus,
}: Props) {
  const [status, setStatus] =
    useState(currentStatus);

  async function updateStatus(
    newStatus: string
  ) {
    setStatus(newStatus);

    await fetch(
      "/api/findings/update-status",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          findingId,
          status: newStatus,
        }),
      }
    );

    location.reload();
  }

  return (
    <select
      value={status}
      onChange={(e) =>
        updateStatus(e.target.value)
      }
      className="
      bg-slate-800
      border
      border-slate-700
      rounded-lg
      px-4
      py-2
      "
    >
      {statuses.map((status) => (
        <option
          key={status}
          value={status}
        >
          {status}
        </option>
      ))}
    </select>
  );
}
"use client";

import {
  useEffect,
  useState,
} from "react";

export default function OllamaStatus() {
  const [status, setStatus] =
    useState("checking");

  useEffect(() => {
    fetch(
      "/api/ollama/status"
    )
      .then((r) => r.json())
      .then((data) =>
        setStatus(
          data.status
        )
      );
  }, []);

  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-xl
      p-4
      "
    >
      <h3 className="font-semibold">
        Local AI
      </h3>

      <p
        className={
          status === "online"
            ? "text-green-400"
            : "text-red-400"
        }
      >
        {status}
      </p>
    </div>
  );
}
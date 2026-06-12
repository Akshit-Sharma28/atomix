"use client";

import { useState } from "react";

export default function ProjectForm() {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  async function createProject() {
    await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        client,
      }),
    });

    window.location.reload();
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <input
        className="border p-2 w-full rounded"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 w-full rounded"
        placeholder="Client Name"
        value={client}
        onChange={(e) => setClient(e.target.value)}
      />

      <button
        onClick={createProject}
        className="border px-4 py-2 rounded"
      >
        Create Project
      </button>
    </div>
  );
}
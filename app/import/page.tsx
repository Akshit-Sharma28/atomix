"use client";

import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] =
    useState<File | null>(null);

  async function upload() {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "/api/import/burp",
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json();

    alert(
      `Imported ${data.imported} findings`
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Import Burp Report
      </h1>

      <input
        type="file"
        accept=".xml"
        onChange={(e) =>
          setFile(
            e.target.files?.[0] || null
          )
        }
      />

      <button
        className="ml-4 border px-4 py-2"
        onClick={upload}
      >
        Upload
      </button>
    </div>
  );
}
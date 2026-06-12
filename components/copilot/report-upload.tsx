"use client";

import { useState } from "react";

export default function ReportUpload() {
  const [loading, setLoading] =
    useState(false);

  async function upload(
    file: File
  ) {
    setLoading(true);

    const form =
      new FormData();

    form.append(
      "file",
      file
    );

    await fetch(
      "/api/knowledge/upload",
      {
        method: "POST",
        body: form,
      }
    );

    setLoading(false);

    alert("Imported");
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <h2 className="text-xl font-bold mb-4">
        Import Pentest Report
      </h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file =
            e.target.files?.[0];

          if (file) {
            upload(file);
          }
        }}
      />

      {loading && (
        <p className="mt-3">
          Processing...
        </p>
      )}

    </div>
  );
}
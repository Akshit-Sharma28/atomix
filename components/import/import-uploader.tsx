"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Upload,
} from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  sprId?: string | null;
}

interface ReviewOption {
  id: string;
  srId?: string | null;
  title: string;
  status: string;
  projectId: string;
}

export default function ImportUploader({
  projects,
  reviews,
}: {
  projects: ProjectOption[];
  reviews: ReviewOption[];
}) {
  const [file, setFile] =
    useState<File | null>(null);
  const [projectId, setProjectId] =
    useState(projects[0]?.id ?? "");
  const [reviewId, setReviewId] =
    useState("");
  const [iteration, setIteration] =
    useState("1.0");
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function upload() {
    if (!file || !projectId) {
      setError("Choose an SPR/project and a Burp XML file.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("reviewId", reviewId);
    formData.append("iteration", iteration);
    formData.append("visibility", "REVIEW_TEAM");

    const response = await fetch(
      "/api/import/burp",
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json().catch(
        () => null
      );

    setLoading(false);

    if (!response.ok) {
      setError(
        data?.error ??
          "Import failed"
      );
      return;
    }

    setMessage(`Stored XML and imported ${data.imported} findings`);
    setFile(null);
  }

  const projectReviews = reviews.filter(
    (review) => review.projectId === projectId
  );

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
      <div className="mb-5 flex items-center gap-3">
        <Upload
          size={22}
          className="text-cyan-300"
        />
        <div>
          <h2 className="text-xl font-bold text-white">
            Burp XML finding import
          </h2>
          <p className="text-sm text-slate-400">
            Store the Burp XML in the review vault and optionally map issues to
            the selected SR.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <select
          value={projectId}
          onChange={(event) =>
            {
              setProjectId(event.target.value);
              setReviewId("");
            }
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
        >
          {projects.length === 0 && (
            <option value="">
              No projects available
            </option>
          )}

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.sprId
                ? `${project.sprId} · ${project.name}`
                : project.name}
            </option>
          ))}
        </select>

        <select
          value={reviewId}
          onChange={(event) => setReviewId(event.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
        >
          <option value="">Select SR / review</option>
          {projectReviews.map((review) => (
            <option key={review.id} value={review.id}>
              {review.srId ?? review.title} · {review.status}
            </option>
          ))}
        </select>

        <select
          value={iteration}
          onChange={(event) => setIteration(event.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
        >
          <option value="1.0">1.0 · First review</option>
          <option value="1.2">1.2 · Retest 1</option>
          <option value="1.3">1.3 · Retest 2</option>
          <option value="1.4">1.4 · Retest 3</option>
          <option value="2.0">2.0 · New review cycle</option>
        </select>

        <input
          type="file"
          accept=".xml"
          onChange={(event) =>
            setFile(
              event.target.files?.[0] ??
                null
            )
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={upload}
          className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading
            ? "Importing..."
            : "Import Findings"}
        </button>

        {message && (
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

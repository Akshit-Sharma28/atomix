"use client";

import type { ReactNode } from "react";
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
  iteration: string;
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
  const [folderName, setFolderName] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function upload() {
    if (!file || !projectId || !reviewId) {
      setError("Choose an SPR, SR, and Burp XML file.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("reviewId", reviewId);
    formData.append("iteration", selectedReview?.iteration ?? "1.0");
    formData.append("visibility", "REVIEW_TEAM");
    formData.append("folderName", activeFolderName);

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
  const selectedReview = projectReviews.find(
    (review) => review.id === reviewId
  );
  const selectedProject = projects.find(
    (project) => project.id === projectId
  );
  const defaultFolderName = [
    selectedProject?.sprId ?? selectedProject?.name ?? "Unassigned SPR",
    selectedReview?.srId ?? selectedReview?.title ?? "Unassigned SR",
    `Iteration ${selectedReview?.iteration ?? "1.0"}`,
  ].join(" / ");
  const activeFolderName = folderName.trim() || defaultFolderName;

  return (
    <div className="min-w-0 rounded-2xl border border-cyan-500/20 bg-slate-900 p-4 sm:p-6">
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Field label="SPR / information system">
          <select
            value={projectId}
            onChange={(event) =>
              {
                setProjectId(event.target.value);
                setReviewId("");
              }
            }
            className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400"
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
        </Field>

        <Field label="SR / review">
          <select
            value={reviewId}
            onChange={(event) => setReviewId(event.target.value)}
            className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400"
          >
            <option value="">Select SR / review</option>
            {projectReviews.map((review) => (
              <option key={review.id} value={review.id}>
                {review.srId ?? review.title} · {review.status}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(9rem,0.45fr)_minmax(0,1fr)]">
        <Field label="Review iteration">
          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300">
            <span className="font-semibold text-white">
              {selectedReview?.iteration ?? "Select SR"}
            </span>
          </div>
        </Field>
        <Field label="Vault folder">
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder={defaultFolderName}
            className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400"
          />
        </Field>
      </div>

      <div className="mt-4">

        <Field label="Burp XML file">
          <input
            type="file"
            accept=".xml"
            onChange={(event) =>
              setFile(
                event.target.files?.[0] ??
                  null
              )
            }
            className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
        </Field>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

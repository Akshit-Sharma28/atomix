"use client";

import { useMemo, useState, useTransition } from "react";
import { Bot, ImagePlus, Sparkles } from "lucide-react";
import { feadControls } from "@/lib/fead-controls";
import { createFinding } from "@/app/actions/findings";

type ReviewOption = {
  id: string;
  label: string;
};

type Props = {
  projectId: string;
  ownerId: string;
  reviews: ReviewOption[];
};

const severities = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
  "Not Rated",
];

const statuses = [
  "PASS",
  "FAIL",
  "Not Rated",
  "Informational",
];

const controlOptions = feadControls.map((control, index) => ({
  key: `${control.id}-${index}`,
  control,
}));

export default function ControlFindingForm({
  projectId,
  ownerId,
  reviews,
}: Props) {
  const [controlKey, setControlKey] =
    useState(controlOptions[0].key);
  const [severity, setSeverity] =
    useState("High");
  const [status, setStatus] =
    useState("FAIL");
  const [reviewerComment, setReviewerComment] =
    useState("");
  const [aiAnalysis, setAiAnalysis] =
    useState("");
  const [isPending, startTransition] =
    useTransition();

  const selectedControl = useMemo(
    () =>
      controlOptions.find(
        (option) => option.key === controlKey
      )?.control ?? controlOptions[0].control,
    [controlKey]
  );

  function updateControl(key: string) {
    setControlKey(key);
    setSeverity(status === "PASS" ? "Informational" : "High");
    setAiAnalysis("");
  }

  function analyzeWithAi() {
    startTransition(async () => {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: `Act as Atomix Add Findings Agent. Analyze this reviewer comment for an SR-mapped control result. Return concise finding details, evidence interpretation, impact, and remediation.\n\nControl: ${selectedControl.id} - ${selectedControl.title}\nSection: ${selectedControl.section}\nTesting required: ${selectedControl.testing}\nArtifacts required: ${selectedControl.artifacts}\nStatus: ${status}\nRisk: ${severity}\nReviewer comment: ${reviewerComment || "No reviewer comment provided."}`,
        }),
      });

      const data =
        await response.json();

      setAiAnalysis(
        data.answer ??
          data.error ??
          "AI analysis unavailable."
      );
    });
  }

  return (
    <form action={createFinding} className="grid gap-5">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="source" value="SR Control Review" />
      <input type="hidden" name="controlId" value={selectedControl.id} />
      <input
        type="hidden"
        name="title"
        value={`${selectedControl.id} - ${selectedControl.title}`}
      />
      <input type="hidden" name="cweId" value="" />
      <input
        type="hidden"
        name="owaspCategory"
        value={selectedControl.section}
      />
      <input
        type="hidden"
        name="controlDetail"
        value={`${selectedControl.testing}\n\nArtifacts Required: ${selectedControl.artifacts}`}
      />
      <input
        type="hidden"
        name="controlRemediation"
        value="Reviewer to document remediation, exception, or acceptance decision based on the control result."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm text-slate-400">
            SR
          </span>
          <select
            name="reviewId"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            {reviews.map((review) => (
              <option key={review.id} value={review.id}>
                {review.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm text-slate-400">
            Control
          </span>
          <select
            value={controlKey}
            onChange={(event) =>
              updateControl(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            {controlOptions.map(({ key, control }) => (
              <option key={key} value={key}>
                {control.id} · {control.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
          Selected Control / Reviewer Checklist
        </p>
        <h3 className="mt-2 text-xl font-bold text-white">
          {selectedControl.id} · {selectedControl.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {selectedControl.testing}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          <span className="font-semibold text-slate-300">Artifacts: </span>
          {selectedControl.artifacts}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-cyan-300">
            {selectedControl.section}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm text-slate-400">
            Status
          </span>
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm text-slate-400">
            Risk
          </span>
          <select
            name="severity"
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value as typeof severity)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          >
            {severities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span className="mb-2 block text-sm text-slate-400">
          Reviewer Comment
        </span>
        <textarea
          name="reviewerComment"
          value={reviewerComment}
          onChange={(event) =>
            setReviewerComment(event.target.value)
          }
          rows={5}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          placeholder="Example: Application allows special input in the search field; server does not reject unexpected characters."
        />
      </label>

      <label>
        <span className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <ImagePlus size={16} />
          Evidence Images
        </span>
        <input
          type="file"
          name="evidenceImages"
          accept="image/*"
          multiple
          className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300"
        />
        <span className="mt-2 block text-xs text-slate-500">
          Images are recorded as evidence filenames in this version; full
          attachment storage can be wired to object storage later.
        </span>
      </label>

      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white">
              <Sparkles size={18} className="text-purple-300" />
              AI Analyze
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Uses the selected control result and reviewer comment to draft impact,
              evidence interpretation, and remediation details.
            </p>
          </div>
          <button
            type="button"
            onClick={analyzeWithAi}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60"
          >
            <Bot size={16} />
            {isPending ? "Analyzing..." : "AI Analyze"}
          </button>
        </div>

        <textarea
          name="aiAnalysis"
          value={aiAnalysis}
          onChange={(event) =>
            setAiAnalysis(event.target.value)
          }
          rows={5}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          placeholder="AI-generated control-result details will appear here. You can edit before saving."
        />
      </div>

      <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 md:w-fit">
        Save Control Result to SR
      </button>
    </form>
  );
}

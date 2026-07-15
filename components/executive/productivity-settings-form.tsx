"use client";

import { useActionState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";

import {
  ProductivitySettingsActionState,
  saveProductivitySettings,
} from "@/app/(dashboard)/executive/actions";

type Settings = {
  adoptionUsers: number;
  hoursSavedPerUserPerDay: number;
  dedicatedReviewsPerWeek: number;
  augmentationReviewsPerWeek: number;
  peerReviewsPerWeek: number;
  retestsPerWeek: number;
  lastWeekUsers: number;
  lastWeekDedicatedReviews: number;
  lastWeekAugmentationReviews: number;
  lastWeekPeerReviews: number;
  lastWeekRetests: number;
  lastYearUsers: number;
  lastYearDedicatedReviews: number;
  lastYearAugmentationReviews: number;
  lastYearPeerReviews: number;
  lastYearRetests: number;
  validatorHoursPerReview: number;
  reviewerHoursPerReview: number;
  peerReviewerHoursPerReview: number;
  governanceHoursPerReview: number;
  retesterHoursPerReview: number;
  workdayHours: number;
  workdaysPerWeek: number;
  workingWeeksPerYear: number;
  fteAnnualWorkingHours: number;
  updatedAt: Date | null;
  updatedBy: string | null;
};

const initialState: ProductivitySettingsActionState = {
  status: "idle",
  message: "",
};

function NumberInput({
  label,
  name,
  value,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      <div className="flex rounded-xl border border-slate-700 bg-slate-950 focus-within:border-cyan-400">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
          defaultValue={value}
          max={max}
          min={min}
          name={name}
          required
          step={step}
          type="number"
        />
        {suffix ? (
          <span className="flex items-center border-l border-slate-800 px-3 text-xs text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

export default function ProductivitySettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(
    saveProductivitySettings,
    initialState,
  );

  return (
    <details className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-white">
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="text-cyan-300" size={17} />
          Customize capacity assumptions
        </span>
        <span className="text-xs font-normal text-slate-500">
          {settings.updatedAt
            ? `Saved ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(settings.updatedAt)}`
            : "Using default scenario"}
        </span>
      </summary>

      <form action={formAction} className="border-t border-cyan-400/10 p-4">
        <div className="grid gap-5 xl:grid-cols-3">
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
              Volume and adoption
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput label="Users" name="adoptionUsers" value={settings.adoptionUsers} />
              <NumberInput label="Dedicated reviews" name="dedicatedReviewsPerWeek" value={settings.dedicatedReviewsPerWeek} suffix="/wk" />
              <NumberInput label="Augmentation reviews" name="augmentationReviewsPerWeek" value={settings.augmentationReviewsPerWeek} suffix="/wk" />
              <NumberInput label="Peer reviews" name="peerReviewsPerWeek" value={settings.peerReviewsPerWeek} suffix="/wk" />
              <NumberInput label="Retests" name="retestsPerWeek" value={settings.retestsPerWeek} suffix="/wk" />
              <NumberInput label="Saved per user/day" name="hoursSavedPerUserPerDay" step={0.05} value={settings.hoursSavedPerUserPerDay} suffix="hrs" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
              Hours saved per review
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput label="Reviewer intake" name="validatorHoursPerReview" step={0.05} value={settings.validatorHoursPerReview} suffix="hrs" />
              <NumberInput label="Pool reviewer" name="reviewerHoursPerReview" step={0.05} value={settings.reviewerHoursPerReview} suffix="hrs" />
              <NumberInput label="Peer reviewer" name="peerReviewerHoursPerReview" step={0.05} value={settings.peerReviewerHoursPerReview} suffix="hrs" />
              <NumberInput label="Governance team" name="governanceHoursPerReview" step={0.05} value={settings.governanceHoursPerReview} suffix="hrs" />
              <NumberInput label="Retester" name="retesterHoursPerReview" step={0.05} value={settings.retesterHoursPerReview} suffix="hrs" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
              Working calendar
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput label="Hours/day" max={24} min={1} name="workdayHours" step={0.5} value={settings.workdayHours} />
              <NumberInput label="Days/week" max={7} min={1} name="workdaysPerWeek" value={settings.workdaysPerWeek} />
              <NumberInput label="Weeks/year" max={52} min={1} name="workingWeeksPerYear" value={settings.workingWeeksPerYear} />
              <NumberInput label="Hours/FTE-year" min={1} name="fteAnnualWorkingHours" step={1} value={settings.fteAnnualWorkingHours} />
            </div>
          </fieldset>
        </div>

        <details className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Comparison baselines
            <span className="ml-2 text-xs font-normal text-slate-500">
              Enter actual counts for trend calculations
            </span>
          </summary>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {[
              {
                title: "Last week",
                fields: [
                  ["Users", "lastWeekUsers", settings.lastWeekUsers],
                  ["Dedicated reviews", "lastWeekDedicatedReviews", settings.lastWeekDedicatedReviews],
                  ["Augmentation reviews", "lastWeekAugmentationReviews", settings.lastWeekAugmentationReviews],
                  ["Peer reviews", "lastWeekPeerReviews", settings.lastWeekPeerReviews],
                  ["Retests", "lastWeekRetests", settings.lastWeekRetests],
                ] as const,
              },
              {
                title: "Last-year weekly average",
                fields: [
                  ["Users", "lastYearUsers", settings.lastYearUsers],
                  ["Dedicated reviews", "lastYearDedicatedReviews", settings.lastYearDedicatedReviews],
                  ["Augmentation reviews", "lastYearAugmentationReviews", settings.lastYearAugmentationReviews],
                  ["Peer reviews", "lastYearPeerReviews", settings.lastYearPeerReviews],
                  ["Retests", "lastYearRetests", settings.lastYearRetests],
                ] as const,
              },
            ].map((group) => (
              <fieldset key={group.title}>
                <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                  {group.title}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.fields.map(([label, name, value]) => (
                    <NumberInput key={name} label={label} name={name} value={value} />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </details>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
            {state.message || "Saving updates the shared executive scenario for all authorized users."}
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <Save size={16} />
            {pending ? "Saving…" : "Save and recalculate"}
          </button>
        </div>
      </form>
    </details>
  );
}

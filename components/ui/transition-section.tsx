import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  eyebrow?: string;
  helper?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
};

export default function TransitionSection({
  title,
  eyebrow,
  helper,
  defaultOpen = false,
  action,
  children,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-3xl border border-slate-800 bg-slate-900/70 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-950/20 open:border-cyan-500/20 open:bg-slate-900"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 marker:hidden">
        <div>
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
          {helper && (
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
              {helper}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-950 text-cyan-200 transition-transform duration-300 group-open:rotate-180">
            <ChevronDown size={18} />
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-800 p-5 pt-4">{children}</div>
    </details>
  );
}

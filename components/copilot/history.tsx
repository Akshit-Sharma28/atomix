import { Clock3, MessageSquareText } from "lucide-react";

interface Props {
  history: {
    id: string;
    question: string;
    answer: string;
  }[];
}

function preview(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 170);
}

export default function History({ history }: Props) {
  const recent = history.slice(0, 5);

  return (
    <aside className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            <Clock3 size={16} />
            Last 5
          </div>
          <h2 className="text-2xl font-bold text-white">Recent Questions</h2>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-400">
          {recent.length}/5
        </span>
      </div>

      <div className="space-y-3">
        {recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">
            No Copilot questions yet.
          </div>
        )}

        {recent.map((item, index) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <MessageSquareText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Question {index + 1}
                </p>
                <p className="mt-1 line-clamp-2 font-semibold text-white">
                  {item.question}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                  {preview(item.answer)}
                  {item.answer.length > 170 ? "..." : ""}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

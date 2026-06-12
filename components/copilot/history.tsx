interface Props {
  history: {
    id: string;
    question: string;
    answer: string;
  }[];
}

export default function History({
  history,
}: Props) {
  return (
    <div
      className="
      bg-slate-900
      border
      border-slate-800
      rounded-2xl
      p-6
      "
    >
      <h2 className="text-xl font-bold mb-4">
        Recent Questions
      </h2>

      <div className="space-y-4">

        {history.map((item) => (
          <div
            key={item.id}
            className="
            border-b
            border-slate-800
            pb-3
            "
          >
            <p className="font-medium">
              {item.question}
            </p>

            <p className="text-slate-400 text-sm mt-2">
              {item.answer}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}
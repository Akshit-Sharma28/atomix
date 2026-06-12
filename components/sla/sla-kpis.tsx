interface Props {
  metrics: {
    total: number;
    overdue: number;
    dueSoon: number;
    compliancePercent: number;
  };
}

export default function SLAKPIs({
  metrics,
}: Props) {
  const cards = [
    {
      title: "Total Findings",
      value: metrics.total,
      color: "cyan",
    },
    {
      title: "Overdue",
      value: metrics.overdue,
      color: "red",
    },
    {
      title: "Due This Week",
      value: metrics.dueSoon,
      color: "orange",
    },
    {
      title: "SLA Compliance",
      value: `${metrics.compliancePercent}%`,
      color: "green",
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <p className="text-slate-400">
            {card.title}
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}
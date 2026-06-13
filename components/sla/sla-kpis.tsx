interface Props {
  metrics: {
    total: number;
    activeFindings: number;
    overdue: number;
    dueSoon: number;
    compliancePercent: number;
    activeReviews: number;
    overdueReviews: number;
    unassignedReviews: number;
    extensionRequests: number;
  };
}

export default function SLAKPIs({
  metrics,
}: Props) {
  const cards = [
    {
      title: "Active Findings",
      value: metrics.activeFindings,
      color: "text-cyan-300",
    },
    {
      title: "Overdue Findings",
      value: metrics.overdue,
      color: "text-red-300",
    },
    {
      title: "Findings Due 7d",
      value: metrics.dueSoon,
      color: "text-orange-300",
    },
    {
      title: "SLA Compliance",
      value: `${metrics.compliancePercent}%`,
      color: "text-emerald-300",
    },
    {
      title: "Active SRs",
      value: metrics.activeReviews,
      color: "text-purple-300",
    },
    {
      title: "Overdue SRs",
      value: metrics.overdueReviews,
      color: "text-red-300",
    },
    {
      title: "Unassigned SRs",
      value: metrics.unassignedReviews,
      color: "text-yellow-300",
    },
    {
      title: "Extensions",
      value: metrics.extensionRequests,
      color: "text-pink-300",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
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
          <p className="text-sm text-slate-400">
            {card.title}
          </p>

          <h2 className={`text-4xl font-bold mt-2 ${card.color}`}>
            {card.value}
          </h2>

          {card.title ===
            "Active Findings" && (
            <p className="mt-2 text-xs text-slate-500">
              {metrics.total} total tracked
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

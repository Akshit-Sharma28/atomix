import StatCard from "./stat-card";

interface Props {
  metrics: {
    total: number;
    critical: number;
    high: number;
    open: number;
    closed: number;
    role?: {
      cards: {
        title: string;
        value: number;
        variant: string;
      }[];
    };
  };
}

export default function KPIGrid({
  metrics,
}: Props) {
  const cards = metrics.role?.cards ?? [
    {
      title: "Total Findings",
      value: metrics.total,
      variant: "default",
    },
    {
      title: "Critical",
      value: metrics.critical,
      variant: "critical",
    },
    {
      title: "High",
      value: metrics.high,
      variant: "high",
    },
    {
      title: "Open",
      value: metrics.open,
      variant: "open",
    },
    {
      title: "Closed",
      value: metrics.closed,
      variant: "closed",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          variant={card.variant}
        />
      ))}
    </div>
  );
}

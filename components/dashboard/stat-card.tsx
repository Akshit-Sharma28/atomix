import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Bug,
} from "lucide-react";

interface Props {
  title: string;
  value: number;
  variant?: string;
}

export default function StatCard({
  title,
  value,
  variant = "default",
}: Props) {
  const styles = {
    default: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      icon: <Bug size={18} />,
    },

    critical: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
      icon: <ShieldAlert size={18} />,
    },

    high: {
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      icon: <AlertTriangle size={18} />,
    },

    open: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      icon: <Activity size={18} />,
    },

    closed: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      text: "text-green-400",
      icon: <ShieldCheck size={18} />,
    },
  };

  const style =
    styles[variant as keyof typeof styles] ||
    styles.default;

  return (
    <div
      className={`
        ${style.bg}
        ${style.border}
        border
        rounded-2xl
        p-4
        min-h-[110px]
        transition-all
        duration-300
        hover:scale-[1.01]
        hover:shadow-lg
        hover:shadow-cyan-500/10
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="
          text-slate-400
          text-sm
          font-medium
          "
        >
          {title}
        </h3>

        <div className={style.text}>
          {style.icon}
        </div>
      </div>

      <div
        className={`
          text-2xl
          font-bold
          ${style.text}
        `}
      >
        {value}
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>Live database count</span>
      </div>
    </div>
  );
}

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
      icon: <Bug size={22} />,
    },

    critical: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
      icon: <ShieldAlert size={22} />,
    },

    high: {
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      icon: <AlertTriangle size={22} />,
    },

    open: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      icon: <Activity size={22} />,
    },

    closed: {
      border: "border-green-500/30",
      bg: "bg-green-500/10",
      text: "text-green-400",
      icon: <ShieldCheck size={22} />,
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
        p-6
        transition-all
        duration-300
        hover:scale-[1.02]
        hover:shadow-lg
        hover:shadow-cyan-500/10
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium">
          {title}
        </h3>

        <div className={style.text}>
          {style.icon}
        </div>
      </div>

      <div
        className={`
          text-5xl
          font-bold
          ${style.text}
        `}
      >
        {value}
      </div>
    </div>
  );
}
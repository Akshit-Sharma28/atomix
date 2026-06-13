"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const severityData = [
  { name: "Critical", value: 12 },
  { name: "High", value: 24 },
  { name: "Medium", value: 35 },
  { name: "Low", value: 18 },
];

const trendData = [
  { month: "Jan", findings: 10 },
  { month: "Feb", findings: 22 },
  { month: "Mar", findings: 18 },
  { month: "Apr", findings: 35 },
  { month: "May", findings: 28 },
  { month: "Jun", findings: 40 },
];

const COLORS = [
  "#ef4444",
  "#f97316",
  "#06b6d4",
  "#22c55e",
];

export default function DashboardCharts() {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-4 mt-5">
      {/* Severity Distribution */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/10
        rounded-2xl
        p-4
        atomix-glow
        "
      >
        <h3
          className="
          text-lg
          font-semibold
          text-white
          mb-4
          "
        >
          Severity Distribution
        </h3>

        <div className="h-[210px] min-h-[210px] w-full min-w-0 overflow-hidden">
          {mounted ? (
            <div className="flex h-full items-center justify-center">
              <PieChart
                width={420}
                height={210}
                margin={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              >
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={70}
                  innerRadius={32}
                >
                  {severityData.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: "12px",
                }}
              />
              </PieChart>
            </div>
          ) : (
            <div className="h-full rounded-xl bg-slate-950/70" />
          )}
        </div>
      </div>

      {/* Findings Trend */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/10
        rounded-2xl
        p-4
        atomix-glow
        "
      >
        <h3
          className="
          text-lg
          font-semibold
          text-white
          mb-4
          "
        >
          Findings Trend
        </h3>

        <div className="h-[210px] min-h-[210px] w-full min-w-0 overflow-hidden">
          {mounted ? (
            <div className="flex h-full items-center justify-center">
              <LineChart
                data={trendData}
                width={500}
                height={210}
              >
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="findings"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </div>
          ) : (
            <div className="h-full rounded-xl bg-slate-950/70" />
          )}
        </div>
      </div>
    </div>
  );
}

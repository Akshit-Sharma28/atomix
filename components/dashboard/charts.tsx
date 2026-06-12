"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
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
  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-8">

      {/* Severity Distribution */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/10
        rounded-2xl
        p-6
        atomix-glow
        "
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Severity Distribution
        </h3>

        <div className="h-[350px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={50}
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings Trend */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/10
        rounded-2xl
        p-6
        atomix-glow
        "
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Findings Trend
        </h3>

        <div className="h-[350px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={trendData}>
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
              />

              <YAxis
                stroke="#94a3b8"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="findings"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
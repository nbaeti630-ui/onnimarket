"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const chart = data.map((v, i) => ({ i, v }));
  const color = up ? "#22e0a1" : "#ff5d7a";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const gid = up ? "spark-up" : "spark-down";
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart} margin={ { top: 2, bottom: 2, left: 0, right: 0 } }>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min, max]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={"url(#" + gid + ")"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

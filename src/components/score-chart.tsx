"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Series = { key: string; label: string };

export type ChartPoint = { label: string } & Record<string, number | string | null>;

// 영역별 고정 색상. 학생이 바뀌어도 같은 영역은 같은 색을 유지합니다.
const COLORS: Record<string, string> = {
  reading: "#4f46e5",
  listening: "#0891b2",
  speaking: "#db2777",
  writing: "#ea580c",
  debate: "#0d9488",
  grammar: "#65a30d",
  vocabulary: "#7c3aed",
  quizScore: "#4f46e5",
  testScore: "#db2777",
  totalScore: "#4f46e5",
};

const FALLBACK = ["#4f46e5", "#db2777", "#ea580c", "#0891b2", "#65a30d", "#7c3aed"];

export function ScoreChart({
  data,
  series,
  height = 288,
}: {
  data: ChartPoint[];
  series: Series[];
  height?: number;
}) {
  // 한 번도 값이 없는 계열은 범례에서 뺍니다.
  const active = series.filter((s) =>
    data.some((p) => p[s.key] !== null && p[s.key] !== undefined),
  );

  if (active.length === 0) return null;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={8} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} width={44} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {active.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={COLORS[s.key] ?? FALLBACK[i % FALLBACK.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              // 점수를 매기지 않은 회차에서 선이 끊기지 않게 이어 그립니다.
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

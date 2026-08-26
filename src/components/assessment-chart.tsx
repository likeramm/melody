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

import { SKILL_AREAS } from "@/lib/labels";

export type ChartPoint = {
  label: string; // x축 라벨 (평가 일자)
  reading: number | null;
  listening: number | null;
  speaking: number | null;
  writing: number | null;
  grammar: number | null;
  vocabulary: number | null;
};

// 영역별 고정 색상. 학생이 바뀌어도 같은 영역은 같은 색을 유지합니다.
const SERIES_COLOR: Record<string, string> = {
  reading: "#4f46e5",
  listening: "#0891b2",
  speaking: "#db2777",
  writing: "#ea580c",
  grammar: "#65a30d",
  vocabulary: "#7c3aed",
};

export function AssessmentChart({ data }: { data: ChartPoint[] }) {
  // 전 회차에서 한 번도 점수가 없는 영역은 범례에서 제외합니다.
  const activeAreas = SKILL_AREAS.filter((area) =>
    data.some((point) => point[area.key] !== null && point[area.key] !== undefined),
  );

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={8} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} width={44} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {activeAreas.map((area) => (
            <Line
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label}
              stroke={SERIES_COLOR[area.key]}
              strokeWidth={2}
              dot={{ r: 3 }}
              // 미응시 회차는 선을 끊지 않고 이어 그립니다.
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useActionState } from "react";

import { FormError, SubmitButton } from "@/components/form";
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_ORDER, SKILL_AREAS } from "@/lib/labels";

import { saveSessionRecords, type FormState } from "./actions";

export type RecordRow = {
  id: string;
  studentName: string;
  attendance: string;
  homeworkSubmitted: boolean | null;
  quizScore: number | null;
  testScore: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  debate: number | null;
  teacherComment: string | null;
};

const CELL =
  "w-full rounded border border-border bg-white px-2 py-1 text-sm outline-none focus:border-brand-400";

function ScoreCell({ name, value }: { name: string; value: number | null }) {
  return (
    <input
      name={name}
      type="number"
      min={0}
      max={100}
      inputMode="numeric"
      defaultValue={value ?? ""}
      className={`${CELL} w-16 tabular-nums`}
    />
  );
}

/**
 * 수업 1회의 학생 기록을 표로 한 번에 입력합니다.
 * 저장하면 각 학생의 progress 에 그대로 누적됩니다.
 */
export function RecordTable({ sessionId, rows }: { sessionId: string; rows: RecordRow[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveSessionRecords, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="sessionId" value={sessionId} />

      <div className="table-scroll">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">학생</th>
              <th className="px-3 py-2 font-medium">출결</th>
              <th className="px-3 py-2 font-medium">과제</th>
              <th className="px-3 py-2 font-medium">Quiz</th>
              <th className="px-3 py-2 font-medium">Test</th>
              {SKILL_AREAS.map((a) => (
                <th key={a.key} className="px-3 py-2 font-medium">
                  {a.label}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">강사 코멘트</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.studentName}</td>
                <td className="px-3 py-2">
                  <select
                    name={`attendance__${r.id}`}
                    defaultValue={r.attendance}
                    className={`${CELL} w-24`}
                  >
                    {ATTENDANCE_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {ATTENDANCE_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    name={`homeworkSubmitted__${r.id}`}
                    defaultValue={
                      r.homeworkSubmitted === null ? "" : r.homeworkSubmitted ? "yes" : "no"
                    }
                    className={`${CELL} w-20`}
                  >
                    <option value="">—</option>
                    <option value="yes">제출</option>
                    <option value="no">미제출</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <ScoreCell name={`quizScore__${r.id}`} value={r.quizScore} />
                </td>
                <td className="px-3 py-2">
                  <ScoreCell name={`testScore__${r.id}`} value={r.testScore} />
                </td>
                {SKILL_AREAS.map((a) => (
                  <td key={a.key} className="px-3 py-2">
                    <ScoreCell name={`${a.key}__${r.id}`} value={r[a.key]} />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <input
                    name={`teacherComment__${r.id}`}
                    defaultValue={r.teacherComment ?? ""}
                    className={`${CELL} min-w-56`}
                  />
                  {/* 학부모 피드백은 화면을 좁히지 않도록 코멘트와 같은 칸에 숨겨 보냅니다. */}
                  <input type="hidden" name={`parentFeedback__${r.id}`} value="" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <FormError message={state.error} />
        {state.ok && !state.error && (
          <p className="text-sm text-emerald-700">저장했습니다. 학생별 기록에 반영됐습니다.</p>
        )}
        <SubmitButton>기록 저장</SubmitButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { CONSULTATION_TYPE_LABEL, ENGLISH_LEVEL_LABEL } from "@/lib/labels";

import { submitApplication, type ApplyState } from "./actions";

const FIELD =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

const TYPES = ["NEW_INQUIRY", "ADMISSION_TEST", "PROGRESS_REVIEW", "RE_ENROLLMENT"] as const;
const LEVELS = [
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "UPPER_INTERMEDIATE",
  "ADVANCED",
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "접수 중…" : "상담 신청하기"}
    </button>
  );
}

export function ApplyForm() {
  const [state, formAction] = useActionState<ApplyState, FormData>(submitApplication, {});

  if (state.ok) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center">
        <p className="text-base font-semibold text-emerald-800">상담 신청이 접수되었습니다.</p>
        <p className="mt-1.5 text-sm text-emerald-700">
          담당자가 확인 후 입력하신 연락처로 예약 시간을 안내드립니다.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold">학생 정보</legend>

        <div>
          <label htmlFor="studentName" className="mb-1.5 block text-sm font-medium">
            학생 이름 <span className="text-rose-600">*</span>
          </label>
          <input id="studentName" name="studentName" required maxLength={40} className={FIELD} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="grade" className="mb-1.5 block text-sm font-medium">
              학년
            </label>
            <input id="grade" name="grade" placeholder="예: 초5" maxLength={20} className={FIELD} />
          </div>
          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm font-medium">
              현재 영어 수준
            </label>
            <select id="level" name="level" defaultValue="" className={FIELD}>
              <option value="">선택 안 함</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {ENGLISH_LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-border pt-4">
        <legend className="mb-2 text-sm font-semibold">학부모 정보</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parentName" className="mb-1.5 block text-sm font-medium">
              성함 <span className="text-rose-600">*</span>
            </label>
            <input id="parentName" name="parentName" required maxLength={40} className={FIELD} />
          </div>
          <div>
            <label htmlFor="parentPhone" className="mb-1.5 block text-sm font-medium">
              연락처 <span className="text-rose-600">*</span>
            </label>
            <input
              id="parentPhone"
              name="parentPhone"
              required
              inputMode="tel"
              placeholder="010-0000-0000"
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label htmlFor="parentEmail" className="mb-1.5 block text-sm font-medium">
            이메일
          </label>
          <input
            id="parentEmail"
            name="parentEmail"
            type="email"
            inputMode="email"
            className={FIELD}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-border pt-4">
        <legend className="mb-2 text-sm font-semibold">상담 희망 사항</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
              상담 유형
            </label>
            <select id="type" name="type" defaultValue="NEW_INQUIRY" className={FIELD}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONSULTATION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="preferredAt" className="mb-1.5 block text-sm font-medium">
              희망 일시
            </label>
            <input id="preferredAt" name="preferredAt" type="datetime-local" className={FIELD} />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
            남기실 말씀
          </label>
          <textarea id="message" name="message" rows={4} maxLength={1000} className={FIELD} />
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-muted">
        제출하신 정보는 상담 목적으로만 이용되며 상담 종료 후 관련 법령에 따라 관리됩니다.
      </p>
    </form>
  );
}

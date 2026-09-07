"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  Field,
  FormError,
  Input,
  Select,
  SubmitButton,
  Textarea,
  optionsFrom,
} from "@/components/form";
import { Card } from "@/components/ui";
import { STUDENT_STATUS_LABEL, STUDENT_STATUS_ORDER } from "@/lib/labels";

import { updateStudent, type FormState } from "./actions";

const STATUS_OPTIONS = optionsFrom(STUDENT_STATUS_ORDER, STUDENT_STATUS_LABEL);

export type StudentEditValues = {
  id: string;
  name: string;
  school: string | null;
  grade: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  firstInquiryAt: string;
  consultedAt: string;
  assessedAt: string;
  enrolledAt: string;
  nextContactAt: string;
  consultationNote: string | null;
  assessmentResult: string | null;
  level: string | null;
  evaluation: string | null;
  recommendedClass: string | null;
  notEnrolledReason: string | null;
  nextGoal: string | null;
  memo: string | null;
  classGroupId: string | null;
};

/**
 * 학생 정보 전체 수정.
 * 평소에는 접혀 있고, 고칠 때만 펴서 쓰도록 했습니다.
 */
export function StudentEditForm({
  student,
  classGroups,
}: {
  student: StudentEditValues;
  classGroups: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateStudent, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Pencil size={14} aria-hidden />
        정보 수정
      </button>
    );
  }

  return (
    <Card className="mb-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={student.id} />

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">학생 정보 수정</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="이름" htmlFor="e-name" required>
            <Input id="e-name" name="name" required defaultValue={student.name} maxLength={40} />
          </Field>
          <Field label="학교" htmlFor="e-school">
            <Input id="e-school" name="school" defaultValue={student.school ?? ""} />
          </Field>
          <Field label="학년" htmlFor="e-grade">
            <Input id="e-grade" name="grade" defaultValue={student.grade ?? ""} />
          </Field>
          <Field label="연락처" htmlFor="e-phone">
            <Input id="e-phone" name="phone" defaultValue={student.phone ?? ""} inputMode="tel" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="상태" htmlFor="e-status">
            <Select
              id="e-status"
              name="status"
              defaultValue={student.status}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="어디서 알게 됐는지" htmlFor="e-source">
            <Input id="e-source" name="source" defaultValue={student.source ?? ""} />
          </Field>
          <Field label="수강반" htmlFor="e-class">
            <Select
              id="e-class"
              name="classGroupId"
              defaultValue={student.classGroupId ?? ""}
              placeholder="선택 안 함"
              options={classGroups.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="추천반" htmlFor="e-rec">
            <Input
              id="e-rec"
              name="recommendedClass"
              defaultValue={student.recommendedClass ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="최초 문의일" htmlFor="e-first">
            <Input
              id="e-first"
              name="firstInquiryAt"
              type="date"
              defaultValue={student.firstInquiryAt}
            />
          </Field>
          <Field label="상담일" htmlFor="e-consult">
            <Input
              id="e-consult"
              name="consultedAt"
              type="date"
              defaultValue={student.consultedAt}
            />
          </Field>
          <Field label="시험 · 인터뷰일" htmlFor="e-assess">
            <Input id="e-assess" name="assessedAt" type="date" defaultValue={student.assessedAt} />
          </Field>
          <Field label="등록일" htmlFor="e-enroll">
            <Input id="e-enroll" name="enrolledAt" type="date" defaultValue={student.enrolledAt} />
          </Field>
          <Field label="추후 연락일" htmlFor="e-next">
            <Input
              id="e-next"
              name="nextContactAt"
              type="date"
              defaultValue={student.nextContactAt}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="레벨" htmlFor="e-level">
            <Input id="e-level" name="level" defaultValue={student.level ?? ""} />
          </Field>
          <Field label="평가" htmlFor="e-eval">
            <Input id="e-eval" name="evaluation" defaultValue={student.evaluation ?? ""} />
          </Field>
        </div>

        <Field label="현재 학습 목표" htmlFor="e-goal">
          <Input id="e-goal" name="nextGoal" defaultValue={student.nextGoal ?? ""} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="상담 내용" htmlFor="e-cnote">
            <Textarea
              id="e-cnote"
              name="consultationNote"
              rows={3}
              defaultValue={student.consultationNote ?? ""}
            />
          </Field>
          <Field label="시험 결과" htmlFor="e-ares">
            <Textarea
              id="e-ares"
              name="assessmentResult"
              rows={3}
              defaultValue={student.assessmentResult ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="미등록 사유" htmlFor="e-reason">
            <Textarea
              id="e-reason"
              name="notEnrolledReason"
              rows={2}
              defaultValue={student.notEnrolledReason ?? ""}
            />
          </Field>
          <Field label="메모" htmlFor="e-memo">
            <Textarea id="e-memo" name="memo" rows={2} defaultValue={student.memo ?? ""} />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <SubmitButton>저장</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

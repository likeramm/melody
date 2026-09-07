"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

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
import {
  ASSESSMENT_AREAS,
  ASSESSMENT_DECISION_LABEL,
  CONTACT_TYPE_LABEL,
  CONTACT_TYPE_ORDER,
  GUARDIAN_RELATION_LABEL,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUS_ORDER,
} from "@/lib/labels";

import { addAssessment, addGuardian, addPortfolio, createStudent, type FormState } from "./actions";

const STATUS_OPTIONS = optionsFrom(STUDENT_STATUS_ORDER, STUDENT_STATUS_LABEL);
const RELATION_OPTIONS = optionsFrom(["MOTHER", "FATHER", "OTHER"] as const, GUARDIAN_RELATION_LABEL);
const DECISION_OPTIONS = optionsFrom(
  ["PASS", "CONDITIONAL", "FAIL"] as const,
  ASSESSMENT_DECISION_LABEL,
);

export const CONTACT_OPTIONS = optionsFrom(CONTACT_TYPE_ORDER, CONTACT_TYPE_LABEL);

/** 접었다 펴는 폼 껍데기. 저장에 성공하면 자동으로 접힙니다. */
function Collapsible({
  label,
  open,
  setOpen,
  title,
  children,
}: {
  label: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={15} aria-hidden />
        {label}
      </button>
    );
  }
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      {children}
    </Card>
  );
}

// ── 신규 학생 / 상담자 ───────────────────────────────────────

export function NewStudentForm({ classGroups }: { classGroups: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createStudent, {});
  if (state.ok && open) setOpen(false);

  return (
    <Collapsible
      label="학생 · 상담자 추가"
      title="새 학생 / 상담자"
      open={open}
      setOpen={setOpen}
    >
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="이름" htmlFor="name" required>
            <Input id="name" name="name" required maxLength={40} autoFocus />
          </Field>
          <Field label="학교" htmlFor="school">
            <Input id="school" name="school" />
          </Field>
          <Field label="학년" htmlFor="grade">
            <Input id="grade" name="grade" placeholder="예: 초5" />
          </Field>
          <Field label="연락처" htmlFor="phone">
            <Input id="phone" name="phone" inputMode="tel" placeholder="010-0000-0000" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="상태" htmlFor="status">
            <Select id="status" name="status" defaultValue="NEW_INQUIRY" options={STATUS_OPTIONS} />
          </Field>
          <Field label="어디서 알게 됐는지" htmlFor="source">
            <Input id="source" name="source" placeholder="예: 지인 소개 / 블로그" />
          </Field>
          <Field label="최초 문의일" htmlFor="firstInquiryAt" hint="비우면 오늘로 기록됩니다.">
            <Input id="firstInquiryAt" name="firstInquiryAt" type="date" />
          </Field>
          <Field label="수강반" htmlFor="classGroupId">
            <Select
              id="classGroupId"
              name="classGroupId"
              placeholder="선택 안 함"
              options={classGroups.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="보호자 이름" htmlFor="guardianName">
            <Input id="guardianName" name="guardianName" />
          </Field>
          <Field label="보호자 연락처" htmlFor="guardianPhone">
            <Input id="guardianPhone" name="guardianPhone" inputMode="tel" />
          </Field>
          <Field label="관계" htmlFor="guardianRelation">
            <Select
              id="guardianRelation"
              name="guardianRelation"
              defaultValue="MOTHER"
              options={RELATION_OPTIONS}
            />
          </Field>
        </div>

        <Field label="상담 내용" htmlFor="consultationNote">
          <Textarea id="consultationNote" name="consultationNote" rows={2} />
        </Field>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Collapsible>
  );
}

// ── 입학시험 / 인터뷰 기록 ───────────────────────────────────

export function NewAssessmentForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addAssessment, {});
  if (state.ok && open) setOpen(false);

  return (
    <Collapsible label="입학시험 · 인터뷰 기록" title="시험 기록" open={open} setOpen={setOpen}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="studentId" value={studentId} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="시험일" htmlFor="takenAt" required>
            <Input id="takenAt" name="takenAt" type="date" required />
          </Field>
          <Field label="결과" htmlFor="decision">
            <Select id="decision" name="decision" placeholder="미정" options={DECISION_OPTIONS} />
          </Field>
          <Field label="결과 전달일" htmlFor="deliveredAt">
            <Input id="deliveredAt" name="deliveredAt" type="date" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ASSESSMENT_AREAS.map((a) => (
            <Field key={a.key} label={a.label} htmlFor={a.key}>
              <Input id={a.key} name={a.key} type="number" min={0} max={100} inputMode="numeric" />
            </Field>
          ))}
        </div>

        <Field label="시험 결과" htmlFor="resultSummary">
          <Textarea id="resultSummary" name="resultSummary" rows={2} />
        </Field>
        <Field label="인터뷰 내용" htmlFor="interviewNote">
          <Textarea id="interviewNote" name="interviewNote" rows={2} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="추천 의견" htmlFor="recommendation">
            <Input id="recommendation" name="recommendation" />
          </Field>
          <Field label="진단보고서 링크" htmlFor="reportUrl">
            <Input id="reportUrl" name="reportUrl" type="url" placeholder="https://" />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>기록</SubmitButton>
        </div>
      </form>
    </Collapsible>
  );
}

// ── 보호자 추가 ──────────────────────────────────────────────

export function NewGuardianForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addGuardian, {});
  if (state.ok && open) setOpen(false);

  return (
    <Collapsible label="보호자 추가" title="보호자" open={open} setOpen={setOpen}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="studentId" value={studentId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="이름" htmlFor="g-name" required>
            <Input id="g-name" name="name" required maxLength={40} />
          </Field>
          <Field label="관계" htmlFor="g-relation">
            <Select id="g-relation" name="relation" defaultValue="MOTHER" options={RELATION_OPTIONS} />
          </Field>
          <Field label="연락처" htmlFor="g-phone">
            <Input id="g-phone" name="phone" inputMode="tel" />
          </Field>
          <Field label="이메일" htmlFor="g-email">
            <Input id="g-email" name="email" type="email" />
          </Field>
        </div>
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Collapsible>
  );
}

// ── Portfolio ────────────────────────────────────────────────

export function NewPortfolioForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addPortfolio, {});
  if (state.ok && open) setOpen(false);

  return (
    <Collapsible label="Portfolio 결과물 추가" title="Portfolio" open={open} setOpen={setOpen}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="studentId" value={studentId} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="결과물 이름" htmlFor="p-title" required className="sm:col-span-2">
            <Input id="p-title" name="title" required maxLength={120} />
          </Field>
          <Field label="제작일" htmlFor="p-date">
            <Input id="p-date" name="producedAt" type="date" />
          </Field>
        </div>
        <Field label="링크" htmlFor="p-url">
          <Input id="p-url" name="url" type="url" placeholder="https://" />
        </Field>
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Collapsible>
  );
}

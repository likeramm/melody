"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, Textarea } from "@/components/form";
import { Card } from "@/components/ui";

import {
  createCurriculum,
  createLesson,
  createSemester,
  type FormState,
} from "./actions";

function Toggle({
  open,
  setOpen,
  label,
  title,
  compact,
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  label: string;
  title: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            : "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
        }
      >
        {compact ? label : (
          <>
            <Plus size={15} aria-hidden />
            {label}
          </>
        )}
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

export function NewSemesterForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createSemester, {});
  if (state.ok && open) setOpen(false);

  return (
    <Toggle open={open} setOpen={setOpen} label="+ 학기" title="새 학기" compact>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="학기 이름" htmlFor="sem-name" required>
            <Input id="sem-name" name="name" required maxLength={40} placeholder="2026-1" autoFocus />
          </Field>
          <Field label="시작일" htmlFor="sem-start">
            <Input id="sem-start" name="startDate" type="date" />
          </Field>
          <Field label="종료일" htmlFor="sem-end">
            <Input id="sem-end" name="endDate" type="date" />
          </Field>
        </div>
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

export function NewCurriculumForm({ semesters }: { semesters: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createCurriculum, {});
  if (state.ok && open) setOpen(false);

  return (
    <Toggle open={open} setOpen={setOpen} label="커리큘럼 추가" title="새 커리큘럼">
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="학기" htmlFor="cur-sem" required>
            <Select
              id="cur-sem"
              name="semesterId"
              required
              placeholder="학기 선택"
              options={semesters.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Field label="커리큘럼 이름" htmlFor="cur-title" required>
            <Input id="cur-title" name="title" required maxLength={120} />
          </Field>
          <Field label="레벨" htmlFor="cur-level">
            <Input id="cur-level" name="level" placeholder="예: Intermediate" />
          </Field>
        </div>
        <Field label="설명" htmlFor="cur-desc">
          <Textarea id="cur-desc" name="description" rows={2} />
        </Field>
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

export function NewLessonForm({ curriculumId }: { curriculumId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createLesson, {});
  if (state.ok && open) setOpen(false);

  return (
    <Toggle open={open} setOpen={setOpen} label="수업 추가" title="새 수업">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="curriculumId" value={curriculumId} />

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="주차" htmlFor={`w-${curriculumId}`}>
            <Input id={`w-${curriculumId}`} name="week" type="number" min={1} inputMode="numeric" />
          </Field>
          <Field label="주제" htmlFor={`t-${curriculumId}`} required className="sm:col-span-3">
            <Input id={`t-${curriculumId}`} name="topic" required maxLength={200} />
          </Field>
        </div>

        <Field label="Learning Objective" htmlFor={`lo-${curriculumId}`}>
          <Textarea id={`lo-${curriculumId}`} name="learningObjective" rows={2} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Reading" htmlFor={`r-${curriculumId}`}>
            <Textarea id={`r-${curriculumId}`} name="reading" rows={2} />
          </Field>
          <Field label="Lecture" htmlFor={`lec-${curriculumId}`}>
            <Textarea id={`lec-${curriculumId}`} name="lecture" rows={2} />
          </Field>
          <Field label="Discussion Questions" htmlFor={`dq-${curriculumId}`}>
            <Textarea id={`dq-${curriculumId}`} name="discussionQuestions" rows={2} />
          </Field>
          <Field label="Writing" htmlFor={`wr-${curriculumId}`}>
            <Textarea id={`wr-${curriculumId}`} name="writing" rows={2} />
          </Field>
          <Field label="Student Portfolio" htmlFor={`sp-${curriculumId}`}>
            <Textarea id={`sp-${curriculumId}`} name="studentPortfolio" rows={2} />
          </Field>
          <Field label="Assignments" htmlFor={`as-${curriculumId}`}>
            <Textarea id={`as-${curriculumId}`} name="assignments" rows={2} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lecture PPT 링크" htmlFor={`ppt-${curriculumId}`}>
            <Input id={`ppt-${curriculumId}`} name="lecturePptUrl" type="url" placeholder="https://" />
          </Field>
          <Field label="Worksheet 링크" htmlFor={`ws-${curriculumId}`}>
            <Input id={`ws-${curriculumId}`} name="worksheetUrl" type="url" placeholder="https://" />
          </Field>
        </div>

        <Field label="Teacher Notes" htmlFor={`tn-${curriculumId}`}>
          <Textarea id={`tn-${curriculumId}`} name="teacherNotes" rows={2} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="사용한 날짜" htmlFor={`ud-${curriculumId}`}>
            <Input id={`ud-${curriculumId}`} name="usedAt" type="date" />
          </Field>
          <Field label="수정사항" htmlFor={`rn-${curriculumId}`}>
            <Input id={`rn-${curriculumId}`} name="revisionNote" />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, Textarea, useCloseOnSuccess } from "@/components/form";
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
  useCloseOnSuccess(state, () => setOpen(false));

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
  useCloseOnSuccess(state, () => setOpen(false));

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

export type LessonValues = {
  week: number | null;
  topic: string;
  learningObjective: string | null;
  reading: string | null;
  lecture: string | null;
  discussionQuestions: string | null;
  writing: string | null;
  studentPortfolio: string | null;
  lecturePptUrl: string | null;
  worksheetUrl: string | null;
  assignments: string | null;
  teacherNotes: string | null;
  usedAt: string;
  revisionNote: string | null;
};

/** 수업 추가·수정 창이 같은 칸을 쓰도록 묶어 둡니다. id 가 겹치지 않게 prefix 를 받습니다. */
export function LessonFields({ prefix, v }: { prefix: string; v?: LessonValues }) {
  const id = (k: string) => `${k}-${prefix}`;
  const text = (k: keyof LessonValues) => (v?.[k] as string | null | undefined) ?? "";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="주차" htmlFor={id("w")}>
          <Input
            id={id("w")}
            name="week"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={v?.week ?? ""}
          />
        </Field>
        <Field label="주제" htmlFor={id("t")} required className="sm:col-span-3">
          <Input id={id("t")} name="topic" required maxLength={200} defaultValue={text("topic")} />
        </Field>
      </div>

      <Field label="Learning Objective" htmlFor={id("lo")}>
        <Textarea
          id={id("lo")}
          name="learningObjective"
          rows={2}
          defaultValue={text("learningObjective")}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reading" htmlFor={id("r")}>
          <Textarea id={id("r")} name="reading" rows={2} defaultValue={text("reading")} />
        </Field>
        <Field label="Lecture" htmlFor={id("lec")}>
          <Textarea id={id("lec")} name="lecture" rows={2} defaultValue={text("lecture")} />
        </Field>
        <Field label="Discussion Questions" htmlFor={id("dq")}>
          <Textarea
            id={id("dq")}
            name="discussionQuestions"
            rows={2}
            defaultValue={text("discussionQuestions")}
          />
        </Field>
        <Field label="Writing" htmlFor={id("wr")}>
          <Textarea id={id("wr")} name="writing" rows={2} defaultValue={text("writing")} />
        </Field>
        <Field label="Student Portfolio" htmlFor={id("sp")}>
          <Textarea
            id={id("sp")}
            name="studentPortfolio"
            rows={2}
            defaultValue={text("studentPortfolio")}
          />
        </Field>
        <Field label="Assignments" htmlFor={id("as")}>
          <Textarea id={id("as")} name="assignments" rows={2} defaultValue={text("assignments")} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lecture PPT 링크" htmlFor={id("ppt")}>
          <Input
            id={id("ppt")}
            name="lecturePptUrl"
            type="url"
            placeholder="https://"
            defaultValue={text("lecturePptUrl")}
          />
        </Field>
        <Field label="Worksheet 링크" htmlFor={id("ws")}>
          <Input
            id={id("ws")}
            name="worksheetUrl"
            type="url"
            placeholder="https://"
            defaultValue={text("worksheetUrl")}
          />
        </Field>
      </div>

      <Field label="Teacher Notes" htmlFor={id("tn")}>
        <Textarea id={id("tn")} name="teacherNotes" rows={2} defaultValue={text("teacherNotes")} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="사용한 날짜" htmlFor={id("ud")}>
          <Input id={id("ud")} name="usedAt" type="date" defaultValue={text("usedAt")} />
        </Field>
        <Field label="수정사항" htmlFor={id("rn")}>
          <Input id={id("rn")} name="revisionNote" defaultValue={text("revisionNote")} />
        </Field>
      </div>
    </>
  );
}

export function NewLessonForm({ curriculumId }: { curriculumId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createLesson, {});
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <Toggle open={open} setOpen={setOpen} label="수업 추가" title="새 수업">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="curriculumId" value={curriculumId} />
        <LessonFields prefix={`new-${curriculumId}`} />
        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

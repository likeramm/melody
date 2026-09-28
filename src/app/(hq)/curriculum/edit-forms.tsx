"use client";

import { useActionState, useState } from "react";

import { Field, FormError, Input, Select, Textarea, useCloseOnSuccess } from "@/components/form";
import { Modal, ModalActions, PencilButton } from "@/components/modal";

import {
  deleteSemester,
  updateCurriculum,
  updateLesson,
  updateSemester,
  type FormState,
} from "./actions";
import { LessonFields, type LessonValues } from "./curriculum-forms";

type Option = { id: string; name: string };

// ── 학기 ─────────────────────────────────────────────────────

/** 학기 이름표. 누르면 이름·기간을 고치고, 비어 있는 학기는 지울 수 있습니다. */
export function SemesterChip({
  semester: s,
}: {
  semester: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    curriculumCount: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateSemester, {});
  const [delState, deleteAction] = useActionState<FormState, FormData>(deleteSemester, {});
  useCloseOnSuccess(state, () => setOpen(false));
  useCloseOnSuccess(delState, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="눌러서 수정"
        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-300 hover:bg-slate-50"
      >
        {s.name}
        <span className="ml-1.5 text-xs text-muted">{s.curriculumCount}</span>
      </button>
      {open && (
        <Modal title="학기 수정" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={s.id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="학기 이름" htmlFor={`sem-n-${s.id}`} required>
                <Input
                  id={`sem-n-${s.id}`}
                  name="name"
                  required
                  maxLength={40}
                  defaultValue={s.name}
                />
              </Field>
              <Field label="시작일" htmlFor={`sem-s-${s.id}`}>
                <Input
                  id={`sem-s-${s.id}`}
                  name="startDate"
                  type="date"
                  defaultValue={s.startDate}
                />
              </Field>
              <Field label="종료일" htmlFor={`sem-e-${s.id}`}>
                <Input id={`sem-e-${s.id}`} name="endDate" type="date" defaultValue={s.endDate} />
              </Field>
            </div>
            <FormError message={state.error} />
            <ModalActions onCancel={() => setOpen(false)} />
          </form>

          {/* 빈 학기만 지울 수 있습니다. 커리큘럼이 있으면 서버에서 거절합니다. */}
          <form
            action={deleteAction}
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
          >
            <input type="hidden" name="id" value={s.id} />
            <p className="text-xs text-muted">
              {s.curriculumCount > 0
                ? `커리큘럼 ${s.curriculumCount}개가 있어 지울 수 없습니다.`
                : "잘못 만든 빈 학기라면 지울 수 있습니다."}
            </p>
            {s.curriculumCount === 0 && (
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-rose-700 hover:border-rose-200 hover:bg-rose-50"
              >
                학기 삭제
              </button>
            )}
            <FormError message={delState.error} />
          </form>
        </Modal>
      )}
    </>
  );
}

// ── 커리큘럼 ─────────────────────────────────────────────────

export function CurriculumEditForm({
  curriculum: c,
  semesters,
}: {
  curriculum: {
    id: string;
    semesterId: string;
    title: string;
    level: string | null;
    description: string | null;
  };
  semesters: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateCurriculum, {});
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <PencilButton label={`${c.title} 수정`} onClick={() => setOpen(true)} size={15} />
      {open && (
        <Modal title="커리큘럼 수정" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="학기" htmlFor={`cu-s-${c.id}`} required hint="바꾸면 그 학기로 옮겨집니다.">
                <Select
                  id={`cu-s-${c.id}`}
                  name="semesterId"
                  required
                  defaultValue={c.semesterId}
                  options={semesters.map((s) => ({ value: s.id, label: s.name }))}
                />
              </Field>
              <Field label="커리큘럼 이름" htmlFor={`cu-t-${c.id}`} required>
                <Input
                  id={`cu-t-${c.id}`}
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={c.title}
                />
              </Field>
              <Field label="레벨" htmlFor={`cu-l-${c.id}`}>
                <Input id={`cu-l-${c.id}`} name="level" defaultValue={c.level ?? ""} />
              </Field>
            </div>
            <Field label="설명" htmlFor={`cu-d-${c.id}`}>
              <Textarea
                id={`cu-d-${c.id}`}
                name="description"
                rows={2}
                defaultValue={c.description ?? ""}
              />
            </Field>
            <FormError message={state.error} />
            <ModalActions onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

// ── 수업 (Lesson) ────────────────────────────────────────────

export function LessonEditForm({ lesson }: { lesson: LessonValues & { id: string } }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateLesson, {});
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <PencilButton label={`${lesson.topic} 수정`} onClick={() => setOpen(true)} />
      {open && (
        <Modal title="수업 수정" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={lesson.id} />
            <LessonFields prefix={`edit-${lesson.id}`} v={lesson} />
            <FormError message={state.error} />
            <ModalActions onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

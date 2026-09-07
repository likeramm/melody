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
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from "@/lib/labels";

import { createTask, updateTask, type TaskFormState } from "./actions";

const PRIORITY_OPTIONS = optionsFrom(TASK_PRIORITY_ORDER, TASK_PRIORITY_LABEL);
const STATUS_OPTIONS = optionsFrom(TASK_STATUS_ORDER, TASK_STATUS_LABEL);

export type TaskEditValues = {
  id: string;
  title: string;
  memo: string | null;
  priority: string;
  status: string;
  dueDate: string;
  projectId: string | null;
};

/** 목록에서 바로 펴서 고치는 인라인 수정 폼. */
export function TaskEditForm({
  task,
  projects,
}: {
  task: TaskEditValues;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(updateTask, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600 hover:underline"
      >
        <Pencil size={12} aria-hidden />
        수정
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={task.id} />

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-brand-700">할 일 수정</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-white"
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        <Field label="제목" htmlFor={`t-title-${task.id}`} required>
          <Input
            id={`t-title-${task.id}`}
            name="title"
            required
            defaultValue={task.title}
            maxLength={200}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="프로젝트" htmlFor={`t-proj-${task.id}`}>
            <Select
              id={`t-proj-${task.id}`}
              name="projectId"
              defaultValue={task.projectId ?? ""}
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="우선순위" htmlFor={`t-pri-${task.id}`}>
            <Select
              id={`t-pri-${task.id}`}
              name="priority"
              defaultValue={task.priority}
              options={PRIORITY_OPTIONS}
            />
          </Field>
          <Field label="상태" htmlFor={`t-st-${task.id}`}>
            <Select
              id={`t-st-${task.id}`}
              name="status"
              defaultValue={task.status}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="마감일" htmlFor={`t-due-${task.id}`}>
            <Input id={`t-due-${task.id}`} name="dueDate" type="date" defaultValue={task.dueDate} />
          </Field>
        </div>

        <Field label="메모" htmlFor={`t-memo-${task.id}`}>
          <Textarea id={`t-memo-${task.id}`} name="memo" rows={2} defaultValue={task.memo ?? ""} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="링크 이름" htmlFor={`t-ll-${task.id}`}>
            <Input id={`t-ll-${task.id}`} name="linkLabel" placeholder="예: 견적서" />
          </Field>
          <Field
            label="링크 추가"
            htmlFor={`t-lu-${task.id}`}
            className="sm:col-span-2"
            hint="비워두면 기존 링크는 그대로 유지됩니다."
          >
            <Input id={`t-lu-${task.id}`} name="linkUrl" type="url" placeholder="https://" />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <SubmitButton>저장</SubmitButton>
        </div>
      </form>
    </div>
  );
}

/** 특정 할 일 아래에 하위 작업을 바로 추가합니다. */
export function AddSubtaskForm({ parentTaskId }: { parentTaskId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(createTask, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs font-medium text-brand-600 hover:underline"
      >
        + 하위 작업
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="parentTaskId" value={parentTaskId} />
      <input type="hidden" name="priority" value="P2" />
      <input type="hidden" name="status" value="PLANNED" />
      <Input name="title" required maxLength={200} autoFocus placeholder="하위 작업" className="w-56" />
      <SubmitButton>추가</SubmitButton>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        취소
      </button>
      <FormError message={state.error} />
    </form>
  );
}

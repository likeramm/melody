"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, Textarea, optionsFrom } from "@/components/form";
import { Card } from "@/components/ui";
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from "@/lib/labels";

import { createProject, createTask, type TaskFormState } from "./actions";

const PRIORITY_OPTIONS = optionsFrom(TASK_PRIORITY_ORDER, TASK_PRIORITY_LABEL);
const STATUS_OPTIONS = optionsFrom(TASK_STATUS_ORDER, TASK_STATUS_LABEL);

export type ProjectOption = { id: string; name: string };

export function NewTaskForm({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(createTask, {});

  // 저장에 성공하면 폼을 접고 다음 입력을 위해 초기화합니다.
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={16} aria-hidden />할 일 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">새 할 일</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <Field label="제목" htmlFor="title" required>
          <Input id="title" name="title" required maxLength={200} autoFocus />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="프로젝트" htmlFor="projectId">
            <Select
              id="projectId"
              name="projectId"
              defaultValue={defaultProjectId ?? ""}
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="우선순위" htmlFor="priority">
            <Select id="priority" name="priority" defaultValue="P2" options={PRIORITY_OPTIONS} />
          </Field>
          <Field label="상태" htmlFor="status">
            <Select id="status" name="status" defaultValue="PLANNED" options={STATUS_OPTIONS} />
          </Field>
          <Field label="마감일" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" />
          </Field>
        </div>

        <Field label="메모" htmlFor="memo">
          <Textarea id="memo" name="memo" rows={2} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="링크 이름" htmlFor="linkLabel">
            <Input id="linkLabel" name="linkLabel" placeholder="예: 견적서" />
          </Field>
          <Field label="링크 주소" htmlFor="linkUrl" className="sm:col-span-2" hint="https:// 로 시작해야 저장됩니다.">
            <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://" />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end gap-2">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(createProject, {});

  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        + 프로젝트
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Field label="프로젝트 이름" htmlFor="name">
        <Input id="name" name="name" required maxLength={60} autoFocus className="w-48" />
      </Field>
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

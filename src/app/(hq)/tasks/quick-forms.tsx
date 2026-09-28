"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";

import { Field, FormError, Input, SubmitButton, Textarea, useCloseOnSuccess } from "@/components/form";
import { Modal, ModalActions } from "@/components/modal";
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_ORDER } from "@/lib/labels";

import { createTask, updateProject, type TaskFormState } from "./actions";

/**
 * 제목만 적고 Enter 로 바로 추가하는 한 줄 입력.
 * 지금 보고 있는 프로젝트·보기에 맞춰 기본값을 채워, 추가한 일이 바로 목록에 보이게 합니다.
 */
export function QuickAddTask({
  projectId,
  defaultDue,
}: {
  projectId?: string;
  defaultDue: string;
}) {
  const [state, formAction] = useActionState<TaskFormState, FormData>(createTask, {});

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-2">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="title"
          required
          maxLength={200}
          placeholder="할 일을 적고 Enter"
          aria-label="빠른 할 일 추가"
          className="min-w-0 flex-1 basis-48 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none focus:border-border focus:bg-white"
        />
        <input
          name="dueDate"
          type="date"
          defaultValue={defaultDue}
          aria-label="마감일"
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"
        />
        <select
          name="priority"
          defaultValue="P2"
          aria-label="우선순위"
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"
        >
          {TASK_PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <SubmitButton>추가</SubmitButton>
      </div>
      {state.error && (
        <div className="px-2 pt-1">
          <FormError message={state.error} />
        </div>
      )}
    </form>
  );
}

/** 선택한 프로젝트의 이름·설명을 고치거나 보관(목록에서 숨김)합니다. */
export function ProjectEditForm({
  project,
}: {
  project: { id: string; name: string; description: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<TaskFormState, FormData>(updateProject, {});
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Pencil size={13} aria-hidden />
        프로젝트 수정
      </button>
      {open && (
        <Modal title="프로젝트 수정" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={project.id} />
            <Field label="프로젝트 이름" htmlFor={`pj-name-${project.id}`} required>
              <Input
                id={`pj-name-${project.id}`}
                name="name"
                required
                maxLength={60}
                defaultValue={project.name}
              />
            </Field>
            <Field label="설명" htmlFor={`pj-desc-${project.id}`}>
              <Textarea
                id={`pj-desc-${project.id}`}
                name="description"
                rows={2}
                defaultValue={project.description ?? ""}
              />
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="archived" className="mt-0.5 h-4 w-4 rounded" />
              <span>
                보관하기
                <span className="block text-xs text-muted">
                  목록에서 숨깁니다. 할 일·지출 기록은 그대로 남고, 할 일 화면 맨 아래에서 다시 꺼낼 수
                  있습니다.
                </span>
              </span>
            </label>
            <FormError message={state.error} />
            <ModalActions onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

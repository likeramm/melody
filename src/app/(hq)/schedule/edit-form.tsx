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
  MILESTONE_STATUS_LABEL,
  MILESTONE_TYPE_LABEL,
  MILESTONE_TYPE_ORDER,
} from "@/lib/labels";

import { updateMilestone, type FormState } from "./actions";

const TYPE_OPTIONS = optionsFrom(MILESTONE_TYPE_ORDER, MILESTONE_TYPE_LABEL);
const STATUS_OPTIONS = optionsFrom(
  ["PLANNED", "IN_PROGRESS", "DONE", "ON_HOLD"] as const,
  MILESTONE_STATUS_LABEL,
);

export type MilestoneEditValues = {
  id: string;
  title: string;
  type: string;
  goal: string | null;
  startAt: string;
  dueDate: string;
  status: string;
  progress: number;
  projectId: string | null;
};

export function MilestoneEditForm({
  milestone,
  projects,
}: {
  milestone: MilestoneEditValues;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateMilestone, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="일정 수정"
        title="수정"
        className="rounded p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Pencil size={14} aria-hidden />
      </button>
    );
  }

  const id = milestone.id;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">일정 수정</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="일정 이름" htmlFor={`m-title-${id}`} required>
              <Input
                id={`m-title-${id}`}
                name="title"
                required
                defaultValue={milestone.title}
                maxLength={120}
              />
            </Field>
            <Field label="종류" htmlFor={`m-type-${id}`}>
              <Select
                id={`m-type-${id}`}
                name="type"
                defaultValue={milestone.type}
                options={TYPE_OPTIONS}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="시작일" htmlFor={`m-start-${id}`}>
              <Input
                id={`m-start-${id}`}
                name="startAt"
                type="date"
                defaultValue={milestone.startAt}
              />
            </Field>
            <Field label="마감일" htmlFor={`m-due-${id}`}>
              <Input
                id={`m-due-${id}`}
                name="dueDate"
                type="date"
                defaultValue={milestone.dueDate}
              />
            </Field>
            <Field label="상태" htmlFor={`m-st-${id}`}>
              <Select
                id={`m-st-${id}`}
                name="status"
                defaultValue={milestone.status}
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label="완료율 (%)" htmlFor={`m-pr-${id}`}>
              <Input
                id={`m-pr-${id}`}
                name="progress"
                type="number"
                min={0}
                max={100}
                defaultValue={milestone.progress}
              />
            </Field>
          </div>

          <Field label="관련 프로젝트" htmlFor={`m-proj-${id}`}>
            <Select
              id={`m-proj-${id}`}
              name="projectId"
              defaultValue={milestone.projectId ?? ""}
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>

          <Field label="목표" htmlFor={`m-goal-${id}`}>
            <Textarea id={`m-goal-${id}`} name="goal" rows={2} defaultValue={milestone.goal ?? ""} />
          </Field>

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
      </div>
    </div>
  );
}

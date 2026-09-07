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
  MILESTONE_STATUS_LABEL,
  MILESTONE_TYPE_LABEL,
  MILESTONE_TYPE_ORDER,
} from "@/lib/labels";

import { createMilestone, type FormState } from "./actions";

const TYPE_OPTIONS = optionsFrom(MILESTONE_TYPE_ORDER, MILESTONE_TYPE_LABEL);
const STATUS_OPTIONS = optionsFrom(
  ["PLANNED", "IN_PROGRESS", "DONE", "ON_HOLD"] as const,
  MILESTONE_STATUS_LABEL,
);

export function NewMilestoneForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createMilestone, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={16} aria-hidden />
        일정 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">새 일정 · Milestone</p>
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
          <Field label="일정 이름" htmlFor="title" required className="lg:col-span-2">
            <Input id="title" name="title" required maxLength={120} autoFocus />
          </Field>
          <Field label="종류" htmlFor="type">
            <Select id="type" name="type" defaultValue="ETC" options={TYPE_OPTIONS} />
          </Field>
          <Field label="관련 프로젝트" htmlFor="projectId">
            <Select
              id="projectId"
              name="projectId"
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="시작일" htmlFor="startAt">
            <Input id="startAt" name="startAt" type="date" />
          </Field>
          <Field label="마감일" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" />
          </Field>
          <Field label="상태" htmlFor="status">
            <Select id="status" name="status" defaultValue="PLANNED" options={STATUS_OPTIONS} />
          </Field>
          <Field label="완료율 (%)" htmlFor="progress">
            <Input
              id="progress"
              name="progress"
              type="number"
              min={0}
              max={100}
              defaultValue={0}
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field label="목표" htmlFor="goal">
          <Textarea id="goal" name="goal" rows={2} />
        </Field>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

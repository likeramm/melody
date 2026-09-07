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
import { CONTACT_TYPE_LABEL, CONTACT_TYPE_ORDER } from "@/lib/labels";

import { addContactLog, type FormState } from "./actions";

const TYPE_OPTIONS = optionsFrom(CONTACT_TYPE_ORDER, CONTACT_TYPE_LABEL);

export function NewContactLogForm({ targets }: { targets: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addContactLog, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={16} aria-hidden />
        연락 기록 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">연락 기록</p>
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
          <Field label="대상" htmlFor="target" required className="lg:col-span-2">
            <Select
              id="target"
              name="target"
              required
              placeholder="학생 또는 업체 선택"
              options={targets}
            />
          </Field>
          <Field label="연락일" htmlFor="contactedAt" required>
            <Input id="contactedAt" name="contactedAt" type="date" required />
          </Field>
          <Field label="연락 방법" htmlFor="type">
            <Select id="type" name="type" defaultValue="PHONE" options={TYPE_OPTIONS} />
          </Field>
        </div>

        <Field label="연락 내용" htmlFor="summary" required>
          <Textarea id="summary" name="summary" rows={2} required maxLength={1000} />
        </Field>

        <div className="flex flex-wrap items-end gap-4">
          <Field label="다음 연락 예정일" htmlFor="nextContactAt">
            <Input id="nextContactAt" name="nextContactAt" type="date" />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="followUpNeeded"
              defaultChecked
              className="h-4 w-4 rounded"
            />
            Follow-up 필요
          </label>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>기록</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

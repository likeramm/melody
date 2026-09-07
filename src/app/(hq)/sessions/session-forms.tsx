"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, Textarea } from "@/components/form";
import { Card } from "@/components/ui";

import { createClassGroup, createSession, type FormState } from "./actions";

export function NewSessionForm({
  classGroups,
  lessons,
}: {
  classGroups: { id: string; name: string }[];
  lessons: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createSession, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={16} aria-hidden />수업 회차 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">새 수업</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="수업일" htmlFor="date" required>
            <Input id="date" name="date" type="date" required autoFocus />
          </Field>
          <Field label="반" htmlFor="classGroupId" hint="반을 고르면 소속 학생이 자동으로 채워집니다.">
            <Select
              id="classGroupId"
              name="classGroupId"
              placeholder="선택 안 함"
              options={classGroups.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="레슨 플랜" htmlFor="lessonId">
            <Select
              id="lessonId"
              name="lessonId"
              placeholder="선택 안 함"
              options={lessons.map((l) => ({ value: l.id, label: l.label }))}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="주제" htmlFor="topic">
            <Input id="topic" name="topic" />
          </Field>
          <Field label="숙제" htmlFor="homework">
            <Input id="homework" name="homework" />
          </Field>
        </div>

        <Field label="수업 내용" htmlFor="content">
          <Textarea id="content" name="content" rows={2} />
        </Field>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>수업 만들기</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

export function NewClassGroupForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createClassGroup, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        + 반 추가
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Field label="반 이름" htmlFor="cg-name">
        <Input id="cg-name" name="name" required maxLength={60} autoFocus className="w-40" />
      </Field>
      <Field label="수업 시간" htmlFor="cg-schedule">
        <Input id="cg-schedule" name="schedule" placeholder="월/수/금 17:00" className="w-40" />
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

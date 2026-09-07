"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, Textarea } from "@/components/form";

import { updateSession, type FormState } from "./actions";

export type SessionEditValues = {
  id: string;
  date: string;
  topic: string | null;
  content: string | null;
  homework: string | null;
  note: string | null;
  classGroupId: string | null;
  lessonId: string | null;
};

/** 수업 회차의 날짜·주제·숙제를 고칩니다. 학생별 기록은 아래 표에서 따로 저장합니다. */
export function SessionEditForm({
  session,
  classGroups,
  lessons,
}: {
  session: SessionEditValues;
  classGroups: { id: string; name: string }[];
  lessons: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateSession, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Pencil size={14} aria-hidden />
        수업 정보 수정
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <input type="hidden" name="id" value={session.id} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-700">수업 정보 수정</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="rounded p-1 text-slate-400 hover:bg-white"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="수업일" htmlFor="s-date" required>
          <Input id="s-date" name="date" type="date" required defaultValue={session.date} />
        </Field>
        <Field label="반" htmlFor="s-class">
          <Select
            id="s-class"
            name="classGroupId"
            defaultValue={session.classGroupId ?? ""}
            placeholder="선택 안 함"
            options={classGroups.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="레슨 플랜" htmlFor="s-lesson">
          <Select
            id="s-lesson"
            name="lessonId"
            defaultValue={session.lessonId ?? ""}
            placeholder="선택 안 함"
            options={lessons.map((l) => ({ value: l.id, label: l.label }))}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="주제" htmlFor="s-topic">
          <Input id="s-topic" name="topic" defaultValue={session.topic ?? ""} />
        </Field>
        <Field label="숙제" htmlFor="s-hw">
          <Input id="s-hw" name="homework" defaultValue={session.homework ?? ""} />
        </Field>
      </div>

      <Field label="수업 내용" htmlFor="s-content">
        <Textarea id="s-content" name="content" rows={3} defaultValue={session.content ?? ""} />
      </Field>

      <FormError message={state.error} />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          취소
        </button>
        <SubmitButton>저장</SubmitButton>
      </div>
    </form>
  );
}

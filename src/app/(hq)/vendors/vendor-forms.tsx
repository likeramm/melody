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
import { VENDOR_EVENT_TYPE_LABEL, VENDOR_EVENT_TYPE_ORDER } from "@/lib/labels";

import { addVendorEvent, createVendor, type FormState } from "./actions";

const EVENT_OPTIONS = optionsFrom(VENDOR_EVENT_TYPE_ORDER, VENDOR_EVENT_TYPE_LABEL);

export function NewVendorForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createVendor, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={16} aria-hidden />
        업체 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">새 업체</p>
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
          <Field label="업체명" htmlFor="v-name" required>
            <Input id="v-name" name="name" required maxLength={80} autoFocus />
          </Field>
          <Field label="분야" htmlFor="v-field">
            <Input id="v-field" name="field" placeholder="예: 디자인 / 인쇄 / 시공" />
          </Field>
          <Field label="담당자" htmlFor="v-contact">
            <Input id="v-contact" name="contactName" />
          </Field>
          <Field label="최초 연락일" htmlFor="v-first" hint="비우면 오늘로 기록됩니다.">
            <Input id="v-first" name="firstContactAt" type="date" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="전화" htmlFor="v-phone">
            <Input id="v-phone" name="phone" inputMode="tel" />
          </Field>
          <Field label="이메일" htmlFor="v-email">
            <Input id="v-email" name="email" type="email" />
          </Field>
          <Field label="카카오톡" htmlFor="v-kakao">
            <Input id="v-kakao" name="kakaoId" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="견적" htmlFor="v-quote">
            <Input id="v-quote" name="quoteAmount" inputMode="numeric" placeholder="1500000" />
          </Field>
          <Field label="최종 금액" htmlFor="v-final">
            <Input id="v-final" name="finalAmount" inputMode="numeric" />
          </Field>
        </div>

        <Field label="작업 내용" htmlFor="v-work">
          <Textarea id="v-work" name="workDescription" rows={2} />
        </Field>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

export function NewVendorEventForm({
  vendorId,
  projects,
}: {
  vendorId: string;
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addVendorEvent, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={15} aria-hidden />
        진행 기록 추가
      </button>
    );
  }

  return (
    <Card>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="vendorId" value={vendorId} />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">진행 기록</p>
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
          <Field label="날짜" htmlFor="e-date" required>
            <Input id="e-date" name="date" type="date" required />
          </Field>
          <Field label="종류" htmlFor="e-type">
            <Select id="e-type" name="type" defaultValue="ETC" options={EVENT_OPTIONS} />
          </Field>
          <Field label="금액" htmlFor="e-amount" hint="결제 기록이면 비용에도 자동 반영됩니다.">
            <Input id="e-amount" name="amount" inputMode="numeric" />
          </Field>
          <Field label="프로젝트" htmlFor="e-project">
            <Select
              id="e-project"
              name="projectId"
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
        </div>

        <Field label="내용" htmlFor="e-desc" required>
          <Input id="e-desc" name="description" required maxLength={300} placeholder="예: 디자인 의뢰" />
        </Field>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>기록</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

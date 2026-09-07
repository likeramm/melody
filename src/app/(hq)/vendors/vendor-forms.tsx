"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

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

import { addVendorEvent, createVendor, updateVendor, type FormState } from "./actions";

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

export type VendorEditValues = {
  id: string;
  name: string;
  field: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  kakaoId: string | null;
  firstContactAt: string;
  contractAt: string;
  workAt: string;
  paidAt: string;
  quoteAmount: number | null;
  finalAmount: number | null;
  workDescription: string | null;
  revisionRequest: string | null;
  resultUrl: string | null;
  satisfaction: number | null;
  wouldReuse: boolean | null;
};

/** 업체 정보 전체 수정. 계약·작업·결제일과 만족도까지 여기서 고칩니다. */
export function VendorEditForm({ vendor }: { vendor: VendorEditValues }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateVendor, {});
  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Pencil size={14} aria-hidden />
        정보 수정
      </button>
    );
  }

  return (
    <Card className="mb-4 w-full">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={vendor.id} />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">업체 정보 수정</p>
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
          <Field label="업체명" htmlFor="ve-name" required>
            <Input id="ve-name" name="name" required defaultValue={vendor.name} maxLength={80} />
          </Field>
          <Field label="분야" htmlFor="ve-field">
            <Input id="ve-field" name="field" defaultValue={vendor.field ?? ""} />
          </Field>
          <Field label="담당자" htmlFor="ve-contact">
            <Input id="ve-contact" name="contactName" defaultValue={vendor.contactName ?? ""} />
          </Field>
          <Field label="카카오톡" htmlFor="ve-kakao">
            <Input id="ve-kakao" name="kakaoId" defaultValue={vendor.kakaoId ?? ""} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="전화" htmlFor="ve-phone">
            <Input id="ve-phone" name="phone" defaultValue={vendor.phone ?? ""} inputMode="tel" />
          </Field>
          <Field label="이메일" htmlFor="ve-email">
            <Input id="ve-email" name="email" type="email" defaultValue={vendor.email ?? ""} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="최초 연락일" htmlFor="ve-first">
            <Input
              id="ve-first"
              name="firstContactAt"
              type="date"
              defaultValue={vendor.firstContactAt}
            />
          </Field>
          <Field label="계약일" htmlFor="ve-contract">
            <Input id="ve-contract" name="contractAt" type="date" defaultValue={vendor.contractAt} />
          </Field>
          <Field label="작업일" htmlFor="ve-work">
            <Input id="ve-work" name="workAt" type="date" defaultValue={vendor.workAt} />
          </Field>
          <Field label="결제일" htmlFor="ve-paid">
            <Input id="ve-paid" name="paidAt" type="date" defaultValue={vendor.paidAt} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="견적" htmlFor="ve-quote">
            <Input
              id="ve-quote"
              name="quoteAmount"
              inputMode="numeric"
              defaultValue={vendor.quoteAmount ?? ""}
            />
          </Field>
          <Field label="최종 금액" htmlFor="ve-final">
            <Input
              id="ve-final"
              name="finalAmount"
              inputMode="numeric"
              defaultValue={vendor.finalAmount ?? ""}
            />
          </Field>
          <Field label="만족도 (1~5)" htmlFor="ve-sat">
            <Input
              id="ve-sat"
              name="satisfaction"
              type="number"
              min={1}
              max={5}
              defaultValue={vendor.satisfaction ?? ""}
            />
          </Field>
          <Field label="다시 쓸 업체" htmlFor="ve-reuse">
            <Select
              id="ve-reuse"
              name="wouldReuse"
              defaultValue={vendor.wouldReuse === null ? "" : vendor.wouldReuse ? "yes" : "no"}
              placeholder="미정"
              options={[
                { value: "yes", label: "예" },
                { value: "no", label: "아니오" },
              ]}
            />
          </Field>
        </div>

        <Field label="결과물 링크" htmlFor="ve-result">
          <Input id="ve-result" name="resultUrl" type="url" defaultValue={vendor.resultUrl ?? ""} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="작업 내용" htmlFor="ve-desc">
            <Textarea
              id="ve-desc"
              name="workDescription"
              rows={3}
              defaultValue={vendor.workDescription ?? ""}
            />
          </Field>
          <Field label="수정 요청" htmlFor="ve-rev">
            <Textarea
              id="ve-rev"
              name="revisionRequest"
              rows={3}
              defaultValue={vendor.revisionRequest ?? ""}
            />
          </Field>
        </div>

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
    </Card>
  );
}

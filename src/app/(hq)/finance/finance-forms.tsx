"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormError, Input, Select, SubmitButton, optionsFrom } from "@/components/form";
import { Card } from "@/components/ui";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_ORDER,
  REVENUE_TYPE_LABEL,
} from "@/lib/labels";

import { createExpense, createPayment, type FormState } from "./actions";

const METHOD_OPTIONS = optionsFrom(PAYMENT_METHOD_ORDER, PAYMENT_METHOD_LABEL);
const REVENUE_OPTIONS = optionsFrom(["TUITION", "COACHING", "OTHER"] as const, REVENUE_TYPE_LABEL);
const CATEGORY_OPTIONS = optionsFrom(EXPENSE_CATEGORY_ORDER, EXPENSE_CATEGORY_LABEL);

function Toggle({
  open,
  setOpen,
  label,
  title,
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Plus size={15} aria-hidden />
        {label}
      </button>
    );
  }
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      {children}
    </Card>
  );
}

export function NewPaymentForm({ students }: { students: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createPayment, {});
  if (state.ok && open) setOpen(false);

  return (
    <Toggle open={open} setOpen={setOpen} label="수입 추가" title="수입">
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="학생" htmlFor="pay-student">
            <Select
              id="pay-student"
              name="studentId"
              placeholder="선택 안 함"
              options={students.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Field label="항목" htmlFor="pay-item" required>
            <Input id="pay-item" name="item" required maxLength={120} placeholder="예: 9월 교습비" />
          </Field>
          <Field label="금액" htmlFor="pay-amount" required>
            <Input id="pay-amount" name="amount" required inputMode="numeric" placeholder="350000" />
          </Field>
          <Field label="구분" htmlFor="pay-type">
            <Select id="pay-type" name="revenueType" defaultValue="TUITION" options={REVENUE_OPTIONS} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="결제 예정일" htmlFor="pay-due">
            <Input id="pay-due" name="dueAt" type="date" />
          </Field>
          <Field label="실제 결제일" htmlFor="pay-paid" hint="비우면 미납으로 표시됩니다.">
            <Input id="pay-paid" name="paidAt" type="date" />
          </Field>
          <Field label="결제수단" htmlFor="pay-method">
            <Select id="pay-method" name="method" defaultValue="TRANSFER" options={METHOD_OPTIONS} />
          </Field>
        </div>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

export function NewExpenseForm({
  vendors,
  projects,
}: {
  vendors: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(createExpense, {});
  if (state.ok && open) setOpen(false);

  return (
    <Toggle open={open} setOpen={setOpen} label="지출 추가" title="지출">
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="날짜" htmlFor="exp-date" required>
            <Input id="exp-date" name="spentAt" type="date" required />
          </Field>
          <Field label="항목" htmlFor="exp-item" required>
            <Input id="exp-item" name="item" required maxLength={120} />
          </Field>
          <Field label="금액" htmlFor="exp-amount" required>
            <Input id="exp-amount" name="amount" required inputMode="numeric" />
          </Field>
          <Field label="카테고리" htmlFor="exp-category">
            <Select id="exp-category" name="category" defaultValue="ETC" options={CATEGORY_OPTIONS} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="업체" htmlFor="exp-vendor">
            <Select
              id="exp-vendor"
              name="vendorId"
              placeholder="선택 안 함"
              options={vendors.map((v) => ({ value: v.id, label: v.name }))}
            />
          </Field>
          <Field label="프로젝트" htmlFor="exp-project">
            <Select
              id="exp-project"
              name="projectId"
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="결제수단" htmlFor="exp-method">
            <Select id="exp-method" name="method" defaultValue="TRANSFER" options={METHOD_OPTIONS} />
          </Field>
          <Field label="영수증 링크" htmlFor="exp-receipt">
            <Input id="exp-receipt" name="receiptUrl" type="url" placeholder="https://" />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasTaxInvoice" className="h-4 w-4 rounded" />
          세금계산서 발행
        </label>

        <FormError message={state.error} />
        <div className="flex justify-end">
          <SubmitButton>추가</SubmitButton>
        </div>
      </form>
    </Toggle>
  );
}

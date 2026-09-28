"use client";

import { useActionState, useState } from "react";
import { Field, FormError, Input, Select, optionsFrom, useCloseOnSuccess } from "@/components/form";
import { Modal, ModalActions, PencilButton } from "@/components/modal";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_ORDER,
  REVENUE_TYPE_LABEL,
} from "@/lib/labels";

import { updateExpense, updatePayment, type FormState } from "./actions";

const METHOD_OPTIONS = optionsFrom(PAYMENT_METHOD_ORDER, PAYMENT_METHOD_LABEL);
const REVENUE_OPTIONS = optionsFrom(["TUITION", "COACHING", "OTHER"] as const, REVENUE_TYPE_LABEL);
const CATEGORY_OPTIONS = optionsFrom(EXPENSE_CATEGORY_ORDER, EXPENSE_CATEGORY_LABEL);

type Option = { id: string; name: string };

// ── 수입 ─────────────────────────────────────────────────────

export type PaymentValues = {
  id: string;
  studentId: string | null;
  item: string;
  amount: number;
  revenueType: string;
  method: string;
  dueAt: string;
  paidAt: string;
  memo: string | null;
};

export function PaymentEditForm({
  payment: p,
  students,
}: {
  payment: PaymentValues;
  students: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updatePayment, {});
  useCloseOnSuccess(state, () => setOpen(false));

  if (!open) return <PencilButton label={`${p.item} 수정`} onClick={() => setOpen(true)} />;

  return (
    <Modal title="수입 수정" onClose={() => setOpen(false)}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="학생" htmlFor={`pe-s-${p.id}`}>
            <Select
              id={`pe-s-${p.id}`}
              name="studentId"
              defaultValue={p.studentId ?? ""}
              placeholder="선택 안 함"
              options={students.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Field label="항목" htmlFor={`pe-i-${p.id}`} required>
            <Input id={`pe-i-${p.id}`} name="item" required maxLength={120} defaultValue={p.item} />
          </Field>
          <Field label="금액" htmlFor={`pe-a-${p.id}`} required>
            <Input
              id={`pe-a-${p.id}`}
              name="amount"
              required
              inputMode="numeric"
              defaultValue={p.amount}
            />
          </Field>
          <Field label="구분" htmlFor={`pe-t-${p.id}`}>
            <Select
              id={`pe-t-${p.id}`}
              name="revenueType"
              defaultValue={p.revenueType}
              options={REVENUE_OPTIONS}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="결제 예정일" htmlFor={`pe-d-${p.id}`}>
            <Input id={`pe-d-${p.id}`} name="dueAt" type="date" defaultValue={p.dueAt} />
          </Field>
          <Field label="실제 결제일" htmlFor={`pe-p-${p.id}`} hint="비우면 미납으로 돌아갑니다.">
            <Input id={`pe-p-${p.id}`} name="paidAt" type="date" defaultValue={p.paidAt} />
          </Field>
          <Field label="결제수단" htmlFor={`pe-m-${p.id}`}>
            <Select
              id={`pe-m-${p.id}`}
              name="method"
              defaultValue={p.method}
              options={METHOD_OPTIONS}
            />
          </Field>
        </div>
        <Field label="메모" htmlFor={`pe-memo-${p.id}`}>
          <Input id={`pe-memo-${p.id}`} name="memo" defaultValue={p.memo ?? ""} />
        </Field>
        <FormError message={state.error} />
        <ModalActions onCancel={() => setOpen(false)} />
      </form>
    </Modal>
  );
}

// ── 지출 ─────────────────────────────────────────────────────

export type ExpenseValues = {
  id: string;
  spentAt: string;
  item: string;
  amount: number;
  category: string;
  method: string;
  vendorId: string | null;
  projectId: string | null;
  receiptUrl: string | null;
  hasTaxInvoice: boolean;
  memo: string | null;
};

export function ExpenseEditForm({
  expense: e,
  vendors,
  projects,
}: {
  expense: ExpenseValues;
  vendors: Option[];
  projects: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateExpense, {});
  useCloseOnSuccess(state, () => setOpen(false));

  if (!open) return <PencilButton label={`${e.item} 수정`} onClick={() => setOpen(true)} />;

  return (
    <Modal title="지출 수정" onClose={() => setOpen(false)}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={e.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="날짜" htmlFor={`ee-d-${e.id}`} required>
            <Input id={`ee-d-${e.id}`} name="spentAt" type="date" required defaultValue={e.spentAt} />
          </Field>
          <Field label="항목" htmlFor={`ee-i-${e.id}`} required>
            <Input id={`ee-i-${e.id}`} name="item" required maxLength={120} defaultValue={e.item} />
          </Field>
          <Field label="금액" htmlFor={`ee-a-${e.id}`} required>
            <Input
              id={`ee-a-${e.id}`}
              name="amount"
              required
              inputMode="numeric"
              defaultValue={e.amount}
            />
          </Field>
          <Field label="카테고리" htmlFor={`ee-c-${e.id}`}>
            <Select
              id={`ee-c-${e.id}`}
              name="category"
              defaultValue={e.category}
              options={CATEGORY_OPTIONS}
            />
          </Field>
          <Field label="업체" htmlFor={`ee-v-${e.id}`}>
            <Select
              id={`ee-v-${e.id}`}
              name="vendorId"
              defaultValue={e.vendorId ?? ""}
              placeholder="선택 안 함"
              options={vendors.map((v) => ({ value: v.id, label: v.name }))}
            />
          </Field>
          <Field label="프로젝트" htmlFor={`ee-p-${e.id}`}>
            <Select
              id={`ee-p-${e.id}`}
              name="projectId"
              defaultValue={e.projectId ?? ""}
              placeholder="선택 안 함"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="결제수단" htmlFor={`ee-m-${e.id}`}>
            <Select
              id={`ee-m-${e.id}`}
              name="method"
              defaultValue={e.method}
              options={METHOD_OPTIONS}
            />
          </Field>
          <Field label="영수증 링크" htmlFor={`ee-r-${e.id}`}>
            <Input
              id={`ee-r-${e.id}`}
              name="receiptUrl"
              type="url"
              placeholder="https://"
              defaultValue={e.receiptUrl ?? ""}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="hasTaxInvoice"
            defaultChecked={e.hasTaxInvoice}
            className="h-4 w-4 rounded"
          />
          세금계산서 발행
        </label>
        <Field label="메모" htmlFor={`ee-memo-${e.id}`}>
          <Input id={`ee-memo-${e.id}`} name="memo" defaultValue={e.memo ?? ""} />
        </Field>
        <FormError message={state.error} />
        <ModalActions onCancel={() => setOpen(false)} />
      </form>
    </Modal>
  );
}

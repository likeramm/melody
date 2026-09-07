"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const METHODS = ["CASH", "CARD", "TRANSFER"] as const;
const REVENUE_TYPES = ["TUITION", "COACHING", "OTHER"] as const;
const CATEGORIES = [
  "OUTSOURCING",
  "ADVERTISING",
  "FACILITY",
  "SUPPLIES",
  "CONTENT",
  "RENT",
  "UTILITY",
  "SALARY",
  "ETC",
] as const;

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null)
  .nullish();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "날짜 형식이 올바르지 않습니다.")
  .nullish();

const money = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(/,/g, "")))
  .refine((n) => Number.isFinite(n) && n >= 0, "금액은 0 이상의 숫자여야 합니다.");

export type FormState = { error?: string; ok?: boolean };

// ── 수입 ─────────────────────────────────────────────────────

const paymentSchema = z.object({
  studentId: optionalText,
  item: z.string().trim().min(1, "항목을 입력하세요.").max(120),
  amount: money,
  dueAt: optionalDate,
  paidAt: optionalDate,
  method: z.enum(METHODS).default("TRANSFER"),
  revenueType: z.enum(REVENUE_TYPES).default("TUITION"),
  memo: optionalText,
});

export async function createPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  await prisma.payment.create({ data: parsed.data });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  if (parsed.data.studentId) revalidatePath(`/students/${parsed.data.studentId}`);
  return { ok: true };
}

/** 미납 건을 결제 완료로 바꿉니다. */
export async function markPaid(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payment.update({ where: { id }, data: { paidAt: new Date() } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function refundPayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payment.update({
    where: { id },
    data: { isRefunded: true, refundedAt: new Date() },
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deletePayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

// ── 지출 ─────────────────────────────────────────────────────

const expenseSchema = z.object({
  spentAt: z.string().trim().min(1, "날짜를 입력하세요."),
  item: z.string().trim().min(1, "항목을 입력하세요.").max(120),
  amount: money,
  category: z.enum(CATEGORIES).default("ETC"),
  method: z.enum(METHODS).default("TRANSFER"),
  vendorId: optionalText,
  projectId: optionalText,
  receiptUrl: optionalText,
  hasTaxInvoice: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  memo: optionalText,
});

export async function createExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { spentAt, ...d } = parsed.data;
  const date = new Date(spentAt);
  if (Number.isNaN(date.getTime())) return { error: "날짜가 올바르지 않습니다." };

  await prisma.expense.create({ data: { ...d, spentAt: date } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  if (d.vendorId) revalidatePath(`/vendors/${d.vendorId}`);
  return { ok: true };
}

export async function deleteExpense(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

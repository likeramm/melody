"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EVENT_TYPES = [
  "INQUIRY",
  "QUOTE",
  "ORDER",
  "DELIVERY",
  "REVISION",
  "PAYMENT",
  "COMPLETE",
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

const optionalMoney = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(/,/g, ""))))
  .refine((n) => n === null || (Number.isFinite(n) && n >= 0), "금액은 0 이상이어야 합니다.")
  .nullish();

export type FormState = { error?: string; ok?: boolean };

const vendorSchema = z.object({
  name: z.string().trim().min(1, "업체명을 입력하세요.").max(80),
  contactName: optionalText,
  phone: optionalText,
  email: optionalText,
  kakaoId: optionalText,
  field: optionalText,
  firstContactAt: optionalDate,
  quoteAmount: optionalMoney,
  finalAmount: optionalMoney,
  contractAt: optionalDate,
  workAt: optionalDate,
  paidAt: optionalDate,
  workDescription: optionalText,
  revisionRequest: optionalText,
  resultUrl: optionalText,
  satisfaction: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((n) => n === null || (n >= 1 && n <= 5), "만족도는 1~5 입니다.")
    .nullish(),
  wouldReuse: z
    .string()
    .optional()
    .transform((v) => (v === "yes" ? true : v === "no" ? false : null)),
  memo: optionalText,
});

export async function createVendor(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  await prisma.vendor.create({
    data: { ...parsed.data, firstContactAt: parsed.data.firstContactAt ?? new Date() },
  });

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateVendor(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = vendorSchema
    .extend({ id: z.string().min(1) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { id, ...d } = parsed.data;
  await prisma.vendor.update({ where: { id }, data: d });

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { ok: true };
}

export async function deleteVendor(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

// ── 진행 기록 (timeline) ─────────────────────────────────────

const eventSchema = z.object({
  vendorId: z.string().min(1),
  date: z.string().trim().min(1, "날짜를 입력하세요."),
  type: z.enum(EVENT_TYPES).default("ETC"),
  description: z.string().trim().min(1, "내용을 입력하세요.").max(300),
  amount: optionalMoney,
  projectId: optionalText,
});

/**
 * 업체 진행 기록을 남깁니다.
 * 결제 기록이면 비용 기록도 함께 만들어, 회계에 자동으로 반영합니다. (명세 자동화 6번)
 */
export async function addVendorEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const { vendorId, date, ...d } = parsed.data;
  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) return { error: "날짜가 올바르지 않습니다." };

  await prisma.vendorEvent.create({ data: { ...d, vendorId, date: eventDate } });

  if (d.type === "PAYMENT" && d.amount) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { name: true },
    });
    await prisma.expense.create({
      data: {
        spentAt: eventDate,
        item: d.description || `${vendor?.name ?? "업체"} 결제`,
        amount: d.amount,
        category: "OUTSOURCING",
        vendorId,
        projectId: d.projectId,
        memo: "업체 진행 기록에서 자동 생성",
      },
    });
    // 업체의 결제일도 함께 갱신합니다.
    await prisma.vendor.update({ where: { id: vendorId }, data: { paidAt: eventDate } });
    revalidatePath("/finance");
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteVendorEvent(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const vendorId = String(formData.get("vendorId") ?? "");
  if (!id) return;
  await prisma.vendorEvent.delete({ where: { id } });
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/dashboard");
}

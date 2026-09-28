"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";

import { ConfirmButton } from "@/components/confirm-button";
import { Field, FormError, Input, Select, SubmitButton, optionsFrom, useCloseOnSuccess } from "@/components/form";
import { GUARDIAN_RELATION_LABEL } from "@/lib/labels";

import { deleteGuardian, updateGuardian, type FormState } from "./actions";

const RELATION_OPTIONS = optionsFrom(["MOTHER", "FATHER", "OTHER"] as const, GUARDIAN_RELATION_LABEL);

export type GuardianValues = {
  id: string;
  studentId: string;
  name: string;
  relation: "MOTHER" | "FATHER" | "OTHER";
  phone: string | null;
  email: string | null;
};

/** 보호자 한 명. 연락처 오타를 그 자리에서 고치거나 지울 수 있습니다. */
export function GuardianItem({ guardian: g }: { guardian: GuardianValues }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateGuardian, {});
  useCloseOnSuccess(state, () => setEditing(false));

  if (editing) {
    return (
      <li className="rounded-lg border border-gold-200 bg-gold-50/40 p-3">
        <form action={formAction} className="space-y-2.5">
          <input type="hidden" name="id" value={g.id} />
          <input type="hidden" name="studentId" value={g.studentId} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="이름" htmlFor={`g-n-${g.id}`} required>
              <Input id={`g-n-${g.id}`} name="name" required defaultValue={g.name} maxLength={40} />
            </Field>
            <Field label="관계" htmlFor={`g-r-${g.id}`}>
              <Select
                id={`g-r-${g.id}`}
                name="relation"
                defaultValue={g.relation}
                options={RELATION_OPTIONS}
              />
            </Field>
          </div>
          <Field label="연락처" htmlFor={`g-p-${g.id}`}>
            <Input id={`g-p-${g.id}`} name="phone" inputMode="tel" defaultValue={g.phone ?? ""} />
          </Field>
          <Field label="이메일" htmlFor={`g-e-${g.id}`}>
            <Input id={`g-e-${g.id}`} name="email" type="email" defaultValue={g.email ?? ""} />
          </Field>
          <FormError message={state.error} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <SubmitButton>저장</SubmitButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {g.name}
          <span className="ml-1.5 text-xs font-normal text-muted">
            {GUARDIAN_RELATION_LABEL[g.relation]}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {g.phone ? (
            // 휴대폰에서 누르면 바로 전화가 걸립니다.
            <a href={`tel:${g.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-brand-700 hover:underline">
              {g.phone}
            </a>
          ) : (
            (g.email ?? "연락처 없음")
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`${g.name} 정보 수정`}
        title="수정"
        className="rounded p-1.5 text-slate-300 transition hover:bg-white hover:text-slate-700"
      >
        <Pencil size={13} aria-hidden />
      </button>
      <form action={deleteGuardian}>
        <input type="hidden" name="id" value={g.id} />
        <input type="hidden" name="studentId" value={g.studentId} />
        <ConfirmButton label={`${g.name} 삭제`} size={13} />
      </form>
    </li>
  );
}

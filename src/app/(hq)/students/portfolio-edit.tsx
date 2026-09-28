"use client";

import { useActionState, useState } from "react";

import { Field, FormError, Input, Textarea, useCloseOnSuccess } from "@/components/form";
import { Modal, ModalActions, PencilButton } from "@/components/modal";

import { updatePortfolio, type FormState } from "./actions";

export function PortfolioEditForm({
  portfolio: p,
}: {
  portfolio: {
    id: string;
    studentId: string;
    title: string;
    url: string | null;
    producedAt: string;
    memo: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updatePortfolio, {});
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <PencilButton label={`${p.title} 수정`} onClick={() => setOpen(true)} />
      {open && (
        <Modal title="Portfolio 수정" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="studentId" value={p.studentId} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="결과물 이름" htmlFor={`pf-t-${p.id}`} required className="sm:col-span-2">
                <Input
                  id={`pf-t-${p.id}`}
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={p.title}
                />
              </Field>
              <Field label="제작일" htmlFor={`pf-d-${p.id}`}>
                <Input
                  id={`pf-d-${p.id}`}
                  name="producedAt"
                  type="date"
                  defaultValue={p.producedAt}
                />
              </Field>
            </div>
            <Field label="링크" htmlFor={`pf-u-${p.id}`}>
              <Input
                id={`pf-u-${p.id}`}
                name="url"
                type="url"
                placeholder="https://"
                defaultValue={p.url ?? ""}
              />
            </Field>
            <Field label="메모" htmlFor={`pf-m-${p.id}`}>
              <Textarea id={`pf-m-${p.id}`} name="memo" rows={2} defaultValue={p.memo ?? ""} />
            </Field>
            <FormError message={state.error} />
            <ModalActions onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

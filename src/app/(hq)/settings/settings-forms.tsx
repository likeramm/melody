"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Field, FormError, Input, SubmitButton } from "@/components/form";

import { changeEmail, changePassword, type SettingsState } from "./actions";

/** 입력한 비밀번호를 눈으로 확인할 수 있는 칸. 새 비밀번호를 정할 때 오타를 막아줍니다. */
function PasswordInput({
  id,
  name,
  autoComplete,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        required
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
      >
        {shown ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </div>
  );
}

function Success({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {message}
    </p>
  );
}

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(changeEmail, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-600">지금 쓰는 이메일</p>
        <p className="mt-1 text-sm font-medium text-slate-800">{currentEmail}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="새 이메일" htmlFor="new-email" required>
          <Input id="new-email" name="email" type="email" inputMode="email" autoComplete="email" required />
        </Field>
        <Field label="현재 비밀번호" htmlFor="email-current-password" required hint="본인 확인용입니다.">
          <PasswordInput id="email-current-password" name="currentPassword" autoComplete="current-password" />
        </Field>
      </div>

      <FormError message={state.error} />
      <Success message={state.ok} />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="바꾸는 중…">이메일 변경</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<SettingsState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="현재 비밀번호" htmlFor="current-password" required>
        <PasswordInput id="current-password" name="currentPassword" autoComplete="current-password" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="새 비밀번호" htmlFor="new-password" required hint="8자 이상">
          <PasswordInput id="new-password" name="newPassword" autoComplete="new-password" />
        </Field>
        <Field label="새 비밀번호 확인" htmlFor="confirm-password" required hint="한 번 더 입력하세요">
          <PasswordInput id="confirm-password" name="confirmPassword" autoComplete="new-password" />
        </Field>
      </div>

      <FormError message={state.error} />
      <Success message={state.ok} />

      <div className="flex justify-end">
        <SubmitButton pendingLabel="바꾸는 중…">비밀번호 변경</SubmitButton>
      </div>
    </form>
  );
}

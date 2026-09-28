"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/components/ui";

const CONTROL =
  "w-full rounded-lg border border-border bg-[#fffefb] px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 disabled:bg-slate-50";

export function Field({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "resize-y", props.className)} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={cn(CONTROL, props.className)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SubmitButton({
  children = "저장",
  pendingLabel = "저장 중…",
  variant = "primary",
}: {
  children?: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  const base =
    "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    // 로고 방패색 그대로. 누르면 워드마크 색으로 한 단계 짙어집니다.
    primary: "bg-brand-700 text-[#fbf6ee] shadow-sm hover:bg-brand-800",
    ghost: "border border-border bg-card text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  } as const;

  return (
    <button type="submit" disabled={pending} className={cn(base, styles[variant])}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {message}
    </p>
  );
}

/** enum 라벨 맵을 <Select> 의 options 배열로 바꿉니다. */
export function optionsFrom<T extends string>(
  order: readonly T[],
  labels: Record<T, string>,
): { value: string; label: string }[] {
  return order.map((key) => ({ value: key, label: labels[key] }));
}

/**
 * 저장 직후 잠깐 뜨는 확인 표시.
 * 폼이 접히면서 아무 반응이 없으면 저장이 됐는지 알 수 없어서 넣었습니다.
 */
export function SavedFlash({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
    >
      <Check size={12} aria-hidden />
      저장했습니다
    </span>
  );
}

/**
 * 저장에 성공한 "그 순간"에만 창을 닫습니다.
 * state.ok 를 그대로 보면 성공 결과가 남아 있어서, 다시 열자마자 곧바로 닫혀 버립니다.
 */
export function useCloseOnSuccess(state: { ok?: boolean }, close: () => void) {
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) close();
  }
}

/**
 * 고르는 즉시 감싼 폼을 제출하는 드롭다운. 목록에서 상태를 바꿀 때 "변경" 버튼을 없애 줍니다.
 * 저장 중에는 흐리게 보여 두 번 바꾸는 일을 막습니다.
 */
export function AutoSubmitSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { pending } = useFormStatus();
  return (
    <select
      {...props}
      // 폼 데이터는 제출 순간에 모이므로, 그 뒤에 잠가도 값은 그대로 전송됩니다.
      disabled={pending || props.disabled}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={cn(
        "cursor-pointer rounded border border-border bg-white px-1.5 py-1 text-xs transition",
        pending && "opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

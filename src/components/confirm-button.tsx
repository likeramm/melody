"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { cn } from "@/components/ui";

function Pending({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <span className={pending ? "opacity-50" : undefined}>{children}</span>;
}

/**
 * 삭제처럼 되돌릴 수 없는 동작에 쓰는 버튼.
 * 한 번 누르면 "정말요?" 로 바뀌고, 두 번째 눌러야 실제로 제출됩니다.
 * 브라우저 confirm() 과 달리 화면 안에서 처리돼 흐름이 끊기지 않습니다.
 */
export function ConfirmButton({
  label = "삭제",
  confirmLabel = "정말 삭제할까요?",
  icon = true,
  className,
}: {
  label?: string;
  confirmLabel?: string;
  icon?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={label}
        title={label}
        className={cn(
          "rounded p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600",
          className,
        )}
      >
        {icon ? <Trash2 size={15} aria-hidden /> : label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-1.5 py-1">
      <span className="text-xs whitespace-nowrap text-rose-700">{confirmLabel}</span>
      <button
        type="submit"
        className="rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-rose-700"
      >
        <Pending>삭제</Pending>
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-white"
      >
        취소
      </button>
    </span>
  );
}

"use client";

import { useEffect } from "react";
import { Pencil, X } from "lucide-react";

import { SubmitButton } from "@/components/form";

/**
 * 표나 목록의 한 줄에서 여는 수정 창.
 * 표 안에 폼을 펼치면 칸이 무너져서 화면 위에 띄웁니다. Esc 로 닫힙니다.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8"
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 text-left shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PencilButton({
  label,
  onClick,
  size = 14,
}: {
  label: string;
  onClick: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="수정"
      className="rounded p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <Pencil size={size} aria-hidden />
    </button>
  );
}

export function ModalActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        취소
      </button>
      <SubmitButton>저장</SubmitButton>
    </div>
  );
}

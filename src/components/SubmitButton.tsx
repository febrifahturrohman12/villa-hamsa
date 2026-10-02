"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText = "Memproses…",
  className = "",
  confirmMessage,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  /** Jika diisi, tampilkan confirm() sebelum form dikirim. */
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
      className={`min-h-11 rounded-xl px-4 font-semibold transition active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

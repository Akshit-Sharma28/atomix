"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function PendingSubmitButton({
  children,
  pendingLabel = "Submitting...",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70`}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

type PendingState = {
  active: boolean;
  label: string;
  detail: string;
};

const initialState: PendingState = {
  active: false,
  label: "",
  detail: "",
};

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function buttonLabel(button: HTMLButtonElement | HTMLInputElement) {
  if (button instanceof HTMLInputElement) {
    return button.value || "Submitting";
  }

  return button.textContent?.trim() || "Submitting";
}

function pendingLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("save") || normalized.includes("update")) return "Saving changes";
  if (normalized.includes("create") || normalized.includes("add")) return "Creating record";
  if (normalized.includes("assign")) return "Assigning record";
  if (normalized.includes("delete") || normalized.includes("deactivate")) return "Updating status";
  if (normalized.includes("import") || normalized.includes("upload")) return "Uploading data";
  if (normalized.includes("generate") || normalized.includes("download")) return "Generating output";
  if (normalized.includes("filter") || normalized.includes("search")) return "Applying filters";

  return "Processing request";
}

export default function GlobalPendingLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<PendingState>(initialState);
  const activeButtonRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const restoreButtonRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function clearPending() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    restoreButtonRef.current?.();
    restoreButtonRef.current = null;
    activeButtonRef.current = null;
    setPending(initialState);
  }

  function markButtonPending(button: HTMLButtonElement | HTMLInputElement, label: string) {
    if (restoreButtonRef.current) {
      restoreButtonRef.current();
    }

    activeButtonRef.current = button;
    const originalDisabled = button.disabled;
    const originalAriaBusy = button.getAttribute("aria-busy");
    const originalContent = button instanceof HTMLButtonElement ? button.innerHTML : button.value;

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.classList.add("cursor-not-allowed", "opacity-70");

    if (button instanceof HTMLButtonElement) {
      button.innerHTML = `<span class="inline-flex items-center gap-2"><span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span><span>${label}</span></span>`;
    } else {
      button.value = label;
    }

    restoreButtonRef.current = () => {
      button.disabled = originalDisabled;
      if (originalAriaBusy === null) {
        button.removeAttribute("aria-busy");
      } else {
        button.setAttribute("aria-busy", originalAriaBusy);
      }
      button.classList.remove("cursor-not-allowed", "opacity-70");

      if (button instanceof HTMLButtonElement) {
        button.innerHTML = originalContent;
      } else {
        button.value = originalContent;
      }
    };
  }

  function startPending(label: string, detail: string, button?: HTMLButtonElement | HTMLInputElement | null) {
    const displayLabel = pendingLabel(label);

    if (button) {
      markButtonPending(button, displayLabel);
    }

    setPending({
      active: true,
      label: displayLabel,
      detail,
    });

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setPending((current) =>
        current.active
          ? {
              ...current,
              detail: "Still working — please don’t double-click or reload. The app will update when the request completes.",
            }
          : current,
      );
    }, 4500);
  }

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      clearPending();
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form || form.dataset.globalLoader === "off") return;
      if (!form.checkValidity()) return;

      window.setTimeout(() => {
        if (event.defaultPrevented) return;

        const submitter = event.submitter;
        const button =
          submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
            ? submitter
            : form.querySelector<HTMLButtonElement | HTMLInputElement>('button[type="submit"], input[type="submit"], button:not([type])');
        const label = button ? buttonLabel(button) : "Submitting";

        startPending(label, "Please wait while Atomix saves the record.", button);
      }, 0);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.dataset.globalLoader === "off") return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) return;

      startPending(anchor.textContent?.trim() || "Loading", "Opening the selected page.");
    }

    function onPageShow() {
      clearPending();
    }

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onPageShow);
      clearPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pending.active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] grid place-items-center px-4">
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
      <div className="pointer-events-auto relative flex w-full max-w-xl items-center gap-4 rounded-3xl border border-cyan-400/30 bg-slate-950/95 px-5 py-4 text-sm text-slate-200 shadow-2xl shadow-cyan-950/50">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          <Loader2 className="animate-spin" size={22} />
        </div>
        <div>
          <p className="text-base font-bold text-white">{pending.label}</p>
          <p className="mt-1 text-sm leading-5 text-slate-400">{pending.detail}</p>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";

import { cn } from "@/lib/utils";

type AtomixBrandProps = {
  context?: string;
  size?: "sidebar" | "login";
  className?: string;
};

export default function AtomixBrand({
  context = "AI Governance Platform",
  size = "sidebar",
  className,
}: AtomixBrandProps) {
  const isLogin = size === "login";

  return (
    <div className={cn("flex min-w-0 items-center", isLogin ? "gap-4" : "gap-3", className)}>
      <div
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden border border-cyan-400/35 bg-gradient-to-br from-cyan-400/15 via-slate-900/70 to-amber-300/10 shadow-[0_10px_30px_rgba(8,145,178,0.18)]",
          isLogin ? "h-16 w-16 rounded-[1.35rem]" : "h-12 w-12 rounded-2xl",
        )}
      >
        <div className="absolute inset-1 rounded-[inherit] border border-white/10" />
        <Image
          src="/atomix-mark.svg"
          alt=""
          width={isLogin ? 48 : 38}
          height={isLogin ? 48 : 38}
          priority
          className="relative z-10 drop-shadow-[0_4px_8px_rgba(8,145,178,0.3)]"
        />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "font-black leading-none tracking-[-0.04em] text-cyan-300",
            isLogin ? "text-4xl" : "text-2xl",
          )}
        >
          ATOMIX
        </p>
        <p
          className={cn(
            "mt-1.5 font-semibold uppercase text-slate-500",
            isLogin
              ? "text-[11px] tracking-[0.24em]"
              : "whitespace-nowrap text-[8px] tracking-[0.12em]",
          )}
        >
          {context}
        </p>
      </div>
    </div>
  );
}

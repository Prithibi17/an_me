import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn(
      "relative inline-flex shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-white via-[#f7f7fb] to-[#e9e7f2] ring-1 ring-white/20 shadow-[0_0_22px_rgba(255,47,109,0.16)]",
      compact ? "h-8 w-[76px]" : "h-10 w-[104px]",
      className,
    )}>
      <Image src="/anme-logo.png" alt="An:me" fill priority sizes={compact ? "76px" : "104px"} className="object-contain p-1" />
    </span>
  );
}

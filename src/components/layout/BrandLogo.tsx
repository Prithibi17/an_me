import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn(
      "relative inline-flex shrink-0 drop-shadow-[0_0_14px_rgba(255,47,109,0.2)]",
      compact ? "h-8 w-[80px]" : "h-10 w-[108px]",
      className,
    )}>
      <Image src="/anme-logo-dark.png" alt="An:me" fill priority sizes={compact ? "80px" : "108px"} className="object-contain" />
    </span>
  );
}

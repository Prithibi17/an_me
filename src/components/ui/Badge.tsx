import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "accent" | "rating" | "secondary" | "rank";
  children: React.ReactNode;
}

export function Badge({ variant = "secondary", className, children, ...props }: BadgeProps) {
  const variantStyles = {
    accent: "bg-[#7657FF]/15 text-[#7657FF] border border-[#7657FF]/30",
    rating: "bg-[#F5C451]/15 text-[#F5C451] border border-[#F5C451]/30 font-semibold",
    secondary: "bg-[#161B22] text-[#9CA3AF] border border-white/5",
    rank: "bg-[#080A0D]/80 backdrop-blur-md text-white font-mono font-bold border border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs leading-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

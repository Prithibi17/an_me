import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#161B22]/80", className)}
      {...props}
    />
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

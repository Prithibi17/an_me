import { Skeleton } from "@/components/ui/Skeleton";

export default function DetailsLoading() {
  return (
    <div className="min-h-screen bg-[#080A0D]">
      <div className="relative min-h-[520px] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="relative mx-auto flex max-w-[1360px] items-end gap-8 px-6 pb-12 pt-24">
          <Skeleton className="hidden aspect-[2/3] w-56 shrink-0 rounded-xl sm:block" />
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-5 w-52 rounded" />
            <Skeleton className="h-14 w-4/5 rounded" />
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-20 w-full rounded" />
            <div className="flex gap-3"><Skeleton className="h-12 w-44 rounded-lg" /><Skeleton className="h-12 w-36 rounded-lg" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/Skeleton";

export default function AnimeLoading() {
  return (
    <div className="min-h-screen bg-[#080A0D] px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-[1720px] space-y-5">
        <Skeleton className="h-4 w-52 rounded" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="aspect-video rounded-xl lg:col-span-9" />
          <div className="space-y-3 rounded-xl border border-white/5 bg-[#13151b] p-4 lg:col-span-3">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-9 w-full rounded" />
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-11 w-full rounded" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

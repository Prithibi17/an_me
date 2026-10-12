export default function SearchLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1720px] bg-[#0a0b0e] px-3 py-6 text-white sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading anime releases">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 xl:col-span-9">
          <div className="mb-5 h-8 w-52 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 30 }, (_, index) => (
              <div key={index} className="min-w-0">
                <div className="aspect-[3/4] animate-pulse rounded-md bg-[#171923]" />
                <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-2.5 w-3/5 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        </section>
        <aside className="hidden space-y-5 lg:col-span-4 lg:block xl:col-span-3">
          <div className="h-72 animate-pulse rounded-xl border border-white/5 bg-[#12141b]" />
          <div className="h-[520px] animate-pulse rounded-xl border border-white/5 bg-[#12141b]" />
        </aside>
      </div>
    </main>
  );
}

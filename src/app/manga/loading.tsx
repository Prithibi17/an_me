export default function MangaLoading() {
  return <div className="min-h-screen animate-pulse bg-[#0a0b0e]"><div className="h-[430px] bg-white/5" /><div className="mx-auto max-w-[1720px] space-y-8 p-6"><div className="h-24 rounded-2xl bg-white/5" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-[2/3] rounded-lg bg-white/5" />)}</div></div></div>;
}

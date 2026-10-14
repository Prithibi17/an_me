"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { BookMarked } from "lucide-react";

export function ContinueReading() {
  const hasHistory = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => Boolean(localStorage.getItem("manga-reading-history")),
    () => false,
  );
  return <section className="rounded-2xl border border-white/8 bg-gradient-to-r from-[#141722] to-[#101219] p-5">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-[#ff2f6d]/15 p-3"><BookMarked className="h-5 w-5 text-[#ff2f6d]" /></div><div><h2 className="font-black">Continue Reading</h2><p className="mt-0.5 text-xs text-white/45">{hasHistory ? "Continue from your latest saved chapter." : "Your recent manga and chapters will appear here."}</p></div>{hasHistory ? <Link href="/manga/library" className="ml-auto text-xs font-bold text-[#ff2f6d]">Open library →</Link> : null}</div>
  </section>;
}

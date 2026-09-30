"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Newspaper,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Play,
  X,
  Share2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  category: "Announcements" | "Trailers" | "Production" | "Broadcast";
  date: string;
  readTime: string;
  bannerImage: string;
  posterImage: string;
  summary: string;
  content: string[];
  relatedAnimeId?: number;
  relatedAnimeTitle?: string;
  source: string;
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "news-1",
    title: "Jujutsu Kaisen Season 3 'Culling Game Arc' Formally Enters Full Production",
    category: "Announcements",
    date: "Sep 28, 2026",
    readTime: "3 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
    summary: "MAPPA and the production committee have revealed initial key visuals and key staff returns for the Culling Game Arc.",
    content: [
      "Following the monumental climax of the Shibuya Incident arc, TOHO Animation and studio MAPPA have officially confirmed that Jujutsu Kaisen Season 3 is advancing into full production.",
      "The upcoming season will adapt the highly anticipated Culling Game Arc, bringing Yuji Itadori, Megumi Fushiguro, and new sorcerers into a deadly nationwide battle orchestrated by Kenjaku.",
      "Director and action supervision leads from Season 2 are returning to ensure cinematic continuity, with high-definition digital releases scheduled across international streaming services.",
    ],
    relatedAnimeId: 113415,
    relatedAnimeTitle: "Jujutsu Kaisen",
    source: "TOHO Animation Official",
  },
  {
    id: "news-2",
    title: "Chainsaw Man – The Movie: Reze Arc Theatrical Global Release Dates Confirmed",
    category: "Trailers",
    date: "Sep 27, 2026",
    readTime: "4 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png",
    summary: "The Bomb Girl arc will debut in IMAX theaters worldwide, featuring an all-new theme song and uncut cinematic action sequences.",
    content: [
      "MAPPA announced today during their annual stage showcase that Chainsaw Man – The Movie: Reze Arc will receive a coordinated global theatrical release.",
      "Covering the explosive relationship between Denji and Reze, the movie will showcase next-generation animation sequences specifically crafted for large-format IMAX theater screens.",
      "Pre-sale tickets and limited-edition merchandise will be available starting next month, alongside exclusive soundtrack previews.",
    ],
    relatedAnimeId: 127230,
    relatedAnimeTitle: "Chainsaw Man",
    source: "MAPPA Stage Event",
  },
  {
    id: "news-3",
    title: "One Piece Final Saga: Eiichiro Oda Shares Special Message on Upcoming Arc Climax",
    category: "Broadcast",
    date: "Sep 26, 2026",
    readTime: "2 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
    summary: "Toei Animation announces a brief broadcast recap special before entering the climax of the Egghead Island storyline.",
    content: [
      "Eiichiro Oda published an inspiring note praising the global fanbase for their overwhelming support throughout the Egghead Island arc.",
      "The anime series has broken international viewership records with its modern cinematic visual style and high-framerate battle direction.",
      "New episodes will continue broadcasting every Sunday with official sub and dub releases tracking strictly to international air dates.",
    ],
    relatedAnimeId: 21,
    relatedAnimeTitle: "One Piece",
    source: "Weekly Shonen Jump / Toei Animation",
  },
  {
    id: "news-4",
    title: "Frieren: Beyond Journey's End Season 2 Greenlit with Studio Madhouse Returning",
    category: "Announcements",
    date: "Sep 25, 2026",
    readTime: "3 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    summary: "The award-winning fantasy epic will continue the journey northward towards Ende with the original creative team intact.",
    content: [
      "Madhouse has confirmed Season 2 of Frieren: Beyond Journey's End following its extraordinary global critical acclaim.",
      "Evan Call will return as composer alongside the original voice cast for Frieren, Fern, and Stark as they continue their expedition into the northern plateaus.",
    ],
    relatedAnimeId: 154587,
    relatedAnimeTitle: "Frieren: Beyond Journey's End",
    source: "Aniplex Newsroom",
  },
  {
    id: "news-5",
    title: "Solo Leveling Season 2 'Arise from the Shadow' Extended Trailer Breakdown",
    category: "Trailers",
    date: "Sep 24, 2026",
    readTime: "5 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
    summary: "A-1 Pictures unveils a thrilling 2-minute look at Sung Jinwoo's battle against the Red Gate beasts and high orcs.",
    content: [
      "Sung Jinwoo's evolution continues as the Shadow Monarch in the explosive upcoming second season.",
      "The preview showcases higher production values, expanded fight choreography, and brand-new tracks produced by Hiroyuki Sawano.",
    ],
    relatedAnimeId: 151807,
    relatedAnimeTitle: "Solo Leveling",
    source: "A-1 Pictures Official",
  },
  {
    id: "news-6",
    title: "Dan Da Dan Anime Adaptation Premieres with Explosive New Key Visual & Cast Announcement",
    category: "Production",
    date: "Sep 23, 2026",
    readTime: "3 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
    summary: "Science SARU brings Yukinobu Tatsu's supernatural action manga to life with unmatched dynamic animation.",
    content: [
      "Science SARU's upcoming anime series Dan Da Dan has unveiled its latest theatrical key visual and confirmed international broadcast windows.",
      "Fans can anticipate high-energy occult battles combining ghosts, aliens, and adolescent romance directed by Fuga Yamashiro.",
    ],
    relatedAnimeId: 171018,
    relatedAnimeTitle: "Dan Da Dan",
    source: "Science SARU Studio",
  },
  {
    id: "news-7",
    title: "Demon Slayer: Kimetsu no Yaiba Infinity Castle Arc Movie Trilogy Officially Announced",
    category: "Announcements",
    date: "Sep 22, 2026",
    readTime: "4 min read",
    bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    posterImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
    summary: "Ufotable will adapt the monumental Infinity Castle arc as a three-part cinematic theatrical event.",
    content: [
      "Following the Hashira Training Arc finale, Aniplex and Ufotable confirmed that the final confrontation against Muzan Kibutsuji will premiere exclusively in cinemas as a feature-film trilogy.",
      "Crunchyroll and Sony Pictures Entertainment will distribute the trilogy worldwide across standard and premium IMAX formats.",
    ],
    relatedAnimeId: 101922,
    relatedAnimeTitle: "Demon Slayer",
    source: "Ufotable Production Committee",
  },
];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const categories = ["All", "Announcements", "Trailers", "Production", "Broadcast"];

  const filteredNews =
    activeCategory === "All"
      ? NEWS_ARTICLES
      : NEWS_ARTICLES.filter((item) => item.category === activeCategory);

  return (
    <div className="w-full min-h-screen bg-[#0a0b0e] text-[#F5F7FA] py-6 px-3 sm:px-6 max-w-[1720px] mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff2f6d]/15 text-[#ff2f6d] flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Anime News & Updates
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-bold">
                Official Bulletins
              </span>
            </h1>
            <span className="text-xs text-white/50">
              Breaking releases, studio announcements, episode schedules, and trailers.
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-[#ff2f6d] text-white shadow-sm shadow-[#ff2f6d]/20"
                    : "bg-[#181a24] hover:bg-[#222533] text-white/70"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Big Spotlight Card */}
      {filteredNews.length > 0 && (
        <div
          onClick={() => setSelectedArticle(filteredNews[0])}
          className="relative w-full rounded-2xl overflow-hidden bg-[#13151b] border border-white/10 shadow-2xl mb-8 group cursor-pointer"
        >
          <div className="relative aspect-[21/9] min-h-[280px] sm:min-h-[360px] w-full">
            <Image
              src={filteredNews[0].bannerImage}
              alt={filteredNews[0].title}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e14] via-[#0d0e14]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e14] via-[#0d0e14]/60 to-transparent" />

            {/* Content overlay */}
            <div className="absolute inset-0 p-5 sm:p-8 flex items-end justify-between gap-6">
              <div className="flex flex-col gap-2.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-[#ff2f6d] text-white font-extrabold text-[10px] uppercase tracking-wide">
                    {filteredNews[0].category}
                  </span>
                  <span className="text-xs text-white/60">•</span>
                  <span className="text-xs text-white/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {filteredNews[0].date}
                  </span>
                  <span className="text-xs text-white/60">•</span>
                  <span className="text-xs text-white/60">{filteredNews[0].readTime}</span>
                </div>

                <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white group-hover:text-[#ff2f6d] transition-colors leading-tight">
                  {filteredNews[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed">
                  {filteredNews[0].summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Remaining Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.slice(1).map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="group flex flex-col rounded-xl overflow-hidden bg-[#13151b] border border-white/5 hover:border-white/10 transition-all cursor-pointer shadow-md"
          >
            {/* Card Thumbnail (Official Landscape Banner) */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#1a1c26]">
              <Image
                src={item.bannerImage}
                alt={item.title}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-bold text-[#ff2f6d] uppercase">
                {item.category}
              </span>
            </div>

            {/* Card Info */}
            <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.readTime}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#ff2f6d] transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#ff2f6d] font-bold">
                <span>Read full report</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-7 flex flex-col gap-5 select-none max-h-[90vh] overflow-y-auto"
          >
            {/* Close */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col gap-2 pr-6">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="px-2 py-0.5 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] font-extrabold text-[10px] uppercase">
                  {selectedArticle.category}
                </span>
                <span>•</span>
                <span>{selectedArticle.date}</span>
                <span>•</span>
                <span>Source: {selectedArticle.source}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {selectedArticle.title}
              </h2>
            </div>

            {/* Banner Header in Reader */}
            <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-[#181a24] border border-white/10 shadow-lg">
              <Image
                src={selectedArticle.bannerImage}
                alt={selectedArticle.title}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Article Content */}
            <div className="flex flex-col gap-3 text-xs sm:text-sm text-white/80 leading-relaxed">
              {selectedArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Related Anime Watch Link */}
            {selectedArticle.relatedAnimeId && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#181a24] to-[#1e1522] border border-[#ff2f6d]/30 flex items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-[#ff2f6d] fill-current" />
                  <span className="text-xs font-bold text-white">
                    Watch {selectedArticle.relatedAnimeTitle} on An:me
                  </span>
                </div>
                <Link
                  href={`/anime/${selectedArticle.relatedAnimeId}/details`}
                  onClick={() => setSelectedArticle(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#ff2f6d] hover:bg-[#e9235e] text-white text-xs font-bold transition-all shadow-sm shadow-[#ff2f6d]/20"
                >
                  Stream Now →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

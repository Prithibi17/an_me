"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Heart, ChevronRight } from "lucide-react";

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  badge?: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
}

const SEEDED_IDS = new Set(["post-1", "post-2", "post-3", "post-4"]);

export function TrendingPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kumo_community_discussions");
      if (!saved) return;
      const parsed = JSON.parse(saved) as CommunityPost[];
      setPosts(parsed.filter((post) => !SEEDED_IDS.has(post.id)).slice(0, 4));
    } catch {
      setPosts([]);
    }
  }, []);

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 flex flex-col gap-3 select-none my-4">
      <h3 className="text-base font-black text-white pb-2 border-b border-white/5">Community Posts</h3>

      {posts.length === 0 ? (
        <div className="py-6 text-center text-xs text-white/45">
          No community posts yet. Start the first real discussion.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {posts.map((post) => (
            <div key={post.id} className="py-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">{post.avatar}</span>
                <span className="font-bold text-white/90">{post.author}</span>
                {post.badge && <span className="px-1 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] text-[9px] font-black">{post.badge}</span>}
                <span className="text-[10px] text-white/40 ml-auto">{post.timeAgo}</span>
              </div>
              <h4 className="font-bold text-white line-clamp-1">{post.title}</h4>
              <p className="text-white/50 text-[11px] line-clamp-2 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 text-[11px] text-white/40 pt-1">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{post.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-[#ff2f6d]" />{post.replies}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/community" className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 rounded bg-[#181a24] hover:bg-[#202330] text-xs font-bold text-white/80 transition-colors">
        <span>Open Community</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

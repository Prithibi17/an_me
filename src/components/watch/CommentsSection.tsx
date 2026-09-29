"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, Smile, AlertCircle } from "lucide-react";
import { getCurrentUser, subscribeToAuth, type UserProfile } from "@/lib/storage/auth";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timeAgo: string;
  episode: number;
  isSpoiler: boolean;
  upvotes: number;
}

export function CommentsSection({
  animeId,
  currentEpisode,
  totalEpisodes,
  onSelectEpisode,
}: {
  animeId: number;
  currentEpisode: number;
  totalEpisodes: number;
  onSelectEpisode: (ep: number) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [unblurredSpoilers, setUnblurredSpoilers] = useState<Record<string, boolean>>({});

  // Load comments from localStorage
  useEffect(() => {
    setUser(getCurrentUser());
    return subscribeToAuth(setUser);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`comments_${animeId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Comment[];
        const realComments = parsed.filter((comment) => !["c-1", "c-2", "c-3"].includes(comment.id));
        setComments(realComments);
        localStorage.setItem(`comments_${animeId}`, JSON.stringify(realComments));
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  }, [animeId]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment: Comment = {
      id: "c-" + Date.now(),
      author: user.username,
      avatar: user.avatar || user.username.charAt(0).toUpperCase(),
      content: commentText.trim(),
      timeAgo: "Just now",
      episode: currentEpisode,
      isSpoiler: isSpoiler,
      upvotes: 0,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentText("");
    setIsSpoiler(false);

    try {
      localStorage.setItem(`comments_${animeId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleUpvote = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c))
    );
  };

  const toggleSpoilerReveal = (id: string) => {
    setUnblurredSpoilers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 sm:p-5 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-white">Comments</h3>
          <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/80">
            Community Guidelines <span className="text-[#ff5c8a] ml-1">NEW</span>
          </span>
        </div>

        {/* Controls: Episode Filter, Count, Sort */}
        <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
          {/* Episode selector */}
          <select
            value={currentEpisode}
            onChange={(e) => onSelectEpisode(Number(e.target.value))}
            className="bg-[#1b1e27] border border-white/10 rounded px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
          >
            {Array.from({ length: Math.min(totalEpisodes, 100) }, (_, i) => i + 1).map((ep) => (
              <option key={ep} value={ep}>
                Episode {ep}
              </option>
            ))}
          </select>

          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#ff5c8a]" />
            <span>{comments.length} Comments</span>
          </span>

          <button
            onClick={() => setSortBy((prev) => (prev === "top" ? "newest" : "top"))}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Sort by ⇅ ({sortBy === "top" ? "Top" : "Newest"})
          </button>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handlePostComment} className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-[#202430] flex items-center justify-center text-sm shrink-0">
          {user?.avatar || user?.username.charAt(0).toUpperCase() || "👤"}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs font-bold text-white/70">
            {user ? `Comment as ${user.username}` : "Log in to leave a comment"}
          </span>
          <div className="relative">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "Leave a comment" : "Sign in to join the discussion"}
              disabled={!user}
              className="w-full bg-[#181a24] rounded-md p-3 text-xs text-white placeholder-white/40 border border-white/10 focus:border-[#ff5c8a]/50 focus:outline-none transition-colors resize-none"
            />
            <button
              type="button"
              onClick={() => setCommentText((prev) => prev + " 🔥")}
              className="absolute right-3 bottom-3 text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="rounded bg-[#1b1e27] border-white/20 text-[#ff5c8a] focus:ring-0 cursor-pointer"
              />
              <span>Spoiler?</span>
            </label>

            <button
              type="submit"
              disabled={!user || !commentText.trim()}
              className="px-4 py-1.5 rounded-md bg-[#ff5c8a] hover:bg-[#ff4377] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm shadow-[#ff5c8a]/20 cursor-pointer"
            >
              Comment
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="flex flex-col divide-y divide-white/5 pt-2">
        {comments.length === 0 && (
          <div className="py-8 text-center text-xs text-white/45">
            No comments yet. Be the first to start the discussion.
          </div>
        )}
        {comments.map((comment) => {
          const isRevealed = unblurredSpoilers[comment.id];
          return (
            <div key={comment.id} className="py-3 flex gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#202430] flex items-center justify-center text-sm shrink-0">
                {comment.avatar}
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{comment.author}</span>
                  <span className="text-[10px] text-white/40">{comment.timeAgo}</span>
                  {comment.isSpoiler && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Spoiler
                    </span>
                  )}
                </div>

                {comment.isSpoiler && !isRevealed ? (
                  <div className="p-2.5 rounded bg-[#1c1f2a] border border-amber-500/20 flex items-center justify-between">
                    <span className="text-white/60 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      This comment contains spoilers.
                    </span>
                    <button
                      onClick={() => toggleSpoilerReveal(comment.id)}
                      className="text-[#ff5c8a] font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Reveal
                    </button>
                  </div>
                ) : (
                  <p className="text-white/80 leading-relaxed text-xs">
                    {comment.content}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1 text-[11px] text-white/50 font-semibold">
                  <button
                    onClick={() => toggleUpvote(comment.id)}
                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.upvotes}</span>
                  </button>
                  <button className="hover:text-white transition-colors cursor-pointer">
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                  <button className="hover:text-white transition-colors cursor-pointer">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

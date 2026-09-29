"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Heart,
  Plus,
  Search,
  Send,
  User,
  X,
  Share2,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser, subscribeToAuth, type UserProfile } from "@/lib/storage/auth";
import { cn } from "@/lib/utils";

interface DiscussionPost {
  id: string;
  author: string;
  avatar: string;
  badge?: string;
  category: string;
  title: string;
  content: string;
  timeAgo: string;
  likes: number;
  replies: number;
  comments: { author: string; text: string; time: string }[];
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // New post form fields
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newContent, setNewContent] = useState("");

  // Comment input
  const [commentText, setCommentText] = useState("");

  // Load persisted community discussions
  useEffect(() => {
    setUser(getCurrentUser());
    const unsubscribe = subscribeToAuth(setUser);
    try {
      const saved = localStorage.getItem("kumo_community_discussions");
      if (saved) {
        const parsed = JSON.parse(saved) as DiscussionPost[];
        const seededIds = new Set(["post-1", "post-2", "post-3", "post-4"]);
        const realPosts = parsed.filter((post) => !seededIds.has(post.id));
        setPosts(realPosts);
        localStorage.setItem("kumo_community_discussions", JSON.stringify(realPosts));
      }
    } catch (e) {
      console.error(e);
    }
    return unsubscribe;
  }, []);

  const savePosts = (newPosts: DiscussionPost[]) => {
    setPosts(newPosts);
    try {
      localStorage.setItem("kumo_community_discussions", JSON.stringify(newPosts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedPosts[id];
    setLikedPosts((prev) => ({ ...prev, [id]: !isLiked }));

    const updated = posts.map((p) => {
      if (p.id === id) {
        return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (!user) return;
    const newPostItem: DiscussionPost = {
      id: "post-" + Date.now(),
      author: user.username,
      avatar: user.avatar || user.username.charAt(0).toUpperCase(),
      badge: user.isVip ? "VIP" : undefined,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      timeAgo: "Just now",
      likes: 0,
      replies: 0,
      comments: [],
    };

    const updated = [newPostItem, ...posts];
    savePosts(updated);
    setNewTitle("");
    setNewContent("");
    setShowNewPostModal(false);
    setSelectedPost(newPostItem);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost) return;

    if (!user) return;
    const commentAuthor = user.username;
    const updatedPost = {
      ...selectedPost,
      replies: selectedPost.replies + 1,
      comments: [
        ...selectedPost.comments,
        { author: commentAuthor, text: commentText.trim(), time: "Just now" },
      ],
    };

    const updatedPosts = posts.map((p) => (p.id === selectedPost.id ? updatedPost : p));
    savePosts(updatedPosts);
    setSelectedPost(updatedPost);
    setCommentText("");
  };

  const categories = [
    "All",
    "Episode Reactions",
    "Recommendations",
    "General",
    "Fan Theories",
  ];

  const filteredPosts = posts.filter((p) => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#0a0b0e] text-[#F5F7FA] py-6 px-3 sm:px-6 max-w-[1720px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff5c8a]/15 text-[#ff5c8a] flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Community Forum
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-bold">
                Live Feed
              </span>
            </h1>
            <span className="text-xs text-white/50">
              Discuss episodes, share theories, and connect with anime fans worldwide.
            </span>
          </div>
        </div>

        {/* Action Button: New Post */}
        <button
          onClick={() => user && setShowNewPostModal(true)}
          disabled={!user}
          title={user ? "Create a discussion" : "Log in to create a discussion"}
          className="px-4 py-2 rounded-xl bg-[#ff5c8a] hover:bg-[#ff4377] text-white font-bold text-xs transition-all shadow-md shadow-[#ff5c8a]/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </button>
      </div>

      {/* Filter Strip & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-[#ff5c8a] text-white shadow-sm shadow-[#ff5c8a]/20"
                    : "bg-[#181a24] hover:bg-[#222533] text-white/70"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff5c8a]/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Discussion List */}
      <div className="flex flex-col gap-3">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-white/40 text-xs flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-white/20" />
            <span className="font-bold text-white/60">No discussions found</span>
            <span>Be the first to start a conversation in this category!</span>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="p-4 sm:p-5 rounded-xl bg-[#13151b] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-3 cursor-pointer group shadow-sm"
              >
                {/* Author row & Category */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#1c1f28] flex items-center justify-center text-sm">
                      {post.avatar}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {post.author}
                    </span>
                    {post.badge && (
                      <span className="px-1.5 py-0.2 rounded bg-[#ff5c8a]/20 text-[#ff5c8a] text-[9px] font-extrabold uppercase">
                        {post.badge}
                      </span>
                    )}
                    <span className="text-[11px] text-white/40">•</span>
                    <span className="text-[11px] text-white/40">{post.timeAgo}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-semibold">
                    {post.category}
                  </span>
                </div>

                {/* Title & snippet */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#ff5c8a] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Footer Reactions & Reply Count */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs text-white/50">
                  <button
                    onClick={(e) => handleLike(post.id, e)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors cursor-pointer",
                      isLiked ? "text-[#ff5c8a] font-bold" : "hover:text-[#ff5c8a]"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                    <span>{post.likes}</span>
                  </button>

                  <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.replies} replies</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Detail & Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 select-none max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Author & Category */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-7 h-7 rounded-full bg-[#1c1f28] flex items-center justify-center text-sm">
                {selectedPost.avatar}
              </span>
              <span className="font-bold text-white">{selectedPost.author}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/40">{selectedPost.timeAgo}</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-bold ml-auto mr-6">
                {selectedPost.category}
              </span>
            </div>

            {/* Title & Content */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {selectedPost.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed bg-[#181a24] p-3.5 rounded-xl border border-white/5">
                {selectedPost.content}
              </p>
            </div>

            {/* Comments List */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-white/80">
                Comments ({selectedPost.comments.length})
              </span>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {selectedPost.comments.length === 0 ? (
                  <span className="text-xs text-white/40 py-2">
                    No comments yet. Start the conversation below!
                  </span>
                ) : (
                  selectedPost.comments.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/5 flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span className="font-bold text-[#ff5c8a]">{c.author}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-white/80 text-xs">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder={user ? "Write a comment..." : "Log in to comment"}
                  disabled={!user}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg bg-[#181a24] text-xs text-white placeholder-white/30 border border-white/5 focus:border-[#ff5c8a]/50 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!user || !commentText.trim()}
                  className="px-4 h-9 rounded-lg bg-[#ff5c8a] hover:bg-[#ff4377] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 select-none"
          >
            <button
              onClick={() => setShowNewPostModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-white">Create New Discussion</h2>

            <form onSubmit={handleCreatePost} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-white/70">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
                >
                  <option value="Episode Reactions">Episode Reactions</option>
                  <option value="Recommendations">Recommendations</option>
                  <option value="General">General</option>
                  <option value="Fan Theories">Fan Theories</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-white/70">Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. My thoughts on the latest episode animation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10 px-3.5 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff5c8a]/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-white/70">Content</label>
                <textarea
                  rows={4}
                  placeholder="Share your discussion, review, or thoughts with the community..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="p-3.5 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff5c8a]/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim() || !newContent.trim()}
                className="w-full h-10 mt-1 rounded-lg bg-[#ff5c8a] hover:bg-[#ff4377] text-white font-bold text-xs transition-all shadow-md shadow-[#ff5c8a]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                Publish Discussion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

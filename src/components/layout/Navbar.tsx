"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Users,
  Shuffle,
  Languages,
  Newspaper,
  MessageSquare,
  Send,
  Radio,
  LogOut,
  Bookmark,
  History,
  ChevronDown,
} from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { WatchTogetherModal } from "@/components/watch2gether/WatchTogetherModal";
import { logoutUser, refreshCurrentUser, subscribeToAuth, updateAvatar, UserProfile } from "@/lib/storage/auth";
import { useAnimeNameLanguage } from "@/lib/storage/language";
import { cn } from "@/lib/utils";
import { NavbarSearch } from "./NavbarSearch";
import { SidebarDrawer } from "./SidebarDrawer";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [langPreference, toggleLang] = useAnimeNameLanguage();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth & Modals state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const avatarOptions = ["🌸", "⚔️", "👒", "🔥", "🐉", "🧣", "🤞", "🗡️", "🐱", "🦊", "🐼", "🐧", "🌙", "⭐", "🎮", "🎧"];

  useEffect(() => {
    refreshCurrentUser().then(setUser);
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleRandom = () => {
    const randomIds = [21, 154587, 140960, 16498, 113415, 101922, 11061, 1535, 170942];
    const picked = randomIds[Math.floor(Math.random() * randomIds.length)];
    router.push("/anime/" + picked);
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#0f1015] border-b border-white/5 py-2.5 px-4 sm:px-6 select-none transition-colors">
        <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile Menu + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* An:me Logo */}
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                An<span className="text-[#ff5c8a]">:</span>me
              </span>
            </Link>
          </div>

          {/* Center: Live Search Bar with Filter Button & Dropdown Autocomplete */}
          <div className="flex-1 max-w-xl mx-2 hidden sm:block">
            <NavbarSearch langPreference={langPreference} />
          </div>

          {/* Right Nav Icons + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Social icons */}
            <div className="hidden xl:flex items-center gap-1.5 mr-2">
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                title="Discord"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#229ED9] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                title="Telegram"
              >
                <Send className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://reddit.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#FF4500] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                title="Reddit"
              >
                <Radio className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick Actions Bar */}
            <div className="hidden lg:flex items-center gap-3.5 text-[11px] font-medium text-white/80">
              {/* 1. Watch Together Button */}
              <button
                type="button"
                onClick={() => setIsWatchModalOpen(true)}
                className="flex items-center gap-1.5 hover:text-[#ff5c8a] transition-colors cursor-pointer group"
                title="Start or join a synchronized watch party"
              >
                <Users className="w-4 h-4 text-[#ff5c8a] group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-white/90 group-hover:text-white">Watch Together</span>
              </button>

              {/* Random Anime */}
              <button
                type="button"
                onClick={handleRandom}
                className="flex items-center gap-1 hover:text-[#ff5c8a] transition-colors cursor-pointer"
                title="Random Anime"
              >
                <Shuffle className="w-3.5 h-3.5 text-white/70" />
                <span>Random</span>
              </button>

              {/* Language Name Toggle */}
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/90 transition-colors cursor-pointer"
                title="Toggle Anime Name Display"
              >
                <Languages className="w-3 h-3 text-[#ff5c8a]" />
                <span>{langPreference} Anime Name</span>
              </button>

              {/* 2. News Link */}
              <Link
                href="/news"
                className={cn(
                  "flex items-center gap-1.5 transition-colors cursor-pointer group",
                  pathname === "/news" ? "text-[#ff5c8a] font-bold" : "hover:text-[#ff5c8a]"
                )}
                title="Anime News & Official Bulletins"
              >
                <Newspaper className="w-3.5 h-3.5 text-white/70 group-hover:text-[#ff5c8a] transition-colors" />
                <span>News</span>
              </Link>

              {/* 3. Community Link */}
              <Link
                href="/community"
                className={cn(
                  "flex items-center gap-1.5 transition-colors cursor-pointer group",
                  pathname === "/community" ? "text-[#ff5c8a] font-bold" : "hover:text-[#ff5c8a]"
                )}
                title="Community Discussion Forum"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white/70 group-hover:text-[#ff5c8a] transition-colors" />
                <span>Community</span>
              </Link>
            </div>

            {/* Mobile search trigger */}
            <button
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              className={cn(
                "sm:hidden p-2 rounded-lg transition-colors cursor-pointer",
                isMobileSearchOpen
                  ? "text-[#ff5c8a] bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              )}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 4. Login Button / User Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-[#181a24] hover:bg-[#202330] border border-white/10 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#ff5c8a] text-white font-black text-[10px] flex items-center justify-center">
                    {user.avatar || user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white max-w-[90px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-48 bg-[#13151b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 flex flex-col text-xs"
                  >
                    <div className="px-3.5 py-2 border-b border-white/5 flex flex-col gap-0.5">
                      <span className="font-bold text-white truncate">{user.username}</span>
                      <span className="text-[10px] text-white/40 truncate">{user.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker((prev) => !prev)}
                      className="px-3.5 py-2 hover:bg-white/5 text-white/80 hover:text-white flex items-center gap-2 transition-colors text-left"
                    >
                      <span className="w-4 text-center">{user.avatar || "🙂"}</span>
                      <span>Change avatar</span>
                    </button>

                    {showAvatarPicker && (
                      <div className="grid grid-cols-4 gap-1.5 px-3 pb-2" aria-label="Choose avatar">
                        {avatarOptions.map((avatar) => (
                          <button
                            key={avatar}
                            type="button"
                            disabled={avatarSaving}
                            onClick={async () => {
                              setAvatarSaving(true);
                              try {
                                const updated = await updateAvatar(avatar);
                                setUser(updated);
                                setShowAvatarPicker(false);
                              } catch (error) {
                                console.error(error);
                              } finally {
                                setAvatarSaving(false);
                              }
                            }}
                            className={cn(
                              "h-8 rounded-md text-base hover:bg-white/10 transition-colors disabled:opacity-50",
                              user.avatar === avatar && "bg-[#ff5c8a]/20 ring-1 ring-[#ff5c8a]/50"
                            )}
                            aria-label={`Use ${avatar} avatar`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/my-list?tab=watchlist"
                      onClick={() => setShowUserMenu(false)}
                      className="px-3.5 py-2 hover:bg-white/5 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#ff5c8a]" />
                      <span>Watchlist</span>
                    </Link>

                    <Link
                      href="/my-list?tab=history"
                      onClick={() => setShowUserMenu(false)}
                      className="px-3.5 py-2 hover:bg-white/5 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Watch History</span>
                    </Link>

                    <div className="border-t border-white/5 mt-1" />

                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        setShowUserMenu(false);
                        setShowAvatarPicker(false);
                      }}
                      className="px-3.5 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors text-left w-full cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[#ff5c8a] hover:bg-[#ff4377] text-white text-xs font-bold transition-all shadow-sm shadow-[#ff5c8a]/20 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Input Overlay */}
        {isMobileSearchOpen && (
          <div className="sm:hidden w-full pt-2 px-2 pb-1 animate-in fade-in duration-150">
            <NavbarSearch
              langPreference={langPreference}
              onCloseMobile={() => setIsMobileSearchOpen(false)}
            />
          </div>
        )}
      </header>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Watch Together Modal */}
      <WatchTogetherModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
      />
    </>
  );
}

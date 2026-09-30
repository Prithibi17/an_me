"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, Sparkles, CheckCircle2 } from "lucide-react";
import { loginUser, registerUser } from "@/lib/storage/auth";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (tab === "register") await registerUser(username, email, password);
      else await loginUser(username || email, password);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#13151b] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 select-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="w-10 h-10 rounded-full bg-[#ff2f6d]/15 text-[#ff2f6d] flex items-center justify-center mb-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white">
            {tab === "login" ? "Welcome Back to An:me" : "Create An:me Account"}
          </h2>
          <p className="text-xs text-white/50">
            Sync watch history, customize your watchlist, and join watch parties.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-lg bg-[#0e1017] p-1 border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={cn(
              "py-2 rounded-md transition-all cursor-pointer",
              tab === "login"
                ? "bg-[#ff2f6d] text-white shadow-sm"
                : "text-white/60 hover:text-white"
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={cn(
              "py-2 rounded-md transition-all cursor-pointer",
              tab === "register"
                ? "bg-[#ff2f6d] text-white shadow-sm"
                : "text-white/60 hover:text-white"
            )}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {tab === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-white/70">Username</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="e.g. OtakuMaster"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff2f6d]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-white/70">
              {tab === "login" ? "Email or Username" : "Email Address"}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={tab === "login" ? "your_name or user@example.com" : "user@example.com"}
                value={tab === "login" ? username || email : email}
                onChange={(e) => {
                  if (tab === "login") {
                    setUsername(e.target.value);
                    setEmail(e.target.value);
                  } else {
                    setEmail(e.target.value);
                  }
                }}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff2f6d]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/70">Password</label>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => alert("Password reset link sent to your email address.")}
                  className="text-[10px] text-[#ff2f6d] hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-white/40" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#181a24] border border-white/5 text-xs text-white placeholder-white/30 focus:border-[#ff2f6d]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSuccess || isSubmitting}
            className="w-full h-10 mt-1 rounded-lg bg-[#ff2f6d] hover:bg-[#e9235e] text-white font-bold text-xs transition-all shadow-md shadow-[#ff2f6d]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Success!</span>
              </>
            ) : (
              <span>{isSubmitting ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

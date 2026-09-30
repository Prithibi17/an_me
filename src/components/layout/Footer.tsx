"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Send, Radio } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const ALPHABET = [
  "All",
  "0-9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export function Footer() {
  return (
    <footer className="w-full bg-[#0a0b0e] border-t border-white/5 text-white/70 py-10 pb-20 md:pb-12 mt-16 select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Top: Logo + Social Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
          <Link href="/" className="flex items-center gap-1">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              title="Discord"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              title="Telegram"
            >
              <Send className="w-4 h-4" />
            </a>
            <a
              href="https://reddit.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              title="Reddit"
            >
              <Radio className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              title="Twitter"
            >
              <span className="font-bold text-xs">X</span>
            </a>
          </div>
        </div>

        {/* Center: A-Z List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              A-Z LIST
            </span>
            <span className="text-xs text-white/40">
              Searching anime order by alphabet name A to Z.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 pt-1">
            {ALPHABET.map((item) => (
              <Link
                key={item}
                href={item === "All" ? "/search" : "/search?letter=" + item}
                className="px-2.5 py-1 rounded bg-[#161820] hover:bg-[#ff2f6d] hover:text-white text-xs font-semibold text-white/80 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Links & Disclaimer */}
        <div className="flex flex-col gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-6 font-semibold text-white/70">
            <Link href="/" className="hover:text-[#ff2f6d] transition-colors">
              Terms of service
            </Link>
            <Link href="/" className="hover:text-[#ff2f6d] transition-colors">
              DMCA
            </Link>
            <Link href="/search" className="hover:text-[#ff2f6d] transition-colors">
              Guides
            </Link>
            <Link href="/" className="hover:text-[#ff2f6d] transition-colors">
              Mirrors
            </Link>
            <Link href="/" className="hover:text-[#ff2f6d] transition-colors">
              Contact
            </Link>
            <Link href="/" className="hover:text-[#ff2f6d] transition-colors">
              Request
            </Link>
          </div>

          <p className="text-white/40 text-[11px] leading-relaxed">
            An:me does not store any files on our server; we only link to media hosted by third-party services.
          </p>
          <p className="text-white/30 text-[11px]">
            &copy; An:me. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

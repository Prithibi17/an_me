import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "**.anilist.co" },
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "img.flawlessfiles.com" },
      { protocol: "https", hostname: "**.ak.crunchyroll.com" },
      { protocol: "https", hostname: "**.crunchyroll.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "anime-and-manwhua.vercel.app" },
      { protocol: "https", hostname: "**.mangadex.network" },
    ],
  },
};

export default nextConfig;

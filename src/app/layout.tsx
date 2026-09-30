import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "An:me • Discover & Stream",
  description: "An:me is a cinematic anime discovery and streaming experience powered by AniList.",
  icons: { icon: "/anme-logo.png", apple: "/anme-logo.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080A0D] text-[#F5F7FA] min-h-screen flex flex-col font-sans selection:bg-[#ff2f6d] selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}

import React from "react";
import Image from "next/image";
import { Character } from "@/lib/anilist/types";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const imageUrl = character.image?.large || character.image?.medium;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#11151B] border border-white/5 hover:border-white/10 transition-colors">
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-[#161B22] shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={character.name.full}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF]">
            ?
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <h4 className="text-sm font-semibold text-[#F5F7FA] truncate">
          {character.name.full}
        </h4>
        <p className="text-xs text-[#9CA3AF] truncate">
          {character.role || "Character"}
        </p>
      </div>
    </div>
  );
}

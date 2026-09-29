import React from "react";
import { Character } from "@/lib/anilist/types";
import { CharacterCard } from "@/components/anime/CharacterCard";

interface CharactersListProps {
  characters?: Character[];
}

export function CharactersList({ characters }: CharactersListProps) {
  if (!characters || characters.length === 0) {
    return (
      <div className="py-12 text-center text-xs md:text-sm text-[#9CA3AF]">
        No character data available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-4">
      {characters.map((char) => (
        <CharacterCard key={char.id} character={char} />
      ))}
    </div>
  );
}

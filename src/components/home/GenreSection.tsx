import React from "react";
import { GenreChip } from "../anime/GenreChip";

const GENRES = [
  "Action",
  "Adventure",
  "Fantasy",
  "Romance",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Mystery",
  "Sports",
  "Horror",
  "Supernatural",
  "Thriller",
];

export function GenreSection() {
  return (
    <section className="w-full py-6">
      <h2 className="text-xl md:text-2xl font-bold text-[#F5F7FA] tracking-tight mb-4">
        Browse by Genre
      </h2>

      <div className="flex flex-wrap gap-2.5">
        {GENRES.map((genre) => (
          <GenreChip key={genre} genre={genre} />
        ))}
      </div>
    </section>
  );
}

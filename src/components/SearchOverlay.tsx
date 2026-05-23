import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { X, Search, Delete, CornerDownLeft, Space } from "lucide-react";
import { searchTMDB } from "../api";

interface SearchOverlayProps {
  onClose: () => void;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  tmdbEnabled?: boolean;
}

const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "-"],
  ["Z", "X", "C", "V", "B", "N", "M", "_", ".", "@"]
];

export default function SearchOverlay({ onClose, movies, onSelectMovie, tmdbEnabled }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Real-time filtering matching our local database + live TMDB
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMovies([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    // 1. Pull instant local movies first
    const localResults = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.genres.some((g) => g.toLowerCase().includes(query)) ||
        m.tagline.toLowerCase().includes(query) ||
        m.cast.some((c) => c.toLowerCase().includes(query))
    );

    if (!tmdbEnabled) {
      setFilteredMovies(localResults);
      return;
    }

    // 2. Debounce and request live database results
    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const liveResults = await searchTMDB(searchQuery);
        // Prioritize and deduplicate
        const unique = [...liveResults];
        localResults.forEach((lm) => {
          if (!unique.some((um) => String(um.id) === String(lm.id))) {
            unique.push(lm);
          }
        });
        setFilteredMovies(unique);
      } catch (err) {
        console.warn("Live TMDB Search fail, using high-quality local state matching", err);
        setFilteredMovies(localResults);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, movies, tmdbEnabled]);

  const handleKeyPress = (char: string) => {
    setSearchQuery((prev) => prev + char);
  };

  const handleBackspace = () => {
    setSearchQuery((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="fixed inset-0 bg-[#141414]/98 z-[200] overflow-y-auto px-6 py-8 md:p-12 animate-fade-in font-sans flex flex-col md:flex-row gap-8">
      {/* Search Keyboard Panel */}
      <div className="w-full md:w-[450px] flex flex-col gap-6 shrink-0 bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">TV Virtual Keyboard</h2>
          <button
            id="search-close"
            tabIndex={0}
            onClick={onClose}
            className="focusable p-2 rounded-full border border-zinc-700 hover:bg-[#E50914] focus:bg-[#E50914] text-white outline-none transition-all duration-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search movie, genre, cast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg pl-10 pr-10 py-3 text-sm focus:border-red-600 outline-none"
            autoFocus
          />
          <Search size={16} className="absolute left-3.5 top-4 text-zinc-500" />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-3 px-1.5 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* virtual key bento panel */}
        <div className="flex flex-col gap-2 select-none">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5 justify-center">
              {row.map((char) => (
                <button
                  key={char}
                  id={`key-${char}`}
                  tabIndex={0}
                  onClick={() => handleKeyPress(char)}
                  className="focusable w-8 h-8 flex items-center justify-center rounded bg-zinc-800 hover:bg-[#E50914] focus:bg-[#E50914] text-xs font-bold text-white outline-none transition-all duration-150 active:scale-95"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}

          {/* Action Row */}
          <div className="flex gap-2 justify-center mt-2">
            <button
              id="key-backspace"
              tabIndex={0}
              onClick={handleBackspace}
              className="focusable flex-1 h-9 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-red-700 focus:bg-[#E50914] rounded text-xs font-semibold text-white outline-none"
            >
              <Delete size={14} /> Backspace
            </button>
            <button
              id="key-space"
              tabIndex={0}
              onClick={() => setSearchQuery((p) => p + " ")}
              className="focusable w-24 h-9 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 focus:bg-zinc-700 rounded text-xs text-white outline-none"
            >
              <Space size={14} /> Space
            </button>
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider mb-2 block">Quick Genre Filters</span>
          <div className="flex flex-wrap gap-2">
            {["Action", "Sci-Fi", "Comedy", "Fantasy", "Animation"].map((g) => (
              <button
                key={g}
                id={`genre-btn-${g.toLowerCase()}`}
                tabIndex={0}
                onClick={() => setSearchQuery(g)}
                className="focusable bg-zinc-800 hover:bg-[#E50914] focus:bg-[#E50914] text-zinc-300 hover:text-white focus:text-white text-xs px-2.5 py-1 rounded-full outline-none transition-all"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results grid panel */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-medium text-white tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Cinematic Highlights"}
            </h3>
            {isSearching && (
              <span className="bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 text-[9px] font-black tracking-widest px-2 py-0.5 rounded animate-pulse uppercase">
                Searching TMDB Live...
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 font-medium font-mono">
            {searchQuery ? `${filteredMovies.length} items found` : `${movies.length} items available`}
          </span>
        </div>

        <div className="flex-1">
          {searchQuery ? (
            filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    id={`search-item-${movie.id}`}
                    tabIndex={0}
                    onClick={() => onSelectMovie(movie)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSelectMovie(movie);
                      }
                    }}
                    className="focusable group bg-zinc-900 border border-zinc-850 hover:border-zinc-500 focus:border-white focus:bg-zinc-800/80 rounded-lg overflow-hidden outline-none cursor-pointer transition-all duration-300"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={movie.backdrop}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-[#E50914] text-[9px] uppercase font-bold px-1.5 text-white rounded">
                        {movie.rating}
                      </div>
                    </div>
                    <div className="p-3">
                      <span className="text-xs text-zinc-400 font-mono">{movie.year} · {movie.duration}</span>
                      <h4 className="text-sm font-semibold text-white group-hover:text-red-500 group-focus:text-red-500 transition-colors truncate mt-1">
                        {movie.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl">🍿</span>
                <h4 className="text-white text-lg font-semibold mt-4">We couldn't match any results</h4>
                <p className="text-gray-400 text-xs max-w-xs mt-1">Try double checking the spelling, or search general genres like Sci-Fi or Animation.</p>
              </div>
            )
          ) : (
            // Default show the default inventory catalog
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  id={`search-item-inv-${movie.id}`}
                  tabIndex={0}
                  onClick={() => onSelectMovie(movie)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSelectMovie(movie);
                    }
                  }}
                  className="focusable group bg-zinc-900 border border-zinc-850 hover:border-zinc-500 focus:border-white focus:bg-zinc-800/80 rounded border-transparent overflow-hidden outline-none cursor-pointer transition-all duration-300"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={movie.backdrop}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all duration-300"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                      <span className="bg-black/75 text-white font-mono text-[9px] px-1 rounded">{movie.year}</span>
                      <span className="bg-emerald-500/90 text-white font-mono text-[9px] px-1.5 rounded">★ {movie.score}</span>
                    </div>
                  </div>
                  <div className="p-2 truncate font-medium text-xs text-zinc-200">{movie.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { KEYBOARD_ROWS as qwerRowKeys };

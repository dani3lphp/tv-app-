import React, { useState } from "react";
import { Movie, Episode } from "../types";
import { Play, Plus, Check, ThumbsUp, ThumbsDown, X, Star } from "lucide-react";

interface DetailModalProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (streamUrl: string, title: string, episodeInfo?: string) => void;
  watchlist: string[];
  onToggleWatchlist: (id: string) => void;
  allMovies: Movie[];
  onNavigateToRecommendations: (recommendedMovie: Movie) => void;
}

export default function DetailModal({
  movie,
  onClose,
  onPlay,
  watchlist,
  onToggleWatchlist,
  allMovies,
  onNavigateToRecommendations
}: DetailModalProps) {
  const isMovieInWatchlist = watchlist.includes(String(movie.id));
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [liked, setLiked] = useState<boolean | null>(null);

  // Recommendations: Find similar items matching genre patterns
  const recommendations = allMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 4);

  // Episodes filtered by selected season
  const filteredEpisodes = movie.episodes?.filter((ep) => ep.season === selectedSeason) || [];

  return (
    <div className="fixed inset-0 bg-black/85 z-[180] flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-[#181818] w-full max-w-4xl rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative my-8">
        
        {/* Close Button Button */}
        <button
          id="detail-close-btn"
          tabIndex={0}
          onClick={onClose}
          className="focusable absolute top-4 right-4 bg-black/70 border border-zinc-700 hover:bg-[#E50914] focus:bg-[#E50914] text-white p-2 rounded-full z-[190] outline-none transition-all duration-300"
        >
          <X size={18} />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-[250px] md:h-[380px] bg-zinc-950">
          <img
            src={movie.backdrop}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Bottom vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30"></div>

          {/* Core metadata overlay */}
          <div className="absolute bottom-6 left-6 md:left-12 right-6">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              {movie.title}
            </h2>
            {movie.tagline && (
              <p className="text-gray-300 text-sm md:text-base font-medium italic mt-2 drop-shadow-md max-w-xl">
                "{movie.tagline}"
              </p>
            )}

            {/* Action buttons block */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                id="detail-action-play"
                tabIndex={0}
                onClick={() => onPlay(movie.streamUrl, movie.title)}
                className="focusable flex items-center gap-2 bg-[#E50914] hover:bg-[#F40612] text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-lg transition-transform duration-200 outline-none hover:scale-105 focus:scale-105"
              >
                <Play size={18} fill="white" />
                Play Content
              </button>

              <button
                id="detail-action-watchlist"
                tabIndex={0}
                onClick={() => onToggleWatchlist(String(movie.id))}
                className="focusable p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white outline-none transition-transform"
                title={isMovieInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                {isMovieInWatchlist ? <Check size={18} className="text-emerald-500" /> : <Plus size={18} />}
              </button>

              <button
                id="detail-action-like"
                tabIndex={0}
                onClick={() => setLiked(true)}
                className={`focusable p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white outline-none transition-transform ${liked === true ? "bg-emerald-500/20 border-emerald-500" : ""}`}
              >
                <ThumbsUp size={16} />
              </button>

              <button
                id="detail-action-dislike"
                tabIndex={0}
                onClick={() => setLiked(false)}
                className={`focusable p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white outline-none transition-transform ${liked === false ? "bg-red-500/20 border-red-500" : ""}`}
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content detail layout split */}
        <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left description block */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-400 font-mono">
              <span className="text-emerald-500 font-bold font-sans flex items-center gap-1">
                <Star size={14} fill="currentColor" /> {movie.score} rating
              </span>
              <span>{movie.year}</span>
              <span className="border border-zinc-700 px-1.5 py-0.2 rounded font-sans text-[10px] font-bold text-white uppercase">{movie.rating}</span>
              <span>{movie.duration}</span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed font-sans font-normal">
              {movie.description}
            </p>

            {/* If TV Show: Show Season and Episodes listing */}
            {movie.type === "tv" && movie.episodes && movie.episodes.length > 0 && (
              <div className="mt-6 border-t border-zinc-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Episodes List</h3>
                  
                  {/* Quick Season selector tabs */}
                  <div className="flex gap-2">
                    {[1, 2].map((seasonNum) => (
                      <button
                        key={seasonNum}
                        id={`season-tab-${seasonNum}`}
                        tabIndex={0}
                        onClick={() => setSelectedSeason(seasonNum)}
                        className={`focusable px-3 py-1 rounded text-xs font-semibold uppercase outline-none ${
                          selectedSeason === seasonNum
                            ? "bg-[#E50914] text-white"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Season {seasonNum}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      id={`ep-item-${ep.id}`}
                      tabIndex={0}
                      onClick={() => onPlay(ep.streamUrl, movie.title, `S${ep.season}E${ep.episode} - ${ep.title}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onPlay(ep.streamUrl, movie.title, `S${ep.season}E${ep.episode} - ${ep.title}`);
                        }
                      }}
                      className="focusable flex items-start gap-4 p-3 bg-zinc-900 hover:bg-zinc-850 focus:bg-zinc-800/80 rounded-lg cursor-pointer outline-none border border-transparent hover:border-zinc-750 focus:border-white transition-all duration-300 group"
                    >
                      <div className="w-[120px] aspect-video rounded overflow-hidden shrink-0 relative bg-zinc-950">
                        <img
                          src={movie.backdrop}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                          <Play size={20} fill="white" className="text-white" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/80 font-mono text-[9px] text-white px-1 py-0.2 rounded">
                          {ep.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-red-500 group-focus:text-red-500 transition-colors truncate">
                          Ep {ep.episode}. {ep.title}
                        </h4>
                        <p className="text-[11px] md:text-xs text-zinc-400 font-sans mt-1 line-clamp-2">
                          {ep.synopsis}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredEpisodes.length === 0 && (
                    <p className="text-zinc-500 text-xs py-4 font-mono">No episodes found or planned in Season {selectedSeason}.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right metadata / related panel */}
          <div className="flex flex-col gap-6">
            <div className="text-xs font-sans">
              <span className="text-zinc-500 block font-semibold uppercase font-mono tracking-wider mb-1.5">Lead Cast:</span>
              <p className="text-gray-300 leading-normal">{movie.cast.join(", ")}</p>
            </div>

            <div className="text-xs font-sans">
              <span className="text-zinc-500 block font-semibold uppercase font-mono tracking-wider mb-1.5">Genres:</span>
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="border border-zinc-800 bg-zinc-900/50 text-zinc-300 px-2.5 py-0.5 rounded-full font-sans shadow-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* "More Like This" Recommendation panel */}
            {recommendations.length > 0 && (
              <div className="border-t border-zinc-800 pt-5">
                <span className="text-xs text-zinc-500 block font-bold font-mono uppercase tracking-wider mb-3">More like this</span>
                <div className="grid grid-cols-2 gap-3">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      id={`rec-item-${rec.id}`}
                      tabIndex={0}
                      onClick={() => onNavigateToRecommendations(rec)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onNavigateToRecommendations(rec);
                        }
                      }}
                      className="focusable cursor-pointer border border-transparent focus:border-white focus:bg-white/5 bg-zinc-900/50 rounded overflow-hidden outline-none hover:opacity-80-all transition-all duration-300 group"
                    >
                      <img
                        src={rec.backdrop}
                        alt={rec.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-16 object-cover object-center group-hover:scale-102"
                      />
                      <div className="p-2 text-[10px] font-semibold text-zinc-300 truncate group-hover:text-red-500">
                        {rec.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export { DetailModal as movieDetails };

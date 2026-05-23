import React, { useState, useEffect, useRef } from "react";
import ProfileSelection from "./components/ProfileSelection";
import Sidebar from "./components/Sidebar";
import VirtualTVRemote from "./components/VirtualTVRemote";
import SearchOverlay from "./components/SearchOverlay";
import DetailModal from "./components/DetailModal";
import HLSPlayer from "./components/HLSPlayer";
import { Profile, Movie } from "./types";
import { fetchCatalog, fetchConfig } from "./api";
import { useTVNavigation, navigateSpatial } from "./navigation/SpatialNavigation";
import { Play, Info, Plus, Check, Star, Tv2, Film, ShieldAlert, MonitorPlay } from "lucide-react";

export default function App() {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState({ tmdbEnabled: false, appVersion: "1.0.0" });

  const [playingMovie, setPlayingMovie] = useState<{ url: string; title: string; epInfo?: string } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // References for sliding filmstrips rows
  const [rowScrollPositions, setRowScrollPositions] = useState<Record<string, number>>({});

  // 1. Fetch initial catalog and backend configuration
  useEffect(() => {
    let active = true;
    async function loadData() {
      const cfg = await fetchConfig();
      let cat = await fetchCatalog();

      if (cfg.tmdbEnabled) {
        try {
          const { fetchLiveTrendingTMDB } = await import("./api");
          const liveTMDB = await fetchLiveTrendingTMDB();
          if (liveTMDB && liveTMDB.length > 0) {
            // Deduplicate: merge live catalog on top of standard base catalog
            const existingIds = new Set(liveTMDB.map(m => String(m.id)));
            const filteredFallback = cat.filter(m => !existingIds.has(String(m.id)));
            cat = [...liveTMDB, ...filteredFallback];
          }
        } catch (tmdbError) {
          console.error("Failed to load TMDB trending catalog, using high-quality local cache", tmdbError);
        }
      }

      if (active) {
        setMovies(cat);
        setApiConfig({ tmdbEnabled: cfg.tmdbEnabled, appVersion: cfg.appVersion });
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  // 2. Load watchlist and watch histories specifically to the selected profile
  useEffect(() => {
    if (!activeProfile) return;

    // Load Local Watchlist
    const cachedWatchlist = localStorage.getItem(`daniflix_watchlist_${activeProfile.id}`);
    setWatchlist(cachedWatchlist ? JSON.parse(cachedWatchlist) : []);

    // Load Continue Watching history catalog
    const cachedHistory = localStorage.getItem(`daniflix_history_${activeProfile.id}`);
    if (cachedHistory) {
      const ids: string[] = JSON.parse(cachedHistory);
      // Map back to our loaded movies list
      const matched = ids
        .map(id => movies.find(m => String(m.id) === String(id)))
        .filter((m): m is Movie => !!m);
      setContinueWatching(matched);
    } else {
      setContinueWatching([]);
    }
  }, [activeProfile, movies]);

  // Support Kids filters: animated & family movies only
  const getFilteredMovies = () => {
    if (!activeProfile) return [];
    let list = [...movies];

    if (activeProfile.isKids) {
      list = list.filter(m => m.genres.some(g => ["Animation", "Family", "Comedy", "Fantasy"].includes(g)));
    }

    if (activeTab === "Movies") {
      list = list.filter(m => m.type === "movie");
    } else if (activeTab === "TV Shows") {
      list = list.filter(m => m.type === "tv");
    } else if (activeTab === "My List") {
      list = list.filter(m => watchlist.includes(String(m.id)));
    }

    return list;
  };

  const filteredMoviesList = getFilteredMovies();

  // Helper groupings for categorized dashboard filmstrips
  const categories = [
    { name: "Trending Blockbusters", filter: (m: Movie) => m.score >= 8.0 },
    { name: "Action & Adventures", filter: (m: Movie) => m.category === "Action & Adventure" || m.genres.includes("Action") },
    { name: "Sci-Fi & Cyber Futures", filter: (m: Movie) => m.category === "Sci-Fi & Fantasy" || m.genres.includes("Sci-Fi") },
    { name: "Award-Winning Documentaries", filter: (m: Movie) => m.category === "Award-Winning Documentaries" || m.genres.includes("Surreal") }
  ];

  // Auto-focus default item on load / profiles entry
  useEffect(() => {
    if (activeProfile && !focusedId) {
      // Small timeout to allow render completion
      setTimeout(() => {
        const firstBtn = document.getElementById("billboard-play-btn");
        if (firstBtn) {
          firstBtn.focus();
          setFocusedId("billboard-play-btn");
        }
      }, 300);
    }
  }, [activeProfile, focusedId]);

  // Manage D-Pad trigger responses
  const handleTVNavigate = (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    const currentActive = document.activeElement as HTMLElement;
    if (!currentActive) return;

    const nextEl = navigateSpatial(direction, currentActive);
    if (nextEl) {
      nextEl.focus();
      setFocusedId(nextEl.id || null);

      // Handle custom row sliding scrolling!
      // If the targeted element resides in an index slider, auto slide it to keep focused element visible!
      const rowId = nextEl.getAttribute("data-row-id");
      if (rowId) {
        // Find slide index
        const idx = parseInt(nextEl.getAttribute("data-card-idx") || "0", 10);
        // Scroll amount: Cards are ~310px width, scroll left to fit
        const cardWidth = 310;
        const offset = idx * cardWidth;
        const rowEl = document.getElementById(`row-scroll-${rowId}`);
        if (rowEl) {
          rowEl.scrollTo({ left: offset - cardWidth, behavior: "smooth" });
          setRowScrollPositions(prev => ({ ...prev, [rowId]: offset }));
        }
      }
    }
  };

  const handleTVBack = () => {
    if (playingMovie) {
      setPlayingMovie(null);
    } else if (selectedMovie) {
      setSelectedMovie(null);
    } else if (searchOpen) {
      setSearchOpen(false);
    } else if (activeProfile) {
      setActiveProfile(null);
      setFocusedId(null);
    }
  };

  const handleTVOK = () => {
    const activeEl = document.activeElement as HTMLElement;
    if (activeEl) {
      activeEl.click();
    }
  };

  // Bind spatial navigation keycodes
  useTVNavigation(
    !!activeProfile, // Only active once a profile is selected
    activeTab,
    handleTVNavigate,
    handleTVBack,
    handleTVOK
  );

  // Play handler
  const handlePlayMovie = (url: string, title: string, epInfo?: string) => {
    setPlayingMovie({ url, title, epInfo });

    // Append current movie to history database of the active profile
    if (activeProfile) {
      // Find matches in movies list
      const matched = movies.find(m => m.streamUrl === url || m.episodes?.some(e => e.streamUrl === url));
      if (matched) {
        const historyKey = `daniflix_history_${activeProfile.id}`;
        const cached = localStorage.getItem(historyKey);
        const currentIds: string[] = cached ? JSON.parse(cached) : [];
        const filtered = currentIds.filter(id => String(id) !== String(matched.id));
        const updated = [String(matched.id), ...filtered].slice(0, 8); // keep last 8
        localStorage.setItem(historyKey, JSON.stringify(updated));

        // Sync local continue watchlist state
        const matchedMovies = updated
          .map(id => movies.find(m => String(m.id) === String(id)))
          .filter((m): m is Movie => !!m);
        setContinueWatching(matchedMovies);
      }
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = (id: string) => {
    if (!activeProfile) return;
    const key = `daniflix_watchlist_${activeProfile.id}`;
    let updated: string[] = [];
    if (watchlist.includes(id)) {
      updated = watchlist.filter(w => w !== id);
    } else {
      updated = [...watchlist, id];
    }
    setWatchlist(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const currentBillboardMovie = movies[0];

  if (!activeProfile) {
    return <ProfileSelection onSelectProfile={(profile) => setActiveProfile(profile)} />;
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans select-none overflow-x-hidden relative font-sans">
      
      {/* 1. TV Sidebar Navigation Component */}
      <Sidebar
        activeProfile={activeProfile}
        onChangeProfile={() => {
          setActiveProfile(null);
          setFocusedId(null);
        }}
        onOpenSearch={() => setSearchOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
      />

      {/* Interactive Floating Remote Simulator for TV navigation */}
      <VirtualTVRemote />

      {/* 2. MAIN BROWSE LAYOUT VIEWER - with pl-16 margin to accommodate the sidebar */}
      <main className="flex-1 pb-24 relative z-10 pt-16 pl-16 font-sans">
        
        {/* Billboard featured spotlight - displays trending sintel movie */}
        {activeTab === "Home" && currentBillboardMovie && (
          <div className="relative h-[55vh] w-full select-none overflow-hidden bg-zinc-950 mb-10 pt-2 lg:pt-0">
            <img
              src={currentBillboardMovie.backdrop}
              alt={currentBillboardMovie.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85 transition-transform duration-1000 scale-[1.01]"
            />
            {/* Dark gradient blur constraints */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-black/40"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>

            {/* Content metadata card */}
            <div className="absolute bottom-10 left-6 md:left-12 max-w-xl flex flex-col items-start gap-3">
              <span className="bg-[#E50914] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow tracking-wide uppercase">Spotlight</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">{currentBillboardMovie.title}</h1>
              <p className="text-gray-300 text-xs md:text-sm drop-shadow line-clamp-3 font-normal max-w-lg mt-1 h-12 leading-relaxed">
                {currentBillboardMovie.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 mt-2">
                <span className="text-emerald-500 font-bold flex items-center gap-1"><Star size={14} fill="currentColor" /> {currentBillboardMovie.score}</span>
                <span>{currentBillboardMovie.year}</span>
                <span className="border border-zinc-700 font-sans px-1 text-[9px] font-bold rounded uppercase">{currentBillboardMovie.rating}</span>
                <span>{currentBillboardMovie.duration}</span>
              </div>

              {/* Action buttons slider */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  id="billboard-play-btn"
                  tabIndex={0}
                  onClick={() => handlePlayMovie(currentBillboardMovie.streamUrl, currentBillboardMovie.title)}
                  className="focusable flex items-center gap-2 bg-[#E50914] hover:bg-[#F40612] focus:bg-[#F40612] text-white font-semibold px-5 py-2 rounded text-xs transition duration-200 outline-none hover:scale-105"
                >
                  <Play size={14} fill="white" /> Play Movie
                </button>
                <button
                  id="billboard-info-btn"
                  tabIndex={0}
                  onClick={() => setSelectedMovie(currentBillboardMovie)}
                  className="focusable flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-700/90 focus:bg-zinc-700/90 text-white font-semibold px-5 py-2 rounded text-xs transition duration-200 outline-none hover:scale-105"
                >
                  <Info size={14} /> More Info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Tab Title Header */}
        {activeTab !== "Home" && (
          <div className="px-6 md:px-12 py-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              {activeTab === "My List" ? <Plus size={24} className="text-[#E50914]" /> : activeTab === "Movies" ? <Film size={24} className="text-[#E50914]" /> : <Tv2 size={24} className="text-[#E50914]" />}
              {activeTab} Browser
              {activeProfile.isKids && (
                <span className="text-xs bg-[#E50914]/20 border border-[#E50914]/50 font-sans text-[#E50914] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Kids Filter Active</span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1.5 uppercase tracking-wide">Showing verified responsive streams supporting adaptive TV bitrates.</p>
          </div>
        )}

        {/* 3. CONTINUE WATCHING STRIP MODULES */}
        {activeTab === "Home" && continueWatching.length > 0 && (
          <div className="px-6 md:px-12 mb-8">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest font-sans mb-3 flex items-center gap-2">
              <MonitorPlay size={16} className="text-[#E50914]" />
              Continue Watching for {activeProfile.name}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800">
              {continueWatching.map((movie, idx) => (
                <div
                  key={`continue-${movie.id}`}
                  id={`continue-card-${idx}`}
                  tabIndex={0}
                  data-row-id="continue"
                  data-card-idx={idx}
                  onClick={() => handlePlayMovie(movie.streamUrl, movie.title)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePlayMovie(movie.streamUrl, movie.title); }}
                  className="focusable bg-zinc-900 border border-zinc-850 hover:border-zinc-500 rounded-lg overflow-hidden shrink-0 w-64 outline-none cursor-pointer group transition-all duration-300"
                >
                  <div className="relative h-28 bg-zinc-950">
                    <img
                      src={movie.backdrop}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      <Play size={24} fill="white" className="text-white" />
                    </div>
                    {/* Fake play progress line bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 w-[45%]" />
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-red-500 truncate">{movie.title}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">Press OK to Resume Stream</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. MAIN CATEGORY FILMSTRIPS (GRID LAYOUT FOR DISCOVERIES) */}
        {activeTab === "Home" ? (
          <div className="flex flex-col gap-10">
            {categories.map((category, catIdx) => {
              const matchedList = filteredMoviesList.filter(category.filter);
              if (matchedList.length === 0) return null;

              return (
                <div key={category.name} className="px-6 md:px-12">
                  <h3 className="text-base font-bold text-gray-200 tracking-wider font-sans mb-3">{category.name}</h3>
                  
                  {/* Sliding film strip viewports */}
                  <div 
                    id={`row-scroll-${catIdx}`}
                    className="flex gap-4 overflow-x-hidden overflow-y-hidden pb-4 scroll-smooth"
                  >
                    {matchedList.map((movie, movieIdx) => (
                      <div
                        key={movie.id}
                        id={`card-${catIdx}-${movieIdx}`}
                        tabIndex={0}
                        data-row-id={String(catIdx)}
                        data-card-idx={movieIdx}
                        onClick={() => setSelectedMovie(movie)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setSelectedMovie(movie);
                          }
                        }}
                        className="focusable shrink-0 w-[240px] bg-zinc-900/40 rounded-lg overflow-hidden border border-transparent outline-none cursor-pointer transition-all duration-300 group shadow-md"
                      >
                        <div className="relative aspect-video bg-zinc-950">
                          <img
                            src={movie.backdrop}
                            alt={movie.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all duration-300"
                          />
                          <div className="absolute top-2 left-2 bg-[#E50914] text-[8px] font-extrabold uppercase px-1 rounded shadow">
                            {movie.rating}
                          </div>
                        </div>
                        <div className="p-2.5 flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-gray-200 group-hover:text-red-500 group-focus:text-[#E50914] truncate transition-colors">
                            {movie.title}
                          </h4>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                            <span>{movie.year} · {movie.duration}</span>
                            <span className="text-emerald-500">★ {movie.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Grid View for secondary Browse pages (Movies, Shows, Lists)
          <div className="px-6 md:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMoviesList.map((movie, idx) => (
              <div
                key={movie.id}
                id={`browse-grid-item-${idx}`}
                tabIndex={0}
                onClick={() => setSelectedMovie(movie)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setSelectedMovie(movie);
                  }
                }}
                className="focusable group bg-zinc-900/60 rounded-lg overflow-hidden border border-zinc-850 hover:border-zinc-500 transition-all duration-300 outline-none cursor-pointer flex flex-col"
              >
                <div className="relative h-32 md:h-36 bg-zinc-950 overflow-hidden shrink-0">
                  <img
                    src={movie.backdrop}
                    alt={movie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all duration-300"
                  />
                  <span className="absolute bottom-2 right-2 bg-black/85 text-emerald-400 text-[10px] font-bold font-mono px-1 rounded">★ {movie.score}</span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-[#E50914] group-focus:text-[#E50914] truncate leading-tight transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                    <span>{movie.year}</span>
                    <span>·</span>
                    <span className="uppercase text-[9px] border border-zinc-800 px-1 rounded">{movie.type}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredMoviesList.length === 0 && (
              <div className="col-span-full py-16 text-center max-w-sm mx-auto">
                <span className="text-3xl text-zinc-600 block mb-3">📂</span>
                <span className="font-semibold text-zinc-300">Your List is Empty</span>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Add movie or series spotlight titles to My List using the customizable detail modal boards.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. SEARCH OVERLAY POPUP */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          movies={movies}
          tmdbEnabled={apiConfig.tmdbEnabled}
          onSelectMovie={(movie) => {
            setSearchOpen(false);
            setSelectedMovie(movie);
          }}
        />
      )}

      {/* 6. CONTENT DETAIL MODAL POPUP */}
      {selectedMovie && (
        <DetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlayMovie}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          allMovies={movies}
          onNavigateToRecommendations={(recom) => setSelectedMovie(recom)}
        />
      )}

      {/* 7. FULLSCREEN STREAM PLAYER COSOLE */}
      {playingMovie && (
        <HLSPlayer
          streamUrl={playingMovie.url}
          title={playingMovie.title}
          episodeInfo={playingMovie.epInfo}
          onClose={() => setPlayingMovie(null)}
        />
      )}

      {/* Absolute app global configuration status */}
      <footer className="h-10 bg-zinc-950 flex items-center justify-between px-6 md:px-12 text-[10px] text-zinc-500 font-mono relative mt-auto border-t border-zinc-900">
        <div>
          DANIFLIX Core: v{apiConfig.appVersion} | Active Profile: {activeProfile.name} {activeProfile.isKids && "(Kids Zone)"}
        </div>
        <div>
          {apiConfig.tmdbEnabled ? "📡 TMDB API connected" : "📀 Fallen Back to playable local streams"}
        </div>
      </footer>
    </div>
  );
}
export { App as rootAppElement };

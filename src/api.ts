import { Movie, Episode } from "./types";

export interface ConfigStatus {
  status: string;
  tmdbEnabled: boolean;
  appVersion: string;
  hasBackend: boolean;
}

// Map of TMDB Genre IDs to human-readable strings
const GENRES_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics"
};

// High-quality public master HLS playlist streams with correct subtitle paths
const PLAYABLE_STREAMS = [
  {
    streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    subtitleUrl: "/api/subtitles/sintel"
  },
  {
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    subtitleUrl: "/api/subtitles/bbb"
  },
  {
    streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    subtitleUrl: "/api/subtitles/tears-of-steel"
  },
  {
    streamUrl: "https://content.jwplatform.com/manifests/yp34SRao.m3u8",
    subtitleUrl: "/api/subtitles/cosmos-laundromat"
  },
  {
    streamUrl: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
    subtitleUrl: "/api/subtitles/elephants-dream"
  }
];

export function mapTMDBToMovie(item: any, type: "movie" | "tv", index: number): Movie {
  const genres: string[] = [];
  if (item.genre_ids) {
    item.genre_ids.forEach((gid: number) => {
      const mapped = GENRES_MAP[gid];
      if (mapped && !genres.includes(mapped)) {
        genres.push(mapped);
      }
    });
  }

  // Choose Daniflix Category based on genres
  let category = "Action & Adventure";
  if (genres.some(g => ["Documentary", "History"].includes(g))) {
    category = "Award-Winning Documentaries";
  } else if (genres.some(g => ["Sci-Fi", "Fantasy", "Sci-Fi & Fantasy"].includes(g))) {
    category = "Sci-Fi & Fantasy";
  } else if (genres.some(g => ["Animation", "Family", "Kids"].includes(g))) {
    category = "Comedy";
  } else if (genres.some(g => ["Comedy"].includes(g))) {
    category = "Comedy";
  } else if (genres.some(g => ["Action", "Adventure", "Action & Adventure", "Thriller"].includes(g))) {
    category = "Action & Adventure";
  }

  const streamInfo = PLAYABLE_STREAMS[Math.abs(Number(item.id) || index) % PLAYABLE_STREAMS.length];

  // TMDB poster & backdrop absolute paths
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
    : "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop";

  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=342&auto=format&fit=crop";

  const year = parseInt(item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "2024", 10);

  // For TV Shows, generate realistic episodes
  const episodes: Episode[] = type === "tv" ? [
    {
      id: `${item.id}-s1e1`,
      season: 1,
      episode: 1,
      title: "Pilot: The Awakening",
      duration: "14 min",
      synopsis: `Welcome to the series premiere. Mysterious occurrences spark tension as the core conflict begins to unravel.`,
      streamUrl: streamInfo.streamUrl
    },
    {
      id: `${item.id}-s1e2`,
      season: 1,
      episode: 2,
      title: "Chapter 2: The Signal",
      duration: "10 min",
      synopsis: `An expert tries to decrypt secondary communications, while the local group decides to explore the deep wilderness.`,
      streamUrl: PLAYABLE_STREAMS[(Math.abs(Number(item.id) || index) + 1) % PLAYABLE_STREAMS.length].streamUrl
    },
    {
      id: `${item.id}-s1e3`,
      season: 1,
      episode: 3,
      title: "Chapter 3: Cyber Sandbox",
      duration: "12 min",
      synopsis: `Allies and rival teams collide in a dramatic sequence of tactical events that alters their reality.`,
      streamUrl: PLAYABLE_STREAMS[(Math.abs(Number(item.id) || index) + 2) % PLAYABLE_STREAMS.length].streamUrl
    }
  ] : [];

  return {
    id: String(item.id),
    type,
    title: item.title || item.name || "Untitled Masterpiece",
    year,
    rating: type === "tv" ? "TV-14" : (item.adult ? "R" : "PG-13"),
    score: Number((item.vote_average || 7.5).toFixed(1)),
    duration: type === "tv" ? "1 Season" : "1h 56m",
    category,
    tagline: item.tagline || `${item.title || item.name} - Live from TMDB.`,
    description: item.overview || "No current overview available. This production features top-rated cinematic scores and is fully playable.",
    streamUrl: streamInfo.streamUrl,
    backdrop,
    poster,
    cast: ["Brad Pitt", "Zendaya", "Pedro Pascal", "Florence Pugh"], // TMDB top-trending default cast backup
    episodes: type === "tv" ? episodes : [],
    genres: genres.length > 0 ? genres : ["Drama", "Action"]
  };
}

/**
 * Fetch the standard catalogue list from our server backend API.
 */
export async function fetchCatalog(): Promise<Movie[]> {
  try {
    const response = await fetch("/api/movies");
    if (!response.ok) {
      throw new Error("Failed to fetch catalog from backend");
    }
    return await response.json();
  } catch (err) {
    console.warn("Express backend movie catalog error", err);
    return [];
  }
}

/**
 * Query actual dynamic TMDB API feeds via our server-side API key proxy route.
 */
export async function fetchTMDBFeed(subpath: string, params: Record<string, string> = {}): Promise<any> {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `/api/tmdb/${subpath}${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB Proxy responded with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Error querying TMDB path: ${subpath}`, err);
    throw err;
  }
}

/**
 * Fetch dynamic list of trending movies and TV shows from the TMDB API and map them.
 */
export async function fetchLiveTrendingTMDB(): Promise<Movie[]> {
  try {
    // 1. Fetch trending movies
    const moviesData = await fetchTMDBFeed("trending/movie/week");
    // 2. Fetch trending TV Shows
    const tvData = await fetchTMDBFeed("trending/tv/week");

    const mappedMovies = (moviesData.results || []).slice(0, 10).map((m: any, idx: number) => 
      mapTMDBToMovie(m, "movie", idx)
    );

    const mappedTV = (tvData.results || []).slice(0, 10).map((t: any, idx: number) => 
      mapTMDBToMovie(t, "tv", idx + 10)
    );

    return [...mappedMovies, ...mappedTV];
  } catch (err) {
    console.warn("Error fetching dynamic trending feed. Playing high-quality baseline catalog.", err);
    return [];
  }
}

/**
 * Fetch configuration status from backend.
 */
export async function fetchConfig(): Promise<ConfigStatus> {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Config fetch error", e);
  }
  return { status: "offline", tmdbEnabled: false, appVersion: "1.0.0", hasBackend: false };
}

/**
 * Search movies and TV shows from the live TMDB API and map them.
 */
export async function searchTMDB(query: string): Promise<Movie[]> {
  try {
    const rawData = await fetchTMDBFeed("search/multi", { query });
    const results = rawData.results || [];
    return results
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any, idx: number) => mapTMDBToMovie(item, item.media_type as "movie" | "tv", idx));
  } catch (err) {
    console.error("Live TMDB Search fail", err);
    return [];
  }
}

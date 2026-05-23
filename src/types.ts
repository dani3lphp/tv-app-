export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  duration: string;
  synopsis: string;
  streamUrl: string;
}

export interface Movie {
  id: string | number;
  type: "movie" | "tv";
  title: string;
  year: number;
  rating: string;
  score: number;
  duration: string;
  category: string;
  tagline: string;
  description: string;
  streamUrl: string;
  backdrop: string;
  poster: string;
  cast: string[];
  episodes?: Episode[];
  genres: string[];
}

export interface PlayerSettings {
  fontSize: "small" | "medium" | "large" | "xlarge";
  fontColor: string;
  textBackground: "none" | "semi" | "solid";
  speed: number;
  audioTrack: string;
  subtitleOffset: number; // in seconds
}

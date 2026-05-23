import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Standard HLS playable catalog for fallback or out-of-the-box demo
const FALLBACK_CATALOG = [
  {
    id: "948549",
    type: "movie",
    title: "Dune: Part Two",
    year: 2024,
    rating: "PG-13",
    score: 8.8,
    duration: "2h 46m",
    category: "Sci-Fi & Fantasy",
    tagline: "Long live the fighters.",
    description: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
    streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    backdrop: "https://image.tmdb.org/t/p/original/xOM4Z66X06v6g6H0K9677OfGgDz.jpg",
    poster: "https://image.tmdb.org/t/p/w500/czEM3gFlHKRIBS06Bh8g50vubNr.jpg",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler", "Florence Pugh"],
    episodes: [],
    genres: ["Sci-Fi", "Adventure", "Action", "Fantasy"]
  },
  {
    id: "872585",
    type: "movie",
    title: "Oppenheimer",
    year: 2023,
    rating: "R",
    score: 8.7,
    duration: "3h 0m",
    category: "Award-Winning Documentaries",
    tagline: "The world forever changes.",
    description: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, tracking his brilliant scientific breakthrough, the apocalyptic test at Trinity site, and the complex political fallout that followed.",
    streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop",
    poster: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=342&auto=format&fit=crop",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
    episodes: [],
    genres: ["Drama", "History", "Biography"]
  },
  {
    id: "157336",
    type: "movie",
    title: "Interstellar",
    year: 2014,
    rating: "PG-13",
    score: 8.6,
    duration: "2h 49m",
    category: "Sci-Fi & Fantasy",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage to save humanity from global extinction.",
    streamUrl: "https://content.jwplatform.com/manifests/yp34SRao.m3u8",
    backdrop: "https://image.tmdb.org/t/p/original/rAiYrfldAR60vS8Npf6fS6065Uj.jpg",
    poster: "https://image.tmdb.org/t/p/w500/gEU2Qv6G6u0VGEgbyfbv66I964u.jpg",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    episodes: [],
    genres: ["Sci-Fi", "Drama", "Adventure"]
  },
  {
    id: "569094",
    type: "movie",
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    rating: "PG",
    score: 8.4,
    duration: "2h 20m",
    category: "Comedy",
    tagline: "It's how you wear the mask.",
    description: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. However, when the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    backdrop: "https://images.unsplash.com/photo-1608889174637-3c44f6326f2a?q=80&w=1200&auto=format&fit=crop",
    poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=342&auto=format&fit=crop",
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Jake Johnson"],
    episodes: [],
    genres: ["Animation", "Action", "Adventure", "Sci-Fi"]
  },
  {
    id: "66732",
    type: "tv",
    title: "Stranger Things",
    year: 2016,
    rating: "TV-14",
    score: 9.2,
    duration: "4 Seasons",
    category: "Sci-Fi & Fantasy",
    tagline: "One summer can change everything.",
    description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl with telekinetic powers in Hawkins, Indiana.",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop",
    poster: "https://image.tmdb.org/t/p/w500/49W0feN0mhmm6ntv67vun83Y665.jpg",
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder", "David Harbour", "Gaten Matarazzo"],
    genres: ["Sci-Fi", "Mystery", "Drama"],
    episodes: [
      {
        id: "st-s1e1",
        season: 1,
        episode: 1,
        title: "Chapter One: The Vanishing of Will Byers",
        duration: "14 min",
        synopsis: "On his way home from a friend's house, Will Byers encounters something terrifying. Nearby, a government lab hides an otherworldly gateway.",
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
      },
      {
        id: "st-s1e2",
        season: 1,
        episode: 2,
        title: "Chapter Two: The Weirdo on Maple Street",
        duration: "10 min",
        synopsis: "Lucas, Mike, and Dustin encounter a mysterious girl in the woods with short hair, who exhibits incredibly powerful abilities.",
        streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
      },
      {
        id: "st-s1e3",
        season: 1,
        episode: 3,
        title: "Chapter Three: Holly, Jolly",
        duration: "12 min",
        synopsis: "An increasingly frantic Joyce attempts to communicate with her missing son using Christmas lights, while Nancy searches for Barb.",
        streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
      }
    ]
  },
  {
    id: "119051",
    type: "tv",
    title: "Wednesday",
    year: 2022,
    rating: "TV-14",
    score: 8.9,
    duration: "1 Season",
    category: "Comedy",
    tagline: "Snares, mayhem, and mystery.",
    description: "Wednesday Addams is sent to Nevermore Academy, a bizarre boarding school for outcasts, where she attempts to master her emerging psychic ability, thwart a monstrous killing spree, and solve the supernatural mystery that embroiled her parents 25 years ago.",
    streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    backdrop: "https://image.tmdb.org/t/p/original/iH739Z937ee3gZsbvUrXvCuasBs.jpg",
    poster: "https://image.tmdb.org/t/p/w500/9PFg326V7Z6ZMIZl89pSg66SdfR.jpg",
    cast: ["Jenna Ortega", "Emma Myers", "Hunter Doohan", "Percy Hynes White"],
    genres: ["Mystery", "Comedy", "Sci-Fi & Fantasy"],
    episodes: [
      {
        id: "wed-s1e1",
        season: 1,
        episode: 1,
        title: "Wednesday's Child is Full of Woe",
        duration: "14 min",
        synopsis: "When a deliciously wicked prank gets Wednesday expelled from high school, her parents enroll her at the gothic Nevermore Academy.",
        streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
      },
      {
        id: "wed-s1e2",
        season: 1,
        episode: 2,
        title: "Woe is the Loneliest Number",
        duration: "11 min",
        synopsis: "Wednesday investigates a mysterious attack in the woods, clashes with the new sheriff, and participates in Nevermore's Poe Cup race.",
        streamUrl: "https://content.jwplatform.com/manifests/yp34SRao.m3u8"
      }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API configuration route
  app.get("/api/config", (req, res) => {
    res.json({
      status: "ok",
      tmdbEnabled: !!process.env.VITE_TMDB_API_KEY,
      appVersion: process.env.VITE_APP_VERSION || "1.0.0",
      hasBackend: true
    });
  });

  // Get fallback catalog
  app.get("/api/movies", (req, res) => {
    res.json(FALLBACK_CATALOG);
  });

  // TMDB API Proxy route
  app.get("/api/tmdb/*", async (req, res) => {
    const tmdbApiKey = process.env.VITE_TMDB_API_KEY;
    if (!tmdbApiKey) {
      return res.status(401).json({
        error: "TMDB API Key is missing on the server. Using local playable catalog instead."
      });
    }

    const subpath = req.params[0];
    const queryParams = new URLSearchParams(req.query as Record<string, string>);
    queryParams.set("api_key", tmdbApiKey);

    try {
      const url = `https://api.themoviedb.org/3/${subpath}?${queryParams.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error("TMDB Proxy Error:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch from TMDB." });
    }
  });

  // Custom subtitle mock responder
  app.get("/api/subtitles/:id", (req, res) => {
    const { id } = req.params;
    const lang = req.query.lang || "en";
    
    // Serve custom WebVTT file contents directly
    res.setHeader("Content-Type", "text/vtt");
    res.send(`WEBVTT

00:00:01.000 --> 00:00:04.500
[DANIFLIX Intro Sound] Dynamic HLS Stream Initialized.

00:00:05.000 --> 00:00:08.500
Entering Scene. Subtitles loaded from custom API server.

00:00:09.000 --> 00:00:13.000
Enjoy watching this cinematic masterpiece. Fully D-pad controllable.

00:00:14.000 --> 00:00:18.000
Press [Enter/OK] on your remote control to show/hide OSD controls.

00:00:19.000 --> 00:00:23.000
Use [Arrow Left] or [Arrow Right] to rewind or skip 10 seconds.

00:00:24.000 --> 00:00:30.000
DANIFLIX supports custom font sizes, background boxes, and real-time HLS bitrates.
`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DANIFLIX Express Server running on http://localhost:${PORT}`);
  });
}

startServer();

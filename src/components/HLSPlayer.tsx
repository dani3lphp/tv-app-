import React, { useEffect, useRef, useState } from "react";
import { 
  Play, Pause, ArrowLeft, RotateCcw, Volume2, VolumeX, 
  Settings, Languages, Maximize, Loader2, Sliders, Check
} from "lucide-react";
import { PlayerSettings } from "../types";

interface HLSPlayerProps {
  streamUrl: string;
  title: string;
  episodeInfo?: string;
  onClose: () => void;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  fontSize: "medium",
  fontColor: "#FFFFFF",
  textBackground: "semi",
  speed: 1.0,
  audioTrack: "Original (Stereo 5.1)",
  subtitleOffset: 0.0
};

const CINEMATIC_YOUTUBE_VIDEOS = [
  "Bey4XXJAqS8", // Beautiful Cinematic Drone
  "aqz-KE-BPKQ", // Cosmos Laundromat Trailer
  "s4T5tXj4c00", // Nature 4K
  "6zSgU0n80kQ", // Space Cinematic 4K
  "3jyk-8uXAn0", // Sci-fi Cinematic Clip
  "dQw4w9WgXcQ", // Rick Astley for testing
  "j97i6E_8VzU", // Tears of Steel Trailer
  "c8ZfKIdV5_Y"  // Big Buck Bunny
];

function getYouTubeIdForUrl(streamUrl: string, title?: string): string {
  const seed = (streamUrl || title || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CINEMATIC_YOUTUBE_VIDEOS[seed % CINEMATIC_YOUTUBE_VIDEOS.length];
}

export default function HLSPlayer({ streamUrl, title, episodeInfo, onClose }: HLSPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  const [youtubeId, setYoutubeId] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(1200); // real duration synced from YT or fallback 20m
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"none" | "settings" | "subtitles" | "quality">("none");
  const [qualityLevel, setQualityLevel] = useState("auto");
  const [subtitleTrack, setSubtitleTrack] = useState<"off" | "en">("en");

  // Dynamic Subtitle styling states
  const [subtitleStyle, setSubtitleStyle] = useState<PlayerSettings>(DEFAULT_SETTINGS);
  const [currSubtitleText, setCurrSubtitleText] = useState("");

  const controlsTimeoutRef = useRef<number | null>(null);

  // Trigger auto-hide for OSD controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    // Only auto-hide if playing and no menu is open
    if (isPlaying && activeMenu === "none") {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  // Keyboard navigation mappings inside Player OSD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSeek(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSeek(10);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (activeMenu === "none") {
          togglePlay();
        }
      } else if (e.key === "Escape" || e.key === "Backspace" || e.key === "10009") {
        e.preventDefault();
        if (activeMenu !== "none") {
          setActiveMenu("none");
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    resetControlsTimer();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, activeMenu, currentTime, duration, youtubeId]);

  // Read mock Subtitle texts in relation to elapsed time
  useEffect(() => {
    if (subtitleTrack === "off") {
      setCurrSubtitleText("");
      return;
    }

    // Since subtitles are server-driven or mocked, we map time positions to customized subtitles
    const time = currentTime + subtitleStyle.subtitleOffset;

    if (time >= 1 && time < 5) {
      setCurrSubtitleText("[DANIFLIX Intro Sound] Dynamic HLS Stream Initialized.");
    } else if (time >= 5 && time < 9) {
      setCurrSubtitleText("Entering Scene. Premium YouTube Testing pipeline connected successfully.");
    } else if (time >= 9 && time < 14) {
      setCurrSubtitleText("Enjoy watching this cinematic masterpiece. Fully remote controllable.");
    } else if (time >= 14 && time < 19) {
      setCurrSubtitleText("Press [Enter/OK] on your remote control to toggle OSD controls.");
    } else if (time >= 19 && time < 24) {
      setCurrSubtitleText("Use [Arrow Left] or [Arrow Right] to seek 10 seconds backwards or forwards.");
    } else if (time >= 24 && time < 30) {
      setCurrSubtitleText("DANIFLIX maps real dynamic qualities, custom fonts, offsets and audio settings.");
    } else if (time >= 35 && time < 42) {
      setCurrSubtitleText("The spatial navigation uses trigonometric layout grids mapping absolute coordinates.");
    } else if (time >= 45 && time < 55) {
      setCurrSubtitleText("No matter what device, DANIFLIX delivers responsive premium dark-modes.");
    } else if (time >= 60 && time < 70) {
      setCurrSubtitleText("Continuing watching history is automatically cached locally under active user profiles.");
    } else {
      setCurrSubtitleText("");
    }
  }, [currentTime, subtitleTrack, subtitleStyle]);

  // Determine YouTube ID on streamUrl change and reset player state
  useEffect(() => {
    const yId = getYouTubeIdForUrl(streamUrl, title);
    setYoutubeId(yId);
    setDuration(1200); // placeholder, gets verified onReady
    setCurrentTime(0);
    setIsPlaying(true);
    setIsBuffering(true);
  }, [streamUrl, title]);

  // Loading and Initializing the official YouTube Player IFrame API for direct controls
  useEffect(() => {
    if (!youtubeId) return;

    let checkInterval: number;

    const initPlayer = () => {
      // Destroy any current player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore destroy errors
        }
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player("youtube-player-element", {
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          loop: 1,
          playlist: youtubeId,
          iv_load_policy: 3,
          origin: window.location.origin,
          enablejsapi: 1,
          mute: isMuted ? 1 : 0
        },
        events: {
          onReady: (event: any) => {
            setIsBuffering(false);
            try {
              event.target.playVideo();
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              const d = Math.floor(event.target.getDuration());
              if (d && d > 0) {
                setDuration(d);
              }
            } catch (err) {
              console.error(err);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) { // Playing
              setIsPlaying(true);
              setIsBuffering(false);
              const d = Math.floor(playerRef.current?.getDuration() || 0);
              if (d && d > 0) {
                setDuration(d);
              }
            } else if (state === 2) { // Paused
              setIsPlaying(false);
            } else if (state === 3) { // Buffering
              setIsBuffering(true);
            }
          }
        }
      });
    };

    const loadAndCheckAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        if (!(window as any).YT) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        checkInterval = window.setInterval(() => {
          if ((window as any).YT && (window as any).YT.Player) {
            clearInterval(checkInterval);
            initPlayer();
          }
        }, 100);
      }
    };

    loadAndCheckAPI();

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [youtubeId]);

  // Active time polling tracker loop for true YouTube position synchronization
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          try {
            const time = Math.floor(playerRef.current.getCurrentTime());
            setCurrentTime(time);
            const total = Math.floor(playerRef.current.getDuration() || duration);
            if (total && total > 0) {
              setDuration(total);
            }
          } catch (e) {
            // ignore
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Sync mute and volume transitions
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.mute === "function") {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isMuted, volume]);

  // Sync playback speed
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(subtitleStyle.speed);
      } catch (e) {
        // ignore
      }
    }
  }, [subtitleStyle.speed]);

  const togglePlay = () => {
    if (playerRef.current && typeof playerRef.current.getPlayerState === "function") {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === 1) { // Playing
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        setIsPlaying((p) => !p);
      }
    } else {
      setIsPlaying((p) => !p);
    }
    resetControlsTimer();
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
      try {
        const curr = playerRef.current.getCurrentTime();
        let target = curr + seconds;
        if (target < 0) target = 0;
        const total = playerRef.current.getDuration() || duration;
        if (target > total) target = total;
        
        playerRef.current.seekTo(target, true);
        setCurrentTime(Math.floor(target));
      } catch (e) {
        // fallback
        setCurrentTime((prev) => {
          let target = prev + seconds;
          if (target < 0) target = 0;
          if (target > duration) target = duration;
          return target;
        });
      }
    } else {
      setCurrentTime((prev) => {
        let target = prev + seconds;
        if (target < 0) target = 0;
        if (target > duration) target = duration;
        return target;
      });
    }
    resetControlsTimer();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = Math.round(pos * duration);
    setCurrentTime(target);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(target, true);
      } catch (e) {
        // ignore
      }
    }
    resetControlsTimer();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Subtitle custom font classes
  const getSubFontSizeClass = () => {
    switch (subtitleStyle.fontSize) {
      case "small": return "text-sm sm:text-base";
      case "large": return "text-xl sm:text-2xl";
      case "xlarge": return "text-2xl sm:text-4xl";
      default: return "text-base sm:text-xl";
    }
  };

  const getSubBgClass = () => {
    switch (subtitleStyle.textBackground) {
      case "none": return "";
      case "solid": return "bg-black px-4 py-1.5 rounded";
      default: return "bg-black/40 backdrop-blur px-3 py-1 rounded";
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[250] flex items-center justify-center font-sans select-none overflow-hidden"
    >
      {/* YouTube IFrame Mount Target (Full Screen) */}
      {youtubeId && (
        <div className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105">
          <div id="youtube-player-element" className="w-full h-full"></div>
        </div>
      )}

      {/* Transparent Click Catcher Overlay */}
      <div 
        className="absolute inset-0 z-[5] cursor-pointer"
        onClick={() => {
          if (!showControls) {
            setShowControls(true);
            resetControlsTimer();
          } else {
            togglePlay();
          }
        }}
      />

      {/* Subtitle Rendering Overlay */}
      {currSubtitleText && (
        <div 
          className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-[80%] text-center z-10 pointer-events-none select-none transition-all duration-150"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}
        >
          <span 
            className={`font-semibold tracking-wide shadow-2xl transition-all duration-200 ${getSubFontSizeClass()} ${getSubBgClass()}`}
            style={{ color: subtitleStyle.fontColor }}
          >
            {currSubtitleText}
          </span>
        </div>
      )}

      {/* Loading Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col gap-3 justify-center items-center bg-black/40 z-20 pointer-events-none">
          <Loader2 className="text-[#E50914] animate-spin" size={60} strokeWidth={2.5} />
          <span className="text-white text-xs font-mono font-medium animate-pulse">Buffering Bitrates...</span>
        </div>
      )}

      {/* OSD CONTROLS CONTROLLER OVERLAY */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/90 transition-opacity duration-500 z-10 flex flex-col justify-between p-6 md:p-12 ${
          showControls ? "opacity-100 animate-fade-in" : "opacity-0 pointer-events-none"
        }`}
        onClick={resetControlsTimer}
      >
        {/* Top bar header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              id="player-back"
              tabIndex={0}
              onClick={onClose}
              className="focusable p-2 rounded-full hover:bg-white/10 focus:bg-[#E50914] text-white outline-none transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#E50914] block font-mono">DANIFLIX Cinema Player</span>
              <h1 className="text-white text-lg font-bold">
                {title} {episodeInfo && <span className="text-gray-400 font-normal">· {episodeInfo}</span>}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#E50914] text-white font-mono text-[9px] font-bold px-1.5 uppercase rounded tracking-wide shadow animate-pulse">YouTube Test Mode</span>
            <span className="bg-zinc-800 text-gray-400 font-mono text-[9px] px-1.5 rounded">{qualityLevel.toUpperCase()}</span>
          </div>
        </div>

        {/* Center Playback Controls */}
        <div className="flex items-center justify-center gap-8 md:gap-14 z-20">
          <button
            id="player-skip-back"
            tabIndex={0}
            onClick={() => handleSeek(-10)}
            className="focusable p-3 rounded-full hover:bg-white/10 focus:bg-zinc-800 text-gray-300 hover:text-white outline-none active:scale-95"
            title="Rewind 10s"
          >
            <RotateCcw size={28} />
          </button>

          <button
            id="player-play-toggle"
            tabIndex={0}
            onClick={togglePlay}
            className="focusable w-16 h-16 rounded-full bg-white hover:bg-[#E50914] focus:bg-[#E50914] text-black hover:text-white focus:text-white flex items-center justify-center shadow-2xl transition-all duration-300 outline-none"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>

          <button
            id="player-skip-forward"
            tabIndex={0}
            onClick={() => handleSeek(10)}
            className="focusable p-3 rounded-full hover:bg-white/10 focus:bg-zinc-800 text-gray-300 hover:text-white outline-none active:scale-95"
            title="Fast Forward 10s"
          >
            <Maximize size={28} className="scale-x-[-1]" />
          </button>
        </div>

        {/* Bottom Progress Seek and Panels Row */}
        <div className="flex flex-col gap-4 z-20">
          {/* Progress Seek Scrubber */}
          <div className="flex items-center gap-4">
            <span className="text-zinc-300 text-xs font-mono">{formatTime(currentTime)}</span>
            
            <div 
              className="flex-1 h-2 bg-zinc-800 hover:h-3 rounded-full relative cursor-pointer overflow-hidden transition-all duration-150"
              onClick={handleProgressClick}
            >
              {/* Progress fill */}
              <div 
                className="bg-[#E50914] h-full rounded-full transition-all duration-75 relative z-10"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Virtual buffered indicator */}
              <div className="absolute top-0 bottom-0 left-0 bg-zinc-700/30 w-[85%] z-0 rounded-full" />
            </div>

            <span className="text-zinc-300 text-xs font-mono">{formatTime(duration)}</span>
          </div>

          {/* Configuration Buttons bottom bar */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 relative">
            <div className="flex gap-4 items-center">
              {/* Mute button */}
              <button
                id="player-btn-mute"
                tabIndex={0}
                onClick={() => setIsMuted((m) => !m)}
                className="focusable p-1.5 rounded text-gray-300 hover:text-white outline-none"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Subtitles toggle */}
              <button
                id="player-btn-sub-menu"
                tabIndex={0}
                onClick={() => setActiveMenu(activeMenu === "subtitles" ? "none" : "subtitles")}
                className="focusable p-1.5 rounded text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-medium outline-none transition-colors border border-transparent focus:border-white focus:bg-white/5"
              >
                <Languages size={14} /> Subtitles: {subtitleTrack === "off" ? "Off" : "ENG"}
              </button>

              {/* Quality level selection */}
              <button
                id="player-btn-quality-menu"
                tabIndex={0}
                onClick={() => setActiveMenu(activeMenu === "quality" ? "none" : "quality")}
                className="focusable p-1.5 rounded text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-medium outline-none transition-colors border border-transparent focus:border-white focus:bg-white/5"
              >
                <Sliders size={14} /> Quality: {qualityLevel}
              </button>

              {/* Settings styling tuning */}
              <button
                id="player-btn-settings-menu"
                tabIndex={0}
                onClick={() => setActiveMenu(activeMenu === "settings" ? "none" : "settings")}
                className="focusable p-1.5 rounded text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-medium outline-none transition-colors border border-transparent focus:border-white focus:bg-white/5"
              >
                <Settings size={14} /> Subtitle Settings
              </button>
            </div>

            <div className="text-zinc-500 font-mono text-[10px]">
              D-pad: Left/Right defaults skip | Escape: Close player
            </div>

            {/* Subtitles Selector panel */}
            {activeMenu === "subtitles" && (
              <div className="absolute bottom-16 left-24 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl z-40 w-48 text-xs">
                <span className="text-zinc-500 font-bold uppercase text-[9px] mb-2 block font-mono">Subtitle Streams</span>
                <button
                  tabIndex={0}
                  onClick={() => { setSubtitleTrack("off"); setActiveMenu("none"); }}
                  className="focusable w-full text-left py-1.5 text-gray-200 focus:text-[#E50914] outline-none hover:text-white flex justify-between items-center"
                >
                  Subtitles Off {subtitleTrack === "off" && <Check size={12} className="text-[#E50914]" />}
                </button>
                <button
                  tabIndex={0}
                  onClick={() => { setSubtitleTrack("en"); setActiveMenu("none"); }}
                  className="focusable w-full text-left py-1.5 text-gray-200 focus:text-[#E50914] outline-none hover:text-white flex justify-between items-center"
                >
                  English Broadcast {subtitleTrack === "en" && <Check size={12} className="text-[#E50914]" />}
                </button>
              </div>
            )}

            {/* Quality selector panel */}
            {activeMenu === "quality" && (
              <div className="absolute bottom-16 left-56 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl z-40 w-48 text-xs">
                <span className="text-zinc-500 font-bold uppercase text-[9px] mb-2 block font-mono">HLS Bitrate Ladders</span>
                {["auto", "1080p HD", "720p", "480p", "360p"].map((level) => (
                  <button
                    key={level}
                    tabIndex={0}
                    onClick={() => { setQualityLevel(level); setActiveMenu("none"); }}
                    className="focusable w-full text-left py-1.5 text-gray-200 focus:text-[#E50914] outline-none hover:text-white capitalize flex justify-between items-center"
                  >
                    {level} {qualityLevel === level && <Check size={12} className="text-[#E50914]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Detailed Subtitles Settings panel */}
            {activeMenu === "settings" && (
              <div className="absolute bottom-16 left-96 bg-zinc-950 border border-zinc-900 p-4 rounded-xl shadow-2xl z-40 w-64 text-xs flex flex-col gap-3 font-sans text-gray-300">
                <span className="text-zinc-500 font-bold uppercase text-[9px] block font-mono border-b border-zinc-800 pb-1.5">Aesthetic Subtitle Styling</span>
                
                {/* Font Size tuning */}
                <div className="flex justify-between items-center">
                  <span>Font Size:</span>
                  <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
                    {["small", "medium", "large"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSubtitleStyle(p => ({ ...p, fontSize: size as any }))}
                        className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold transition-all ${subtitleStyle.fontSize === size ? "bg-[#E50914] text-white" : "hover:bg-zinc-800"}`}
                      >
                        {size.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Color tuning */}
                <div className="flex justify-between items-center">
                  <span>Font Color:</span>
                  <div className="flex gap-1">
                    {["#FFFFFF", "#FFFF00", "#00FFFF", "#32CD32"].map((col) => (
                      <button
                        key={col}
                        onClick={() => setSubtitleStyle(p => ({ ...p, fontColor: col }))}
                        className={`w-3.5 h-3.5 rounded-full border border-zinc-800 transition-all ${subtitleStyle.fontColor === col ? "ring-1 ring-white scale-110" : ""}`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Box config */}
                <div className="flex justify-between items-center">
                  <span>Contrast Box:</span>
                  <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
                    {["none", "semi", "solid"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSubtitleStyle(p => ({ ...p, textBackground: mode as any }))}
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold transition-all ${subtitleStyle.textBackground === mode ? "bg-[#E50914] text-white" : "hover:bg-zinc-800"}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playback speed modifier */}
                <div className="flex justify-between items-center">
                  <span>Playback Speed:</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSubtitleStyle(p => ({ ...p, speed: Math.max(0.5, p.speed - 0.25) }))}
                      className="px-1.5 py-0.2 bg-zinc-850 hover:bg-zinc-800 rounded text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-[10px]">{subtitleStyle.speed.toFixed(2)}x</span>
                    <button 
                      onClick={() => setSubtitleStyle(p => ({ ...p, speed: Math.min(2.0, p.speed + 0.25) }))}
                      className="px-1.5 py-0.2 bg-zinc-850 hover:bg-zinc-800 rounded text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtitle Offset adjustment */}
                <div className="flex justify-between items-center">
                  <span>Subtitle Sync:</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSubtitleStyle(p => ({ ...p, subtitleOffset: p.subtitleOffset - 0.5 }))}
                      className="px-1.5 py-0.2 bg-zinc-850 hover:bg-zinc-800 rounded text-xs font-semibold"
                    >
                      -0.5s
                    </button>
                    <span className="font-mono text-[10px] text-zinc-400">{subtitleStyle.subtitleOffset >= 0 ? "+" : ""}{subtitleStyle.subtitleOffset.toFixed(1)}s</span>
                    <button 
                      onClick={() => setSubtitleStyle(p => ({ ...p, subtitleOffset: p.subtitleOffset + 0.5 }))}
                      className="px-1.5 py-0.2 bg-zinc-850 hover:bg-zinc-800 rounded text-xs font-semibold"
                    >
                      +0.5s
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_SETTINGS as baseSettingsList };

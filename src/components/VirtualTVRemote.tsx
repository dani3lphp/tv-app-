import React, { useState } from "react";
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, 
  RotateCcw, Play, Pause, Power, Tv, Eye, EyeOff, Sliders, Info
} from "lucide-react";

export default function VirtualTVRemote() {
  const [isOpen, setIsOpen] = useState(true);

  // Dispatch a simulated keyboard event directly to window to trigger our spatial navigation hook
  const pressKey = (keyName: string) => {
    const event = new KeyboardEvent("keydown", {
      key: keyName,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300] font-sans select-none flex flex-col items-end">
      {/* Small Expand Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-900 border border-zinc-800 hover:bg-[#E50914] text-white p-2.5 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer transition-all duration-300"
        title="Toggle Simulated remote control"
      >
        <Tv size={16} />
        <span className="text-xs font-semibold uppercase">{isOpen ? "Hide Remote" : "TV Remote"}</span>
      </button>

      {/* Actual Remote Controller chassis view */}
      {isOpen && (
        <div className="mt-3 bg-zinc-950/95 border border-zinc-800 p-5 rounded-3xl shadow-2xl w-48 text-center flex flex-col items-center gap-5 backdrop-blur-md animate-fade-in">
          {/* Status badge & title */}
          <div className="w-full flex justify-between items-center px-1">
            <span className="text-[9px] text-[#E50914] font-black tracking-widest font-mono select-none uppercase">DANIFLIX</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected via TV Core" />
          </div>

          {/* Quick Buttons row */}
          <div className="flex gap-4 justify-center w-full">
            <button
              onClick={() => pressKey("Backspace")}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-xs font-bold text-gray-300 flex items-center justify-center cursor-pointer border border-zinc-800"
              title="Remote Back Button (Backspace)"
            >
              <RotateCcw size={14} className="text-red-500" />
            </button>
            <button
              onClick={() => pressKey(" ")}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-[#E50914] active:scale-95 text-xs font-bold text-gray-300 flex items-center justify-center cursor-pointer border border-zinc-800"
              title="Remote Play/Pause (Space)"
            >
              <Play size={12} fill="currentColor" />
            </button>
          </div>

          {/* D-PAD CHASSIS MODULE */}
          <div className="relative w-32 h-32 bg-zinc-900/40 rounded-full flex items-center justify-center border border-zinc-850 p-2 shadow-inner">
            {/* Center OK button */}
            <button
              onClick={() => pressKey("Enter")}
              className="w-12 h-12 rounded-full bg-[#E50914]/90 hover:bg-[#E50914] active:scale-90 text-white font-black text-xs shadow-md tracking-wider flex items-center justify-center cursor-pointer select-none transition-transform z-10"
              title="OK / Enter"
            >
              OK
            </button>

            {/* UP button */}
            <button
              onClick={() => pressKey("ArrowUp")}
              className="absolute top-1.5 w-10 h-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 cursor-pointer pr-0.5"
              title="Arrow Up"
            >
              <ArrowUp size={18} />
            </button>

            {/* DOWN button */}
            <button
              onClick={() => pressKey("ArrowDown")}
              className="absolute bottom-1.5 w-10 h-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 cursor-pointer pr-0.5"
              title="Arrow Down"
            >
              <ArrowDown size={18} />
            </button>

            {/* LEFT button */}
            <button
              onClick={() => pressKey("ArrowLeft")}
              className="absolute left-1.5 h-10 w-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 cursor-pointer pt-0.5"
              title="Arrow Left"
            >
              <ArrowLeft size={18} />
            </button>

            {/* RIGHT button */}
            <button
              onClick={() => pressKey("ArrowRight")}
              className="absolute right-1.5 h-10 w-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 cursor-pointer pt-0.5"
              title="Arrow Right"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Helper details */}
          <div className="text-[9px] text-zinc-500 font-mono flex flex-col gap-1 tracking-normal leading-normal select-none">
            <span className="text-zinc-400 font-bold uppercase block">Interactive Controls</span>
            <span>You can also use physical PC Keyboard Arrow Keys, Backspace, or Enter on your computer!</span>
          </div>
        </div>
      )}
    </div>
  );
}

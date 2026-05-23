import React, { useState } from "react";
import { Profile } from "../types";
import { Search, RotateCcw, User, Film, Play, Home, Plus, Tv, HelpCircle, LogOut } from "lucide-react";

interface SidebarProps {
  activeProfile: Profile | null;
  onChangeProfile: () => void;
  onOpenSearch: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  watchlistCount: number;
}

export default function Sidebar({
  activeProfile,
  onChangeProfile,
  onOpenSearch,
  activeTab,
  setActiveTab,
  watchlistCount
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: "Home", name: "Home", icon: <Home size={18} /> },
    { id: "Movies", name: "Movies", icon: <Film size={18} /> },
    { id: "TV Shows", name: "TV Shows", icon: <Tv size={18} /> },
    { id: "My List", name: "My List", icon: <Plus size={18} />, badge: watchlistCount > 0 ? watchlistCount : undefined }
  ];

  return (
    <aside 
      id="tv-sidebar"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed top-0 left-0 bottom-0 bg-[#0f0f0f] border-r border-zinc-900/80 z-[120] flex flex-col justify-between py-6 transition-all duration-300 ${
        isExpanded ? "w-60 px-5 shadow-[5px_0_30px_rgba(0,0,0,0.85)] bg-[#0c0c0c]" : "w-16 px-2.5"
      }`}
    >
      <div className="flex flex-col gap-8">
        {/* Brand TV Logo */}
        <div 
          className="flex items-center gap-2 px-2 py-1 select-none focusable outline-none rounded"
          id="sidebar-logo"
          tabIndex={0}
          onFocus={() => setIsExpanded(true)}
        >
          <span className="text-xl font-black text-[#E50914] tracking-wider font-sans flex items-center">
            D{isExpanded ? "ANIFLIX" : "F"}
          </span>
          {isExpanded && (
            <span className="bg-[#E50914]/20 border border-[#E50914]/50 text-[#E50914] text-[8px] font-mono tracking-wider px-1 rounded uppercase">
              TV
            </span>
          )}
        </div>

        {/* Quick Search trigger button */}
        <button
          id="sidebar-btn-search"
          tabIndex={0}
          onClick={onOpenSearch}
          onFocus={() => setIsExpanded(true)}
          className={`focusable w-full flex items-center gap-4 py-2.5 px-3 rounded-lg text-gray-400 hover:text-white focus:text-white transition-all duration-200 outline-none ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
          title="Search movies and shows"
        >
          <Search size={18} />
          {isExpanded && <span className="text-xs font-semibold uppercase tracking-wider font-sans">Search</span>}
        </button>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id.toLowerCase().replace(/\s+/g, "-")}`}
                tabIndex={0}
                onClick={() => setActiveTab(item.id)}
                onFocus={() => setIsExpanded(true)}
                className={`focusable w-full flex items-center gap-4 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 outline-none ${
                  isExpanded ? "justify-start" : "justify-center"
                } ${
                  isActive 
                    ? "bg-[#E50914] text-white shadow-lg shadow-red-900/30 font-bold" 
                    : "text-gray-400 hover:text-white hover:bg-zinc-900/50 focus:bg-zinc-900 focus:text-white"
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {/* Badge */}
                  {!isExpanded && item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E50914] text-white text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <span className="truncate flex-1 text-left">{item.name}</span>
                )}
                {isExpanded && item.badge && (
                  <span className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Active Profile Selection */}
      <div className="flex flex-col gap-4">
        {activeProfile && (
          <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
            {/* Switch profile item */}
            <button
              id="sidebar-btn-switch"
              tabIndex={0}
              onClick={onChangeProfile}
              onFocus={() => setIsExpanded(true)}
              className={`focusable w-full flex items-center gap-4 py-2 px-3 rounded-lg text-gray-400 hover:text-white focus:text-white transition-all duration-150 outline-none ${
                isExpanded ? "justify-start" : "justify-center"
              }`}
              title="Switch streaming profile"
            >
              <LogOut size={16} />
              {isExpanded && <span className="text-[10px] font-bold uppercase tracking-wider">Switch Profile</span>}
            </button>

            {/* Profile Avatar indicator */}
            <div className={`flex items-center gap-3 p-1 rounded-lg ${isExpanded ? "bg-zinc-950/80 p-2" : ""}`}>
              <img 
                src={activeProfile.avatar} 
                alt={activeProfile.name} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded object-cover border border-zinc-800 shrink-0"
              />
              {isExpanded && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{activeProfile.name}</div>
                  <div className="text-[9px] font-mono text-zinc-500 truncate uppercase">
                    {activeProfile.isKids ? "Kids Mode" : "Standard Profile"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

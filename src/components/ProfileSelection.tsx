import React, { useState } from "react";
import { Profile } from "../types";
import { Plus, Check, Play } from "lucide-react";

interface ProfileSelectionProps {
  onSelectProfile: (profile: Profile) => void;
}

export const DEFAULT_PROFILES: Profile[] = [
  { id: "daniel", name: "Daniel", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop", isKids: false },
  { id: "kids", name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=200&auto=format&fit=crop", isKids: true },
  { id: "family", name: "Family", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop", isKids: false },
  { id: "guest", name: "Guest Support", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop", isKids: false }
];

export default function ProfileSelection({ onSelectProfile }: ProfileSelectionProps) {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const cached = localStorage.getItem("daniflix_profiles");
    return cached ? JSON.parse(cached) : DEFAULT_PROFILES;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const saveProfileName = (id: string) => {
    if (!editName.trim()) return;
    const updated = profiles.map(p => p.id === id ? { ...p, name: editName } : p);
    setProfiles(updated);
    localStorage.setItem("daniflix_profiles", JSON.stringify(updated));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col justify-center items-center px-4 relative font-sans">
      {/* Absolute Logo Header */}
      <div className="absolute top-8 left-12 flex items-center gap-2">
        <span className="text-3xl font-extrabold text-[#E50914] tracking-wider select-none font-sans flex items-center">
          DANI<span className="text-white">FLIX</span>
        </span>
        <span className="bg-[#E50914]/20 border border-[#E50914]/50 text-[#E50914] text-[10px] font-mono tracking-tight px-1.5 py-0.5 rounded uppercase">TV Core</span>
      </div>

      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-wide text-white mb-3">Who's watching?</h1>
        <p className="text-gray-400 text-sm">Choose a profile to start streaming customized suggestions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full px-6 mb-16">
        {profiles.map((profile, idx) => (
          <div 
            key={profile.id}
            id={`profile-${profile.id}`}
            tabIndex={0}
            className="focusable group flex flex-col items-center cursor-pointer outline-none rounded-lg p-3 transition-all duration-300 transform border border-transparent hover:border-white/10 focus:border-white focus:bg-white/5"
            onClick={() => {
              if (editingId) return;
              onSelectProfile(profile);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (editingId) return;
                onSelectProfile(profile);
              }
            }}
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-md overflow-hidden border-2 border-transparent group-focus:border-white group-hover:border-white transition-all duration-300 drop-shadow-xl shadow-black/80">
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-all duration-300"
              />
              {profile.isKids && (
                <div className="absolute bottom-1 right-1 bg-[#E50914] text-[9px] uppercase font-bold px-1 rounded shadow-md tracking-wider">Kids</div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xs bg-white text-black font-semibold px-2 py-1 rounded">Edit</span>
                </div>
              )}
            </div>

            {editingId === profile.id ? (
              <div className="mt-4 flex gap-1 w-full max-w-[140px]" onClick={e => e.stopPropagation()}>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-zinc-800 border-b border-zinc-500 text-white px-2 py-1 text-sm rounded outline-none w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveProfileName(profile.id);
                    }
                  }}
                />
                <button 
                  onClick={() => saveProfileName(profile.id)}
                  className="bg-[#E50914] hover:bg-red-700 text-white p-1 rounded"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <span className="mt-4 text-gray-300 group-hover:text-white group-focus:text-white font-medium text-base tracking-wide transition-colors truncate w-full text-center">
                {profile.name}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          id="btn-edit-profiles"
          tabIndex={0}
          className="focusable bg-transparent hover:bg-white hover:text-black focus:bg-white focus:text-black border border-gray-600 text-gray-400 font-medium px-6 py-2.5 rounded text-sm transition-all tracking-wider outline-none uppercase"
          onClick={() => {
            setIsEditing(!isEditing);
            setEditingId(null);
          }}
        >
          {isEditing ? "Finish Editing" : "Manage Profiles"}
        </button>

        {isEditing && (
          <div className="text-xs text-amber-500 animate-pulse font-medium">
            Select a profile icon label above to change display name.
          </div>
        )}
      </div>

      {/* Floating hints footer */}
      <div className="absolute bottom-6 text-gray-500 text-xs font-mono select-none text-center">
        💡 Use <kbd className="bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-gray-300">Arrow Keys</kbd> &amp; <kbd className="bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-gray-300">Enter / OK</kbd> to navigate this Tizen remote engine screen
      </div>
    </div>
  );
}
export { DEFAULT_PROFILES as profilesList };

import { useState, useRef, useEffect } from "react";
import type { AuthUser } from "../../hooks/useAuth";
import type { UserProfile } from "../../types/request";

interface HeaderProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  onLocationSelect: (lng: number, lat: number) => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onFeedbackClick: () => void;
}

interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function Header({ user, profile, onLocationSelect, onLoginClick, onLogout, onProfileClick, onSettingsClick, onFeedbackClick }: HeaderProps) {
  const headerName = profile?.firstName || user?.userDetails || "";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch geocoding suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch { /* ignore network errors */ }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSuggestions]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownAnimate, setDropdownAnimate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dropdownOpen) {
      setDropdownVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setDropdownAnimate(true)));
    } else {
      setDropdownAnimate(false);
      const timer = setTimeout(() => setDropdownVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 h-14 text-slate-800 dark:text-zinc-200 z-[9999] pointer-events-none">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)' }} />
      <div className="relative pointer-events-auto">
        <h1 className="m-0 flex items-center cursor-pointer text-white drop-shadow-md rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md p-2" onClick={() => window.location.reload()}>
          <span className="inline-flex items-center">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L2 30h10v28h40V30h10L32 4z" fill="#3b82f6" stroke="currentColor" strokeWidth="2"/>
              <rect x="22" y="38" width="10" height="20" rx="1" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="38" y="32" width="8" height="8" rx="1" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M30 8L28 22L33 20L29 34L34 30L31 42" stroke="var(--bg-card)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </h1>
      </div>
      <div className="relative flex items-center gap-2 pointer-events-auto">
        {/* Search: always expanded on desktop, expandable on mobile */}
        <div ref={searchContainerRef} className={`relative flex items-center rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md transition-all duration-300 overflow-visible ${
          searchExpanded ? "w-48 sm:w-56" : "w-10 md:w-56"
        } h-10`}>
          <button
            onClick={() => {
              if (!searchExpanded) {
                setSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center cursor-pointer md:pointer-events-none"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-white">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
            placeholder="Search locations..."
            className={`bg-transparent border-none outline-none text-sm text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 pr-3 w-full ${
              searchExpanded ? "opacity-100" : "opacity-0 md:opacity-100"
            } transition-opacity duration-200`}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer mr-1"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-zinc-500">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {/* Location suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a] rounded-xl shadow-lg overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.lat}-${s.lon}-${i}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onLocationSelect(parseFloat(s.lon), parseFloat(s.lat));
                    setSearchQuery(s.display_name.split(",")[0]);
                    setShowSuggestions(false);
                    searchInputRef.current?.blur();
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-start gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 384 512" fill="currentColor" className="text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0">
                    <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
                  </svg>
                  <span className="line-clamp-2 leading-snug">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-colors text-slate-700 dark:text-white"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {profile?.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (headerName?.[0] ?? "U").toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium truncate max-w-30">
                {headerName}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownVisible && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a] rounded-xl shadow-lg origin-top-right z-50"
              style={{
                transition: "opacity 150ms ease, transform 150ms ease",
                opacity: dropdownAnimate ? 1 : 0,
                transform: dropdownAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
              }}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#3a3a3a] overflow-hidden">
                <p className="text-sm font-medium truncate">{profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.userDetails}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{profile?.email || user.userDetails}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 capitalize truncate">{{ aad: "Microsoft", google: "Google", apple: "Apple", facebook: "Facebook" }[user.identityProvider] ?? user.identityProvider} account</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); onProfileClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                My Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onSettingsClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onFeedbackClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Feedback
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors rounded-b-xl flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
            )}
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-colors text-slate-700 dark:text-white"
              aria-label="Menu"
            >
              <div className="w-7 h-7 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-white">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownVisible && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a] rounded-xl shadow-lg origin-top-right z-50"
              style={{
                transition: "opacity 150ms ease, transform 150ms ease",
                opacity: dropdownAnimate ? 1 : 0,
                transform: dropdownAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
              }}
            >
              <button
                onClick={() => { setDropdownOpen(false); onSettingsClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors rounded-t-xl flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onFeedbackClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Feedback
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onLoginClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-500 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors rounded-b-xl flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign in
              </button>
            </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useRef, useEffect } from "react";
import type { AuthUser } from "../../hooks/useAuth";

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
}

export default function Header({ darkMode, onToggleTheme, user, onLoginClick, onLogout, onProfileClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    <header className="flex items-center justify-between px-6 h-14 bg-white dark:bg-[#272727] text-slate-800 dark:text-zinc-200 z-50 shadow-sm border-b border-slate-200 dark:border-[#2a2a2a]">
      <div>
        <h1 className="m-0 text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <span className="inline-flex items-center">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L2 30h10v28h40V30h10L32 4z" fill="#3b82f6" stroke="currentColor" strokeWidth="2"/>
              <rect x="22" y="38" width="10" height="20" rx="1" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="38" y="32" width="8" height="8" rx="1" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M30 8L28 22L33 20L29 34L34 30L31 42" stroke="var(--bg-card)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span> FixMyBlock
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={onToggleTheme}
          className="relative w-20 h-10 flex items-center rounded-full p-1 transition-colors cursor-pointer bg-slate-100 dark:bg-[#333] hover:bg-slate-200 dark:hover:bg-[#3a3a3a]"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 4.95l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
            </svg>
          </div>
          <span
            className={`absolute top-1 left-1 w-8 h-8 rounded-full shadow-md transition-all duration-300
              ${darkMode ? "bg-[#3a3a3a] translate-x-10" : "bg-white translate-x-0"}`}
          />
        </button>
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#333] hover:bg-slate-200 dark:hover:bg-[#3a3a3a] cursor-pointer transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {(user.userDetails?.[0] ?? "U").toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium truncate max-w-30">
                {user.userDetails}
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
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#3a3a3a]">
                <p className="text-sm font-medium truncate">{user.userDetails}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{{ aad: "Microsoft", google: "Google", apple: "Apple", facebook: "Facebook" }[user.identityProvider] ?? user.identityProvider}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); onProfileClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Profile
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
          <button
            onClick={onLoginClick}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#444] hover:bg-slate-300 dark:hover:bg-[#555] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Sign in"
            title="Sign in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-zinc-400">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}

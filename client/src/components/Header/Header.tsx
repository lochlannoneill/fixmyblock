interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({ darkMode, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 h-14 bg-white dark:bg-[#272727] text-slate-800 dark:text-zinc-200 z-[100] shadow-sm border-b border-slate-200 dark:border-[#2a2a2a]">
      <div>
        <h1 className="m-0 text-xl font-bold flex items-center gap-2">
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={onToggleTheme}
          className={`relative w-16 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer
            ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 4.95l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
            </svg>
          </div>
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all duration-300
              ${darkMode ? "bg-blue-500 translate-x-8" : "bg-yellow-400 translate-x-0"}`}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 4.95l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </header>
  );
}

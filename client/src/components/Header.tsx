interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({
  darkMode,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>
          <span className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L2 30h10v28h40V30h10L32 4z" fill="var(--accent)" stroke="var(--text-primary)" strokeWidth="2"/>
              <rect x="22" y="38" width="10" height="20" rx="1" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="1.5"/>
              <rect x="38" y="32" width="8" height="8" rx="1" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="1.5"/>
              <path d="M30 8L28 22L33 20L29 34L34 30L31 42" stroke="var(--bg-card)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span> FixMyBlock
        </h1>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {/* Track background icons */}
          <div className="toggle-track-icons">
            <svg xmlns="http://www.w3.org/2000/svg" className="toggle-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 4.95l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="toggle-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
            </svg>
          </div>
          {/* Sliding knob */}
          <span className={`toggle-knob ${darkMode ? "toggle-knob--dark" : "toggle-knob--light"}`}>
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="knob-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="knob-icon" fill="currentColor" viewBox="0 0 24 24">
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

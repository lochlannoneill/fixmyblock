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
          <span className="logo-icon">🏘️</span> FixMyBlock
        </h1>
      </div>
      <div className="header-actions">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

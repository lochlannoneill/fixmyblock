import { useState } from "react";

interface SettingsPageProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
}

export default function SettingsPage({ darkMode, onToggleTheme, onClose }: SettingsPageProps) {
  const [notifications, setNotifications] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="m-0 text-lg font-semibold text-slate-800 dark:text-zinc-200">Settings</h2>
        <button
          onClick={onClose}
          className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Dark mode */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-zinc-400">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Dark Mode</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Switch between light and dark theme</p>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${darkMode ? "bg-blue-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-zinc-400">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Notifications</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Get notified about updates to your posts</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${notifications ? "bg-blue-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifications ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Location precision */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-zinc-400">
              <path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0z" />
              <circle cx="12" cy="8" r="2" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">High Accuracy Location</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Use GPS for precise pin placement</p>
            </div>
          </div>
          <span className="text-xs text-blue-500 font-medium">On</span>
        </div>

        {/* About section */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3">About</h3>
          <div className="p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">FixMyBlock</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Version {__APP_VERSION__}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Author: <a href="https://lochlannoneill.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lochlann O Neill</a></p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">A community platform for reporting and tracking local issues in your neighbourhood.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

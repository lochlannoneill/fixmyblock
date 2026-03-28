import { useState, useEffect } from "react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (provider: "google" | "aad" | "apple" | "facebook") => void;
}

export default function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm transition-colors duration-200"
      style={{ backgroundColor: animate ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)" }}
      onClick={onClose}
    >
      <div
        className="bg-white/80 dark:bg-[#272727]/80 backdrop-blur-xl rounded-2xl shadow-2xl w-[90vw] max-w-sm p-6 relative transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#333] text-slate-400 dark:text-zinc-500 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-lg font-bold mb-1 text-slate-800 dark:text-zinc-100 text-center">Sign in</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 text-center">
          Join your community
        </p>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => onLogin("google")}
            className="flex items-center justify-center gap-3 w-48 py-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-zinc-200 font-medium cursor-pointer transition-all duration-150 hover:scale-105 hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <button
            onClick={() => onLogin("aad")}
            className="flex items-center justify-center gap-3 w-48 py-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-zinc-200 font-medium cursor-pointer transition-all duration-150 hover:scale-105 hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
              <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
              <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
            </svg>
            Microsoft
          </button>

          <button
            onClick={() => onLogin("apple")}
            className="flex items-center justify-center gap-3 w-48 py-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-zinc-200 font-medium cursor-pointer transition-all duration-150 hover:scale-105 hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple
          </button>

          <button
            onClick={() => onLogin("facebook")}
            className="flex items-center justify-center gap-3 w-48 py-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-zinc-200 font-medium cursor-pointer transition-all duration-150 hover:scale-105 hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-5 text-center">
          Sign in to report issues, like, and comment.
        </p>
      </div>
    </div>
  );
}

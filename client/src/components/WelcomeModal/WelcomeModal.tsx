import { useRef, useState } from "react";
import { updateProfile, uploadAvatar } from "../../services/api";
import type { UserProfile } from "../../types/request";

interface WelcomeModalProps {
  onComplete: (profile: UserProfile) => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError("");
    try {
      let profile = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      if (avatarFile) {
        profile = await uploadAvatar(avatarFile);
      }
      onComplete(profile);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-[#3a3a3a] overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center cursor-pointer group overflow-hidden border-0 p-0"
            aria-label="Add profile picture"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarPick}
              className="hidden"
            />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200">Welcome to FixMyBlock!</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Let's set up your profile. What should we call you?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Lochlann"
              maxLength={50}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="O Neill"
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className={`mt-1 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              canSubmit && !saving
                ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                : "bg-slate-200 dark:bg-[#333] text-slate-400 dark:text-zinc-500 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

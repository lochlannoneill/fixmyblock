import { useRef, useState, useEffect } from "react";
import type { AuthUser } from "../../hooks/useAuth";
import type { Request, UserProfile, HomeAddress } from "../../types/request";
import { updateProfile, uploadAvatar, deleteAvatar, updateHomeAddress } from "../../services/api";
import { RequestItem } from "../RequestItem";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface ProfilePageProps {
  user: AuthUser;
  profile: UserProfile | null;
  requests: Request[];
  onClose: () => void;
  onSelectRequest: (r: Request) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  aad: "Microsoft",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

export default function ProfilePage({ user, profile, requests, onClose, onSelectRequest, onProfileUpdate }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<"yours" | "saved">("yours");
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [addressInput, setAddressInput] = useState(profile?.homeAddress?.address ?? "");
  const [addressSaving, setAddressSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const selectedAddressRef = useRef<NominatimResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddressInput = (value: string) => {
    setAddressInput(value);
    selectedAddressRef.current = null;
    setHasSelection(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value.trim())}`,
          { headers: { "Accept-Language": "en" } }
        );
        const results: NominatimResult[] = await res.json();
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  };

  const handleSelectSuggestion = (result: NominatimResult) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressInput(result.display_name);
    selectedAddressRef.current = result;
    setHasSelection(true);
  };

  const handleSaveAddress = async () => {
    if (addressSaving) return;
    const trimmed = addressInput.trim();
    setAddressSaving(true);
    if (!trimmed) {
      // Clear address
      try {
        const updated = await updateHomeAddress(null);
        onProfileUpdate(updated);
      } catch { /* ignore */ }
      selectedAddressRef.current = null;
      setHasSelection(false);
      setAddressSaving(false);
      return;
    }
    if (!selectedAddressRef.current) { setAddressSaving(false); return; }
    const ref = selectedAddressRef.current;
    const homeAddress: HomeAddress = {
      address: ref.display_name,
      latitude: parseFloat(ref.lat),
      longitude: parseFloat(ref.lon),
    };
    try {
      const updated = await updateHomeAddress(homeAddress);
      onProfileUpdate(updated);
    } catch { /* ignore */ }
    selectedAddressRef.current = null;
    setHasSelection(false);
    setAddressSaving(false);
  };

  const displayName = profile?.firstName ? profile.displayName : user.userDetails;

  const myPosts = requests.filter((r) => r.userId === user.userId);
  const savedPosts = requests.filter((r) => (r.savedBy || []).includes(user.userId));
  const totalLikesReceived = myPosts.reduce((sum, r) => sum + (r.likers || []).length, 0);
  const resolvedCount = myPosts.filter((r) => r.status === "resolved").length;
  const myLikesGiven = requests.filter((r) => (r.likers || []).includes(user.userId)).length;

  const handleSaveName = async () => {
    if (!firstName.trim() || !lastName.trim() || savingName) return;
    setSavingName(true);
    try {
      const updated = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      onProfileUpdate(updated);
      setEditingName(false);
    } catch {
      // ignore
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingAvatar) return;
    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const resized = await resizeImage(file, 512, 0.85);
      const updated = await uploadAvatar(resized);
      onProfileUpdate(updated);
    } catch {
      setAvatarError("Failed to upload image. Please try a smaller file.");
      setTimeout(() => setAvatarError(""), 4000);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  function resizeImage(file: File, maxSize: number, quality: number): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          quality,
        );
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="m-0 text-lg font-semibold text-slate-800 dark:text-zinc-200">My Profile</h2>
        <button
          onClick={onClose}
          className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
          aria-label="Close profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* User info card */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
        <div className="shrink-0 flex flex-col items-center gap-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0 cursor-pointer group overflow-hidden border-0 p-0"
          aria-label="Change profile picture"
        >
          {profile?.profilePictureUrl ? (
            <img src={profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (displayName?.[0] ?? "U").toUpperCase()
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingAvatar ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </button>
        {profile?.profilePictureUrl && !uploadingAvatar && (
          <button
            onClick={async () => {
              try {
                const updated = await deleteAvatar();
                onProfileUpdate(updated);
              } catch { /* ignore */ }
            }}
            className="text-[10px] text-red-400 hover:text-red-500 cursor-pointer transition-colors border border-red-300 dark:border-red-800 rounded px-1.5 py-0.5 bg-transparent"
          >
            Remove
          </button>
        )}
        </div>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                maxLength={50}
                autoFocus
                className="w-full bg-transparent text-sm text-slate-800 dark:text-zinc-200 border-b border-slate-300 dark:border-[#444] outline-none focus:border-blue-400 py-0.5 transition-colors"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                maxLength={50}
                className="w-full bg-transparent text-sm text-slate-800 dark:text-zinc-200 border-b border-slate-300 dark:border-[#444] outline-none focus:border-blue-400 py-0.5 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={!firstName.trim() || !lastName.trim() || savingName}
                  className="text-xs font-medium px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditingName(false); setFirstName(profile?.firstName || ""); setLastName(profile?.lastName || ""); }}
                  className="text-xs font-medium px-3 py-1 rounded-md text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#333] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold truncate">{displayName}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-400 dark:text-zinc-500 hover:text-blue-500 cursor-pointer transition-colors shrink-0"
                  aria-label="Edit name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-400 dark:text-zinc-500 truncate">
                {profile?.email || user.userDetails}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                {PROVIDER_LABELS[user.identityProvider] ?? user.identityProvider} account
              </p>
            </>
          )}
        </div>
      </div>

      {avatarError && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {avatarError}
        </div>
      )}

      {/* Home Address */}
      <div ref={addressWrapperRef} className="relative mb-6">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500 mb-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            placeholder="Search for your home address…"
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] text-slate-700 dark:text-zinc-300 placeholder-slate-300 dark:placeholder-zinc-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
          />
          {hasSelection && (
            <button
              onClick={handleSaveAddress}
              disabled={addressSaving}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-[#333] text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#3a3a3a] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 border border-slate-200 dark:border-[#444]"
            >
              {addressSaving ? "…" : "Save"}
            </button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors border-0 bg-transparent"
                style={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Posts" value={myPosts.length} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        } />
        <StatCard label="Likes Received" value={totalLikesReceived} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        } />
        <StatCard label="Issues Resolved" value={resolvedCount} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        } />
        <StatCard label="Likes Given" value={myLikesGiven} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        } />
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-slate-200 dark:border-[#3a3a3a] mb-3">
        <div
          className="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: "50%", left: activeTab === "yours" ? "0%" : "50%" }}
        />
        <button
          onClick={() => setActiveTab("yours")}
          className={`flex-1 text-xs font-medium py-2.5 cursor-pointer transition-colors ${
            activeTab === "yours"
              ? "text-slate-800 dark:text-zinc-200"
              : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
          }`}
        >
          Your Posts ({myPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 text-xs font-medium py-2.5 cursor-pointer transition-colors ${
            activeTab === "saved"
              ? "text-slate-800 dark:text-zinc-200"
              : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
          }`}
        >
          Saved Posts ({savedPosts.length})
        </button>
      </div>

      {activeTab === "yours" ? (
      <>
      {myPosts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
          You haven't posted any requests yet.
        </p>
      ) : (
        <div className="flex flex-col">
          {myPosts.map((r, i) => (
            <div key={r.id}>
              {i > 0 && <hr className="border-slate-200 dark:border-[#2a2a2a] my-2 mx-auto w-4/5" />}
              <RequestItem request={r} onSelect={onSelectRequest} currentUserId={user.userId} />
            </div>
          ))}
        </div>
      )}
      </>
      ) : (
      <>
      {savedPosts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
          You haven't saved any posts yet.
        </p>
      ) : (
        <div className="flex flex-col">
          {savedPosts.map((r, i) => (
            <div key={r.id}>
              {i > 0 && <hr className="border-slate-200 dark:border-[#2a2a2a] my-2 mx-auto w-4/5" />}
              <RequestItem request={r} onSelect={onSelectRequest} currentUserId={user.userId} />
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727]">
      <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-zinc-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{value}</p>
    </div>
  );
}

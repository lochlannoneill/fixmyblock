import { useState, useEffect, useCallback } from "react";
import { upsertMe, fetchMe } from "../services/api";
import type { UserProfile } from "../types/request";

export interface AuthUser {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

const DEV_STORAGE_KEY = "fixmyblock_dev_user";
const PROFILE_CACHE_KEY = "fixmyblock_profile_cache";
const isMockDev = import.meta.env.DEV && !window.location.port.startsWith("4280");

function getCachedProfile(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedProfile(profile: UserProfile | null) {
  try {
    if (profile) sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    else sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch { /* ignore */ }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(getCachedProfile);
  const [loading, setLoading] = useState(true);

  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
    setCachedProfile(p);
  }, []);

  useEffect(() => {
    if (isMockDev) {
      const stored = localStorage.getItem(DEV_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        // Fetch first (read-only, cheap), upsert only if fetch fails (new user)
        fetchMe()
          .then(setProfile)
          .catch(() => upsertMe().then(setProfile).catch(() => { /* no profile yet */ }))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    fetch("/.auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        const principal = data.clientPrincipal ?? null;
        setUser(principal);
        if (principal) {
          try {
            const p = await fetchMe();
            setProfile(p);
          } catch {
            // User doesn't exist yet — upsert to create
            try { setProfile(await upsertMe()); } catch { /* ignore */ }
          }
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((provider: "google" | "aad" | "apple" | "facebook") => {
    if (isMockDev) {
      const labels: Record<string, string> = { google: "dev@gmail.com", aad: "dev@outlook.com", apple: "dev@icloud.com", facebook: "dev@facebook.com" };
      const mockUser: AuthUser = {
        identityProvider: provider,
        userId: "dev-user-123",
        userDetails: labels[provider],
        userRoles: ["anonymous", "authenticated"],
      };
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      fetchMe().then(setProfile).catch(() => upsertMe().then(setProfile).catch(() => { /* ignore */ }));
      return;
    }
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/.auth/login/${provider}?post_login_redirect_uri=${redirect}`;
  }, []);

  const logout = useCallback(() => {
    if (isMockDev) {
      localStorage.removeItem(DEV_STORAGE_KEY);
      window.location.reload();
      return;
    }
    setCachedProfile(null);
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  }, [setProfile]);

  return { user, profile, loading, login, logout, setProfile };
}

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
const isMockDev = import.meta.env.DEV && !window.location.port.startsWith("4280");

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockDev) {
      const stored = localStorage.getItem(DEV_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
        // In dev mode, create a mock profile from localStorage settings
        const parsed = JSON.parse(stored) as AuthUser;
        setProfile({
          id: parsed.userId,
          firstName: "",
          lastName: "",
          displayName: parsed.userDetails,
          identityProvider: parsed.identityProvider,
          role: "admin",
          createdAt: new Date().toISOString(),
          settings: {
            darkMode: localStorage.getItem("fixmyblock-theme") === "dark",
            highAccuracy: localStorage.getItem("highAccuracy") !== "false",
          },
        });
      }
      setLoading(false);
      return;
    }
    fetch("/.auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        const principal = data.clientPrincipal ?? null;
        setUser(principal);
        if (principal) {
          try {
            const p = await upsertMe();
            setProfile(p);
          } catch {
            // Profile upsert failed — try fetching existing
            try { setProfile(await fetchMe()); } catch { /* ignore */ }
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
      setProfile({
        id: mockUser.userId,
        firstName: "",
        lastName: "",
        displayName: mockUser.userDetails,
        identityProvider: mockUser.identityProvider,
        role: "admin",
        createdAt: new Date().toISOString(),
        settings: {
          darkMode: localStorage.getItem("fixmyblock-theme") === "dark",
          highAccuracy: localStorage.getItem("highAccuracy") !== "false",
        },
      });
      return;
    }
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/.auth/login/${provider}?post_login_redirect_uri=${redirect}`;
  }, []);

  const logout = useCallback(() => {
    if (isMockDev) {
      localStorage.removeItem(DEV_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  }, []);

  return { user, profile, loading, login, logout, setProfile };
}

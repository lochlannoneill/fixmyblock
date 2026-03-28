import { useState, useEffect, useCallback } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockDev) {
      const stored = localStorage.getItem(DEV_STORAGE_KEY);
      setUser(stored ? JSON.parse(stored) : null);
      setLoading(false);
      return;
    }
    fetch("/.auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.clientPrincipal ?? null);
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
      return;
    }
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/.auth/login/${provider}?post_login_redirect_uri=${redirect}`;
  }, []);

  const logout = useCallback(() => {
    if (isMockDev) {
      localStorage.removeItem(DEV_STORAGE_KEY);
      setUser(null);
      return;
    }
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  }, []);

  return { user, loading, login, logout };
}

"use client";

import { useCallback, useEffect, useState } from "react";

const LS_USER_KEY = "simpleAuth.user";
const LS_LOGGED_KEY = "simpleAuth.logged";

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(LS_USER_KEY) ?? sessionStorage.getItem(LS_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const withBase = (p) =>
  `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
const LOGIN_EP = withBase("/users/login");

function sanitizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id ?? raw.idUser ?? raw.userId ?? null,
    userName: raw.userName ?? raw.name ?? "",
    email: raw.email ?? "",
    userStatus: raw.userStatus ?? null,
  };
}

export function useAuth() {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw =
        localStorage.getItem(LS_USER_KEY) ??
        sessionStorage.getItem(LS_USER_KEY);
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LS_LOGGED_KEY, "true");
      sessionStorage.setItem(LS_LOGGED_KEY, "true");
    } else {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_LOGGED_KEY);
      sessionStorage.removeItem(LS_USER_KEY);
      sessionStorage.removeItem(LS_LOGGED_KEY);
    }
  }, [user]);

  const login = useCallback(async ({ email, password, remember = true }) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(LOGIN_EP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: String(password) }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        let payload = null;
        try {
          payload = JSON.parse(text);
        } catch {}

        if (resp.status === 401 || resp.status === 403 || resp.status === 404) {
          const msg = payload?.message || "Usuario o contraseña incorrectos";
          setUser(null);
          setError(msg);
          return { ok: false, message: msg, status: resp.status };
        }

        const msg = payload?.message || `Error HTTP ${resp.status}`;
        setUser(null);
        setError(msg);
        return { ok: false, message: msg, status: resp.status };
      }

      let payload;
      try {
        payload = await resp.json();
      } catch {
        payload = { user: { email } };
      }

      const raw = payload?.user ?? payload ?? { email };
      const normalized = sanitizeUser(raw);

      if (typeof window !== "undefined") {
        const target = remember ? localStorage : sessionStorage;
        target.setItem(LS_USER_KEY, JSON.stringify(normalized));
        target.setItem(LS_LOGGED_KEY, "true");
      }

      setUser(normalized);
      return { ok: resp.ok, user: normalized, status: resp.status };
    } catch (e) {
      setUser(null);
      const msg = e?.message || "No se pudo iniciar sesión";
      setError(msg);
      return { ok: false, error: e, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_LOGGED_KEY);
      sessionStorage.removeItem(LS_USER_KEY);
      sessionStorage.removeItem(LS_LOGGED_KEY);
    }
  }, []);

  const isAuthenticated =
    !!user ||
    (typeof window !== "undefined" &&
      (localStorage.getItem(LS_LOGGED_KEY) === "true" ||
        sessionStorage.getItem(LS_LOGGED_KEY) === "true"));

  return { user, loading, error, login, logout, isAuthenticated };
}

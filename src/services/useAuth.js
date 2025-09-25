"use client";
// src/services/useAuth.js
import { useCallback, useEffect, useState } from "react";

const LS_USER_KEY = "simpleAuth.user";
const LS_LOGGED_KEY = "simpleAuth.logged";

/**
 * BASE de la API:
 * - Opción 1 (recomendada): usa rewrites y llama a /api/... (ver comentario abajo)
 * - Opción 2: usa variable de entorno pública a tu backend real
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || // ej: "/api" (si usas rewrites a Spring)
  process.env.NEXT_PUBLIC_API_URL || // ej: "http://localhost:8080"
  "http://localhost:8080";

const withBase = (p) =>
  `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
const LOGIN_EP = withBase("/users/login"); // ajusta si tu endpoint es otro

export function useAuth() {
  // ⚠️ SSR-safe: no toques localStorage en el render inicial
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hidrata usuario desde storage (local o session) en cliente
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

  // Mantén storage sincronizado cuando cambia user
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      // no sabemos si viene de local o session; marca el flag en ambos por simplicidad
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
        console.error("LOGIN FAILED", {
          url: LOGIN_EP,
          status: resp.status,
          headers: Object.fromEntries(resp.headers.entries()),
          body: text,
        });
        // intenta parsear por si es JSON con message
        let payload = null;
        try {
          payload = JSON.parse(text);
        } catch {}
        const msg = payload?.message || `Error HTTP ${resp.status}`;
        setUser(null);
        setError(msg);
        return { ok: false, message: msg, status: resp.status };
      }

      // intenta parsear, si no, fabrica payload mínimo
      let payload;
      try {
        payload = await resp.json();
      } catch {
        payload = { email };
      }

      // normalización del usuario (mismo truco que tenías)
      const raw = payload?.user ?? payload ?? { email };
      const normalized = {
        ...raw,
        id: raw.id ?? raw.idUser ?? raw.userId,
      };

      // Recuerda en localStorage o sessionStorage
      if (typeof window !== "undefined") {
        if (remember) {
          localStorage.setItem(LS_USER_KEY, JSON.stringify(normalized));
          localStorage.setItem(LS_LOGGED_KEY, "true");
        } else {
          sessionStorage.setItem(LS_USER_KEY, JSON.stringify(normalized));
          sessionStorage.setItem(LS_LOGGED_KEY, "true");
        }
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

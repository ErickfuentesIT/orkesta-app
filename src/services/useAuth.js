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
  process.env.NEXT_PUBLIC_API_URL || // ej: "http://localhost:8080"
  "http://localhost:8080";

const withBase = (p) =>
  `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
const LOGIN_EP = withBase("/users/login"); // ajusta si tu endpoint es otro

// 🔒 Whitelist de campos permitidos para guardar en storage
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
  // ⚠️ SSR-safe: no toques localStorage en el render inicial
  const [user, setUser] = useState(getStoredUser); // ⬅️ importante
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
      // marca el flag en ambos por simplicidad
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
        body: JSON.stringify({ email, password: String(password) }), // se envía, pero NO se guarda
      });

      // Manejo explícito por status
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        let payload = null;
        try {
          payload = JSON.parse(text);
        } catch {}

        // 401 / 403 / 404 => credenciales inválidas
        if (resp.status === 401 || resp.status === 403 || resp.status === 404) {
          const msg = payload?.message || "Usuario o contraseña incorrectos";
          setUser(null);
          setError(msg);
          return { ok: false, message: msg, status: resp.status };
        }

        // Otros códigos: mensaje del backend o genérico
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
        payload = { user: { email } };
      }

      // normalización del usuario y sanitización (NO guarda password ni extras)
      const raw = payload?.user ?? payload ?? { email };
      const normalized = sanitizeUser(raw);

      // Recuerda en localStorage o sessionStorage
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

  // (opcional) este efecto duplicaba el de arriba; lo puedes eliminar si quieres
  // lo dejo comentado para no cambiar tu comportamiento actual
  /*
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
  */

  return { user, loading, error, login, logout, isAuthenticated };
}

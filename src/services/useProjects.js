"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchProjectsByUser } from "@/services/projects";
import { useAuth } from "@/services/useAuth";

export function useProjects() {
  const { user } = useAuth();

  const userId = useMemo(() => {
    const idMem = user?.id ?? user?.idUser ?? user?.userId ?? null;
    if (idMem) return idMem;

    if (typeof window === "undefined") return null;
    try {
      const raw =
        localStorage.getItem("simpleAuth.user") ??
        sessionStorage.getItem("simpleAuth.user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id ?? parsed?.idUser ?? parsed?.userId ?? null;
    } catch {
      return null;
    }
  }, [user]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (signal) => {
      if (userId == null) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProjectsByUser(userId, { signal });
        const list = Array.isArray(data)
          ? data
          : data?.data ?? data?.items ?? [];
        setProjects(Array.isArray(list) ? list : []);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setError(e?.message || "No se pudieron cargar proyectos");
        }
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    const ac = new AbortController();
    run(ac.signal);
    return () => ac.abort();
  }, [run]);

  const refetch = useCallback(() => run(undefined), [run]);

  return { projects, loading, error, userId, refetch, setProjects };
}

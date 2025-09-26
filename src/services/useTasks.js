"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchTasksByProject } from "@/services/tasks";

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (signal) => {
      if (!projectId) return;
      setLoad(true);
      setError(null);
      try {
        const data = await fetchTasksByProject(projectId, { signal });
        setTasks(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name !== "AbortError")
          setError(e.message || "No se pudieron cargar tareas");
      } finally {
        setLoad(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    const ac = new AbortController();
    run(ac.signal);
    return () => ac.abort();
  }, [run]);

  const refetch = useCallback(() => run(undefined), [run]);

  return { tasks, loading: loading, error, refetch, setTasks };
}

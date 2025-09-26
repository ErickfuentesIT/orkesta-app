// src/services/tasks.js
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";

const withBase = (p) =>
  `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

/** GET /tasks/by-project/{projectId} */
export async function fetchTasksByProject(projectId, { signal } = {}) {
  const resp = await fetch(
    withBase(`/tasks/by-project/${encodeURIComponent(projectId)}`),
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(t || `HTTP ${resp.status}`);
  }

  const raw = await resp.json();

  // Mapeo a un modelo usable en UI
  return (Array.isArray(raw) ? raw : []).map((t) => {
    const statusText = t?.status?.status ?? null; // viene como "1" (string)
    const statusId = t?.status?.idStatus ?? null; // viene como 1 (number)
    // Heurística: 1 = abierta, 2 = completada (ajusta si tu back usa otros códigos)
    const done =
      statusText === "2" ||
      statusText === 2 ||
      statusId === 2 ||
      statusText === "closed";

    return {
      id: t.tasks, // tu campo "tasks" es el id
      projectId: t?.idProjects?.idProject ?? null,
      title: t?.name ?? `Tarea #${t.tasks}`,
      description: t?.description ?? "",
      done,
      statusId,
      statusText,
      startAt: t?.plannedStartDate ?? null, // ISO
      endAt: t?.plannedEndDate ?? null, // ISO
      _raw: t,
    };
  });
}

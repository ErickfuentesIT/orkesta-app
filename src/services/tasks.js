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
    // 👇 Backend devuelve 500 cuando no hay tareas -> trátalo como vacío
    if (resp.status === 500) {
      // opcional: inspecciona el body por si quieres confirmar el path
      // const txt = await resp.text().catch(()=> "");
      return [];
    }
    // otros errores sí se propagan
    const t = await resp.text().catch(() => "");
    throw new Error(t || `HTTP ${resp.status}`);
  }

  const raw = await resp.json();

  return (Array.isArray(raw) ? raw : []).map((t) => {
    const statusText = t?.status?.status ?? null;
    const statusId = t?.status?.idStatus ?? null;
    const done = statusText === "2" || statusId === 2;
    return {
      id: t.tasks,
      projectId: t?.idProjects?.idProject ?? null,
      title: t?.name ?? `Tarea #${t.tasks}`,
      description: t?.description ?? "",
      done,
      statusId,
      statusText,
      startAt: t?.plannedStartDate ?? null,
      endAt: t?.plannedEndDate ?? null,
      _raw: t,
    };
  });
}

export async function createTask(payload) {
  const resp = await fetch(withBase("/tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || j?.error || msg;
    } catch {
      try {
        msg = (await resp.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }

  return resp.json().catch(() => ({}));
}

// GET /tasks/{taskId}
export async function fetchTaskById(taskId, { signal } = {}) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(withBase(`/tasks/${encodeURIComponent(taskId)}`), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(t || `HTTP ${resp.status}`);
  }
  return resp.json(); // te llega en crudo (name, status.idStatus, plannedStartDate, etc)
}

// PATCH /tasks/{taskId}
export async function updateTask(taskId, payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(withBase(`/tasks/${encodeURIComponent(taskId)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || j?.error || msg;
    } catch {
      try {
        msg = (await resp.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }
  return resp.json().catch(() => ({}));
}

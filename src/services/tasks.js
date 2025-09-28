// src/services/tasks.js
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
const ASSIGNEE_FIELD = "assignedTo"; // ej: "assignedTo", "assignee", "responsable", "idUserAssigned"

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
    if (resp.status === 404) {
      // opcional: loguear el body
      // const txt = await resp.text().catch(()=> "");
      return [];
    }
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
    const statusId = t?.status?.idStatus ?? null;
    // Si viene objeto de asignación, intenta extraer idUser
    const assignedUserId =
      t?.assigment?.idUser?.idUser ??
      t?.assigment?.idUserId ?? // por si el back trae otra forma
      null;
    return {
      id: t.tasks,
      projectId: t?.idProjects?.idProject ?? null,
      title: t?.name ?? `Tarea #${t.tasks}`,
      description: t?.description ?? "",
      statusId,
      statusText: t?.status?.status ?? null,
      startAt: t?.plannedStartDate ?? null,
      endAt: t?.plannedEndDate ?? null,
      assignedUserId, // 👈 NUEVO
      isAssigned: Boolean(t?.assigment), // null -> false, objeto -> true
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

  const {
    projectId, // opcional si no viene en payload.idProjects
    assignedUserId, // 👈 NUEVO: id del usuario asignado (number)
    name,
    description,
    statusId,
    plannedStartDate,
    plannedEndDate,
  } = payload;

  const body = {
    idProjects: {
      idProject: Number(projectId ?? payload?.idProjects?.idProject),
    },
    name,
    status: { idStatus: Number(statusId ?? payload?.status?.idStatus) },
    description,
    plannedStartDate,
    plannedEndDate,
  };

  // 👇 Añadimos el asignado SOLO si hay valor
  if (assignedUserId != null) {
    // estructura por defecto:
    body[ASSIGNEE_FIELD] = { idUser: Number(assignedUserId) };

    // Si tu backend espera otro nombre además, descomenta UNO y prueba:
    // body.assignee = { idUser: Number(assignedUserId) };
    // body.idUserAssigned = { idUser: Number(assignedUserId) };
  }

  const resp = await fetch(withBase(`/tasks/${encodeURIComponent(taskId)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
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

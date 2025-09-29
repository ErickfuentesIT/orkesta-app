const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
const ASSIGNEE_FIELD = "assignedTo";

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
    const assignedUserId =
      t?.assigment?.idUser?.idUser ?? t?.assigment?.idUserId ?? null;

    const assignedUserName =
      t?.assigment?.idUser?.userName ?? t?.assigment?.userName ?? null;

    return {
      id: t.tasks,
      projectId: t?.idProjects?.idProject ?? null,
      title: t?.name ?? `Tarea #${t.tasks}`,
      description: t?.description ?? "",
      statusId: t?.status?.idStatus ?? null,
      statusText: t?.status?.status ?? null,
      startAt: t?.plannedStartDate ?? null,
      endAt: t?.plannedEndDate ?? null,
      assignedUserId, // 👈 id del asignado (o null)
      assignedUserName, // 👈 nombre del asignado (o null)
      isAssigned: Boolean(t?.assigment), // true si hay objeto
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

/** GET /tasks/{taskId} */
export async function fetchTaskById(taskId, { signal } = {}) {
  const resp = await fetch(withBase(`/tasks/${encodeURIComponent(taskId)}`), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
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

  const t = await resp.json();

  return {
    id: t?.tasks,
    projectId: t?.idProjects?.idProject ?? null,
    title: t?.name ?? "",
    description: t?.description ?? "",
    statusId: t?.status?.idStatus ?? null,
    statusText: t?.status?.status ?? null,
    startAt: t?.plannedStartDate ?? null,
    endAt: t?.plannedEndDate ?? null,
    assignedUserId:
      t?.assigment?.idUser?.idUser ??
      t?.assigment?.idUserId ??
      (typeof t?.assigment?.idUser === "number" ? t.assigment.idUser : null) ??
      null,
    assignedUserName:
      t?.assigment?.idUser?.userName ?? t?.assigment?.userName ?? null,
    _raw: t,
  };
}

// PATCH /tasks/{taskId}
export async function updateTask(taskId, payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const {
    projectId,
    assignedUserId,
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

  if (assignedUserId != null) {
    body[ASSIGNEE_FIELD] = { idUser: Number(assignedUserId) };
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

// DELETE /users-tasks/{taskId}
export async function unassignUserFromTask(taskId) {
  const resp = await fetch(
    withBase(`/users-tasks/${encodeURIComponent(taskId)}`),
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      msg = (await resp.json())?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return resp.text().catch(() => "");
}

// POST /users-tasks
export async function assignUserToTask({ taskId, userId }) {
  const payload = {
    idUser: { idUser: Number(userId) },
    idTask: { tasks: Number(taskId) },
  };
  const resp = await fetch(withBase("/users-tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      msg = (await resp.json())?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return resp.json().catch(() => ({}));
}

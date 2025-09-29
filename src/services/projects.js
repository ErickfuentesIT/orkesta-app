const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";

const withBase = (p) => {
  const base = API_BASE.replace(/\/$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
};

export async function fetchProjectsByUser(userId, { signal } = {}) {
  const url = withBase(`/projects/all-user/${encodeURIComponent(userId)}`);

  const resp = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });

  if (resp.status === 204 || resp.status === 404) {
    try {
      const j = await resp.json();
      console.info("fetchProjectsByUser:", j?.detalle || "sin proyectos");
    } catch {}
    return [];
  }

  if (!resp.ok) {
    if (resp.status === 500) return [];
    let msg = `Error HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || j?.detalle || msg;
    } catch {
      try {
        const t = await resp.text();
        if (t) msg = t;
      } catch {}
    }
    throw new Error(msg);
  }

  const raw = await resp.json();

  return (Array.isArray(raw) ? raw : []).map((p) => ({
    id: p.idProject,
    name: p.project,
    description: p.description,
    createdAt: p.createdDate,
    owner: p.idOwnerUser?.userName,
    ownerEmail: p.idOwnerUser?.email,
    status: p.projectStatus,
    tasksCount: Number(p.tasksCount || 0),
    _raw: p,
  }));
}

export async function createProject(payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(withBase("/projects"), {
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

export async function assignUserToProject({ userId, projectId, roleId = 1 }) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const payload = {
    idUser: { idUser: Number(userId) },
    projects: { idProject: Number(projectId) },
    idRole: { idRole: Number(roleId) },
  };

  const resp = await fetch(withBase("/users-projects"), {
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
    } catch {}
    throw new Error(msg);
  }
  return resp.json().catch(() => ({}));
}

// --- GET /project/{id} ---
export async function fetchProjectById(projectId, { signal } = {}) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(
    withBase(`/projects/${encodeURIComponent(projectId)}`),
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || msg;
    } catch {
      try {
        msg = (await resp.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }

  return resp.json();
}

// --- PUT /project/{id} ---
export async function updateProject(projectId, payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  let userId = null;
  if (typeof window !== "undefined") {
    try {
      const raw =
        localStorage.getItem("simpleAuth.user") ??
        sessionStorage.getItem("simpleAuth.user");
      const parsed = raw ? JSON.parse(raw) : null;
      userId = parsed?.id ?? parsed?.idUser ?? parsed?.userId ?? null;
    } catch {}
  }

  const body = {
    idOwnerUser: { idUser: Number(userId) },
    project: payload.project,
    description: payload.description,
    createdDate: payload.createdDate,
    projectStatus: Boolean(payload.projectStatus),
  };

  const resp = await fetch(
    withBase(`/projects/${encodeURIComponent(projectId)}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || msg;
    } catch {
      try {
        msg = (await resp.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }

  return resp.json().catch(() => ({}));
}
// GET /users/project/{projectId}
export async function fetchUsersByProject(projectId, { signal } = {}) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(
    withBase(`/users/project/${encodeURIComponent(projectId)}`),
    {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    if (resp.status === 404) return [];
    const t = await resp.text().catch(() => "");
    throw new Error(t || `HTTP ${resp.status}`);
  }
  return resp.json();
}

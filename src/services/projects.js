// src/services/projects.js

// Preferimos usar un proxy /api (rewrites o route handlers) para evitar CORS.
// .env.local (recomendado):
// NEXT_PUBLIC_API_BASE=/api
//
// Si no usas proxy y quieres llamar directo al backend desde el navegador:
// NEXT_PUBLIC_API_URL=https://tu-backend.tu-dominio.com

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || // ej: "/api"
  process.env.NEXT_PUBLIC_API_URL || // ej: "https://backend.tu-dominio.com"
  "";

const withBase = (p) => {
  const base = API_BASE.replace(/\/$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
};

/**
 * GET /projects/all-user/{userId}
 * @param {string|number} userId
 * @param {{signal?: AbortSignal}} opts
 */
/**
 * GET /projects/all-user/{userId}
 * - 200: array de proyectos
 * - 204/404: sin proyectos -> []
 * - otros errores: throw Error(message)
 */
export async function fetchProjectsByUser(userId, { signal } = {}) {
  const url = withBase(`/projects/all-user/${encodeURIComponent(userId)}`);

  const resp = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });

  // 204 No Content o 404 Not Found => sin proyectos
  if (resp.status === 204 || resp.status === 404) {
    // (opcional) podrías loguear el mensaje del back
    try {
      const j = await resp.json(); // { detalle: "No se encontraron..." }
      console.info("fetchProjectsByUser:", j?.detalle || "sin proyectos");
    } catch {
      /* body vacío o no-JSON */
    }
    return [];
  }

  if (!resp.ok) {
    // 500 antiguamente lo tratabas como []
    if (resp.status === 500) return [];
    // otros: construimos un mensaje útil
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

// --- continúa en el mismo archivo donde tienes fetchProjectsByUser ---
export async function createProject(payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const resp = await fetch(withBase("/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // credentials: 'include', // <-- si tu backend usa cookies/JWT
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

// src/services/projects.js
export async function assignUserToProject({ userId, projectId, roleId = 1 }) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  const payload = {
    idUser: { idUser: Number(userId) },
    projects: { idProject: Number(projectId) },
    idRole: { idRole: Number(roleId) }, // 1 admin, 2 miembro
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
    } catch {
      /* ignore */
    }
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

  // Devuelve tal cual (tu back ya trae los campos del form)
  return resp.json();
}

// --- PUT /project/{id} --- (ajusta a tu EP si fuera /projects/{id})
export async function updateProject(projectId, payload) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
  const withBase = (p) =>
    `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

  // Obtener idUser desde localStorage/sessionStorage (igual que al crear)
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

  // Armar payload final para tu backend
  const body = {
    idOwnerUser: { idUser: Number(userId) }, // 👈 obligatorio
    project: payload.project,
    description: payload.description,
    createdDate: payload.createdDate, // en ISO string
    projectStatus: Boolean(payload.projectStatus),
  };

  const resp = await fetch(
    withBase(`/projects/${encodeURIComponent(projectId)}`),
    {
      method: "PATCH", // 👈 asegúrate que tu backend soporta PATCH; si no, usa PUT
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
    // Si tu back devuelve 404 cuando no hay usuarios, trata como []
    if (resp.status === 404) return [];
    const t = await resp.text().catch(() => "");
    throw new Error(t || `HTTP ${resp.status}`);
  }
  return resp.json(); // [{idUser,userName,email,...}]
}

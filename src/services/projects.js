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
export async function fetchProjectsByUser(userId, { signal } = {}) {
  const url = withBase(`/projects/all-user/${encodeURIComponent(userId)}`);

  const resp = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    // credentials: 'include', // <-- descomenta si tu backend usa cookies
    signal,
    cache: "no-store", // evita cache agresivo del fetch en Next
  });

  if (!resp.ok) {
    let msg = `Error HTTP ${resp.status}`;
    try {
      // intenta usar JSON { message } si tu API lo envía
      const j = await resp.json();
      msg = j?.message || msg;
    } catch {
      try {
        const t = await resp.text();
        if (t) msg = t;
      } catch {}
    }
    throw new Error(msg);
  }

  const raw = await resp.json();

  // 🔑 Mapeamos el response del backend a un modelo amigable (igual que tenías)
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

export async function assignUserToProject({ userId, projectId, roleId = 1 }) {
  const payload = {
    idUser: { idUser: Number(userId) },
    projects: { idProject: Number(projectId) },
    idRole: { idRole: Number(roleId) }, // 1 = Administrador
  };

  const resp = await fetch(withBase("/users-projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("ASSIGN FAIL", {
      url: withBase("/user-projects"),
      status: resp.status,
      payload,
      body: text,
    });
    // intenta parsear un message
    let msg = `HTTP ${resp.status}`;
    try {
      msg = JSON.parse(text)?.message || JSON.parse(text)?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return resp.json().catch(() => ({}));
}

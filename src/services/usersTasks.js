const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
const withBase = (p) =>
  `${API_BASE.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;

export async function assignUserToTask({ userId, taskId }) {
  if (!userId || !taskId) return {};

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

export async function unassignUserFromTask(taskId) {
  if (!taskId) return {};

  const resp = await fetch(
    withBase(`/users-tasks/${encodeURIComponent(taskId)}`),
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (!resp.ok && resp.status !== 204 && resp.status !== 404) {
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
  return {};
}

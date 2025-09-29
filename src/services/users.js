const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";

const withBase = (p) => {
  const base = API_BASE.replace(/\/$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
};

export async function registerUser({
  userName,
  email,
  password,
  userStatus = 1,
}) {
  const url = withBase("/users");

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ userName, email, password, userStatus }),
  });

  if (!resp.ok) {
    let msg = `Error HTTP ${resp.status}`;
    try {
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

  try {
    return await resp.json();
  } catch {
    return true;
  }
}

export async function fetchAllUsers({ signal } = {}) {
  const resp = await fetch(withBase("/users/all"), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = await resp.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return resp.json();
}

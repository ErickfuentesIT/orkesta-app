// src/services/users.js

// Usa proxy /api (rewrites) o una URL pública
// En .env.local puedes definir:
// NEXT_PUBLIC_API_BASE=/api          (recomendado con rewrites a Spring)
// o NEXT_PUBLIC_API_URL=http://localhost:8080
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
    // Si usas cookies/JWT en el backend, agrega:
    // credentials: 'include',
    body: JSON.stringify({ userName, email, password, userStatus }),
  });

  if (!resp.ok) {
    // intenta extraer mensaje del backend
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

  // devuelve el usuario creado (ajusta si tu API devuelve otra forma)
  try {
    return await resp.json();
  } catch {
    // por si el backend no devuelve JSON
    return true;
  }
}

// src/app/app/components/common/Sidebar.jsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Íconos (SVG inline, livianos) */
const Icon = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3Z" />
    </svg>
  ),
  projects: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z"
      />
    </svg>
  ),
  folder: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M10 4l2 2h8a2 2 0 012 2v1H2V6a2 2 0 012-2h6Zm12 6v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8h20Z"
      />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7Zm9-3.5l2-1-1-3-2 .8a7.9 7.9 0 00-1.7-1l.2-2.1-3-1-1 2a8.2 8.2 0 00-2 0l-1-2-3 1 .2 2.1a7.9 7.9 0 00-1.7 1l-2-.8-1 3 2 1a7.6 7.6 0 000 2l-2 1 1 3 2-.8a7.9 7.9 0 001.7 1L7 21l3 1 1-2a8.2 8.2 0 002 0l1 2 3-1-.2-2.1a7.9 7.9 0 001.7-1l2 .8 1-3-2-1a7.6 7.6 0 000-2Z"
      />
    </svg>
  ),
  external: (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
      />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M10 18a8 8 0 116.3-3.1l4.4 4.4-1.4 1.4-4.4-4.4A8 8 0 0110 18Zm0-2a6 6 0 100-12 6 6 0 000 12Z"
      />
    </svg>
  ),
  dot: <span className="sb-dot" aria-hidden />,
};

export default function Sidebar({
  projects = [],
  activeId = null,
  onSelect = () => {},
  onLogout = () => {},
  user, // opcional: { name, email, avatarUrl, status: 'online'|'away' }
}) {
  const router = useRouter();
  const [openProj, setOpenProj] = useState(true);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return projects;
    return projects.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [projects, q]);

  return (
    <aside className="sb2">
      {/* Brand */}
      <div className="sb2__brand">
        <div className="sb2__logo" aria-hidden />
        <div className="sb2__title">Orkesta</div>
      </div>

      {/* Search */}
      <div className="sb2__search">
        <span className="sb2__searchIcon">{Icon.search}</span>
        <input
          className="sb2__searchInput"
          placeholder="Buscar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <kbd className="sb2__kbd">⌘K</kbd>
      </div>

      <nav className="sb2__nav">
        <Link href="/app/dashboard" className="sb2__item">
          <span className="sb2__icon">{Icon.home}</span>
          <span className="sb2__label">Home</span>
        </Link>

        {/* Projects (collapsible) */}
        <div className="sb2__section">
          <button className="sb2__item" onClick={() => setOpenProj((v) => !v)}>
            <span className="sb2__icon">{Icon.projects}</span>
            <span className="sb2__label">Projects</span>
            <span className={`sb2__chev ${openProj ? "is-open" : ""}`}>▾</span>
          </button>

          {openProj && (
            <ul className="sb2__list">
              {filtered.length === 0 && (
                <li className="sb2__empty">Sin proyectos</li>
              )}
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    className={`sb2__subitem ${
                      Number(activeId) === Number(p.id) ? "is-active" : ""
                    }`}
                    title={p.name}
                    onClick={() => onSelect(p.id)}
                  >
                    {Icon.dot}
                    <span className="sb2__subLabel">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <hr className="sb2__divider" />

        <button
          className="sb2__item"
          onClick={() => router.push("/app/settings")}
        >
          <span className="sb2__icon">{Icon.settings}</span>
          <span className="sb2__label">Settings</span>
        </button>

        <a
          className="sb2__item"
          href="https://example.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="sb2__icon">{Icon.external}</span>
          <span className="sb2__label">Open in browser</span>
        </a>
      </nav>

      {/* Footer user card */}
      <div className="sb2__footer">
        <div className="sb2__user">
          <div className="sb2__avatar">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" />
            ) : (
              <span className="sb2__avatarFallback">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
            {user?.status === "online" && <span className="sb2__online" />}
          </div>
          <div className="sb2__userInfo">
            <div className="sb2__userName">{user?.name || "Invitado"}</div>
            <div className="sb2__userEmail">{user?.email || "—"}</div>
          </div>
          <button
            className="sb2__logoutBtn"
            title="Cerrar sesión"
            onClick={onLogout}
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}

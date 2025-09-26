// Sidebar.jsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar({
  projects = [],
  activeId = null,
  onSelect = () => {},
  onLogout = () => {},
}) {
  const [open, setOpen] = useState(true); // abre/cierra "Proyectos"
  const router = useRouter();
  return (
    <aside className="sb">
      <nav className="sb__nav">
        <span>Orkesta</span>
        {/* Panel */}
        <button
          className="sb__item"
          onClick={() => router.push("/app/dashboard")}
        >
          <span className="sb__icon">🏠</span>
          <span className="sb__label">Panel</span>
        </button>

        {/* Proyectos */}
        <div className="sb__group">
          <button className="sb__item" onClick={() => setOpen((v) => !v)}>
            <span className="sb__icon">📎</span>
            <span className="sb__label">Proyectos</span>
            <span className={`sb__chev ${open ? "is-open" : ""}`} aria-hidden>
              ▾
            </span>
          </button>

          {open && (
            <ul className="sb__list">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    className={`sb__subitem ${
                      activeId === p.id ? "is-active" : ""
                    }`}
                    onClick={() => onSelect(p.id)}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      <button className="sb__logout" onClick={onLogout}>
        <span className="sb__icon">⎋</span>
        <span className="sb__label">Cerrar sesión</span>
      </button>
    </aside>
  );
}

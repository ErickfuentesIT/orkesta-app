"use client";

export default function TaskCard({ task, onEdit }) {
  const { id, title, description, done, startAt, endAt, statusText } = task;
  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <section className="card" style={{ position: "relative" }}>
      <button
        aria-label="Editar tarea"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit?.(id);
        }}
        style={{
          position: "absolute",
          top: 10,
          right: 14,
          display: "flex",
          gap: 4,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "#ff3b3b",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "#ff3b3b",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "#ff3b3b",
          }}
        />
      </button>

      <article className="content">
        <h2 style={{ marginBottom: 6 }}>{title}</h2>
        {description && (
          <p className="muted" style={{ marginBottom: 8 }}>
            {description}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
          <span>
            Estado: <b>{done ? "Completada" : "Abierta"}</b>
            {statusText ? ` (${statusText})` : ""}
          </span>
          <span>Inicio: {fmt(startAt)}</span>
          <span>Fin: {fmt(endAt)}</span>
        </div>
      </article>
    </section>
  );
}

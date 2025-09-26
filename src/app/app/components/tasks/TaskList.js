"use client";
import { useMemo, useState } from "react";
import TaskCard from "./TaskCard";

export default function TaskList({ tasks = [], onEdit }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const byText = (t) =>
      (t.title ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(q.toLowerCase());

    const byStatus = (t) =>
      filter === "all" ? true : filter === "done" ? t.done : !t.done;

    return tasks.filter((t) => byText(t) && byStatus(t));
  }, [tasks, q, filter]);

  return (
    <section className="admin">
      <header
        className="admin__head"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 className="admin__title">Tareas del proyecto</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="open">Abiertas</option>
            <option value="done">Completadas</option>
          </select>
        </div>
      </header>

      <div className="admin__box">
        {filtered.length ? (
          <div className="grid">
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <div className="empty">No hay tareas que coincidan.</div>
        )}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import Button from "../ui/Button";
import ProjectCard from "../projects/ProjectCard";
import StaggerInput from "../ui/StaggerInput";
import { Link } from "react-router-dom";

export default function ProjectsGrid({
  projects = [],
  onAdd,
  onEdit,
  title = "Panel Administrativo > Tus Proyectos",
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.owner ?? "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  function handleQuery(sQuery) {
    setQuery(sQuery);
  }

  return (
    <section className="admin">
      <header className="admin__head">
        <h1 className="admin__title">{title}</h1>
        <div className="admin__tools">
          <StaggerInput
            id="buscar"
            text="Buscar"
            delay={50}
            onChange={handleQuery}
          />
          <Button className="btn-sweep" onClick={onAdd}>
            + Agregar Proyecto
          </Button>
        </div>
      </header>

      <div className="admin__box">
        {filtered.length ? (
          <div className="grid">
            {filtered.map((p) => (
              <Link
                to={`/app/projects/${p.id}`}
                className="card-link"
                key={p.id}
              >
                <ProjectCard project={p} onEdit={onEdit} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            No se encontraron proyectos para “{query}”.
          </div>
        )}
      </div>
    </section>
  );
}

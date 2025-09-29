export default function ProjectCard({ project, onEdit }) {
  const { name, id } = project;

  return (
    <section className="card" style={{ position: "relative" }}>
      <button
        aria-label="Editar proyecto"
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
          zIndex: 2,
          padding: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "white",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "white",
          }}
        />
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "white",
          }}
        />
      </button>

      <article className="content">
        <h1>{name}</h1>
      </article>
    </section>
  );
}

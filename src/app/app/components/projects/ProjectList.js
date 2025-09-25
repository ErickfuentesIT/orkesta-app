import ProjectsGrid from "./ProjectGrids";

export default function ProjectList({ projects, onClick }) {
  return (
    <div className="project-ly">
      <ProjectsGrid
        projects={projects}
        onAdd={onClick}
        onEdit={(p) => alert("Visualizar: " + p.name)}
      />
    </div>
  );
}

import Button from "../ui/Button";
import ProjectsGrid from "./ProjectsGrids";

export default function ProjectList({ projects }) {
  return (
    <div className="project-ly">
      <ProjectsGrid
        projects={projects}
        onAdd={() => alert("Agregar proyecto")}
        onEdit={(p) => alert("Visualizar: " + p.name)}
      />
    </div>
  );
}

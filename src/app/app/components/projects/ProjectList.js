import ProjectsGrid from "./ProjectGrids";

export default function ProjectList({ projects, onClick, onEdit }) {
  return (
    <div className="project-ly">
      <ProjectsGrid projects={projects} onAdd={onClick} onEdit={onEdit} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import SideBar from "../../components/common/SideBar";
import ProjectList from "../../components/projects/ProjectList";
import AddProjectForm from "../../components/projects/AddProjectForm";
import { useProjects } from "@/services/useProjects";
import { useAuth } from "@/services/useAuth";

export default function DashboardPage() {
  const [isProject, setIsProject] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { projects, loading, error, refetch } = useProjects();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/app/login");
  };

  return (
    <div className="layout">
      <div className="content-ly">
        <SideBar
          projects={projects}
          activeId={projects?.[0]?.id}
          onSelect={(pid) => {
            if (pid === "panel") router.push("/app/dashboard");
            else router.push(`/app/projects/${pid}`);
          }}
          onLogout={handleLogout}
          onToggleView={() => setIsProject((v) => !v)}
        />

        <div style={{ flex: 1, padding: 16 }}>
          {loading && <div className="p-4">Cargando proyectos...</div>}
          {error && (
            <div className="p-4 text-red-600">Error: {String(error)}</div>
          )}
          {!loading && !error && isProject && (
            <ProjectList projects={projects} onClick={setShowForm} />
          )}
        </div>
      </div>

      {/* Overlay con el formulario */}
      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div
            className="overlay-content"
            onClick={(e) => e.stopPropagation()} // evita cerrar al dar click dentro
          >
            <h2 style={{ marginBottom: "1rem" }}>Crear nuevo proyecto</h2>
            <AddProjectForm
              onCreated={(created) => {
                refetch(); // vuelve a pedir /projects/all-user/:id
                setShowForm(false); // cierra overlay
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

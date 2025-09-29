"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProjectById } from "@/services/projects";
import SideBar from "../../components/common/SideBar";
import ProjectList from "../../components/projects/ProjectList";
import AddProjectForm from "../../components/projects/AddProjectForm";
import { useProjects } from "@/services/useProjects";
import { useAuth } from "@/services/useAuth";

export default function DashboardPage() {
  const [isProject, setIsProject] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const { projects, loading, error, refetch } = useProjects();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/app/login");
  };

  async function handleEdit(projectId) {
    try {
      const data = await fetchProjectById(projectId);
      setEditData(data);
      setShowForm(true);
    } catch (e) {
      console.error("fetchProjectById error", e);
    }
  }

  return (
    <div className="layout">
      <div className="content-ly">
        <SideBar
          projects={projects}
          activeId={projects?.[0]?.id}
          onSelect={(id) => router.push(`/app/projects/${id}`)}
          onLogout={handleLogout}
          currentUser={{
            name: "Olivia Rhye",
            email: "olivia@untitledui.com",
            status: "online",
          }}
        />

        <div style={{ flex: 1, padding: 16 }}>
          {loading && <div className="p-4">Cargando proyectos...</div>}
          {error && (
            <div className="p-4 text-red-600">Error: {String(error)}</div>
          )}
          {!loading && !error && isProject && (
            <ProjectList
              projects={projects}
              onClick={setShowForm}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>

      {showForm && (
        <div
          className="overlay"
          onClick={() => {
            setShowForm(false);
            setEditData(null);
          }}
        >
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 12 }}>
              {editData ? "Editar proyecto" : "Crear proyecto"}
            </h2>

            <AddProjectForm
              mode={editData ? "edit" : "create"}
              initial={editData || undefined}
              onUpdated={() => {
                refetch();
                setShowForm(false);
                setEditData(null);
              }}
              onCreated={() => {
                refetch();
                setShowForm(false);
                setEditData(null);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditData(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

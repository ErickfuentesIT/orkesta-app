"use client";
import React from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/app/app/components/common/SideBar";
import TaskList from "@/app/app/components/tasks/TaskList";
import { useTasks } from "@/services/useTasks";

export default function ProjectTaskPage({ params }) {
  const { id } = React.use(params); // Next 15: unwrap
  const router = useRouter();
  const { tasks, loading, error, refetch } = useTasks(id);

  const handleSelect = (pid) => router.push(`/app/projects/${pid}`);
  const handleLogout = () => router.replace("/app/login");
  const handleEditTask = (taskId) => {
    // abrir modal de edición (cuando lo agregues)
    console.log("editar tarea", taskId);
  };

  return (
    <div className="layout">
      <div className="content-ly">
        <SideBar
          activeId={Number(id)}
          onSelect={handleSelect}
          onLogout={handleLogout}
        />
        <div style={{ flex: 1, padding: 16 }}>
          {loading && <div className="p-4">Cargando tareas…</div>}
          {error && (
            <div className="p-4 text-red-600">Error: {String(error)}</div>
          )}
          {!loading && !error && (
            <TaskList tasks={tasks} onEdit={handleEditTask} />
          )}
        </div>
      </div>
    </div>
  );
}

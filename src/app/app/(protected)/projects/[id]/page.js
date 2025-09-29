"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/app/app/components/common/SideBar";
import TaskBoard from "@/app/app/components/tasks/TaskBoard";
import AddTaskForm from "@/app/app/components/tasks/AddTaskForm";
import { useTasks } from "@/services/useTasks";
import { fetchTaskById } from "@/services/tasks";

function mapTaskFromApi(t) {
  if (!t) return null;
  return {
    id: t.tasks ?? t.id ?? t._raw?.tasks ?? Date.now(),
    title: t.name ?? t.title ?? "",
    description: t.description ?? "",
    statusId: (t.status?.idStatus ?? Number(t.statusId ?? 1)) || 1,
    statusText: t.status?.status ?? String(t.statusId ?? "1"),
    startAt: t.plannedStartDate ?? t.startAt ?? null,
    endAt: t.plannedEndDate ?? t.endAt ?? null,
    _raw: t,
  };
}

export default function ProjectTaskPage({ params }) {
  const { id } = React.use(params);
  const router = useRouter();

  const { tasks, loading, error, refetch, setTasks } = useTasks(id);

  const [showCreate, setShowCreate] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [initialTask, setInitialTask] = React.useState(null);

  const handleSelect = (pid) => router.push(`/app/projects/${pid}`);
  const handleLogout = () => router.replace("/app/login");

  const openCreate = () => {
    setInitialTask(null);
    setShowCreate(true);
  };

  const openEdit = async (taskId) => {
    try {
      const fresh = await fetchTaskById(taskId);
      setInitialTask(fresh);
      setShowEdit(true);
    } catch (e) {
      console.error("fetchTaskById error", e);
    }
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
          <header
            className="admin__head"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 className="admin__title">Tareas del proyecto</h1>
            <button className="btn-sweep" onClick={openCreate}>
              + Nueva Tarea
            </button>
          </header>

          {loading && <div className="p-4">Cargando tareas…</div>}
          {error && (
            <div className="p-4 text-red-600">Error: {String(error)}</div>
          )}

          {!loading && !error && <TaskBoard tasks={tasks} onEdit={openEdit} />}
        </div>
      </div>

      {/* Overlay: crear */}
      {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 12 }}>Nueva tarea</h2>
            <AddTaskForm
              projectId={id}
              mode="create"
              initial={null}
              onCreated={(created) => {
                const mapped = mapTaskFromApi(created);
                setTasks?.((prev) => {
                  const next = Array.isArray(prev) ? [...prev] : [];
                  if (mapped) next.push(mapped);
                  return next;
                });
                refetch?.();
                setShowCreate(false);
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      {/* Overlay: editar */}
      {showEdit && (
        <div
          className="overlay"
          onClick={() => {
            setShowEdit(false);
            setInitialTask(null);
          }}
        >
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 12 }}>Editar tarea</h2>
            <AddTaskForm
              projectId={id}
              mode="edit"
              initial={initialTask}
              onUpdated={() => {
                refetch?.();
                setShowEdit(false);
                setInitialTask(null);
              }}
              onCancel={() => {
                setShowEdit(false);
                setInitialTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { createTask, updateTask } from "@/services/tasks";
import { fetchUsersByProject } from "@/services/projects";
import { assignUserToTask, unassignUserFromTask } from "@/services/usersTasks";

const STATUS_OPTIONS = [
  { id: 1, label: "Pendiente" },
  { id: 2, label: "Haciendo" },
  { id: 3, label: "Terminado" },
];

export default function AddTaskForm({
  projectId,
  mode = "create",
  initial,
  onCreated,
  onUpdated,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      plannedStartDate: "",
      plannedEndDate: "",
      statusId: 1,
      assignedUserId: "", // vacío = sin asignar
    },
  });

  const [submitError, setSubmitError] = useState(null);
  const [users, setUsers] = useState([]);
  const inFlight = useRef(false);

  const effectiveProjectId = useMemo(() => {
    const fromInitial =
      initial?.projectId ?? initial?._raw?.idProjects?.idProject ?? null;
    return Number(fromInitial ?? projectId ?? 0) || null;
  }, [initial, projectId]);

  useEffect(() => {
    if (!effectiveProjectId) return;
    const ac = new AbortController();
    (async () => {
      try {
        const list = await fetchUsersByProject(effectiveProjectId, {
          signal: ac.signal,
        });
        setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    })();
    return () => ac.abort();
  }, [effectiveProjectId]);

  useEffect(() => {
    if (mode !== "edit" || !initial) return;
    const preAssigned =
      initial?.assignedUserId ?? initial?._raw?.assigment?.idUser?.idUser ?? "";

    reset({
      name: initial.title ?? initial.name ?? "",
      description: initial.description ?? "",
      plannedStartDate: initial.startAt
        ? new Date(initial.startAt).toISOString().slice(0, 16)
        : "",
      plannedEndDate: initial.endAt
        ? new Date(initial.endAt).toISOString().slice(0, 16)
        : "",
      statusId: Number(initial.statusId ?? initial?.status?.idStatus ?? 1) || 1,
      assignedUserId: preAssigned || "",
    });
  }, [mode, initial, reset]);

  const onSubmit = async (values) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitError(null);

    const payloadCommon = {
      projectId: effectiveProjectId,
      name: values.name.trim(),
      description: values.description.trim(),
      statusId: Number(values.statusId),
      plannedStartDate: values.plannedStartDate
        ? new Date(values.plannedStartDate).toISOString()
        : null,
      plannedEndDate: values.plannedEndDate
        ? new Date(values.plannedEndDate).toISOString()
        : null,
    };

    const nextAssignee =
      values.assignedUserId === "" ? null : Number(values.assignedUserId);

    try {
      if (mode === "edit") {
        const taskId = initial?.id ?? initial?._raw?.tasks ?? initial?.tasks;
        if (!taskId) throw new Error("Falta taskId para editar.");

        const updated = await updateTask(taskId, payloadCommon);

        const prevAssignee =
          initial?.assignedUserId ??
          initial?._raw?.assigment?.idUser?.idUser ??
          null;

        if (prevAssignee === nextAssignee) {
          // no-ops
        } else if (prevAssignee && !nextAssignee) {
          await unassignUserFromTask(taskId);
        } else if (!prevAssignee && nextAssignee) {
          await assignUserToTask({ taskId, userId: nextAssignee });
        } else if (
          prevAssignee &&
          nextAssignee &&
          prevAssignee !== nextAssignee
        ) {
          await unassignUserFromTask(taskId);
          await assignUserToTask({ taskId, userId: nextAssignee });
        }

        onUpdated?.(updated);
        return;
      }

      // CREAR
      if (!projectId) throw new Error("Falta projectId para crear la tarea.");
      const created = await createTask({
        idProjects: { idProject: Number(projectId) },
        name: payloadCommon.name,
        status: { idStatus: payloadCommon.statusId },
        description: payloadCommon.description,
        plannedStartDate: payloadCommon.plannedStartDate,
        plannedEndDate: payloadCommon.plannedEndDate,
      });

      const newTaskId = created?.tasks ?? created?.id ?? null;
      if (newTaskId && nextAssignee) {
        await assignUserToTask({ taskId: newTaskId, userId: nextAssignee });
      }

      onCreated?.(created);
      reset();
    } catch (e) {
      setSubmitError(e.message || "No se pudo guardar la tarea");
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      {/* Título opcional si lo pones dentro del modal */}
      {/* <h3 className="grid-column-2">Nueva tarea</h3> */}

      <label className="muted" htmlFor="name">
        Nombre
      </label>
      <input
        id="name"
        type="text"
        placeholder="Nombre de la tarea"
        {...register("name", { required: "Ingresa un nombre" })}
      />
      {errors.name && (
        <small className="grid-column-2">{errors.name.message}</small>
      )}

      <label className="muted" htmlFor="description">
        Descripción
      </label>
      <input
        id="description"
        type="text"
        placeholder="Breve descripción"
        {...register("description", { required: "Ingresa una descripción" })}
      />
      {errors.description && (
        <small className="grid-column-2">{errors.description.message}</small>
      )}

      <label className="muted" htmlFor="plannedStartDate">
        Inicio
      </label>
      <input
        id="plannedStartDate"
        type="datetime-local"
        {...register("plannedStartDate")}
      />

      <label className="muted" htmlFor="plannedEndDate">
        Fin
      </label>
      <input
        id="plannedEndDate"
        type="datetime-local"
        {...register("plannedEndDate")}
      />

      <label className="muted" htmlFor="statusId">
        Estado
      </label>
      <select id="statusId" {...register("statusId", { required: true })}>
        {STATUS_OPTIONS.map((op) => (
          <option key={op.id} value={op.id}>
            {op.label}
          </option>
        ))}
      </select>

      <label className="muted" htmlFor="assignedUserId">
        Asignar a
      </label>
      <select id="assignedUserId" {...register("assignedUserId")}>
        <option value="">— Sin asignar —</option>
        {users.map((u) => (
          <option key={u.idUser} value={u.idUser}>
            {u.userName} — {u.email}
          </option>
        ))}
      </select>

      <div
        className="grid-column-2"
        style={{ display: "flex", gap: 12, marginTop: 12 }}
      >
        <button className="btn-sweep" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "edit"
            ? "Guardar cambios"
            : "Crear tarea"}
        </button>
        {onCancel && (
          <button type="button" className="btn-sweep" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>

      {submitError && (
        <section
          className="form-validations grid-column-2"
          style={{ marginTop: 12 }}
        >
          <small>{submitError}</small>
        </section>
      )}
    </form>
  );
}

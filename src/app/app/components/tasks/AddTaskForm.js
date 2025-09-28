"use client";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { createTask } from "@/services/tasks";
import { updateTask } from "@/services/tasks";

const STATUS_OPTIONS = [
  { id: 1, label: "Pendiente" },
  { id: 2, label: "Haciendo" },
  { id: 3, label: "Terminado" },
];

/**
 * Props:
 * - projectId (requerido para crear; para editar, sirve como fallback si initial no trae projectId)
 * - mode: 'create' | 'edit'
 * - initial: response crudo de /tasks/{taskId} (opcional en edit)
 * - onCreated?: (created) => void
 * - onUpdated?: (updated) => void
 * - onCancel?: () => void
 */
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
    },
  });

  const [submitError, setSubmitError] = useState(null);

  // projectId para payload de edición (si initial lo trae, usamos ese)
  const effectiveProjectId = useMemo(() => {
    // intenta leer del initial (según tus campos)
    const fromInitial =
      initial?.idProjects?.idProject ??
      initial?._raw?.idProjects?.idProject ??
      null;
    return Number(fromInitial ?? projectId ?? 0) || null;
  }, [initial, projectId]);

  // Prellenar en modo edición
  useEffect(() => {
    if (mode !== "edit" || !initial) return;
    reset({
      name: initial.name ?? "",
      description: initial.description ?? "",
      plannedStartDate: initial.plannedStartDate
        ? new Date(initial.plannedStartDate).toISOString().slice(0, 16)
        : "",
      plannedEndDate: initial.plannedEndDate
        ? new Date(initial.plannedEndDate).toISOString().slice(0, 16)
        : "",
      statusId:
        Number(initial?.status?.idStatus ?? initial?.statusId ?? 1) || 1,
    });
  }, [mode, initial, reset]);

  const onSubmit = async (values) => {
    setSubmitError(null);

    // payload común
    const payload = {
      idProjects: { idProject: Number(effectiveProjectId) },
      name: values.name.trim(),
      status: { idStatus: Number(values.statusId) },
      description: values.description.trim(),
      plannedStartDate: values.plannedStartDate
        ? new Date(values.plannedStartDate).toISOString()
        : null,
      plannedEndDate: values.plannedEndDate
        ? new Date(values.plannedEndDate).toISOString()
        : null,
    };

    try {
      if (mode === "edit") {
        const taskId =
          initial?.tasks ?? initial?.id ?? initial?._raw?.tasks ?? null;
        if (!taskId) throw new Error("Falta taskId para editar.");
        const updated = await updateTask(taskId, payload);
        onUpdated?.(updated);
        return;
      }

      // create
      if (!projectId) throw new Error("Falta projectId para crear la tarea.");
      const created = await createTask(payload);
      onCreated?.(created);
      reset();
    } catch (e) {
      setSubmitError(e.message || "No se pudo guardar la tarea");
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="muted" htmlFor="name">
        Nombre
      </label>
      <input
        id="name"
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
        placeholder="Descripción breve"
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

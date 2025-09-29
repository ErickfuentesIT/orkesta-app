"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { createTask, updateTask, fetchTaskById } from "@/services/tasks";
import { fetchUsersByProject } from "@/services/projects";
import { assignUserToTask, unassignUserFromTask } from "@/services/usersTasks";

const STATUS_OPTIONS = [
  { id: 1, label: "Pendiente" },
  { id: 2, label: "Haciendo" },
  { id: 3, label: "Terminado" },
];

function toDatetimeLocalInput(isoOrDate) {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function extractAssignee(initial) {
  if (!initial) return { id: null, name: null };

  if (initial.assignedUserId) {
    return {
      id: Number(initial.assignedUserId),
      name: initial.assignedUserName ?? null,
    };
  }

  const a = initial._raw?.assigment ?? null;
  if (!a) return { id: null, name: null };

  if (a.idUser && typeof a.idUser === "object") {
    return {
      id: a.idUser.idUser ?? null,
      name: a.idUser.userName ?? a.idUser.email ?? null,
    };
  }
  if (typeof a.idUser === "number") return { id: a.idUser, name: null };
  if (typeof a.idUserId === "number") return { id: a.idUserId, name: null };
  if (a.user && typeof a.user === "object") {
    return { id: a.user.idUser ?? null, name: a.user.userName ?? null };
  }
  return { id: null, name: null };
}

export default function AddTaskForm({
  projectId,
  mode = "create",
  initial,
  onCreated,
  onUpdated,
  onCancel,
  taskId: taskIdProp,
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      plannedStartDate: "",
      plannedEndDate: "",
      statusId: 1,
      assignedUserId: "",
    },
  });

  const effectiveTaskId = useMemo(() => {
    return (
      taskIdProp ??
      initial?.id ??
      initial?._raw?.tasks ??
      initial?.tasks ??
      null
    );
  }, [taskIdProp, initial]);

  const [submitError, setSubmitError] = useState(null);
  const [users, setUsers] = useState([]);
  const inFlight = useRef(false);

  const effectiveProjectId = useMemo(() => {
    const fromInitial =
      initial?.projectId ?? initial?._raw?.idProjects?.idProject ?? null;
    return Number(fromInitial ?? projectId ?? 0) || null;
  }, [initial, projectId]);

  const { id: preAssignedIdRaw, name: preAssignedName } = extractAssignee(
    initial || {}
  );
  const preAssignedIdStr =
    preAssignedIdRaw != null ? String(preAssignedIdRaw) : "";

  const isEditAssigned = mode === "edit" && preAssignedIdStr !== "";
  const assignedUserId = watch("assignedUserId") ?? "";

  useEffect(() => {
    if (!effectiveProjectId || isEditAssigned) return;
    const ac = new AbortController();
    (async () => {
      try {
        const list = await fetchUsersByProject(effectiveProjectId, {
          signal: ac.signal,
        });
        setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.warn("fetchUsersByProject error:", e);
      }
    })();
    return () => ac.abort();
  }, [effectiveProjectId, isEditAssigned]);

  useEffect(() => {
    if (mode !== "edit") return;

    const ac = new AbortController();

    (async () => {
      try {
        const t =
          initial ??
          (effectiveTaskId
            ? await fetchTaskById(effectiveTaskId, { signal: ac.signal })
            : null);
        if (!t) return;

        const name = t?.name ?? t?._raw?.name ?? t?.taskName ?? "";
        const description = t?.description ?? t?._raw?.description ?? "";
        const statusId =
          t?.status?.idStatus ?? t?.statusId ?? t?._raw?.status?.idStatus ?? 1;

        const plannedStartDate = toDatetimeLocalInput(
          t?.plannedStartDate ?? t?._raw?.plannedStartDate ?? null
        );
        const plannedEndDate = toDatetimeLocalInput(
          t?.plannedEndDate ?? t?._raw?.plannedEndDate ?? null
        );

        const { id: assigneeId } = extractAssignee({ _raw: t, ...t });

        reset({
          name,
          description,
          statusId,
          plannedStartDate,
          plannedEndDate,
          assignedUserId: assigneeId != null ? String(assigneeId) : "",
        });

        if (assigneeId != null) {
          setValue("assignedUserId", String(assigneeId), {
            shouldDirty: false,
          });
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.warn("No se pudo cargar la tarea:", e);
      }
    })();

    return () => ac.abort();
  }, [mode, effectiveTaskId, initial, reset, setValue]);

  useEffect(() => {
    if (mode !== "edit") return;
    if (preAssignedIdStr && assignedUserId === "") {
      setValue("assignedUserId", preAssignedIdStr, { shouldDirty: false });
    }
  }, [mode, preAssignedIdStr, assignedUserId, setValue]);

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
        const taskId =
          effectiveTaskId ??
          initial?.id ??
          initial?._raw?.tasks ??
          initial?.tasks;
        if (!taskId) throw new Error("Falta taskId para editar.");

        const updated = await updateTask(taskId, payloadCommon);

        try {
          await unassignUserFromTask(taskId);
        } catch (e) {
          if (!String(e?.message || "").includes("404")) {
            console.warn("unassignUserFromTask warning:", e);
          }
        }

        if (nextAssignee) {
          await assignUserToTask({ taskId, userId: nextAssignee });
        }

        onUpdated?.(updated);
        return;
      }

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

  const currentAssigneeValue =
    (assignedUserId ?? "") !== "" ? assignedUserId : preAssignedIdStr;
  const lockOnAssigned = Boolean(preAssignedIdStr);

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
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

      <select
        id="assignedUserId"
        value={currentAssigneeValue}
        onChange={(e) => setValue("assignedUserId", e.target.value)}
        disabled={lockOnAssigned}
        {...register("assignedUserId")}
      >
        {!preAssignedIdStr && <option value="">— Sin asignar —</option>}

        {preAssignedIdStr && (
          <option value={preAssignedIdStr}>
            {preAssignedName ? preAssignedName : `Usuario #${preAssignedIdStr}`}
          </option>
        )}

        {users
          .filter((u) => String(u.idUser) !== preAssignedIdStr)
          .map((u) => (
            <option key={u.idUser} value={String(u.idUser)}>
              {u.userName} — {u.email}
            </option>
          ))}
      </select>

      {preAssignedIdStr && (
        <small className="muted" style={{ marginTop: 6 }}>
          Asignada a {preAssignedName ?? `Usuario #${preAssignedIdStr}`}
        </small>
      )}

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

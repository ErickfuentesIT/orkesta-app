"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createProject,
  assignUserToProject,
  updateProject,
} from "@/services/projects";
import { fetchAllUsers } from "@/services/users";

function getStoredUserId() {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem("simpleAuth.user") ??
      sessionStorage.getItem("simpleAuth.user");
    const u = raw ? JSON.parse(raw) : null;
    return u?.id ?? u?.idUser ?? u?.userId ?? null;
  } catch {
    return null;
  }
}

export default function AddProjectForm({
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
      project: "",
      description: "",
      createdDate: new Date().toISOString().slice(0, 16),
      projectStatus: true,
    },
  });

  const [submitError, setSubmitError] = useState(null);

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (!initial) return;
    reset({
      project: initial.project ?? "",
      description: initial.description ?? "",
      createdDate: initial.createdDate
        ? new Date(initial.createdDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      projectStatus: Boolean(initial.projectStatus),
    });
  }, [initial, reset]);

  useEffect(() => {
    if (mode !== "edit") return;
    const ac = new AbortController();
    fetchAllUsers({ signal: ac.signal })
      .then(setUsers)
      .catch((e) => console.error("fetchAllUsers error", e));
    return () => ac.abort();
  }, [mode]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.userName ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  function toggleUser(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const onSubmit = async (values) => {
    setSubmitError(null);
    const isoDate = values.createdDate
      ? new Date(values.createdDate).toISOString()
      : new Date().toISOString();

    if (mode === "edit") {
      if (!initial?.idProject) {
        setSubmitError("Falta idProject para editar.");
        return;
      }
      const updatePayload = {
        project: values.project.trim(),
        description: values.description.trim(),
        createdDate: isoDate,
        projectStatus: Boolean(values.projectStatus),
      };

      try {
        const updated = await updateProject(initial.idProject, updatePayload);

        const assignPromises = Array.from(selectedIds).map((uid) =>
          assignUserToProject({
            userId: uid,
            projectId: initial.idProject,
            roleId: 2,
          })
        );
        if (assignPromises.length) {
          await Promise.allSettled(assignPromises);
        }

        onUpdated?.(updated);
      } catch (e) {
        setSubmitError(e.message || "No se pudo actualizar/asignar miembros");
      }
      return;
    }

    const ownerId = getStoredUserId();
    if (!ownerId) {
      setSubmitError("No se encontró el usuario en el almacenamiento.");
      return;
    }
    const createPayload = {
      idOwnerUser: { idUser: Number(ownerId) },
      project: values.project.trim(),
      description: values.description.trim(),
      createdDate: isoDate,
      projectStatus: Boolean(values.projectStatus),
    };
    try {
      const created = await createProject(createPayload);
      const projectId = created?.idProject;

      if (projectId && ownerId) {
        await assignUserToProject({
          userId: ownerId,
          projectId,
          roleId: 1,
        });
      }

      onCreated?.(created);
      reset();
    } catch (e) {
      setSubmitError(e.message || "No se pudo crear el proyecto");
    }
  };

  return (
    <form className="form-flex" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="project" className="muted">
        Nombre del proyecto:
      </label>
      <input
        id="project"
        type="text"
        placeholder="Proyecto de ejemplo"
        {...register("project", {
          required: "Ingresa el nombre del proyecto",
          minLength: { value: 3, message: "Mínimo 3 caracteres" },
        })}
      />
      {errors.project && (
        <small className="grid-column-2">{errors.project.message}</small>
      )}

      <label htmlFor="description" className="muted">
        Descripción:
      </label>
      <input
        id="description"
        type="text"
        placeholder="Breve descripción"
        {...register("description", {
          required: "Ingresa una descripción",
          minLength: { value: 5, message: "Mínimo 5 caracteres" },
        })}
      />
      {errors.description && (
        <small className="grid-column-2">{errors.description.message}</small>
      )}

      <label htmlFor="createdDate" className="muted">
        Fecha:
      </label>
      <input
        id="createdDate"
        type="datetime-local"
        {...register("createdDate")}
      />

      <div
        className="grid-column-2"
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <label className="check">
          <input type="checkbox" {...register("projectStatus")} />
          <span className="muted">Activo</span>
        </label>
      </div>

      {mode === "edit" && (
        <div className="grid-column-2" style={{ marginTop: 12 }}>
          <h3 className="muted" style={{ marginBottom: 8 }}>
            Agregar miembros
          </h3>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div
            style={{
              maxHeight: 220,
              overflow: "auto",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 8,
            }}
          >
            {filteredUsers.length === 0 && (
              <div className="muted">No hay usuarios que coincidan.</div>
            )}

            {filteredUsers.map((u) => (
              <label
                key={u.idUser}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 4px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.idUser)}
                  onChange={() => toggleUser(u.idUser)}
                />
                <span>{u.userName}</span>
                <span
                  className="muted"
                  style={{ marginLeft: "auto", fontSize: 12 }}
                >
                  {u.email}
                </span>
              </label>
            ))}
          </div>
          <small className="muted" style={{ display: "block", marginTop: 6 }}>
            Al guardar cambios se asignarán como <b>miembros</b> (rol 2).
          </small>
        </div>
      )}

      <div
        className="flex-center"
        style={{ display: "flex", gap: 12, marginTop: 12 }}
      >
        <button className="btn-sweep" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "edit"
            ? "Guardar cambios"
            : "Crear proyecto"}
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createProject, assignUserToProject } from "@/services/projects";

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

export default function AddProjectForm({ onCreated, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      project: "",
      description: "",
      createdDate: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm (para input datetime-local)
      projectStatus: true,
    },
    mode: "onSubmit",
  });

  const [submitError, setSubmitError] = useState(null);

  const onSubmit = async (values) => {
    setSubmitError(null);

    const userId = getStoredUserId();
    if (!userId) {
      setSubmitError("No se encontró el usuario en el almacenamiento.");
      return;
    }

    // Ajusta createdDate a ISO completo si vienes de <input type="datetime-local">
    const isoDate = values.createdDate
      ? new Date(values.createdDate).toISOString()
      : new Date().toISOString();

    const payload = {
      idOwnerUser: { idUser: Number(userId) }, // 👈 desde localStorage
      project: values.project.trim(),
      description: values.description.trim(),
      createdDate: isoDate,
      projectStatus: Boolean(values.projectStatus),
    };

    try {
      const created = await createProject(payload);
      const projectId = created?.idProject;
      if (!projectId) {
        setSubmitError("No se ha retornado el ID del proyecto");
        return;
      }
      await assignUserToProject({ userId, projectId, roleId: 1 });
      console.log(created);
      onCreated?.(created);
      reset();
      // notifica al padre para refrescar la lista
    } catch (e) {
      setSubmitError(e.message || "No se pudo crear el proyecto");
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
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
        Fecha de creación:
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

      <div className="grid-column-2" style={{ display: "flex", gap: 12 }}>
        <button className="btn-sweep" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? "Creando..." : "Crear proyecto"}</span>
        </button>
        {onCancel && (
          <button type="button" className="btn-sweep" onClick={onCancel}>
            <span>Cancelar</span>
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

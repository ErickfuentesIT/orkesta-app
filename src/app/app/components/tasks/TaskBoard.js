"use client";

function getStatusId(t) {
  if (t?.statusId != null) return Number(t.statusId);
  if (t?.status?.idStatus != null) return Number(t.status.idStatus);
  if (t?.statusText) return Number(t.statusText);
  if (typeof t?.status === "number") return t.status;
  return null;
}
function getId(t) {
  return t.id ?? t.tasks;
}
function getTitle(t) {
  return t.title ?? t.name ?? `Tarea #${getId(t)}`;
}
function getDesc(t) {
  return t.description ?? t?._raw?.description ?? "";
}
function getStart(t) {
  return t.startAt ?? t.plannedStartDate ?? null;
}
function getEnd(t) {
  return t.endAt ?? t.plannedEndDate ?? null;
}

export default function TaskBoard({ tasks = [], onEdit }) {
  const pending = tasks.filter((t) => getStatusId(t) === 1);
  const doing = tasks.filter((t) => getStatusId(t) === 2);
  const done = tasks.filter((t) => getStatusId(t) === 3);

  const Col = ({ title, list }) => (
    <div className="task-col">
      <h2 className="task-col__title">{title}</h2>
      {list.length === 0 ? (
        <p className="muted">Sin tareas</p>
      ) : (
        list.map((t) => {
          const start = getStart(t);
          const end = getEnd(t);
          const id = getId(t);
          return (
            <div
              key={id}
              className="task-card"
              style={{ position: "relative" }}
            >
              {/* 3 puntos de edición */}
              <button
                aria-label="Editar tarea"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.(id);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  display: "flex",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: "black",
                  }}
                />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: "black",
                  }}
                />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: "black",
                  }}
                />
              </button>

              <h3>{getTitle(t)}</h3>
              {getDesc(t) && <p>{getDesc(t)}</p>}
              <small>
                {start ? new Date(start).toLocaleDateString() : "Sin inicio"}
                {" → "}
                {end ? new Date(end).toLocaleDateString() : "Sin fin"}
              </small>
              {t._raw?.assigment ? (
                <small className="muted">
                  Asignada a{" "}
                  {t._raw.assigment.userName ??
                    `Usuario #${t._raw.assigment.idUser}`}
                </small>
              ) : (
                <small className="muted">Sin asignar</small>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return tasks.length === 0 ? (
    <div className="empty">Este proyecto aún no tiene tareas</div>
  ) : (
    <div className="task-board">
      <Col title="Pendiente" list={pending} />
      <Col title="Haciendo" list={doing} />
      <Col title="Terminado" list={done} />
    </div>
  );
}

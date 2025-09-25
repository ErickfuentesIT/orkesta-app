"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/app/app/components/common/SideBar";
import ProjectList from "@/app/app/components/projects/ProjectList";

export default function ProjectTaskPage({ params }) {
  // En Next los params vienen por props, no con useParams()
  const { id } = React.use(params);
  const router = useRouter();

  const handleSelect = (pid) => {
    // navegar a otro proyecto
    router.push(`/app/projects/${pid}`);
  };

  const handleLogout = () => {
    // aquí invoca tu logout real si quieres
    router.replace("/app/login");
  };

  return (
    <div className="layout">
      <div className="content-ly">
        <SideBar
          activeId={Number(id)}
          onSelect={handleSelect}
          onLogout={handleLogout}
        />
        <ProjectList /* puedes pasar props si hace falta */ />
      </div>
    </div>
  );
}

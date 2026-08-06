import { useState } from "react";
import { Outlet, useLocation } from "react-router";

import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";

export default function AppLayout() {
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const isHomePage = location.pathname === "/";
  const isSummaryPage =
    location.pathname === "/resumo";

  function toggleSidebar() {
    setSidebarCollapsed(
      (currentState) => !currentState,
    );
  }

  return (
    <main
      className={`app-shell ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <section
        className={`workspace ${
          isSummaryPage
            ? "summary-workspace-page"
            : ""
        }`}
      >
        {isHomePage && <Header />}

        <Outlet />
      </section>
    </main>
  );
}
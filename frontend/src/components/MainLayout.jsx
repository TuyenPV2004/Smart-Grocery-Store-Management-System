import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-shell relative flex min-h-screen overflow-x-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((value) => !value)}
      />

      <div
        className={`hidden shrink-0 transition-all duration-300 ease-in-out md:block ${
          isCollapsed ? "w-24" : "w-[17rem]"
        }`}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-screen flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

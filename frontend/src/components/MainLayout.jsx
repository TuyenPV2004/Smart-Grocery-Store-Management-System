import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="admin-shell flex min-h-screen relative overflow-x-hidden">
      {/* Sidebar cố định bên trái */}
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* Spacer để giữ chỗ cho Sidebar (vì Sidebar là fixed) */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-24" : "w-[17rem]"
        }`}
      />

      {/* Khối nội dung bên phải */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Content */}
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

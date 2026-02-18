import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LogOut,
  Layers,
  Warehouse,
  Store,
  Truck,
  ChevronDown,
  CircleChevronRight,
  CircleChevronLeft,
  ClipboardList,
  Download,
  Boxes,
  Upload,
  Database,
} from "lucide-react";
import { useState } from "react";

const Sidebar = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    location.pathname.startsWith("/inventory"),
  );
  const [openFlyoutIndex, setOpenFlyoutIndex] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  const menuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "products",
      path: "/products",
      label: "Quản lý sản phẩm",
      icon: Package,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "suppliers",
      path: "/suppliers",
      label: "Nhà cung cấp",
      icon: Truck,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "inventory",
      label: "Quản lý kho",
      icon: Warehouse,
      roles: ["ADMIN", "STAFF"],
      isParent: true,
      isOpen: isInventoryOpen,
      toggle: () => setIsInventoryOpen(!isInventoryOpen),
      children: [
        { title: "Quản lý nhập kho", path: "/inventory/entry", icon: Download },
        {
          title: "Danh sách phiếu nhập",
          path: "/inventory/list",
          icon: ClipboardList,
        },
        { title: "Danh sách lô hàng", path: "/inventory/batches", icon: Boxes },
        { title: "Quản lý xuất kho", path: "/inventory/export", icon: Upload },
        { title: "Quản lý hàng tồn", path: "/inventory/stock", icon: Database },
      ],
    },
    {
      id: "categories",
      path: "/categories",
      label: "Quản lý danh mục",
      icon: Layers,
      roles: ["ADMIN"],
    },
    {
      id: "sales",
      path: "/sales",
      label: "Bán hàng",
      icon: ShoppingCart,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "users",
      path: "/users",
      label: "Quản lý nhân sự",
      icon: Users,
      roles: ["ADMIN"],
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isChildActive = (path) => location.pathname === path;

  // Đóng flyout khi click ra ngoài hoặc chuyển trang
  const handleFlyoutLinkClick = (path) => {
    setOpenFlyoutIndex(null);
    navigate(path);
  };

  const handleParentClick = (e, item, index) => {
    if (isCollapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      setFlyoutTop(centerY);
      setOpenFlyoutIndex(openFlyoutIndex === index ? null : index);
    } else {
      item.toggle();
    }
  };

  return (
    <>
      {/* Overlay để đóng flyout khi click ra ngoài (nằm dưới Sidebar nhưng trên nội dung chính) */}
      {openFlyoutIndex !== null && (
        <div
          className="fixed inset-0 z-[40] bg-transparent"
          onClick={() => setOpenFlyoutIndex(null)}
        />
      )}

      <div
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300`}
      >
        {/* Logo Section */}
        <div
          className={`p-6 flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          } mb-4`}
        >
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 shrink-0">
            <Store className="text-white" size={24} />
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-medium text-slate-900 tracking-tight truncate">
              Grocery Store
            </h1>
          )}
        </div>
        <button
          onClick={onToggle}
          className="absolute top-8 -right-4 z-[60] p-1.5 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all hover:scale-110"
        >
          {isCollapsed ? (
            <CircleChevronLeft size={12} />
          ) : (
            <CircleChevronRight size={12} />
          )}
        </button>

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-4 text-[11px] font-medium text-slate-400 uppercase tracking-[2px] mb-4">
              Menu chính
            </p>
          )}

          {menuItems.map((item, index) => {
            if (!item.roles.includes(user?.role)) return null;

            // Quản lý kho (menu cha)
            if (item.isParent) {
              return (
                <div key={index} className="space-y-1 relative group">
                  <button
                    onClick={(e) => handleParentClick(e, item, index)}
                    title={isCollapsed ? item.label : ""}
                    className={`w-full flex items-center ${
                      isCollapsed ? "justify-center" : "px-4"
                    } py-3 rounded-2xl transition-all duration-200 group font-medium ${
                      location.pathname.startsWith("/inventory") ||
                      openFlyoutIndex === index
                        ? "bg-slate-50 text-indigo-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={`${isCollapsed ? "" : "mr-3"} ${
                        location.pathname.startsWith("/inventory") ||
                        openFlyoutIndex === index
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="text-[15px]">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={`ml-auto transition-transform ${
                            item.isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Flyout Menu (Centered relative to icon when collapsed) */}
                  {isCollapsed && openFlyoutIndex === index && (
                    <div
                      className="fixed left-24 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[220px] animate-in slide-in-from-left-2 duration-200 z-[60]"
                      style={{
                        top: `${flyoutTop}px`,
                        transform: "translateY(-50%)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Triangle Arrow */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-slate-100 rotate-45" />

                      <div className="relative bg-white rounded-2xl overflow-hidden p-1">
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {item.label}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {item.children.map((child) => (
                            <button
                              key={child.path}
                              onClick={() => handleFlyoutLinkClick(child.path)}
                              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-[13.5px] font-medium transition-all ${
                                isChildActive(child.path)
                                  ? "text-indigo-600 bg-indigo-50/50"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                              }`}
                            >
                              <child.icon
                                size={16}
                                className={
                                  isChildActive(child.path)
                                    ? "text-indigo-600"
                                    : "text-slate-400"
                                }
                              />
                              <span>{child.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.isOpen && !isCollapsed && (
                    <div className="pl-9 space-y-1 animate-in slide-in-from-top-1 duration-200 mt-1 mb-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-3 py-2 px-3 rounded-xl text-[13.5px] font-medium transition-all ${
                            isChildActive(child.path)
                              ? "text-indigo-600 bg-indigo-50/50"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <child.icon
                            size={16}
                            className={
                              isChildActive(child.path)
                                ? "text-indigo-600"
                                : "text-slate-400"
                            }
                          />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Menu thường
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center ${
                  isCollapsed ? "justify-center" : "px-4"
                } py-3 rounded-2xl transition-all duration-200 group font-medium ${
                  isActive(item.path)
                    ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  size={20}
                  className={`${isCollapsed ? "" : "mr-3"} ${
                    isActive(item.path)
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-[15px]">{item.label}</span>
                )}

                {isActive(item.path) && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 mt-auto border-t border-slate-50 space-y-2">
          <button
            onClick={() => navigate("/profile")}
            title={isCollapsed ? "Xem hồ sơ" : ""}
            className={`w-full ${
              isCollapsed ? "justify-center" : "px-4"
            } py-3 rounded-2xl flex items-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-all`}
          >
            <div className="w-9 h-9 rounded-xl bg-white border flex items-center justify-center text-indigo-600 font-medium shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() ||
                user?.username?.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-[13px] font-medium truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-[11px] text-slate-400">Xem hồ sơ</p>
              </div>
            )}
          </button>

          <button
            onClick={logout}
            title={isCollapsed ? "Đăng xuất" : ""}
            className={`flex items-center w-full ${
              isCollapsed ? "justify-center" : "px-4"
            } py-3 text-rose-500 hover:bg-rose-50 rounded-2xl font-medium`}
          >
            <LogOut size={20} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed && "Đăng xuất"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

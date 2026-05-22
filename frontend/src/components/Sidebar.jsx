import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBox,
  FiChevronDown,
  FiClipboard,
  FiDatabase,
  FiDownload,
  FiLogOut,
  FiUpload,
} from "react-icons/fi";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { PiPackageFill } from "react-icons/pi";
import { FaTruckFast } from "react-icons/fa6";
import { MdInventory, MdDiscount, MdRateReview } from "react-icons/md";
import { FaLayerGroup, FaClipboardList } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { HiUserGroup, HiTicket } from "react-icons/hi2";
import { useAuth } from "../context/useAuth";

const navItemBase =
  "group flex w-full items-center rounded-2xl py-3 text-sm font-medium transition-all duration-200";

const Sidebar = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    location.pathname.startsWith("/inventory"),
  );
  const [openFlyoutIndex, setOpenFlyoutIndex] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const backendUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";
  const avatarPath = user?.avatarUrl || user?.avatar_url || user?.avatar;

  const menuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      icon: BiSolidCategoryAlt,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "products",
      path: "/admin/products",
      label: "Products",
      icon: PiPackageFill,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "suppliers",
      path: "/suppliers",
      label: "Suppliers",
      icon: FaTruckFast,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: MdInventory,
      roles: ["ADMIN", "STAFF"],
      isParent: true,
      isOpen: isInventoryOpen,
      toggle: () => setIsInventoryOpen((value) => !value),
      children: [
        { title: "Stock Entry", path: "/inventory/entry", icon: FiDownload },
        { title: "Entry Notes", path: "/inventory/list", icon: FiClipboard },
        { title: "Batches", path: "/inventory/batches", icon: FiBox },
        { title: "Stock Export", path: "/inventory/export", icon: FiUpload },
        { title: "Stock Management", path: "/inventory/stock", icon: FiDatabase },
      ],
    },
    {
      id: "categories",
      path: "/categories",
      label: "Categories",
      icon: FaLayerGroup,
      roles: ["ADMIN"],
    },
    {
      id: "orders",
      path: "/orders",
      label: "Orders",
      icon: FaClipboardList,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "chat",
      path: "/support/chat",
      label: "Support Chat",
      icon: IoLogoWechat,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "feedback",
      path: "/feedback",
      label: "FeedBack",
      icon: MdRateReview,
      roles: ["ADMIN", "STAFF"],
    },
    {
      id: "users",
      path: "/users",
      label: "Users",
      icon: HiUserGroup,
      roles: ["ADMIN"],
    },
    {
      id: "promotions",
      path: "/promotions",
      label: "Promotions",
      icon: MdDiscount,
      roles: ["ADMIN"],
    },
    {
      id: "vouchers",
      path: "/vouchers",
      label: "Vouchers",
      icon: HiTicket,
      roles: ["ADMIN"],
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isChildActive = (path) => location.pathname === path;

  const handleFlyoutLinkClick = (path) => {
    setOpenFlyoutIndex(null);
    navigate(path);
  };

  const handleParentClick = (event, item, index) => {
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setFlyoutTop(rect.top + rect.height / 2);
      setOpenFlyoutIndex(openFlyoutIndex === index ? null : index);
      return;
    }

    item.toggle();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {openFlyoutIndex !== null ? (
        <button
          type="button"
          className="fixed inset-0 z-[40] cursor-default bg-transparent"
          onClick={() => setOpenFlyoutIndex(null)}
          aria-label="Close sidebar flyout"
        />
      ) : null}

      <aside
        className={`fixed bottom-4 left-4 top-8 z-50 flex flex-col rounded-[1.5rem] border border-white/75 bg-white/90 shadow-[0_20px_55px_rgba(15,23,42,0.11)] backdrop-blur transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`flex items-center p-5 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <button
            type="button"
            onClick={onToggle}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(21,128,61,0.22)] transition-transform hover:scale-105"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            G
          </button>
          {!isCollapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">
                Grocery<span className="text-[#047857]">Admin</span>
              </h1>
              <p className="truncate text-xs font-medium text-slate-400">
                Store operations
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-3 scrollbar-hide">
          {menuItems.map((item, index) => {
            if (!item.roles.includes(user?.role)) return null;
            const Icon = item.icon;

            if (item.isParent) {
              const active = location.pathname.startsWith("/inventory");

              return (
                <div key={item.id} className="relative space-y-1">
                  <button
                    type="button"
                    onClick={(event) => handleParentClick(event, item, index)}
                    title={isCollapsed ? item.label : undefined}
                    className={`${navItemBase} ${
                      isCollapsed ? "justify-center px-0" : "px-4"
                    } ${
                      active || openFlyoutIndex === index
                        ? "text-emerald-800"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    aria-expanded={item.isOpen}
                  >
                    <Icon
                      size={20}
                      className={`${isCollapsed ? "" : "mr-3"} ${
                        active ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!isCollapsed ? (
                      <>
                        <span className="truncate">{item.label}</span>
                        <FiChevronDown
                          size={16}
                          className={`ml-auto transition-transform ${
                            item.isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    ) : null}
                  </button>

                  {isCollapsed && openFlyoutIndex === index ? (
                    <div
                      className="fixed left-24 z-[60] min-w-[230px] rounded-2xl border border-white/80 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.14)]"
                      style={{ top: `${flyoutTop}px`, transform: "translateY(-50%)" }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-white/80 bg-white" />
                      <div className="relative rounded-2xl bg-white p-1">
                        <div className="mb-1 border-b border-slate-100 px-4 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {item.label}
                          </p>
                        </div>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <button
                              key={child.path}
                              type="button"
                              onClick={() => handleFlyoutLinkClick(child.path)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                isChildActive(child.path)
                                  ? "text-emerald-800"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <ChildIcon size={16} />
                              <span>{child.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {!isCollapsed && item.isOpen ? (
                    <div className="ml-4 space-y-1 border-l border-emerald-100 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const activeChild = isChildActive(child.path);
                        return (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => navigate(child.path)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                              activeChild
                                ? "text-emerald-800"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <ChildIcon size={16} />
                            <span className="truncate">{child.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`${navItemBase} ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  active
                    ? "text-emerald-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={20}
                  className={`${isCollapsed ? "" : "mr-3"} ${
                    active ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-2xl py-3 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50 ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
            title="Sign out"
          >
            <FiLogOut size={18} className={isCollapsed ? "" : "mr-3"} />
            {!isCollapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

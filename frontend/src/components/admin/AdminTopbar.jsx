import React from "react";
import { FiBell, FiSearch } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { getImageUrl } from "../../utils/imageUrl";

const AdminTopbar = () => {
  const { user } = useAuth();
  const backendUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";
  const rawAvatarUrl = user?.avatarUrl || user?.avatar_url || user?.avatar;
  const avatarUrl = rawAvatarUrl
    ? rawAvatarUrl.startsWith("http")
      ? rawAvatarUrl
      : `${backendUrl}${rawAvatarUrl.replace(/^\/+/, "")}`
    : null;

  return (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
      <label className="relative w-full lg:w-[360px]">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          placeholder="Search admin data..."
          className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none ring-0 shadow-none transition-colors placeholder:text-slate-400 focus:border-slate-200 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
          aria-label="Notifications"
        >
          <FiBell size={20} />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.fullName || user?.username || "Admin"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                {(user?.fullName || user?.username || "A").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.fullName || user?.username || "Administrator"}
            </p>
            <p className="truncate text-xs font-medium text-slate-500">
              {user?.email || user?.username || "admin@store.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopbar;

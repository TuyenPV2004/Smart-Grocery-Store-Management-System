import React from "react";
import { createPortal } from "react-dom";
import {
  FiAlertCircle,
  FiBox,
  FiChevronDown,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { Button, EmptyState, PageContainer, PageHeader, PageShell, SurfaceCard } from "../ui";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export const AdminPage = ({ children, className = "" }) => (
  <PageShell admin className={cx("px-0 py-6 md:py-8", className)}>
    <PageContainer className="space-y-6">{children}</PageContainer>
  </PageShell>
);

export const AdminHeader = ({ title, description, actions, eyebrow = "Admin" }) => (
  <PageHeader
    eyebrow={eyebrow}
    title={title}
    description={description}
    actions={actions}
    className="admin-compact-header"
  />
);

export const AdminToolbar = ({ children, className = "" }) => (
  <SurfaceCard
    className={cx(
      "flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
      className,
    )}
  >
    {children}
  </SurfaceCard>
);

export const AdminSearchInput = ({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  ...props
}) => (
  <label className={cx("relative block w-full sm:max-w-md", className)}>
    <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="ui-input w-full pl-11"
      {...props}
    />
  </label>
);

export const AdminSelect = ({ value, onChange, children, className = "", ...props }) => (
  <label className={cx("relative inline-flex min-w-[180px]", className)}>
    <select
      value={value}
      onChange={onChange}
      className="ui-input w-full appearance-none pr-10"
      {...props}
    >
      {children}
    </select>
    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
  </label>
);

export const AdminTableCard = ({ children, className = "" }) => (
  <div className={cx("ui-table-wrap admin-table-card", className)}>
    <div className="ui-table-scroll">{children}</div>
  </div>
);

export const AdminIconButton = ({
  children,
  tone = "slate",
  className = "",
  type = "button",
  ...props
}) => {
  const tones = {
    emerald: "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800",
    blue: "text-sky-700 hover:bg-sky-50 hover:text-sky-800",
    amber: "text-amber-700 hover:bg-amber-50 hover:text-amber-800",
    rose: "text-rose-700 hover:bg-rose-50 hover:text-rose-800",
    slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  };

  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95",
        tones[tone] || tones.slate,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const AdminSectionTitle = ({ children, className = "" }) => (
  <h3 className={cx("text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800", className)}>
    {children}
  </h3>
);

export const AdminEmptyState = ({
  title = "No data found",
  description = "Try adjusting filters or create a new item.",
  action,
}) => (
  <EmptyState icon={FiBox} title={title} description={description} action={action} />
);

export const AdminErrorState = ({ title = "Something went wrong", description, action }) => (
  <EmptyState icon={FiAlertCircle} title={title} description={description} action={action} />
);

export const AdminModal = ({ title, children, footer, onClose, className = "" }) => {
  const hasMaxWidth = className.includes("max-w-");
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cx(
          "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl animate-in zoom-in-95 duration-200",
          !hasMaxWidth && "max-w-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-100 bg-white rounded-t-[1.75rem] px-6 py-5">
          <div className="flex-1">
            {typeof title === "string" ? (
              <h2 className="text-lg font-medium text-slate-900">{title}</h2>
            ) : (
              title
            )}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="ml-4 shrink-0 text-slate-400 hover:text-rose-600 transition-colors mt-1"
            >
              <FiX size={28} />
            </button>
          ) : null}
        </div>
        <div
          className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export { Button, SurfaceCard };

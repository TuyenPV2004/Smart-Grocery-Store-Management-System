import React from "react";
import { FiX } from "react-icons/fi";

const toneClass = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  olive: "bg-lime-50 text-lime-800 border-lime-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  blue: "bg-sky-50 text-sky-700 border-sky-100",
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export const PageShell = ({ children, className = "", admin = false }) => (
  <div
    className={cx(
      admin ? "admin-page-shell" : "app-page-bg",
      "min-h-screen font-poppins antialiased text-slate-600",
      className,
    )}
  >
    {children}
  </div>
);

export const PageContainer = ({ children, className = "" }) => (
  <div className={cx("mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8", className)}>
    {children}
  </div>
);

export const PageHeader = ({ title, description, actions, eyebrow, className = "" }) => (
  <div
    className={cx(
      "mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/72 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-end md:justify-between",
      className,
    )}
  >
    <div>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-medium tracking-tight text-slate-950 md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const SurfaceCard = ({ children, className = "" }) => (
  <div
    className={cx(
      "rounded-[1.5rem] border border-white/75 bg-white/88 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur",
      className,
    )}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  variant = "primary",
  className = "",
  as: Component = "button",
  type = "button",
  ...props
}) => {
  const variants = {
    primary:
      "bg-emerald-700 text-white shadow-[0_12px_26px_rgba(21,128,61,0.18)] hover:bg-emerald-800",
    secondary:
      "border border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50",
    muted: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white shadow-[0_12px_26px_rgba(225,29,72,0.15)] hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-white/70 hover:text-emerald-700",
  };

  return (
    <Component
      type={Component === "button" ? type : undefined}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export const InputField = ({ label, icon: Icon, className = "", inputClassName = "", ...props }) => (
  <label className={cx("block space-y-1.5", className)}>
    {label ? (
      <span className="block text-xs font-medium text-slate-600">{label}</span>
    ) : null}
    <span className="relative block">
      {Icon ? (
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
      ) : null}
      <input
        className={cx("ui-input w-full", Icon ? "pl-11" : "", inputClassName)}
        {...props}
      />
    </span>
  </label>
);

export const StatusBadge = ({ children, tone = "emerald", className = "" }) => (
  <span
    className={cx(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
      toneClass[tone] || toneClass.slate,
      className,
    )}
  >
    {children}
  </span>
);

export const EmptyState = ({ icon: Icon, title, description, action, className = "" }) => (
  <SurfaceCard className={cx("flex min-h-[260px] flex-col items-center justify-center text-center", className)}>
    {Icon ? (
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-emerald-700">
        <Icon size={28} />
      </div>
    ) : null}
    <h2 className="text-lg font-medium text-slate-900">{title}</h2>
    {description ? (
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </SurfaceCard>
);

export const ModalShell = ({ title, children, footer, onClose, className = "" }) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <div
      className={cx(
        "max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-medium text-slate-900">{title}</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        ) : null}
      </div>
      <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  </div>
);

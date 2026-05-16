import React from "react";
import { useNavigate } from "react-router-dom";

const AuthShell = ({ title, subtitle, children, maxWidth = "max-w-[430px]" }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden font-poppins antialiased text-slate-600">
      <img
        src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2200&auto=format&fit=crop"
        alt="Fresh grocery market"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-emerald-950/40 to-slate-950/35" />

      <div
        className="relative z-10 flex min-h-screen items-center justify-center overflow-y-auto p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) navigate("/");
        }}
      >
        <div
          className={`my-8 w-full ${maxWidth} overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/94 shadow-[0_28px_90px_rgba(15,23,42,0.24)] backdrop-blur`}
        >
          <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-800 to-[#7a9c5c] p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white">
              G
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-emerald-50/82">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="px-6 py-6 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;

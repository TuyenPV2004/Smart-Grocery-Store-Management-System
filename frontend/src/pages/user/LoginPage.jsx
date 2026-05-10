import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import HomePage from "./HomePage";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    await login("/");
  };

  const handleRegister = async () => {
    setIsLoading(true);
    await register();
  };

  return (
    <div className="relative min-h-screen font-poppins antialiased text-slate-600">
      <div className="absolute inset-0 z-0 h-screen overflow-hidden pointer-events-none">
        <HomePage />
      </div>
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) navigate("/");
        }}
      >
        <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-emerald-50 relative z-20">
          <div className="bg-emerald-600 p-6 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Chao mung tro lai
              </h2>
              <p className="text-emerald-100/80 text-[13px] mt-0.5 font-medium">
                Dang nhap de tiep tuc lam viec
              </p>
            </div>
          </div>

          <div className="px-8 py-7 space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Dang nhap
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleRegister}
              className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
            >
              <UserPlus className="w-4 h-4" />
              Dang ky tai khoan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

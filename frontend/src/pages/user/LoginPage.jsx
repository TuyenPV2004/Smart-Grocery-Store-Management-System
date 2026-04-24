import { useState } from "react";
import axiosClient from "../../services/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import { User, Lock, Store, Loader2, Check } from "lucide-react";
import HomePage from "./HomePage";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) =>
    role === "ADMIN" || role === "STAFF" ? "/dashboard" : "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axiosClient.post("/auth/login", { username, password });
      const token = res.data.token;
      if (!token) {
        throw new Error("LOGIN_RESPONSE_MISSING_TOKEN");
      }
      localStorage.setItem("token", token);

      try {
        const profileRes = await userService.getProfile();
        const fullUserData = { ...res.data, ...profileRes.data };
        login(fullUserData, token, getRedirectPath(fullUserData.role));
        toast.success("Đăng nhập thành công!");
      } catch (profileError) {
        console.error("Không tải được profile:", profileError);
        login(res.data, token, getRedirectPath(res.data.role));
        toast.success("Đăng nhập thành công!");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError(
          err.response?.data || "Tên đăng nhập hoặc mật khẩu không chính xác.",
        );
      } else if (err.response?.data) {
        setError(err.response.data);
      } else if (err.message === "LOGIN_RESPONSE_MISSING_TOKEN") {
        setError("Phan hoi dang nhap khong co token. Vui long kiem tra backend.");
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
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
          {/* Header Section */}
          <div className="bg-emerald-600 p-6 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Chào mừng trở lại
              </h2>
              <p className="text-emerald-100/80 text-[13px] mt-0.5 font-medium">
                Hãy đăng nhập để tiếp tục làm việc
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-800 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                  </div>
                  <input
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px] placeholder:text-slate-400"
                    type="text"
                    placeholder="Nhập tài khoản"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-800 ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                  </div>
                  <input
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px] placeholder:text-slate-400"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-1 py-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    {/* Nút ghi nhớ đã được làm hiện rõ hơn */}
                    <div
                      className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center 
                                        ${
                                          rememberMe
                                            ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                                            : "bg-white border-slate-300 group-hover:border-emerald-400"
                                        }`}
                    >
                      {rememberMe && (
                        <Check
                          size={12}
                          className="text-white"
                          strokeWidth={4}
                        />
                      )}
                    </div>
                  </div>
                  <span
                    className={`ml-2 text-[13px] font-medium transition-colors 
                                    ${
                                      rememberMe
                                        ? "text-emerald-600"
                                        : "text-slate-500 group-hover:text-emerald-600"
                                    }`}
                  >
                    Ghi nhớ
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  size="sm"
                  className="text-[13px] text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] text-center font-medium">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Đăng nhập ngay"
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-[12px] font-medium">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  Đăng ký tại đây
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

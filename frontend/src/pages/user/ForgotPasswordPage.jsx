import { toast } from 'react-toastify';
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import userService from "../../services/userService";
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Timer,
} from "lucide-react";
import HomePage from "./HomePage";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & Pass mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State cho bộ đếm thời gian
  const [countdown, setCountdown] = useState(60);

  // Xử lý đếm ngược khi sang bước 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.forgotPassword(email);
      toast.warning("Mã OTP đã được gửi! Vui lòng kiểm tra email.");
      setCountdown(60); // Reset bộ đếm về 60s
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data || "Không tìm thấy email này.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.resetPassword({ email, otp, newPassword });
      toast.success("Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data || "Lỗi đặt lại mật khẩu. Kiểm tra lại OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await userService.forgotPassword(email);
      setCountdown(60);
      toast.info("Đã gửi lại mã OTP mới.");
    } catch {
      toast.error("Gửi lại mã thất bại.");
    } finally {
      setLoading(false);
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
          <div className="bg-emerald-600 p-6 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Khôi phục mật khẩu
              </h2>
              <p className="text-emerald-100/80 text-[13px] mt-0.5 font-medium">
                Nhập email để nhận mã OTP
              </p>
            </div>
          </div>

          <div className="px-8 py-6">
            {step === 1 ? (
              <form
                onSubmit={handleRequestOtp}
                className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-800 ml-1">
                    Địa chỉ email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 text-[14px]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Gửi mã xác thực"
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleResetPassword}
                className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={18} />
                    <p className="text-[12px] text-emerald-800 font-medium">
                      Mã đã gửi thành công
                    </p>
                  </div>
                  {/* Bộ đếm thời gian chuyên nghiệp */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium text-[12px] ${
                      countdown < 10
                        ? "bg-rose-100 text-rose-600 animate-pulse"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Timer size={14} />
                    <span>{countdown}s</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[12px] font-medium text-slate-800">
                      Mã xác thực
                    </label>
                    {countdown === 0 && (
                      <button
                        type="button"
                        onClick={resendOtp}
                        className="text-[12px] text-indigo-600 hover:underline font-medium"
                      >
                        Gửi lại mã
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all text-center tracking-[0.8em] font-bold text-lg text-emerald-600 placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-800 ml-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Mật khẩu mới"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 text-[14px]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Xác nhận đổi mật khẩu"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-3 text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[13px] text-emerald-600 hover:text-emerald-700 font-semibold transition-all group"
              >
                Quay về đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

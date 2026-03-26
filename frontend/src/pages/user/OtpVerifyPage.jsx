import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Timer,
} from "lucide-react";
import userService from "../../services/userService";
import HomePage from "./HomePage";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const OtpVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);
  const initialEmail =
    location.state?.email ??
    searchParams.get("email") ??
    sessionStorage.getItem("pendingOtpEmail") ??
    "";
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [resolvedEmail, setResolvedEmail] = useState(initialEmail);
  const email = resolvedEmail.trim();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(initialEmail ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pendingOtpEmail", email);
    }
  }, [email]);

  useEffect(() => {
    if (!email || countdown === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [email, countdown]);

  const handleOtpChange = (e) => {
    const nextOtp = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(nextOtp);
  };

  const focusOtpInput = () => {
    inputRef.current?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Không tìm thấy email cần xác thực.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      toast.error("Vui lòng nhập đầy đủ 6 chữ số OTP.");
      focusOtpInput();
      return;
    }

    setLoading(true);
    try {
      await userService.verifyOtp({ email, otp });
      sessionStorage.removeItem("pendingOtpEmail");
      setResolvedEmail("");
      toast.success("Xác thực thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const resendEmail = emailInput.trim();

    if (!resendEmail) {
      toast.error("Không tìm thấy email để gửi lại OTP.");
      return;
    }

    if (countdown > 0) {
      return;
    }

    setLoading(true);
    try {
      await userService.resendOtp(resendEmail);
      setOtp("");
      setResolvedEmail(resendEmail);
      setCountdown(RESEND_SECONDS);
      toast.info("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.");
    } catch (error) {
      toast.error(error.response?.data || "Gửi lại OTP thất bại.");
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
        <div className="w-full max-w-[430px] bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-emerald-50 relative z-20">
          <div className="bg-emerald-600 p-6 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Xác thực tài khoản
              </h2>
              <p className="text-emerald-100/80 text-[13px] mt-0.5 font-medium">
                Hoàn tất bước kích hoạt tài khoản của bạn
              </p>
            </div>
          </div>

          <div className="px-8 py-6">
            {!resolvedEmail ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-amber-600" />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-slate-800">
                    Không tìm thấy email xác thực
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-400 font-medium">
                    Trang này cần được mở ngay sau khi đăng ký. Có thể bạn đã
                    tải lại trang hoặc truy cập trực tiếp nên hệ thống không
                    còn giữ email tạm thời.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Khôi phục xác thực
                  </p>
                  <div className="mt-3 space-y-3">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Nhập email đã dùng để đăng ký"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || !emailInput.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Gửi lại mã OTP"
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/register"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng ký
                  </Link>

                  <Link
                    to="/login"
                    className="w-full border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 font-medium py-3 rounded-xl transition-all flex items-center justify-center text-[14px]"
                  >
                    Đi đến đăng nhập
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-[12px] font-medium text-slate-800">
                      Mã xác thực
                    </label>
                    <div className="flex items-center gap-2">
                      {countdown === 0 && (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="text-[12px] text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors"
                        >
                          Gửi lại mã OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    placeholder="••••••"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all text-center tracking-[0.8em] font-bold text-lg text-emerald-600 placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300"
                    value={otp}
                    onChange={handleOtpChange}
                  />

                  <div className="px-1 text-[12px] pt-1">
                    <p className="text-slate-400 leading-5">
                      Mã có hiệu lực trong {countdown}s
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== OTP_LENGTH}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-[14px]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Xác nhận mã OTP"
                  )}
                </button>
                <div className="mt-3 text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-[13px] text-emerald-600 hover:text-emerald-700 font-semibold transition-all group"
                  >
                    Quay về trang đăng nhập
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;

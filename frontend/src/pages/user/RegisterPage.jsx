import { toast } from "react-toastify";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import userService from "../../services/userService";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  UserPlus,
  Loader2,
} from "lucide-react";
import HomePage from "./HomePage";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp!");
      return;
    }
    setLoading(true);
    try {
      await userService.register(formData);
      sessionStorage.setItem("pendingOtpEmail", formData.email);
      toast.success(
        "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.",
      );
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`, {
        state: { email: formData.email },
      });
    } catch (error) {
      toast.error(error.response?.data || "Đăng ký thất bại");
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
        className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) navigate("/");
        }}
      >
        <div className="w-full max-w-[550px] bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-emerald-50 transition-all relative z-20 my-8">
          {/* Header Section - Emerald Theme */}
          <div className="bg-emerald-600 p-6 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Tham gia cùng chúng tôi
              </h2>
              <p className="text-emerald-100/80 text-[13px] mt-0.5 font-medium">
                Tạo tài khoản mới để bắt đầu mua sắm
              </p>
            </div>
          </div>

          <div className="px-8 py-6 md:px-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nhóm thông tin cơ bản: Họ tên & Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Họ tên
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Tên đăng nhập
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      placeholder="username123"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm liên hệ: Email & Số điện thoại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      type="email"
                      placeholder="example@gmail.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Số điện thoại
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      placeholder="09xx xxx xxx"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-500 ml-1">
                  Địa chỉ thường trú
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                  </div>
                  <input
                    required
                    placeholder="Số nhà, tên đường, quận"
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Nhóm mật khẩu: Mật khẩu & Nhập lại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Mật khẩu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-500 ml-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-emerald-500 transition-colors" />
                    </div>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-medium text-slate-900 text-[14px]"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 text-[15px]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Tạo tài khoản"
                  )}
                </button>
              </div>
            </form>

            {/* Footer Link */}
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-[13px] font-medium">
                Đã có tài khoản hệ thống?{" "}
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors inline-flex items-center gap-1 group"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

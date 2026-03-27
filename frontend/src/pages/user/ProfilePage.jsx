import { toast } from 'react-toastify';
import { useState, useEffect } from "react";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Camera,
  KeyRound,
  ChevronRight,
  Shield,
} from "lucide-react";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const BACKEND_URL = "http://localhost:8080/";
  const avatarPath = user?.avatarUrl || user?.avatar_url || user?.avatar;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userService.getProfile();
      setUser(res.data);
      updateUser(res.data); // ĐỒNG BỘ: Cập nhật Navbar ngay khi tải trang

      setFormData({
        fullName: res.data.fullName || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
    } catch (error) {
      console.error("Lỗi tải profile:", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await userService.uploadAvatar(formData);

        // Cập nhật state local
        const updatedUser = { ...user, avatarUrl: res.data };
        setUser(updatedUser);

        updateUser(updatedUser); // ĐỒNG BỘ: Cập nhật Navbar ngay khi đổi Avatar

        toast.success("Cập nhật ảnh đại diện thành công!");
      } catch (error) {
        toast.error("Lỗi upload ảnh.");
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.updateProfile(formData);
      setUser(res.data);

      updateUser(res.data); // ĐỒNG BỘ: Cập nhật Navbar ngay khi sửa thông tin

      setIsEditing(false);
      toast.success("Cập nhật thành công!");
    } catch (error) {
      toast.error("Lỗi cập nhật profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      await userService.changePassword(passData);
      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data || "Đổi mật khẩu thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-100 py-12 px-4 sm:px-6 font-poppins">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 border-l-4 border-green-600 pl-6">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">
            Hồ sơ cá nhân
          </h2>
          <p className="text-slate-600 mt-2 font-medium text-lg">
            Cài đặt tài khoản và bảo mật hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: AVATAR CARD */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="h-28 bg-green-600" />

              <div className="px-6 pb-8 -mt-14 text-center">
                <div className="relative inline-block">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {avatarPath ? (
                      <img
                        src={
                          avatarPath.startsWith("http")
                            ? avatarPath
                            : `${BACKEND_URL}${avatarPath}`
                        }
                        alt={user?.fullname || user?.fullName || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 p-2 bg-green-600 rounded-xl shadow-lg border border-white cursor-pointer text-white hover:bg-green-700 transition-all">
                    <Camera size={18} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="mt-5">
                  <h3 className="text-xl font-medium text-slate-900 leading-none">
                    {user.fullName || "Người dùng"}
                  </h3>
                  <p className="text-base font-medium text-green-600 mt-2">
                    @{user.username}
                  </p>
                </div>

                <div className="mt-4 flex justify-center">
                  <span
                    className={`px-4 py-1 rounded-lg text-sm font-medium tracking-wide border ${
                      user.role === "ADMIN"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-green-600 text-white border-green-600"
                    }`}
                  >
                    {user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút Đổi mật khẩu */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 tracking-wider mb-4 flex items-center gap-2">
                <Shield size={18} className="text-green-600" /> Bảo mật tài
                khoản
              </h4>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#161F30] text-white hover:bg-[#161F30]/80 transition-all duration-300 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium">
                    Thay đổi mật khẩu
                  </span>
                </div>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: FORM CHI TIẾT */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 h-full">
              <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-2xl font-medium text-slate-900">
                    Thông tin chi tiết
                  </h3>
                  <p className="text-base text-slate-600 mt-1 font-medium">
                    Chỉnh sửa thông tin liên hệ của bạn
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-all shadow-sm"
                  >
                    <Edit size={18} /> Chỉnh sửa hồ sơ
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 transition-all shadow-sm"
                  >
                    <X size={18} /> Hủy bỏ
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    {
                      label: "Họ và tên",
                      icon: User,
                      key: "fullName",
                      type: "text",
                    },
                    {
                      label: "Địa chỉ Email",
                      icon: Mail,
                      key: "email",
                      type: "email",
                    },
                    {
                      label: "Số điện thoại",
                      icon: Phone,
                      key: "phone",
                      type: "text",
                    },
                    {
                      label: "Địa chỉ",
                      icon: MapPin,
                      key: "address",
                      type: "text",
                    },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2 group">
                      <label className="text-[13px] font-medium text-slate-600 ml-1 tracking-tight">
                        {item.label}
                      </label>
                      <div className="relative">
                        <item.icon
                          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                            isEditing ? "text-green-600" : "text-slate-400"
                          }`}
                          size={18}
                        />
                        <input
                          type={item.type}
                          disabled={!isEditing}
                          className={`w-full pl-12 pr-5 py-3.5 rounded-2xl border transition-all duration-300 outline-none font-medium text-slate-900 ${
                            isEditing
                              ? "bg-white border-slate-300 focus:border-green-600 focus:ring-4 focus:ring-green-50 shadow-sm"
                              : "bg-gray-100 border-gray-100 text-slate-500 cursor-not-allowed"
                          }`}
                          value={formData[item.key]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [item.key]: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="pt-6 flex justify-end">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-8 py-3.5 rounded-2xl hover:bg-green-700 flex items-center shadow-lg shadow-green-100 font-medium tracking-wide text-sm active:scale-95 transition-all"
                    >
                      <Save size={20} className="mr-2" /> Cập nhật ngay
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* MODAL ĐỔI MẬT KHẨU */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />

            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="px-8 pt-8 pb-4 flex justify-between items-center">
                <h3 className="text-xl font-medium text-slate-900">
                  Đổi mật khẩu
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-8 space-y-5">
                <div className="space-y-4">
                  {[
                    { label: "Mật khẩu hiện tại", key: "currentPassword" },
                    { label: "Mật khẩu mới", key: "newPassword" },
                    { label: "Xác nhận mật khẩu mới", key: "confirmPassword" },
                  ].map((f) => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-xs font-medium text-slate-900 tracking-wider ml-1">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-green-600 focus:ring-4 focus:ring-green-50 shadow-sm outline-none font-medium text-slate-900 transition-all"
                        value={passData[f.key]}
                        onChange={(e) =>
                          setPassData({ ...passData, [f.key]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-4 rounded-2xl hover:bg-green-700 font-medium shadow-md tracking-wide transition-all active:scale-95 mt-4"
                >
                  Xác nhận thay đổi
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

import { useEffect, useState } from "react";
import userService from "../services/userService";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Lock,
  Unlock,
  Shield,
  ChevronDown,
  UserCircle,
} from "lucide-react";

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    fullName: "",
    username: "",
    email: "",
    role: "ADMIN",
    password: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch)
      )
    );
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await userService.updateUser(formData.id, formData);
        alert("Cập nhật thành công");
      } else {
        await userService.createUser(formData);
        alert("Thêm mới thành công");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này không?")) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch (error) {
        alert("Không thể xóa người dùng này.");
      }
    }
  };

  const openEdit = (user) => {
    setFormData({ ...user, password: "" });
    setIsEdit(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      id: null,
      fullName: "",
      username: "",
      email: "",
      role: "ADMIN",
      password: "",
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (
      window.confirm(
        `Bạn có chắc chắn muốn thay đổi trạng thái của ${user.username}?`
      )
    ) {
      try {
        await userService.updateStatus(user.id, newStatus);
        fetchUsers();
      } catch (error) {
        alert("Lỗi cập nhật trạng thái");
      }
    }
  };

  const openRoleModal = (user) => {
    setSelectedUserForRole(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUserForRole) return;
    try {
      await userService.updateRole(selectedUserForRole.id, newRole);
      alert(`Cập nhật quyền thành công`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      alert("Lỗi: " + (error.response?.data || "Vui lòng thử lại"));
    }
  };

  return (
    <div className="p-6 font-poppins antialiased text-slate-600 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              Quản lý nhân sự
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Điều chỉnh danh sách và quyền hạn nhân viên trong hệ thống
            </p>
          </div>
          <button
            onClick={openAdd}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-indigo-700 shadow-sm transition-all font-medium active:scale-95"
          >
            <Plus size={18} className="mr-2" /> Thêm nhân viên
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo họ tên hoặc địa chỉ email..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all font-medium placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {/* --- BỔ SUNG CỘT ID --- */}
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    Họ tên nhân viên
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 uppercase tracking-wider w-[200px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    {/* --- HIỂN THỊ MÃ NHÂN VIÊN --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-indigo-600 font-mono">
                      #{user.staffCode || "---"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-900">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-700">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border
                          ${
                            user.role === "ADMIN"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : user.role === "STAFF"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border
                          ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}
                      >
                        {user.status === "ACTIVE"
                          ? "Đang hoạt động"
                          : "Đã khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => openRoleModal(user)}
                          className={`transition-colors ${
                            user.role === "ADMIN"
                              ? "invisible"
                              : "text-purple-600 hover:text-purple-800"
                          }`}
                          title="Phân quyền"
                        >
                          <Shield size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={
                            user.status === "ACTIVE"
                              ? "text-rose-600 hover:text-rose-800"
                              : "text-emerald-600 hover:text-emerald-800"
                          }
                          title="Khóa/Mở"
                        >
                          {user.status === "ACTIVE" ? (
                            <Lock size={18} />
                          ) : (
                            <Unlock size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-rose-600 hover:text-rose-800"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm/Sửa nhân viên giữ nguyên như bản cũ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="px-8 pt-8 pb-4">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-medium text-slate-900">
                {isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                    Họ tên
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none transition-all font-medium text-slate-900"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                {!isEdit && (
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                      Tên đăng nhập
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none transition-all font-medium text-slate-900"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                    Địa chỉ email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none transition-all font-medium text-slate-900"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none transition-all font-medium text-slate-900"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                    Vai trò
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none appearance-none transition-all font-medium text-slate-700 cursor-pointer"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="STAFF">Nhân viên</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl font-medium hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 shadow-sm transition-all"
                >
                  {isEdit ? "Cập nhật" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phân Quyền giữ nguyên như bản cũ */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowRoleModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Shield className="text-indigo-600" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 leading-tight">
                    Phân quyền hệ thống
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cập nhật vai trò người dùng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {selectedUserForRole.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                    Tài khoản đang chọn
                  </p>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedUserForRole.username}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Chọn vai trò mới
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: "ADMIN",
                      label: "ADMIN",
                      badge: "TOÀN QUYỀN",
                      badgeColor: "bg-rose-100 text-rose-700",
                    },
                    {
                      id: "STAFF",
                      label: "STAFF",
                      badge: "GIỚI HẠN",
                      badgeColor: "bg-amber-100 text-amber-700",
                    },
                    {
                      id: "CUSTOMER",
                      label: "CUSTOMER",
                      badge: "PHỔ THÔNG",
                      badgeColor: "bg-blue-100 text-blue-700",
                    },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setNewRole(role.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                        newRole === role.id
                          ? "border-indigo-600 bg-indigo-50/50"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            newRole === role.id
                              ? "border-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {newRole === role.id && (
                            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            newRole === role.id
                              ? "text-indigo-900"
                              : "text-slate-600"
                          }`}
                        >
                          {role.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold ${role.badgeColor}`}
                      >
                        {role.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveRole}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPage;
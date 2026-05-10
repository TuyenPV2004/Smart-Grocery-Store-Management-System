import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import userService from "../../services/userService";
import {
  Edit,
  Trash2,
  Search,
  Lock,
  Unlock,
  Shield,
} from "lucide-react";
import Swal from "sweetalert2";

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    fullName: "",
    username: "",
    email: "",
    address: "",
    password: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  const filteredUsers = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch),
    );
  }, [search, users]);

  async function fetchUsers() {
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    }
  }

  useEffect(() => {
    let isMounted = true;

    userService
      .getAllUsers()
      .then((res) => {
        if (isMounted) setUsers(res.data);
      })
      .catch((error) => {
        console.error("Lá»—i táº£i danh sÃ¡ch:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const updatePayload = {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          address: formData.address,
          password: formData.password,
        };
        await userService.updateUser(formData.id, updatePayload);
        toast.success("Cập nhật thành công");
      } else {
        await userService.createUser(formData);
        toast.success("Thêm mới thành công");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data ||
          "Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.",
      );
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa nhân viên này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy bỏ",
    });

    if (result.isConfirmed) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch {
        toast.error("Không thể xóa người dùng này.");
      }
    }
  };

  const openEdit = (user) => {
    setFormData({
      id: user.id,
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      address: user.address || "",
      password: "",
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      id: null,
      fullName: "",
      username: "",
      email: "",
      address: "",
      password: "",
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const result = await Swal.fire({
      title: "Xác nhận trạng thái?",
      text: `Bạn có chắc chắn muốn thay đổi trạng thái của ${user.username}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy bỏ",
    });

    if (result.isConfirmed) {
      try {
        await userService.updateStatus(user.id, newStatus);
        fetchUsers();
      } catch {
        toast.error("Lỗi cập nhật trạng thái");
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
      toast.success(`Cập nhật quyền thành công`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || "Vui lòng thử lại"));
    }
  };

  return (
    <div className="admin-page-shell p-6 font-poppins antialiased text-slate-600">
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
        </div>

        {/* Search Bar & Add Button */}
        <div className="mb-6 flex space-x-4">
          <div className="relative w-full max-w-[420px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên hoặc địa chỉ email"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all font-medium placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={openAdd}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-green-700 shadow-sm transition-all font-medium active:scale-95 whitespace-nowrap"
          >
            Thêm nhân viên
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Họ tên
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-slate-900 w-[200px]">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-800">
                      #{user.staffCode || "---"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {user.address || "---"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border
                          ${
                            user.role === "ADMIN"
                              ? "bg-rose-600 text-white border-rose-100"
                              : user.role === "STAFF"
                                ? "bg-blue-600 text-white border-blue-100"
                                : "bg-emerald-600 text-white border-emerald-100"
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
                          ? "Active"
                          : "Inactive"}
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

      {/* Modal Thêm/Sửa nhân viên */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="text-xl font-medium text-slate-800 leading-tight">
                  {isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {isEdit ? "Chỉnh sửa thông tin nhân viên trên hệ thống" : "Điền thông tin để tạo tài khoản mới"}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Họ tên
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-800 text-sm"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                
                {!isEdit && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                      Tên đăng nhập
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-800 text-sm"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Địa chỉ email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-800 text-sm"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-800 text-sm"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Mật khẩu {isEdit && <span className="text-slate-400 font-normal text-xs">(Bỏ trống nếu không đổi)</span>}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-800 text-sm"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="px-6 pb-6 pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-600 shadow-md shadow-emerald-200 active:scale-95 transition-all"
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
                <div>
                  <h3 className="text-xl font-medium text-slate-800 leading-tight">
                    Phân quyền hệ thống
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cập nhật vai trò người dùng
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 ml-1">
                  Chọn vai trò mới
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: "ADMIN",
                      label: "ADMIN",
                      badge: "Toàn quyền",
                      badgeColor: "bg-rose-500 text-white",
                    },
                    {
                      id: "STAFF",
                      label: "STAFF",
                      badge: "Giới hạn",
                      badgeColor: "bg-amber-500 text-white",
                    },
                    {
                      id: "CUSTOMER",
                      label: "CUSTOMER",
                      badge: "Phổ thông",
                      badgeColor: "bg-blue-500 text-white",
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
                        className={`text-[10px] px-2 py-1 rounded-md font-medium ${role.badgeColor}`}
                      >
                        {role.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveRole}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-600 shadow-md shadow-indigo-200 active:scale-95 transition-all"
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

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiLock,
  FiMoreHorizontal,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUnlock,
  FiUser,
  FiX,
} from "react-icons/fi";
import { FaEdit, FaUser, FaUserTag, FaEnvelope, FaMapMarkerAlt, FaLock } from "react-icons/fa";
import userService from "../../services/userService";
import {
  AdminModal,
  AdminPage,
  AdminSelect,
  Button,
} from "../../components/admin/AdminUi";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { StatusBadge } from "../../components/ui";

const emptyForm = {
  id: null,
  fullName: "",
  username: "",
  email: "",
  address: "",
  password: "",
};

const roleOptions = ["ADMIN", "STAFF", "CUSTOMER"];
const roleFilterOptions = ["ALL", ...roleOptions];
const statusFilterOptions = ["ALL", "ACTIVE", "INACTIVE"];

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [actionMenu, setActionMenu] = useState(null);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();
    return users.filter(
      (user) => {
        const matchesKeyword =
          !keyword ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
          user.username?.toLowerCase().includes(keyword) ||
          user.staffCode?.toLowerCase().includes(keyword);
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;

        return matchesKeyword && matchesRole && matchesStatus;
      },
    );
  }, [roleFilter, search, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Unable to load users.");
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchUsers();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!actionMenu) return undefined;

    const closeMenu = () => setActionMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  const closeUserModal = () => {
    setShowModal(false);
    setIsEdit(false);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isEdit) {
        await userService.updateUser(formData.id, {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          address: formData.address,
          password: formData.password,
        });
        toast.success("User updated.");
      } else {
        await userService.createUser(formData);
        toast.success("User created.");
      }
      closeUserModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data || "Unable to save user.");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await userService.deleteUser(id);
      fetchUsers();
      toast.success("User deleted.");
    } catch {
      toast.error("Unable to delete this user.");
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
    setFormData(emptyForm);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const result = await Swal.fire({
      title: "Change user status?",
      text: `This will set ${user.username} to ${newStatus}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#15803d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await userService.updateStatus(user.id, newStatus);
      fetchUsers();
    } catch {
      toast.error("Unable to update status.");
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
      toast.success("Role updated.");
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data || "Unable to update role.");
    }
  };

  const openActionMenu = (event, user) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = user.role !== "ADMIN" ? 164 : 124;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.user?.id === user.id
        ? null
        : {
            user,
            x: rect.left + rect.width / 2,
            y: shouldOpenUpward ? rect.top - gap : rect.bottom + gap,
            placement: shouldOpenUpward ? "top" : "bottom",
          },
    );
  };

  const runAction = (callback) => {
    setActionMenu(null);
    callback();
  };

  const getRoleFilterCount = (role) => {
    if (role === "ALL") return users.length;
    return users.filter((user) => user.role === role).length;
  };

  const getStatusFilterCount = (status) => {
    if (status === "ALL") return users.length;
    return users.filter((user) => user.status === status).length;
  };

  return (
    <AdminPage>
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">
            User Catalog
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search users by name, username, email, or staff ID
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                User Management
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {roleFilterOptions.map((role) => {
                const isActive = roleFilter === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {role === "ALL" ? "All roles" : role} {getRoleFilterCount(role)}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={search}
                  placeholder="Search..."
                  className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-slate-50"
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
                    aria-label="Clear search"
                  >
                    <FiX size={15} />
                  </button>
                ) : null}
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-300 focus:bg-slate-50 sm:w-[160px]"
              >
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All statuses" : status} {getStatusFilterCount(status)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openAdd}
                className="whitespace-nowrap rounded-full bg-green-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-green-700"
              >
                Add staff
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-base font-medium text-slate-900">Staff ID</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Name</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Username</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Email</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Address</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Role</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Status</th>
              <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="product-inventory-row transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-emerald-800">
                    #{user.staffCode || user.id || "---"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {user.fullName || "---"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {user.username || "---"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {user.email || "---"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {user.address || "---"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge tone={user.role === "ADMIN" ? "rose" : user.role === "STAFF" ? "blue" : "emerald"}>
                      {user.role || "---"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge tone={user.status === "ACTIVE" ? "emerald" : "rose"}>
                      {user.status === "ACTIVE" ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(event) => openActionMenu(event, user)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        title="Actions"
                      >
                        <FiMoreHorizontal size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="product-empty-row bg-white">
                <td colSpan="8" className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FiUser className="mb-4 text-slate-950" size={30} />
                    <h4 className="text-base font-medium text-slate-900">
                      No matching users
                    </h4>
                    <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                      Try changing the role, status, or search keyword.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {actionMenu ? (
        <div
          className={`fixed z-[80] !w-44 -translate-x-[calc(100%-1.25rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(100,116,139,0.22)] ring-1 ring-slate-300/45 ${
            actionMenu.placement === "top" ? "-translate-y-full" : ""
          }`}
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {actionMenu.user.role !== "ADMIN" ? (
            <button
              type="button"
              onClick={() => runAction(() => openRoleModal(actionMenu.user))}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              title="Change role"
            >
              <FiShield className="text-blue-500" size={18} />
              <span>Role</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => runAction(() => handleToggleStatus(actionMenu.user))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Toggle status"
          >
            {actionMenu.user.status === "ACTIVE" ? (
              <FiLock className="text-amber-600" size={18} />
            ) : (
              <FiUnlock className="text-emerald-600" size={18} />
            )}
            <span>{actionMenu.user.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => openEdit(actionMenu.user))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Edit"
          >
            <FaEdit className="text-indigo-600" size={18} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDelete(actionMenu.user.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Delete"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      {showModal ? (
        <AdminModal
          title={
            <div className="flex items-center justify-center gap-2.5 w-full pr-8">
              <FaUser className="text-green-600" size={26} />
              <h2 className="text-xl font-medium text-slate-900 leading-none">
                {isEdit ? "Edit User" : "Add Staff"}
              </h2>
            </div>
          }
          onClose={closeUserModal}
          footer={
            <Button type="submit" form="user-form" className="w-full sm:w-auto">
              {isEdit ? "Save Changes" : "Create Account"}
            </Button>
          }
        >
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#DFEBDF] border border-[#DFEBDF]/50 rounded-2xl p-5 shadow-sm space-y-4">
              <Field required label="Full name" icon={FaUser} value={formData.fullName} onChange={(value) => setFormData({ ...formData, fullName: value })} />
              {!isEdit ? (
                <Field required label="Username" icon={FaUserTag} value={formData.username} onChange={(value) => setFormData({ ...formData, username: value })} />
              ) : null}
              <Field required label="Email" type="email" icon={FaEnvelope} value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} />
              <Field label="Address" icon={FaMapMarkerAlt} value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} />
              <Field
                label={isEdit ? "Password (leave blank to keep current)" : "Password"}
                icon={FaLock}
                type="password"
                value={formData.password}
                onChange={(value) => setFormData({ ...formData, password: value })}
              />
            </div>
          </form>
        </AdminModal>
      ) : null}

      {showRoleModal && selectedUserForRole ? (
        <AdminModal
          title="Change Role"
          onClose={() => setShowRoleModal(false)}
          className="max-w-md"
          footer={
            <>
              <Button variant="muted" onClick={() => setShowRoleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>Save Role</Button>
            </>
          }
        >
          <p className="mb-4 text-sm font-medium text-slate-500">
            Update role for {selectedUserForRole.username}.
          </p>
          <AdminSelect value={newRole} onChange={(event) => setNewRole(event.target.value)} className="w-full">
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </AdminSelect>
        </AdminModal>
      ) : null}
    </AdminPage>
  );
};

const Field = ({ label, value, onChange, type = "text", required = false, icon: Icon }) => (
  <label className="block space-y-2">
    <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
      {Icon ? <Icon className="text-emerald-700" size={16} /> : null}
      <span>{label}</span>
    </div>
    <input
      required={required}
      type={type}
      className="ui-input w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export default UserListPage;

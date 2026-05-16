import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiEdit2,
  FiLock,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUnlock,
} from "react-icons/fi";
import userService from "../../services/userService";
import {
  AdminHeader,
  AdminIconButton,
  AdminModal,
  AdminPage,
  AdminSearchInput,
  AdminSelect,
  AdminTableCard,
  Button,
  SurfaceCard,
} from "../../components/admin/AdminUi";
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

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();
    return users.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.username?.toLowerCase().includes(keyword),
    );
  }, [search, users]);

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

  return (
    <AdminPage>
      <AdminHeader
        title="Users"
        description="Manage staff accounts, access roles, and account status."
        actions={
          <Button onClick={openAdd}>
            <FiPlus size={18} />
            Add Staff
          </Button>
        }
      />

      <SurfaceCard className="p-4">
        <AdminSearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, username, or email"
          className="sm:max-w-xl"
        />
      </SurfaceCard>

      <AdminTableCard>
        <table>
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Staff ID</th>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Username</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Address</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
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
                    {user.role !== "ADMIN" ? (
                      <AdminIconButton onClick={() => openRoleModal(user)} tone="blue" aria-label="Change role">
                        <FiShield size={18} />
                      </AdminIconButton>
                    ) : null}
                    <AdminIconButton
                      onClick={() => handleToggleStatus(user)}
                      tone={user.status === "ACTIVE" ? "amber" : "emerald"}
                      aria-label="Toggle status"
                    >
                      {user.status === "ACTIVE" ? <FiLock size={18} /> : <FiUnlock size={18} />}
                    </AdminIconButton>
                    <AdminIconButton onClick={() => openEdit(user)} tone="emerald" aria-label="Edit user">
                      <FiEdit2 size={18} />
                    </AdminIconButton>
                    <AdminIconButton onClick={() => handleDelete(user.id)} tone="rose" aria-label="Delete user">
                      <FiTrash2 size={18} />
                    </AdminIconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-sm font-medium text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {showModal ? (
        <AdminModal
          title={isEdit ? "Edit User" : "Add Staff"}
          onClose={closeUserModal}
          footer={
            <>
              <Button variant="muted" onClick={closeUserModal}>
                Cancel
              </Button>
              <Button type="submit" form="user-form">
                {isEdit ? "Save Changes" : "Create Account"}
              </Button>
            </>
          }
        >
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <Field required label="Full name" value={formData.fullName} onChange={(value) => setFormData({ ...formData, fullName: value })} />
            {!isEdit ? (
              <Field required label="Username" value={formData.username} onChange={(value) => setFormData({ ...formData, username: value })} />
            ) : null}
            <Field required label="Email" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} />
            <Field label="Address" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} />
            <Field
              label={isEdit ? "Password (leave blank to keep current)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
            />
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

const Field = ({ label, value, onChange, type = "text", required = false }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
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

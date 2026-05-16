import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiCamera,
  FiChevronRight,
  FiEdit,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Button, InputField, ModalShell, PageContainer, PageShell, SurfaceCard, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import userService from "../../services/userService";

const ProfilePage = () => {
  const [profile, setProfile] = useState({});
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const backendUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";
  const avatarPath = profile?.avatarUrl || profile?.avatar_url || profile?.avatar;
  const avatarUrl = avatarPath
    ? avatarPath.startsWith("http")
      ? avatarPath
      : `${backendUrl}${avatarPath}`
    : null;
  const isAdminShell = profile?.role === "ADMIN" || profile?.role === "STAFF";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile();
        setProfile(res.data);
        updateUser(res.data);
        setFormData({
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });
      } catch (error) {
        console.error("Profile load error:", error);
        toast.error("Could not load your profile.");
      }
    };

    fetchProfile();
  }, [updateUser]);

  const updateField = (field) => (event) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const payload = new FormData();
    payload.append("image", file);
    try {
      const res = await userService.uploadAvatar(payload);
      const updatedUser = { ...profile, avatarUrl: res.data };
      setProfile(updatedUser);
      updateUser(updatedUser);
      toast.success("Avatar updated successfully.");
    } catch {
      toast.error("Could not upload avatar.");
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    try {
      const res = await userService.updateProfile(formData);
      setProfile(res.data);
      updateUser(res.data);
      setIsEditing(false);
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Could not update profile.");
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    try {
      await userService.changePassword(passData);
      toast.success("Password changed successfully.");
      setShowPasswordModal(false);
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data || "Could not change password.");
    }
  };

  return (
    <PageShell admin={isAdminShell} className="py-8">
      <PageContainer className="max-w-6xl">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium">
          <a href="/" className="text-black transition-colors hover:text-slate-700">
            Home
          </a>
          <span className="text-black">&gt;</span>
          <span className="text-emerald-700">Profile</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <SurfaceCard className="overflow-hidden p-0">
              <div className="h-28 bg-gradient-to-r from-emerald-800 to-[#7a9c5c]" />
              <div className="-mt-14 px-6 pb-7 text-center">
                <div className="relative inline-block">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg sm:h-32 sm:w-32">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile?.fullName || "Profile"} className="h-full w-full object-cover" />
                    ) : (
                      <FiUser size={48} className="text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white bg-emerald-700 text-white shadow-lg transition-colors hover:bg-emerald-800">
                    <FiCamera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>

                <h2 className="mt-5 text-xl font-medium text-slate-900">
                  {profile.fullName || profile.username || "User"}
                </h2>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  @{profile.username || "account"}
                </p>
                <div className="mt-4">
                  <StatusBadge tone={profile.role === "ADMIN" ? "rose" : "emerald"}>
                    {profile.role || "CUSTOMER"}
                  </StatusBadge>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600">
                <FiShield className="text-emerald-700" size={18} />
                Account security
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex w-full items-center justify-between rounded-2xl bg-slate-950 p-4 text-white transition-colors hover:bg-slate-800"
              >
                <span className="font-medium">Change password</span>
                <FiChevronRight size={20} />
              </button>
            </SurfaceCard>
          </div>

          <SurfaceCard className="lg:col-span-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-slate-900">Contact details</h2>
                  <p className="mt-1 text-sm text-slate-500">Keep this information up to date for delivery and support.</p>
                </div>
                <div className="shrink-0">
                  {!isEditing ? (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      <FiEdit size={17} />
                      Edit profile
                    </Button>
                  ) : (
                    <Button type="button" variant="danger" onClick={() => setIsEditing(false)}>
                      <FiX size={17} />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField label="Full name" icon={FiUser} value={formData.fullName} onChange={updateField("fullName")} disabled={!isEditing} />
                <InputField label="Email address" icon={FiMail} type="email" value={formData.email} onChange={updateField("email")} disabled={!isEditing} />
                <InputField label="Phone number" icon={FiPhone} value={formData.phone} onChange={updateField("phone")} disabled={!isEditing} />
                <InputField label="Address" icon={FiMapPin} value={formData.address} onChange={updateField("address")} disabled={!isEditing} />
              </div>

              {isEditing ? (
                <div className="flex justify-end">
                  <Button type="submit">
                    <FiSave size={17} />
                    Save changes
                  </Button>
                </div>
              ) : null}
            </form>
          </SurfaceCard>
        </div>

        {showPasswordModal ? (
          <ModalShell
            title="Change password"
            onClose={() => setShowPasswordModal(false)}
            footer={
              <>
                <Button type="button" variant="muted" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="changePasswordForm">
                  Confirm change
                </Button>
              </>
            }
          >
            <form id="changePasswordForm" onSubmit={handleChangePassword} className="space-y-4">
              <InputField
                label="Current password"
                icon={FiLock}
                type="password"
                required
                value={passData.currentPassword}
                onChange={(event) => setPassData((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
              <InputField
                label="New password"
                icon={FiLock}
                type="password"
                required
                value={passData.newPassword}
                onChange={(event) => setPassData((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
              <InputField
                label="Confirm new password"
                icon={FiLock}
                type="password"
                required
                value={passData.confirmPassword}
                onChange={(event) => setPassData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
            </form>
          </ModalShell>
        ) : null}
      </PageContainer>
    </PageShell>
  );
};

export default ProfilePage;

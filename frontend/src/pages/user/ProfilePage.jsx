import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiCamera,
  FiLock,
  FiUser,
} from "react-icons/fi";
import { FaUserAlt, FaMapMarkedAlt, FaHome } from "react-icons/fa";
import { MdEmail, MdOpenInNew } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { Button, InputField, ModalShell, PageContainer, PageShell, SurfaceCard, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/useAuth";
import userService from "../../services/userService";

const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;

const ProfilePage = () => {
  const [profile, setProfile] = useState({});
  const { updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [modalFormData, setModalFormData] = useState({
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

  const bannerPath = profile?.bannerUrl || profile?.banner_url || profile?.banner;
  const bannerUrl = bannerPath
    ? bannerPath.startsWith("http")
      ? bannerPath
      : `${backendUrl}${bannerPath}`
    : "https://media.gettyimages.com/id/642438552/photo/feeding-the-world-one-seedling-at-a-time.jpg?s=612x612&w=0&k=20&c=DNe8g3G_0lUwrNrpvhsWy_M4Xl_o4dEqt_TtND9GfYY=";

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

  const handleOpenEditModal = () => {
    setModalFormData({
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
    setShowEditModal(true);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error("Avatar image must be 10MB or smaller.");
      event.target.value = "";
      return;
    }

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

  const handleBannerFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error("Banner image must be 10MB or smaller.");
      event.target.value = "";
      return;
    }

    const payload = new FormData();
    payload.append("image", file);
    try {
      const res = await userService.uploadBanner(payload);
      const updatedUser = { ...profile, bannerUrl: res.data };
      setProfile(updatedUser);
      updateUser(updatedUser);
      toast.success("Banner updated successfully.");
    } catch {
      toast.error("Could not upload banner.");
    }
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await userService.updateProfile(modalFormData);
      setProfile(res.data);
      updateUser(res.data);
      setFormData({
        fullName: res.data.fullName || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
      setShowEditModal(false);
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
          <a href="/" className="flex items-center gap-1.5 text-black transition-colors hover:text-slate-700">
            <FaHome className="text-emerald-700" size={16} />
            Home
          </a>
          <span className="text-black">&gt;</span>
          <span className="text-emerald-700">Profile</span>
        </div>

        <div>
          <div className="w-full">
            <SurfaceCard className="overflow-hidden p-0">
              <div className="relative h-72 w-full group/banner">
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
                <label className="absolute top-4 right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover/banner:opacity-100 shadow-md">
                  <FiCamera size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleBannerFileChange} />
                </label>
              </div>
              <div className="-mt-20 px-6 pb-7 text-center">
                <div className="relative inline-block group">
                  <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg sm:h-40 sm:w-40">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile?.fullName || "Profile"} className="h-full w-full object-cover" />
                    ) : (
                      <FiUser size={64} className="text-slate-400" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <FiCamera size={28} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <span className="absolute bottom-2 right-2 block h-6 w-6 rounded-full border-2 border-white bg-emerald-500 shadow-md sm:bottom-2.5 sm:right-2.5" />
                </div>

                <h2 className="mt-5 text-xl font-medium text-slate-900">
                  {profile.fullName || profile.username || "User"}
                </h2>
                <div className="mt-4">
                  <StatusBadge tone={profile.role === "ADMIN" ? "rose" : "emerald"}>
                    {profile.role || "CUSTOMER"}
                  </StatusBadge>
                </div>

                <div className="mt-7 space-y-6 border-t border-slate-100 pt-6 text-left">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-medium text-slate-900">Contact details</h2>
                      <p className="mt-1 text-sm text-slate-500">Keep this information up to date for delivery and support.</p>
                    </div>
                    <div className="shrink-0">
                      <Button type="button" onClick={() => setShowPasswordModal(true)}>
                        <FiLock size={17} />
                        Change password
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <InputField label="Full name" icon={FaUserAlt} rightIcon={MdOpenInNew} onRightIconClick={handleOpenEditModal} labelClassName="text-base font-medium text-slate-600" inputClassName="!rounded-lg cursor-pointer" value={formData.fullName} readOnly onClick={handleOpenEditModal} />
                    <InputField label="Email address" icon={MdEmail} rightIcon={MdOpenInNew} onRightIconClick={handleOpenEditModal} labelClassName="text-base font-medium text-slate-600" inputClassName="!rounded-lg cursor-pointer" type="email" value={formData.email} readOnly onClick={handleOpenEditModal} />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <InputField label="Phone number" icon={FaPhone} rightIcon={MdOpenInNew} onRightIconClick={handleOpenEditModal} labelClassName="text-base font-medium text-slate-600" inputClassName="!rounded-lg cursor-pointer" value={formData.phone} readOnly onClick={handleOpenEditModal} />
                    <InputField label="Address" icon={FaMapMarkedAlt} rightIcon={MdOpenInNew} onRightIconClick={handleOpenEditModal} labelClassName="text-base font-medium text-slate-600" inputClassName="!rounded-lg cursor-pointer" value={formData.address} readOnly onClick={handleOpenEditModal} />
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
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

        {showEditModal ? (
          <ModalShell
            title="Edit profile"
            onClose={() => setShowEditModal(false)}
            footer={
              <>
                <Button type="button" variant="muted" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="editProfileForm">
                  Save changes
                </Button>
              </>
            }
          >
            <form id="editProfileForm" onSubmit={handleModalSubmit} className="space-y-4">
              <InputField
                label="Full name"
                icon={FaUserAlt}
                required
                value={modalFormData.fullName}
                onChange={(event) => setModalFormData((prev) => ({ ...prev, fullName: event.target.value }))}
              />
              <InputField
                label="Email address"
                icon={MdEmail}
                type="email"
                required
                value={modalFormData.email}
                onChange={(event) => setModalFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
              <InputField
                label="Phone number"
                icon={FaPhone}
                required
                value={modalFormData.phone}
                onChange={(event) => setModalFormData((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <InputField
                label="Address"
                icon={FaMapMarkedAlt}
                required
                value={modalFormData.address}
                onChange={(event) => setModalFormData((prev) => ({ ...prev, address: event.target.value }))}
              />
            </form>
          </ModalShell>
        ) : null}
      </PageContainer>
    </PageShell>
  );
};

export default ProfilePage;

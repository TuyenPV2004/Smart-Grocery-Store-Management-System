import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiLoader, FiLock, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import AuthShell from "../../components/AuthShell";
import { Button, InputField } from "../../components/ui";
import userService from "../../services/userService";

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

  const updateField = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await userService.register(formData);
      sessionStorage.setItem("pendingOtpEmail", formData.email);
      toast.success("Registration successful. Please check your email for the OTP code.");
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`, {
        state: { email: formData.email },
      });
    } catch (error) {
      toast.error(error.response?.data || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create a new account"
      subtitle="Start shopping for fresh groceries every day"
      maxWidth="max-w-[560px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Full name" icon={FiUser} value={formData.fullName} onChange={updateField("fullName")} required placeholder="Alex Nguyen" />
          <InputField label="Username" icon={FiUser} value={formData.username} onChange={updateField("username")} required placeholder="username123" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Email" icon={FiMail} type="email" value={formData.email} onChange={updateField("email")} required placeholder="example@gmail.com" />
          <InputField label="Phone number" icon={FiPhone} value={formData.phone} onChange={updateField("phone")} required placeholder="09xx xxx xxx" />
        </div>

        <InputField label="Address" icon={FiMapPin} value={formData.address} onChange={updateField("address")} required placeholder="House number, street, district" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Password" icon={FiLock} type="password" value={formData.password} onChange={updateField("password")} required placeholder="••••••••" />
          <InputField label="Confirm password" icon={FiLock} type="password" value={formData.confirmPassword} onChange={updateField("confirmPassword")} required placeholder="••••••••" />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm font-medium text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="text-emerald-700 hover:text-emerald-800">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default RegisterPage;

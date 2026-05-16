import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCheckCircle, FiClock, FiLoader, FiLock, FiMail } from "react-icons/fi";
import AuthShell from "../../components/AuthShell";
import { Button, InputField } from "../../components/ui";
import userService from "../../services/userService";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, countdown]);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await userService.forgotPassword(email);
      toast.warning("The OTP code has been sent. Please check your email.");
      setCountdown(60);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data || "This email could not be found.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await userService.resetPassword({ email, otp, newPassword });
      toast.success("Password changed successfully. You can sign in now.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data || "Password reset failed. Please check the OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await userService.forgotPassword(email);
      setCountdown(60);
      toast.info("A new OTP code has been sent.");
    } catch {
      toast.error("Failed to resend the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={step === 1 ? "Enter your email to receive an OTP" : "Enter the OTP and your new password"}
    >
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <InputField
            label="Email address"
            icon={FiMail}
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : null}
            Send verification code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-700" size={18} />
              <p className="text-xs font-medium text-emerald-800">Code sent successfully</p>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
                countdown < 10 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <FiClock size={14} />
              <span>{countdown}s</span>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700">
              Verification code
              {countdown === 0 ? (
                <button type="button" onClick={resendOtp} className="text-emerald-700 hover:text-emerald-800">
                  Resend code
                </button>
              ) : null}
            </span>
            <input
              className="ui-input w-full text-center text-lg font-semibold tracking-[0.8em] text-emerald-700"
              type="text"
              required
              maxLength="6"
              placeholder="••••••"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </label>

          <InputField
            label="New password"
            icon={FiLock}
            type="password"
            required
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : null}
            Confirm new password
          </Button>
        </form>
      )}

      <div className="mt-5 text-center">
        <Link to="/login" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;

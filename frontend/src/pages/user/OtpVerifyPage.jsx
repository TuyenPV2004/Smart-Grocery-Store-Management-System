import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft, FiLoader, FiMail } from "react-icons/fi";
import AuthShell from "../../components/AuthShell";
import { Button, InputField, SurfaceCard } from "../../components/ui";
import userService from "../../services/userService";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const OtpVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);
  const initialEmail =
    location.state?.email ??
    searchParams.get("email") ??
    sessionStorage.getItem("pendingOtpEmail") ??
    "";
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [resolvedEmail, setResolvedEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(initialEmail ? RESEND_SECONDS : 0);
  const email = resolvedEmail.trim();

  useEffect(() => {
    if (email) sessionStorage.setItem("pendingOtpEmail", email);
  }, [email]);

  useEffect(() => {
    if (!email || countdown === 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email, countdown]);

  const handleOtpChange = (event) => {
    setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("No email was found for verification.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter the full 6-digit OTP code.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await userService.verifyOtp({ email, otp });
      sessionStorage.removeItem("pendingOtpEmail");
      toast.success("Verification successful. Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data || "The OTP code is incorrect or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const resendEmail = emailInput.trim();
    if (!resendEmail) {
      toast.error("No email was found for resending the OTP.");
      return;
    }
    if (countdown > 0) return;

    setLoading(true);
    try {
      await userService.resendOtp(resendEmail);
      setOtp("");
      setResolvedEmail(resendEmail);
      setCountdown(RESEND_SECONDS);
      toast.info("A new OTP code has been sent. Please check your email.");
    } catch (error) {
      toast.error(error.response?.data || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify account"
      subtitle="Complete your account activation"
    >
      {!resolvedEmail ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
            <FiMail className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-900">Verification email not found</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the email you used to register and receive a new OTP code.
            </p>
          </div>

          <SurfaceCard className="p-4 text-left">
            <InputField
              label="Registration email"
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="email@example.com"
            />
            <Button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || !emailInput.trim()}
              className="mt-3 w-full"
            >
              {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : null}
              Resend OTP
            </Button>
          </SurfaceCard>

          <div className="space-y-3">
            <Button as={Link} to="/register" className="w-full">
              <FiArrowLeft className="h-4 w-4" />
              Back to registration
            </Button>
            <Button as={Link} to="/login" variant="secondary" className="w-full">
              Go to sign in
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700">
              Verification code
              {countdown === 0 ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-700 hover:text-emerald-800"
                >
                  Resend OTP
                </button>
              ) : null}
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder="••••••"
              className="ui-input w-full text-center text-lg font-semibold tracking-[0.8em] text-emerald-700"
              value={otp}
              onChange={handleOtpChange}
            />
          </label>

          <p className="text-xs font-medium text-slate-500">
            The code is valid for {countdown}s. Email:{" "}
            <span className="text-slate-800">{email}</span>
          </p>

          <Button type="submit" disabled={loading || otp.length !== OTP_LENGTH} className="w-full">
            {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : null}
            Confirm OTP
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
};

export default OtpVerifyPage;

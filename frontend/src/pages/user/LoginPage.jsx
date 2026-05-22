import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogIn, FiLoader, FiUserPlus } from "react-icons/fi";
import AuthShell from "../../components/AuthShell";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/useAuth";

const LOGIN_REDIRECT_KEY = "auth:login-redirect";

const normalizeRedirectPath = (value) => {
  if (!value || typeof value !== "string" || !value.startsWith("/")) {
    return "/";
  }

  return value.startsWith("//") ? "/" : value;
};

const locationToPath = (location) => {
  if (!location) return "/";
  return `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`;
};

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { authReady, isAuthenticated, login, register } = useAuth();

  const redirectPath = normalizeRedirectPath(
    locationToPath(location.state?.from),
  );

  useEffect(() => {
    if (authReady && isAuthenticated) {
      const storedRedirect = normalizeRedirectPath(
        sessionStorage.getItem(LOGIN_REDIRECT_KEY),
      );

      sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
      navigate(storedRedirect, { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    sessionStorage.setItem(LOGIN_REDIRECT_KEY, redirectPath);
    try {
      await login(redirectPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue shopping and manage your orders"
    >
      <div className="space-y-3">
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleLogin}
          className="w-full"
        >
          {isLoading ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiLogIn className="h-4 w-4" />}
          Sign in
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={handleRegister}
          className="w-full"
        >
          <FiUserPlus className="h-4 w-4" />
          Create account
        </Button>
      </div>
    </AuthShell>
  );
};

export default LoginPage;

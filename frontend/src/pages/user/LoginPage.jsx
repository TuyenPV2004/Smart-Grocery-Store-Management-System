import { useState } from "react";
import { FiLogIn, FiLoader, FiUserPlus } from "react-icons/fi";
import AuthShell from "../../components/AuthShell";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/useAuth";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    await login("/");
  };

  const handleRegister = async () => {
    setIsLoading(true);
    await register();
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

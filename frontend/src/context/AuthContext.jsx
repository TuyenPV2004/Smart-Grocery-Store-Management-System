import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContextValue";
import {
  getKeycloakUser,
  initKeycloak,
  keycloak,
  keycloakRedirectUri,
} from "../services/keycloak";
import userService from "../services/userService";

const mergeProfileUser = (keycloakUser, profileUser) => {
  if (!profileUser) return keycloakUser;

  return {
    ...keycloakUser,
    ...profileUser,
    id: profileUser.id ?? keycloakUser?.id,
    username: profileUser.username || keycloakUser?.username,
    email: profileUser.email || keycloakUser?.email,
    fullName:
      profileUser.fullName ||
      profileUser.fullname ||
      keycloakUser?.fullName ||
      keycloakUser?.username,
    avatarUrl:
      profileUser.avatarUrl ||
      profileUser.avatar_url ||
      profileUser.avatar ||
      keycloakUser?.avatarUrl,
    role: profileUser.role || keycloakUser?.role,
    roles: keycloakUser?.roles || [],
  };
};

const LOGIN_TOAST_KEY = "auth:login-success-pending";
const LOGOUT_TOAST_KEY = "auth:logout-success-pending";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    initKeycloak()
      .then(async (authenticated) => {
        if (!mounted) return;

        if (authenticated) {
          const keycloakUser = getKeycloakUser();
          let resolvedUser = keycloakUser;
          try {
            const profileRes = await userService.getProfile();
            resolvedUser = mergeProfileUser(keycloakUser, profileRes.data);
          } catch {
            resolvedUser = keycloakUser;
          }

          if (!mounted) return;
          setUser(resolvedUser);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(resolvedUser));

          if (sessionStorage.getItem(LOGIN_TOAST_KEY) === "true") {
            toast.success("Signed in successfully.");
            sessionStorage.removeItem(LOGIN_TOAST_KEY);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("user");
          localStorage.removeItem("token");

          if (sessionStorage.getItem(LOGOUT_TOAST_KEY) === "true") {
            toast.success("Signed out successfully.");
            sessionStorage.removeItem(LOGOUT_TOAST_KEY);
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthReady(true);
        }
      });

    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => {
      mounted = false;
      window.removeEventListener("auth:expired", handleAuthExpired);
    };
  }, []);

  const login = useCallback((redirectTo = "/") => {
    sessionStorage.setItem(LOGIN_TOAST_KEY, "true");
    return keycloak.login({ redirectUri: keycloakRedirectUri(redirectTo) });
  }, []);

  const register = useCallback(() => {
    return keycloak.register({ redirectUri: keycloakRedirectUri("/") });
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.setItem(LOGOUT_TOAST_KEY, "true");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    keycloak.logout({ redirectUri: keycloakRedirectUri("/") });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        authReady,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

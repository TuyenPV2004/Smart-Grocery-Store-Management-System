import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContextValue";
import {
  getKeycloakUser,
  initKeycloak,
  keycloak,
  keycloakRedirectUri,
} from "../services/keycloak";

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
      .then((authenticated) => {
        if (!mounted) return;

        if (authenticated) {
          const keycloakUser = getKeycloakUser();
          setUser(keycloakUser);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(keycloakUser));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
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
    return keycloak.login({ redirectUri: keycloakRedirectUri(redirectTo) });
  }, []);

  const register = useCallback(() => {
    return keycloak.register({ redirectUri: keycloakRedirectUri("/") });
  }, []);

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    keycloak.logout({ redirectUri: keycloakRedirectUri("/") });
  };

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

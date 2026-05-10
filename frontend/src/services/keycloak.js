import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8090",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "grocery",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "grocery-frontend",
});

let initPromise;

export const initKeycloak = () => {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }
  return initPromise;
};

export const getKeycloakToken = async () => {
  if (!keycloak.authenticated) {
    return null;
  }

  try {
    await keycloak.updateToken(30);
    return keycloak.token;
  } catch {
    return null;
  }
};

export const getKeycloakUser = () => {
  const token = keycloak.tokenParsed;
  if (!token) {
    return null;
  }

  const roles = token.realm_access?.roles || [];
  const role =
    ["ADMIN", "STAFF", "CUSTOMER"].find((candidate) =>
      roles.includes(candidate),
    ) || "CUSTOMER";

  return {
    id: token.sub,
    username: token.preferred_username || token.email || token.sub,
    email: token.email || "",
    fullName: token.name || token.preferred_username || "",
    role,
    roles,
  };
};

export const keycloakRedirectUri = (path = "/") =>
  new URL(path, window.location.origin).toString();

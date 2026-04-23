const BACKEND_URL = "http://localhost:8080/";

export const getImageUrl = (path, placeholder = null) => {
  if (!path) return placeholder;

  const normalizedPath = String(path);
  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("data:") ||
    normalizedPath.startsWith("blob:")
  ) {
    return normalizedPath;
  }

  return `${BACKEND_URL}${normalizedPath.replace(/^\/+/, "")}`;
};

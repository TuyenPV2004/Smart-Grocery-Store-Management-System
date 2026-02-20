import { useAuth } from "../context/AuthContext";
import MainLayout from "./MainLayout";
import PublicLayout from "./PublicLayout";

const RoleBasedLayout = () => {
  const { user } = useAuth();

  if (user?.role === "ADMIN" || user?.role === "STAFF") {
    return <MainLayout />;
  }

  return <PublicLayout />;
};

export default RoleBasedLayout;

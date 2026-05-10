import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/403" replace />; // Trang không có quyền
    }

    return <Outlet />; // Cho phép đi tiếp
};

export default ProtectedRoute;

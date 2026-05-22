import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ allowedRoles }) => {
    const { authReady, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!authReady) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/403" replace />; // Trang không có quyền
    }

    return <Outlet />; // Cho phép đi tiếp
};

export default ProtectedRoute;

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserListPage from "./pages/UserListPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import RegisterPage from "./pages/RegisterPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProductListPage from "./pages/ProductListPage";
import CategoryPage from "./pages/CategoryPage";
import InventoryEntryPage from "./pages/InventoryEntryPage";
import SupplierPage from "./pages/SupplierPage";
import InventoryListPage from "./pages/InventoryListPage";
import BatchListPage from "./pages/BatchListPage";
import InventoryExportPage from "./pages/InventoryExportPage";
import StockManagementPage from "./pages/StockManagementPage";
import PosPage from "./pages/PosPage";
import OrderManagementPage from "./pages/OrderManagementPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "STAFF"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/inventory/entry" element={<InventoryEntryPage />} />
            <Route path="/inventory/list" element={<InventoryListPage />} />
            <Route path="/inventory/batches" element={<BatchListPage />} />
            <Route path="/inventory/export" element={<InventoryExportPage />} />
            <Route path="/inventory/stock" element={<StockManagementPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/orders" element={<OrderManagementPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/users" element={<UserListPage />} />
            <Route path="/categories" element={<CategoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpVerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

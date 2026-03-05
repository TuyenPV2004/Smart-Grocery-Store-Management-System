import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartPage from "./pages/user/CartPage";
import LoginPage from "./pages/user/LoginPage";
import ProductDetailPage from "./pages/user/ProductDetailPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserListPage from "./pages/admin/UserListPage";
import ProfilePage from "./pages/user/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import RegisterPage from "./pages/user/RegisterPage";
import OtpVerifyPage from "./pages/user/OtpVerifyPage";
import ForgotPasswordPage from "./pages/user/ForgotPasswordPage";
import ProductListPage from "./pages/admin/ProductListPage";
import CustomerProductPage from "./pages/user/CustomerProductPage";
import CategoryPage from "./pages/admin/CategoryPage";
import InventoryEntryPage from "./pages/admin/InventoryEntryPage";
import SupplierPage from "./pages/admin/SupplierPage";
import InventoryListPage from "./pages/admin/InventoryListPage";
import BatchListPage from "./pages/admin/BatchListPage";
import InventoryExportPage from "./pages/admin/InventoryExportPage";
import StockManagementPage from "./pages/admin/StockManagementPage";
import PosPage from "./pages/admin/PosPage";
import OrderManagementPage from "./pages/admin/OrderManagementPage";
import HomePage from "./pages/user/HomePage";
import PublicLayout from "./components/PublicLayout";
import RoleBasedLayout from "./components/RoleBasedLayout";
import CashFlowManagementPage from "./pages/admin/CashFlowManagementPage";
import PromotionsPage from "./pages/admin/PromotionsPage";
import VouchersPage from "./pages/admin/VouchersPage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products" element={<CustomerProductPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleBasedLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/order-history" element={<OrderHistoryPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductListPage />} />
              <Route path="/suppliers" element={<SupplierPage />} />
              <Route path="/inventory/entry" element={<InventoryEntryPage />} />
              <Route path="/inventory/list" element={<InventoryListPage />} />
              <Route path="/inventory/batches" element={<BatchListPage />} />
              <Route
                path="/inventory/export"
                element={<InventoryExportPage />}
              />
              <Route
                path="/inventory/stock"
                element={<StockManagementPage />}
              />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/orders" element={<OrderManagementPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/users" element={<UserListPage />} />
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/cash-flow" element={<CashFlowManagementPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/vouchers" element={<VouchersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />{" "}
          {/* Redirect to Home instead of Login */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import DashboardPage from "./pages/DashboardPage";
import UserListPage from "./pages/UserListPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import RegisterPage from "./pages/RegisterPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProductListPage from "./pages/ProductListPage";
import CustomerProductPage from "./pages/CustomerProductPage";
import CategoryPage from "./pages/CategoryPage";
import InventoryEntryPage from "./pages/InventoryEntryPage";
import SupplierPage from "./pages/SupplierPage";
import InventoryListPage from "./pages/InventoryListPage";
import BatchListPage from "./pages/BatchListPage";
import InventoryExportPage from "./pages/InventoryExportPage";
import StockManagementPage from "./pages/StockManagementPage";
import PosPage from "./pages/PosPage";
import OrderManagementPage from "./pages/OrderManagementPage";
import HomePage from "./pages/HomePage";
import PublicLayout from "./components/PublicLayout";
import RoleBasedLayout from "./components/RoleBasedLayout";
import CashFlowManagementPage from "./pages/CashFlowManagementPage";
import PromotionsPage from "./pages/PromotionsPage";

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

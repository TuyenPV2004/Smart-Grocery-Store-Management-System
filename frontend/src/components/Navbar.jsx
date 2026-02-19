import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, ShoppingCart, LogOut, Search } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products" }, // Protected route
    { name: "Khuyến mãi", path: "/promotions" },
    { name: "Liên hệ", path: "/contact" },
  ];

  const getAvatarUrl = (path) => {
    if (!path) return null;
    return `http://localhost:8080/${path}`;
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200 group-hover:scale-105 transition-transform duration-300">
              G
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Grocery Store
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  location.pathname === link.path
                    ? "text-green-600 font-bold"
                    : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative">
              <ShoppingCart size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 hover:border-green-200 hover:bg-green-50/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-white shadow-sm group-hover:scale-105 transition-transform">
                    {user?.avatarUrl ? (
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-600 text-white font-bold text-xs">
                        {user?.fullName?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate mr-2">
                    {user?.fullName || "User"}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                  title="Đăng xuất"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-green-700 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute w-full left-0 shadow-xl animate-in slide-in-from-top-4">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block text-base font-medium ${
                  location.pathname === link.path
                    ? "text-green-600"
                    : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img
                          src={getAvatarUrl(user.avatarUrl)}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-600 text-white font-bold">
                          {user?.fullName?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {user?.fullName || "User"}
                      </p>
                      <p className="text-xs text-slate-500">Xem hồ sơ</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 text-center font-bold text-rose-600 border border-rose-100 bg-rose-50 rounded-xl"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 text-center font-bold text-slate-700 border border-slate-200 rounded-xl"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 text-center font-bold text-white bg-green-600 rounded-xl shadow-lg shadow-green-100"
                  >
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

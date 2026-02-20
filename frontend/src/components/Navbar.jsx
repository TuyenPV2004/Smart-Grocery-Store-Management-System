import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Menu, X, ShoppingCart, LogOut, Search, User } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const BACKEND_URL = "http://localhost:8080/";
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200 group-hover:scale-105 transition-transform duration-300">
              G
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Grocery Store
            </span>
          </Link>
          <div className="hidden md:flex flex-1 justify-center items-center px-8">
            {!isSearchOpen ? (
              <div className="flex items-center gap-8">
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
            ) : (
              <form
                onSubmit={handleSearch}
                className="w-full max-w-xl relative animate-in fade-in zoom-in-95 duration-200"
              >
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-12 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium text-slate-700"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                />
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      document.querySelector('input[type="text"]').focus();
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1 bg-white rounded-full shadow-sm border border-slate-100"
                >
                  <X size={16} />
                </button>
              </form>
            )}
          </div>
          <div className="hidden md:flex items-center gap-4">
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Search size={20} />
              </button>
            )}
            <Link
              to="/cart"
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 cursor-pointer"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={
                        user.avatarUrl.startsWith("http")
                          ? user.avatarUrl
                          : `${BACKEND_URL}${user.avatarUrl}`
                      }
                      alt={user.fullname || user.fullName || "Avatar"}
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                      <User size={20} />
                    </div>
                  )}
                  <div className="hidden md:flex flex-col">
                    <span className="font-medium text-slate-700 max-w-[100px] truncate leading-tight">
                      {user?.fullname || user?.fullName || "Tài khoản"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Xem hồ sơ
                    </span>
                  </div>
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
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
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
                    {user?.avatarUrl ? (
                      <img
                        src={
                          user.avatarUrl.startsWith("http")
                            ? user.avatarUrl
                            : `${BACKEND_URL}${user.avatarUrl}`
                        }
                        alt={user.fullname || user.fullName || "Avatar"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">
                        {user?.fullname || user?.fullName || "User"}
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

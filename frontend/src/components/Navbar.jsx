import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import productService from "../services/productService";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, addToCart, getProductPrice } = useCart();
  const BACKEND_URL = "http://localhost:8080/";
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSuggestionsLoading(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSearchOpen || !searchQuery.trim()) {
      setSearchSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const res = await productService.getAll({
          status: "ACTIVE",
          keyword: searchQuery.trim(),
          pageSize: 3,
        });
        const productList = res.data?.content || res.data || [];
        if (isMounted) {
          setSearchSuggestions(
            Array.isArray(productList) ? productList.slice(0, 3) : [],
          );
        }
      } catch (error) {
        if (isMounted) {
          setSearchSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [isSearchOpen, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchSuggestions([]);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/80x80?text=No+Image";
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}${path.replace(/^\/+/, "")}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const handleAddToCartFromSuggestion = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products" },
    ...(isAuthenticated ? [{ name: "Đơn hàng", path: "/order-history" }] : []),
    { name: "Khuyến mãi", path: "/promotions" },
    { name: "Liên hệ", path: "/contact" },
  ];

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}${path.replace(/^\/+/, "")}`;
  };

  const displayName = user?.fullname || user?.fullName || "Tài khoản";
  const displayRole = user?.role || "CUSTOMER";
  const isAdminUser = user?.role === "ADMIN";
  const roleTextClass =
    displayRole === "ADMIN"
      ? "text-rose-600"
      : displayRole === "STAFF"
        ? "text-blue-600"
        : "text-emerald-600";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-xl font-bold text-white shadow-lg shadow-green-200 transition-transform duration-300 group-hover:scale-105">
              G
            </div>
            <span className="bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent">
              Grocery Store
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center px-8 md:flex">
            {!isSearchOpen ? (
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      location.pathname === link.path
                        ? "font-bold text-green-600"
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
                className="relative w-full max-w-xl animate-in fade-in zoom-in-95 duration-200"
              >
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-12 font-medium text-slate-700 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                />
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchSuggestions([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-1 text-slate-400 shadow-sm transition-colors hover:text-rose-500"
                >
                  <X size={16} />
                </button>

                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                    {isSuggestionsLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Đang tìm sản phẩm...
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {searchSuggestions.map((product) => (
                          <li key={product.id}>
                            <Link
                              to={`/products/${product.id}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                            >
                              <img
                                src={getImageUrl(product.thumbnail)}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg border border-slate-100 object-cover"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {product.name}
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-green-600">
                                  {formatCurrency(getProductPrice(product))}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={(e) =>
                                  handleAddToCartFromSuggestion(e, product)
                                }
                                className="rounded-lg bg-[#15803D] p-2 text-white transition-colors hover:bg-[#166534]"
                                title="Thêm vào giỏ"
                              >
                                <ShoppingCart size={16} />
                              </button>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Không tìm thấy sản phẩm phù hợp.
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {!isSearchOpen && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
              >
                <Search size={20} />
              </button>
            )}

            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              )}
            </Link>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-all hover:bg-slate-50"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt={displayName}
                      className="h-10 w-10 rounded-full border-2 border-green-100 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500">
                      <User size={20} />
                    </div>
                  )}

                  <div className="hidden flex-col items-start md:flex">
                    <span className="max-w-[120px] truncate leading-tight text-slate-700">
                      {displayName}
                    </span>
                    <span className={`mt-1 text-[11px] font-semibold ${roleTextClass}`}>
                      {displayRole}
                    </span>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-400 transition-transform md:block ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:text-green-600"
                    >
                      <User size={18} className="text-slate-400" />
                      <span>Tài khoản</span>
                    </Link>

                    {isAdminUser && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:text-green-600"
                      >
                        <LayoutDashboard
                          size={18}
                          className="text-slate-400"
                        />
                        <span>Quản trị</span>
                      </Link>
                    )}

                    <Link
                      to="/order-history"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:text-green-600"
                    >
                      <ShoppingCart size={18} className="text-slate-400" />
                      <span>Đơn hàng</span>
                    </Link>

                    <div className="my-2 h-px bg-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
                    >
                      <LogOut size={18} className="text-rose-400" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:text-green-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 active:scale-95"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 w-full animate-in slide-in-from-top-4 border-t border-slate-100 bg-white shadow-xl md:hidden">
          <div className="space-y-4 px-6 py-4">
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
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt={displayName}
                        className="h-10 w-10 rounded-full border-2 border-green-100 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{displayName}</p>
                      <p className="text-xs text-slate-500">
                        Thông tin tài khoản
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full rounded-xl border border-rose-100 bg-rose-50 py-3 text-center font-bold text-rose-600"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl border border-slate-200 py-3 text-center font-bold text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl bg-green-600 py-3 text-center font-bold text-white shadow-lg shadow-green-100"
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

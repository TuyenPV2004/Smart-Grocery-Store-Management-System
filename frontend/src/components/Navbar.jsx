import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";
import productService from "../services/productService";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, addToCart, getProductPrice } = useCart();
  const BACKEND_URL =
    import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
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
      } catch {
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
      setIsOpen(false);
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
    { name: "Khuyến mãi", path: "/promotions" },
    ...(isAuthenticated ? [{ name: "Đơn hàng", path: "/order-history" }] : []),
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

  const renderSuggestions = () =>
    isSearchOpen &&
    searchQuery.trim() && (
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
                    <p className="truncate text-sm font-medium text-slate-800">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-green-600">
                      {formatCurrency(getProductPrice(product))}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCartFromSuggestion(e, product)}
                    className="rounded-lg bg-emerald-700 p-2 text-white transition-colors hover:bg-emerald-800"
                    title="Thêm vào giỏ"
                  >
                    <FiShoppingCart size={16} />
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
    );

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-10">
        <div className="flex min-h-20 items-center gap-4 lg:gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-200 transition-transform duration-300 group-hover:scale-105">
              G
            </div>
            <span className="whitespace-nowrap text-2xl font-bold tracking-tight text-slate-900">
              Grocery<span className="text-emerald-600">Store</span>
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="relative hidden w-full max-w-[360px] min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-3 pl-5 shadow-sm transition-all focus-within:border-emerald-300 focus-within:shadow-[0_10px_30px_rgba(16,185,129,0.12)] lg:flex"
          >
            <input
              type="text"
              placeholder="Search..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
            />
            <button
              type="submit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10521d] text-white transition-colors hover:bg-[#0c4217]"
              aria-label="Tìm kiếm"
            >
              <FiSearch size={16} />
            </button>
            {renderSuggestions()}
          </form>

          <div className="hidden shrink-0 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm lg:flex">
            <span className="flex h-10 items-center whitespace-nowrap">
              How do you want your items ?
            </span>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to="/products"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
              title="Wishlist"
            >
              <FiHeart size={20} />
              <div className="text-[10px] font-medium leading-tight">
                <div>Wishlist</div>
                <div>My Items</div>
              </div>
            </Link>

            <Link
              to="/order-history"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
              title="Track Orders"
            >
              <FiPackage size={20} />
              <div className="text-[10px] font-medium leading-tight">
                <div>Track</div>
                <div>Orders</div>
              </div>
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-2xl px-3 py-2 bg-slate-50 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              title="Shopping Cart"
            >
              <FiShoppingCart size={21} />
              <div className="text-[10px] font-medium leading-tight">
                <div>Shopping</div>
                <div>Cart</div>
              </div>
              {cartCount > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)}
                      alt={displayName}
                      className="h-7 w-7 rounded-full border-2 border-green-100 object-cover shadow-sm shrink-0"
                    />
                  ) : (
                    <FiUser size={20} className="shrink-0" />
                  )}

                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-[10px] font-medium leading-tight text-slate-700">
                      Sign In
                    </span>
                    <span
                      className={`text-[9px] font-medium ${roleTextClass}`}
                    >
                      {displayRole}
                    </span>
                  </div>

                  <FiChevronDown
                    size={14}
                    className={`hidden text-slate-400 transition-transform md:block shrink-0 ${
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
                      <FiUser size={18} className="text-slate-400" />
                      <span>Tài khoản</span>
                    </Link>

                    {isAdminUser && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:text-green-600"
                      >
                        <FiGrid size={18} className="text-slate-400" />
                        <span>Quản trị</span>
                      </Link>
                    )}

                    <Link
                      to="/order-history"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:text-green-600"
                    >
                      <FiShoppingBag size={18} className="text-slate-400" />
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
                      <FiLogOut size={18} className="text-rose-400" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                title="Sign In"
              >
                <FiUser size={20} />
                <div className="text-[10px] font-medium leading-tight">
                  <div>Sign In</div>
                  <div>Account</div>
                </div>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-slate-100 bg-[#10521d] lg:block">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] items-center gap-8 px-4 py-3 sm:px-6 xl:px-10">
          <p className="text-sm font-medium text-white">
            Save on summer sale. Up to 30% off!
          </p>

          <div className="flex items-center justify-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-white"
                    : "text-slate-200"
                } hover:text-white`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 text-right">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <FiMapPin size={19} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-300">Giao nhanh</p>
              <p className="text-sm font-bold text-white">Trong 2 giờ</p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 w-full animate-in slide-in-from-top-4 border-t border-slate-100 bg-white shadow-xl lg:hidden">
          <div className="space-y-4 px-6 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </form>

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
                        <FiUser size={20} />
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

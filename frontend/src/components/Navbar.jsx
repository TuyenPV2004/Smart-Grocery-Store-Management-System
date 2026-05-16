import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import productService from "../services/productService";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, addToCart, getProductPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const backendUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(isAuthenticated ? [{ name: "Orders", path: "/order-history" }] : []),
    { name: "Cart", path: "/cart" },
  ];

  useEffect(() => {
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
    setSearchQuery("");
    setSearchSuggestions([]);
    setIsSuggestionsLoading(false);
    setIsOpen(false);
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
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const res = await productService.getAll({
          status: "ACTIVE",
          keyword: searchQuery.trim(),
          pageSize: 3,
        });
        const productList = res.data?.content || res.data || [];
        if (isMounted) {
          setSearchSuggestions(Array.isArray(productList) ? productList.slice(0, 3) : []);
        }
      } catch {
        if (isMounted) setSearchSuggestions([]);
      } finally {
        if (isMounted) setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timerId);
    };
  }, [isSearchOpen, searchQuery]);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/80x80?text=No+Image";
    if (path.startsWith("http")) return path;
    return `${backendUrl}${path.replace(/^\/+/, "")}`;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
    setSearchSuggestions([]);
    setIsOpen(false);
  };

  const handleAddToCartFromSuggestion = (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
  };

  const rawAvatarUrl = user?.avatarUrl || user?.avatar_url || user?.avatar;
  const avatarUrl = rawAvatarUrl
    ? rawAvatarUrl.startsWith("http")
      ? rawAvatarUrl
      : `${backendUrl}${rawAvatarUrl.replace(/^\/+/, "")}`
    : null;
  const displayName =
    user?.fullName ||
    user?.fullname ||
    user?.name ||
    user?.username ||
    user?.email ||
    "Account";
  const isAdminUser = user?.role === "ADMIN";

  const renderSuggestions = () =>
    isSearchOpen && searchQuery.trim() ? (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        {isSuggestionsLoading ? (
          <div className="px-4 py-3 text-sm text-slate-500">Searching products...</div>
        ) : searchSuggestions.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {searchSuggestions.map((product) => (
              <li key={product.id}>
                <Link
                  to={`/products/${product.id}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-emerald-50/50"
                >
                  <img
                    src={getImageUrl(product.thumbnail)}
                    alt={product.name}
                    className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-emerald-700">
                      {formatCurrency(getProductPrice(product))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleAddToCartFromSuggestion(event, product)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white transition-colors hover:bg-emerald-800"
                    aria-label="Add to cart"
                  >
                    <FiShoppingCart size={16} />
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-3 text-sm text-slate-500">
            No matching products found.
          </div>
        )}
      </div>
    ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-10">
        <div className="flex min-h-20 items-center gap-4 lg:gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-bold text-white shadow-lg shadow-emerald-200 transition-transform duration-300 group-hover:scale-105">
              G
            </div>
            <span className="whitespace-nowrap text-2xl font-medium tracking-tight text-slate-900">
              Grocery<span className="text-emerald-700">Store</span>
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="relative hidden w-full max-w-[420px] min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-3 pl-5 shadow-sm transition-all focus-within:border-emerald-300 focus-within:shadow-[0_10px_30px_rgba(16,185,129,0.12)] lg:flex"
          >
            <input
              type="text"
              placeholder="Search fresh products..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
            />
            <button
              type="submit"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white transition-colors hover:bg-[#0c4217]"
              aria-label="Search"
            >
              <FiSearch size={16} />
            </button>
            {renderSuggestions()}
          </form>

          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to="/order-history"
              className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <FiPackage size={20} />
              <span className="text-xs font-medium">Track orders</span>
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <FiShoppingCart size={21} />
              <span className="text-xs font-medium">Cart</span>
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full border-2 border-emerald-100 object-cover" />
                  ) : (
                    <FiUser size={20} />
                  )}
                  <span className="max-w-[120px] truncate text-xs font-medium">{displayName}</span>
                  <FiChevronDown size={14} className={isUserMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>

                {isUserMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <MenuLink to="/profile" icon={FiUser} label="Account" onClick={() => setIsUserMenuOpen(false)} />
                    {isAdminUser ? (
                      <MenuLink to="/dashboard" icon={FiGrid} label="Admin" onClick={() => setIsUserMenuOpen(false)} />
                    ) : null}
                    <MenuLink to="/order-history" icon={FiShoppingBag} label="Orders" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="my-2 h-px bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <FiLogOut size={18} />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FiUser size={20} />
                <span className="text-xs font-medium">Sign in</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-slate-100 bg-[#047857] lg:block">
        <div className="mx-auto flex min-h-[60px] max-w-[1440px] items-center justify-between gap-8 px-4 py-4 sm:px-6 xl:px-10">
          <p className="text-base font-medium text-white xl:text-lg">Fast delivery within 2 hours for local orders.</p>
          <div className="flex items-center justify-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base font-medium transition-colors ${
                  location.pathname === link.path ? "text-white" : "text-emerald-100"
                } hover:text-white`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <p className="text-base font-medium text-white xl:text-lg">Fresh every day</p>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 w-full border-t border-slate-100 bg-white shadow-xl lg:hidden">
          <div className="space-y-4 px-6 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products"
                className="ui-input w-full pl-11"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block rounded-xl px-3 py-2 text-base font-medium ${
                  location.pathname === link.path ? "bg-emerald-50 text-emerald-700" : "text-slate-600"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-4">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-xl border border-rose-100 bg-rose-50 py-3 text-center font-medium text-rose-600"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block w-full rounded-xl bg-emerald-700 py-3 text-center font-medium text-white shadow-lg shadow-emerald-100"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

const MenuLink = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
  >
    {React.createElement(Icon, { size: 18, className: "text-slate-400" })}
    {label}
  </Link>
);

export default Navbar;

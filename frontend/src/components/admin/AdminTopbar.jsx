import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBell, FiSearch, FiX } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";

const ADMIN_PAGES = [
  {
    title: "Dashboard",
    description: "Overview, revenue, orders, and store metrics",
    path: "/dashboard",
    keywords: ["home", "overview", "analytics", "report"],
  },
  {
    title: "Product Catalog",
    description: "Products, SKU, barcode, price, and stock status",
    path: "/admin/products",
    keywords: ["product", "products", "catalog", "sku", "barcode", "inventory"],
  },
  {
    title: "Suppliers",
    description: "Supplier company, contact, logo, and linked products",
    path: "/suppliers",
    keywords: ["supplier", "suppliers", "vendor", "contact", "company"],
  },
  {
    title: "Inventory Entry",
    description: "Create import notes and add product batches",
    path: "/inventory/entry",
    keywords: ["import", "entry", "receive", "stock in", "nhap kho"],
  },
  {
    title: "Inventory Export",
    description: "Create export notes and select batches",
    path: "/inventory/export",
    keywords: ["export", "stock out", "xuat kho"],
  },
  {
    title: "Inventory Notes",
    description: "Import and export note history",
    path: "/inventory/list",
    keywords: ["notes", "history", "inventory list", "phieu"],
  },
  {
    title: "Inventory Batches",
    description: "Product lots, expiry dates, and available stock",
    path: "/inventory/batches",
    keywords: ["batch", "batches", "lot", "expiry", "hsd"],
  },
  {
    title: "Inventory Stock",
    description: "Stock summary, expiry batches, and stock cards",
    path: "/inventory/stock",
    keywords: ["stock", "summary", "stock card", "ton kho"],
  },
  {
    title: "Orders",
    description: "Order management, payment, and delivery status",
    path: "/orders",
    keywords: ["order", "orders", "payment", "delivery"],
  },
  {
    title: "Users",
    description: "Customers, staff, roles, and account status",
    path: "/users",
    keywords: ["user", "users", "customer", "staff", "account"],
  },
  {
    title: "Categories",
    description: "Product categories, labels, and hierarchy",
    path: "/categories",
    keywords: ["category", "categories", "label", "labels"],
  },
  {
    title: "Promotions",
    description: "Promotion campaigns and product discounts",
    path: "/promotions",
    keywords: ["promotion", "promotions", "campaign", "discount"],
  },
  {
    title: "Vouchers",
    description: "Voucher codes, conditions, and usage limits",
    path: "/vouchers",
    keywords: ["voucher", "vouchers", "coupon", "code"],
  },
  {
    title: "Customer Chat",
    description: "Customer support conversations",
    path: "/support/chat",
    keywords: ["chat", "support", "message", "customer chat"],
  },
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const AdminTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const backendUrl = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:8088/";
  const rawAvatarUrl = user?.avatarUrl || user?.avatar_url || user?.avatar;
  const avatarUrl = rawAvatarUrl
    ? rawAvatarUrl.startsWith("http")
      ? rawAvatarUrl
      : `${backendUrl}${rawAvatarUrl.replace(/^\/+/, "")}`
    : null;

  const matchingPages = useMemo(() => {
    const keyword = normalizeText(searchTerm.trim());
    if (!keyword) return ADMIN_PAGES.slice(0, 6);

    return ADMIN_PAGES.filter((page) => {
      const haystack = normalizeText([page.title, page.description, page.path, ...page.keywords].join(" "));
      return haystack.includes(keyword);
    }).slice(0, 8);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRef.current?.contains(event.target)) setIsSearchOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchTerm("");
  }, [location.pathname]);

  const goToPage = (page) => {
    navigate(page.path);
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const firstMatch = matchingPages[0];
    if (firstMatch) goToPage(firstMatch);
  };

  return (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
      <form ref={searchRef} onSubmit={handleSubmit} className="relative w-full lg:w-[360px]">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          placeholder="Search pages..."
          className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none ring-0 shadow-none transition-colors placeholder:text-slate-400 focus:border-slate-200 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setIsSearchOpen(true);
            }}
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
            aria-label="Clear search"
          >
            <FiX size={15} />
          </button>
        ) : null}

        {isSearchOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
            {matchingPages.length > 0 ? (
              <div className="max-h-[360px] overflow-y-auto scrollbar-hide p-2">
                {matchingPages.map((page) => {
                  const isCurrent = location.pathname === page.path;
                  return (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isCurrent ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-900">{page.title}</span>
                      <span className="mt-0.5 text-xs font-medium text-slate-500">{page.description}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-sm font-medium text-slate-500">No matching pages</div>
            )}
          </div>
        ) : null}
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
          aria-label="Notifications"
        >
          <FiBell size={20} />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.fullName || user?.username || "Admin"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                {(user?.fullName || user?.username || "A").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.fullName || user?.username || "Administrator"}
            </p>
            <p className="truncate text-xs font-medium text-slate-500">
              {user?.email || user?.username || "admin@store.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopbar;

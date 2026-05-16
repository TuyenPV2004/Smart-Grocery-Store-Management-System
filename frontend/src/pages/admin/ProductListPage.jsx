import { toast } from "react-toastify";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import productService from "../../services/productService";
import priceService from "../../services/priceService";
import ProductForm from "../../components/ProductForm";
import HistoryModal from "../../components/HistoryModal";
import PriceManagementModal from "../../components/PriceManagementModal";
import ProductImageModal from "../../components/ProductImageModal";
import { getImageUrl } from "../../utils/imageUrl";
import AdminTopbar from "../../components/admin/AdminTopbar";
import {
  FiPlus as Plus,
  FiSearch as Search,
  FiEdit2 as Edit,
  FiTrash2 as Trash2,
  FiInfo as Info,
  FiArrowUp as ArrowUp,
  FiArrowDown as ArrowDown,
  FiPackage as Package,
  FiArrowLeft as ArrowLeft,
  FiLayers as Layers,
  FiAlertTriangle as AlertTriangle,
  FiX as X,
  FiCheckCircle as CheckCircle,
  FiArchive as Archive,
  FiSearch as SearchIcon,
  FiAlertCircle as AlertCircle,
  FiBarChart2 as ChartNoAxesCombined,
  FiTrendingUp as TrendingUp,
  FiTrendingDown as TrendingDown,
  FiImage as ImageIcon,
  FiMoreHorizontal as MoreHorizontal,
} from "react-icons/fi";

const productMetricTone = {
  emerald: {
    accent: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  blue: { accent: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  amber: { accent: "bg-amber-50 text-amber-600", border: "border-amber-100" },
  rose: { accent: "bg-rose-50 text-rose-600", border: "border-rose-100" },
  violet: {
    accent: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
  },
};

const ProductMetricCard = ({ title, value, icon: Icon, tone }) => (
  <div
    className={`min-h-[124px] bg-white p-5 rounded-[2rem] border ${productMetricTone[tone].border} shadow-sm`}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <p className="truncate text-sm font-medium text-slate-500">{title}</p>
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${productMetricTone[tone].accent}`}
      >
        <Icon size={21} />
      </div>
    </div>
    <p className="truncate text-2xl font-medium text-slate-900">{value}</p>
  </div>
);

const normalizeProductList = (data) => {
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data)) return data;
  return [];
};

const resolveProductCategory = (product) => {
  const label = product?.labels?.[0];
  return label?.parent?.name || label?.name || "Uncategorized";
};

const buildProductMetrics = (items = []) => {
  const lowStockProducts = items.filter((product) => {
    const quantity = Number(product?.stockQuantity || 0);
    const minStock = Number(product?.minStock || 0);
    return product?.status !== "OUT_OF_STOCK" && minStock > 0 && quantity <= minStock;
  });
  const outOfStockProducts = items.filter(
    (product) =>
      product?.status === "OUT_OF_STOCK" || Number(product?.stockQuantity || 0) <= 0,
  );
  const categoryCounts = items.reduce((acc, product) => {
    const categoryName = resolveProductCategory(product);
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalProducts: items.length,
    lowStock: lowStockProducts.length,
    outOfStock: outOfStockProducts.length,
    topCategoryName: topCategory?.[0] || "N/A",
    topCategoryCount: topCategory?.[1] || 0,
  };
};

const INVENTORY_FILTERS = [
  { id: "ALL", label: "All Products" },
  { id: "IN_STOCK", label: "In Stock" },
  { id: "LOW_STOCK", label: "Low Stock" },
  { id: "OUT_OF_STOCK", label: "Out of Stock" },
];

const getInventoryFilterLabel = (filterId) =>
  INVENTORY_FILTERS.find((item) => item.id === filterId)?.label || "selected";

const isLowStockProduct = (product) => {
  const quantity = Number(product?.stockQuantity || 0);
  const minStock = Number(product?.minStock || 0);
  return product?.status !== "OUT_OF_STOCK" && minStock > 0 && quantity <= minStock;
};

// Product Check Modal Component
const ProductCheckModal = ({
  isOpen,
  onClose,
  onProductFound,
  onProductNotFound,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warning("Vui lòng nhập tên sản phẩm hoặc mã SKU!");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      // Get all products (without keyword filter) to search client-side
      const res = await productService.getAll({});

      if (!res || !res.data || !Array.isArray(res.data)) {
        setSearchResult(null);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      // Check SKU match (case-insensitive, partial match)
      let found = res.data.find(
        (p) => p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      // If not found, check case-insensitive name match
      if (!found) {
        found = res.data.find(
          (p) => p.name && p.name.toLowerCase() === searchTerm.toLowerCase(),
        );
      }

      setSearchResult(found || null);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching product:", error);
      setSearchResult(null);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseProduct = () => {
    onProductFound(searchResult);
    handleClose();
  };

  const handleAddNew = () => {
    onProductNotFound();
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResult(null);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[750px] max-h flex flex-col border border-green-200 animate-in zoom-in duration-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-green-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl text-green-600">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                Kiểm tra sản phẩm
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        <div className="px-8 py-5 flex-shrink-0 bg-slate-50/30 border-b border-green-100">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                Tên sản phẩm hoặc mã SKU
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-400 transition-all font-medium text-slate-900"
                placeholder="Nhập tên sản phẩm hoặc mã SKU"
                disabled={isSearching}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2 disabled:opacity-50 h-[48px]"
            >
              <Search size={18} />
              {isSearching ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
        </div>

        {/* Body - Results (Cuộn mượt mà bên trong) */}
        <div className="px-8 py-6 flex-auto min-h-0 overflow-y-auto custom-scrollbar">
          {hasSearched && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {searchResult ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle className="text-emerald-600" size={24} />
                    <h3 className="text-lg font-medium text-slate-900">
                      Đã tìm thấy sản phẩm!
                    </h3>
                  </div>

                  {/* Grid 2 cột cho thông tin chi tiết */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-2 gap-x-10 gap-y-6">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-900 font-medium mb-1">
                        Tên sản phẩm
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.name}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-900 font-medium mb-1">
                        Mã SKU
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.sku}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-900 font-medium mb-1">
                        Thương hiệu
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.brand || "---"}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-900 font-medium mb-1">
                        Giá nhập
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.importPrice?.toLocaleString() || "0"} ₫
                      </p>
                    </div>
                    <div className="col-span-2 pt-4 flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 px-6 py-3.5 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
                      >
                        Kiểm tra lại
                      </button>
                      <button
                        onClick={handleUseProduct}
                        className="flex-[2] px-6 py-3.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-100 active:scale-95"
                      >
                        Sử dụng sản phẩm này
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center">
                  <div className="inline-flex p-3 bg-amber-50 rounded-xl mb-4">
                    <AlertCircle className="text-amber-600" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Không tìm thấy sản phẩm
                  </h3>
                  <div className="mt-6 flex gap-3 max-w-md mx-auto">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
                    >
                      Kiểm tra lại
                    </button>
                    <button
                      onClick={handleAddNew}
                      className="flex-[2] px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium"
                    >
                      Thêm sản phẩm mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductListPage = () => {
  const location = useLocation();
  const productsPerPage = 8;
  const [products, setProducts] = useState([]);
  const [productMetrics, setProductMetrics] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    topCategoryName: "N/A",
    topCategoryCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filter, setFilter] = useState({ keyword: "", status: "" });
  const [inventoryFilter, setInventoryFilter] = useState("ALL");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [showModal, setShowModal] = useState(() =>
    Boolean(location.state?.openAddForm),
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [deleteStep, setDeleteStep] = useState(0);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isCheckModalOpen, setCheckModalOpen] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    if (location.state?.openAddForm) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!actionMenu) return undefined;

    const closeMenu = () => setActionMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(filter.keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [filter.keyword]);

  const fetchProducts = useCallback(async () => {
    try {
      if (inventoryFilter === "LOW_STOCK") {
        const res = await productService.getAll({
          keyword: debouncedKeyword,
          status: filter.status || undefined,
        });
        const filteredProducts = normalizeProductList(res.data).filter(isLowStockProduct);
        const startIndex = currentPage * productsPerPage;
        const pageItems = filteredProducts.slice(startIndex, startIndex + productsPerPage);

        setProducts(pageItems);
        setTotalPages(Math.ceil(filteredProducts.length / productsPerPage));
        setTotalProducts(filteredProducts.length);
        return;
      }

      const inventoryStatus =
        inventoryFilter === "IN_STOCK"
          ? "ACTIVE"
          : inventoryFilter === "OUT_OF_STOCK"
            ? "OUT_OF_STOCK"
            : filter.status;
      const res = await productService.getAll({
        keyword: debouncedKeyword,
        status: inventoryStatus,
        page: currentPage,
        size: productsPerPage,
      });
      const pageData =
        res.data && Array.isArray(res.data.content)
          ? res.data
          : {
              content: Array.isArray(res.data) ? res.data : [],
              totalPages: Array.isArray(res.data) && res.data.length > 0 ? 1 : 0,
              totalElements: Array.isArray(res.data) ? res.data.length : 0,
            };
      const productsData = pageData.content || [];

      const productsWithPriceChange = await Promise.all(
        productsData.map(async (product) => {
          try {
            const priceHistoryRes = await priceService.getPriceHistory(
              product.id,
            );
            const priceHistory = priceHistoryRes.data || [];

            let importPriceChangePercent = null;
            let sellPriceChangePercent = null;

            if (priceHistory.length > 0) {
              const latestImport = priceHistory.find(
                (h) => h.priceType === "IMPORT",
              );
              if (latestImport && latestImport.oldPrice > 0) {
                importPriceChangePercent =
                  ((latestImport.newPrice - latestImport.oldPrice) /
                    latestImport.oldPrice) *
                  100;
              }

              const latestSell = priceHistory.find(
                (h) => h.priceType === "SELL",
              );
              if (latestSell && latestSell.oldPrice > 0) {
                sellPriceChangePercent =
                  ((latestSell.newPrice - latestSell.oldPrice) /
                    latestSell.oldPrice) *
                  100;
              }
            }

            return {
              ...product,
              importPriceChangePercent,
              sellPriceChangePercent,
            };
          } catch {
            return {
              ...product,
              importPriceChangePercent: null,
              sellPriceChangePercent: null,
            };
          }
        }),
      );

      setProducts(productsWithPriceChange);
      setTotalPages(pageData.totalPages || 0);
      setTotalProducts(pageData.totalElements ?? productsData.length);
    } catch (error) {
      console.error("Lỗi tải sản phẩm", error);
    }
  }, [currentPage, debouncedKeyword, filter.status, inventoryFilter]);

  const fetchProductMetrics = useCallback(async () => {
    try {
      const res = await productService.getAll({});
      setProductMetrics(buildProductMetrics(normalizeProductList(res.data)));
    } catch (error) {
      console.error("Failed to load product metrics", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProductMetrics();
  }, [fetchProductMetrics]);

  const pageCount = totalPages;
  const currentProducts = products;

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteStep(1);
  };
  const handleSoftDelete = async () => {
    if (!productToDelete) return;
    try {
      const updatedProduct = { ...productToDelete, status: "INACTIVE" };
      await productService.update(productToDelete.id, updatedProduct, null);
      toast.success("Đã chuyển trạng thái sang ngừng kinh doanh!");
      setDeleteStep(0);
      setProductToDelete(null);
      fetchProducts();
      fetchProductMetrics();
    } catch (error) {
      toast.error("Lỗi cập nhật: " + (error.response?.data || "Có lỗi xảy ra"));
    }
  };

  const handleHardDeleteRequest = () => {
    setDeleteStep(2);
  };

  const handleHardDeleteExecute = async () => {
    if (!productToDelete) return;
    try {
      const res = await productService.delete(productToDelete.id);
      toast.info(res.data);
      setDeleteStep(0);
      setProductToDelete(null);
      fetchProducts();
      fetchProductMetrics();
    } catch (error) {
      toast.error("Lỗi xóa: " + (error.response?.data || "Có lỗi xảy ra"));
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteStep(0);
    setProductToDelete(null);
  };

  const handleProductFound = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleProductNotFound = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleViewHistory = async (productId) => {
    try {
      const res = await productService.getHistory(productId);
      setHistoryData(res.data);
      setShowHistoryModal(true);
    } catch {
      console.error("Lỗi tải lịch sử");
    }
  };

  const handleOpenPriceModal = (product) => {
    setSelectedProductForPrice(product);
    setShowPriceModal(true);
  };

  const handlePriceUpdated = () => {
    fetchProducts();
    fetchProductMetrics();
  };

  const openActionMenu = (event, product) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 196;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.product?.id === product.id
        ? null
        : {
            product,
            x: rect.left + rect.width / 2,
            y: shouldOpenUpward ? rect.top - gap : rect.bottom + gap,
            placement: shouldOpenUpward ? "top" : "bottom",
          },
    );
  };

  const runAction = (callback) => {
    setActionMenu(null);
    callback();
  };

  const handleSave = async (id, data, imageFile) => {
    try {
      if (id) {
        await productService.update(id, data, imageFile);
      } else {
        await productService.create(data, imageFile);
      }
      fetchProducts();
      fetchProductMetrics();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || "Vui lòng kiểm tra lại"));
      throw error;
    }
  };

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins antialiased text-slate-600 relative">
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 leading-none">
            Product Catalog
          </h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Search products by name, SKU, or barcode
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <ProductMetricCard
          title="Total Products"
          value={productMetrics.totalProducts}
          icon={Package}
          tone="emerald"
        />
        <ProductMetricCard
          title="Low Stock"
          value={productMetrics.lowStock}
          icon={AlertTriangle}
          tone="amber"
        />
        <ProductMetricCard
          title="Out of Stock"
          value={productMetrics.outOfStock}
          icon={Archive}
          tone="rose"
        />
        <ProductMetricCard
          title="Top Category"
          value={productMetrics.topCategoryName}
          icon={Layers}
          tone="blue"
        />
      </div>

      {/* Table Section */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-lg font-medium text-slate-900">
              Product Inventory
            </h3>
          </div>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {INVENTORY_FILTERS.map((item) => {
                const isActive = inventoryFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setInventoryFilter(item.id);
                      setCurrentPage(0);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={filter.keyword}
                  placeholder="Search..."
                  className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-slate-50"
                  onChange={(e) => {
                    setFilter({ ...filter, keyword: e.target.value });
                    setCurrentPage(0);
                  }}
                />
                {filter.keyword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter({ ...filter, keyword: "" });
                      setCurrentPage(0);
                    }}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>
              <button
                onClick={handleProductNotFound}
                className="rounded-full bg-green-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-green-700 whitespace-nowrap"
              >
                Add product
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-base font-medium text-slate-900">
                Product Name
              </th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">
                SKU
              </th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">
                Barcode
              </th>
              <th className="px-4 py-4 text-right text-base font-medium text-slate-900">
                <div className="flex flex-col items-center ml-auto w-fit">
                  <span className="block">Cost Price</span>
                </div>
              </th>
              <th className="px-4 py-4 text-right text-base font-medium text-slate-900">
                <div className="flex flex-col items-center ml-auto w-fit">
                  <span className="block">Selling Price</span>
                </div>
              </th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">
                Status
              </th>
              <th className="px-6 py-4 text-center text-base font-medium text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
              {currentProducts.length === 0 ? (
                <tr className="product-empty-row bg-white">
                  <td colSpan="7" className="px-6 py-14">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Package className="mb-4 text-slate-950" size={30} />
                      <h4 className="text-base font-medium text-slate-900">
                        No matching products
                      </h4>
                      <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                        There are no products in the {getInventoryFilterLabel(inventoryFilter).toLowerCase()} group.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
              currentProducts.map((p) => {
              return (
                <tr
                  key={p.id}
                  className="product-inventory-row transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center min-w-[200px]">
                      <img
                        className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                        src={
                          p.thumbnail
                            ? getImageUrl(p.thumbnail)
                            : "https://via.placeholder.com/40"
                        }
                        alt=""
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900 leading-tight">
                          {p.name}
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1">
                          {p.brand} - {p.unit}
                        </div>
                        {p.labels && p.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.labels.map((label) => (
                              <span
                                key={label.id}
                                className="px-2 py-0.5 rounded text-[10px] font-medium text-white shadow-sm"
                                style={{
                                  backgroundColor:
                                    label.labelColor || "#000000",
                                }}
                              >
                                {label.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {p.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">
                      {p.barcode}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {p.importPrice?.toLocaleString()} ₫
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {p.sellPrice?.toLocaleString()} ₫
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-medium rounded-full border shadow-sm
                      ${
                        p.status === "ACTIVE"
                          ? "bg-green-600 text-white border-green-700"
                          : p.status === "OUT_OF_STOCK"
                            ? "bg-orange-500 text-white border-orange-600"
                            : "bg-gray-500 text-white border-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(event) => openActionMenu(event, p)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        title="Actions"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionMenu ? (
        <div
          className={`fixed z-[80] !w-44 -translate-x-[calc(100%-1.25rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(100,116,139,0.22)] ring-1 ring-slate-300/45 ${
            actionMenu.placement === "top" ? "-translate-y-full" : ""
          }`}
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              runAction(() => {
                setSelectedProduct(actionMenu.product);
                setShowModal(true);
              })
            }
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Edit"
          >
            <Edit className="text-indigo-600" size={18} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() =>
              runAction(() => handleOpenPriceModal(actionMenu.product))
            }
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Manage price"
          >
            <ChartNoAxesCombined className="text-emerald-600" size={18} />
            <span>Manage price</span>
          </button>
          <button
            type="button"
            onClick={() =>
              runAction(() => {
                setSelectedProductForImage(actionMenu.product);
                setShowImageModal(true);
              })
            }
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Manage images"
          >
            <ImageIcon className="text-purple-600" size={18} />
            <span>Manage images</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDeleteClick(actionMenu.product))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Delete"
          >
            <Trash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleViewHistory(actionMenu.product.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="History"
          >
            <Info className="text-blue-500" size={19} />
            <span>History</span>
          </button>
        </div>
      ) : null}

      {/* --- CÁC MODAL XỬ LÝ XÓA --- */}

      {/* Modal Bước 1: Chọn Option */}
      {deleteStep === 1 && productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6 gap-3">
              <p className="text-slate-600">
                Bạn muốn xử lý sản phẩm này như thế nào ?
              </p>
              <button
                onClick={handleCloseDeleteModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSoftDelete}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-all group"
              >
                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-indigo-50">
                  <Archive
                    className="text-gray-600 group-hover:text-indigo-600"
                    size={20}
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-slate-900">
                    Chuyển sang ngừng kinh doanh
                  </div>
                  <div className="text-xs text-slate-500">
                    Giữ lại dữ liệu và chuyển trạng thái sản phẩm
                  </div>
                </div>
              </button>

              <button
                onClick={handleHardDeleteRequest}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-all group"
              >
                <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-100">
                  <Trash2 className="text-red-600" size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-red-600">Xóa vĩnh viễn</div>
                  <div className="text-xs text-slate-500">
                    Xóa vĩnh viễn khỏi hệ thống
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bước 2: Xác nhận Xóa vĩnh viễn */}
      {deleteStep === 2 && productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận xóa vĩnh viễn?
            </h3>

            <p className="text-slate-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm{" "}
              <span className="font-bold">{productToDelete.name}</span> không?
              <br />
              <br />
              <span className="text-red-500 italic text-xs">
                *Nếu sản phẩm đã có lịch sử nhập/xuất, hệ thống sẽ tự động
                chuyển sang trạng thái Ngừng kinh doanh để bảo toàn dữ liệu.*
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleHardDeleteExecute}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Page {Math.min(currentPage + 1, pageCount)}/{pageCount}
        </p>

        {pageCount > 1 && (
          <ReactPaginate
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={pageCount}
            previousLabel="<"
            forcePage={Math.min(currentPage, pageCount - 1)}
            renderOnZeroPageCount={null}
            containerClassName="flex items-center gap-1"
            pageClassName=""
            pageLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            previousClassName=""
            previousLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            nextClassName=""
            nextLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            breakClassName=""
            breakLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 text-sm font-medium"
            activeClassName=""
            activeLinkClassName="!bg-green-600 !text-white !border-green-600"
            disabledClassName="opacity-40 pointer-events-none"
          />
        )}
      </div>

      <ProductCheckModal
        isOpen={isCheckModalOpen}
        onClose={() => setCheckModalOpen(false)}
        onProductFound={handleProductFound}
        onProductNotFound={handleProductNotFound}
      />

      {showModal && (
        <ProductForm
          existingProduct={selectedProduct}
          onClose={() => setShowModal(false)}
          onSuccess={handleSave}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          history={historyData}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showPriceModal && (
        <PriceManagementModal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          product={selectedProductForPrice}
          onPriceUpdated={handlePriceUpdated}
        />
      )}

      {showImageModal && (
        <ProductImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          product={selectedProductForImage}
          onUpdate={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductListPage;

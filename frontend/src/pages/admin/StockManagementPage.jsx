import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiArchive,
  FiInfo,
  FiMoreHorizontal,
  FiPackage,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { PiPackageFill } from "react-icons/pi";
import { TiWarning } from "react-icons/ti";
import { RiErrorWarningFill } from "react-icons/ri";
import AppPagination from "../../components/common/AppPagination";
import stockService from "../../services/stockService";
import productService from "../../services/productService";
import { getImageUrl } from "../../utils/imageUrl";

const productMetricTone = {
  emerald: { accent: "text-emerald-600", border: "border-emerald-100" },
  amber: { accent: "text-amber-600", border: "border-amber-100" },
  rose: { accent: "text-rose-600", border: "border-rose-100" },
};

const ProductMetricCard = ({ title, value, icon: Icon, tone }) => (
  <div className={`min-h-[124px] rounded-[2rem] border ${productMetricTone[tone].border} bg-white p-5 shadow-sm`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="truncate text-base font-medium text-slate-500">{title}</p>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${productMetricTone[tone].accent}`}>
        <Icon size={32} />
      </div>
    </div>
    <p className="truncate text-2xl font-medium text-slate-900">{value}</p>
  </div>
);

const STOCK_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "NORMAL", label: "Normal" },
  { id: "LOW_STOCK", label: "Low Stock" },
  { id: "OUT_OF_STOCK", label: "Out of Stock" },
  { id: "NEAR_EXPIRY", label: "Near Expiry" },
];

const EXPIRY_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "SAFE", label: "Safe" },
  { id: "EXPIRING_SOON", label: "Expiring Soon" },
  { id: "EXPIRED", label: "Expired" },
];

const STATUS_META = {
  NORMAL: { label: "Normal", className: "bg-emerald-600 text-white border-emerald-700" },
  LOW_STOCK: { label: "Low stock", className: "bg-orange-500 text-white border-orange-600" },
  OUT_OF_STOCK: { label: "Out of stock", className: "bg-red-600 text-white border-red-700" },
  NEAR_EXPIRY: { label: "Near expiry", className: "bg-amber-500 text-white border-amber-600" },
  SAFE: { label: "Safe", className: "bg-emerald-600 text-white border-emerald-700" },
  EXPIRING_SOON: { label: "Expiring soon", className: "bg-amber-500 text-white border-amber-600" },
  EXPIRED: { label: "Expired", className: "bg-red-600 text-white border-red-700" },
};

const ITEMS_PER_PAGE = 10;

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
const formatDate = (value) => {
  if (!value) return "---";
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const formatDateTime = (value) => {
  if (!value) return "---";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeProductList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const buildProductLookup = (products) =>
  products.reduce(
    (lookup, product) => {
      if (product?.id != null) lookup.byId.set(String(product.id), product);
      if (product?.sku) lookup.bySku.set(String(product.sku).toLowerCase(), product);
      return lookup;
    },
    { byId: new Map(), bySku: new Map() },
  );

const hydrateStockItem = (item, lookup) => {
  const product = lookup.byId.get(String(item.productId)) || lookup.bySku.get(String(item.sku || "").toLowerCase());
  if (!product) return item;

  return {
    ...item,
    productName: product.name || item.productName,
    sku: product.sku || item.sku,
    unit: product.unit || item.unit,
    brand: product.brand || item.brand,
    thumbnail: product.thumbnail || item.thumbnail,
  };
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.NORMAL;
  return (
    <span className={`inline-flex min-w-[96px] items-center justify-center rounded-full border px-2 py-1 text-xs font-medium shadow-sm ${meta.className}`}>
      {meta.label}
    </span>
  );
};

const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [stats, setStats] = useState({ totalValue: 0, expiringBatches: 0, lowStockItems: 0 });
  const [stockData, setStockData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchStatusFilter, setBatchStatusFilter] = useState("ALL");
  const [selectedProductForCard, setSelectedProductForCard] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [batchPage, setBatchPage] = useState(0);
  const [actionMenu, setActionMenu] = useState(null);

  const getProductLookup = async () => {
    try {
      const response = await productService.getAll({ pageSize: 1000 });
      return buildProductLookup(normalizeProductList(response.data));
    } catch (error) {
      console.warn("Unable to hydrate stock products:", error);
      return buildProductLookup([]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await stockService.getDashboardStats();
      setStats(response.data || { totalValue: 0, expiringBatches: 0, lowStockItems: 0 });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchStockSummary = async () => {
    try {
      setLoading(true);
      const [summaryResponse, lookup] = await Promise.all([stockService.getSummary(), getProductLookup()]);
      setStockData((summaryResponse.data || []).map((item) => hydrateStockItem(item, lookup)));
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      toast.error("Unable to load stock summary.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setBatchLoading(true);
      const [batchResponse, lookup] = await Promise.all([
        stockService.getBatchesWithExpiry(batchStatusFilter === "ALL" ? "" : batchStatusFilter),
        getProductLookup(),
      ]);
      const hydrated = (batchResponse.data || []).map((batch) => {
        const product = lookup.bySku.get(String(batch.sku || "").toLowerCase());
        return {
          ...batch,
          productName: product?.name || batch.productName,
          sku: product?.sku || batch.sku,
          unit: product?.unit || "",
          brand: product?.brand || "",
          thumbnail: product?.thumbnail || "",
        };
      });
      setBatchData(hydrated);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Unable to load expiry batches.");
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchStockSummary();
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [batchStatusFilter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setBatchPage(0);
  }, [batchSearchTerm, batchStatusFilter]);

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
    const fetchStockHistory = async () => {
      if (!selectedProductForCard) {
        setStockHistory([]);
        return;
      }
      try {
        setCardLoading(true);
        const response = await stockService.getStockCard(selectedProductForCard);
        setStockHistory(response.data || []);
      } catch (error) {
        console.error("Error fetching stock history:", error);
        toast.error("Unable to load stock card.");
      } finally {
        setCardLoading(false);
      }
    };

    fetchStockHistory();
  }, [selectedProductForCard]);

  const filteredStockData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return stockData.filter((item) => {
      const matchesSearch =
        !keyword ||
        String(item.productName || "").toLowerCase().includes(keyword) ||
        String(item.sku || "").toLowerCase().includes(keyword) ||
        String(item.brand || "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stockData, searchTerm, statusFilter]);

  const filteredBatchData = useMemo(() => {
    const keyword = batchSearchTerm.trim().toLowerCase();
    return batchData.filter(
      (item) =>
        !keyword ||
        String(item.productName || "").toLowerCase().includes(keyword) ||
        String(item.batchCode || "").toLowerCase().includes(keyword) ||
        String(item.sku || "").toLowerCase().includes(keyword),
    );
  }, [batchData, batchSearchTerm]);

  const stockPageCount = Math.max(1, Math.ceil(filteredStockData.length / ITEMS_PER_PAGE));
  const batchPageCount = Math.max(1, Math.ceil(filteredBatchData.length / ITEMS_PER_PAGE));
  const currentStockData = filteredStockData.slice(currentPage * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const currentBatchData = filteredBatchData.slice(batchPage * ITEMS_PER_PAGE, batchPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > stockPageCount - 1) setCurrentPage(stockPageCount - 1);
  }, [currentPage, stockPageCount]);

  useEffect(() => {
    if (batchPage > batchPageCount - 1) setBatchPage(batchPageCount - 1);
  }, [batchPage, batchPageCount]);

  const getFilterCount = (filterId) => {
    if (filterId === "ALL") return stockData.length;
    return stockData.filter((item) => item.status === filterId).length;
  };

  const getBatchFilterCount = (filterId) => {
    if (filterId === "ALL") return batchData.length;
    return batchData.filter((item) => item.status === filterId).length;
  };

  const selectedProductInfo = stockData.find((item) => String(item.productId) === String(selectedProductForCard));

  const handleDeleteProduct = async (product) => {
    const result = await Swal.fire({
      title: "Delete product?",
      text: `Delete "${product.productName}" permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await productService.delete(product.productId);
      toast.success("Product deleted.");
      fetchStockSummary();
      fetchDashboardStats();
    } catch (error) {
      toast.error(`Unable to delete product: ${error.response?.data || error.message}`);
    }
  };

  const openActionMenu = (event, product) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 88;
    const gap = 8;
    const shouldOpenUpward = rect.bottom + gap + menuEstimatedHeight > window.innerHeight;
    setActionMenu((current) =>
      current?.product?.productId === product.productId
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

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins text-slate-600">
      <div className="mx-auto mb-6 max-w-[1400px]">
        <h1 className="text-2xl font-medium text-slate-900">Inventory Stock</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">Track stock value, expiry risk, and product movement.</p>
      </div>

      <div className="mx-auto mb-6 grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-3">
        <ProductMetricCard title="Total Value" value={formatMoney(stats.totalValue)} icon={PiPackageFill} tone="emerald" />
        <ProductMetricCard title="Expiring Batches" value={stats.expiringBatches} icon={TiWarning} tone="amber" />
        <ProductMetricCard title="Low Stock Items" value={stats.lowStockItems} icon={RiErrorWarningFill} tone="rose" />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {activeTab === "summary" ? (
          <SummaryTab
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            filters={STOCK_FILTERS}
            getFilterCount={getFilterCount}
            items={currentStockData}
            totalItems={filteredStockData.length}
            pageCount={stockPageCount}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            openActionMenu={openActionMenu}
            onView={(productId) => {
              setSelectedProductForCard(productId);
              setActiveTab("card");
            }}
          />
        ) : null}

        {activeTab === "batches" ? (
          <BatchesTab
            loading={batchLoading}
            searchTerm={batchSearchTerm}
            setSearchTerm={setBatchSearchTerm}
            statusFilter={batchStatusFilter}
            setStatusFilter={setBatchStatusFilter}
            filters={EXPIRY_FILTERS}
            getFilterCount={getBatchFilterCount}
            items={currentBatchData}
            totalItems={filteredBatchData.length}
            pageCount={batchPageCount}
            currentPage={batchPage}
            setCurrentPage={setBatchPage}
          />
        ) : null}

        {activeTab === "card" ? (
          <StockCardTab
            products={stockData}
            selectedProduct={selectedProductForCard}
            setSelectedProduct={setSelectedProductForCard}
            selectedProductInfo={selectedProductInfo}
            loading={cardLoading}
            stockHistory={stockHistory}
          />
        ) : null}
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
                setSelectedProductForCard(actionMenu.product.productId);
                setActiveTab("card");
              })
            }
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiInfo className="text-blue-500" size={18} />
            <span>Stock card</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDeleteProduct(actionMenu.product))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

const SummaryTab = ({
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filters,
  getFilterCount,
  items,
  totalItems,
  pageCount,
  currentPage,
  setCurrentPage,
  openActionMenu,
}) => (
  <>
    <div className="border-b border-slate-100 px-6 py-5">
      <h3 className="text-lg font-medium text-slate-900">Stock Summary</h3>
      <FilterToolbar
        filters={filters}
        activeFilter={statusFilter}
        setActiveFilter={setStatusFilter}
        getFilterCount={getFilterCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
    {loading ? (
      <div className="p-8 text-center text-slate-500">Loading data</div>
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Product</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Imported</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Exported</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Stock</th>
                <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Value</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Nearest Expiry</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Status</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <EmptyRow colSpan={8} title="No matching stock items" description="Try changing the status filter or search keyword." />
              ) : (
                items.map((item) => (
                  <tr key={item.productId} className="product-inventory-row transition-colors">
                    <td className="px-6 py-4">
                      <ProductCell item={item} />
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">{formatNumber(item.totalImported)}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">{formatNumber(item.totalExported)}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">{formatNumber(item.totalQuantity)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">{formatMoney(item.stockValue)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-slate-800">{formatDate(item.nearestExpiryDate)}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={(event) => openActionMenu(event, item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        title="Actions"
                      >
                        <FiMoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 ? <PaginationFooter currentPage={currentPage} pageCount={pageCount} setCurrentPage={setCurrentPage} /> : null}
      </>
    )}
  </>
);

const BatchesTab = ({
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filters,
  getFilterCount,
  items,
  totalItems,
  pageCount,
  currentPage,
  setCurrentPage,
}) => (
  <>
    <div className="border-b border-slate-100 px-6 py-5">
      <h3 className="text-lg font-medium text-slate-900">Expiry Batches</h3>
      <FilterToolbar
        filters={filters}
        activeFilter={statusFilter}
        setActiveFilter={setStatusFilter}
        getFilterCount={getFilterCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
    {loading ? (
      <div className="p-8 text-center text-slate-500">Loading data</div>
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Product</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Batch Code</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Quantity</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">MFG</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Expiry</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <EmptyRow colSpan={6} title="No matching batches" description="Try changing the expiry filter or search keyword." />
              ) : (
                items.map((batch) => (
                  <tr key={batch.batchId} className="product-inventory-row transition-colors">
                    <td className="px-6 py-4">
                      <ProductCell item={{ ...batch, productName: batch.productName, brand: batch.brand, thumbnail: batch.thumbnail, unit: batch.unit }} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{batch.batchCode || "---"}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-900">{formatNumber(batch.quantity)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-slate-800">{formatDate(batch.manufacturingDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-slate-800">{formatDate(batch.expiryDate)}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={batch.status} />
                      {batch.status === "EXPIRING_SOON" ? (
                        <div className="mt-1 text-xs font-medium text-amber-600">{batch.daysUntilExpiry} days left</div>
                      ) : null}
                      {batch.status === "EXPIRED" ? (
                        <div className="mt-1 text-xs font-medium text-red-600">{Math.abs(batch.daysUntilExpiry || 0)} days ago</div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 ? <PaginationFooter currentPage={currentPage} pageCount={pageCount} setCurrentPage={setCurrentPage} /> : null}
      </>
    )}
  </>
);

const StockCardTab = ({ products, selectedProduct, setSelectedProduct, selectedProductInfo, loading, stockHistory }) => (
  <div className="px-6 py-5">
    <h3 className="text-lg font-medium text-slate-900">Stock Card</h3>
    <div className="mt-5 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-4">
      <label className="mb-2 block text-sm font-medium text-slate-600">Product</label>
      <select
        value={selectedProduct}
        onChange={(event) => setSelectedProduct(event.target.value)}
        className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-300"
      >
        <option value="">Select product</option>
        {products.map((product) => (
          <option key={product.productId} value={product.productId}>
            [{product.sku}] {product.productName} - Stock: {product.totalQuantity}
          </option>
        ))}
      </select>

      {selectedProductInfo ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <InfoTile label="Current stock" value={formatNumber(selectedProductInfo.totalQuantity)} />
          <InfoTile label="Stock value" value={formatMoney(selectedProductInfo.stockValue)} />
          <InfoTile label="Unit" value={selectedProductInfo.unit || "---"} />
          <InfoTile label="Status" value={STATUS_META[selectedProductInfo.status]?.label || selectedProductInfo.status} />
        </div>
      ) : null}
    </div>

    {!selectedProduct ? (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <FiArchive className="mx-auto mb-4 text-slate-950" size={30} />
        <p className="font-medium text-slate-900">Select a product to view movement history</p>
      </div>
    ) : loading ? (
      <div className="p-8 text-center text-slate-500">Loading data</div>
    ) : (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="product-inventory-table w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-base font-medium text-slate-900">Time</th>
              <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Type</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Note</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Batch</th>
              <th className="px-6 py-4 text-base font-medium text-slate-900">Description</th>
              <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Change</th>
              <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stockHistory.length === 0 ? (
              <EmptyRow colSpan={7} title="No stock movements" description="This product does not have stock card history yet." />
            ) : (
              stockHistory.map((record, index) => (
                <tr key={`${record.noteCode}-${index}`} className="product-inventory-row transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">{formatDateTime(record.transactionDate)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex min-w-[84px] justify-center rounded-full border px-2 py-1 text-xs font-medium shadow-sm ${
                        record.transactionType === "IMPORT"
                          ? "border-emerald-700 bg-emerald-600 text-white"
                          : "border-red-700 bg-red-600 text-white"
                      }`}
                    >
                      {record.transactionType === "IMPORT" ? "Import" : "Export"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{record.noteCode || "---"}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{record.batchCode || "---"}</td>
                  <td className="px-6 py-4 text-slate-700">{record.description || "---"}</td>
                  <td className="px-6 py-4 text-center font-medium">
                    <span className={record.quantityChange > 0 ? "text-emerald-600" : "text-red-600"}>
                      {record.quantityChange > 0 ? "+" : ""}
                      {formatNumber(record.quantityChange)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-900">{formatNumber(record.runningBalance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const FilterToolbar = ({ filters, activeFilter, setActiveFilter, getFilterCount, searchTerm, setSearchTerm }) => (
  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActiveFilter(item.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            activeFilter === item.id ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {item.label} {getFilterCount(item.id)}
        </button>
      ))}
    </div>
    <div className="relative w-full lg:w-[420px]">
      <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search..."
        className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-slate-50"
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={() => setSearchTerm("")}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
          aria-label="Clear search"
        >
          <FiX size={15} />
        </button>
      ) : null}
    </div>
  </div>
);

const ProductCell = ({ item }) => {
  const thumbnail = item.thumbnail;
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <img
        src={thumbnail ? getImageUrl(thumbnail) : "https://via.placeholder.com/40"}
        alt=""
        className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
        onError={(event) => {
          event.currentTarget.src = "https://via.placeholder.com/40";
        }}
      />
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight text-slate-900">{item.productName || "---"}</div>
        <div className="mt-1 text-sm font-medium text-slate-500">{item.sku || "---"}</div>
        {item.brand ? <div className="mt-1 text-xs font-medium text-slate-500">{item.brand}</div> : null}
      </div>
    </div>
  );
};

const EmptyRow = ({ colSpan, title, description }) => (
  <tr className="product-empty-row bg-white">
    <td colSpan={colSpan} className="px-6 py-14">
      <div className="flex flex-col items-center justify-center text-center">
        <FiPackage className="mb-4 text-slate-950" size={30} />
        <h4 className="text-base font-medium text-slate-900">{title}</h4>
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">{description}</p>
      </div>
    </td>
  </tr>
);

const PaginationFooter = ({ currentPage, pageCount, setCurrentPage }) => (
  <div className="border-t border-slate-100 bg-white px-6 py-4">
    <AppPagination
      currentPage={currentPage}
      pageCount={pageCount}
      onPageChange={setCurrentPage}
      pageRangeDisplayed={4}
      marginPagesDisplayed={1}
    />
  </div>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-3">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-medium text-slate-900">{value}</p>
  </div>
);

export default StockManagementPage;

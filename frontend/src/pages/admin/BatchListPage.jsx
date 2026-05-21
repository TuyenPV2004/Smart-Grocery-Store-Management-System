import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiMoreHorizontal,
  FiPackage,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import AppPagination from "../../components/common/AppPagination";
import batchService from "../../services/batchService";
import productService from "../../services/productService";
import supplierService from "../../services/supplierService";
import { getImageUrl } from "../../utils/imageUrl";
import { StatusBadge } from "../../components/ui";
import { FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "good", label: "Good" },
  { id: "near-expiry", label: "Near Expiry" },
  { id: "expired", label: "Expired" },
  { id: "unknown", label: "Unknown" },
];

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatDate = (value) => {
  if (!value) return "---";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getProductName = (batch) => batch?.product?.name || batch?.productName || "---";
const getProductSku = (batch) => batch?.product?.sku || batch?.productSku || "---";
const getProductUnit = (batch) => batch?.product?.unit || batch?.productUnit || "";
const getProductBrand = (batch) => batch?.product?.brand || batch?.productBrand || "";
const getProductThumbnail = (batch) =>
  batch?.product?.thumbnail ||
  batch?.productThumbnail ||
  batch?.thumbnail ||
  batch?.product?.imageUrl ||
  "";

const UNIT_FIXES = {
  "Th?ng": "Thùng",
  "H?p": "Hộp",
  "C?i": "Cái",
  "L?c": "Lốc",
  "?on v?": "đơn vị",
};

const getImportUnit = (batch) => {
  const unit = String(batch?.importUnit || "").trim();
  return UNIT_FIXES[unit] || unit || getProductUnit(batch) || "";
};
const getSupplierName = (batch) =>
  batch?.supplier?.vietnameseName ||
  batch?.supplier?.englishName ||
  batch?.supplierName ||
  "---";

const getConversionRate = (batch) => {
  const rate = Number(batch?.conversionRate || 1);
  return rate > 0 ? rate : 1;
};

const getImportedQuantity = (batch) => {
  if (batch?.quantityInImportUnit != null) return Number(batch.quantityInImportUnit);
  if (batch?.initialQuantity != null) return Number(batch.initialQuantity) / getConversionRate(batch);
  if (batch?.quantity != null) return Number(batch.quantity) / getConversionRate(batch);
  return 0;
};

const getAvailableQuantity = (batch) => {
  if (batch?.quantity != null) return Number(batch.quantity) / getConversionRate(batch);
  if (batch?.availableQty != null) return Number(batch.availableQty) / getConversionRate(batch);
  return 0;
};

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });

const getBatchProductId = (batch) => batch?.productId || batch?.product_id || batch?.product?.id || null;

const normalizeLookupKey = (value) => String(value || "").trim().toLowerCase();

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
      if (product?.sku) lookup.bySku.set(normalizeLookupKey(product.sku), product);
      return lookup;
    },
    { byId: new Map(), bySku: new Map() },
  );

const normalizeSupplierList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const buildSupplierLookup = (suppliers) =>
  suppliers.reduce(
    (lookup, supplier) => {
      if (supplier?.id != null) lookup.byId.set(String(supplier.id), supplier);
      if (supplier?.code) lookup.byCode.set(normalizeLookupKey(supplier.code), supplier);
      return lookup;
    },
    { byId: new Map(), byCode: new Map() },
  );

const resolveCatalogSupplier = (batch, lookup) => {
  const supplierId = batch?.supplierId || batch?.supplier_id || batch?.supplier?.id;
  const supplierCode = normalizeLookupKey(batch?.supplierCode || batch?.supplier_code || batch?.supplier?.code);

  if (supplierId && lookup.byId.has(String(supplierId))) return lookup.byId.get(String(supplierId));
  if (supplierCode && lookup.byCode.has(supplierCode)) return lookup.byCode.get(supplierCode);
  return null;
};

const resolveCatalogProduct = (batch, lookup) => {
  const productId = getBatchProductId(batch);
  const productSku = normalizeLookupKey(getProductSku(batch));

  if (productId && lookup.byId.has(String(productId))) return lookup.byId.get(String(productId));
  if (productSku && lookup.bySku.has(productSku)) return lookup.bySku.get(productSku);
  return null;
};

const hydrateBatch = (batch, productLookup, supplierLookup) => {
  const catalogProduct = resolveCatalogProduct(batch, productLookup);
  const catalogSupplier = resolveCatalogSupplier(batch, supplierLookup);

  return {
    ...batch,
    productId: getBatchProductId(batch) || catalogProduct?.id,
    productName: catalogProduct?.name || batch.productName,
    productSku: catalogProduct?.sku || batch.productSku,
    productUnit: catalogProduct?.unit || batch.productUnit,
    productBrand: catalogProduct?.brand || batch.productBrand,
    productThumbnail: catalogProduct?.thumbnail || batch.productThumbnail,
    supplierId: batch.supplierId || catalogSupplier?.id,
    supplierCode: catalogSupplier?.code || batch.supplierCode,
    supplierName: catalogSupplier?.vietnameseName || batch.supplierName,
    product: {
      ...(batch.product || {}),
      id: batch.product?.id || catalogProduct?.id,
      name: catalogProduct?.name || batch.product?.name,
      sku: catalogProduct?.sku || batch.product?.sku,
      unit: catalogProduct?.unit || batch.product?.unit,
      brand: catalogProduct?.brand || batch.product?.brand,
      thumbnail: catalogProduct?.thumbnail || batch.product?.thumbnail,
    },
    supplier: {
      ...(batch.supplier || {}),
      id: batch.supplier?.id || catalogSupplier?.id,
      code: catalogSupplier?.code || batch.supplier?.code || batch.supplierCode,
      vietnameseName: catalogSupplier?.vietnameseName || batch.supplier?.vietnameseName || batch.supplierName,
      englishName: catalogSupplier?.englishName || batch.supplier?.englishName,
    },
  };
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return {
      status: "unknown",
      tone: "slate",
      icon: FaExclamationCircle,
      text: "Unknown",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      tone: "rose",
      icon: FaExclamationCircle,
      text: "Expired",
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      status: "near-expiry",
      tone: "amber",
      icon: FaClock,
      text: "Near expiry",
    };
  }

  return {
    status: "good",
    tone: "emerald",
    icon: FaCheckCircle,
    text: "Good",
  };
};

const DetailModal = ({ isOpen, onClose, batch }) => {
  if (!isOpen || !batch) return null;

  const thumbnail = getProductThumbnail(batch);
  const expiryStatus = getExpiryStatus(batch.expiryDate);
  const StatusIcon = expiryStatus.icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <PhotoProvider>
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
            <h3 className="text-lg font-medium text-slate-800">Batch detail: {batch.batchCode}</h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <FiX size={24} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6 scrollbar-hide">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <PhotoView src={thumbnail ? getImageUrl(thumbnail) : "https://via.placeholder.com/80"}>
                  <img
                    src={thumbnail ? getImageUrl(thumbnail) : "https://via.placeholder.com/80"}
                    alt=""
                    className="h-full w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = "https://via.placeholder.com/80";
                    }}
                  />
                </PhotoView>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium leading-tight text-slate-900">{getProductName(batch)}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{getProductSku(batch)}</p>
              </div>
              <StatusBadge tone={expiryStatus.tone} className="w-fit gap-1 py-1 shadow-sm">
                <StatusIcon size={13} />
                {expiryStatus.text}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-4">
              <InfoTile label="Inventory note" value={batch.inventoryNote?.code || "---"} />
              <InfoTile label="Supplier" value={getSupplierName(batch)} />
              <InfoTile
                label="Unit"
                value={`${getImportUnit(batch) || "---"}${getConversionRate(batch) > 1 ? ` x ${getConversionRate(batch)}` : ""}`}
              />
              <InfoTile label="Manufacturing date" value={formatDate(batch.manufacturingDate)} />
              <InfoTile label="Expiry date" value={formatDate(batch.expiryDate)} />
              <InfoTile
                label="Imported quantity"
                value={`${formatQuantity(getImportedQuantity(batch))} ${getImportUnit(batch)}`}
              />
              <InfoTile
                label="Available stock"
                value={`${formatQuantity(getAvailableQuantity(batch))} ${getImportUnit(batch)}`}
              />
              <InfoTile label="Conversion rate" value={batch.conversionRate || 1} />
              <InfoTile label="Import price" value={formatMoney((batch.importPrice || 0) * (batch.conversionRate || 1))} />
            </div>
          </div>
        </div>
      </PhotoProvider>
    </div>
  );
};

const BatchListPage = () => {
  const batchesPerPage = 10;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBatches, setTotalBatches] = useState(0);
  const [filterCounts, setFilterCounts] = useState({ ALL: 0, good: 0, "near-expiry": 0, expired: 0, unknown: 0 });
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBatches();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchFilterCounts();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, statusFilter]);

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

  const normalizeBatchResponse = (data) => {
    const content = Array.isArray(data) ? data : data?.content || [];
    return {
      content,
      totalElements: data?.totalElements ?? content.length,
      totalPages: data?.totalPages ?? Math.max(1, Math.ceil(content.length / batchesPerPage)),
    };
  };

  const getProductLookup = async () => {
    try {
      const response = await productService.getAll({ pageSize: 1000 });
      return buildProductLookup(normalizeProductList(response.data));
    } catch (error) {
      console.warn("Unable to hydrate batches with catalog products:", error);
      return buildProductLookup([]);
    }
  };

  const getSupplierLookup = async () => {
    try {
      const response = await supplierService.getAll();
      return buildSupplierLookup(normalizeSupplierList(response.data));
    } catch (error) {
      console.warn("Unable to hydrate batches with catalog suppliers:", error);
      return buildSupplierLookup([]);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const [response, productLookup, supplierLookup] = await Promise.all([
        batchService.getAll(currentPage, batchesPerPage, debouncedSearchTerm, statusFilter),
        getProductLookup(),
        getSupplierLookup(),
      ]);
      const data = normalizeBatchResponse(response.data);
      setBatches(data.content.map((batch) => hydrateBatch(batch, productLookup, supplierLookup)));
      setTotalPages(Math.max(1, data.totalPages));
      setTotalBatches(data.totalElements);
    } catch (error) {
      console.error("Failed to load batches:", error);
      toast.error("Unable to load batches.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterCounts = async () => {
    try {
      const responses = await Promise.all(
        FILTERS.map(async (filter) => {
          const response = await batchService.getAll(0, 1, debouncedSearchTerm, filter.id);
          const data = normalizeBatchResponse(response.data);
          return [filter.id, data.totalElements];
        }),
      );
      setFilterCounts(Object.fromEntries(responses));
    } catch (error) {
      console.warn("Unable to load batch filter counts:", error);
    }
  };

  const handleViewDetail = async (batch) => {
    try {
      const [response, productLookup, supplierLookup] = await Promise.all([
        batchService.getById(batch.id),
        getProductLookup(),
        getSupplierLookup(),
      ]);
      setSelectedBatch(hydrateBatch(response.data || batch, productLookup, supplierLookup));
    } catch {
      setSelectedBatch(batch);
    }
    setIsModalOpen(true);
  };

  const handleDeleteBatch = async (batchId) => {
    const result = await Swal.fire({
      title: "Delete batch?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await batchService.deleteBatch(batchId);
      toast.success("Batch deleted.");
      fetchBatches();
      fetchFilterCounts();
    } catch (error) {
      toast.error(`Unable to delete batch: ${error.response?.data || error.message}`);
    }
  };

  const openActionMenu = (event, batch) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 88;
    const gap = 8;
    const shouldOpenUpward = rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.batch?.id === batch.id
        ? null
        : {
            batch,
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
        <h1 className="text-2xl font-medium text-slate-900">Inventory Batches</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Track product lots, expiry dates, suppliers, and available stock.
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-medium text-slate-900">Batch Inventory</h3>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((item) => {
                const isActive = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label} {filterCounts[item.id] ?? 0}
                  </button>
                );
              })}
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
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading data</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <PhotoProvider>
                <table className="product-inventory-table w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-base font-medium text-slate-900">Product</th>
                      <th className="px-6 py-4 text-base font-medium text-slate-900">Inventory Note</th>
                      <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Quantity</th>
                      <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Import Price</th>
                      <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Expiry</th>
                      <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Status</th>
                      <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {batches.length === 0 ? (
                      <tr className="product-empty-row bg-white">
                        <td colSpan="7" className="px-6 py-14">
                          <div className="flex flex-col items-center justify-center text-center">
                            <FiPackage className="mb-4 text-slate-950" size={30} />
                            <h4 className="text-base font-medium text-slate-900">No matching batches</h4>
                            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                              Try changing the status filter or search keyword.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => {
                        const expiryStatus = getExpiryStatus(batch.expiryDate);
                        const StatusIcon = expiryStatus.icon;
                        const thumbnail = getProductThumbnail(batch);

                        return (
                          <tr key={batch.id} className="product-inventory-row transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex min-w-[240px] items-center gap-3">
                                <PhotoView src={thumbnail ? getImageUrl(thumbnail) : "https://via.placeholder.com/40"}>
                                  <img
                                    src={thumbnail ? getImageUrl(thumbnail) : "https://via.placeholder.com/40"}
                                    alt=""
                                    className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 object-cover transition-all hover:opacity-80"
                                    onError={(event) => {
                                      event.currentTarget.src = "https://via.placeholder.com/40";
                                    }}
                                  />
                                </PhotoView>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium leading-tight text-slate-900">{getProductName(batch)}</div>
                                  <div className="mt-1 text-sm font-medium text-slate-500">
                                    {getProductSku(batch)}
                                  </div>
                                  {getProductBrand(batch) ? (
                                    <div className="mt-1 text-xs font-medium text-slate-500">{getProductBrand(batch)}</div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{batch.inventoryNote?.code || "---"}</td>
                            <td className="px-6 py-4 text-center font-medium text-slate-900">
                              <div>{formatQuantity(getImportedQuantity(batch))} {getImportUnit(batch)}</div>
                              <div className="mt-1 text-xs font-medium text-slate-500">
                                Stock: {formatQuantity(getAvailableQuantity(batch))} {getImportUnit(batch)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">
                              {formatMoney((batch.importPrice || 0) * (batch.conversionRate || 1))}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-slate-800">
                              {formatDate(batch.expiryDate)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge tone={expiryStatus.tone} className="min-w-[108px] justify-center gap-1 py-1 shadow-sm">
                                <StatusIcon size={12} />
                                {expiryStatus.text}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={(event) => openActionMenu(event, batch)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                  title="Actions"
                                >
                                  <FiMoreHorizontal size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </PhotoProvider>
            </div>

            {totalBatches > 0 ? (
              <div className="border-t border-slate-100 bg-white px-6 py-4">
                <AppPagination
                  currentPage={currentPage}
                  pageCount={totalPages}
                  onPageChange={setCurrentPage}
                  pageRangeDisplayed={4}
                  marginPagesDisplayed={1}
                />
              </div>
            ) : null}
          </>
        )}
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
            onClick={() => runAction(() => handleViewDetail(actionMenu.batch))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiEye className="text-blue-500" size={18} />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDeleteBatch(actionMenu.batch.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} batch={selectedBatch} />
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div>
    <p className="mb-2 text-base font-medium text-slate-500">{label}</p>
    <p className="font-medium text-slate-700">{value}</p>
  </div>
);

export default BatchListPage;

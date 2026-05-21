import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiClipboard,
  FiEye,
  FiFileText,
  FiMoreHorizontal,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaCalendarAlt, FaUserCheck, FaUser, FaCheckCircle, FaFileAlt } from "react-icons/fa";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import AppPagination from "../../components/common/AppPagination";
import inventoryService from "../../services/inventoryService";
import productService from "../../services/productService";
import { getImageUrl } from "../../utils/imageUrl";

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

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

const getNoteType = (note) => {
  if (note?.type) {
    const normalizedType = String(note.type).toUpperCase();
    if (normalizedType.includes("EXP") || normalizedType.includes("EXPORT")) return "EXP";
    if (normalizedType.includes("IMP") || normalizedType.includes("IMPORT")) return "IMP";
  }

  return String(note?.code || "").toUpperCase().startsWith("EXP") ? "EXP" : "IMP";
};

const getDetailThumbnail = (detail) =>
  detail?.productThumbnail ||
  detail?.product_thumbnail ||
  detail?.productThumbnailUrl ||
  detail?.thumbnailUrl ||
  detail?.thumbnail ||
  detail?.imageUrl ||
  detail?.productImage ||
  detail?.product?.thumbnail ||
  detail?.product?.productThumbnail ||
  detail?.product?.thumbnailUrl ||
  detail?.product?.imageUrl ||
  detail?.product?.image ||
  "";

const getDetailProductId = (detail) =>
  detail?.productId || detail?.product_id || detail?.product?.id || null;

const getDetailSku = (detail) =>
  detail?.productSku || detail?.product_sku || detail?.sku || detail?.product?.sku || "";

const getDetailName = (detail) =>
  detail?.productName || detail?.product_name || detail?.name || detail?.product?.name || "";

const getProductThumbnail = (product) =>
  product?.thumbnail ||
  product?.productThumbnail ||
  product?.thumbnailUrl ||
  product?.imageUrl ||
  product?.image ||
  "";

const normalizeLookupKey = (value) => String(value || "").trim().toLowerCase();

const normalizeProductList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const resolveProductForDetail = (detail, lookup) => {
  const productId = getDetailProductId(detail);
  const productSku = normalizeLookupKey(getDetailSku(detail));
  const productName = normalizeLookupKey(getDetailName(detail));

  if (productId && lookup.byId.has(String(productId))) return lookup.byId.get(String(productId));
  if (productSku && lookup.bySku.has(productSku)) return lookup.bySku.get(productSku);
  if (productName && lookup.byName.has(productName)) return lookup.byName.get(productName);

  return null;
};

const DetailModal = ({ isOpen, onClose, note }) => {
  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <PhotoProvider>
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
            <h3 className="text-lg font-medium text-slate-800">
              Inventory note: {note.code}
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <FiX size={24} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide p-6">
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-4">
              <InfoTile label="Created at" value={formatDateTime(note.createdAt)} icon={FaCalendarAlt} />
              <InfoTile label="Staff code" value={note.createdBy?.staffCode || "---"} icon={FaUserCheck} />
              <InfoTile label="Creator" value={note.createdBy?.fullName || "---"} icon={FaUser} />
              <InfoTile label="Status" value={note.status || "Completed"} icon={FaCheckCircle} />
              <div className="col-span-full border-t border-slate-200 pt-3">
                <p className="text-base font-medium text-slate-500 flex items-center gap-1.5">
                  <FaFileAlt size={16} className="text-green-600" />
                  Note
                </p>
                <p className="font-medium italic text-slate-700 mt-1">{note.note || "No note"}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
              <table className="product-inventory-table w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-4 text-left font-medium first:pl-6">Product</th>
                    <th className="whitespace-nowrap px-4 py-4 text-left font-medium">SKU</th>
                    <th className="px-4 py-4 text-center font-medium">Unit</th>
                    <th className="whitespace-nowrap px-4 py-4 text-center font-medium">Quantity</th>
                    <th className="whitespace-nowrap px-4 py-4 text-center font-medium">Rate</th>
                    <th className="whitespace-nowrap px-4 py-4 text-right font-medium">Price</th>
                    <th className="whitespace-nowrap px-4 py-4 text-right font-medium first:pr-6">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(note.details || []).map((detail, index) => (
                    <tr key={index} className="product-inventory-row transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <PhotoView
                              src={
                                getDetailThumbnail(detail)
                                  ? getImageUrl(getDetailThumbnail(detail))
                                  : "https://via.placeholder.com/40"
                              }
                            >
                              <img
                                src={
                                  getDetailThumbnail(detail)
                                    ? getImageUrl(getDetailThumbnail(detail))
                                    : "https://via.placeholder.com/40"
                                }
                                alt=""
                                className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                                onError={(event) => {
                                  event.currentTarget.src = "https://via.placeholder.com/40";
                                }}
                              />
                            </PhotoView>
                          </div>
                          <div className="font-medium leading-tight text-slate-900">
                            {detail.product?.name || detail.productName || "---"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <span className="whitespace-nowrap text-[13px] font-medium text-slate-900">
                          {detail.product?.sku || detail.productSku || "---"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-900">{detail.importUnit}</td>
                      <td className="px-4 py-4 text-center font-medium text-slate-900">{detail.quantityInImportUnit}</td>
                      <td className="px-4 py-4 text-center font-medium text-slate-900">{detail.conversionRate || 1}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-slate-900">
                        {Number(detail.importPrice || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-slate-900">
                        {Number(
                          (detail.conversionRate || 1) *
                            (detail.importPrice || 0) *
                            (detail.quantityInImportUnit || 0),
                        ).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white p-6">
            <div className="font-medium text-slate-600">
              Total products: <span>{note.details?.length || 0}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-slate-600">Final amount:</span>
              <span className="text-lg font-medium text-slate-600">{formatMoney(note.finalAmount)}</span>
            </div>
          </div>
        </div>
      </PhotoProvider>
    </div>
  );
};

const InventoryListPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const itemsPerPage = 10;

  const fetchNotes = async () => {
    try {
      const response = await inventoryService.getAll();
      setNotes(response.data || []);
    } catch (error) {
      console.error("Failed to load inventory notes:", error);
      toast.error("Unable to load inventory notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

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

  const handleViewDetail = async (id) => {
    try {
      const response = await inventoryService.getById(id);
      const note = response.data;
      const details = note?.details || [];

      if (details.length > 0) {
        try {
          const productResponse = await productService.getAll({ pageSize: 1000 });
          const products = normalizeProductList(productResponse.data);
          const productLookup = products.reduce(
            (lookup, product) => {
              if (product?.id != null) lookup.byId.set(String(product.id), product);
              if (product?.sku) lookup.bySku.set(normalizeLookupKey(product.sku), product);
              if (product?.name) lookup.byName.set(normalizeLookupKey(product.name), product);
              return lookup;
            },
            { byId: new Map(), bySku: new Map(), byName: new Map() },
          );

          note.details = details.map((detail) => {
            const product = resolveProductForDetail(detail, productLookup);
            const catalogThumbnail = getProductThumbnail(product);
            const currentThumbnail = getDetailThumbnail(detail);
            const thumbnail = catalogThumbnail || currentThumbnail;

            return {
              ...detail,
              productThumbnail: thumbnail,
              product: {
                ...(detail.product || {}),
                id: detail.product?.id || product?.id || getDetailProductId(detail),
                sku: detail.product?.sku || product?.sku || getDetailSku(detail),
                name: detail.product?.name || product?.name || getDetailName(detail),
                thumbnail,
              },
            };
          });
        } catch (error) {
          console.warn("Unable to hydrate inventory note product thumbnails:", error);
        }
      }

      setSelectedNote(note);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(`Unable to load note detail: ${error.message}`);
    }
  };

  const handleExport = async (id, code) => {
    try {
      const response = await inventoryService.exportExcel(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", code ? `${code}.xlsx` : `InventoryNote_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(`Unable to export file: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete note?",
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
      await inventoryService.delete(id);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      toast.success("Inventory note deleted.");
    } catch (error) {
      toast.error(`Unable to delete note: ${error.response?.data || error.message}`);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const keyword = searchTerm.trim().toLowerCase();
    const createdAt = note?.createdAt ? new Date(note.createdAt) : null;
    const matchesSearch =
      !keyword ||
      String(note?.code || "").toLowerCase().includes(keyword) ||
      String(note?.createdBy?.staffCode || "").toLowerCase().includes(keyword) ||
      String(note?.createdBy?.fullName || "").toLowerCase().includes(keyword);
    const noteType = getNoteType(note);
    const matchesType = typeFilter === "ALL" || noteType === typeFilter;

    let matchesTime = true;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (timeFilter === "TODAY") {
        matchesTime = createdAt >= startToday;
      } else if (timeFilter === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(startToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        matchesTime = createdAt >= sevenDaysAgo;
      } else if (timeFilter === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date(startToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        matchesTime = createdAt >= thirtyDaysAgo;
      } else if (timeFilter === "THIS_MONTH") {
        matchesTime =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();
      }
    } else if (timeFilter !== "ALL") {
      matchesTime = false;
    }

    return matchesSearch && matchesType && matchesTime;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, timeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + itemsPerPage);

  const getTypeFilterCount = (type) => {
    if (type === "ALL") return notes.length;
    return notes.filter((note) => getNoteType(note) === type).length;
  };

  const openActionMenu = (event, note) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 124;
    const gap = 8;
    const shouldOpenUpward = rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.note?.id === note.id
        ? null
        : {
            note,
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
        <h1 className="text-2xl font-medium text-slate-900">Inventory Notes</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Track import and export inventory notes.
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-medium text-slate-900">Inventory List</h3>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: "All" },
                { id: "IMP", label: "Import" },
                { id: "EXP", label: "Export" },
              ].map((item) => {
                const isActive = typeFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTypeFilter(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label} {getTypeFilterCount(item.id)}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[420px]">
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

              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-300 focus:bg-slate-50 sm:w-[190px]"
              >
                <option value="ALL">All time</option>
                <option value="TODAY">Today</option>
                <option value="LAST_7_DAYS">Last 7 days</option>
                <option value="LAST_30_DAYS">Last 30 days</option>
                <option value="THIS_MONTH">This month</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading data</div>
        ) : (
          <>
            <table className="product-inventory-table w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-base font-medium text-slate-900">Code</th>
                  <th className="px-6 py-4 text-base font-medium text-slate-900">Created at</th>
                  <th className="px-6 py-4 text-base font-medium text-slate-900">Staff code</th>
                  <th className="px-6 py-4 text-base font-medium text-slate-900">Creator</th>
                  <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Final amount</th>
                  <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedNotes.map((note) => {
                  const isExport = getNoteType(note) === "EXP";

                  return (
                    <tr key={note.id} className="product-inventory-row transition-colors">
                      <td className={`px-6 py-4 font-medium ${isExport ? "text-amber-600" : "text-green-600"}`}>
                        {note.code}
                      </td>
                      <td className="px-6 py-4 text-slate-800">{formatDateTime(note.createdAt)}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{note.createdBy?.staffCode || "---"}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{note.createdBy?.fullName || "---"}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">{formatMoney(note.finalAmount)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(event) => openActionMenu(event, note)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            title="Actions"
                          >
                            <FiMoreHorizontal size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredNotes.length === 0 ? (
                  <tr className="product-empty-row bg-white">
                    <td colSpan="6" className="px-6 py-14">
                      <div className="flex flex-col items-center justify-center text-center">
                        <FiClipboard className="mb-4 text-slate-950" size={30} />
                        <h4 className="text-base font-medium text-slate-900">No matching inventory notes</h4>
                        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                          Try changing the type, time filter, or search keyword.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

          </>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mx-auto max-w-[1400px]">
          <AppPagination
            currentPage={currentPage - 1}
            pageCount={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            pageRangeDisplayed={4}
            marginPagesDisplayed={1}
          />
        </div>
      ) : null}

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
            onClick={() => runAction(() => handleExport(actionMenu.note.id, actionMenu.note.code))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiFileText className="text-emerald-600" size={18} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleViewDetail(actionMenu.note.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiEye className="text-blue-500" size={18} />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDelete(actionMenu.note.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} note={selectedNote} />
    </div>
  );
};

const InfoTile = ({ label, value, icon: Icon }) => (
  <div>
    <p className="mb-2 text-base font-medium text-slate-500 flex items-center gap-1.5">
      {Icon && <Icon size={16} className="text-green-600" />}
      {label}
    </p>
    <p className="font-medium text-slate-700">{value}</p>
  </div>
);

export default InventoryListPage;

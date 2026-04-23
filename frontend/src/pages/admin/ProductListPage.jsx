import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import productService from "../../services/productService";
import priceService from "../../services/priceService";
import ProductForm from "../../components/ProductForm";
import HistoryModal from "../../components/HistoryModal";
import PriceManagementModal from "../../components/PriceManagementModal";
import ProductImageModal from "../../components/ProductImageModal";
import { getImageUrl } from "../../utils/imageUrl";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Info,
  ArrowUp,
  ArrowDown,
  Package,
  ArrowLeft,
  Layers,
  AlertTriangle,
  X,
  CheckCircle,
  Archive,
  Search as SearchIcon,
  AlertCircle,
  ChartNoAxesCombined,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
} from "lucide-react";

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

  const handleCheckAgain = () => {
    setSearchTerm("");
    setSearchResult(null);
    setHasSearched(false);
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
  const navigate = useNavigate();
  const location = useLocation();
  const productsPerPage = 10;
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filter, setFilter] = useState({ keyword: "", status: "" });
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
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

  // Auto-open add form if navigated from inventory entry
  useEffect(() => {
    if (location.state?.openAddForm) {
      setShowModal(true);
      setSelectedProduct(null);
      // Clear the state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(filter.keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [filter.keyword]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedKeyword, filter.status]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filter.keyword, filter.status]);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll({
        keyword: debouncedKeyword,
        status: filter.status,
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
          } catch (error) {
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
  };

  const calculateMargin = (importPrice, sellPrice) => {
    if (!importPrice || importPrice === 0) return 0;
    const margin = ((sellPrice - importPrice) / importPrice) * 100;
    return margin.toFixed(1);
  };

  const pageCount = totalPages;
  const currentProducts = products;

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount - 1) {
      setCurrentPage(pageCount - 1);
    }
  }, [pageCount, currentPage]);

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
    } catch (error) {
      console.error("Lỗi tải lịch sử");
    }
  };

  const handleOpenPriceModal = (product) => {
    setSelectedProductForPrice(product);
    setShowPriceModal(true);
  };

  const handlePriceUpdated = () => {
    fetchProducts();
  };

  const handleSave = async (id, data, imageFile) => {
    try {
      if (id) {
        await productService.update(id, data, imageFile);
      } else {
        await productService.create(data, imageFile);
      }
      fetchProducts();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || "Vui lòng kiểm tra lại"));
      throw error;
    }
  };

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins antialiased text-slate-600 relative">
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 leading-none">
              Quản lý sản phẩm
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Tìm kiếm theo tên sản phẩm hoặc mã SKU
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-[1400px] mx-auto mb-6 flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-[420px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã SKU, Barcode"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all font-medium"
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          />
        </div>
        <select
          className="order-3 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none font-medium text-slate-600 bg-white cursor-pointer"
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang kinh doanh</option>
          <option value="INACTIVE">Ngừng kinh doanh</option>
          <option value="OUT_OF_STOCK">Hết hàng</option>
        </select>
        <button
          onClick={handleProductNotFound}
          className="order-2 ml-auto bg-green-600 text-white px-5 py-2 rounded-xl flex items-center shadow-sm hover:bg-green-700 transition-all font-medium whitespace-nowrap"
        >
          Thêm sản phẩm
        </button>
      </div>

      {/* Table Section */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-sm font-medium text-slate-900">
                Tên sản phẩm
              </th>
              <th className="px-6 py-4 text-sm font-medium text-slate-900">
                Mã SKU
              </th>
              <th className="px-6 py-4 text-sm font-medium text-slate-900">
                Barcode
              </th>
              <th className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                <div className="flex flex-col items-center ml-auto w-fit">
                  <span className="block">Giá nhập</span>
                </div>
              </th>
              <th className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                <div className="flex flex-col items-center ml-auto w-fit">
                  <span className="block">Giá bán</span>
                </div>
              </th>
              <th className="px-6 py-4 text-sm font-medium text-slate-900">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-center text-sm font-medium text-slate-900">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
              {currentProducts.map((p) => {
              const margin = calculateMargin(p.importPrice, p.sellPrice);
              const isProfit = margin >= 0;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 transition-colors"
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
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleOpenPriceModal(p)}
                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                        title="Quản lý giá"
                      >
                        <ChartNoAxesCombined size={18} />
                      </button>

                      {/* Quản lý ảnh sản phẩm */}
                      <button
                        onClick={() => {
                          setSelectedProductForImage(p);
                          setShowImageModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="Quản lý ảnh sản phẩm"
                      >
                        <ImageIcon size={18} />
                      </button>

                      {/* Nút Xóa Mới */}
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={() => handleViewHistory(p.id)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Lịch sử"
                      >
                        <Info size={19} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

      <div className="max-w-[1400px] mx-auto mt-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium shadow-sm">
          <span>Tổng sản phẩm:</span>
          <span className="text-slate-900">{totalProducts}</span>
        </div>

        {pageCount > 1 && (
          <ReactPaginate
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={pageCount}
            previousLabel="<"
            forcePage={currentPage}
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

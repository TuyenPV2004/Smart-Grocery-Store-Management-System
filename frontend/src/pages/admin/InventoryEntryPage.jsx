import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus as Plus,
  FiTrash2 as Trash2,
  FiFileText as FileSpreadsheet,
  FiSave as Save,
  FiPackage as PackagePlus,
  FiX as X,
  FiImage as ImageIcon,
  FiSearch as Search,
  FiUser as User,
  FiCalendar as Calendar,
  FiFileText as FileText,
  FiDownload as Import,
  FiSmile as Smile,
  FiShuffle as Dices,
  FiCheckCircle as CheckCircle,
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiClipboard as ClipboardPenLine,
  FiUpload as Upload,
  FiAlertCircle as AlertCircle,
  FiChevronUp as ChevronUp,
  FiEdit2 as Pencil,
  FiFile as FileCheck2,
} from "react-icons/fi";
import { getImageUrl } from "../../utils/imageUrl";
import Swal from "sweetalert2";
import productService from "../../services/productService";
import userService from "../../services/userService";
import supplierService from "../../services/supplierService";
import inventoryService from "../../services/inventoryService";
import batchService from "../../services/batchService";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    * {
      font-family: 'Poppins', sans-serif !important;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
  `}</style>
);

const createImportCode = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const dateString = localDate.toISOString().slice(2, 10).replace(/-/g, "");
  return "IMP" + dateString + "-" + Math.floor(Math.random() * 1000);
};

// Product Check Modal Component
const ProductCheckModal = ({
  isOpen,
  searchKeyword,
  onClose,
  onProductFound,
  onProductNotFound,
}) => {
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (keyword) => {
    const normalizedKeyword = (keyword || "").trim();
    if (!normalizedKeyword) return;

    setIsSearching(true);
    setHasSearched(false);

    try {
      // Get all products (without keyword filter) to search client-side
      const res = await productService.getAll({});

      // Safety check for res.data
      if (!res || !res.data || !Array.isArray(res.data)) {
        setSearchResult(null);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      // Check SKU match (case-insensitive, partial match)
      let found = res.data.find(
        (p) =>
          p.sku &&
          p.sku.toLowerCase().includes(normalizedKeyword.toLowerCase()),
      );

      // If not found, check case-insensitive name match
      if (!found) {
        found = res.data.find(
          (p) =>
            p.name && p.name.toLowerCase() === normalizedKeyword.toLowerCase(),
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

  useEffect(() => {
    if (!isOpen) return;

    const normalizedKeyword = (searchKeyword || "").trim();
    if (!normalizedKeyword) {
      setSearchResult(null);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    handleSearch(normalizedKeyword);
  }, [isOpen, searchKeyword]);

  const handleUseProduct = () => {
    onProductFound(searchResult);
    handleClose();
  };

  const handleAddNew = () => {
    onProductNotFound();
    handleClose();
  };

  const handleClose = () => {
    setSearchResult(null);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[750px] max-h flex flex-col border border-slate-200 animate-in zoom-in duration-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                Kiểm tra sản phẩm
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-green-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body - Results (Cuộn mượt mà bên trong) */}
        <div className="px-8 py-6 flex-auto min-h-0 overflow-y-auto custom-scrollbar">
          {isSearching && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center text-slate-600 font-medium">
              Đang kiểm tra sản phẩm
            </div>
          )}

          {!isSearching && hasSearched && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {searchResult ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle className="text-emerald-600" size={24} />
                    <h3 className="text-lg font-medium text-slate-900">
                      Đã tìm thấy sản phẩm phù hợp
                    </h3>
                  </div>

                  {/* Grid 2 cột cho thông tin chi tiết */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-2 gap-x-10 gap-y-6">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-sm text-slate-900 font-medium mb-1">
                        Tên sản phẩm
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {searchResult.name}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-sm text-slate-900 font-medium mb-1">
                        Mã SKU
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.sku}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-sm text-slate-900 font-medium mb-1">
                        Thương hiệu
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.brand || "---"}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-sm text-slate-900 font-medium mb-1">
                        Giá nhập
                      </p>
                      <p className="font-medium text-slate-600">
                        {searchResult.importPrice?.toLocaleString() || "0"} ₫
                      </p>
                    </div>
                    <div className="col-span-2 pt-4 flex gap-3">
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

const QuickProductModal = ({
  isOpen,
  onClose,
  onSuccess,
  suppliers,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    supplierId: "",
    importPrice: "",
    shelfLife: "",
    origin: "",
    unit: "Thùng",
    imageFile: null,
    previewUrl: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialData) {
      let currentSupId =
        initialData.supplier?.id || initialData.supplierId || "";

      // Nếu thiếu ID, thử tìm trong danh sách suppliers dựa trên tên Brand
      if (!currentSupId && initialData.brand && suppliers.length > 0) {
        const searchBrand = String(initialData.brand).toLowerCase().trim();
        const foundSup = suppliers.find(
          (s) => s.name && s.name.toLowerCase().trim() === searchBrand,
        );
        if (foundSup) currentSupId = foundSup.id;
      }
      setFormData({
        ...initialData,
        importPrice: initialData.importPrice || initialData.price || "",
        shelfLife: initialData.shelfLife || "",
        supplierId: currentSupId,
      });
      } else {
        setFormData({
        name: "",
        sku: "",
        barcode: "",
        supplierId: "",
        brand: "",
        importPrice: "",
        shelfLife: "",
        origin: "",
        unit: "Thùng",
        imageFile: null,
        previewUrl: null,
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [initialData, isOpen, suppliers]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleGenerateRandom = () => {
    const randomSkuSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const newSku = `SKU-${randomSkuSuffix}`;
    const prefix = "893";
    const enterpriseCode = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const productCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const first12 = prefix + enterpriseCode + productCode;

    let sumOddPositions = 0;
    let sumEvenPositions = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12[i]);
      const positionFromRight = 12 - i;
      if (positionFromRight % 2 !== 0) sumOddPositions += digit;
      else sumEvenPositions += digit;
    }
    const S = sumOddPositions * 3 + sumEvenPositions;
    const remainder = S % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    const newBarcode = first12 + checkDigit;

    setFormData((prev) => ({ ...prev, sku: newSku, barcode: newBarcode }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.warning("Vui lòng nhập tên sản phẩm!");
      return;
    }
    onSuccess(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4 group">
            <div className="flex-shrink-0 transition-all duration-300 group-hover:scale-110"></div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-medium text-slate-900 leading-tight tracking-tight">
                {initialData
                  ? "Cập nhật sản phẩm nhanh"
                  : "Thêm sản phẩm nhanh"}
              </h2>
              <p className="text-slate-500 text-sm md:text-base font-medium mt-0.5 leading-relaxed">
                Điền thông tin sản phẩm để nhập kho ngay lập tức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-green-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* CỘT TRÁI: THÔNG TIN (8 columns) */}
            <div className="md:col-span-8 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Thông tin chi tiết
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Tên sản phẩm */}
                  <div className="group">
                    <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                      Tên sản phẩm
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!!initialData}
                      className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-400 transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-900 focus:bg-white"}`}
                      placeholder="Ví dụ: Sữa tươi Vinamilk..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {/* KHỐI HIỂN THỊ THƯƠNG HIỆU */}
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Thương hiệu
                      </label>
                      {initialData ? (
                        // TRƯỜNG HỢP 1: SẢN PHẨM CŨ -> LUÔN HIỆN TEXT (INPUT READONLY)
                        // Bất kể có ID hay chưa, vẫn hiện Text để đúng ý bạn.
                        // Logic "useEffect" ở trên đã lo việc map ID rồi.
                        <input
                          value={
                            // Ưu tiên hiện Tên theo ID tìm được
                            suppliers.find((s) => s.id == formData.supplierId)
                              ?.name ||
                            formData.brand ||
                            (initialData.supplier
                              ? initialData.supplier.name
                              : "") ||
                            "---"
                          }
                          disabled
                          className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed outline-none"
                        />
                      ) : (
                        // TRƯỜNG HỢP 2: TẠO MỚI HOÀN TOÀN -> HIỆN DROPDOWN
                        <div className="relative">
                          <select
                            value={formData.supplierId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const selectedSupplier = suppliers.find(
                                (s) => s.id == selectedId,
                              );
                              setFormData({
                                ...formData,
                                supplierId: selectedId,
                                brand: selectedSupplier
                                  ? selectedSupplier.name
                                  : "",
                              });
                              e.target.blur();
                            }}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all font-medium cursor-pointer focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white text-slate-900 appearance-none peer"
                          >
                            <option value="">-- Chọn thương hiệu --</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <ChevronUp
                            size={20}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform duration-200 peer-focus:rotate-180"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Mã barcode
                      </label>
                      <input
                        value={formData.barcode}
                        onChange={(e) =>
                          setFormData({ ...formData, barcode: e.target.value })
                        }
                        disabled={!!initialData}
                        className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="Quét hoặc nhập..."
                      />
                    </div>
                  </div>

                  {/* SKU Generator */}
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                      Mã SKU
                    </label>
                    <div className="relative">
                      <input
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        disabled={!!initialData}
                        className={`w-full pl-5 pr-40 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="SKU sản phẩm"
                      />
                      {!initialData && (
                        <button
                          type="button"
                          onClick={handleGenerateRandom}
                          className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-green-600 hover:bg-green-50 hover:border-green-200 transition-all flex items-center gap-1"
                        >
                          <Dices size={14} /> Tạo ngẫu nhiên
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Giá & Bảo quản */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Giá nhập
                      </label>
                      <input
                        type="number"
                        value={formData.importPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            importPrice: e.target.value,
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white outline-none transition-all font-medium"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Bảo quản
                      </label>
                      <input
                        type="number"
                        value={formData.shelfLife}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shelfLife: e.target.value,
                          })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white outline-none transition-all font-medium"
                        placeholder="Nhập thời gian bảo quản"
                      />
                    </div>
                  </div>

                  {/* Xuất xứ & Đơn vị */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Xuất xứ
                      </label>
                      <input
                        value={formData.origin}
                        onChange={(e) =>
                          setFormData({ ...formData, origin: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white outline-none transition-all font-medium"
                        placeholder="Nhập xuất xứ"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Đơn vị
                      </label>
                      <div className="relative">
                        <select
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white outline-none transition-all font-medium cursor-pointer text-slate-700 appearance-none peer"
                          value={formData.unit}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              unit: e.target.value,
                            });
                            e.target.blur();
                          }}
                        >
                          <option value="Thùng">Thùng</option>
                          <option value="Lốc">Lốc</option>
                          <option value="Hộp">Hộp</option>
                          <option value="Vỉ">Vỉ</option>
                          <option value="Chai">Chai</option>
                          <option value="Cái">Cái</option>
                          <option value="Kg">Kg</option>
                        </select>
                        <ChevronUp
                          size={20}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform duration-200 peer-focus:rotate-180"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* CỘT PHẢI: HÌNH ẢNH (4 columns) */}
            <div className="md:col-span-4 space-y-8">
              {/* Card Hình ảnh */}
              <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 text-center h-full flex flex-col justify-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-slate-600">
                  <ImageIcon size={18} />
                  <span className="text-[13px] font-medium">
                    Hình ảnh minh họa
                  </span>
                </div>

                {initialData ? (
                  // Read-only image display for existing products
                  <div className="aspect-square bg-white rounded-[2rem] border-2 border-slate-300 flex items-center justify-center overflow-hidden">
                    {formData.previewUrl ? (
                      <img
                        src={formData.previewUrl}
                        alt={formData.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <ImageIcon
                          size={36}
                          strokeWidth={1.5}
                          className="mb-2"
                        />
                        <p className="text-xs font-medium">Không có hình ảnh</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Editable upload area for new products
                  <div className="relative group aspect-square bg-white rounded-[2rem] border-2 border-dashed border-slate-300 hover:border-green-400 transition-all flex items-center justify-center overflow-hidden">
                    {formData.previewUrl ? (
                      <img
                        src={formData.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Upload size={36} strokeWidth={1.5} className="mb-2" />
                        <p className="text-xs font-medium">Tải ảnh lên</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {formData.previewUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-medium">
                          Thay đổi
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-3 font-medium">
                  {initialData
                    ? "Hình ảnh sản phẩm hiện tại"
                    : "Hỗ trợ: png, jpg, webp"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-10 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium text-sm shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2"
            >
              {initialData ? "Cập nhật dữ liệu" : "Lưu vào phiếu nhập"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewModal = ({ isOpen, onClose, onConfirm, data, grandTotal }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70] backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" /> Xác nhận thông tin
            phiếu nhập
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">
                Mã phiếu
              </p>
              <p className="font-bold text-green-600">{data.header.code}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">
                Ngày nhập
              </p>
              <p className="font-medium text-slate-700">
                {data.header.importDate.replace("T", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">
                Nhân viên
              </p>
              <p className="font-medium text-slate-700">
                {data.header.staffName}
              </p>
            </div>
            <div className="col-span-full">
              <p className="text-xs text-slate-500 font-medium uppercase">
                Ghi chú
              </p>
              <p className="font-medium text-slate-700 italic">
                {data.header.note || "Không có"}
              </p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-4 py-4 font-medium text-left border-b border-slate-100 first:rounded-tl-2xl">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-4 font-medium text-left border-b border-slate-100 whitespace-nowrap">
                    Mã SKU
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100 whitespace-nowrap">
                    Đơn vị
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100 whitespace-nowrap">
                    Số lượng
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100 whitespace-nowrap">
                    Hệ số
                  </th>
                  <th className="px-4 py-4 font-medium text-right border-b border-slate-100 whitespace-nowrap">
                    Đơn giá
                  </th>
                  <th className="px-4 py-4 font-medium text-right border-b border-slate-100 whitespace-nowrap last:rounded-tr-2xl">
                    Tổng tiền lô
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.details.map((d, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              d.productInfo?.thumbnail
                                ? getImageUrl(d.productInfo.thumbnail)
                                : d.tempData?.previewUrl ||
                                  "https://via.placeholder.com/40"
                            }
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/40")
                            }
                          />
                        </div>
                        <div className="font-medium text-slate-900">
                          {d.productInfo?.name || d.tempData?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <span className="text-[13px] font-mono text-slate-500 whitespace-nowrap">
                        {d.sku || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600 whitespace-nowrap">
                      {d.unit}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-900 whitespace-nowrap">
                      {d.quantity}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-900 whitespace-nowrap">
                      {d.rate}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-600 whitespace-nowrap font-medium">
                      {Number(d.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {d.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end items-center gap-3 pt-2">
            <span className="text-slate-500 font-medium">Tổng cộng:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {grandTotal.toLocaleString()} VNĐ
            </span>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
          <div className="font-medium text-slate-600">
            Tổng sản phẩm:{" "}
            <span className="text-green-600 font-bold">
              {data.details.length}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"
            >
              <CheckCircle size={20} /> Xác nhận phiếu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryEntryPage = () => {
  const navigate = useNavigate();
  const [header, setHeader] = useState(() => ({
    code: createImportCode(),
    importDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
    staffId: "",
    staffName: "",
    note: "",
    supplierId: "",
  }));

  const [details, setDetails] = useState(() => [
    {
      id: Date.now(),
      sku: "",
      isValidSku: null,
      productInfo: null,
      manufacturingDate: "",
      isValidDate: true,
      shelfLife: 0,
      expiryDate: "",
      batchCode: "",
      origin: "",
      quantity: 1,
      unit: "Thùng",
      rate: 1,
      price: 0,
      total: 0,
      isSaved: false,
      tempData: null,
    },
  ]);

  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCheckModalOpen, setCheckModalOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [isValidStaff, setIsValidStaff] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [checkSku, setCheckSku] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const localIsoString = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      setHeader((prev) => ({ ...prev, importDate: localIsoString }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    supplierService
      .getAll()
      .then((res) => {
        if (isMounted) setSuppliers(res.data);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStaffIdChange = async (e) => {
    const code = e.target.value;
    setHeader({ ...header, staffId: code });
    if (code.length === 6) {
      try {
        const response = await userService.getUserByStaffCode(code);
        const user = response.data || response;
        setHeader((prev) => ({ ...prev, staffName: user.fullName }));
        setIsValidStaff(true);
      } catch {
        setIsValidStaff(false);
        setHeader((prev) => ({ ...prev, staffName: "" }));
      }
    } else {
      setIsValidStaff(null);
      setHeader((prev) => ({ ...prev, staffName: "" }));
    }
  };

  const calculateLineTotal = (row) =>
    (row.quantity || 0) * (row.rate || 1) * (row.price || 0);

  const calculateExpiryDate = (nsx, months) => {
    if (!nsx || !months) return "";
    const date = new Date(nsx);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().slice(0, 10);
  };

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const generateBatchCode = async (index) => {
    const row = details[index];

    // Check if we have all required data
    if (!row.sku || !row.manufacturingDate || !row.expiryDate) {
      return;
    }

    // Check if manufacturing date is valid and complete (dd/mm/yyyy format)
    if (row.manufacturingDate.length !== 10 || !row.isValidDate) {
      return;
    }

    try {
      // Get supplier code from multiple sources with priority
      let supplierCode = null;

      // Priority 1: From productInfo.supplier (when SKU is entered and product exists)
      if (row.productInfo?.supplier?.code) {
        supplierCode = row.productInfo.supplier.code;
      }
      // Priority 2: From tempData.supplier (when quick product is created)
      else if (row.tempData?.supplier?.code) {
        supplierCode = row.tempData.supplier.code;
      }
      // Priority 3: Lookup from suppliers list using supplierId
      else if (row.productInfo?.supplier?.id) {
        const supplier = suppliers.find(
          (s) => s.id === row.productInfo.supplier.id,
        );
        if (supplier?.code) {
          supplierCode = supplier.code;
        }
      } else if (row.tempData?.supplierId) {
        const supplier = suppliers.find(
          (s) => s.id === parseInt(row.tempData.supplierId),
        );
        if (supplier?.code) {
          supplierCode = supplier.code;
        }
      }
      // Priority 4: Lookup supplier by matching brand name with vietnameseName
      else if (row.productInfo?.brand) {
        const supplier = suppliers.find(
          (s) =>
            s.vietnameseName &&
            s.vietnameseName.toLowerCase() ===
              row.productInfo.brand.toLowerCase(),
        );
        if (supplier?.code) {
          supplierCode = supplier.code;
        }
      } else if (row.tempData?.brand) {
        const supplier = suppliers.find(
          (s) =>
            s.vietnameseName &&
            s.vietnameseName.toLowerCase() === row.tempData.brand.toLowerCase(),
        );
        if (supplier?.code) {
          supplierCode = supplier.code;
        }
      }

      // Fallback to UNK if still not found
      if (!supplierCode) {
        supplierCode = "UNK";
      }

      // Convert manufacturing date from dd/mm/yyyy to ddMMyy
      const [day, month, year] = row.manufacturingDate.split("/");
      const nsxStr = `${day}${month}${year.slice(-2)}`;

      // Convert expiry date from yyyy-mm-dd to ddMMyy
      const expiryParts = row.expiryDate.split("-");
      const hsdStr = `${expiryParts[2]}${expiryParts[1]}${expiryParts[0].slice(-2)}`;

      // Create prefix for API call
      const prefix = `${supplierCode}_${row.sku}_${nsxStr}`;

      // Call API to get next sequence number
      const response = await batchService.getNextSequence(prefix);
      const seqStr = response.data.formattedSequence;

      // Generate full batch code
      const batchCode = `${prefix}_${hsdStr}_${seqStr}`;

      // Update the row with generated batch code
      const newDetails = [...details];
      newDetails[index].batchCode = batchCode;
      setDetails(newDetails);
    } catch (error) {
      console.error("Error generating batch code:", error);
      // Don't show error to user, just log it
    }
  };

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInMonth = (month, year) => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
      return 29;
    }
    return daysInMonth[month - 1] || 31;
  };

  const validateDateString = (dateStr) => {
    if (!dateStr) return true;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map((p) => parseInt(p, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1000 || year > 9999) return false;
    const maxDays = getDaysInMonth(month, year);
    if (day < 1 || day > maxDays) return false;
    return true;
  };
  const handleDateInput = (index, value) => {
    let cleaned = value.replace(/[^\d/]/g, "");
    const prevValue = details[index].manufacturingDate || "";
    if (cleaned.length < prevValue.length) {
      if (prevValue.endsWith("/") && !cleaned.endsWith("/")) {
        cleaned = cleaned.slice(0, -1);
      }
      const newDetails = [...details];
      newDetails[index].manufacturingDate = cleaned;
      newDetails[index].isValidDate = validateDateString(cleaned);
      setDetails(newDetails);
      return;
    }
    let formatted = cleaned;
    const digitsOnly = cleaned.replace(/\//g, "");
    if (digitsOnly.length >= 2) {
      formatted = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2);
    }
    if (digitsOnly.length >= 4) {
      formatted =
        digitsOnly.slice(0, 2) +
        "/" +
        digitsOnly.slice(2, 4) +
        "/" +
        digitsOnly.slice(4);
    }
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    const newDetails = [...details];
    newDetails[index].manufacturingDate = formatted;
    newDetails[index].isValidDate = validateDateString(formatted);
    if (formatted.length === 10 && validateDateString(formatted)) {
      const [day, month, year] = formatted.split("/");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      const shelfLife = newDetails[index].shelfLife || 0;
      newDetails[index].expiryDate = calculateExpiryDate(isoDate, shelfLife);
    }

    setDetails(newDetails);

    // Auto-generate batch code when date is complete and valid
    if (formatted.length === 10 && validateDateString(formatted)) {
      setTimeout(() => generateBatchCode(index), 100);
    }
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;

    if (field === "manufacturingDate") {
      const shelfLife = newDetails[index].shelfLife || 0;
      newDetails[index].expiryDate = calculateExpiryDate(value, shelfLife);
    }

    if (["quantity", "rate", "price"].includes(field)) {
      newDetails[index].total = calculateLineTotal(newDetails[index]);
    }

    if (field === "sku") {
      newDetails[index].isValidSku = null;
      newDetails[index].productInfo = null;
      newDetails[index].isSaved = false;
    }

    setDetails(newDetails);
  };

  const handleSkuBlur = (index) => {
    openCreateModal(index, details[index]?.sku);
  };

  const openCreateModal = (index, skuValue) => {
    const sku = (skuValue || "").trim();
    if (!sku) {
      toast.warning("Vui lòng nhập mã SKU!");
      return;
    }

    setCurrentRowIndex(index);
    setCheckSku(sku);
    setCheckModalOpen(true);
  };

  const handleProductFound = (product) => {
    // Product exists, open QuickProductModal with pre-filled data
    const editData = {
      ...product,
      importPrice: product.importPrice || 0,
      shelfLife: product.shelfLife || 0,
      supplierId: product.supplier?.id || "",
      previewUrl: product.thumbnail
        ? getImageUrl(product.thumbnail)
        : null,
    };
    setEditingData(editData);
    setModalOpen(true);
  };

  const handleProductNotFound = () => {
    // Navigate to products page and trigger add product form
    navigate("/products", { state: { openAddForm: true } });
  };

  const openEditModal = (index) => {
    setCurrentRowIndex(index);
    const row = details[index];
    const initial = row.tempData || row.productInfo;
    const editData = {
      ...initial,
      importPrice: row.price,
      shelfLife: row.shelfLife,
      sku: row.sku,
      origin: row.origin || "",
      unit: row.unit || "Thùng",
    };
    setEditingData(editData);
    setModalOpen(true);
  };

  const handleModalSubmit = (data) => {
    if (currentRowIndex !== null) {
      const newDetails = [...details];
      const row = newDetails[currentRowIndex];
      let supplier = null;

      // Try to find supplier by ID first
      if (data.supplierId) {
        supplier = suppliers.find((s) => s.id === parseInt(data.supplierId));
      }

      // If not found by ID, try to find by brand name
      if (!supplier && data.brand) {
        supplier = suppliers.find(
          (s) =>
            (s.name && s.name.toLowerCase() === data.brand.toLowerCase()) ||
            (s.vietnameseName &&
              s.vietnameseName.toLowerCase() === data.brand.toLowerCase()) ||
            (s.code && s.code.toLowerCase() === data.brand.toLowerCase()),
        );
      }

      // If still not found but data has a supplier object, use it
      if (!supplier && data.supplier) {
        supplier = data.supplier;
      }

      row.sku = data.sku;
      row.isValidSku = true;

      // If product exists (has id), keep productInfo and update supplier
      // If new product, set productInfo to null
      if (data.id) {
        row.productInfo = {
          ...data,
          supplier: supplier || null,
        };
      } else {
        row.productInfo = null;
      }

      row.price = data.importPrice ? Number(data.importPrice) : 0;
      row.shelfLife = data.shelfLife ? Number(data.shelfLife) : 0;
      row.origin = data.origin || "";
      row.unit = data.unit || "Thùng";
      row.total = calculateLineTotal(row);
      if (row.manufacturingDate) {
        row.expiryDate = calculateExpiryDate(
          row.manufacturingDate,
          row.shelfLife,
        );
      }
      row.isSaved = false;
      // Attach full supplier object to tempData
      row.tempData = {
        ...data,
        supplier: supplier || null,
        supplierId: supplier ? supplier.id : data.supplierId || null,
        brand: data.brand || (supplier ? supplier.name : null),
      };
      setDetails(newDetails);

      // Auto-generate batch code if manufacturing date is already filled
      if (row.manufacturingDate && row.expiryDate) {
        setTimeout(() => generateBatchCode(currentRowIndex), 100);
      }
    }
  };

  const HANDLE_SAVE_ROW_TO_DB = async (index) => {
    const row = details[index];
    if (row.isSaved) return;

    if (!row.tempData) {
      toast.info("Chưa có thông tin sản phẩm để lưu!");
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận lưu?",
      text: "Bạn có muốn lưu sản phẩm vào Quản lý sản phẩm không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      // Clean tempData: extract supplierId from supplier object
      const dataToSend = {
        ...row.tempData,
        supplierId: row.tempData.supplier?.id || row.tempData.supplierId,
      };
      // Remove supplier object to avoid nested object error
      delete dataToSend.supplier;

      const res = await productService.createQuickProduct(dataToSend);
      const newProduct = res.data;
      const newDetails = [...details];
      newDetails[index].productInfo = newProduct;
      newDetails[index].isSaved = true;
      newDetails[index].tempData = null;
      newDetails[index].price = newProduct.importPrice;
      newDetails[index].shelfLife = newProduct.shelfLife;
      setDetails(newDetails);

      toast.info("Sản phẩm đã được lưu");
    } catch (error) {
      toast.error(
        "Lỗi lưu sản phẩm: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const HANDLE_EXPORT = async (noteId, noteCode) => {
    try {
      const response = await inventoryService.exportExcel(noteId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = noteCode
        ? `${noteCode}.xlsx`
        : `PhieuNhap_${noteId}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Lỗi xuất file: " + error.message);
    }
  };

  const handlePreSave = () => {
    if (!header.staffId || !isValidStaff) {
      toast.warning("Vui lòng nhập đúng Mã nhân viên!");
      return;
    }
    if (details.length === 0) {
      toast.warning("Phiếu nhập phải có ít nhất 1 sản phẩm!");
      return;
    }
    setPreviewOpen(true);
  };

  const handleConfirmSave = async () => {
    const result = await Swal.fire({
      title: "Xác nhận lưu?",
      text: "Bạn có muốn lưu phiếu nhập?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Lưu phiếu",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    // Helper function to convert dd/MM/yyyy to yyyy-MM-dd
    const convertToISODate = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    // --- SỬA ĐỔI: Logic trích xuất Supplier ID mạnh mẽ hơn ---
    let derivedSupplierId = header.supplierId;

    // Nếu header chưa chọn, thử tìm từ sản phẩm đầu tiên trong danh sách
    if (!derivedSupplierId && details.length > 0) {
      const firstDetail = details[0];

      // Ưu tiên 1: Tìm trong tempData (Dữ liệu từ Form Cập nhật nhanh vừa lưu)
      if (firstDetail.tempData) {
        derivedSupplierId =
          firstDetail.tempData.supplierId ||
          (firstDetail.tempData.supplier
            ? firstDetail.tempData.supplier.id
            : null);

        // Nếu vẫn chưa có, thử tìm theo brand name trong tempData
        if (!derivedSupplierId && firstDetail.tempData.brand) {
          const matchedSupplier = suppliers.find(
            (s) =>
              s.name &&
              s.name.toLowerCase() === firstDetail.tempData.brand.toLowerCase(),
          );
          if (matchedSupplier) {
            derivedSupplierId = matchedSupplier.id;
          }
        }
      }

      // Ưu tiên 2: Tìm trong productInfo (Dữ liệu gốc của sản phẩm đã lưu trước đó)
      if (!derivedSupplierId && firstDetail.productInfo) {
        if (
          firstDetail.productInfo.supplier &&
          firstDetail.productInfo.supplier.id
        ) {
          derivedSupplierId = firstDetail.productInfo.supplier.id;
        }
        // Nếu vẫn chưa có, thử tìm theo brand name trong productInfo
        else if (firstDetail.productInfo.brand) {
          const matchedSupplier = suppliers.find(
            (s) =>
              s.name &&
              s.name.toLowerCase() ===
                firstDetail.productInfo.brand.toLowerCase(),
          );
          if (matchedSupplier) {
            derivedSupplierId = matchedSupplier.id;
          }
        }
      }
    }

    // Kiểm tra chặn lỗi trước khi gửi
    if (!derivedSupplierId) {
      toast.error(
        "Lỗi: Không xác định được Nhà cung cấp! Vui lòng chọn Nhà cung cấp ở thông tin chung hoặc kiểm tra lại thông tin sản phẩm.",
      );
      return;
    }
    // -----------------------------------------------------------

    const requestData = {
      code: header.code,
      type: "IMPORT",
      note: header.note,
      supplierId: derivedSupplierId, // Sử dụng ID đã tìm được
      details: details.map((d) => ({
        productId: d.productInfo?.id,
        sku: d.sku,
        quantity: d.quantity,
        importUnit: d.unit,
        conversionRate: d.rate,
        importPrice: d.price,
        expiryDate: convertToISODate(d.expiryDate),
        manufacturingDate: convertToISODate(d.manufacturingDate),
        origin: d.origin,
        batchCode: d.batchCode,
      })),
    };

    try {
      await inventoryService.createImportNote(requestData);
      toast.success("Lưu phiếu thành công!");
      setPreviewOpen(false);
      navigate("/inventory/list");
    } catch (err) {
      toast.error(
        "Lỗi lưu phiếu: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const grandTotal = details.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="admin-page-shell p-4 md:p-6 text-slate-700">
      <GlobalStyles />
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
            Nhập kho hàng hóa
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Tạo phiếu nhập mới và quản lý lô hàng
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
          <span className="text-xs font-bold text-slate-500 mb-1">
            Mã phiếu nhập kho
          </span>
          <div className="text-xl font-medium text-green-600 font-mono tracking-wide">
            {header.code}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Calendar size={16} className="text-green-500" /> Thời gian nhập
            </label>
            <input
              type="datetime-local"
              value={header.importDate}
              readOnly
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3 focus:outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <User size={16} className="text-green-500" /> Mã nhân viên
            </label>
            <div className="relative">
              <input
                value={header.staffId}
                onChange={handleStaffIdChange}
                className={`w-full border font-medium rounded-2xl px-4 py-3 outline-none transition-all ${isValidStaff === true ? "border-emerald-400 bg-emerald-50/50 text-emerald-700" : isValidStaff === false ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100"}`}
                placeholder="Nhập mã ID"
              />
              {isValidStaff === true && (
                <div className="absolute right-4 top-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              )}
            </div>
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Smile size={16} className="text-green-500" /> Người thực hiện
            </label>
            <input
              value={header.staffName}
              disabled
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3"
              placeholder="Tên nhân viên"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText size={16} className="text-green-500" /> Ghi chú
            </label>
            <input
              value={header.note}
              onChange={(e) => setHeader({ ...header, note: e.target.value })}
              className="w-full border border-slate-200 bg-white font-medium text-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="Nhập ghi chú cho đợt hàng"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-60 first:pl-6">
                  Thông tin sản phẩm
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-40">
                  Ngày sản xuất
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-40">
                  Hạn sử dụng
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-40">
                  Mã batch code
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-32">
                  Số lượng
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-32">
                  Hệ số
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-40">
                  Đơn giá
                </th>
                <th className="py-5 px-4 text-sm font-medium text-slate-500 whitespace-nowrap w-40">
                  Thành tiền
                </th>
                <th className="py-5 px-2 text-sm font-medium text-slate-500 whitespace-nowrap w-32">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-5">
              {details.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-green-50/30 transition-colors group"
                >
                  <td className="py-4 px-2 align-top first:pl-6">
                    {!(row.productInfo || row.tempData) ? (
                      <div className="flex gap-1 mb-3">
                        <div className="relative">
                          <input
                            value={row.sku}
                            onChange={(e) =>
                              handleDetailChange(index, "sku", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSkuBlur(index);
                              }
                            }}
                            className={`w-44 h-10 border pl-9 pr-3 py-2 rounded-xl text-sm font-medium outline-none transition-all ${row.isSaved ? "border-emerald-200 bg-emerald-50/30 text-emerald-700" : row.isValidSku === false ? "border-green-200 bg-green-50/30 text-green-700" : "border-slate-200 bg-white focus:border-green-400"}`}
                            placeholder="Nhập mã SKU"
                          />
                          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                          <img
                            src={
                              row.productInfo
                                ? getImageUrl(row.productInfo.thumbnail)
                                : row.tempData?.previewUrl ||
                                  "https://via.placeholder.com/40"
                            }
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/40")
                            }
                          />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="text-sm font-medium text-slate-700">
                            {row.productInfo
                              ? row.productInfo.name
                              : row.tempData.name}
                          </div>
                          <div className="text-xs text-slate-900 truncate font-mono">
                            {row.sku} |{" "}
                            {row.productInfo
                              ? row.productInfo.barcode
                              : row.tempData.barcode}{" "}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {row.shelfLife || "---"} | {row.unit || "---"} |{" "}
                            {row.origin || "---"}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-2 align-top">
                    <input
                      type="text"
                      value={row.manufacturingDate}
                      className={`w-32 h-10 bg-white border rounded-xl px-3 py-2 text-sm font-medium text-slate-600 outline-none transition-all text-center ${
                        row.isValidDate === false
                          ? "border-green-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                          : "border-slate-200 focus:border-green-400"
                      }`}
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => handleDateInput(index, e.target.value)}
                    />
                  </td>
                  <td className="py-4 px-2 align-top">
                    <div className="w-32 h-10 bg-transparent border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-600 flex items-center justify-center">
                      {formatDateDisplay(row.expiryDate) || "dd/mm/yyyy"}
                    </div>
                  </td>
                  <td className="py-4 px-2 align-top">
                    <div className="w-42 h-10 bg-transparent border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-600 flex items-center justify-center">
                      {row.batchCode || "Tự động"}
                    </div>
                  </td>
                  <td className="py-4 px-2 align-top">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      className="w-24 h-10 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-center focus:border-green-400 outline-none text-slate-600"
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "quantity",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                  </td>
                  <td className="py-4 px-2 align-top">
                    <input
                      type="number"
                      min={1}
                      value={row.rate}
                      className="w-24 h-10 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-medium focus:border-green-400 outline-none"
                      onChange={(e) =>
                        handleDetailChange(
                          index,
                          "rate",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                  </td>
                  <td className="py-4 px-2 align-top text-center">
                    <div className="w-32 h-10 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-medium text-slate-600">
                      {row.price ? row.price.toLocaleString() : "0"}
                    </div>
                  </td>
                  <td className="py-4 px-2 align-top text-center">
                    <div className="w-36 h-10 bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-center text-slate-600 text-sm py-2">
                      {row.total.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-1 align-top text-center last:pr-6">
                    <div className="flex items-center justify-center gap-0">
                      <button
                        onClick={() => openEditModal(index)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-xl transition-all"
                        title="Sửa"
                        disabled={row.isSaved}
                      >
                        <ClipboardPenLine size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const newD = details.filter((_, i) => i !== index);
                          setDetails(newD);
                        }}
                        className="text-red-600 hover:text-red-800 p-2 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() =>
              setDetails([
                ...details,
                {
                  id: Date.now(),
                  quantity: 1,
                  rate: 1,
                  total: 0,
                  unit: "Thùng",
                  origin: "",
                  shelfLife: 0,
                  isSaved: false,
                  manufacturingDate: "",
                  isValidDate: true,
                },
              ])
            }
            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-5 py-2.5 rounded-2xl transition-all"
          >
            <Plus size={18} /> Thêm dòng sản phẩm
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-baseline gap-3 pl-2">
          <span className="text-slate-500 font-medium text-sm">
            Tổng thanh toán:
          </span>
          <span className="font-medium text-2xl text-slate-800">
            {grandTotal.toLocaleString()}{" "}
            <span className="text-base text-slate-500">VNĐ</span>
          </span>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-medium hover:bg-slate-200 transition-all text-sm">
            Hủy bỏ
          </button>
          <button
            onClick={handlePreSave}
            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-medium hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2 text-sm"
          >
            Lưu phiếu nhập
          </button>
        </div>
      </div>

      <ProductCheckModal
        isOpen={isCheckModalOpen}
        searchKeyword={checkSku}
        onClose={() => {
          setCheckModalOpen(false);
          setCheckSku("");
        }}
        onProductFound={handleProductFound}
        onProductNotFound={handleProductNotFound}
      />

      <QuickProductModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSubmit}
        suppliers={suppliers}
        initialData={editingData}
      />
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        onConfirm={handleConfirmSave}
        data={{ header, details }}
        grandTotal={grandTotal}
      />
    </div>
  );
};

export default InventoryEntryPage;

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  Save,
  Package,
  Calendar,
  User,
  Smile,
  FileText,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  PackagePlus,
  Dices,
  Upload,
  ImageIcon,
} from "lucide-react";
import { getImageUrl } from "../../utils/imageUrl";
import Swal from "sweetalert2";
import productService from "../../services/productService";
import inventoryService from "../../services/inventoryService";
import userService from "../../services/userService";
import batchService from "../../services/batchService";
import supplierService from "../../services/supplierService";
import BatchSelectionModal from "../../components/BatchSelectionModal";

// ===== MODAL COMPONENTS =====

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
      const res = await productService.getAll({});
      if (!res || !res.data || !Array.isArray(res.data)) {
        setSearchResult(null);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      let found = res.data.find(
        (p) =>
          p.sku &&
          p.sku.toLowerCase().includes(normalizedKeyword.toLowerCase()),
      );

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
            <div className="p-2 bg-green-50 rounded-xl text-green-600">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                Kiểm tra sản phẩm
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                SKU: {searchKeyword || "---"}
              </p>
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
              Đang kiểm tra sản phẩm...
            </div>
          )}

          {!isSearching && hasSearched && (
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
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Tên sản phẩm
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.name}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Mã SKU
                      </p>
                      <p className="font-medium text-green-600">
                        {searchResult.sku}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Thương hiệu
                      </p>
                      <p className="font-medium text-slate-700">
                        {searchResult.brand || "---"}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Giá nhập
                      </p>
                      <p className="font-medium text-emerald-600">
                        {searchResult.importPrice?.toLocaleString() || "0"} ₫
                      </p>
                    </div>

                    {/* Hàng nút bấm dàn ngang: Kiểm tra lại và Sử dụng sản phẩm */}
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
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-xl text-green-600">
                <PackagePlus size={24} />
              </div>
              {initialData ? "Cập nhật sản phẩm nhanh" : "Thêm sản phẩm nhanh"}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Điền thông tin sản phẩm để xuất kho ngay lập tức
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-green-600 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-8 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Thông tin chi tiết
                  </h3>
                </div>

                <div className="space-y-5">
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
                      placeholder="Nhập tên sản phẩm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Thương hiệu
                      </label>
                      {initialData ? (
                        <input
                          value={
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
                          }}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all font-medium cursor-pointer focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white text-slate-900"
                        >
                          <option value="">-- Chọn thương hiệu --</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
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
                      />
                    </div>
                  </div>

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

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Giá xuất
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
                        placeholder="Nhập giá trị xuất"
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
                        disabled={!!initialData}
                        className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="Nhập thời gian bảo quản"
                      />
                    </div>
                  </div>

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
                        disabled={!!initialData}
                        className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="Nhập xuất xứ"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Đơn vị
                      </label>
                      {initialData ? (
                        <input
                          value={formData.unit || "---"}
                          disabled
                          className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed outline-none"
                        />
                      ) : (
                        <select
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 focus:bg-white outline-none transition-all font-medium cursor-pointer text-slate-700"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              unit: e.target.value,
                            })
                          }
                        >
                          <option value="Thùng">Thùng</option>
                          <option value="Lốc">Lốc</option>
                          <option value="Vỉ">Vỉ</option>
                          <option value="Chai">Chai</option>
                          <option value="Cái">Cái</option>
                          <option value="Kg">Kg</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="md:col-span-4 space-y-8">
              <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 text-center h-full flex flex-col justify-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-slate-600">
                  <ImageIcon size={18} />
                  <span className="text-[13px] font-medium">
                    Hình ảnh minh họa
                  </span>
                </div>

                {initialData ? (
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
              <Save size={18} />
              {initialData ? "Cập nhật dữ liệu" : "Lưu vào phiếu xuất"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====

const InventoryExportPage = () => {
  const navigate = useNavigate();

  const [header, setHeader] = useState({
    code: "",
    exportDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
    staffId: "",
    staffName: "",
    customerName: "",
    exportReason: "Xuất bán",
    note: "",
  });

  const [exportDetails, setExportDetails] = useState([
    {
      id: Date.now(),
      sku: "",
      productId: null,
      productName: "",
      selectedBatch: null,
      quantity: 0,
      price: 0,
      total: 0,
    },
  ]);

  const [isValidStaff, setIsValidStaff] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Batch selection modal state
  const [isBatchModalOpen, setBatchModalOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [currentProductName, setCurrentProductName] = useState("");

  // Product check modal states
  const [isCheckModalOpen, setCheckModalOpen] = useState(false);
  const [isQuickModalOpen, setQuickModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [editingData, setEditingData] = useState(null);
  const [checkSku, setCheckSku] = useState("");

  // Auto-generate export code
  useEffect(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const dateString = localDate.toISOString().slice(2, 10).replace(/-/g, "");
    const randomCode =
      "EXP" + dateString + "-" + Math.floor(Math.random() * 1000);
    setHeader((prev) => ({ ...prev, code: randomCode }));
    fetchSuppliers();
  }, []);

  // Auto-update time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const localIsoString = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      setHeader((prev) => ({ ...prev, exportDate: localIsoString }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Staff validation
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

  // Open product check modal immediately after SKU input
  const handleSkuBlur = (index) => {
    handleOpenCheckModal(index, exportDetails[index]?.sku);
  };

  // Handle batch selection
  const handleBatchSelect = (batch) => {
    if (currentRowIndex === null) return;

    const newDetails = [...exportDetails];
    newDetails[currentRowIndex].selectedBatch = {
      id: batch.id,
      batchCode: batch.batchCode,
      expiryDate: batch.expiryDate,
      availableQty: batch.quantity,
    };

    newDetails[currentRowIndex].quantity = Math.min(1, batch.quantity);
    newDetails[currentRowIndex].total =
      newDetails[currentRowIndex].quantity * newDetails[currentRowIndex].price;

    setExportDetails(newDetails);
    setBatchModalOpen(false);
    setCurrentRowIndex(null);
  };

  // Modal handlers
  const handleProductFound = (product) => {
    const editData = {
      ...product,
      importPrice: product.sellPrice || 0,
      shelfLife: product.shelfLife || 0,
      supplierId: product.supplier?.id || "",
      previewUrl: product.thumbnail
        ? getImageUrl(product.thumbnail)
        : null,
    };
    setEditingData(editData);
    setQuickModalOpen(true);
  };

  const handleOpenCheckModal = (index, skuValue) => {
    const sku = (skuValue || "").trim();
    if (!sku) {
      toast.warning("Vui lòng nhập mã SKU!");
      return;
    }

    setCurrentRowIndex(index);
    setCheckSku(sku);
    setCheckModalOpen(true);
  };

  const handleProductNotFound = () => {
    navigate("/products", { state: { openAddForm: true } });
  };

  const handleModalSubmit = async (data) => {
    // Add product to export list
    try {
      // Get available batches for this product
      const batchRes = await batchService.getBatchesByProductSku(data.sku);
      const batches = batchRes.data || [];

      if (batches.length === 0) {
        toast.info("Sản phẩm này không có lô hàng nào khả dụng trong kho!");
        return;
      }

      // Check if we are updating an existing row or adding a new one
      const targetIndex =
        currentRowIndex !== null ? currentRowIndex : exportDetails.length;

      const newRowData = {
        id: Date.now(),
        sku: data.sku,
        productId: data.id,
        productName: data.name,
        thumbnail: data.thumbnail,
        previewUrl: data.previewUrl, // Store previewUrl as fallback
        barcode: data.barcode,
        selectedBatch: null,
        quantity: 0,
        price: Number(data.importPrice) || 0,
        total: 0,
      };

      const newDetails = [...exportDetails];
      if (currentRowIndex !== null && currentRowIndex < newDetails.length) {
        // Update existing row
        newDetails[currentRowIndex] = {
          ...newDetails[currentRowIndex],
          ...newRowData,
          id: newDetails[currentRowIndex].id, // Keep existing ID
        };
      } else {
        // Append new row
        newDetails.push(newRowData);
      }

      setExportDetails(newDetails);

      // Open batch selection modal for the row
      setCurrentRowIndex(targetIndex);
      setCurrentProductName(data.name);
      setAvailableBatches(batches);
      setBatchModalOpen(true);
    } catch (error) {
      console.error("Error loading batches:", error);
      toast.error("Lỗi khi tải danh sách lô hàng");
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (index, value) => {
    const newDetails = [...exportDetails];
    const qty = Number(value) || 0;
    const maxQty = newDetails[index].selectedBatch?.availableQty || 0;

    if (qty > maxQty) {
      toast.warning(`Lô hàng này chỉ còn ${maxQty} sản phẩm!`);
      newDetails[index].quantity = maxQty;
    } else {
      newDetails[index].quantity = qty;
    }

    newDetails[index].total =
      newDetails[index].quantity * newDetails[index].price;
    setExportDetails(newDetails);
  };

  // Handle price change
  const handlePriceChange = (index, value) => {
    const newDetails = [...exportDetails];
    newDetails[index].price = Number(value) || 0;
    newDetails[index].total =
      newDetails[index].quantity * newDetails[index].price;
    setExportDetails(newDetails);
  };

  // Add new row
  const handleAddRow = () => {
    setExportDetails([
      ...exportDetails,
      {
        id: Date.now(),
        sku: "",
        productId: null,
        productName: "",
        selectedBatch: null,
        quantity: 0,
        price: 0,
        total: 0,
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (index) => {
    if (exportDetails.length === 1) {
      toast.warning("Phải có ít nhất 1 sản phẩm!");
      return;
    }
    setExportDetails(exportDetails.filter((_, i) => i !== index));
  };

  // Submit export note
  const handleSubmit = async () => {
    if (!header.staffId || !isValidStaff) {
      toast.warning("Vui lòng nhập đúng Mã nhân viên!");
      return;
    }

    if (!header.customerName && header.exportReason === "Xuất bán") {
      toast.warning("Vui lòng nhập tên khách hàng!");
      return;
    }

    const validDetails = exportDetails.filter(
      (d) => d.selectedBatch && d.quantity > 0,
    );
    if (validDetails.length === 0) {
      toast.warning(
        "Vui lòng chọn ít nhất 1 sản phẩm với lô hàng và số lượng hợp lệ!",
      );
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận xuất kho?",
      text: "Bạn có chắc chắn muốn lưu phiếu xuất này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Đồng ý xuất",
      cancelButtonText: "Hủy bỏ",
    });

    if (!result.isConfirmed) return;

    const payload = {
      code: header.code,
      note: header.note,
      customerName: header.customerName,
      exportReason: header.exportReason,
      type: "EXPORT",
      details: validDetails.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        importPrice: item.price,
        batchCode: item.selectedBatch.batchCode,
      })),
    };

    try {
      setIsSaving(true);
      await inventoryService.createExport(payload);
      toast.success("Xuất kho thành công!");
      navigate("/inventory/list");
    } catch (error) {
      toast.error(error.response?.data || "Có lỗi xảy ra khi xuất kho");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = exportDetails.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="admin-page-shell p-4 md:p-6 text-slate-700">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
            Xuất kho hàng hóa
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Chọn lô hàng cụ thể để xuất kho
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
          <span className="text-xs font-bold text-slate-500 mb-1">
            Mã phiếu xuất kho
          </span>
          <div className="text-xl font-medium text-green-600 font-mono tracking-wide">
            {header.code}
          </div>
        </div>
      </div>

      {/* Info Form */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Calendar size={16} className="text-green-500" /> Thời gian xuất
            </label>
            <input
              type="datetime-local"
              value={header.exportDate}
              readOnly
              className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <User size={16} className="text-green-500" /> Mã nhân viên
            </label>
            <div className="relative">
              <input
                value={header.staffId}
                onChange={handleStaffIdChange}
                className={`w-full border font-medium rounded-2xl px-4 py-3 outline-none transition-all ${isValidStaff === true ? "border-emerald-400 bg-emerald-50/50 text-emerald-700" : isValidStaff === false ? "border-green-400 bg-green-50/50 text-green-700" : "border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100"}`}
                placeholder="Nhập mã ID..."
              />
              {isValidStaff === true && (
                <div className="absolute right-4 top-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              )}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Smile size={16} className="text-green-500" /> Người thực hiện
            </label>
            <input
              value={header.staffName}
              disabled
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-2xl px-4 py-3"
              placeholder="Tên nhân viên"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              Lý do xuất kho
            </label>
            <select
              value={header.exportReason}
              onChange={(e) =>
                setHeader({ ...header, exportReason: e.target.value })
              }
              className="w-full border border-slate-200 bg-white font-medium text-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
            >
              <option value="Xuất bán">Xuất bán</option>
              <option value="Xuất hủy">Xuất hủy</option>
              <option value="Xuất nội bộ">Xuất nội bộ</option>
              <option value="Trả hàng">Trả hàng</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              Tên khách hàng
            </label>
            <input
              value={header.customerName}
              onChange={(e) =>
                setHeader({ ...header, customerName: e.target.value })
              }
              className="w-full border border-slate-200 bg-white font-medium text-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="Nhập tên khách hàng hoặc đối tượng..."
            />
          </div>

          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText size={16} className="text-green-500" /> Ghi chú
            </label>
            <input
              value={header.note}
              onChange={(e) => setHeader({ ...header, note: e.target.value })}
              className="w-full border border-slate-200 bg-white font-medium text-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="Nhập ghi chú cho phiếu xuất..."
            />
          </div>
        </div>
      </div>

      {/* Export Details Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 w-80 first:pl-6">
                  Thông tin sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Lô hàng
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Tồn kho lô
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Số lượng xuất
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Giá xuất
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                  Thành tiền
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exportDetails.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-green-50/30 transition-colors"
                >
                  <td className="px-6 py-4 first:pl-6 align-top">
                    {!row.productId ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => {
                            const newDetails = [...exportDetails];
                            newDetails[index].sku = e.target.value;
                            setExportDetails(newDetails);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSkuBlur(index);
                            }
                          }}
                          className="w-40 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                          placeholder="Nhập SKU..."
                        />
                      </div>
                    ) : (
                      <div className="flex gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                          <img
                            src={
                              row.thumbnail
                                ? getImageUrl(row.thumbnail)
                                : row.previewUrl ||
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
                            {row.productName}
                          </div>
                          <div className="text-xs text-slate-900 truncate font-mono">
                            {row.sku} | {row.barcode}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {row.selectedBatch ? (
                      <div className="text-xs">
                        <p className="font-mono text-slate-700 font-medium">
                          {row.selectedBatch.batchCode}
                        </p>
                        <p className="text-slate-500 mt-1">
                          HSD:{" "}
                          {new Date(
                            row.selectedBatch.expiryDate,
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Chưa chọn</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.selectedBatch ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-sm">
                        {row.selectedBatch.availableQty}
                      </span>
                    ) : (
                      <span className="text-slate-400">---</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      max={row.selectedBatch?.availableQty || 0}
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      disabled={!row.selectedBatch}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:cursor-not-allowed mx-auto block"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      value={row.price}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-green-500 ml-auto block"
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {row.total.toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row & Total */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all font-medium text-sm text-slate-700"
          >
            <Plus size={18} />
            Thêm dòng
          </button>
          <div className="text-right">
            <p className="text-sm text-slate-600 mb-1">
              Tổng giá trị phiếu xuất
            </p>
            <p className="text-2xl font-bold text-green-600">
              {totalAmount.toLocaleString()} ₫
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving || !isValidStaff}
          className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 font-medium text-lg"
        >
          <Save size={24} />
          {isSaving ? "Đang lưu..." : "Hoàn tất xuất kho"}
        </button>
      </div>

      {/* Modals */}
      <BatchSelectionModal
        isOpen={isBatchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        batches={availableBatches}
        onSelectBatch={handleBatchSelect}
        productName={currentProductName}
      />

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
        isOpen={isQuickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        onSuccess={handleModalSubmit}
        suppliers={suppliers}
        initialData={editingData}
      />
    </div>
  );
};

export default InventoryExportPage;

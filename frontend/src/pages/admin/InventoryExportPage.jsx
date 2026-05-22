import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiSave as Save,
  FiPackage as Package,
  FiCalendar as Calendar,
  FiUser as User,
  FiSmile as Smile,
  FiFileText as FileText,
  FiPlus as Plus,
  FiX as X,
  FiCheckCircle as CheckCircle,
  FiAlertCircle as AlertCircle,
  FiPackage as PackagePlus,
  FiShuffle as Dices,
  FiUpload as Upload,
  FiImage as ImageIcon,
  FiChevronUp as ChevronUp,
  FiLoader as Loader,
} from "react-icons/fi";
import { FaCalendarAlt, FaUserAlt, FaUserEdit, FaClipboardList, FaUserTie } from "react-icons/fa";
import { LuPackageMinus } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import { getImageUrl } from "../../utils/imageUrl";
import Swal from "sweetalert2";
import productService from "../../services/productService";
import inventoryService from "../../services/inventoryService";
import userService from "../../services/userService";
import batchService from "../../services/batchService";
import supplierService from "../../services/supplierService";
import BatchSelectionModal from "../../components/BatchSelectionModal";

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
                Verify Product
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

        {/* Body - Results */}
        <div className="px-8 py-6 flex-auto min-h-0 overflow-y-auto custom-scrollbar">
          {isSearching && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center text-slate-600 font-medium">
              Checking product...
            </div>
          )}

          {!isSearching && hasSearched && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {searchResult ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle className="text-emerald-600" size={24} />
                    <h3 className="text-lg font-medium text-slate-900">
                      Product found!
                    </h3>
                  </div>

                  {/* Grid 2 columns for details */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-2 gap-x-10 gap-y-6">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Product Name
                      </p>
                      <p className="font-medium text-slate-900">
                        {searchResult.name}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        SKU Code
                      </p>
                      <p className="font-medium text-green-600">
                        {searchResult.sku}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Brand
                      </p>
                      <p className="font-medium text-slate-700">
                        {searchResult.brand || "---"}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                        Import Price
                      </p>
                      <p className="font-medium text-emerald-600">
                        {searchResult.importPrice?.toLocaleString() || "0"} ₫
                      </p>
                    </div>

                    {/* Button row */}
                    <div className="col-span-2 pt-4 flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 px-6 py-3.5 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
                      >
                        Verify Again
                      </button>
                      <button
                        onClick={handleUseProduct}
                        className="flex-[2] px-6 py-3.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-100 active:scale-95"
                      >
                        Use this product
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
                    Product not found
                  </h3>
                  <div className="mt-6 flex gap-3 max-w-md mx-auto">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
                    >
                      Verify Again
                    </button>
                    <button
                      onClick={handleAddNew}
                      className="flex-[2] px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium"
                    >
                      Add new product
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
      toast.warning("Please enter product name!");
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
              {initialData ? "Quick Update Product" : "Quick Add Product"}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Fill in product details to export immediately
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
                    Product Details
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                      Product Name
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!!initialData}
                      className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 focus:border-green-400 transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-900 focus:bg-white"}`}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Brand
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
                          <option value="">-- Select Brand --</option>
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
                        Barcode
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
                      SKU Code
                    </label>
                    <div className="relative">
                      <input
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        disabled={!!initialData}
                        className={`w-full pl-5 pr-40 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="Product SKU"
                      />
                      {!initialData && (
                        <button
                          type="button"
                          onClick={handleGenerateRandom}
                          className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-green-600 hover:bg-green-50 hover:border-green-200 transition-all flex items-center gap-1"
                        >
                          <Dices size={14} /> Generate Random
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Export Price
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
                        placeholder="Enter export price"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Shelf Life (days)
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
                        placeholder="Enter shelf life"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Origin
                      </label>
                      <input
                        value={formData.origin}
                        onChange={(e) =>
                          setFormData({ ...formData, origin: e.target.value })
                        }
                        disabled={!!initialData}
                        className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all font-medium ${initialData ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 focus:bg-white"}`}
                        placeholder="Enter origin"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 mb-2 ml-1">
                        Unit
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
                          <option value="Thùng">Carton</option>
                          <option value="Lốc">Pack</option>
                          <option value="Vỉ">Blister</option>
                          <option value="Chai">Bottle</option>
                          <option value="Cái">Piece</option>
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
                    Product Image
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
                        <p className="text-xs font-medium">No image available</p>
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
                        <p className="text-xs font-medium">Upload Image</p>
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
                          Change
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-3 font-medium">
                  {initialData
                    ? "Current product image"
                    : "Supported: png, jpg, webp"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-10 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-medium text-sm active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Save size={18} />
              {initialData ? "Update Product" : "Save to Export Note"}
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
      toast.warning(`Only ${maxQty} items available in this batch!`);
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
      toast.warning("Must have at least 1 product!");
      return;
    }
    setExportDetails(exportDetails.filter((_, i) => i !== index));
  };

  // Submit export note
  const handleSubmit = async () => {
    if (!header.staffId || !isValidStaff) {
      toast.warning("Please enter a valid Staff ID!");
      return;
    }

    if (!header.customerName && header.exportReason === "Xuất bán") {
      toast.warning("Please enter customer name!");
      return;
    }

    const validDetails = exportDetails.filter(
      (d) => d.selectedBatch && d.quantity > 0,
    );
    if (validDetails.length === 0) {
      toast.warning(
        "Please select at least 1 product with a valid batch and quantity!",
      );
      return;
    }

    const result = await Swal.fire({
      title: "Confirm export?",
      text: "Are you sure you want to save this export note?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
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
      toast.success("Inventory exported successfully!");
      navigate("/inventory/list");
    } catch (error) {
      toast.error(error.response?.data || "An error occurred during inventory export");
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = exportDetails.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="admin-page-shell p-4 md:p-6 text-slate-700">
      <GlobalStyles />
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
            Goods Export
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Select specific batches to export
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
          <span className="text-[16px] font-bold text-slate-500 mb-1">
            Export Note Code
          </span>
          <div className="text-xl font-medium text-green-600 font-mono tracking-wide">
            {header.code}
          </div>
        </div>
      </div>

      {/* Info Form */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="space-y-2 md:col-span-3">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <FaCalendarAlt size={16} className="text-green-500" /> Export Time
            </label>
            <input
              type="datetime-local"
              value={header.exportDate}
              readOnly
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3 focus:outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <FaUserAlt size={16} className="text-green-500" /> Staff ID
            </label>
            <div className="relative">
              <input
                value={header.staffId}
                onChange={handleStaffIdChange}
                className={`w-full border font-medium rounded-2xl px-4 py-3 focus:outline-none transition-all ${isValidStaff === true ? "border-emerald-400 bg-emerald-50/50 text-emerald-700" : isValidStaff === false ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"}`}
                placeholder="Enter ID..."
              />
              {isValidStaff === true && (
                <div className="absolute right-4 top-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              )}
            </div>
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <FaUserEdit size={16} className="text-green-500" /> Executor
            </label>
            <input
              value={header.staffName}
              disabled
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3"
              placeholder="Staff Name"
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <LuPackageMinus size={16} className="text-green-500" /> Export Reason
            </label>
            <div className="relative">
              <select
                value={header.exportReason}
                onChange={(e) => {
                  setHeader({ ...header, exportReason: e.target.value });
                  e.target.blur();
                }}
                className="w-full border border-slate-200 bg-[#ffffff] font-medium text-slate-600 rounded-2xl px-4 py-3 focus:outline-none transition-all appearance-none cursor-pointer peer"
              >
                <option value="Xuất bán">Sales</option>
                <option value="Xuất hủy">Damaged/Expired</option>
                <option value="Xuất nội bộ">Internal Use</option>
                <option value="Trả hàng">Return</option>
              </select>
              <ChevronUp
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform duration-200 peer-focus:rotate-180"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-4">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <FaUserTie size={16} className="text-green-500" /> Customer Name
            </label>
            <input
              value={header.customerName}
              onChange={(e) =>
                setHeader({ ...header, customerName: e.target.value })
              }
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3 focus:outline-none transition-all"
              placeholder="Enter customer name..."
            />
          </div>

          <div className="space-y-2 md:col-span-8">
            <label className="text-base font-medium text-slate-500 flex items-center gap-2">
              <FaClipboardList size={16} className="text-green-500" /> Notes
            </label>
            <input
              value={header.note}
              onChange={(e) => setHeader({ ...header, note: e.target.value })}
              className="w-full border border-slate-200 text-slate-600 font-medium rounded-2xl px-4 py-3 focus:outline-none transition-all"
              placeholder="Enter note for export..."
            />
          </div>
        </div>
      </div>

      {/* Export Details Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-[#647368] border-b border-slate-100 text-left">
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-80 first:pl-6">
                  Product Info
                </th>
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-40">
                  Batch
                </th>
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-32 text-center">
                  Batch Stock
                </th>
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-32 text-center">
                  Export Qty
                </th>
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-40 text-center">
                  Export Price
                </th>
                <th className="py-5 px-4 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-40 text-center">
                  Subtotal
                </th>
                <th className="py-5 px-2 !text-base font-medium !text-white !bg-[#647368] whitespace-nowrap w-32 text-center last:pr-6">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exportDetails.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:!bg-transparent transition-colors group"
                >
                  <td className="py-4 px-2 align-middle first:pl-6">
                    {!row.productId ? (
                      <div className="relative">
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
                          className="w-44 h-10 border border-slate-300 pl-9 pr-3 py-2 rounded-xl text-sm font-medium focus:outline-none text-slate-600 transition-all shadow-sm focus:ring-2 focus:ring-green-500"
                          placeholder="Enter SKU..."
                        />
                        <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
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
                  <td className="py-4 px-2 align-middle">
                    {row.selectedBatch ? (
                      <div className="text-xs">
                        <p className="font-mono text-slate-700 font-medium">
                          {row.selectedBatch.batchCode}
                        </p>
                        <p className="text-slate-500 mt-1">
                          Expiry:{" "}
                          {new Date(
                            row.selectedBatch.expiryDate,
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Not selected</span>
                    )}
                  </td>
                  <td className="py-4 px-2 align-middle text-center">
                    {row.selectedBatch ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium text-sm">
                        {row.selectedBatch.availableQty}
                      </span>
                    ) : (
                      <span className="text-slate-400">---</span>
                    )}
                  </td>
                  <td className="py-4 px-2 align-middle text-center">
                    <input
                      type="number"
                      min="0"
                      max={row.selectedBatch?.availableQty || 0}
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      disabled={!row.selectedBatch}
                      className="w-24 h-10 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-center focus:outline-none text-slate-600 transition-all shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed mx-auto block"
                    />
                  </td>
                  <td className="py-4 px-2 align-middle text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.price}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="w-32 h-10 border border-slate-300 rounded-xl px-3 py-2 text-sm text-center font-medium focus:outline-none text-slate-600 transition-all shadow-sm mx-auto block"
                    />
                  </td>
                  <td className="py-4 px-2 align-middle text-center">
                    <div className="w-36 h-10 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-center text-slate-600 text-sm flex items-center justify-center mx-auto">
                      {row.total.toLocaleString()} ₫
                    </div>
                  </td>
                  <td className="py-4 px-1 align-middle text-center last:pr-6">
                    <div className="flex items-center justify-center gap-0">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-xl transition-all"
                        title="Delete"
                      >
                        <MdDelete size={20} />
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
            onClick={handleAddRow}
            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-5 py-2.5 rounded-2xl transition-all"
          >
            <Plus size={18} /> Add Row
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-baseline gap-3 pl-2">
          <span className="text-slate-500 font-medium text-sm">
            Total Export Value:
          </span>
          <span className="font-medium text-2xl text-slate-800">
            {totalAmount.toLocaleString()}{" "}
            <span className="text-base text-slate-500">VNĐ</span>
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/inventory/list")}
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-medium hover:bg-slate-200 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !isValidStaff}
            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-medium hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            {isSaving ? <Loader className="h-[18px] w-[18px] animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
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

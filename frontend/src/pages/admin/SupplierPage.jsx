import { toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import supplierService from "../../services/supplierService";
import productService from "../../services/productService";
import {
  Edit,
  Search,
  Phone,
  Mail,
  MapPin,
  Power,
  Building2,
  Info,
  Trash2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const initialForm = {
    vietnameseName: "",
    englishName: "",
    tradingName: "",
    brand: "",
    phone: "",
    email: "",
    address: "",
    taxCode: "",
    note: "",
  };
  const [formData, setFormData] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data);
    } catch (error) {
      console.error("Lỗi tải NCC:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await supplierService.update(selectedId, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await supplierService.create(formData);
        toast.success("Thêm mới thành công!");
      }
      fetchSuppliers();
      closeModal();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || "Có lỗi xảy ra"));
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      vietnameseName: supplier.vietnameseName,
      englishName: supplier.englishName || "",
      tradingName: supplier.tradingName || "",
      brand: supplier.brand || "",
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      taxCode: supplier.taxCode || "",
      note: supplier.note || "",
    });
    setSelectedId(supplier.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận trạng thái?",
      text: "Bạn muốn thay đổi trạng thái NCC này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy bỏ",
    });

    if (result.isConfirmed) {
      await supplierService.toggleStatus(id);
      fetchSuppliers();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData(initialForm);
  };

  const getProductImageUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `http://localhost:8080/${path}`;
  };

  const handleViewProducts = async (supplier) => {
    setShowProductsModal(true);
    setSelectedSupplierName(
      supplier.tradingName || supplier.vietnameseName || supplier.code,
    );
    setIsLoadingProducts(true);
    setSupplierProducts([]);

    try {
      const res = await productService.getAll();
      const productsOfSupplier = (res.data || []).filter(
        (product) => product?.supplier?.id === supplier.id,
      );
      setSupplierProducts(productsOfSupplier);
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm của nhà cung cấp");
      setShowProductsModal(false);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa nhà cung cấp?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy bỏ",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await supplierService.delete(id);
      toast.success("Xóa nhà cung cấp thành công!");
      fetchSuppliers();
    } catch (error) {
      toast.error(
        "Lỗi: " + (error.response?.data || "Không thể xóa nhà cung cấp"),
      );
    }
  };

  // Cập nhật logic tìm kiếm
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.vietnameseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tradingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="admin-page-shell p-6 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                Quản lý nhà cung cấp
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Tạo nhà cung cấp, quản lý thông tin và trạng thái hoạt động
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative w-[420px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo tên công ty, tên viết tắt"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition whitespace-nowrap"
          >
            Thêm nhà cung cấp
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className={`bg-white p-5 rounded-xl shadow-sm border transition-all hover:shadow-md ${!s.active ? "opacity-75 bg-slate-50" : "border-slate-100"}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">
                      {s.code}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-indigo-500 hover:text-indigo-600"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleViewProducts(s)}
                        className="text-sky-500 hover:text-sky-600"
                        title="Xem sản phẩm"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s.id)}
                        className={`${s.active ? "text-rose-500" : "text-slate-400"}`}
                        title="Bật/Tắt trạng thái"
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(s.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Xóa nhà cung cấp"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 uppercase">
                    {s.tradingName || s.vietnameseName}
                  </h3>
                  {s.tradingName && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[40px]">
                      {s.vietnameseName}
                    </p>
                  )}
                  {s.brand && (
                    <span className="inline-block mt-2 text-xs border border-orange-200 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      Brand: {s.brand}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-800" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-800" />
                  <span>{s.email}</span>
                </div>
                {s.address && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={14}
                      className="text-slate-800 mt-1 shrink-0"
                    />
                    <span className="line-clamp-2">{s.address}</span>
                  </div>
                )}
                <div className="text-xs pt-2 text-slate-800 flex items-center gap-1">
                  <Building2 size={12} /> Mã số thuế: {s.taxCode || "---"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 relative">
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-slate-800 tracking-tight">
                  {isEditing
                    ? "Cập nhật thông tin nhà cung cấp"
                    : "Thêm nhà cung cấp mới"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Vui lòng kiểm tra kỹ các thông tin có đánh dấu
              </p>
            </div>

            <div className="overflow-y-auto px-8 pb-8 [&::-webkit-scrollbar]:hidden">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">
                      Thông tin định danh
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Tên viết tắt
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên viết tắt"
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                        value={formData.tradingName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tradingName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập thương hiệu"
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Tên Tiếng Việt
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Nhập tên đầy đủ bằng tiếng Việt"
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={formData.vietnameseName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vietnameseName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Tên Tiếng Anh
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên đầy đủ bằng tiếng Anh"
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={formData.englishName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            englishName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm thông tin liên hệ & chi tiết */}
                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">
                      Thông tin liên hệ và chi tiết
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Số điện thoại{" "}
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                        Mã số thuế
                      </label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={formData.taxCode}
                        onChange={(e) =>
                          setFormData({ ...formData, taxCode: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="example@domain.com"
                      className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                      Địa chỉ trụ sở
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                      Giới thiệu
                    </label>
                    <textarea
                      className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none [&::-webkit-scrollbar]:hidden"
                      rows="6"
                      placeholder="Nhập mô tả ngắn về nhà cung cấp..."
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                    ></textarea>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-10 py-3 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 active:scale-95 transition-all"
                  >
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showProductsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowProductsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-medium text-slate-800 tracking-tight">
                Sản phẩm thuộc nhà cung cấp
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Nhà cung cấp: {selectedSupplierName}
              </p>
            </div>

            <div className="overflow-y-auto px-8 pb-8 pt-5 [&::-webkit-scrollbar]:hidden">
              {isLoadingProducts ? (
                <p className="text-sm text-slate-500">
                  Đang tải dữ liệu sản phẩm
                </p>
              ) : supplierProducts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nhà cung cấp này hiện chưa có sản phẩm nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {supplierProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                    >
                      {product.thumbnail ? (
                        <img
                          src={getProductImageUrl(product.thumbnail)}
                          alt={product.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                          No Img
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPage;

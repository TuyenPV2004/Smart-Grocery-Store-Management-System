import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import promotionService from "../../services/promotionService";
import productService from "../../services/productService";
import {
  Edit,
  Trash2,
  Tag,
  Calendar,
  Percent,
  DollarSign,
  X,
  Info,
} from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
    productIds: [],
  });

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  const fetchData = async () => {
    try {
      const res = await promotionService.getAll();
      setPromotions(res.data);
    } catch (error) {
      console.error("Lỗi tải khuyến mãi:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      // res.data might be an array or paginated object, assuming array here
      setProducts(res.data?.content || res.data || []);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductToggle = (productId) => {
    setFormData((prev) => {
      const isSelected = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: isSelected
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        promotion: {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        },
        productIds: formData.productIds,
      };

      if (formData.id) {
        await promotionService.update(formData.id, payload);
        toast.success("Cập nhật khuyến mãi thành công!");
      } else {
        await promotionService.create(payload);
        toast.success("Tạo khuyến mãi mới thành công!");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn sẽ không thể khôi phục lại khuyến mãi này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy bỏ",
    });

    if (result.isConfirmed) {
      try {
        await promotionService.delete(id);
        toast.success("Xóa thành công!");
        fetchData();
      } catch (error) {
        toast.error("Lỗi khi xóa: " + (error.response?.data || error.message));
      }
    }
  };

  const openEdit = (promo) => {
    setFormData({
      id: promo.id,
      name: promo.name,
      description: promo.description || "",
      discountType: promo.discountType || "PERCENTAGE",
      discountValue: promo.discountValue || "",
      startDate: promo.startDate
        ? moment(promo.startDate).utc().format("YYYY-MM-DDTHH:mm")
        : "",
      endDate: promo.endDate
        ? moment(promo.endDate).utc().format("YYYY-MM-DDTHH:mm")
        : "",
      status: promo.status || "ACTIVE",
      productIds: promo.products ? promo.products.map((p) => p.id) : [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
      productIds: [],
    });
    setShowModal(true);
  };

  return (
    <div className="admin-page-shell p-6 font-poppins antialiased text-slate-600 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              Quản lý Khuyến mãi
            </h1>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              Thiết lập siêu khuyến mãi, giảm giá cho sản phẩm
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center shadow-sm hover:bg-green-700 transition-all active:scale-95 font-medium gap-2"
          >
            Thêm khuyến mãi
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Tên GD
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Chiết khấu
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Bắt đầu
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Kết thúc
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 whitespace-nowrap w-[150px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {promo.name}
                      </div>
                      <div className="text-[12px] text-slate-400 mt-1 line-clamp-1">
                        {promo.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100/50">
                        {promo.discountType === "PERCENTAGE"
                          ? `${promo.discountValue}%`
                          : `${promo.discountValue.toLocaleString()}đ`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-slate-900 flex items-center gap-1 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          {moment(promo.startDate)
                            .utc()
                            .format("HH:mm DD/MM/YYYY")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-slate-900 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          {moment(promo.endDate)
                            .utc()
                            .format("HH:mm DD/MM/YYYY")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[12px] font-medium ${promo.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {promo.status === "ACTIVE" ? "Đang chạy" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedPromo(promo);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-xl transition-all"
                          title="Chi tiết"
                        >
                          <Info size={18} />
                        </button>
                        <button
                          onClick={() => openEdit(promo)}
                          className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-xl transition-all"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-all"
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
          {promotions.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
              <Tag size={48} className="text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">
                Chưa có chương trình khuyến mãi nào
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                {formData.id ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
              <form
                id="promoForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                    Thông tin chung
                  </h3>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-2">
                      Tên chương trình
                    </label>
                    <input
                      required
                      name="name"
                      className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nhập tên chương trình"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows="2"
                      name="description"
                      className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm resize-none"
                      placeholder="Chi tiết khuyến mãi"
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                      Mức giảm
                    </h3>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Loại chiết khấu
                      </label>
                      <select
                        name="discountType"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                        value={formData.discountType}
                        onChange={handleChange}
                      >
                        <option value="PERCENTAGE">Phần trăm</option>
                        <option value="FIXED_AMOUNT">Số tiền</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Giá trị giảm
                      </label>
                      <input
                        type="number"
                        required
                        name="discountValue"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                        value={formData.discountValue}
                        onChange={handleChange}
                        placeholder="Nhập số"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                      Thời gian
                    </h3>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Từ ngày
                      </label>
                      <input
                        type="datetime-local"
                        step="60"
                        required
                        lang="en-GB"
                        name="startDate"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Đến ngày
                      </label>
                      <input
                        type="datetime-local"
                        step="60"
                        required
                        lang="en-GB"
                        name="endDate"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-indigo-600">
                      Sản phẩm áp dụng{" "}
                      {formData.productIds.length > 0 &&
                        `(${formData.productIds.length})`}
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl">
                    {products.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Không có sản phẩm nào
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 bg-slate-50 font-medium text-slate-600 z-10 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-4 w-12 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                checked={
                                  formData.productIds.length > 0 &&
                                  formData.productIds.length === products.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((p) => ({
                                      ...p,
                                      productIds: products.map((x) => x.id),
                                    }));
                                  } else {
                                    setFormData((p) => ({
                                      ...p,
                                      productIds: [],
                                    }));
                                  }
                                }}
                              />
                            </th>
                            <th className="py-2 px-4 text-xs font-semibold">
                              Tên sản phẩm
                            </th>
                            <th className="py-2 px-4 text-xs font-semibold text-right">
                              Giá bán
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {products.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-50/50 cursor-pointer"
                              onClick={() => handleProductToggle(p.id)}
                            >
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  readOnly
                                  checked={formData.productIds.includes(p.id)}
                                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 pointer-events-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-700 flex items-center gap-2">
                                {p.thumbnail && (
                                  <img
                                    src={`http://localhost:8080/${p.thumbnail}`}
                                    className="w-8 h-8 rounded-lg object-cover"
                                    alt=""
                                  />
                                )}
                                <span className="line-clamp-1">{p.name}</span>
                              </td>
                              <td className="py-2.5 px-4 text-right text-slate-500">
                                {p.sellPrice?.toLocaleString()}đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-[13px] font-medium text-slate-700">
                    Trạng thái:
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.status === "ACTIVE"}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          status: e.target.checked ? "ACTIVE" : "INACTIVE",
                        }))
                      }
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-500">
                    {formData.status === "ACTIVE" ? "Kích hoạt" : "Tắt"}
                  </span>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-all border border-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                form="promoForm"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {formData.id ? "Lưu thay đổi" : "Tạo khuyến mãi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedPromo && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                Chi tiết khuyến mãi
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                  Thông tin chung
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Tên chương trình:</p>
                    <p className="font-medium text-slate-800">
                      {selectedPromo.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Trạng thái:</p>
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-medium inline-block ${selectedPromo.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {selectedPromo.status === "ACTIVE"
                        ? "Đang chạy"
                        : "Đã tắt"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Mô tả:</p>
                    <p className="font-medium text-slate-800">
                      {selectedPromo.description || "Không có mô tả"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                    Mức giảm
                  </h3>
                  <div className="text-sm">
                    <p className="text-slate-500 mb-1">Chiết khấu:</p>
                    <p className="font-medium text-slate-800">
                      {selectedPromo.discountType === "PERCENTAGE"
                        ? `${selectedPromo.discountValue}%`
                        : `${selectedPromo.discountValue.toLocaleString()}đ`}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                    Thời gian
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center">
                      <p className="w-20 text-slate-500">Bắt đầu:</p>
                      <p className="font-medium text-slate-800">
                        {moment(selectedPromo.startDate)
                          .utc()
                          .format("HH:mm DD/MM/YYYY")}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <p className="w-20 text-slate-500">Kết thúc:</p>
                      <p className="font-medium text-slate-800">
                        {moment(selectedPromo.endDate)
                          .utc()
                          .format("HH:mm DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                  Sản phẩm áp dụng ({selectedPromo.products?.length || 0})
                </h3>
                {selectedPromo.products && selectedPromo.products.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="sticky top-0 bg-slate-50 font-medium text-slate-600 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-4 text-xs font-semibold">
                            Sản phẩm
                          </th>
                          <th className="py-2 px-4 text-xs font-semibold text-right">
                            Giá bán
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedPromo.products.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-2.5 px-4 font-medium text-slate-700 flex items-center gap-2">
                              {p.thumbnail && (
                                <img
                                  src={`http://localhost:8080/${p.thumbnail}`}
                                  className="w-8 h-8 rounded-lg object-cover"
                                  alt=""
                                />
                              )}
                              <span className="line-clamp-1">{p.name}</span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-500">
                              {p.sellPrice?.toLocaleString()}đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Không có sản phẩm nào được áp dụng
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;

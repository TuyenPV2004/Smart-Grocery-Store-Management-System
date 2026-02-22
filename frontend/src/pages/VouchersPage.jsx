import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import voucherService from "../services/voucherService";
import {
  Edit,
  Trash2,
  Ticket,
  Percent,
  DollarSign,
  X,
  Info,
} from "lucide-react";
import moment from "moment";

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: 0,
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await voucherService.getAll();
      setVouchers(res.data);
    } catch (error) {
      console.error("Lỗi tải voucher:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        id: formData.id,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscountAmount: formData.maxDiscountAmount
          ? Number(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      if (formData.id) {
        await voucherService.update(formData.id, payload);
        toast.success("Cập nhật mã giảm giá thành công!");
      } else {
        await voucherService.create(payload);
        toast.success("Tạo mã giảm giá mới thành công!");
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
    if (window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      try {
        await voucherService.delete(id);
        toast.success("Xóa thành công!");
        fetchData();
      } catch (error) {
        toast.error("Lỗi khi xóa: " + (error.response?.data || error.message));
      }
    }
  };

  const openEdit = (voucher) => {
    setFormData({
      id: voucher.id,
      code: voucher.code,
      description: voucher.description || "",
      discountType: voucher.discountType || "PERCENTAGE",
      discountValue: voucher.discountValue || "",
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscountAmount: voucher.maxDiscountAmount || "",
      usageLimit: voucher.usageLimit || "",
      startDate: voucher.startDate
        ? moment(voucher.startDate).utc().format("YYYY-MM-DDTHH:mm")
        : "",
      endDate: voucher.endDate
        ? moment(voucher.endDate).utc().format("YYYY-MM-DDTHH:mm")
        : "",
      status: voucher.status || "ACTIVE",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minOrderValue: 0,
      maxDiscountAmount: "",
      usageLimit: "",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="p-6 font-poppins antialiased text-slate-600 bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              Quản lý mã giảm giá
            </h1>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              Thiết lập mã khuyến mãi cho giỏ hàng
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center shadow-sm hover:bg-indigo-700 transition-all active:scale-95 font-medium gap-2"
          >
            Thêm mã giảm giá
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Mã Code
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Chiết khấu
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Đơn tối thiểu
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Từ ngày
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Đến ngày
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Lượt sử dụng
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
                {vouchers.map((voucher) => (
                  <tr
                    key={voucher.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded inline-block">
                        {voucher.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-slate-600 line-clamp-2 max-w-[200px]">
                        {voucher.description || (
                          <span className="text-slate-400 italic">
                            Không có
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100/50">
                        {voucher.discountType === "PERCENTAGE"
                          ? `${voucher.discountValue}%`
                          : formatCurrency(voucher.discountValue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {formatCurrency(voucher.minOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] text-slate-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        {moment(voucher.startDate)
                          .utc()
                          .format("YYYY-MM-DD HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] text-slate-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        {moment(voucher.endDate)
                          .utc()
                          .format("YYYY-MM-DD HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <span className="text-indigo-600">
                        {voucher.usedCount || 0}
                      </span>{" "}
                      / {voucher.usageLimit ? voucher.usageLimit : "∞"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[12px] font-medium ${voucher.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {voucher.status === "ACTIVE" ? "Kích hoạt" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedVoucher(voucher);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-xl transition-all"
                          title="Chi tiết"
                        >
                          <Info size={18} />
                        </button>
                        <button
                          onClick={() => openEdit(voucher)}
                          className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-xl transition-all"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id)}
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
          {vouchers.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
              <Ticket size={48} className="text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">
                Chưa có mã giảm giá nào
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
                {formData.id ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
              <form
                id="voucherForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                    Thông tin chung
                  </h3>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-2">
                      Mã Code
                    </label>
                    <input
                      required
                      name="code"
                      className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm uppercase"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="VD: WELCOME2024"
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
                      placeholder="Chi tiết mã giảm giá (VD: Giảm 10% cho đơn từ 200k)"
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
                        placeholder={
                          formData.discountType === "PERCENTAGE"
                            ? "VD: 10"
                            : "VD: 50000"
                        }
                        min="0"
                      />
                    </div>
                    {formData.discountType === "PERCENTAGE" && (
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 mb-2">
                          Giảm tối đa (VNĐ)
                        </label>
                        <input
                          type="number"
                          name="maxDiscountAmount"
                          className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                          value={formData.maxDiscountAmount}
                          onChange={handleChange}
                          placeholder="Không giới hạn"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                      Điều kiện & Số lượng
                    </h3>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Đơn tối thiểu (VNĐ)
                      </label>
                      <input
                        type="number"
                        name="minOrderValue"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                        value={formData.minOrderValue}
                        onChange={handleChange}
                        placeholder="VD: 0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 mb-2">
                        Số lượt sử dụng tối đa
                      </label>
                      <input
                        type="number"
                        name="usageLimit"
                        className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-indigo-400 transition-all font-medium text-slate-700 text-sm"
                        value={formData.usageLimit}
                        onChange={handleChange}
                        placeholder="Không giới hạn"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 mb-2">
                    Thời gian
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
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
                form="voucherForm"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {formData.id ? "Lưu thay đổi" : "Tạo mã giảm giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                Chi tiết Voucher:{" "}
                <span className="text-indigo-600">{selectedVoucher.code}</span>
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Trạng thái:</p>
                  <span
                    className={`px-3 py-1 rounded-full text-[12px] font-medium inline-block ${selectedVoucher.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {selectedVoucher.status === "ACTIVE"
                      ? "Đang chạy"
                      : "Đã tắt"}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Mô tả:</p>
                  <p className="font-medium text-slate-800">
                    {selectedVoucher.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                    Mức giảm & Điều kiện
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chiết khấu:</span>
                      <span className="font-medium text-slate-800">
                        {selectedVoucher.discountType === "PERCENTAGE"
                          ? `${selectedVoucher.discountValue}%`
                          : formatCurrency(selectedVoucher.discountValue)}
                      </span>
                    </div>
                    {selectedVoucher.maxDiscountAmount && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Giảm tối đa:</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(selectedVoucher.maxDiscountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Đơn tối thiểu:</span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(selectedVoucher.minOrderValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-100 pb-2">
                    Lượt dùng & Thời gian
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Đã dùng:</span>
                      <span className="font-medium text-slate-800">
                        {selectedVoucher.usedCount || 0} /{" "}
                        {selectedVoucher.usageLimit || "Vô hạn"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bắt đầu:</span>
                      <span className="font-medium text-slate-800">
                        {moment(selectedVoucher.startDate)
                          .utc()
                          .format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kết thúc:</span>
                      <span className="font-medium text-slate-800">
                        {moment(selectedVoucher.endDate)
                          .utc()
                          .format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VouchersPage;

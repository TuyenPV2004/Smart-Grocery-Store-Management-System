import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  AlertCircle,
} from "lucide-react";
import priceService from "../services/priceService";

const PriceManagementModal = ({ isOpen, onClose, product, onPriceUpdated }) => {
  const [newPrice, setNewPrice] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setNewPrice(product.importPrice || "");
      fetchPriceHistory();
    }
  }, [isOpen, product]);

  const fetchPriceHistory = async () => {
    if (!product?.id) return;

    setIsLoading(true);
    try {
      const response = await priceService.getPriceHistory(product.id);
      setPriceHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) < 0) {
      alert("Vui lòng nhập giá hợp lệ!");
      return;
    }

    if (parseFloat(newPrice) === parseFloat(product.importPrice)) {
      alert("Giá mới phải khác giá hiện tại!");
      return;
    }

    setIsSaving(true);
    try {
      await priceService.updateProductPrice(product.id, parseFloat(newPrice));
      alert("Cập nhật giá thành công!");
      fetchPriceHistory();
      onPriceUpdated();
    } catch (error) {
      alert("Lỗi cập nhật giá: " + (error.response?.data || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  const calculatePercentageChange = (oldPrice, newPrice) => {
    if (oldPrice === 0) return 0;
    return (((newPrice - oldPrice) / oldPrice) * 100).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <ChartNoAxesCombined size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                Quản lý giá sản phẩm
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Cập nhập giá sản phẩm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 transition-all"
          >
            <X size={28} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <img
                src={
                  product?.thumbnail
                    ? `http://localhost:8080/${product.thumbnail}`
                    : "https://via.placeholder.com/80"
                }
                alt={product?.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-sm"
              />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 leading-tight">
                  {product?.name}
                </h3>
                <p className="text-sm text-slate-900 mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-medium text-slate-900 uppercase tracking-wider">
                    {product?.sku}
                  </span>
                </p>
                <p className="text-sm text-slate-900 mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-medium text-slate-900 uppercase tracking-wider">
                    {product?.brand}
                  </span>
                </p>
              </div>
            </div>

            {/* Grid Layout - Giữ nguyên MD:GRID-COLS-2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">
                  Đơn giá nhập
                </label>
                <div className="h-[52px] flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-medium text-slate-900">
                    {product?.importPrice?.toLocaleString() || "0"}
                    <span className="text-sm ml-1 text-slate-400 font-normal">
                      ₫
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wide ml-1">
                  Đơn giá mới
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full h-[52px] pl-4 pr-10 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-lg placeholder:text-slate-300"
                    placeholder="Nhập giá mới"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Button - Tinh chỉnh bo góc và độ bóng */}
            <button
              onClick={handleUpdatePrice}
              disabled={isSaving}
              className="mt-6 w-full px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-medium shadow-md shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={18} strokeWidth={2.5} />
              <span>
                {isSaving ? "Đang cập nhật..." : "Xác nhận cập nhật giá"}
              </span>
            </button>
          </div>

          {/* Price History */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              Lịch sử thay đổi giá
            </h3>

            {isLoading ? (
              <div className="text-center py-8 text-slate-500">
                Đang tải lịch sử...
              </div>
            ) : priceHistory.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                <AlertCircle
                  className="mx-auto text-slate-400 mb-2"
                  size={32}
                />
                <p className="text-slate-500 font-medium">
                  Chưa có lịch sử thay đổi giá
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left">Thời gian</th>
                      <th className="px-4 py-3 text-right">Giá cũ</th>
                      <th className="px-4 py-3 text-right">Giá mới</th>
                      <th className="px-4 py-3 text-center">Chênh lệch</th>
                      <th className="px-4 py-3 text-center">Role</th>
                      <th className="px-4 py-3 text-left">Nhân viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceHistory.map((history, index) => {
                      const percentChange = calculatePercentageChange(
                        history.oldPrice,
                        history.newPrice,
                      );
                      const isIncrease = percentChange > 0;

                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {formatDateTime(history.changedAt)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {history.oldPrice?.toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium">
                            {history.newPrice?.toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isIncrease
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {isIncrease ? (
                                <TrendingUp size={14} />
                              ) : (
                                <TrendingDown size={14} />
                              )}
                              {Math.abs(percentChange)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-slate-900 font-medium">
                              {history.userRole}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-medium">
                              {history.changedBy}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceManagementModal;

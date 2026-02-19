import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import priceService from "../services/priceService";

const PriceManagementModal = ({ isOpen, onClose, product, onPriceUpdated }) => {
  const [newImportPrice, setNewImportPrice] = useState("");
  const [newSellPrice, setNewSellPrice] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [isSavingSell, setIsSavingSell] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setNewImportPrice(product.importPrice || "");
      setNewSellPrice(product.sellPrice || "");
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

  const handleUpdateImportPrice = async () => {
    if (!newImportPrice || parseFloat(newImportPrice) < 0) {
      alert("Vui lòng nhập giá nhập hợp lệ!");
      return;
    }

    if (parseFloat(newImportPrice) === parseFloat(product.importPrice)) {
      alert("Giá nhập mới phải khác giá hiện tại!");
      return;
    }

    setIsSavingImport(true);
    try {
      await priceService.updateProductPrice(
        product.id,
        parseFloat(newImportPrice),
      );
      alert("Cập nhật giá nhập thành công!");
      fetchPriceHistory();
      onPriceUpdated();
    } catch (error) {
      alert(
        "Lỗi cập nhật giá nhập: " + (error.response?.data || error.message),
      );
    } finally {
      setIsSavingImport(false);
    }
  };

  const handleUpdateSellPrice = async () => {
    if (!newSellPrice || parseFloat(newSellPrice) < 0) {
      alert("Vui lòng nhập giá bán hợp lệ!");
      return;
    }

    if (parseFloat(newSellPrice) === parseFloat(product.sellPrice)) {
      alert("Giá bán mới phải khác giá hiện tại!");
      return;
    }

    setIsSavingSell(true);
    try {
      await priceService.updateSellPrice(product.id, parseFloat(newSellPrice));
      alert("Cập nhật giá bán thành công!");
      fetchPriceHistory();
      onPriceUpdated();
    } catch (error) {
      alert("Lỗi cập nhật giá bán: " + (error.response?.data || error.message));
    } finally {
      setIsSavingSell(false);
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
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
                Cập nhập giá nhập và giá bán
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

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          {/* Product Info */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <img
              src={
                product?.thumbnail
                  ? `http://localhost:8080/${product.thumbnail}`
                  : "https://via.placeholder.com/80"
              }
              alt={product?.name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                {product?.name}
              </h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-medium">
                  SKU: {product?.sku}
                </span>
                <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-medium">
                  {product?.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Import Price Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-md font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Giá nhập kho
              </h3>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">
                    Hiện tại
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {product?.importPrice?.toLocaleString() || "0"} ₫
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Giá nhập mới
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newImportPrice}
                      onChange={(e) => setNewImportPrice(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
                      placeholder="Nhập giá..."
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      ₫
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpdateImportPrice}
                  disabled={isSavingImport}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingImport ? "Đang lưu..." : "Cập nhật giá nhập"}
                </button>
              </div>
            </div>

            {/* Sell Price Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <h3 className="text-md font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Giá bán ra
              </h3>

              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-800">
                    Hiện tại
                  </span>
                  <span className="text-xl font-bold text-emerald-700">
                    {product?.sellPrice?.toLocaleString() || "0"} ₫
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Giá bán mới
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newSellPrice}
                      onChange={(e) => setNewSellPrice(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-lg"
                      placeholder="Nhập giá..."
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      ₫
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpdateSellPrice}
                  disabled={isSavingSell}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingSell ? "Đang lưu..." : "Cập nhật giá bán"}
                </button>
              </div>
            </div>
          </div>

          {/* Price History */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-slate-400 rounded-full"></div>
              Lịch sử thay đổi
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
                      <th className="px-4 py-3 text-center">Loại giá</th>
                      <th className="px-4 py-3 text-right">Giá cũ</th>
                      <th className="px-4 py-3 text-right">Giá mới</th>
                      <th className="px-4 py-3 text-center">Chênh lệch</th>
                      <th className="px-4 py-3 text-left">Người sửa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceHistory.map((history, index) => {
                      const percentChange = calculatePercentageChange(
                        history.oldPrice,
                        history.newPrice,
                      );
                      const isIncrease = percentChange > 0;
                      const isSellPrice = history.priceType === "SELL";

                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {formatDateTime(history.changedAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${isSellPrice ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {isSellPrice ? "Giá bán" : "Giá nhập"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {history.oldPrice?.toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">
                            {history.newPrice?.toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isIncrease
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
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
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-medium">
                              {history.changedBy}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {history.userRole}
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

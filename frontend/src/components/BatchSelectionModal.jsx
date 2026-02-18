import React from "react";
import { X, Package, Calendar, AlertCircle } from "lucide-react";

const BatchSelectionModal = ({
  isOpen,
  onClose,
  batches,
  onSelectBatch,
  productName,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return "unknown";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiry - today) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "warning";
    return "good";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "expired":
        return "bg-red-50 border-red-200 text-red-700";
      case "warning":
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-green-50 border-green-200 text-green-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl border border-slate-200 animate-in zoom-in duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <Package size={24} />
              </div>
              Chọn lô hàng xuất kho
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                Không có lô hàng nào khả dụng
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Sản phẩm này hiện đã hết hàng trong kho
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-rose-500" />
                <p className="text-sm text-slate-600 font-medium">
                  Danh sách được sắp xếp theo FEFO (Hết hạn trước - Xuất trước)
                </p>
              </div>

              {batches.map((batch, index) => {
                const status = getExpiryStatus(batch.expiryDate);
                const statusColor = getStatusColor(status);

                return (
                  <button
                    key={batch.id}
                    onClick={() => onSelectBatch(batch)}
                    className={`w-full p-5 border-2 rounded-2xl hover:border-rose-400 hover:shadow-lg transition-all text-left ${
                      index === 0
                        ? "border-rose-300 bg-rose-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded">
                              FEFO - Ưu tiên
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-medium">
                            Lô #{index + 1}
                          </span>
                        </div>
                        <p className="font-mono text-sm text-slate-700 font-medium">
                          {batch.batchCode}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg border-2 ${statusColor} text-sm font-medium`}
                      >
                        {batch.quantity} sản phẩm
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">
                          Ngày sản xuất
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(batch.manufacturingDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">
                          Hạn sử dụng
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            status === "expired"
                              ? "text-red-600"
                              : status === "warning"
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {formatDate(batch.expiryDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">
                          Xuất xứ
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {batch.origin || "---"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSelectionModal;

import { X, Clock, User, Tag, Shield, History } from "lucide-react";

const HistoryModal = ({ history, onClose }) => {
  // Format ngày giờ: HH:mm:ss dd/MM/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  // Helper để lấy màu sắc theo hành động (nhẹ nhàng hơn)
  const getActionStyle = (action) => {
    switch (action) {
      case "THÊM MỚI":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "XÓA":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-indigo-600 bg-indigo-50 border-indigo-100";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Section */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <History size={24} />
              </div>
              Lịch sử hoạt động
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Chi tiết các thay đổi đã được ghi lại trong hệ thống
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Clock size={40} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium text-[15px]">
                Chưa có dữ liệu lịch sử cho mục này
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((item) => (
                <div key={item.id} className="relative pl-10 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-400 z-10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                    {/* Action & Time */}
                    <div className="flex justify-between items-center mb-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium border uppercase tracking-wider ${getActionStyle(
                          item.action
                        )}`}
                      >
                        {item.action.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium text-xs">
                        <Clock size={14} />
                        {formatDate(item.timestamp)}
                      </div>
                    </div>

                    {/* Performed By Card */}
                    <div className="mb-4 flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100/50">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={16} />
                      </div>
                      <div className="text-sm font-medium">
                        <span className="text-slate-500">Người thực hiện:</span>
                        <span className="ml-2 text-slate-900">
                          {item.performedBy || "không xác định"}
                          {item.role && (
                            <span className="ml-2 text-slate-900">
                              - {item.role.replace("ROLE_", "").toLowerCase()}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Target Item Detail */}
                    <div className="flex items-start gap-3 pl-1">
                      <div className="mt-1 text-amber-500">
                        <Tag size={16} />
                      </div>
                      <div className="text-[14px] font-medium text-slate-600">
                        {item.categoryName ? (
                          <p>
                            Danh mục:{" "}
                            <span className="text-slate-900">
                              {item.categoryName}
                            </span>
                          </p>
                        ) : (
                          <p>
                            Sản phẩm:{" "}
                            <span className="text-slate-900">
                              {item.productName}
                            </span>
                            {item.sku && (
                              <span className="ml-2 text-slate-900 font-medium">
                                [{item.sku}]
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-700 transition-all font-medium text-[14px] shadow-lg shadow-slate-200 active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;

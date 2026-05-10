import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  Loader2,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import orderService from "../../services/orderService";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "PENDING", label: "Hàng chờ" },
];

const STATUS_META = {
  PENDING: {
    label: "Hàng chờ",
    className: "bg-amber-100 text-amber-700",
  },
  SHIPPING: {
    label: "SHIPPING",
    className: "bg-slate-100 text-slate-700",
  },
  COMPLETED: {
    label: "Hoàn thành",
    className: "bg-emerald-100 text-emerald-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-rose-100 text-rose-700",
  },
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchMyOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Không thể tải lịch sử đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    // Mỗi khi thay đổi bộ lọc hoặc danh sách đơn, quay lại trang đầu
    setCurrentPage(1);
  }, [statusFilter, orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const getStatusMeta = (status) => {
    return (
      STATUS_META[status] || {
        label: status || "Không xác định",
        className: "bg-slate-100 text-slate-700",
      }
    );
  };

  const totalPages = useMemo(() => {
    if (!filteredOrders.length) return 1;
    return Math.ceil(filteredOrders.length / pageSize);
  }, [filteredOrders, pageSize]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, pageSize]);

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "CANCELLED" } : order,
        ),
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: "CANCELLED" } : prev,
      );
      toast.success("Hủy đơn hàng thành công");
    } catch (error) {
      toast.error(error?.response?.data || "Không thể hủy đơn hàng");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="app-page-bg min-h-screen pt-6 pb-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-medium text-slate-900">
                Lịch sử đơn hàng
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Theo dõi trạng thái và xem chi tiết các đơn đã thanh toán.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  statusFilter === item.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Đang tải đơn hàng...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <ShoppingBag size={28} />
              </div>
              <h2 className="text-lg font-medium text-slate-800">
                Chưa có đơn phù hợp
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Bạn chưa có đơn hàng nào ở nhóm trạng thái đang chọn.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-sm text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-center whitespace-nowrap">STT</th>
                    <th className="px-4 py-3 whitespace-nowrap">Mã đơn</th>
                    <th className="px-4 py-3 whitespace-nowrap">Thời gian</th>
                    <th className="px-4 py-3 whitespace-nowrap">Tổng sản phẩm</th>
                    <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Giá tiền</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order, index) => {
                    const statusMeta = getStatusMeta(order.status);
                    const globalIndex = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 text-center font-medium text-slate-900">
                          {globalIndex}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                            {order.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {order.details?.length || 0} sản phẩm
                          {order.voucherCode && (
                            <span className="block text-xs mt-1">
                              Voucher: {order.voucherCode}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                          {formatCurrency(order.finalAmount)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 flex items-center gap-2 whitespace-nowrap"
                            >
                              <Eye size={16} />
                              Chi tiết
                            </button>
                            {order.status === "PENDING" && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrderId === order.id}
                                className="px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium hover:bg-rose-100 disabled:opacity-60 whitespace-nowrap"
                              >
                                {cancellingOrderId === order.id
                                  ? "Đang hủy..."
                                  : "Hủy đơn"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length > pageSize && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs sm:text-sm text-slate-500">
                    Hiển thị{" "}
                    <span className="font-medium text-slate-700">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-medium text-slate-700">
                      {Math.min(currentPage * pageSize, filteredOrders.length)}
                    </span>{" "}
                    trên{" "}
                    <span className="font-medium text-slate-700">
                      {filteredOrders.length}
                    </span>{" "}
                    đơn hàng
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border ${
                          currentPage === page
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative bg-white w-full max-w-3xl rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-slate-900">
                    Chi tiết đơn hàng
                  </h3>
                  <p className="text-lg text-slate-900 font-medium">
                    {selectedOrder.code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-500 hover:bg-white rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <p className="text-slate-500">Trạng thái</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {getStatusMeta(selectedOrder.status).label}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <p className="text-slate-500">Voucher</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {selectedOrder.voucherCode || "Không có"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <p className="text-slate-500">Thời gian đặt</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                    Danh sách sản phẩm
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Sản phẩm</th>
                          <th className="px-3 py-2.5 text-center">SL</th>
                          <th className="px-3 py-2.5 text-right">Đơn giá</th>
                          <th className="px-3 py-2.5 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedOrder.details || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2.5 text-slate-800">
                              {item.product?.name || "Sản phẩm"}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-600">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2.5 text-right text-slate-600">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                              {formatCurrency(item.totalLine)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div
                className={`px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3 ${
                  selectedOrder.status === "PENDING"
                    ? "justify-between"
                    : "justify-end"
                }`}
              >
                {selectedOrder.status === "PENDING" && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={cancellingOrderId === selectedOrder.id}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 disabled:opacity-60"
                  >
                    {cancellingOrderId === selectedOrder.id
                      ? "Đang hủy..."
                      : "Hủy đơn hàng"}
                  </button>
                )}
                <div className="flex items-baseline gap-2 text-right justify-end">
                  <p className="text-xs text-slate-500 whitespace-nowrap">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-medium text-slate-900">
                    {formatCurrency(selectedOrder.finalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default OrderHistoryPage;

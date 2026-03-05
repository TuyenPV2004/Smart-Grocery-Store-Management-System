import { useEffect, useMemo, useState } from "react";
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
];

const STATUS_META = {
  PENDING: {
    label: "PENDING",
    className: "bg-slate-100 text-slate-700",
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

  const fetchMyOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Không thể tải lịch sử đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="p-2 hover:bg-white rounded-full border border-slate-200 text-slate-500"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-medium text-slate-900">
                Lịch sử đơn hàng
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Theo dõi trạng thái và xem chi tiết các đơn đã thanh toán.
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            Mua thêm sản phẩm
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  statusFilter === item.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const statusMeta = getStatusMeta(order.status);
                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold font-mono">
                          {order.code}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <CalendarClock size={16} />
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-sm text-slate-500">
                        {order.details?.length || 0} sản phẩm
                        {order.voucherCode
                          ? ` • Voucher: ${order.voucherCode}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-start lg:justify-end">
                      <div className="text-left lg:text-right min-w-[170px]">
                        <p className="text-xs text-slate-500">
                          Tổng thanh toán
                        </p>
                        <p className="text-lg font-semibold text-emerald-600">
                          {formatCurrency(order.finalAmount)}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Chi tiết
                      </button>

                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 disabled:opacity-60"
                        >
                          {cancellingOrderId === order.id
                            ? "Đang hủy..."
                            : "Hủy đơn"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white w-full max-w-3xl rounded-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  Chi tiết đơn hàng
                </h3>
                <p className="text-sm text-slate-500 font-mono mt-1">
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
                  <Package size={16} />
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

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              {selectedOrder.status === "PENDING" ? (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  disabled={cancellingOrderId === selectedOrder.id}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 disabled:opacity-60"
                >
                  {cancellingOrderId === selectedOrder.id
                    ? "Đang hủy..."
                    : "Hủy đơn hàng"}
                </button>
              ) : (
                <span className="text-sm text-slate-500">
                  Đơn hàng này không thể hủy.
                </span>
              )}
              <div className="text-right">
                <p className="text-xs text-slate-500">Tổng thanh toán</p>
                <p className="text-xl font-semibold text-emerald-600">
                  {formatCurrency(selectedOrder.finalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

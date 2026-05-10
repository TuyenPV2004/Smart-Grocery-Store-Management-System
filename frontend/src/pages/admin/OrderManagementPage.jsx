import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  Calendar,
  Eye,
  FileSpreadsheet,
  Filter,
  Search,
  X,
} from "lucide-react";
import orderService from "../../services/orderService";

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getAll();
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      (order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm))) &&
      (statusFilter === "ALL" || order.status === statusFilter),
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-slate-100 text-slate-700";
      case "SHIPPING":
        return "bg-slate-100 text-slate-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "SHIPPING":
        return "Shipping";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "CHUYEN_KHOAN":
        return "Chuyển khoản";
      default:
        return method;
    }
  };

  const formatOrderDate = (dateValue) => {
    if (!dateValue) return "---";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateValue));
  };

  const getOrderDetailPricing = (order) => {
    const details = order?.details || [];
    const orderDiscount = Number(order?.discount || 0);
    const orderTotal = Number(order?.totalAmount || 0);

    if (details.length === 0) {
      return [];
    }

    if (orderDiscount <= 0 || orderTotal <= 0) {
      return details.map((item) => ({
        detailDiscount: 0,
        finalLineTotal: Number(item?.totalLine || 0),
      }));
    }

    const rawDiscounts = details.map((item, index) => ({
      index,
      raw: (orderDiscount * Number(item?.totalLine || 0)) / orderTotal,
    }));

    const baseDiscounts = rawDiscounts.map((item) => Math.floor(item.raw));
    let remainingDiscount =
      Math.round(orderDiscount) -
      baseDiscounts.reduce((sum, value) => sum + value, 0);

    const distributedDiscounts = [...baseDiscounts];

    rawDiscounts
      .map((item) => ({
        index: item.index,
        fraction: item.raw - Math.floor(item.raw),
      }))
      .sort((a, b) => b.fraction - a.fraction)
      .forEach(({ index }) => {
        if (remainingDiscount > 0) {
          distributedDiscounts[index] += 1;
          remainingDiscount -= 1;
        }
      });

    return details.map((item, index) => {
      const lineTotal = Number(item?.totalLine || 0);
      const detailDiscount = distributedDiscounts[index] || 0;

      return {
        detailDiscount,
        finalLineTotal: Math.max(lineTotal - detailDiscount, 0),
      };
    });
  };

  const detailPricing = getOrderDetailPricing(selectedOrder);
  const showDetailDiscountColumn =
    Number(selectedOrder?.discount || 0) > 0 &&
    detailPricing.some((item) => item.detailDiscount > 0);
  const productTableClassName = showDetailDiscountColumn
    ? "w-full table-fixed text-sm"
    : "w-full text-sm";
  const productHeaderClassName = showDetailDiscountColumn
    ? "w-[34%] px-4 py-3 text-left font-medium text-slate-800"
    : "px-4 py-3 text-left font-medium text-slate-800";
  const quantityHeaderClassName = showDetailDiscountColumn
    ? "w-16 px-4 py-3 text-center font-medium text-slate-800"
    : "px-4 py-3 text-center font-medium text-slate-800";
  const productNameContentClassName = showDetailDiscountColumn
    ? "line-clamp-2 break-words"
    : undefined;

  const handleExportExcel = async (order) => {
    try {
      const response = await orderService.exportExcel(order.id);
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${order.code || `Order_${order.id}`}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể xuất Excel cho đơn hàng này.");
    }
  };

  return (
    <div className="admin-page-shell min-h-screen space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và quản lý tất cả đơn hàng
          </p>
        </div>
        <div className="hidden">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <FileSpreadsheet size={18} />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-[300px] flex-1 items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm theo mã, tên khách, SĐT..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Filter size={16} className="text-slate-400" />
            <select
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="hidden">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Calendar size={16} className="mr-2 text-slate-400" />
            <span>Hôm nay</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Mã đơn
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Khách hàng
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Tổng tiền
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Nhân viên
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Thanh toán
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-900">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-900">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Đang tải dữ liệu
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="group transition-colors hover:bg-blue-50/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {order.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {order.finalAmount?.toLocaleString()} ₫
                      </div>
                      {order.discount > 0 && (
                        <div className="text-xs text-green-600">
                          - {order.discount?.toLocaleString()} ₫
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      {order.user?.fullName || order.username || (order.userId ? `#${order.userId}` : "---")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border border-transparent px-2.5 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right [direction:rtl]">
                      <button
                        onClick={() => handleExportExcel(order)}
                        className="p-2 text-emerald-600 transition-colors hover:text-emerald-700"
                        title="Xuất Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-600 transition-colors hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h2 className="text-xl font-medium text-slate-800">
                  Chi tiết đơn hàng
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <h3 className="mb-3 text-sm font-medium text-blue-800">
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Họ tên:</span>
                        <span className="text-right font-medium text-slate-900">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Số điện thoại:</span>
                        <span className="text-right font-medium text-slate-900">
                          {selectedOrder.customerPhone || "---"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Mã đơn:</span>
                        <span className="text-right font-medium text-slate-900">
                          {selectedOrder.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <h3 className="mb-3 text-sm font-medium text-slate-800">
                      Thông tin thanh toán
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Phương thức:</span>
                        <span className="text-right font-medium text-slate-900">
                          {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Thời gian:</span>
                        <span className="text-right font-medium text-slate-900">
                          {formatOrderDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusColor(
                            selectedOrder.status,
                          )}`}
                        >
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-800">
                    Danh sách sản phẩm
                  </h3>
                  <div className="overflow-hidden rounded-lg border">
                    <table className={productTableClassName}>
                      <thead className="bg-slate-50">
                        <tr>
                          <th className={productHeaderClassName}>
                            Sản phẩm
                          </th>
                          <th className={quantityHeaderClassName}>
                            SL
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-slate-800">
                            Đơn giá
                          </th>
                          {showDetailDiscountColumn && (
                            <th className="px-4 py-3 text-right font-medium text-slate-800">
                              Giảm giá
                            </th>
                          )}
                          <th className="px-4 py-3 text-right font-medium text-slate-800">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedOrder.details || []).map((item, idx) => {
                          const { detailDiscount, finalLineTotal } =
                            detailPricing[idx] || {
                              detailDiscount: 0,
                              finalLineTotal: Number(item?.totalLine || 0),
                            };

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-slate-800">
                                <div className={productNameContentClassName}>
                                  {item.product?.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-800">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-800">
                                {item.price?.toLocaleString()} ₫
                              </td>
                              {showDetailDiscountColumn && (
                                <td className="px-4 py-3 text-right text-slate-800">
                                  {detailDiscount > 0
                                    ? `${detailDiscount.toLocaleString()} ₫`
                                    : "---"}
                                </td>
                              )}
                              <td className="px-4 py-3 text-right font-medium text-slate-800">
                                {finalLineTotal.toLocaleString()} ₫
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-5">
                <div className="flex items-center gap-3 text-right">
                  <div className="text-sm text-slate-500">Tổng thanh toán</div>
                  <div className="text-2xl font-medium leading-none text-green-600">
                    {selectedOrder.finalAmount?.toLocaleString()} ₫
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default OrderManagementPage;

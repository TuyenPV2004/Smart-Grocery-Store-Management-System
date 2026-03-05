import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Calendar,
  Filter,
  ArrowUpDown,
  Download,
  X,
  Printer,
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
        return "PENDING";
      case "SHIPPING":
        return "SHIPPING";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "CASH":
        return "Tiền mặt";
      case "TRANSFER":
        return "Chuyển khoản";
      default:
        return method;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi và quản lý tất cả đơn hàng
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={18} />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm theo mã, tên khách, SĐT..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white px-3 py-2">
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
        <div className="flex items-center gap-2">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
            <Calendar size={16} className="mr-2 text-slate-400" />
            <span>Hôm nay</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
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
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {order.finalAmount?.toLocaleString()} ₫
                      </div>
                      {order.discount > 0 && (
                        <div className="text-xs text-green-600">
                          - {order.discount?.toLocaleString()} ₫
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {order.user?.fullName || "---"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors"
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

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-medium text-slate-800 flex items-center gap-3">
                  Chi tiết đơn hàng
                  <span className="text-base font-normal text-slate-500 font-mono bg-white px-2 py-0.5 rounded border">
                    {selectedOrder.code}
                  </span>
                </h2>
                <div className="text-sm text-slate-500 mt-1 flex gap-2">
                  <span>
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </span>
                  <span>•</span>
                  <span>{selectedOrder.user?.fullName || "Bán hàng"}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-3">
                    Thông tin khách hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Họ tên:</span>
                      <span className="font-medium text-slate-900">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-900">
                        {selectedOrder.customerPhone || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-medium text-slate-800 mb-3">
                    Thông tin thanh toán
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phương thức:</span>
                      <span className="font-medium text-slate-900">
                        {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}
                      >
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-3">
                  Danh sách sản phẩm
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-slate-500">
                          SL
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.details.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-800">
                            {item.product?.name}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.price?.toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {item.totalLine?.toLocaleString()} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-200 transition-all">
                <Printer size={18} />
                In hóa đơn
              </button>
              <div className="text-right">
                <div className="text-sm text-slate-500">Tổng thanh toán</div>
                <div className="text-2xl font-medium text-blue-600">
                  {selectedOrder.finalAmount?.toLocaleString()} ₫
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage;

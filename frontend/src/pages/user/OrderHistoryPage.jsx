import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCalendar, FiEye, FiLoader, FiShoppingBag } from "react-icons/fi";
import { FaHome } from "react-icons/fa";
import AppPagination from "../../components/common/AppPagination";
import {
  Button,
  EmptyState,
  ModalShell,
  PageContainer,
  PageHeader,
  PageShell,
  StatusBadge,
  SurfaceCard,
} from "../../components/ui";
import orderService from "../../services/orderService";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING", label: "Pending" },
];


const STATUS_META = {
  PENDING: { label: "Pending", tone: "amber" },
  SHIPPING: { label: "Shipping", tone: "blue" },
  COMPLETED: { label: "Completed", tone: "emerald" },
  CANCELLED: { label: "Cancelled", tone: "rose" },
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));

const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US");
  return `${month}/${day}/${year}, ${time}`;
};

const getDateRangeFromPreset = (preset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case "TODAY":
      return { start, end };
    case "YESTERDAY": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      y.setHours(0, 0, 0, 0);
      const yEnd = new Date(y);
      yEnd.setHours(23, 59, 59, 999);
      return { start: y, end: yEnd };
    }
    case "LAST_7_DAYS":
      start.setDate(start.getDate() - 6);
      return { start, end };
    case "LAST_30_DAYS":
      start.setDate(start.getDate() - 29);
      return { start, end };
    case "THIS_MONTH":
      start.setDate(1);
      return { start, end };
    default:
      return null;
  }
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchMyOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load order history.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, orders, dateFrom, dateTo]);

  const filteredOrders = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      if (!matchesStatus) return false;

      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt) return true;

      const matchesManualRange =
        (!fromDate || createdAt >= fromDate) && (!toDate || createdAt <= toDate);

      return matchesManualRange;
    });
  }, [dateFrom, dateTo, orders, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allOrdersCount = orders.length;

  const getStatusMeta = (status) =>
    STATUS_META[status] || { label: status || "Unknown", tone: "slate" };

  const handlePageChange = (page) => {
    setCurrentPage(page + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      toast.success("Order cancelled successfully.");
    } catch (error) {
      toast.error(error?.response?.data || "Could not cancel this order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <PageShell className="py-8">
      <PageContainer className="max-w-6xl">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link to="/" className="flex items-center gap-1.5 text-black hover:text-slate-900">
            <FaHome className="text-emerald-700" size={16} />
            Home
          </Link>
          <span className="font-semibold text-black">&gt;</span>
          <span className="text-emerald-700">Orders</span>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/75 bg-white/88 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "border border-slate-200 bg-slate-100 text-slate-900"
                  : "bg-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              All {allOrdersCount}
            </button>
            {STATUS_OPTIONS.filter((item) => item.value !== "ALL").map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === item.value
                    ? "border border-slate-200 bg-slate-100 text-slate-900"
                    : "bg-transparent text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.label} {orders.filter((order) => order.status === item.value).length}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <FiCalendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
          </div>
        </div>

        <SurfaceCard className="overflow-hidden p-0">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center gap-2 text-slate-500">
              <FiLoader className="animate-spin" size={18} />
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={FiShoppingBag}
              title="No matching orders"
              description="There are no orders in the selected status group."
              className="border-0 shadow-none"
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-[#647368] text-white">
                    <tr>
                      <th className="px-4 py-3 text-center text-base font-medium text-white">No</th>
                      <th className="px-4 py-3 text-base font-medium text-white">Order code</th>
                      <th className="px-4 py-3 text-base font-medium text-white">Created at</th>
                      <th className="px-4 py-3 text-base font-medium text-white">Items</th>
                      <th className="px-4 py-3 text-base font-medium text-white">Status</th>
                      <th className="px-4 py-3 text-right text-base font-medium text-white">Total</th>
                      <th className="px-4 py-3 text-center text-base font-medium text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrders.map((order, index) => {
                      const statusMeta = getStatusMeta(order.status);
                      return (
                        <tr key={order.id} className="transition-colors hover:bg-emerald-50/30">
                          <td className="px-4 py-4 text-center font-medium text-slate-700">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-700">
                              {order.code}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="font-medium text-slate-700">{formatDate(order.createdAt)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-700">{order.details?.length || 0} items</span>
                            {order.voucherCode ? (
                              <span className="mt-1 block text-xs text-slate-600">
                                Voucher: {order.voucherCode}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums text-emerald-700">
                            {formatCurrency(order.finalAmount)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2 font-medium text-slate-900">
                              <Button type="button" variant="muted" onClick={() => setSelectedOrder(order)}>
                                <FiEye size={16} />
                                Details
                              </Button>
                              {order.status === "PENDING" ? (
                                <Button
                                  type="button"
                                  variant="danger"
                                  disabled={cancellingOrderId === order.id}
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  {cancellingOrderId === order.id ? "Cancelling..." : "Cancel"}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {paginatedOrders.map((order) => {
                  const statusMeta = getStatusMeta(order.status);
                  return (
                    <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{order.code}</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(order.createdAt)}</p>
                        </div>
                        <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div className="text-sm text-slate-500">
                          {order.details?.length || 0} items
                        </div>
                        <div className="text-right font-medium text-emerald-700">
                          {formatCurrency(order.finalAmount)}
                        </div>
                      </div>
                      <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => setSelectedOrder(order)}>
                        View details
                      </Button>
                    </div>
                  );
                })}
              </div>

              {filteredOrders.length > pageSize ? (
                <AppPagination
                  currentPage={currentPage - 1}
                  pageCount={totalPages}
                  onPageChange={handlePageChange}
                  pageRangeDisplayed={4}
                  marginPagesDisplayed={1}
                />
              ) : null}
            </>
          )}
        </SurfaceCard>

        {selectedOrder ? (
          <OrderDetailModal
            order={selectedOrder}
            getStatusMeta={getStatusMeta}
            cancellingOrderId={cancellingOrderId}
            onCancelOrder={handleCancelOrder}
            onClose={() => setSelectedOrder(null)}
          />
        ) : null}
      </PageContainer>
    </PageShell>
  );
};

const OrderDetailModal = ({ order, getStatusMeta, cancellingOrderId, onCancelOrder, onClose }) => {
  const statusMeta = getStatusMeta(order.status);

  return (
    <ModalShell
      title={`Order ${order.code}`}
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <>
          {order.status === "PENDING" ? (
            <Button
              type="button"
              variant="danger"
              disabled={cancellingOrderId === order.id}
              onClick={() => onCancelOrder(order.id)}
            >
              {cancellingOrderId === order.id ? "Cancelling..." : "Cancel order"}
            </Button>
          ) : null}
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">Payment total</p>
            <p className="text-xl font-medium tabular-nums text-slate-900">
              {formatCurrency(order.finalAmount)}
            </p>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <InfoCard label="Status" value={<StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>} />
          <InfoCard label="Voucher" value={order.voucherCode || "None"} />
          <InfoCard label="Created at" value={formatDate(order.createdAt)} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-center">Quantity</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.details || []).map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-3 text-slate-800">
                    {item.product?.name || item.productName || "Product"}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {String(item.quantity).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">
                    {formatCurrency(item.totalLine)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
    <p className="text-slate-500">{label}</p>
    <div className="mt-1 font-medium text-slate-900">{value}</div>
  </div>
);

export default OrderHistoryPage;

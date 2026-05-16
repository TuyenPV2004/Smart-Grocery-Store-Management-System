import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiEye,
  FiFileText,
  FiFilter,
  FiX,
} from "react-icons/fi";
import orderService from "../../services/orderService";
import {
  AdminHeader,
  AdminIconButton,
  AdminPage,
  AdminSearchInput,
  AdminSelect,
  AdminTableCard,
  Button,
  SurfaceCard,
} from "../../components/admin/AdminUi";
import { StatusBadge } from "../../components/ui";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const currency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatOrderDate = (dateValue) => {
  if (!dateValue) return "---";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
};

const getStatusTone = (status) => {
  switch (status) {
    case "COMPLETED":
      return "emerald";
    case "PENDING":
      return "amber";
    case "SHIPPING":
      return "blue";
    case "CANCELLED":
      return "rose";
    default:
      return "slate";
  }
};

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case "CHUYEN_KHOAN":
      return "Bank transfer";
    case "COD":
      return "Cash on delivery";
    default:
      return method || "---";
  }
};

const getOrderDetailPricing = (order) => {
  const details = order?.details || [];
  const orderDiscount = Number(order?.discount || 0);
  const orderTotal = Number(order?.totalAmount || 0);

  if (details.length === 0) return [];

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
    Math.round(orderDiscount) - baseDiscounts.reduce((sum, value) => sum + value, 0);
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

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getAll();
      setOrders(res.data || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const keyword = searchTerm.toLowerCase();
    const matchesKeyword =
      order.code?.toLowerCase().includes(keyword) ||
      order.customerName?.toLowerCase().includes(keyword) ||
      order.customerPhone?.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesKeyword && matchesStatus;
  });

  const detailPricing = getOrderDetailPricing(selectedOrder);
  const showDetailDiscountColumn =
    Number(selectedOrder?.discount || 0) > 0 &&
    detailPricing.some((item) => item.detailDiscount > 0);

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
      toast.error("Unable to export this order.");
    }
  };

  return (
    <AdminPage>
      <AdminHeader
        title="Order Management"
        description="Track customer orders, payment details, fulfillment status, and exports."
        actions={
          <Button variant="secondary" className="hidden">
            <FiFileText size={18} />
            Export
          </Button>
        }
      />

      <SurfaceCard className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <AdminSearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by order code, customer, or phone"
            className="md:max-w-xl"
          />
          <div className="flex items-center gap-2">
            <FiFilter size={16} className="text-emerald-700" />
            <AdminSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>
        <div className="hidden items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
          <FiCalendar size={16} className="mr-2 text-slate-400" />
          Today
        </div>
      </SurfaceCard>

      <AdminTableCard>
        <table>
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Order</th>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Total</th>
              <th className="px-6 py-4 text-left">Staff</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-sm font-medium text-slate-500">
                  Loading orders
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-sm font-medium text-slate-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-950">
                    {order.code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      {order.customerName || "---"}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {order.customerPhone || "---"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium tabular-nums text-slate-900">
                      {currency(order.finalAmount)}
                    </div>
                    {Number(order.discount || 0) > 0 ? (
                      <div className="text-xs font-medium tabular-nums text-emerald-700">
                        - {currency(order.discount)}
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {order.user?.fullName || order.username || (order.userId ? `#${order.userId}` : "---")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge tone={getStatusTone(order.status)}>
                      {order.status || "---"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <AdminIconButton
                      onClick={() => handleExportExcel(order)}
                      tone="emerald"
                      title="Export"
                      aria-label="Export order"
                    >
                      <FiFileText size={18} />
                    </AdminIconButton>
                    <AdminIconButton
                      onClick={() => setSelectedOrder(order)}
                      tone="blue"
                      title="View details"
                      aria-label="View order details"
                    >
                      <FiEye size={18} />
                    </AdminIconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {selectedOrder
        ? createPortal(
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
              <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              />
              <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                  <div>
                    <h2 className="text-xl font-medium text-slate-900">Order Details</h2>
                    <p className="text-sm font-medium text-slate-500">{selectedOrder.code}</p>
                  </div>
                  <AdminIconButton
                    onClick={() => setSelectedOrder(null)}
                    aria-label="Close modal"
                  >
                    <FiX size={20} />
                  </AdminIconButton>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                      <h3 className="mb-3 text-sm font-medium text-sky-800">
                        Customer Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <InfoRow label="Name" value={selectedOrder.customerName} />
                        <InfoRow label="Phone" value={selectedOrder.customerPhone} />
                        <InfoRow label="Order code" value={selectedOrder.code} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <h3 className="mb-3 text-sm font-medium text-slate-800">
                        Payment Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <InfoRow
                          label="Method"
                          value={getPaymentMethodLabel(selectedOrder.paymentMethod)}
                        />
                        <InfoRow label="Date" value={formatOrderDate(selectedOrder.createdAt)} />
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Status</span>
                          <StatusBadge tone={getStatusTone(selectedOrder.status)}>
                            {selectedOrder.status}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-slate-800">Products</h3>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-800">
                              Product
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-slate-800">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-slate-800">
                              Unit price
                            </th>
                            {showDetailDiscountColumn ? (
                              <th className="px-4 py-3 text-right font-medium text-slate-800">
                                Discount
                              </th>
                            ) : null}
                            <th className="px-4 py-3 text-right font-medium text-slate-800">
                              Line total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedOrder.details || []).map((item, index) => {
                            const { detailDiscount, finalLineTotal } = detailPricing[index] || {
                              detailDiscount: 0,
                              finalLineTotal: Number(item?.totalLine || 0),
                            };

                            return (
                              <tr key={`${item.productId || item.product?.id || "product"}-${index}`}>
                                <td className="px-4 py-3 text-slate-800">
                                  <div className="line-clamp-2">
                                    {item.product?.name || item.productName || "---"}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-800">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                                  {currency(item.price)}
                                </td>
                                {showDetailDiscountColumn ? (
                                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                                    {detailDiscount > 0 ? currency(detailDiscount) : "---"}
                                  </td>
                                ) : null}
                                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                                  {currency(finalLineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 bg-emerald-50/70 px-6 py-5">
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-sm font-medium text-emerald-800">Final total</div>
                    <div className="text-2xl font-medium leading-none tabular-nums text-emerald-800">
                      {currency(selectedOrder.finalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </AdminPage>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-900">{value || "---"}</span>
  </div>
);

export default OrderManagementPage;

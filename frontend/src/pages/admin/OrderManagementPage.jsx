import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiEye,
  FiFileText,
  FiMoreHorizontal,
  FiSearch,
  FiX,
} from "react-icons/fi";
import orderService from "../../services/orderService";
import {
  AdminIconButton,
  AdminPage,
} from "../../components/admin/AdminUi";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { StatusBadge } from "../../components/ui";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const dateFilterOptions = [
  { value: "ALL", label: "All time" },
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "THIS_MONTH", label: "This month" },
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

const getDateRangeFromPreset = (preset) => {
  if (preset === "ALL") return null;

  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case "TODAY":
      return { start, end };
    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { start: yesterday, end: yesterdayEnd };
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
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

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

  useEffect(() => {
    if (!actionMenu) return undefined;

    const closeMenu = () => setActionMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  const filteredOrders = orders.filter((order) => {
    const keyword = searchTerm.toLowerCase();
    const matchesKeyword =
      !keyword ||
      order.code?.toLowerCase().includes(keyword) ||
      order.customerName?.toLowerCase().includes(keyword) ||
      order.customerPhone?.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const dateRange = getDateRangeFromPreset(dateFilter);
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const matchesDate =
      !dateRange ||
      (createdAt &&
        !Number.isNaN(createdAt.getTime()) &&
        createdAt >= dateRange.start &&
        createdAt <= dateRange.end);

    return matchesKeyword && matchesStatus && matchesDate;
  });

  const getOrderStatusCount = (status) => {
    if (status === "ALL") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

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

  const openActionMenu = (event, order) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 88;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.order?.id === order.id
        ? null
        : {
            order,
            x: rect.left + rect.width / 2,
            y: shouldOpenUpward ? rect.top - gap : rect.bottom + gap,
            placement: shouldOpenUpward ? "top" : "bottom",
          },
    );
  };

  const runAction = (callback) => {
    setActionMenu(null);
    callback();
  };

  return (
    <AdminPage>
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">
            Order Catalog
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search orders by code, customer name, or phone
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                Order Management
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option.label} {getOrderStatusCount(option.value)}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search..."
                  className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-slate-50"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
                    aria-label="Clear search"
                  >
                    <FiX size={15} />
                  </button>
                ) : null}
              </div>
              <div className="relative w-full sm:w-[180px]">
                <FiCalendar
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="w-full appearance-none rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-300 focus:bg-slate-50"
                >
                  {dateFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Order</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Customer</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Total</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Staff</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Payment</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Status</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Date</th>
                <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr className="product-empty-row bg-white">
                  <td colSpan="8" className="px-6 py-14">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FiFileText className="mb-4 text-slate-950" size={30} />
                      <h4 className="text-base font-medium text-slate-900">
                        Loading orders
                      </h4>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr className="product-empty-row bg-white">
                  <td colSpan="8" className="px-6 py-14">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FiFileText className="mb-4 text-slate-950" size={30} />
                      <h4 className="text-base font-medium text-slate-900">
                        No matching orders
                      </h4>
                      <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                        Try changing the status filter or search keyword.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="product-inventory-row transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-950">
                        {order.code}
                      </div>
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                      {order.user?.fullName || order.username || (order.userId ? `#${order.userId}` : "---")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-600">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge tone={getStatusTone(order.status)}>
                        {order.status || "---"}
                      </StatusBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(event) => openActionMenu(event, order)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          title="Actions"
                        >
                          <FiMoreHorizontal size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionMenu ? (
        <div
          className={`fixed z-[80] !w-44 -translate-x-[calc(100%-1.25rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(100,116,139,0.22)] ring-1 ring-slate-300/45 ${
            actionMenu.placement === "top" ? "-translate-y-full" : ""
          }`}
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => runAction(() => setSelectedOrder(actionMenu.order))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="View details"
          >
            <FiEye className="text-blue-500" size={18} />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleExportExcel(actionMenu.order))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Export"
          >
            <FiFileText className="text-emerald-600" size={18} />
            <span>Export</span>
          </button>
        </div>
      ) : null}

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
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-slate-900">Order Details</h2>
                    <span className="text-xl font-medium text-slate-600">
                      {selectedOrder.code}
                    </span>
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
                        <thead className="bg-[#647368] text-white">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-white">
                              Product
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-white">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-white">
                              Unit price
                            </th>
                            {showDetailDiscountColumn ? (
                              <th className="px-4 py-3 text-right font-medium text-white">
                                Discount
                              </th>
                            ) : null}
                            <th className="px-4 py-3 text-right font-medium text-white">
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

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package,
  XCircle,
  CircleDollarSign,
  Target,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import { toast } from "react-toastify";
import dashboardService from "../../services/dashboardService";

const TIME_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

const COLORS = {
  revenue: "#10b981",
  orders: "#2563eb",
  pie: { PENDING: "#f59e0b", COMPLETED: "#10b981", CANCELLED: "#ef4444" },
  category: ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"],
};

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const compactCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value || "N/A"
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const metricTone = {
  emerald: {
    accent: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  blue: { accent: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  indigo: {
    accent: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
  },
  amber: { accent: "bg-amber-50 text-amber-600", border: "border-amber-100" },
  rose: { accent: "bg-rose-50 text-rose-600", border: "border-rose-100" },
  orange: {
    accent: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
  },
  sky: { accent: "bg-sky-50 text-sky-600", border: "border-sky-100" },
  violet: {
    accent: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
  },
};

const MetricCard = ({ title, value, note, icon: Icon, tone }) => (
  <div
    className={`bg-white p-5 rounded-[2rem] border ${metricTone[tone].border} shadow-sm`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {note ? <p className="text-xs text-slate-400 mt-1">{note}</p> : null}
        <p className="mt-4 text-2xl font-medium text-slate-900">{value}</p>
      </div>
      <div className={`rounded-2xl p-3 ${metricTone[tone].accent}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const Panel = ({ title, subtitle, children, className = "", headerRight }) => (
  <div
    className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ${className}`}
  >
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
    </div>
    {children}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
    {message}
  </div>
);

const normalizeTopProducts = (items = []) =>
  [...items]
    .filter((item) => Number(item?.soldQuantity || 0) > 0)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      displayName:
        item?.productName?.replace(/\s+/g, " ").trim().slice(0, 24) || "N/A",
    }));

const categoryChart = (items = []) => {
  const sorted = [...items]
    .filter((item) => Number(item?.revenue || 0) > 0)
    .sort((a, b) => Number(b?.revenue || 0) - Number(a?.revenue || 0));
  const head = sorted.slice(0, 5);
  const other = sorted
    .slice(5)
    .reduce((sum, item) => sum + Number(item?.revenue || 0), 0);
  return other > 0 ? [...head, { categoryName: "Khác", revenue: other }] : head;
};

const compressZeroValueRuns = (items = []) => {
  const compressed = [];

  for (let index = 0; index < items.length; index += 1) {
    const currentItem = items[index];

    if (Number(currentItem?.value || 0) !== 0) {
      compressed.push(currentItem);
      continue;
    }

    let runEnd = index;
    while (
      runEnd + 1 < items.length &&
      Number(items[runEnd + 1]?.value || 0) === 0
    ) {
      runEnd += 1;
    }

    compressed.push(currentItem);

    if (runEnd > index) {
      compressed.push(items[runEnd]);
    }

    index = runEnd;
  }

  return compressed;
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);

  const loadDashboard = async (days = selectedDays, options = {}) => {
    const isManualRefresh = options?.manual === true;

    setLoading(true);
    setError("");
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    try {
      const response = await dashboardService.getStats(days);
      setData(response.data);
      if (isManualRefresh) {
        toast.success("Làm mới thành công");
      }
    } catch (err) {
      console.error("Lỗi tải dashboard:", err);
      setError("Không tải được dashboard. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard(selectedDays);
  }, [selectedDays]);

  const handleRefresh = async () => {
    setIsRefreshAnimating(true);
    window.setTimeout(() => {
      setIsRefreshAnimating(false);
    }, 700);

    await loadDashboard(selectedDays, { manual: true });
  };

  const selectedLabel =
    TIME_OPTIONS.find((option) => option.value === selectedDays)?.label ||
    `${selectedDays} ngày`;

  const revenueData = (data?.revenueChart || []).map((item) => ({
    ...item,
    value: Number(item?.value || 0),
    orderCount: Number(item?.orderCount || 0),
    cancelledOrderCount: Number(item?.cancelledOrderCount || 0),
    shortDate: shortDate(item?.date),
  }));
  const revenueChartData = compressZeroValueRuns(revenueData);
  const orderTrendChartData = revenueData.filter(
    (item) => item.orderCount > 0 || item.cancelledOrderCount > 0,
  );

  const topProducts = normalizeTopProducts(data?.topProducts || []);
  const categories = categoryChart(data?.categorySales || []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="admin-page-shell p-6 font-poppins antialiased text-slate-600 min-h-full">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-medium text-slate-900">
              Tổng quan hệ thống
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Dashboard quản lý bán hàng, tồn kho và giám sát vận hành.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                style={isRefreshAnimating ? { animation: "spin 0.7s linear 1" } : undefined}
              />
              Làm mới
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title={`Doanh thu ${selectedLabel.toLowerCase()}`}
            value={currency(data?.totalRevenue)}
            note="Theo bộ lọc thời gian"
            icon={TrendingUp}
            tone="emerald"
          />
          <MetricCard
            title={`Đơn hoàn tất ${selectedLabel.toLowerCase()}`}
            value={data?.totalOrders || 0}
            note="Chỉ tính đơn completed"
            icon={ShoppingCart}
            tone="blue"
          />
          <MetricCard
            title="Tổng sản phẩm"
            value={data?.totalProducts || 0}
            note="Số SKU đang quản lý"
            icon={Package}
            tone="indigo"
          />
          <MetricCard
            title="Sản phẩm tồn thấp"
            value={data?.lowStockProducts || 0}
            note="Cần ưu tiên nhập thêm"
            icon={AlertTriangle}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Giá trị đơn trung bình"
            value={currency(data?.averageOrderValue)}
            note="Theo đơn hoàn tất"
            icon={Target}
            tone="emerald"
          />
          <MetricCard
            title="Tỷ lệ hủy đơn"
            value={percent(data?.cancellationRate)}
            note="Trên tổng đơn trong kỳ"
            icon={XCircle}
            tone="rose"
          />
          <MetricCard
            title="Giá trị tồn kho"
            value={currency(data?.stockValue)}
            note="Theo tồn hiện tại"
            icon={CircleDollarSign}
            tone="violet"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <Panel
            className="xl:col-span-2"
            title="Biểu đồ doanh thu"
            subtitle={`Xu hướng doanh thu hoàn tất theo ${selectedLabel.toLowerCase()}.`}
          >
            {revenueChartData.length ? (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient
                        id="dashboardRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.revenue}
                          stopOpacity={0.22}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.revenue}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="shortDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={compactCurrency}
                    />
                    <Tooltip
                      formatter={(value) => [currency(value), "Doanh thu"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.date || label
                      }
                    />
                    <Legend
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Doanh thu"
                      stroke={COLORS.revenue}
                      strokeWidth={3}
                      fill="url(#dashboardRevenue)"
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Doanh thu = 0" />
            )}
          </Panel>
          <Panel
            title="Biểu đồ đơn hàng hoàn thành và đã hủy"
            subtitle={`Xu hướng đơn hoàn thành và đã hủy theo ${selectedLabel.toLowerCase()}.`}
          >
            {orderTrendChartData.length ? (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={orderTrendChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="shortDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.date || label
                      }
                    />
                    <Legend
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orderCount"
                      name="Đơn hoàn thành"
                      stroke={COLORS.orders}
                      strokeWidth={3}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cancelledOrderCount"
                      name="Đơn đã hủy"
                      stroke={COLORS.pie.CANCELLED}
                      strokeWidth={3}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Đơn hoàn thành và đã hủy = 0" />
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <Panel title="Top sản phẩm bán chạy">
            {topProducts.length ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    margin={{ top: 8, right: 20, left: 8, bottom: 40 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="displayName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: "#334155", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Số lượng bán"]}
                      labelFormatter={(label, payload) =>
                        `${payload?.[0]?.payload?.productName || label} - Doanh thu: ${currency(payload?.[0]?.payload?.revenue)}`
                      }
                    />
                    <Bar dataKey="soldQuantity" radius={[10, 10, 0, 0]}>
                      {topProducts.map((item, index) => (
                        <Cell
                          key={`${item.productName}-${index}`}
                          fill={COLORS.category[index % COLORS.category.length]}
                        />
                      ))}
                      <LabelList
                        dataKey="soldQuantity"
                        position="top"
                        fill="#0f172a"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Chưa có dữ liệu sản phẩm bán chạy" />
            )}
          </Panel>
          <Panel title="Doanh thu theo danh mục">
            {categories.length ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="revenue"
                      nameKey="categoryName"
                      innerRadius={52}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ percent: pct }) =>
                        pct >= 0.05 ? `${(pct * 100).toFixed(0)}%` : ""
                      }
                    >
                      {categories.map((entry, index) => (
                        <Cell
                          key={entry.categoryName}
                          fill={COLORS.category[index % COLORS.category.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => currency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Chưa có dữ liệu doanh thu theo danh mục" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

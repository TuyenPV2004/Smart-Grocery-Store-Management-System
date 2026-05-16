import { useEffect, useState } from "react";
import {
  FiArrowDown as ArrowDown,
  FiArrowUp as ArrowUp,
  FiArrowUpRight as ArrowUpRight,
  FiTrendingUp as TrendingUp,
  FiShoppingCart as ShoppingCart,
  FiXCircle as XCircle,
  FiTarget as Target,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import dashboardService from "../../services/dashboardService";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { getImageUrl } from "../../utils/imageUrl";
import productService from "../../services/productService";

const TIME_OPTIONS = [
  { value: 7, label: "Weekly" },
  { value: 30, label: "Monthly" },
  { value: 365, label: "Year" },
];

const COLORS = {
  revenue: "#10b981",
  orders: "#2563eb",
  pie: { PENDING: "#f59e0b", COMPLETED: "#10b981", CANCELLED: "#ef4444" },
  category: ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"],
};

const CATEGORY_GREEN_SCALE = ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"];

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

const percentageChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

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

const MetricCard = ({ title, value, icon, tone, changePercent, sparklineData }) => {
  const Icon = icon;
  const isPositive = Number(changePercent || 0) >= 0;
  const TrendIcon = isPositive ? ArrowUp : ArrowDown;
  const trendClass = isPositive ? "text-emerald-600" : "text-rose-600";

  return (
    <div
      className={`min-h-[172px] bg-white p-6 rounded-[2rem] border ${metricTone[tone].border} shadow-sm`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${metricTone[tone].accent}`}
          >
            <Icon size={21} />
          </div>
          <p className="truncate text-sm font-medium text-slate-500">{title}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
          <ArrowUpRight size={18} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-medium text-slate-900">{value}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className={`inline-flex items-center gap-1 ${trendClass}`}>
              <TrendIcon size={13} />
              {Math.abs(Number(changePercent || 0)).toFixed(1)}%
            </span>
            <span className="text-slate-900">This week</span>
          </p>
        </div>

        <div className="h-16 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotoneX"
                dataKey="value"
                stroke={COLORS.revenue}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, children, className = "", headerRight }) => (
  <div
    className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ${className}`}
  >
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
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

const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='22' fill='%23f1f5f9'/%3E%3Cpath d='M28 35h40l-4 34H32l-4-34Z' fill='%23d1fae5' stroke='%2310b981' stroke-width='3'/%3E%3Cpath d='M38 35c0-7 4-12 10-12s10 5 10 12' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

const TimeRangeSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="px-4 py-2 rounded-full border border-slate-300 text-sm font-medium text-slate-700 bg-slate-100 outline-none hover:bg-slate-200 focus:border-slate-400 focus:ring-0"
  >
    {TIME_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const CategoryCallout = ({ item, align = "left" }) => (
  <div
    className={`flex items-center gap-2 ${align === "left" ? "justify-end" : ""}`}
  >
    {align === "left" ? (
      <div className="w-32 min-w-0">
        <div className="grid min-w-0 grid-cols-[12px_minmax(0,1fr)] items-start gap-2">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-100"
            style={{ backgroundColor: item.fill }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {item.categoryName}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-950">
              {item.percentValue.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    ) : null}
    <span
      className={`relative h-px w-10 bg-slate-300 ${
        align === "left"
          ? "after:absolute after:left-[-1px] after:top-1/2 after:h-0 after:w-0 after:-translate-y-1/2 after:border-y-[5px] after:border-r-[8px] after:border-y-transparent after:border-r-slate-300"
          : "after:absolute after:right-[-1px] after:top-1/2 after:h-0 after:w-0 after:-translate-y-1/2 after:border-y-[5px] after:border-l-[8px] after:border-y-transparent after:border-l-slate-300"
      }`}
    />
    {align === "right" ? (
      <div className="w-32 min-w-0">
        <div className="grid min-w-0 grid-cols-[12px_minmax(0,1fr)] items-start gap-2">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-100"
            style={{ backgroundColor: item.fill }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {item.categoryName}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-950">
              {item.percentValue.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    ) : null}
  </div>
);

const normalizeProductName = (value) =>
  String(value || "").replace(/\s+/g, " ").trim().toLowerCase();

const normalizeTopProducts = (items = [], productsByName = {}) =>
  [...items]
    .filter((item) => Number(item?.soldQuantity || 0) > 0)
    .slice(0, 5)
    .map((item) => {
      const catalogProduct = productsByName[normalizeProductName(item?.productName)];
      const thumbnail = catalogProduct?.thumbnail || item?.thumbnail;
      const price = Number(item?.price || 0) || Number(catalogProduct?.sellPrice || 0);

      return {
        ...item,
        displayName:
          item?.productName?.replace(/\s+/g, " ").trim() || "N/A",
        imageUrl: getImageUrl(thumbnail, PRODUCT_PLACEHOLDER),
        unitPrice:
          price ||
          Number(item?.revenue || 0) / Math.max(Number(item?.soldQuantity || 0), 1),
      };
    });

const categoryChart = (items = []) => {
  return [...items]
    .filter((item) => Number(item?.revenue || 0) > 0)
    .sort((a, b) => Number(b?.revenue || 0) - Number(a?.revenue || 0));
};

const getCategoryColor = (percentValue) => {
  if (percentValue >= 35) return CATEGORY_GREEN_SCALE[5];
  if (percentValue >= 25) return CATEGORY_GREEN_SCALE[4];
  if (percentValue >= 15) return CATEGORY_GREEN_SCALE[3];
  if (percentValue >= 8) return CATEGORY_GREEN_SCALE[2];
  if (percentValue >= 3) return CATEGORY_GREEN_SCALE[1];
  return CATEGORY_GREEN_SCALE[0];
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

const toRevenueData = (items = []) =>
  items.map((item) => ({
    ...item,
    value: Number(item?.value || 0),
    orderCount: Number(item?.orderCount || 0),
    cancelledOrderCount: Number(item?.cancelledOrderCount || 0),
    shortDate: shortDate(item?.date),
  }));

const sumBy = (items = [], selector) =>
  items.reduce((sum, item) => sum + Number(selector(item) || 0), 0);

const buildWeeklyMetrics = (items = []) => {
  const currentWeek = items.slice(-7);
  const previousWeek = items.slice(-14, -7);
  const currentRevenue = sumBy(currentWeek, (item) => item.value);
  const previousRevenue = sumBy(previousWeek, (item) => item.value);
  const currentOrders = sumBy(currentWeek, (item) => item.orderCount);
  const previousOrders = sumBy(previousWeek, (item) => item.orderCount);
  const currentCancelled = sumBy(currentWeek, (item) => item.cancelledOrderCount);
  const previousCancelled = sumBy(previousWeek, (item) => item.cancelledOrderCount);
  const currentAverageOrderValue =
    currentOrders > 0 ? currentRevenue / currentOrders : 0;
  const previousAverageOrderValue =
    previousOrders > 0 ? previousRevenue / previousOrders : 0;
  const currentOrdersInRange = currentOrders + currentCancelled;
  const previousOrdersInRange = previousOrders + previousCancelled;
  const currentCancellationRate =
    currentOrdersInRange > 0 ? (currentCancelled / currentOrdersInRange) * 100 : 0;
  const previousCancellationRate =
    previousOrdersInRange > 0 ? (previousCancelled / previousOrdersInRange) * 100 : 0;

  return {
    totalRevenue: {
      value: currentRevenue,
      change: percentageChange(currentRevenue, previousRevenue),
      sparkline: currentWeek.map((item) => ({ value: item.value })),
    },
    totalOrders: {
      value: currentOrders,
      change: percentageChange(currentOrders, previousOrders),
      sparkline: currentWeek.map((item) => ({ value: item.orderCount })),
    },
    averageOrderValue: {
      value: currentAverageOrderValue,
      change: percentageChange(currentAverageOrderValue, previousAverageOrderValue),
      sparkline: currentWeek.map((item) => ({
        value: item.orderCount > 0 ? item.value / item.orderCount : 0,
      })),
    },
    cancellationRate: {
      value: currentCancellationRate,
      change: percentageChange(currentCancellationRate, previousCancellationRate),
      sparkline: currentWeek.map((item) => {
        const totalOrders = item.orderCount + item.cancelledOrderCount;
        return {
          value:
            totalOrders > 0
              ? (item.cancelledOrderCount / totalOrders) * 100
              : 0,
        };
      }),
    },
  };
};

const DashboardPage = () => {
  const [revenueStats, setRevenueStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [topProductItems, setTopProductItems] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [productsByName, setProductsByName] = useState({});
  const [cardData, setCardData] = useState(null);
  const [revenueDays, setRevenueDays] = useState(7);
  const [orderDays, setOrderDays] = useState(7);
  const [topProductDays, setTopProductDays] = useState(7);
  const [categoryDays, setCategoryDays] = useState(30);
  const [error, setError] = useState("");

  const loadRevenueStats = async (days = revenueDays) => {
    setError("");
    try {
      const response = await dashboardService.getStats(days);
      setRevenueStats(response.data);
    } catch (err) {
      console.error("Failed to load revenue trend:", err);
      setError("Unable to load dashboard. Please try again.");
    }
  };

  const loadOrderStats = async (days = orderDays) => {
    setError("");
    try {
      const response = await dashboardService.getStats(days);
      setOrderStats(response.data);
    } catch (err) {
      console.error("Failed to load order trend:", err);
      setError("Unable to load dashboard. Please try again.");
    }
  };

  const loadTopProducts = async (days = topProductDays) => {
    setError("");
    try {
      const response = await dashboardService.getTopProducts(days, 5);
      setTopProductItems(response.data || []);
    } catch (err) {
      console.error("Failed to load top products:", err);
      setError("Unable to load dashboard. Please try again.");
    }
  };

  const loadCategorySales = async (days = categoryDays) => {
    setError("");
    try {
      const response = await dashboardService.getCategorySales(days);
      setCategoryItems(response.data || []);
    } catch (err) {
      console.error("Failed to load category sales:", err);
      setError("Unable to load dashboard. Please try again.");
    }
  };

  const loadCardData = async () => {
    const response = await dashboardService.getStats(14);
    setCardData(response.data);
  };

  const loadProductCatalog = async () => {
    const response = await productService.getAll({ size: 500 });
    const products = Array.isArray(response.data?.content)
      ? response.data.content
      : Array.isArray(response.data)
        ? response.data
        : [];

    setProductsByName(
      products.reduce((acc, product) => {
        acc[normalizeProductName(product?.name)] = product;
        return acc;
      }, {}),
    );
  };

  useEffect(() => {
    loadRevenueStats(revenueDays);
  }, [revenueDays]);

  useEffect(() => {
    loadOrderStats(orderDays);
  }, [orderDays]);

  useEffect(() => {
    loadTopProducts(topProductDays);
  }, [topProductDays]);

  useEffect(() => {
    loadCategorySales(categoryDays);
  }, [categoryDays]);

  useEffect(() => {
    loadCardData().catch((err) => {
      console.error("Failed to load dashboard cards:", err);
    });
    loadProductCatalog().catch((err) => {
      console.error("Failed to load product catalog:", err);
    });
  }, []);

  const revenueTrendData = toRevenueData(revenueStats?.revenueChart || []);
  const orderTrendData = toRevenueData(orderStats?.revenueChart || []);
  const cardMetrics = buildWeeklyMetrics(toRevenueData(cardData?.revenueChart || []));
  const revenueChartData = compressZeroValueRuns(revenueTrendData);
  const orderTrendChartData = orderTrendData.filter(
    (item) => item.orderCount > 0 || item.cancelledOrderCount > 0,
  );

  const topProducts = normalizeTopProducts(topProductItems, productsByName);
  const categories = categoryChart(categoryItems);
  const categoryTotal = categories.reduce(
    (sum, item) => sum + Number(item?.revenue || 0),
    0,
  );
  const categoryData = categories.map((item, index) => ({
    ...item,
    percentValue:
      categoryTotal > 0 ? (Number(item?.revenue || 0) / categoryTotal) * 100 : 0,
    fill: getCategoryColor(
      categoryTotal > 0 ? (Number(item?.revenue || 0) / categoryTotal) * 100 : 0,
    ),
  }));
  const leftCategories = categoryData.filter((_, index) => index % 2 === 0);
  const rightCategories = categoryData.filter((_, index) => index % 2 === 1);

  if (!revenueStats && !orderStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="admin-page-shell p-6 font-poppins antialiased text-slate-600 min-h-full">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-medium text-slate-900">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back! Your grocery store's performance view
            </p>
          </div>

          <AdminTopbar />
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Revenue"
            value={currency(cardMetrics.totalRevenue.value)}
            icon={TrendingUp}
            tone="emerald"
            changePercent={cardMetrics.totalRevenue.change}
            sparklineData={cardMetrics.totalRevenue.sparkline}
          />
          <MetricCard
            title="Completed Orders"
            value={cardMetrics.totalOrders.value}
            icon={ShoppingCart}
            tone="blue"
            changePercent={cardMetrics.totalOrders.change}
            sparklineData={cardMetrics.totalOrders.sparkline}
          />
          <MetricCard
            title="Average Order Value"
            value={currency(cardMetrics.averageOrderValue.value)}
            icon={Target}
            tone="emerald"
            changePercent={cardMetrics.averageOrderValue.change}
            sparklineData={cardMetrics.averageOrderValue.sparkline}
          />
          <MetricCard
            title="Cancellation Rate"
            value={percent(cardMetrics.cancellationRate.value)}
            icon={XCircle}
            tone="rose"
            changePercent={cardMetrics.cancellationRate.change}
            sparklineData={cardMetrics.cancellationRate.sparkline}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-5 mb-8">
          <Panel
            title="Revenue Trend"
            subtitle="Completed revenue trend."
            headerRight={
              <TimeRangeSelect value={revenueDays} onChange={setRevenueDays} />
            }
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
                      formatter={(value) => [currency(value), "Revenue"]}
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
                      type="monotoneX"
                      dataKey="value"
                      name="Revenue"
                      stroke={COLORS.revenue}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="url(#dashboardRevenue)"
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Revenue = 0" />
            )}
          </Panel>
          <Panel
            title="Order Trend"
            subtitle="Completed and cancelled orders."
            headerRight={
              <TimeRangeSelect value={orderDays} onChange={setOrderDays} />
            }
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
                      type="monotoneX"
                      dataKey="cancelledOrderCount"
                      name="Cancelled"
                      stroke={COLORS.pie.CANCELLED}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotoneX"
                      dataKey="orderCount"
                      name="Completed"
                      stroke={COLORS.orders}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Completed and cancelled orders = 0" />
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
          <Panel
            title="Top Selling Products"
            headerRight={
              <TimeRangeSelect
                value={topProductDays}
                onChange={setTopProductDays}
              />
            }
          >
            {topProducts.length ? (
              <div className="space-y-3">
                {topProducts.map((item, index) => (
                  <div
                    key={`${item.productName}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover bg-white"
                        onError={(event) => {
                          event.currentTarget.src = PRODUCT_PLACEHOLDER;
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.displayName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {Number(item.soldQuantity || 0)} sold
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {currency(item.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No top selling product data" />
            )}
          </Panel>
          <Panel
            title="Sales by Category"
            headerRight={
              <TimeRangeSelect value={categoryDays} onChange={setCategoryDays} />
            }
          >
            {categories.length ? (
              <div className="flex min-h-[360px] flex-col justify-between">
                <div className="grid grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] items-center gap-3">
                  <div className="space-y-8">
                    {leftCategories.map((item) => (
                      <CategoryCallout
                        key={item.categoryName}
                        item={item}
                        align="left"
                      />
                    ))}
                  </div>

                  <div className="relative mx-auto h-[220px] w-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="revenue"
                          nameKey="categoryName"
                          innerRadius={68}
                          outerRadius={104}
                          cornerRadius={10}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {categoryData.map((entry) => (
                            <Cell key={entry.categoryName} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => currency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-semibold text-slate-950">
                        {compactCurrency(categoryTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8 pl-4">
                    {rightCategories.map((item) => (
                      <CategoryCallout
                        key={item.categoryName}
                        item={item}
                        align="right"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-5 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    Total Revenue
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {currency(categoryTotal)}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState message="No category revenue data" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

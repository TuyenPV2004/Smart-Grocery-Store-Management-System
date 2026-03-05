import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dashboardService from "../../services/dashboardService";

const TIME_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

const DASHBOARD_COLORS = {
  topProductHighlight: "#16a34a",
  topProductScale: ["#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
  categoryPalette: ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"],
};

const PRODUCT_NAME_MAX_LENGTH = 24;

const truncateText = (text, max = PRODUCT_NAME_MAX_LENGTH) => {
  if (!text) return "N/A";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const normalizeProductName = (name) => {
  if (!name) return "N/A";

  const cleaned = name.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const unitMatch = cleaned.match(/\d+[.,]?\d*\s?(ml|l|kg|g|gr|lon|chai|hộp|hop|gói|goi)/i);
  const baseName = words.slice(0, 3).join(" ");
  const unitText = unitMatch?.[0] || "";
  const shortName = unitText && !baseName.toLowerCase().includes(unitText.toLowerCase())
    ? `${baseName} ${unitText}`
    : baseName;

  return truncateText(shortName);
};

const normalizeTopProducts = (products = []) => {
  return [...products]
    .filter((item) => (item?.soldQuantity || 0) > 0)
    .sort((a, b) => (b?.soldQuantity || 0) - (a?.soldQuantity || 0))
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      fullName: item?.productName || "N/A",
      displayName: normalizeProductName(item?.productName),
    }));
};

const prepareCategorySales = (categories = []) => {
  const validCategories = categories
    .filter((item) => (item?.revenue || 0) > 0)
    .sort((a, b) => (b?.revenue || 0) - (a?.revenue || 0));

  const topFive = validCategories.slice(0, 5);
  const othersRevenue = validCategories
    .slice(5)
    .reduce((sum, item) => sum + (Number(item?.revenue) || 0), 0);

  const chartData = [...topFive];
  if (othersRevenue > 0) {
    chartData.push({
      categoryName: "Others",
      revenue: othersRevenue,
    });
  }

  return chartData;
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    fetchDashboardStats(selectedDays);
  }, [selectedDays]);

  const fetchDashboardStats = async (days) => {
    setLoading(true);
    try {
      const [statsRes, topProductsRes, categorySalesRes] = await Promise.all([
        dashboardService.getStats(days),
        dashboardService.getTopProducts(days, 10),
        dashboardService.getCategorySales(days),
      ]);

      setStats(statsRes.data);
      setTopProducts(topProductsRes.data || []);
      setCategorySales(categorySalesRes.data || []);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
    }).format(amount || 0);
  };

  const topProductChartData = normalizeTopProducts(topProducts);
  const categoryChartData = prepareCategorySales(categorySales);
  const totalCategoryRevenue = categoryChartData.reduce(
    (sum, item) => sum + (Number(item?.revenue) || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      id: 1,
      title: "Tổng doanh thu",
      value: stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : "0 ₫",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
    {
      id: 2,
      title: "Đơn hàng hoàn tất",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      id: 3,
      title: "Tổng sản phẩm",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      id: 4,
      title: "Sắp hết hàng",
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
  ];

  return (
    <div className="p-6 font-poppins antialiased text-slate-600 bg-white min-h-full">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              Tổng quan hệ thống
            </h2>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              Theo dõi các chỉ số kinh doanh quan trọng trong ngày
            </p>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-6 rounded-[2rem] border ${item.borderColor} shadow-sm hover:shadow-md transition-all duration-300 group`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">
                    {item.title}
                  </h3>
                  <p className="text-2xl font-medium text-slate-900 tracking-tight">
                    {item.value}
                  </p>
                </div>
                <div
                  className={`p-3 ${item.bgColor} ${item.color} rounded-2xl transition-transform group-hover:scale-110 duration-300`}
                >
                  <item.icon size={26} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 gap-3">
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                Biểu đồ doanh thu
              </h3>
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
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.revenueChart}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <CartesianGrid
                    vertical={false}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Doanh thu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
              Đơn hàng gần đây
            </h3>
            <div className="space-y-4">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium mt-1 inline-block">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">
                  Chưa có đơn hàng nào
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product & Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-900 mb-6">Top sản phẩm bán chạy</h3>
            <div className="h-[320px] w-full">
              {topProductChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductChartData}
                    margin={{ top: 8, right: 24, left: 8, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="displayName"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      type="number"
                      domain={[0, (dataMax) => Math.max(5, Math.ceil(dataMax * 1.15))]}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#334155", fontSize: 12 }}
                    >
                      <Label
                        value="Số lượng bán"
                        angle={-90}
                        position="insideLeft"
                        dx={-2}
                        fill="#475569"
                        fontSize={12}
                      />
                    </YAxis>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                      formatter={(value) => [value, "Số lượng bán"]}
                      labelFormatter={(label, payload) => {
                        const revenue = payload?.[0]?.payload?.revenue || 0;
                        const fullName = payload?.[0]?.payload?.fullName || label;
                        return `${fullName} - Doanh thu: ${formatCurrency(revenue)}`;
                      }}
                    />
                    <Bar
                      dataKey="soldQuantity"
                      name="Số lượng bán"
                      radius={[10, 10, 0, 0]}
                    >
                      {topProductChartData.map((item, index) => {
                        const fillColor = index === 0
                          ? DASHBOARD_COLORS.topProductHighlight
                          : DASHBOARD_COLORS.topProductScale[(index - 1) % DASHBOARD_COLORS.topProductScale.length];

                        return <Cell key={`${item.fullName}-${index}`} fill={fillColor} />;
                      })}
                      <LabelList
                        dataKey="soldQuantity"
                        position="top"
                        fill="#0f172a"
                        fontSize={12}
                        formatter={(value) => `${value}`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Chưa có dữ liệu sản phẩm bán chạy
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-900 mb-6">Doanh thu theo danh mục</h3>
            <div className="h-[320px] w-full">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="revenue"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={52}
                      paddingAngle={3}
                      label={({ percent }) => (percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={entry.categoryName}
                          fill={DASHBOARD_COLORS.categoryPalette[index % DASHBOARD_COLORS.categoryPalette.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Legend
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Chưa có dữ liệu doanh thu theo danh mục
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

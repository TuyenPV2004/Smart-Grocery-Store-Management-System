import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import dashboardService from "../services/dashboardService";

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await dashboardService.getStats();
      setStats(res.data);
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
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 ${item.bgColor} ${item.color} rounded-2xl transition-transform group-hover:scale-110 duration-300`}
                >
                  <item.icon size={26} />
                </div>
              </div>

              <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">
                  {item.title}
                </h3>
                <p className="text-2xl font-medium text-slate-900 tracking-tight">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              Biểu đồ doanh thu 7 ngày qua
            </h3>
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
              <Clock size={20} className="text-blue-600" />
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
      </div>
    </div>
  );
};

export default DashboardPage;

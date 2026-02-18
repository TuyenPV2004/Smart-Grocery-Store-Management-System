import React from "react";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const DashboardPage = () => {
  const stats = [
    {
      id: 1,
      title: "Tổng doanh thu",
      value: "15,200,000 VND",
      change: "+12.5%",
      isIncrease: true,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
    {
      id: 2,
      title: "Đơn hàng hôm nay",
      value: "128",
      change: "+8.2%",
      isIncrease: true,
      icon: ShoppingCart,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      id: 3,
      title: "Sản phẩm sắp hết",
      value: "12",
      change: "-2 đơn vị",
      isIncrease: false,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
  ];

  return (
    <div className="p-6 font-poppins antialiased text-slate-600 bg-white min-h-full">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section - Sát mép trên giống các trang trước */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <LayoutDashboard className="text-indigo-600" size={24} />
              </div>
              Tổng quan hệ thống
            </h2>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              Theo dõi các chỉ số kinh doanh quan trọng trong ngày
            </p>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((item) => (
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
                <div
                  className={`flex items-center gap-1 text-[13px] font-medium px-2 py-1 rounded-lg ${
                    item.isIncrease
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-rose-600 bg-rose-50"
                  }`}
                >
                  {item.isIncrease ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {item.change}
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

        {/* Phần nội dung trống phía dưới để giữ cấu trúc trang */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] h-64 flex items-center justify-center text-slate-400 font-medium">
            Biểu đồ tăng trưởng (Đang phát triển)
          </div>
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] h-64 flex items-center justify-center text-slate-400 font-medium">
            Hoạt động gần đây (Đang phát triển)
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

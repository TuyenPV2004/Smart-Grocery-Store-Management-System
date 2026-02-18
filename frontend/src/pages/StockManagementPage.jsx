import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Search,
  Filter,
  Clock,
} from "lucide-react";
import stockService from "../services/stockService";

// ===== BATCH EXPIRY TAB COMPONENT =====
const BatchExpiryTab = () => {
  const [batchData, setBatchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchBatches();
  }, [statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await stockService.getBatchesWithExpiry(statusFilter);
      setBatchData(res.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    if (status === "EXPIRED") {
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-400 text-white">
            Đã hết hạn
          </span>
          <span className="text-xs text-red-600 font-medium">
            ({Math.abs(daysUntilExpiry)} ngày trước)
          </span>
        </div>
      );
    } else if (status === "EXPIRING_SOON") {
      return (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-white">
            Sắp hết hạn
          </span>
          <span className="text-xs text-amber-600 font-medium">
            (còn {daysUntilExpiry} ngày)
          </span>
        </div>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-400 text-white">
          An toàn
        </span>
      );
    }
  };

  const getRowClass = (status) => {
    if (status === "EXPIRED") return "bg-red-50 hover:bg-red-100";
    if (status === "EXPIRING_SOON") return "bg-amber-50 hover:bg-amber-100";
    return "hover:bg-green-50/30";
  };

  const filteredData = batchData.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-3.5 text-slate-400"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên sản phẩm, mã lô, hoặc mã SKU"
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="EXPIRED">Đã hết hạn</option>
          <option value="EXPIRING_SOON">Sắp hết hạn</option>
          <option value="SAFE">An toàn</option>
        </select>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Clock className="text-indigo-600 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-medium text-indigo-900">
            Danh sách được sắp xếp theo FEFO (First Expired, First Out)
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            Các lô hàng sắp hết hạn được ưu tiên hiển thị trên đầu để xử lý kịp
            thời
          </p>
        </div>
      </div>

      {/* Batches Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Đang tải dữ liệu</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Mã lô
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700 whitespace-nowrap">
                  Số lượng
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  NSX
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  HSD
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 whitespace-nowrap">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((batch, index) => (
                <tr
                  key={batch.batchId}
                  className={`transition-colors ${getRowClass(batch.status)}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {index < 3 && batch.status === "EXPIRING_SOON" && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                          FEFO #{index + 1}
                        </span>
                      )}
                      <span className="text-sm text-slate-900 font-medium">
                        {batch.batchCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {batch.productName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {batch.supplierName || "---"}
                  </td>
                  <td className="px-6 py-4 text-center">{batch.quantity}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">
                    {batch.manufacturingDate
                      ? new Date(batch.manufacturingDate).toLocaleDateString(
                          "vi-VN",
                        )
                      : "---"}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">
                    {batch.expiryDate
                      ? new Date(batch.expiryDate).toLocaleDateString("vi-VN")
                      : "---"}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(batch.status, batch.daysUntilExpiry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">
                Không tìm thấy lô hàng nào
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== STOCK CARD TAB COMPONENT =====
const StockCardTab = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await stockService.getSummary();
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchStockHistory = async (productId) => {
    if (!productId) return;

    try {
      setLoading(true);
      const res = await stockService.getStockCard(productId);
      setStockHistory(res.data);
    } catch (error) {
      console.error("Error fetching stock history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    if (productId) {
      fetchStockHistory(productId);
    } else {
      setStockHistory([]);
    }
  };

  const getTransactionBadge = (type) => {
    if (type === "IMPORT") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
          Nhập kho
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
          Xuất kho
        </span>
      );
    }
  };

  const selectedProductInfo = products.find(
    (p) => p.productId == selectedProduct,
  );

  return (
    <div>
      {/* Product Selector */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-indigo-900 mb-3">
          Chọn sản phẩm để xem lịch sử biến động
        </label>
        <select
          value={selectedProduct}
          onChange={handleProductChange}
          className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-medium"
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map((product) => (
            <option key={product.productId} value={product.productId}>
              [{product.sku}] {product.productName} - Tồn:{" "}
              {product.totalQuantity}
            </option>
          ))}
        </select>

        {selectedProductInfo && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-slate-500 font-medium">
                Tổng tồn hiện tại
              </p>
              <p className="text-2xl font-medium text-indigo-600 mt-1">
                {selectedProductInfo.totalQuantity}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-slate-500 font-medium">Giá trị tồn</p>
              <p className="text-lg font-medium text-slate-900 mt-1">
                {selectedProductInfo.stockValue.toLocaleString()} ₫
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-slate-500 font-medium">Đơn vị</p>
              <p className="text-lg font-medium text-slate-900 mt-1">
                {selectedProductInfo.unit}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-slate-500 font-medium">Trạng thái</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {selectedProductInfo.status === "NORMAL"
                  ? "Bình thường"
                  : selectedProductInfo.status === "LOW_STOCK"
                    ? "Sắp hết"
                    : selectedProductInfo.status === "OUT_OF_STOCK"
                      ? "Hết hàng"
                      : "Cần xả"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {!selectedProduct ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Package className="mx-auto text-slate-300 mb-4" size={64} />
          <p className="text-slate-500 font-medium text-lg">
            Vui lòng chọn sản phẩm để xem thẻ kho
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Đang tải lịch sử...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Loại phiếu
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Mã phiếu
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Mã lô
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  Ghi chú
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Biến động
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                  Tồn cuối
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockHistory.map((record, index) => (
                <tr
                  key={index}
                  className="hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(record.transactionDate).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {getTransactionBadge(record.transactionType)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-indigo-600">
                      {record.noteCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {record.batchCode || "---"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {record.description || "---"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-lg font-medium text-sm ${
                        record.quantityChange > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {record.quantityChange > 0 ? "+" : ""}
                      {record.quantityChange}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm">
                      {record.runningBalance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stockHistory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">
                Chưa có giao dịch nào cho sản phẩm này
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== MAIN COMPONENT =====
const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [stats, setStats] = useState({
    totalValue: 0,
    expiringBatches: 0,
    lowStockItems: 0,
  });
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchDashboardStats();
    fetchStockSummary();
  }, [statusFilter]);

  const fetchDashboardStats = async () => {
    try {
      const res = await stockService.getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchStockSummary = async () => {
    try {
      setLoading(true);
      const res = await stockService.getSummary(statusFilter);
      setStockData(res.data);
    } catch (error) {
      console.error("Error fetching stock summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      OUT_OF_STOCK: {
        bg: "bg-red-400",
        text: "text-white",
        label: "Hết hàng",
        icon: "",
      },
      LOW_STOCK: {
        bg: "bg-orange-400",
        text: "text-white",
        label: "Sắp hết",
        icon: "",
      },
      NEAR_EXPIRY: {
        bg: "bg-amber-400",
        text: "text-white",
        label: "Cần xả",
        icon: "",
      },
      NORMAL: {
        bg: "bg-green-400",
        text: "text-white",
        label: "Bình thường",
        icon: "",
      },
    };
    const badge = badges[status] || badges.NORMAL;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}
      >
        {badge.icon} {badge.label}
      </span>
    );
  };

  const filteredData = stockData.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-slate-900 flex items-center gap-3">
          Quản lý tồn kho
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Theo dõi tồn kho, lô hàng và biến động hàng hóa
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign size={28} />
            </div>
            <span className="text-sm font-medium opacity-90">Tổng giá trị</span>
          </div>
          <p className="text-3xl font-medium">
            {stats.totalValue.toLocaleString()} đ
          </p>
          <p className="text-sm opacity-75 mt-1">Tổng giá trị tồn kho</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle size={28} />
            </div>
            <span className="text-sm font-medium opacity-90">Sắp hết hạn</span>
          </div>
          <p className="text-3xl font-medium">{stats.expiringBatches}</p>
          <p className="text-sm opacity-75 mt-1">Lô hàng cần xử lý</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingDown size={28} />
            </div>
            <span className="text-sm font-medium opacity-90">
              Cần nhập thêm
            </span>
          </div>
          <p className="text-3xl font-medium">{stats.lowStockItems}</p>
          <p className="text-sm opacity-75 mt-1">Sản phẩm sắp/hết hàng</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-6 py-4 font-medium transition-all ${
              activeTab === "summary"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Tổng hợp tồn kho
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-6 py-4 font-medium transition-all ${
              activeTab === "batches"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Quản lý Lô và HSD
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`px-6 py-4 font-medium transition-all ${
              activeTab === "card"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Thẻ kho
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "summary" && (
            <div>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU"
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                  <option value="LOW_STOCK">Sắp hết</option>
                  <option value="NEAR_EXPIRY">Cần xả hàng</option>
                  <option value="NORMAL">Bình thường</option>
                </select>
              </div>

              {/* Stock Summary Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="text-slate-600 mt-4">Đang tải dữ liệu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 w-[400px]">
                          Tên sản phẩm
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                          Mã SKU
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                          Hệ số
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                          Tổng nhập
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                          Tổng xuất
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                          Tổng tồn
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                          Giá trị
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.map((item) => (
                        <tr
                          key={item.productId}
                          className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  item.thumbnail
                                    ? `http://localhost:8080/${item.thumbnail}`
                                    : "https://placehold.co/40x40?text=No+Img"
                                }
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover border border-slate-200 bg-white"
                                onError={(e) => {
                                  e.target.src =
                                    "https://placehold.co/40x40?text=Error";
                                }}
                              />
                              <div>
                                <div className="font-medium text-slate-900 whitespace-normal">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {item.brand || "---"} - {item.unit}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.conversionRate || 1}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.totalImported || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.totalExported || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.totalQuantity}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900">
                            {item.stockValue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredData.length === 0 && (
                    <div className="text-center py-12">
                      <Package
                        className="mx-auto text-slate-300 mb-4"
                        size={48}
                      />
                      <p className="text-slate-500 font-medium">
                        Không tìm thấy sản phẩm nào
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "batches" && <BatchExpiryTab />}

          {activeTab === "card" && <StockCardTab />}
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;

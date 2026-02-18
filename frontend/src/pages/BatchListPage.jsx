import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import batchService from "../services/batchService";
import {
  Package,
  Eye,
  X,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, batch }) => {
  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70] backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Chi tiết lô hàng: {batch.batchCode}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Mã phiếu
              </p>
              <p className="font-medium text-indigo-600">
                {batch.inventoryNote?.code}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Mã lô hàng
              </p>
              <p className="font-medium text-indigo-600">{batch.batchCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Sản phẩm
              </p>
              <p className="font-medium text-slate-700">
                {batch.product?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Mã SKU
              </p>
              <p className="font-medium text-slate-700">
                {batch.product?.sku}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Nhà cung cấp
              </p>
              <p className="font-medium text-slate-700">
                {batch.supplier?.vietnameseName || "---"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Đơn giá nhập
              </p>
              <p className="font-medium text-indigo-600">
                {(
                  (batch.importPrice || 0) * (batch.conversionRate || 1)
                ).toLocaleString()}{" "}
                ₫
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Ngày sản xuất
              </p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar size={14} className="text-indigo-500" />
                {batch.manufacturingDate || "---"}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Hạn sử dụng
              </p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar size={14} className="text-indigo-500" />
                {batch.expiryDate || "---"}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Số lượng lô nhập
              </p>
              <p className="font-medium text-slate-700">
                {batch.quantityInImportUnit
                  ? `${batch.quantityInImportUnit} ${batch.importUnit || "đơn vị"}`
                  : `${batch.quantity || 0} ${batch.product?.unit || ""}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                Số lượng hàng tồn
              </p>
              <p className="font-medium text-slate-700">
                {batch.stockInImportUnit
                  ? `${batch.stockInImportUnit} ${batch.importUnit || "đơn vị"}`
                  : `${batch.product?.stockQuantity || 0} ${batch.product?.unit || ""}`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const BatchListPage = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchBatches();
  }, [currentPage]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchService.getAll(currentPage, 20);
      const dataList = Array.isArray(res.data)
        ? res.data
        : res.data.content || [];
      setBatches(dataList);
      setTotalPages(res.data.totalPages || 0);
    } catch (error) {
      console.error("Lỗi tải danh sách lô hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lô hàng này?")) return;

    try {
      await batchService.deleteBatch(batchId);
      alert("Đã xóa lô hàng thành công!");
      fetchBatches(); // Refresh list
    } catch (error) {
      alert("Lỗi xóa lô hàng: " + (error.response?.data || error.message));
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: "unknown", color: "slate" };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        color: "red",
        icon: AlertCircle,
        text: "Hết hạn",
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "near-expiry",
        color: "amber",
        icon: Clock,
        text: "Sắp hết hạn",
      };
    } else {
      return {
        status: "good",
        color: "emerald",
        icon: CheckCircle,
        text: "Còn hạn",
      };
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (batch.batchCode || "").toLowerCase().includes(searchLower) ||
      (batch.product?.sku || "").toLowerCase().includes(searchLower) ||
      (batch.product?.name || "").toLowerCase().includes(searchLower) ||
      (batch.supplier?.vietnameseName || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-poppins text-slate-600">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 flex items-center">
              <Package className="mr-3 text-indigo-600" size={28} />
              Danh sách lô hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý và theo dõi các lô hàng nhập kho
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lô, SKU, tên sản phẩm, nhà cung cấp"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                      Mã phiếu
                    </th>
                    <th className="px-6 py-4 w-40 font-medium text-slate-900 text-sm tracking-wider">
                      Mã lô
                    </th>
                    <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                      Nhà cung cấp
                    </th>
                    <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider whitespace-nowrap">
                      Số lượng
                    </th>
                    <th className="px-6 py-4 min-w-[140px] font-medium text-slate-900 text-sm tracking-wider">
                      <div className="flex flex-col items-center ml-auto w-fit">
                        <span className="block">Giá nhập</span>
                        <span className="block">đơn vị</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider text-center whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 font-medium text-slate-900 text-center text-sm tracking-wider whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBatches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiryDate);
                    const StatusIcon = expiryStatus.icon;

                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {batch.inventoryNote?.code || "---"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {batch.batchCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {batch.product?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900">
                          {batch.supplier?.vietnameseName || "---"}
                        </td>
                        <td className="px-4 py-4 text-center font-slate-900">
                          {batch.quantityInImportUnit || 0} {batch.importUnit}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800 text-right">
                          {(
                            (batch.importPrice || 0) *
                            (batch.conversionRate || 1)
                          ).toLocaleString()}{" "}
                          ₫
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-${expiryStatus.color}-100 text-${expiryStatus.color}-700 border border-${expiryStatus.color}-200`}
                          >
                            {StatusIcon && <StatusIcon size={12} />}
                            {expiryStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(batch)}
                              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                              title="Xóa lô"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBatches.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-8 text-center text-slate-400"
                      >
                        {searchTerm
                          ? "Không tìm thấy lô hàng nào phù hợp."
                          : "Chưa có lô hàng nào."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-slate-600">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batch={selectedBatch}
      />
    </div>
  );
};

export default BatchListPage;

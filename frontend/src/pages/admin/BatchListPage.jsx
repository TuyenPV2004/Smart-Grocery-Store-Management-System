import { toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import batchService from "../../services/batchService";
import {
  FiEye as Eye,
  FiX as X,
  FiSearch as Search,
  FiAlertCircle as AlertCircle,
  FiCheckCircle as CheckCircle,
  FiClock as Clock,
  FiTrash2 as Trash2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import ReactPaginate from "react-paginate";

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, batch }) => {
  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70] backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
            Chi tiết lô hàng: {batch.batchCode}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Mã phiếu
              </p>
              <p className="font-medium text-slate-900">
                {batch.inventoryNote?.code}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Mã lô hàng
              </p>
              <p className="font-medium text-slate-900">{batch.batchCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Sản phẩm
              </p>
              <p className="font-medium text-slate-700">
                {batch.product?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">Mã SKU</p>
              <p className="font-medium text-slate-700">{batch.product?.sku}</p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Nhà cung cấp
              </p>
              <p className="font-medium text-slate-700">
                {batch.supplier?.vietnameseName || "---"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Đơn giá nhập
              </p>
              <p className="font-medium text-slate-900">
                {(
                  (batch.importPrice || 0) * (batch.conversionRate || 1)
                ).toLocaleString()}{" "}
                ₫
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Ngày sản xuất
              </p>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                {batch.manufacturingDate || "---"}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Hạn sử dụng
              </p>
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                {batch.expiryDate || "---"}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
                Số lượng lô nhập
              </p>
              <p className="font-medium text-slate-700">
                {batch.quantityInImportUnit
                  ? `${batch.quantityInImportUnit} ${batch.importUnit || "đơn vị"}`
                  : `${batch.quantity || 0} ${batch.product?.unit || ""}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-900 font-medium mb-1">
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
      </div>
    </div>
  );
};

// Main Component
const BatchListPage = () => {
  const batchesPerPage = 10;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBatches();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchService.getAll(
        currentPage,
        batchesPerPage,
        debouncedSearchTerm,
        statusFilter,
      );
      const dataList = Array.isArray(res.data)
        ? res.data
        : res.data.content || [];
      setBatches(dataList);
      setTotalPages(res.data.totalPages || 0);
      setTotalBatches(res.data.totalElements ?? dataList.length);
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
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa lô hàng này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      await batchService.deleteBatch(batchId);
      toast.success("Đã xóa lô hàng thành công!");
      fetchBatches(); // Refresh list
    } catch (error) {
      toast.error(
        "Lỗi xóa lô hàng: " + (error.response?.data || error.message),
      );
    }
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate)
      return { status: "unknown", color: "bg-slate-500 text-white" };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        color: "bg-red-600 text-white",
        icon: AlertCircle,
        text: "Hết hạn",
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "near-expiry",
        color: "bg-amber-500 text-white",
        icon: Clock,
        text: "Sắp hết hạn",
      };
    } else {
      return {
        status: "good",
        color: "bg-emerald-600 text-white",
        icon: CheckCircle,
        text: "Còn hạn",
      };
    }
  };

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins text-slate-600">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 flex items-center">
              Danh sách lô hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý và theo dõi các lô hàng nhập kho
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[420px]">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã lô, tên sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="good">Còn hạn</option>
            <option value="near-expiry">Sắp hết hạn</option>
            <option value="expired">Hết hạn</option>
            <option value="unknown">Không rõ</option>
          </select>
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
                  {batches.map((batch) => {
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
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full shadow-sm min-w-[100px] justify-center ${expiryStatus.color}`}
                          >
                            {StatusIcon && <StatusIcon size={12} />}
                            {expiryStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(batch)}
                              className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
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
                  {batches.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="p-8 text-center text-slate-400"
                      >
                        {searchTerm || statusFilter !== "ALL"
                          ? "Không tìm thấy lô hàng nào phù hợp."
                          : "Chưa có lô hàng nào."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm">
          <span>Tổng lô hàng:</span>
          <span className="text-slate-900">{totalBatches}</span>
        </div>

        {totalPages > 1 && (
          <ReactPaginate
            breakLabel="..."
            nextLabel=">"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={totalPages}
            previousLabel="<"
            forcePage={currentPage}
            renderOnZeroPageCount={null}
            containerClassName="flex items-center gap-1"
            pageClassName=""
            pageLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            previousClassName=""
            previousLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            nextClassName=""
            nextLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            breakClassName=""
            breakLinkClassName="min-w-9 h-9 px-2 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 text-sm font-medium"
            activeClassName=""
            activeLinkClassName="!bg-green-600 !text-white !border-green-600"
            disabledClassName="opacity-40 pointer-events-none"
          />
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

import { toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import inventoryService from "../../services/inventoryService";
import {
  FileSpreadsheet,
  Eye,
  Package,
  ClipboardList,
  X,
  User,
  Calendar,
  Trash2,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";

const DetailModal = ({ isOpen, onClose, note }) => {
  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70] backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
            Chi tiết phiếu nhập: {note.code}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className="p-6 overflow-y-auto flex-1 space-y-6 [&::-webkit-scrollbar]:w-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Ngày tạo
              </p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                {new Date(note.createdAt).toLocaleString("vi-VN")}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Mã nhân viên
              </p>
              <p className="font-medium text-slate-700">
                {note.createdBy?.staffCode}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Nhân viên thực hiện
              </p>
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <span>{note.createdBy?.fullName}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Trạng thái
              </p>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {note.status || "Hoàn thành"}
              </span>
            </div>
            <div className="col-span-full border-t border-slate-200 pt-3 mt-1">
              <p className="text-xs text-slate-500 font-medium">Ghi chú</p>
              <p className="font-medium text-slate-700 italic">
                {note.note || "Không có ghi chú"}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-[1.25rem] overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-4 py-4 font-medium text-left border-b border-slate-100 first:pl-6">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-4 font-medium text-left border-b border-slate-100 whitespace-nowrap">
                    Mã SKU
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100">
                    Đơn vị
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100 whitespace-nowrap">
                    Số lượng
                  </th>
                  <th className="px-4 py-4 font-medium text-center border-b border-slate-100 whitespace-nowrap">
                    Hệ số
                  </th>
                  <th className="px-4 py-4 font-medium text-right border-b border-slate-100 whitespace-nowrap">
                    Đơn giá
                  </th>
                  <th className="px-4 py-4 font-medium text-right border-b border-slate-100 whitespace-nowrap first:pr-6">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {note.details?.map((d, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={
                              d.product?.thumbnail
                                ? `http://localhost:8080/${d.product.thumbnail}`
                                : "https://via.placeholder.com/40"
                            }
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src = "https://via.placeholder.com/40")
                            }
                          />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 leading-tight">
                            {d.product?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left">
                      <span className="text-[13px] font-medium text-slate-900 whitespace-nowrap">
                        {d.product?.sku || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-900 font-medium">
                      {d.importUnit}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-900">
                      {d.quantityInImportUnit}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-900">
                      {d.conversionRate || 1}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                      {d.importPrice?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                      {(
                        d.conversionRate *
                        d.importPrice *
                        d.quantityInImportUnit
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            Tổng sản phẩm:{" "}
            <span className="text-slate-600 font-medium">
              {note.details?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg text-slate-600 font-medium">Tổng tiền phiếu:</span>
            <span className="text-lg font-medium text-slate-600">
              {note.finalAmount?.toLocaleString()} VNĐ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryListPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await inventoryService.getAll();
      setNotes(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách phiếu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await inventoryService.getById(id);
      setSelectedNote(res.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Lỗi tải chi tiết phiếu: " + error.message);
    }
  };

  const handleExport = async (id, code) => {
    try {
      const response = await inventoryService.exportExcel(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = code ? `${code}.xlsx` : `PhieuNhap_${id}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Lỗi xuất file: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa phiếu nhập này không? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await inventoryService.delete(id);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
        toast.success("Xóa phiếu thành công!");
      } catch (error) {
        toast.error(
          "Lỗi xóa phiếu: " + (error.response?.data || error.message),
        );
      }
    }
  };

  const getNoteType = (note) => {
    if (note?.type) {
      const normalizedType = String(note.type).toUpperCase();
      if (normalizedType.includes("EXP") || normalizedType.includes("EXPORT")) {
        return "EXP";
      }
      if (normalizedType.includes("IMP") || normalizedType.includes("IMPORT")) {
        return "IMP";
      }
    }

    const normalizedCode = String(note?.code || "").toUpperCase();
    return normalizedCode.startsWith("EXP") ? "EXP" : "IMP";
  };

  const filteredNotes = notes.filter((note) => {
    const keyword = searchTerm.trim().toLowerCase();
    const createdAt = note?.createdAt ? new Date(note.createdAt) : null;

    const matchesSearch =
      !keyword ||
      String(note?.code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(note?.createdBy?.staffCode || "")
        .toLowerCase()
        .includes(keyword) ||
      String(note?.createdBy?.fullName || "")
        .toLowerCase()
        .includes(keyword);

    const noteType = getNoteType(note);
    const matchesType = typeFilter === "ALL" || noteType === typeFilter;

    let matchesTime = true;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      const now = new Date();
      const startToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (timeFilter === "TODAY") {
        matchesTime = createdAt >= startToday;
      } else if (timeFilter === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(startToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        matchesTime = createdAt >= sevenDaysAgo;
      } else if (timeFilter === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date(startToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        matchesTime = createdAt >= thirtyDaysAgo;
      } else if (timeFilter === "THIS_MONTH") {
        matchesTime =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();
      }
    } else if (timeFilter !== "ALL") {
      matchesTime = false;
    }

    return matchesSearch && matchesType && matchesTime;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotes.length / itemsPerPage),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, timeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotes = filteredNotes.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="admin-page-shell min-h-screen p-6 font-poppins text-slate-600">
      <div className="max-w-[1400px] mx-auto mb-6">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 flex items-center">
            Danh sách phiếu nhập xuất kho
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Tạo phiếu nhập, quản lý thông tin phiếu nhập xuất kho
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative w-[420px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu, mã nhân viên, người tạo"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
          >
            <option value="ALL">Tất cả loại phiếu</option>
            <option value="IMP">Phiếu nhập</option>
            <option value="EXP">Phiếu xuất</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="LAST_7_DAYS">7 ngày gần nhất</option>
            <option value="LAST_30_DAYS">30 ngày gần nhất</option>
            <option value="THIS_MONTH">Tháng này</option>
          </select>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                    Mã phiếu
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                    Mã nhân viên
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider">
                    Người tạo
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-sm tracking-wider text-right">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center text-sm tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedNotes.map((note) => {
                  const isExport = getNoteType(note) === "EXP";

                  return (
                    <tr
                      key={note.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td
                        className={`px-6 py-4 font-medium ${
                          isExport ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {note.code}
                      </td>

                      <td className="px-6 py-4 text-slate-800">
                        {new Date(note.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {note.createdBy?.staffCode || "---"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {note.createdBy?.fullName || "N/A"}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-800 text-right">
                        {note.finalAmount
                          ? note.finalAmount.toLocaleString()
                          : "0"}{" "}
                        ₫
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleExport(note.id, note.code)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="Xuất Excel"
                          >
                            <FileSpreadsheet size={18} />
                          </button>

                          <button
                            onClick={() => handleViewDetail(note.id)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Xóa phiếu"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredNotes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">
                      Không có phiếu phù hợp bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredNotes.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <p className="text-sm text-slate-500">
                  Hiển thị {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, filteredNotes.length)} /{" "}
                  {filteredNotes.length} phiếu
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm rounded-lg border ${
                          currentPage === page
                            ? "bg-green-600 text-white border-green-600"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        note={selectedNote}
      />
    </div>
  );
};

export default InventoryListPage;

import { toast } from 'react-toastify';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import inventoryService from "../services/inventoryService";
import {
  FileSpreadsheet,
  Eye,
  Package,
  ClipboardList,
  X,
  User,
  Calendar,
  Trash2, // 1. Import thêm icon Trash2
} from "lucide-react";

// --- MODAL XEM CHI TIẾT (Giữ nguyên như cũ) ---
const DetailModal = ({ isOpen, onClose, note }) => {
  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70] backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl border border-white/50 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-green-600" />
            Chi tiết phiếu nhập: {note.code}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                Ngày tạo
              </p>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar size={14} className="text-green-500" />
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
                <User size={14} className="text-green-500" />
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
                          <div className="text-[11px] text-slate-900 mt-1 font-medium">
                            {d.batchCode}
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
            <Package size={20} className="text-green-600" />
            Tổng sản phẩm:{" "}
            <span className="text-green-600 font-bold">
              {note.details?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">Tổng tiền phiếu:</span>
            <span className="text-2xl font-medium text-green-600">
              {note.finalAmount?.toLocaleString()} VNĐ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TRANG CHÍNH ---
const InventoryListPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa phiếu nhập này không? Hành động này không thể hoàn tác.",
      )
    ) {
      try {
        await inventoryService.delete(id);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
        toast.success("Xóa phiếu thành công!");
      } catch (error) {
        toast.error("Lỗi xóa phiếu: " + (error.response?.data || error.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-poppins text-slate-600">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 flex items-center">
            Danh sách phiếu nhập xuất kho
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Tạo phiếu nhập, quản lý thông tin phiếu nhập xuất kho
              </p>
        </div>
        <button
          onClick={() => navigate("/inventory/entry")}
          className="bg-green-600 text-white px-5 py-2 rounded-xl flex items-center shadow-sm hover:bg-green-700 transition-all font-medium"
        >
        Tạo phiếu nhập
        </button>
      </div>

      {/* Table */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu</div>
        ) : (
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
              {notes.map((note) => (
                <tr
                  key={note.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-green-600">
                    {note.code}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {new Date(note.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  {/* 3. SỬA: Đồng bộ giao diện (bỏ background, style giống các cột khác) */}
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {note.createdBy?.staffCode || "---"}
                  </td>

                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {note.createdBy?.fullName || "N/A"}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-800 text-right">
                    {note.finalAmount ? note.finalAmount.toLocaleString() : "0"}{" "}
                    ₫
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleExport(note.id, note.code)}
                        className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                        title="Xuất Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>

                      <button
                        onClick={() => handleViewDetail(note.id)}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>

                      {/* 4. Nút Xóa mới */}
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Xóa phiếu"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Chưa có phiếu nào được tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

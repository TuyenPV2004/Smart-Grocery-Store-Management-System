import { toast } from 'react-toastify';
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Search, X, CheckCircle } from "lucide-react";
import bankAccountService from "../services/bankAccountService";

const bankOptions = [
  {
    name: "Ngân hàng Quân đội",
    code: "MB",
    logo: "https://api.vietqr.io/img/MB.png",
    brand: "MB Bank",
  },
  {
    name: "Ngân hàng TMCP Công Thương Việt Nam",
    code: "ICB",
    logo: "https://rabbitcare.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fround-fold%2FVietinbank_logo_40f464dd33%2FVietinbank_logo_40f464dd33.jpg&w=3840&q=25",
    brand: "VietinBank",
  },
  {
    name: "Ngân hàng TMCP Phát triển TP. Hồ Chí Minh",
    code: "HDB",
    logo: "https://api.vietqr.io/img/HDB.png",
    brand: "HDBank",
  },
  {
    name: "Ngân hàng TMCP Đại Dương",
    code: "OJB",
    logo: "https://rabbitcare.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fround-fold%2FOceanbank_logo_3e3a098b25%2FOceanbank_logo_3e3a098b25.jpg&w=3840&q=25",
    brand: "OceanBank",
  },
  {
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    code: "VPB",
    logo: "https://api.vietqr.io/img/VPB.png",
    brand: "VPBank",
  },
  {
    name: "Ngân hàng TMCP Xuất nhập khẩu Việt Nam",
    code: "EIB",
    logo: "https://api.vietqr.io/img/EIB.png",
    brand: "Eximbank",
  },
  {
    name: "Ngân hàng TMCP Đông Nam Á",
    code: "SEAB",
    logo: "https://api.vietqr.io/img/SEAB.png",
    brand: "SeABank",
  },
  {
    name: "Ngân hàng TMCP Sài Gòn",
    code: "SCB",
    logo: "https://api.vietqr.io/img/SCB.png",
    brand: "Saigonbank",
  },
  {
    name: "Ngân hàng TMCP Tiên Phong",
    code: "TPB",
    logo: "https://api.vietqr.io/img/TPB.png",
    brand: "TPBank",
  },
];

const findBank = (bankName) => {
  if (!bankName) return null;
  const normalized = bankName.toLowerCase();
  return bankOptions.find(
    (b) =>
      normalized.includes(b.name.toLowerCase()) ||
      normalized.includes(b.brand.toLowerCase()) ||
      b.name.toLowerCase().includes(normalized) ||
      b.brand.toLowerCase().includes(normalized),
  );
};

const getQrUrl = (bankName, accountNumber) => {
  const bank = findBank(bankName);
  const code = bank ? bank.code : "MB";
  return `https://img.vietqr.io/image/${code}-${accountNumber}-print.png`;
};

const CashFlowManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    bankName: bankOptions[0].name,
    accountNumber: "",
    accountOwner: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await bankAccountService.getAll();
      setAccounts(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tài khoản:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await bankAccountService.update(editId, formData);
        toast.success("Cập nhật tài khoản thành công!");
      } else {
        await bankAccountService.create(formData);
        toast.success("Thêm tài khoản thành công!");
      }
      setShowModal(false);
      setEditId(null);
      setFormData({
        bankName: bankOptions[0].name, // Reset with the name of the first bank object
        accountNumber: "",
        accountOwner: "",
        status: "ACTIVE",
      });
      fetchAccounts();
    } catch (error) {
      toast.error(
        `Lỗi khi ${editId ? "cập nhật" : "thêm"} tài khoản: ` +
          (error.response?.data || error.message),
      );
    }
  };

  const handleEdit = (account) => {
    setEditId(account.id);
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountOwner: account.accountOwner,
      status: account.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await bankAccountService.delete(id);
        toast.success("Xóa thành công!");
        fetchAccounts();
      } catch (error) {
        toast.error("Lỗi khi xóa tài khoản.");
      }
    }
  };

  const handleToggleStatus = async (account) => {
    try {
      if (account.status !== "ACTIVE") {
        // Tắt account hiện tại
        const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
        for (let acc of activeAccounts) {
          await bankAccountService.update(acc.id, {
            ...acc,
            status: "INACTIVE",
          });
        }
        await bankAccountService.update(account.id, {
          ...account,
          status: "ACTIVE",
        });
      } else {
        await bankAccountService.update(account.id, {
          ...account,
          status: "INACTIVE",
        });
      }
      fetchAccounts();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      toast.error("Lỗi khi cập nhật trạng thái tài khoản.");
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.accountNumber.includes(searchQuery) ||
      acc.accountOwner.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 md:p-8 font-poppins min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight flex items-center gap-2">
            Quản lý dòng tiền
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Quản lý thông tin các tài khoản ngân hàng nhận thanh toán
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between gap-4 w-full">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài khoản..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all text-sm font-medium text-slate-700"
          />
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setFormData({
              bankName: bankOptions[0].name, // Reset with the name of the first bank object
              accountNumber: "",
              accountOwner: "",
              status: "ACTIVE",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-200 font-medium text-sm active:scale-95"
        >
          Thêm tài khoản
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider">
                  STT
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider">
                  Ngân hàng
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider">
                  Thương hiệu
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider">
                  Số tài khoản
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider">
                  Chủ tài khoản
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider text-center">
                  Mã QR
                </th>
                <th className="py-4 px-6 text-xs font-medium text-slate-900 tracking-wider text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Đang tải dữ liệu
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, index) => {
                  const bankInfo = findBank(acc.bankName);
                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {bankInfo ? (
                            <img
                              src={bankInfo.logo}
                              alt={bankInfo.name}
                              className="w-14 h-14 object-contain rounded border border-slate-100 p-1 bg-white"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-medium text-xs">
                              {acc.bankName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-900">
                            {bankInfo ? bankInfo.name : acc.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700">
                        {bankInfo?.brand || ""}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700 tracking-wide">
                        {acc.accountNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700">
                        {/* Đã bỏ chữ in hoa (uppercase) */}
                        {acc.accountOwner}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <img
                            src={getQrUrl(acc.bankName, acc.accountNumber)}
                            alt="QR Code"
                            className="w-12 h-12 rounded-lg cursor-pointer hover:scale-110 transition-transform shadow-sm object-cover bg-white"
                            onClick={() =>
                              setSelectedQR(
                                getQrUrl(acc.bankName, acc.accountNumber),
                              )
                            }
                            title="Nhấn để phóng to"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Các nút thao tác luôn hiển thị */}
                          <button
                            onClick={() => handleToggleStatus(acc)}
                            className={`${acc.status === "ACTIVE" ? "text-green-500" : "text-slate-300 hover:text-green-400"} transition-colors`}
                            title={
                              acc.status === "ACTIVE"
                                ? "Đang sử dụng thay toán QR"
                                : "Chọn sử dụng"
                            }
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(acc)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="text-rose-600 hover:text-rose-800"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm tài khoản */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 p-4 -mx-6 -mt-6 mb-6 rounded-t-2xl">
              <h2 className="text-xl font-medium text-slate-800">
                {editId ? "Cập nhật tài khoản" : "Thêm mới tài khoản"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngân hàng
                </label>
                <div className="flex items-center gap-3">
                  {formData.bankName && findBank(formData.bankName) && (
                    <img
                      src={findBank(formData.bankName).logo}
                      alt="Bank Logo"
                      className="w-14 h-14 object-contain rounded border border-slate-100 p-1 bg-white"
                    />
                  )}
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="" disabled>
                      Chọn ngân hàng
                    </option>
                    {bankOptions.map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập số tài khoản"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  name="accountOwner"
                  value={formData.accountOwner}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên chủ tài khoản"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3 pb-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium shadow-md shadow-green-100 hover:bg-green-700 transition-colors"
                >
                  {editId ? "Cập nhật" : "Lưu tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full screen QR Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedQR(null)}
        >
          <div className="relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute -top-12 -right-4 text-white hover:text-red-400 p-2 transition-colors z-[70] bg-black/40 rounded-full"
            >
              <X size={28} />
            </button>
            <div
              className="bg-white p-6 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedQR}
                alt="QR Code Full"
                className="w-80 md:w-96 md:h-96 h-80 object-contain rounded-xl"
              />
              <p className="text-center font-medium text-slate-600 mt-4">
                Quét mã để chuyển khoản
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowManagementPage;

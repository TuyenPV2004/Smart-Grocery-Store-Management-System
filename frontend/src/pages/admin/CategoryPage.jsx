import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  Info,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import HistoryModal from "../../components/HistoryModal";

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    slug: "",
    description: "",
    parentId: "",
    label: "",
    labelColor: "#000000",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        categoryService.getTree(),
        categoryService.getFlat(),
      ]);
      setCategories(treeRes.data);
      setFlatCategories(flatRes.data);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !prev.id ? slug : prev.slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parent: formData.parentId ? { id: formData.parentId } : null,
    };
    try {
      if (formData.id) {
        await categoryService.update(formData.id, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await categoryService.create(payload);
        toast.success("Tạo mới thành công!");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data || "Có lỗi xảy ra"));
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc muốn xóa danh mục này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await categoryService.delete(id);
        fetchData();
        toast.success("Xóa thành công!");
      } catch (error) {
        toast.error(error.response?.data || "Lỗi khi xóa");
      }
    }
  };

  const openEdit = (cat) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parentId: cat.parent ? cat.parent.id : "",
      label: cat.label || "",
      labelColor: cat.labelColor || "#000000",
    });
    setShowModal(true);
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await categoryService.getHistory(id);
      setHistoryData(res.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Lỗi tải lịch sử", error);
      toast.error("Không thể tải lịch sử");
    }
  };

  const CategoryRow = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[category.id];

    return (
      <>
        <tr className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 32}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="mr-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
              ) : (
                <span className="w-[26px]"></span>
              )}

              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="mr-2 text-amber-400" size={20} />
                ) : (
                  <Folder className="mr-2 text-amber-400" size={20} />
                )
              ) : (
                <div className="w-1.5 h-1.5 bg-slate-300 mr-3 rounded-full ml-1"></div>
              )}
              <span
                className={`font-medium ${
                  level === 0
                    ? "text-slate-900 text-[15px]"
                    : "text-slate-700 text-[14px]"
                }`}
              >
                {category.name}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm font-medium">
            {category.slug}
          </td>

          <td className="px-6 py-4 whitespace-nowrap">
            {category.label && (
              <span
                className="px-3 py-1 rounded-lg text-[11px] font-medium text-white shadow-sm"
                style={{ backgroundColor: category.labelColor }}
              >
                {category.label}
              </span>
            )}
          </td>

          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => openEdit(category)}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                title="Sửa"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-rose-600 hover:text-rose-800 transition-colors"
                title="Xóa"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <button
              onClick={() => handleViewHistory(category.id)}
              className="text-slate-400 hover:text-blue-600 transition-colors"
              title="Lịch sử"
            >
              <Info size={20} />
            </button>
          </td>
        </tr>
        {isExpanded &&
          category.children.map((child) => (
            <CategoryRow key={child.id} category={child} level={level + 1} />
          ))}
      </>
    );
  };

  return (
    <div className="admin-page-shell p-6 font-poppins antialiased text-slate-600">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 flex items-center gap-3">
              Quản lý danh mục sản phẩm
            </h1>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              Cấu trúc cây danh mục và phân loại hàng hóa
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                id: null,
                name: "",
                slug: "",
                description: "",
                parentId: "",
                label: "",
                labelColor: "#000000",
              });
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center shadow-sm hover:bg-green-700 transition-all active:scale-95 font-medium"
          >
            Thêm danh mục
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-medium text-slate-900 whitespace-nowrap">
                    Nhãn gán
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 whitespace-nowrap w-[150px]">
                    Hành động
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-slate-900 whitespace-nowrap w-[120px]">
                    Lịch sử
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <CategoryRow key={cat.id} category={cat} />
                ))}
              </tbody>
            </table>
          </div>
          {categories.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">
              Không tìm thấy danh mục nào.
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM/SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="px-8 pt-6 pb-3 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-900 flex items-center gap-3">
                {formData.id ? "Cập nhật danh mục" : "Tạo danh mục mới"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Đóng"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-6 pt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2 ml-1">
                  Tên danh mục
                </label>
                <input
                  required
                  className="w-full border border-slate-200 rounded-2xl px-5 py-2.5 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium text-slate-900"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2 ml-1">
                    Tên nhãn gán
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-5 py-2.5 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium text-slate-900"
                    placeholder="Nhập tên nhãn"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2 ml-1">
                    Màu sắc nhãn
                  </label>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                    <input
                      type="color"
                      className="h-8 w-14 p-0.5 rounded-lg border-none cursor-pointer bg-transparent"
                      value={formData.labelColor}
                      onChange={(e) =>
                        setFormData({ ...formData, labelColor: e.target.value })
                      }
                    />
                    <span className="text-xs font-medium text-slate-400">
                      {formData.labelColor}
                    </span>
                  </div>
                </div>
              </div>

              {formData.label && (
                <div className="flex items-center gap-3 text-[13px] text-slate-500 bg-indigo-50/30 px-4 py-3 rounded-2xl border border-indigo-100">
                  <span className="font-medium">Xem trước nhãn:</span>
                  <span
                    className="px-3 py-1 rounded-lg text-[11px] font-medium text-white shadow-sm"
                    style={{ backgroundColor: formData.labelColor }}
                  >
                    {formData.label}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2 ml-1">
                  Danh mục cấp cha
                </label>
                <div className="relative">
                  <select
                    className="w-full border border-slate-200 rounded-2xl px-5 py-2.5 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                  >
                    <option value="">Lựa chọn danh mục gốc</option>
                    {flatCategories
                      .filter((c) => c.id !== formData.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2 ml-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows="2"
                  className="w-full border border-slate-200 rounded-[1.5rem] px-5 py-2.5 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium text-slate-900 resize-none"
                  placeholder="Mô tả ngắn gọn về danh mục"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm shadow-green-100 transition-all active:scale-95"
                >
                  {formData.id ? "Cập nhật ngay" : "Tạo danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ */}
      {showHistoryModal && (
        <HistoryModal
          history={historyData}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default CategoryPage;

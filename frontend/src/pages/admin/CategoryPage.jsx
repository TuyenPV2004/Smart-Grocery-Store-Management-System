import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiFolder,
  FiInfo,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import categoryService from "../../services/categoryService";
import HistoryModal from "../../components/HistoryModal";
import {
  AdminHeader,
  AdminIconButton,
  AdminModal,
  AdminPage,
  AdminSectionTitle,
  AdminTableCard,
  Button,
} from "../../components/admin/AdminUi";

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  parentId: "",
  label: "",
  labelColor: "#15803d",
};

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        categoryService.getTree(),
        categoryService.getFlat(),
      ]);
      setCategories(treeRes.data || []);
      setFlatCategories(flatRes.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Unable to load categories.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNameChange = (event) => {
    const name = event.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, name, slug: !prev.id ? slug : prev.slug }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      parent: formData.parentId ? { id: formData.parentId } : null,
    };

    try {
      if (formData.id) {
        await categoryService.update(formData.id, payload);
        toast.success("Category updated.");
      } else {
        await categoryService.create(payload);
        toast.success("Category created.");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || "Unable to save category.");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete category?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await categoryService.delete(id);
      fetchData();
      toast.success("Category deleted.");
    } catch (error) {
      toast.error(error.response?.data || "Unable to delete category.");
    }
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parent ? category.parent.id : "",
      label: category.label || "",
      labelColor: category.labelColor || "#15803d",
    });
    setShowModal(true);
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await categoryService.getHistory(id);
      setHistoryData(res.data || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Failed to load category history:", error);
      toast.error("Unable to load history.");
    }
  };

  const CategoryRow = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[category.id];

    return (
      <>
        <tr>
          <td className="whitespace-nowrap px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 28}px` }}>
              {hasChildren ? (
                <AdminIconButton
                  onClick={() => toggleExpand(category.id)}
                  aria-label={isExpanded ? "Collapse category" : "Expand category"}
                  className="mr-1 h-9 w-9"
                >
                  {isExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                </AdminIconButton>
              ) : (
                <span className="mr-1 h-9 w-9" />
              )}
              <FiFolder className="mr-3 text-amber-500" size={18} />
              <span className="text-sm font-medium text-slate-900">{category.name}</span>
            </div>
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
            {category.slug || "---"}
          </td>
          <td className="whitespace-nowrap px-6 py-4">
            {category.label ? (
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: category.labelColor || "#15803d" }}
              >
                {category.label}
              </span>
            ) : (
              <span className="text-sm text-slate-400">---</span>
            )}
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-right">
            <AdminIconButton onClick={() => handleViewHistory(category.id)} aria-label="View history">
              <FiInfo size={18} />
            </AdminIconButton>
            <AdminIconButton onClick={() => openEdit(category)} tone="emerald" aria-label="Edit category">
              <FiEdit2 size={18} />
            </AdminIconButton>
            <AdminIconButton onClick={() => handleDelete(category.id)} tone="rose" aria-label="Delete category">
              <FiTrash2 size={18} />
            </AdminIconButton>
          </td>
        </tr>
        {isExpanded
          ? category.children.map((child) => (
              <CategoryRow key={child.id} category={child} level={level + 1} />
            ))
          : null}
      </>
    );
  };

  return (
    <AdminPage>
      <AdminHeader
        title="Product Categories"
        description="Manage the category tree, label previews, and product grouping structure."
        actions={
          <Button onClick={openCreate}>
            <FiPlus size={18} />
            Add Category
          </Button>
        }
      />

      <AdminTableCard>
        <table>
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Category</th>
              <th className="px-6 py-4 text-left">Slug</th>
              <th className="px-6 py-4 text-left">Label</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.length ? (
              categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-12 text-center text-sm font-medium text-slate-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {showModal ? (
        <AdminModal
          title={formData.id ? "Edit Category" : "Create Category"}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="muted" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" form="category-form">
                {formData.id ? "Save Changes" : "Create Category"}
              </Button>
            </>
          }
        >
          <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
            <AdminSectionTitle>Basic Information</AdminSectionTitle>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Category name</span>
              <input
                required
                className="ui-input w-full"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Fresh vegetables"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Label text</span>
                <input
                  className="ui-input w-full"
                  value={formData.label}
                  onChange={(event) => setFormData({ ...formData, label: event.target.value })}
                  placeholder="Fresh"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Label color</span>
                <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    type="color"
                    className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0.5"
                    value={formData.labelColor}
                    onChange={(event) =>
                      setFormData({ ...formData, labelColor: event.target.value })
                    }
                  />
                  <span className="text-xs font-medium text-slate-500">{formData.labelColor}</span>
                </span>
              </label>
            </div>

            {formData.label ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium">Preview</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: formData.labelColor }}
                >
                  {formData.label}
                </span>
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Parent category</span>
              <select
                className="ui-input w-full"
                value={formData.parentId}
                onChange={(event) => setFormData({ ...formData, parentId: event.target.value })}
              >
                <option value="">Root category</option>
                {flatCategories
                  .filter((category) => category.id !== formData.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                rows="3"
                className="ui-input min-h-[96px] w-full resize-none"
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="Short category description"
              />
            </label>
          </form>
        </AdminModal>
      ) : null}

      {showHistoryModal ? (
        <HistoryModal history={historyData} onClose={() => setShowHistoryModal(false)} />
      ) : null}
    </AdminPage>
  );
};

export default CategoryPage;

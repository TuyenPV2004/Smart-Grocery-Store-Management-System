import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiChevronDown,
  FiChevronRight,
  FiFolder,
  FiInfo,
  FiMoreHorizontal,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaEdit, FaFolder, FaTag, FaBookmark, FaPalette, FaFolderOpen, FaStickyNote } from "react-icons/fa";
import categoryService from "../../services/categoryService";
import HistoryModal from "../../components/HistoryModal";
import AdminTopbar from "../../components/admin/AdminTopbar";
import {
  AdminIconButton,
  AdminModal,
  AdminPage,
  AdminSectionTitle,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenu, setActionMenu] = useState(null);

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

  useEffect(() => {
    if (!actionMenu) return undefined;

    const closeMenu = () => setActionMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

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

  const openActionMenu = (event, category) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 124;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.category?.id === category.id
        ? null
        : {
            category,
            x: rect.left + rect.width / 2,
            y: shouldOpenUpward ? rect.top - gap : rect.bottom + gap,
            placement: shouldOpenUpward ? "top" : "bottom",
          },
    );
  };

  const runAction = (callback) => {
    setActionMenu(null);
    callback();
  };

  const filterCategoryTree = (items, keyword) => {
    if (!keyword) return items;

    return items
      .map((category) => {
        const children = filterCategoryTree(category.children || [], keyword);
        const matches =
          category.name?.toLowerCase().includes(keyword) ||
          category.slug?.toLowerCase().includes(keyword) ||
          category.label?.toLowerCase().includes(keyword) ||
          category.description?.toLowerCase().includes(keyword);

        return matches || children.length ? { ...category, children } : null;
      })
      .filter(Boolean);
  };

  const visibleCategories = filterCategoryTree(categories, searchTerm.toLowerCase());

  const CategoryRow = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[category.id];

    return (
      <>
        <tr className="product-inventory-row transition-colors">
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
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(event) => openActionMenu(event, category)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Actions"
              >
                <FiMoreHorizontal size={20} />
              </button>
            </div>
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
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">
            Category Catalog
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search categories by name, slug, label, or description
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                Category Tree
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded({})}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
              >
                Collapse all
              </button>
              <button
                type="button"
                onClick={() =>
                  setExpanded(
                    flatCategories.reduce((acc, category) => {
                      acc[category.id] = true;
                      return acc;
                    }, {}),
                  )
                }
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200"
              >
                Expand all
              </button>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search..."
                  className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-11 pr-11 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-slate-50"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-red-500 transition-colors hover:text-red-700"
                    aria-label="Clear search"
                  >
                    <FiX size={15} />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="whitespace-nowrap rounded-full bg-green-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-green-700"
              >
                Add category
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Category</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Slug</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Label</th>
                <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleCategories.length ? (
              visibleCategories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))
            ) : (
              <tr className="product-empty-row bg-white">
                <td colSpan="4" className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FiFolder className="mb-4 text-slate-950" size={30} />
                    <h4 className="text-base font-medium text-slate-900">
                      No matching categories
                    </h4>
                    <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                      Try changing the search keyword.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {actionMenu ? (
        <div
          className={`fixed z-[80] !w-44 -translate-x-[calc(100%-1.25rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(100,116,139,0.22)] ring-1 ring-slate-300/45 ${
            actionMenu.placement === "top" ? "-translate-y-full" : ""
          }`}
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => runAction(() => openEdit(actionMenu.category))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Edit"
          >
            <FaEdit className="text-indigo-600" size={18} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleViewHistory(actionMenu.category.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="History"
          >
            <FiInfo className="text-blue-500" size={19} />
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDelete(actionMenu.category.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Delete"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      {showModal ? (
        <AdminModal
          title={
            <div className="flex items-center justify-center gap-2.5 w-full pr-8">
              <FaFolder className="text-green-600" size={26} />
              <h2 className="text-xl font-medium text-slate-900 leading-none">
                {formData.id ? "Edit Category" : "Create Category"}
              </h2>
            </div>
          }
          onClose={() => setShowModal(false)}
          footer={
            <Button type="submit" form="category-form" className="w-full sm:w-auto">
              {formData.id ? "Save Changes" : "Create Category"}
            </Button>
          }
        >
          <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-[#DFEBDF] border border-[#DFEBDF]/50 rounded-2xl p-5 shadow-sm space-y-5">
              <label className="block space-y-2">
                <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
                  <FaTag className="text-emerald-700" size={16} />
                  <span>Category name</span>
                </div>
                <input
                  required
                  className="ui-input w-full"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Fresh vegetables"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
                    <FaBookmark className="text-emerald-700" size={16} />
                    <span>Label text</span>
                  </div>
                  <input
                    className="ui-input w-full"
                    value={formData.label}
                    onChange={(event) => setFormData({ ...formData, label: event.target.value })}
                    placeholder="Fresh"
                  />
                </label>
                <label className="block space-y-2">
                  <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
                    <FaPalette className="text-emerald-700" size={16} />
                    <span>Label color</span>
                  </div>
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

              <label className="block space-y-2">
                <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
                  <FaFolderOpen className="text-emerald-700" size={16} />
                  <span>Parent category</span>
                </div>
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

              <label className="block space-y-2">
                <div className="flex items-center gap-2 text-[16px] font-medium text-slate-900 ml-1">
                  <FaStickyNote className="text-emerald-700" size={16} />
                  <span>Description</span>
                </div>
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
            </div>
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

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  FiChevronDown,
  FiChevronRight,
  FiCamera,
  FiFolder,
  FiHome,
  FiImage,
  FiInfo,
  FiLoader,
  FiMoreHorizontal,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaEdit, FaFolder, FaTag, FaBookmark, FaPalette, FaFolderOpen, FaStickyNote } from "react-icons/fa";
import categoryService from "../../services/categoryService";
import { getImageUrl } from "../../utils/imageUrl";
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
  color: "#DDEFD8",
  imageUrl: "",
  homeFeatured: false,
  homeDisplayOrder: "",
  status: "ACTIVE",
};

const MAX_CATEGORY_IMAGE_SIZE = 20 * 1024 * 1024;

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenu, setActionMenu] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedHomeCount = flatCategories.filter((category) => category.homeFeatured).length;
  const isRootCategoryForm = !formData.parentId;

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

  const handleImageChange = (event) => {
    if (formData.parentId) {
      event.target.value = "";
      setCategoryImageFile(null);
      setImagePreview("");
      return;
    }

    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_CATEGORY_IMAGE_SIZE) {
      event.target.value = "";
      setCategoryImageFile(null);
      setImagePreview(getImageUrl(formData.imageUrl, ""));
      toast.error("Category image must be 20MB or smaller.");
      return;
    }

    setCategoryImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : getImageUrl(formData.imageUrl, ""));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const isRootCategory = !formData.parentId;
    const nextHomeFeatured = isRootCategory && Boolean(formData.homeFeatured);
    const isNewHomeSelection = nextHomeFeatured && !flatCategories.some(
      (category) => category.id === formData.id && category.homeFeatured,
    );
    if (isNewHomeSelection && selectedHomeCount >= 5) {
      toast.warning("Only 5 categories can be shown on the home page.");
      return;
    }

    const payload = {
      ...formData,
      imageUrl: formData.parentId ? "" : formData.imageUrl,
      homeFeatured: nextHomeFeatured,
      homeDisplayOrder:
        !isRootCategory || formData.homeDisplayOrder === "" || formData.homeDisplayOrder == null
          ? null
          : Number(formData.homeDisplayOrder),
      parent: formData.parentId ? { id: formData.parentId } : null,
    };

    try {
      setIsSaving(true);
      setActionMenu(null);
      if (formData.id) {
        await categoryService.update(formData.id, payload, formData.parentId ? null : categoryImageFile);
        toast.success("Category updated.");
      } else {
        await categoryService.create(payload, formData.parentId ? null : categoryImageFile);
        toast.success("Category created.");
      }
      setShowModal(false);
      setCategoryImageFile(null);
      setImagePreview("");
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data || "Unable to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHomeFeatured = async (category, parentId = "") => {
    const nextHomeFeatured = !category.homeFeatured;
    if (nextHomeFeatured && selectedHomeCount >= 5) {
      toast.warning("Only 5 categories can be shown on the home page.");
      return;
    }

    try {
      await categoryService.update(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        status: category.status || "ACTIVE",
        label: category.label || "",
        labelColor: category.labelColor || "#15803d",
        color: category.color || category.labelColor || "#DDEFD8",
        imageUrl: category.imageUrl || "",
        homeFeatured: nextHomeFeatured,
        homeDisplayOrder: nextHomeFeatured ? category.homeDisplayOrder ?? selectedHomeCount + 1 : category.homeDisplayOrder ?? null,
        parent: category.parent ? { id: category.parent.id } : parentId ? { id: parentId } : null,
      });
      toast.success(nextHomeFeatured ? "Category added to home page." : "Category removed from home page.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || "Unable to update home categories.");
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
    setCategoryImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (category, parentId = "") => {
    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parent ? category.parent.id : parentId,
      label: category.label || "",
      labelColor: category.labelColor || "#15803d",
      color: category.color || category.labelColor || "#DDEFD8",
      imageUrl: category.imageUrl || "",
      homeFeatured: Boolean(category.homeFeatured),
      homeDisplayOrder: category.homeDisplayOrder ?? "",
      status: category.status || "ACTIVE",
    });
    setCategoryImageFile(null);
    setImagePreview(getImageUrl(category.imageUrl, ""));
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

  const openActionMenu = (event, category, parentId = "") => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 176;
    const menuEstimatedHeight = 132;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;
    const x = Math.min(
      Math.max(12, rect.right - menuWidth),
      window.innerWidth - menuWidth - 12,
    );
    const y = shouldOpenUpward
      ? Math.max(12, rect.top - gap - menuEstimatedHeight)
      : Math.min(rect.bottom + gap, window.innerHeight - menuEstimatedHeight - 12);

    setActionMenu((current) =>
      current?.category?.id === category.id
        ? null
        : {
            category,
            parentId,
            x,
            y,
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

  const CategoryRow = ({ category, level = 0, parentId = "" }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[category.id];
    const isRootCategory = level === 0;
    const categoryImageSrc = getImageUrl(category.imageUrl);

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
              {isRootCategory ? (
                <span className="mr-4 flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {categoryImageSrc ? (
                    <PhotoView src={categoryImageSrc}>
                      <img
                        src={categoryImageSrc}
                        alt={category.name}
                        className="h-full w-full cursor-zoom-in object-cover"
                      />
                    </PhotoView>
                  ) : (
                    <FiImage className="text-slate-400" size={24} />
                  )}
                </span>
              ) : (
                <FiFolder className="mr-3 text-amber-500" size={18} />
              )}
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
          <td className="whitespace-nowrap px-6 py-4">
            {isRootCategory ? (
              <button
                type="button"
                onClick={() => handleToggleHomeFeatured(category, parentId)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category.homeFeatured
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title="Toggle home category"
              >
                <FiHome size={14} />
                {category.homeFeatured ? `Home #${category.homeDisplayOrder ?? "-"}` : "Hidden"}
              </button>
            ) : (
              <span className="text-sm font-medium text-slate-400">---</span>
            )}
          </td>
          <td className="whitespace-nowrap px-6 py-4 text-right">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(event) => openActionMenu(event, category, parentId)}
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
              <CategoryRow key={child.id} category={child} level={level + 1} parentId={category.id} />
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
              <p className="mt-1 text-sm font-medium text-slate-500">
                Home categories selected: {selectedHomeCount}/5
              </p>
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

        <PhotoProvider>
        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Category</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Slug</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Label</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Home</th>
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
                <td colSpan="5" className="px-6 py-14">
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
        </PhotoProvider>
      </div>

      {actionMenu ? createPortal(
        <div
          className="fixed z-[10000] w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(100,116,139,0.22)] ring-1 ring-slate-300/45"
          style={{ left: actionMenu.x, top: actionMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => runAction(() => openEdit(actionMenu.category, actionMenu.parentId))}
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
        </div>,
        document.body,
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
            <Button
              type="submit"
              form="category-form"
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                formData.id ? "Save Changes" : "Create Category"
              )}
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
                <div className="flex min-h-[46px] items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {isRootCategoryForm ? (
                    <span className="group relative flex h-[46px] w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden border-r border-slate-200 bg-white">
                      {imagePreview || formData.imageUrl ? (
                        <img
                          src={imagePreview || getImageUrl(formData.imageUrl)}
                          alt={formData.name || "Category preview"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiImage className="text-slate-400" size={22} />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white transition-colors group-hover:bg-slate-950/45">
                        <FiCamera className="opacity-0 transition-opacity group-hover:opacity-100" size={22} />
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </span>
                  ) : null}
                  <input
                    required
                    className="min-h-[46px] min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Fresh vegetables"
                  />
                </div>
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

              {isRootCategoryForm ? (
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[160px_220px_minmax(0,1fr)] md:items-end">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Display order</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="ui-input w-full"
                      value={formData.homeDisplayOrder}
                      onChange={(event) =>
                        setFormData({ ...formData, homeDisplayOrder: event.target.value })
                      }
                      placeholder="1"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Home card color</span>
                    <span className="flex min-h-[46px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-1.5">
                      <input
                        type="color"
                        className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0.5"
                        value={formData.color}
                        onChange={(event) =>
                          setFormData({ ...formData, color: event.target.value })
                        }
                      />
                      <span className="text-xs font-medium text-slate-500">{formData.color}</span>
                    </span>
                  </label>
                  <label className="flex min-h-[46px] items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-emerald-700"
                      checked={formData.homeFeatured}
                      onChange={(event) =>
                        setFormData({ ...formData, homeFeatured: event.target.checked })
                      }
                    />
                    <span>Show on Home</span>
                  </label>
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
                  onChange={(event) => {
                    const parentId = event.target.value;
                    setFormData({
                      ...formData,
                      parentId,
                      imageUrl: parentId ? "" : formData.imageUrl,
                    });
                    if (parentId) {
                      setCategoryImageFile(null);
                      setImagePreview("");
                    }
                  }}
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

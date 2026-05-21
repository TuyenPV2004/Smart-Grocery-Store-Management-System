import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiInfo,
  FiMoreHorizontal,
  FiImage,
  FiPower,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaBuildingUser } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { RiMapPin2Fill } from "react-icons/ri";
import supplierService from "../../services/supplierService";
import productService from "../../services/productService";
import { getImageUrl } from "../../utils/imageUrl";
import AdminTopbar from "../../components/admin/AdminTopbar";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  AdminModal,
  AdminPage,
  AdminSectionTitle,
  Button,
} from "../../components/admin/AdminUi";

const initialForm = {
  vietnameseName: "",
  englishName: "",
  tradingName: "",
  brand: "",
  phone: "",
  email: "",
  address: "",
  logoUrl: "",
  taxCode: "",
  note: "",
};

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionMenu, setActionMenu] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data || []);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error("Unable to load suppliers.");
    }
  };

  useEffect(() => {
    fetchSuppliers();
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

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setLogoFile(null);
    setLogoPreview("");
    setFormData(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isEditing) {
        await supplierService.update(selectedId, formData, logoFile);
        toast.success("Supplier updated.");
      } else {
        await supplierService.create(formData, logoFile);
        toast.success("Supplier created.");
      }
      fetchSuppliers();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data || "Unable to save supplier.");
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      vietnameseName: supplier.vietnameseName || "",
      englishName: supplier.englishName || "",
      tradingName: supplier.tradingName || "",
      brand: supplier.brand || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      logoUrl: supplier.logoUrl || supplier.logo_url || "",
      taxCode: supplier.taxCode || "",
      note: supplier.note || "",
    });
    setLogoFile(null);
    setLogoPreview(supplier.logoUrl || supplier.logo_url ? getImageUrl(supplier.logoUrl || supplier.logo_url) : "");
    setSelectedId(supplier.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleToggleStatus = async (id) => {
    const result = await Swal.fire({
      title: "Change supplier status?",
      text: "This will update the supplier availability for operations.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#15803d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await supplierService.toggleStatus(id);
    fetchSuppliers();
  };

  const handleViewProducts = async (supplier) => {
    setShowProductsModal(true);
    setSelectedSupplierName(supplier.tradingName || supplier.vietnameseName || supplier.code);
    setIsLoadingProducts(true);
    setSupplierProducts([]);

    try {
      const res = await productService.getAll();
      const productsOfSupplier = (res.data || []).filter(
        (product) => product?.supplier?.id === supplier.id,
      );
      setSupplierProducts(productsOfSupplier);
    } catch {
      toast.error("Unable to load supplier products.");
      setShowProductsModal(false);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    const result = await Swal.fire({
      title: "Delete supplier?",
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
      await supplierService.delete(id);
      toast.success("Supplier deleted.");
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data || "Unable to delete supplier.");
    }
  };

  const openActionMenu = (event, supplier) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 164;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.supplier?.id === supplier.id
        ? null
        : {
            supplier,
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

  const filteredSuppliers = suppliers.filter((supplier) => {
    const keyword = searchTerm.toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && supplier.active) ||
      (statusFilter === "INACTIVE" && !supplier.active);
    const matchesSearch =
      !keyword ||
      supplier.vietnameseName?.toLowerCase().includes(keyword) ||
      supplier.tradingName?.toLowerCase().includes(keyword) ||
      supplier.englishName?.toLowerCase().includes(keyword) ||
      supplier.email?.toLowerCase().includes(keyword) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.code?.toLowerCase().includes(keyword);

    return matchesStatus && matchesSearch;
  });

  const getSupplierStatusCount = (status) => {
    if (status === "ALL") return suppliers.length;
    if (status === "ACTIVE") return suppliers.filter((supplier) => supplier.active).length;
    return suppliers.filter((supplier) => !supplier.active).length;
  };

  return (
    <AdminPage>
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">
            Supplier Catalog
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search suppliers by company, trading name, phone, email, or code
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">
                Supplier Directory
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: "All" },
                { id: "ACTIVE", label: "Active" },
                { id: "INACTIVE", label: "Inactive" },
              ].map((item) => {
                const isActive = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label} {getSupplierStatusCount(item.id)}
                  </button>
                );
              })}
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
                onClick={() => setShowModal(true)}
                className="whitespace-nowrap rounded-full bg-green-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-green-700"
              >
                Add supplier
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <PhotoProvider>
            <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">
                  Supplier Name
                </th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">
                  Code
                </th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">
                  Contact
                </th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">
                  Brand
                </th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSuppliers.length === 0 ? (
                <tr className="product-empty-row bg-white">
                  <td colSpan="6" className="px-6 py-14">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FiInfo className="mb-4 text-slate-950" size={30} />
                      <h4 className="text-base font-medium text-slate-900">
                        No matching suppliers
                      </h4>
                      <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                        Try changing the status filter or search keyword.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className={`product-inventory-row transition-colors ${!supplier.active ? "opacity-70" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-[280px] items-center">
                        {supplier.logoUrl || supplier.logo_url ? (
                          <div className="flex h-12 w-24 shrink-0 items-center justify-center">
                            <PhotoView src={getImageUrl(supplier.logoUrl || supplier.logo_url)}>
                              <img
                                src={getImageUrl(supplier.logoUrl || supplier.logo_url)}
                                alt={supplier.tradingName || supplier.vietnameseName || "Supplier logo"}
                                className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-80 transition-all active:scale-95"
                              />
                            </PhotoView>
                          </div>
                        ) : (
                          <div className="flex h-12 w-24 shrink-0 items-center justify-start">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                              {(supplier.tradingName || supplier.vietnameseName || "?").slice(0, 1).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className="ml-3 min-w-0">
                          <div className="line-clamp-1 text-sm font-medium uppercase leading-tight text-slate-900">
                            {supplier.tradingName || supplier.vietnameseName}
                          </div>
                          <div className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                            {supplier.englishName || supplier.vietnameseName || "---"}
                          </div>
                          <div className="mt-1 flex items-start gap-1.5 text-sm font-medium text-slate-500">
                            <RiMapPin2Fill className="mt-0.5 shrink-0 text-emerald-700" size={14} />
                            <span className="line-clamp-1">{supplier.address || "---"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {supplier.code || "---"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="min-w-[220px] space-y-1 text-sm font-medium text-slate-700">
                        <InfoLine icon={FaPhoneAlt} value={supplier.phone || "---"} />
                        <InfoLine icon={MdEmail} value={supplier.email || "---"} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {supplier.brand || "---"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[11px] font-medium shadow-sm ${
                          supplier.active
                            ? "border-green-700 bg-green-600 text-white"
                            : "border-gray-600 bg-gray-500 text-white"
                        }`}
                      >
                        {supplier.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(event) => openActionMenu(event, supplier)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          title="Actions"
                        >
                          <FiMoreHorizontal size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </PhotoProvider>
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
            onClick={() => runAction(() => handleEdit(actionMenu.supplier))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Edit"
          >
            <FaEdit className="text-indigo-600" size={18} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleViewProducts(actionMenu.supplier))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="View products"
          >
            <FiInfo className="text-blue-500" size={19} />
            <span>Products</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleToggleStatus(actionMenu.supplier.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Toggle status"
          >
            <FiPower className={actionMenu.supplier.active ? "text-amber-600" : "text-emerald-600"} size={18} />
            <span>{actionMenu.supplier.active ? "Deactivate" : "Activate"}</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDeleteSupplier(actionMenu.supplier.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            title="Delete"
          >
            <FiTrash2 className="text-red-600" size={18} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}

      {showModal
        ? createPortal(
            <AdminModal
              title={
                <div className="flex items-center justify-center gap-2.5 w-full pr-8">
                  <FaBuildingUser className="text-green-600" size={26} />
                  <h2 className="text-xl font-medium text-slate-900 leading-none">
                    {isEditing ? "Edit Supplier" : "Add Supplier"}
                  </h2>
                </div>
              }
              onClose={closeModal}
              className="max-w-3xl"
              footer={
                <>
                  <Button type="submit" form="supplier-form">
                    Save Supplier
                  </Button>
                </>
              }
            >
              <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Company
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center">
                    <div className="relative group h-28 w-28 shrink-0 bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-green-400 transition-all flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Supplier logo preview" className="h-full w-full object-contain p-2" />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <FiImage size={28} className="mb-1" />
                          <span className="text-[10px] font-medium">Upload Logo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleLogoChange}
                      />
                      {logoPreview && (
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                          <FiImage className="text-white" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-medium text-slate-900">Supplier logo</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Click on the image box to upload or change the square logo.
                      </p>
                       <p className="text-xs text-slate-400 mt-1 font-medium">
                        Supported formats: png, jpg, gif
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Trading name" value={formData.tradingName} onChange={(value) => setFormData({ ...formData, tradingName: value })} />
                    <Field label="Brand" value={formData.brand} onChange={(value) => setFormData({ ...formData, brand: value })} />
                  </div>
                  <Field required label="Local company name" value={formData.vietnameseName} onChange={(value) => setFormData({ ...formData, vietnameseName: value })} />
                  <Field label="English company name" value={formData.englishName} onChange={(value) => setFormData({ ...formData, englishName: value })} />
                </section>

                <section className="space-y-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Contact
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field required label="Phone" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} />
                    <Field label="Tax code" value={formData.taxCode} onChange={(value) => setFormData({ ...formData, taxCode: value })} />
                  </div>
                  <Field label="Email" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} />
                  <Field label="Address" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} />
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Notes</span>
                    <textarea
                      className="ui-input min-h-[120px] w-full resize-none"
                      value={formData.note}
                      onChange={(event) => setFormData({ ...formData, note: event.target.value })}
                      placeholder="Short supplier notes"
                    />
                  </label>
                </section>
              </form>
            </AdminModal>,
            document.body,
          )
        : null}

      {showProductsModal
        ? createPortal(
            <AdminModal
              title="Supplier Products"
              onClose={() => setShowProductsModal(false)}
              className="max-w-3xl"
            >
              <p className="mb-5 text-sm font-medium text-slate-500">
                Supplier: {selectedSupplierName}
              </p>
              {isLoadingProducts ? (
                <p className="text-sm text-slate-500">Loading products</p>
              ) : supplierProducts.length === 0 ? (
                <p className="text-sm text-slate-500">This supplier has no linked products.</p>
              ) : (
                <div className="space-y-3">
                  {supplierProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      {product.thumbnail ? (
                        <img
                          src={getImageUrl(product.thumbnail)}
                          alt={product.name}
                          className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-500">
                          No Img
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{product.sku}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminModal>,
            document.body,
          )
        : null}
    </AdminPage>
  );
};

const InfoLine = ({ icon: Icon, value }) => (
  <div className="flex items-start gap-2">
    {React.createElement(Icon, {
      className: "mt-0.5 shrink-0 text-emerald-700",
      size: 14,
    })}
    <span className="line-clamp-2">{value}</span>
  </div>
);

const Field = ({ label, value, onChange, type = "text", required = false }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      required={required}
      type={type}
      className="ui-input w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export default SupplierPage;

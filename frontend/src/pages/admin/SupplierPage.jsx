import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  FiEdit2,
  FiInfo,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiPower,
  FiTrash2,
} from "react-icons/fi";
import supplierService from "../../services/supplierService";
import productService from "../../services/productService";
import { getImageUrl } from "../../utils/imageUrl";
import {
  AdminHeader,
  AdminIconButton,
  AdminModal,
  AdminPage,
  AdminSearchInput,
  AdminSectionTitle,
  Button,
  SurfaceCard,
} from "../../components/admin/AdminUi";
import { StatusBadge } from "../../components/ui";

const initialForm = {
  vietnameseName: "",
  englishName: "",
  tradingName: "",
  brand: "",
  phone: "",
  email: "",
  address: "",
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
  const [selectedId, setSelectedId] = useState(null);

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

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isEditing) {
        await supplierService.update(selectedId, formData);
        toast.success("Supplier updated.");
      } else {
        await supplierService.create(formData);
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
      taxCode: supplier.taxCode || "",
      note: supplier.note || "",
    });
    setSelectedId(supplier.id);
    setIsEditing(true);
    setShowModal(true);
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

  const filteredSuppliers = suppliers.filter((supplier) => {
    const keyword = searchTerm.toLowerCase();
    return (
      supplier.vietnameseName?.toLowerCase().includes(keyword) ||
      supplier.tradingName?.toLowerCase().includes(keyword) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.code?.toLowerCase().includes(keyword)
    );
  });

  return (
    <AdminPage>
      <AdminHeader
        title="Suppliers"
        description="Create suppliers, manage contact details, and review linked products."
        actions={
          <Button onClick={() => setShowModal(true)}>
            <FiPlus size={18} />
            Add Supplier
          </Button>
        }
      />

      <SurfaceCard className="p-4">
        <AdminSearchInput
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by company, trading name, phone, or code"
          className="sm:max-w-xl"
        />
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredSuppliers.map((supplier) => (
          <SurfaceCard
            key={supplier.id}
            className={`flex min-h-[260px] flex-col p-5 ${!supplier.active ? "opacity-70" : ""}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusBadge tone={supplier.active ? "emerald" : "slate"}>
                  {supplier.active ? "Active" : "Inactive"}
                </StatusBadge>
                <h3 className="mt-3 line-clamp-2 text-lg font-semibold uppercase text-slate-950">
                  {supplier.tradingName || supplier.vietnameseName}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {supplier.code || "No code"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <AdminIconButton onClick={() => handleEdit(supplier)} tone="emerald" aria-label="Edit supplier">
                  <FiEdit2 size={16} />
                </AdminIconButton>
                <AdminIconButton onClick={() => handleViewProducts(supplier)} tone="blue" aria-label="View products">
                  <FiInfo size={16} />
                </AdminIconButton>
              </div>
            </div>

            {supplier.brand ? (
              <span className="mb-4 inline-flex w-fit rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Brand: {supplier.brand}
              </span>
            ) : null}

            <div className="mt-auto space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <InfoLine icon={FiPhone} value={supplier.phone} />
              <InfoLine icon={FiMail} value={supplier.email || "---"} />
              <InfoLine icon={FiMapPin} value={supplier.address || "---"} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">
                Tax code: {supplier.taxCode || "---"}
              </span>
              <div className="flex items-center gap-1">
                <AdminIconButton onClick={() => handleToggleStatus(supplier.id)} tone={supplier.active ? "amber" : "emerald"} aria-label="Toggle supplier status">
                  <FiPower size={16} />
                </AdminIconButton>
                <AdminIconButton onClick={() => handleDeleteSupplier(supplier.id)} tone="rose" aria-label="Delete supplier">
                  <FiTrash2 size={16} />
                </AdminIconButton>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {filteredSuppliers.length === 0 ? (
        <SurfaceCard className="py-12 text-center text-sm font-medium text-slate-500">
          No suppliers found.
        </SurfaceCard>
      ) : null}

      {showModal ? (
        <AdminModal
          title={isEditing ? "Edit Supplier" : "Add Supplier"}
          onClose={closeModal}
          className="max-w-3xl"
          footer={
            <>
              <Button variant="muted" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" form="supplier-form">
                Save Supplier
              </Button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <AdminSectionTitle>Company</AdminSectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Trading name" value={formData.tradingName} onChange={(value) => setFormData({ ...formData, tradingName: value })} />
                <Field label="Brand" value={formData.brand} onChange={(value) => setFormData({ ...formData, brand: value })} />
              </div>
              <Field required label="Local company name" value={formData.vietnameseName} onChange={(value) => setFormData({ ...formData, vietnameseName: value })} />
              <Field label="English company name" value={formData.englishName} onChange={(value) => setFormData({ ...formData, englishName: value })} />
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <AdminSectionTitle>Contact</AdminSectionTitle>
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
        </AdminModal>
      ) : null}

      {showProductsModal ? (
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
        </AdminModal>
      ) : null}
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

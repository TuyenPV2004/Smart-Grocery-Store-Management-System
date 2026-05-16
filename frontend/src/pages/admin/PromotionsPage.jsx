import { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiEdit2, FiInfo, FiPlus, FiTag, FiTrash2 } from "react-icons/fi";
import promotionService from "../../services/promotionService";
import productService from "../../services/productService";
import { getImageUrl } from "../../utils/imageUrl";
import {
  AdminHeader,
  AdminIconButton,
  AdminModal,
  AdminPage,
  AdminSectionTitle,
  AdminTableCard,
  Button,
} from "../../components/admin/AdminUi";
import { StatusBadge } from "../../components/ui";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
  productIds: [],
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatDate = (value) => (value ? moment(value).utc().format("DD MMM YYYY HH:mm") : "---");

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const res = await promotionService.getAll();
      setPromotions(res.data || []);
    } catch (error) {
      console.error("Failed to load promotions:", error);
      toast.error("Unable to load promotions.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data?.content || res.data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Unable to load products.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductToggle = (productId) => {
    setFormData((prev) => {
      const isSelected = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: isSelected
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        promotion: {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        },
        productIds: formData.productIds,
      };

      if (formData.id) {
        await promotionService.update(formData.id, payload);
        toast.success("Promotion updated.");
      } else {
        await promotionService.create(payload);
        toast.success("Promotion created.");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to save promotion.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete promotion?",
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
      await promotionService.delete(id);
      toast.success("Promotion deleted.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to delete promotion.");
    }
  };

  const openEdit = (promotion) => {
    setFormData({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description || "",
      discountType: promotion.discountType || "PERCENTAGE",
      discountValue: promotion.discountValue || "",
      startDate: promotion.startDate ? moment(promotion.startDate).utc().format("YYYY-MM-DDTHH:mm") : "",
      endDate: promotion.endDate ? moment(promotion.endDate).utc().format("YYYY-MM-DDTHH:mm") : "",
      status: promotion.status || "ACTIVE",
      productIds: promotion.products ? promotion.products.map((product) => product.id) : [],
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setShowModal(true);
  };

  return (
    <AdminPage>
      <AdminHeader
        title="Promotions"
        description="Create product-level campaigns and choose eligible products."
        actions={
          <Button onClick={openCreate}>
            <FiPlus size={18} />
            Add Promotion
          </Button>
        }
      />

      <AdminTableCard>
        <table>
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Campaign</th>
              <th className="px-6 py-4 text-left">Discount</th>
              <th className="px-6 py-4 text-left">Start</th>
              <th className="px-6 py-4 text-left">End</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.length ? (
              promotions.map((promotion) => (
                <tr key={promotion.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{promotion.name}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {promotion.description || "No description"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                      {promotion.discountType === "PERCENTAGE"
                        ? `${promotion.discountValue}%`
                        : formatMoney(promotion.discountValue)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {formatDate(promotion.startDate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {formatDate(promotion.endDate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <StatusBadge tone={promotion.status === "ACTIVE" ? "emerald" : "slate"}>
                      {promotion.status === "ACTIVE" ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <AdminIconButton
                      onClick={() => {
                        setSelectedPromo(promotion);
                        setShowDetailModal(true);
                      }}
                      tone="blue"
                      aria-label="View promotion"
                    >
                      <FiInfo size={18} />
                    </AdminIconButton>
                    <AdminIconButton onClick={() => openEdit(promotion)} tone="emerald" aria-label="Edit promotion">
                      <FiEdit2 size={18} />
                    </AdminIconButton>
                    <AdminIconButton onClick={() => handleDelete(promotion.id)} tone="rose" aria-label="Delete promotion">
                      <FiTrash2 size={18} />
                    </AdminIconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-sm font-medium text-slate-500">
                  No promotions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {showModal ? (
        <AdminModal
          title={formData.id ? "Edit Promotion" : "Create Promotion"}
          onClose={() => setShowModal(false)}
          className="max-w-3xl"
          footer={
            <>
              <Button variant="muted" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" form="promotion-form" disabled={loading}>
                {loading ? "Saving..." : formData.id ? "Save Changes" : "Create Promotion"}
              </Button>
            </>
          }
        >
          <form id="promotion-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <AdminSectionTitle>Campaign</AdminSectionTitle>
              <Field required label="Campaign name" name="name" value={formData.name} onChange={handleChange} />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  rows="3"
                  name="description"
                  className="ui-input min-h-[96px] w-full resize-none"
                  value={formData.description}
                  onChange={handleChange}
                />
              </label>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <AdminSectionTitle>Discount</AdminSectionTitle>
                <SelectField label="Discount type" name="discountType" value={formData.discountType} onChange={handleChange}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                </SelectField>
                <Field required type="number" label="Discount value" name="discountValue" value={formData.discountValue} onChange={handleChange} />
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <AdminSectionTitle>Schedule</AdminSectionTitle>
                <Field required type="datetime-local" label="Start date" name="startDate" value={formData.startDate} onChange={handleChange} />
                <Field required type="datetime-local" label="End date" name="endDate" value={formData.endDate} onChange={handleChange} />
                <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">Active</span>
                  <input
                    type="checkbox"
                    checked={formData.status === "ACTIVE"}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: event.target.checked ? "ACTIVE" : "INACTIVE",
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <AdminSectionTitle>Products</AdminSectionTitle>
                <span className="text-xs font-medium text-slate-500">
                  {formData.productIds.length} selected
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white">
                {products.length ? (
                  products.map((product) => (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-emerald-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                      />
                      {product.thumbnail ? (
                        <img
                          src={getImageUrl(product.thumbnail)}
                          alt={product.name}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : null}
                      <span className="line-clamp-1 flex-1 text-sm font-medium text-slate-800">
                        {product.name}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        {formatMoney(product.sellPrice)}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">No products found.</div>
                )}
              </div>
            </section>
          </form>
        </AdminModal>
      ) : null}

      {showDetailModal && selectedPromo ? (
        <AdminModal
          title="Promotion Details"
          onClose={() => setShowDetailModal(false)}
          className="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
              <h3 className="text-lg font-medium text-slate-900">{selectedPromo.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {selectedPromo.description || "No description"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoTile label="Discount" value={selectedPromo.discountType === "PERCENTAGE" ? `${selectedPromo.discountValue}%` : formatMoney(selectedPromo.discountValue)} />
              <InfoTile label="Start" value={formatDate(selectedPromo.startDate)} />
              <InfoTile label="End" value={formatDate(selectedPromo.endDate)} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-800">
                Applied products ({selectedPromo.products?.length || 0})
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100">
                {selectedPromo.products?.length ? (
                  selectedPromo.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                      {product.thumbnail ? (
                        <img src={getImageUrl(product.thumbnail)} alt={product.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : null}
                      <span className="flex-1 text-sm font-medium text-slate-800">{product.name}</span>
                      <span className="text-sm text-slate-500">{formatMoney(product.sellPrice)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">No products applied.</div>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </AdminPage>
  );
};

const Field = ({ label, ...props }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input className="ui-input w-full" {...props} />
  </label>
);

const SelectField = ({ label, children, ...props }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <select className="ui-input w-full" {...props}>
      {children}
    </select>
  </label>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

export default PromotionsPage;

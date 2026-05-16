import { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiEdit2, FiInfo, FiPlus, FiTag, FiTrash2 } from "react-icons/fi";
import voucherService from "../../services/voucherService";
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
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: 0,
  maxDiscountAmount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const dateTime = (value) => (value ? moment(value).utc().format("DD MMM YYYY HH:mm") : "---");

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const res = await voucherService.getAll();
      setVouchers(res.data || []);
    } catch (error) {
      console.error("Failed to load vouchers:", error);
      toast.error("Unable to load vouchers.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        id: formData.id,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      if (formData.id) {
        await voucherService.update(formData.id, payload);
        toast.success("Voucher updated.");
      } else {
        await voucherService.create(payload);
        toast.success("Voucher created.");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to save voucher.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete voucher?",
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
      await voucherService.delete(id);
      toast.success("Voucher deleted.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data || error.message || "Unable to delete voucher.");
    }
  };

  const openEdit = (voucher) => {
    setFormData({
      id: voucher.id,
      code: voucher.code,
      description: voucher.description || "",
      discountType: voucher.discountType || "PERCENTAGE",
      discountValue: voucher.discountValue || "",
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscountAmount: voucher.maxDiscountAmount || "",
      usageLimit: voucher.usageLimit || "",
      startDate: voucher.startDate ? moment(voucher.startDate).utc().format("YYYY-MM-DDTHH:mm") : "",
      endDate: voucher.endDate ? moment(voucher.endDate).utc().format("YYYY-MM-DDTHH:mm") : "",
      status: voucher.status || "ACTIVE",
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
        title="Vouchers"
        description="Manage cart-level coupons, date windows, and usage limits."
        actions={
          <Button onClick={openCreate}>
            <FiPlus size={18} />
            Add Voucher
          </Button>
        }
      />

      <AdminTableCard>
        <table>
          <thead>
            <tr>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-left">Discount</th>
              <th className="px-6 py-4 text-left">Minimum Order</th>
              <th className="px-6 py-4 text-left">Start</th>
              <th className="px-6 py-4 text-left">End</th>
              <th className="px-6 py-4 text-center">Usage</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.length ? (
              vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                      {voucher.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="line-clamp-2 max-w-[220px] text-sm text-slate-600">
                      {voucher.description || "No description"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                      {voucher.discountType === "PERCENTAGE"
                        ? `${voucher.discountValue}%`
                        : money(voucher.discountValue)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                    {money(voucher.minOrderValue)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {dateTime(voucher.startDate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {dateTime(voucher.endDate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-slate-700">
                    {voucher.usedCount || 0} / {voucher.usageLimit || "Unlimited"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <StatusBadge tone={voucher.status === "ACTIVE" ? "emerald" : "slate"}>
                      {voucher.status === "ACTIVE" ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <AdminIconButton
                      onClick={() => {
                        setSelectedVoucher(voucher);
                        setShowDetailModal(true);
                      }}
                      tone="blue"
                      aria-label="View voucher"
                    >
                      <FiInfo size={18} />
                    </AdminIconButton>
                    <AdminIconButton onClick={() => openEdit(voucher)} tone="emerald" aria-label="Edit voucher">
                      <FiEdit2 size={18} />
                    </AdminIconButton>
                    <AdminIconButton onClick={() => handleDelete(voucher.id)} tone="rose" aria-label="Delete voucher">
                      <FiTrash2 size={18} />
                    </AdminIconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-12 text-center text-sm font-medium text-slate-500">
                  No vouchers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {showModal ? (
        <AdminModal
          title={formData.id ? "Edit Voucher" : "Create Voucher"}
          onClose={() => setShowModal(false)}
          className="max-w-3xl"
          footer={
            <>
              <Button variant="muted" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" form="voucher-form" disabled={loading}>
                {loading ? "Saving..." : formData.id ? "Save Changes" : "Create Voucher"}
              </Button>
            </>
          }
        >
          <form id="voucher-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <AdminSectionTitle>Coupon</AdminSectionTitle>
              <Field required label="Code" name="code" value={formData.code} onChange={handleChange} inputClassName="uppercase" />
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
                {formData.discountType === "PERCENTAGE" ? (
                  <Field type="number" label="Maximum discount" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} />
                ) : null}
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <AdminSectionTitle>Conditions</AdminSectionTitle>
                <Field type="number" label="Minimum order" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} />
                <Field type="number" label="Usage limit" name="usageLimit" value={formData.usageLimit} onChange={handleChange} />
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

            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 md:grid-cols-2">
              <AdminSectionTitle className="md:col-span-2">Schedule</AdminSectionTitle>
              <Field required type="datetime-local" label="Start date" name="startDate" value={formData.startDate} onChange={handleChange} />
              <Field required type="datetime-local" label="End date" name="endDate" value={formData.endDate} onChange={handleChange} />
            </section>
          </form>
        </AdminModal>
      ) : null}

      {showDetailModal && selectedVoucher ? (
        <AdminModal
          title="Voucher Details"
          onClose={() => setShowDetailModal(false)}
          className="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-emerald-900">
                  {selectedVoucher.code}
                </h3>
                <StatusBadge tone={selectedVoucher.status === "ACTIVE" ? "emerald" : "slate"}>
                  {selectedVoucher.status === "ACTIVE" ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {selectedVoucher.description || "No description"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoTile label="Discount" value={selectedVoucher.discountType === "PERCENTAGE" ? `${selectedVoucher.discountValue}%` : money(selectedVoucher.discountValue)} />
              <InfoTile label="Minimum order" value={money(selectedVoucher.minOrderValue)} />
              <InfoTile label="Usage" value={`${selectedVoucher.usedCount || 0} / ${selectedVoucher.usageLimit || "Unlimited"}`} />
              <InfoTile label="Maximum discount" value={selectedVoucher.maxDiscountAmount ? money(selectedVoucher.maxDiscountAmount) : "Unlimited"} />
              <InfoTile label="Start" value={dateTime(selectedVoucher.startDate)} />
              <InfoTile label="End" value={dateTime(selectedVoucher.endDate)} />
            </div>
          </div>
        </AdminModal>
      ) : null}
    </AdminPage>
  );
};

const Field = ({ label, inputClassName = "", ...props }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input className={`ui-input w-full ${inputClassName}`} {...props} />
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

export default VouchersPage;

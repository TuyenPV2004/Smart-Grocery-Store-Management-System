import { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiInfo, FiLoader, FiMoreHorizontal, FiSearch, FiTag, FiTrash2, FiX } from "react-icons/fi";
import { FaEdit, FaTicketAlt } from "react-icons/fa";
import voucherService from "../../services/voucherService";
import AdminTopbar from "../../components/admin/AdminTopbar";
import {
  AdminModal,
  AdminPage,
  AdminSectionTitle,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionMenu, setActionMenu] = useState(null);

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

  const filteredVouchers = vouchers.filter((voucher) => {
    const keyword = searchTerm.toLowerCase();
    const matchesKeyword =
      !keyword ||
      voucher.code?.toLowerCase().includes(keyword) ||
      voucher.description?.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter === "ALL" || voucher.status === statusFilter;
    return matchesKeyword && matchesStatus;
  });

  const openActionMenu = (event, voucher) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuEstimatedHeight = 124;
    const gap = 8;
    const shouldOpenUpward =
      rect.bottom + gap + menuEstimatedHeight > window.innerHeight;

    setActionMenu((current) =>
      current?.voucher?.id === voucher.id
        ? null
        : {
            voucher,
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

  const getVoucherStatusCount = (status) => {
    if (status === "ALL") return vouchers.length;
    return vouchers.filter((voucher) => voucher.status === status).length;
  };

  return (
    <AdminPage>
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-medium text-slate-900">Voucher Catalog</h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search vouchers by code or description
          </p>
        </div>
        <AdminTopbar />
      </div>

      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-medium text-slate-900">Voucher Management</h3>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "ACTIVE", "INACTIVE"].map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL" ? "All statuses" : status} {getVoucherStatusCount(status)}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <div className="relative w-full sm:w-[360px]">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
                Add voucher
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="product-inventory-table w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-base font-medium text-slate-900">Code</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Description</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Discount</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Minimum Order</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">Start</th>
                <th className="px-6 py-4 text-base font-medium text-slate-900">End</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Usage</th>
                <th className="px-6 py-4 text-center text-base font-medium text-slate-900">Status</th>
                <th className="px-6 py-4 text-right text-base font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredVouchers.length ? (
              filteredVouchers.map((voucher) => (
                <tr key={voucher.id} className="product-inventory-row transition-colors">
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
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(event) => openActionMenu(event, voucher)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        title="Actions"
                      >
                        <FiMoreHorizontal size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="product-empty-row bg-white">
                <td colSpan="9" className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FiTag className="mb-4 text-slate-950" size={30} />
                    <h4 className="text-base font-medium text-slate-900">No matching vouchers</h4>
                    <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                      Try changing the status filter or search keyword.
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
            onClick={() =>
              runAction(() => {
                setSelectedVoucher(actionMenu.voucher);
                setShowDetailModal(true);
              })
            }
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FiInfo className="text-blue-500" size={19} />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => openEdit(actionMenu.voucher))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FaEdit className="text-indigo-600" size={18} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => runAction(() => handleDelete(actionMenu.voucher.id))}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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
              <FaTicketAlt className="text-green-600" size={26} />
              <h2 className="text-xl font-medium text-slate-900 leading-none">
                {formData.id ? "Edit Voucher" : "Create Voucher"}
              </h2>
            </div>
          }
          onClose={() => setShowModal(false)}
          className="max-w-3xl"
          footer={
            <Button type="submit" form="voucher-form" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                formData.id ? "Save Changes" : "Create Voucher"
              )}
            </Button>
          }
        >
          <form id="voucher-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Coupon
                </h3>
              </div>
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
              <div className="space-y-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Discount
                  </h3>
                </div>
                <SelectField label="Discount type" name="discountType" value={formData.discountType} onChange={handleChange}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                </SelectField>
                <Field required type="number" label="Discount value" name="discountValue" value={formData.discountValue} onChange={handleChange} />
                {formData.discountType === "PERCENTAGE" ? (
                  <Field type="number" label="Maximum discount" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} />
                ) : null}
              </div>

              <div className="space-y-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Conditions
                  </h3>
                </div>
                <Field type="number" label="Minimum order" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} />
                <Field type="number" label="Usage limit" name="usageLimit" value={formData.usageLimit} onChange={handleChange} />
                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 block">Status</span>
                  <label className="flex items-center justify-between min-h-[44px] rounded-xl border !border-slate-200 bg-white/95 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Active</span>
                    <input
                      type="checkbox"
                      className="accent-emerald-700 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-[#DFEBDF]/50 bg-[#DFEBDF] p-5 shadow-sm md:grid-cols-2">
              <div className="flex items-center gap-2 mb-4 md:col-span-2">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Schedule
                </h3>
              </div>
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

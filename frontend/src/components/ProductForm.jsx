import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import {
  X,
  Upload,
  Package,
  Image as ImageIcon,
  FileText,
  Save,
  ChevronUp,
} from "lucide-react";
import supplierService from "../services/supplierService";
const productSchema = z.object({
  name: z.string().min(10, "Tên sản phẩm phải có ít nhất 10 ký tự"),
  brand: z.string().min(1, "Thương hiệu không được để trống"),
  sku: z.string().min(1, "Mã SKU bắt buộc"),
  barcode: z.string().min(1, "Mã vạch bắt buộc"),
  unit: z.string().min(1, "Đơn vị tính bắt buộc"),
  importPrice: z.coerce.number().min(0, "Giá nhập phải >= 0"),
  sellPrice: z.coerce.number().min(0, "Giá bán phải >= 0"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]),
});

const ProductForm = ({ existingProduct, onClose, onSuccess }) => {
  const [preview, setPreview] = useState(
    existingProduct?.thumbnail
      ? `http://localhost:8080/${existingProduct.thumbnail}`
      : null,
  );
  const [imageFile, setImageFile] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: existingProduct || {
      status: "ACTIVE",
      importPrice: 0,
      sellPrice: 0,
    },
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await supplierService.getAll();
        setSuppliers(res.data || []);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const generateSkuAndBarcode = () => {
    // 1. Generate SKU
    const randomSkuSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const newSku = `SKU-${randomSkuSuffix}`;

    // 2. Generate EAN-13 Barcode
    const prefix = "893"; // Vietnam country code
    const enterpriseCode = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const productCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const first12 = prefix + enterpriseCode + productCode;

    // Calculate checksum digit (13th digit)
    let sumOddPositions = 0;
    let sumEvenPositions = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12[i]);
      const positionFromRight = 12 - i;
      if (positionFromRight % 2 !== 0) sumOddPositions += digit;
      else sumEvenPositions += digit;
    }
    const S = sumOddPositions * 3 + sumEvenPositions;
    const remainder = S % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    const newBarcode = first12 + checkDigit;

    // Update both SKU and Barcode
    setValue("sku", newSku);
    setValue("barcode", newBarcode);
  };

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      if (existingProduct) {
        await onSuccess(existingProduct.id, data, imageFile);
      } else {
        await onSuccess(null, data, imageFile);
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header - Tinh tế và gọn gàng */}
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-slate-900 leading-none">
                {existingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                Vui lòng điền chính xác thông tin sản phẩm vào các mục dưới đây
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-8 overflow-y-auto flex-1 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-8 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Thông tin cơ bản
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-[13px] font-medium text-slate-900 mb-2 ml-1">
                      Tên sản phẩm
                    </label>
                    <input
                      {...register("name")}
                      readOnly={!!existingProduct}
                      className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none transition-all font-medium text-slate-900 ${
                        existingProduct
                          ? "bg-slate-100 cursor-not-allowed"
                          : "bg-slate-50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white"
                      }`}
                      placeholder="Nhập tên sản phẩm"
                    />
                    {errors.name && (
                      <p className="text-rose-500 text-xs mt-2 ml-1 font-medium">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2">
                      <label className="block text-[13px] font-medium text-slate-900 mb-2 ml-1">
                        Thương hiệu
                      </label>
                      <div className="relative">
                        <select
                          {...register("brand")}
                          onChange={(e) => {
                            register("brand").onChange(e);
                            e.target.blur();
                          }}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white outline-none transition-all font-medium text-slate-900 cursor-pointer appearance-none peer"
                        >
                          <option value="">Chọn thương hiệu</option>
                          {suppliers.map((supplier) => (
                            <option
                              key={supplier.id}
                              value={supplier.vietnameseName}
                            >
                              {supplier.vietnameseName}
                            </option>
                          ))}
                        </select>
                        <ChevronUp
                          size={20}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform duration-200 peer-focus:rotate-180"
                        />
                      </div>
                      {errors.brand && (
                        <p className="text-rose-500 text-xs mt-2 ml-1 font-medium">
                          {errors.brand.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[13px] font-medium text-slate-900 mb-2 ml-1">
                        Đơn vị
                      </label>
                      <div className="relative">
                        <select
                          {...register("unit")}
                          onChange={(e) => {
                            register("unit").onChange(e);
                            e.target.blur();
                          }}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white outline-none transition-all font-medium text-slate-900 cursor-pointer appearance-none peer"
                        >
                          <option value="">Chọn đơn vị</option>
                          <option value="Thùng">Thùng</option>
                          <option value="Hộp">Hộp</option>
                          <option value="Cái">Cái</option>
                          <option value="Chiếc">Chiếc</option>
                          <option value="Chai">Chai</option>
                          <option value="Lốc">Lốc</option>
                          <option value="Kg">Kg</option>
                        </select>
                        <ChevronUp
                          size={20}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform duration-200 peer-focus:rotate-180"
                        />
                      </div>
                      {errors.unit && (
                        <p className="text-rose-500 text-xs mt-2 ml-1 font-medium">
                          {errors.unit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-900 mb-2 ml-1">
                        Mã SKU
                      </label>
                      <div className="relative">
                        <input
                          {...register("sku")}
                          readOnly={!!existingProduct}
                          className={`w-full py-3.5 border border-slate-200 rounded-2xl outline-none transition-all font-medium ${
                            existingProduct
                              ? "px-5 bg-slate-100 text-slate-700 cursor-not-allowed"
                              : "pl-5 pr-20 bg-slate-50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white"
                          }`}
                        />
                        {!existingProduct && (
                          <button
                            type="button"
                            onClick={generateSkuAndBarcode}
                            className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-green-600 hover:bg-green-50 hover:border-green-200 transition-all"
                          >
                            Tạo ngẫu nhiên
                          </button>
                        )}
                      </div>
                      {errors.sku && (
                        <p className="text-rose-500 text-xs mt-2 ml-1 font-medium">
                          {errors.sku.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-900 mb-2 ml-1">
                        Mã barcode
                      </label>
                      <input
                        {...register("barcode")}
                        readOnly
                        className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none transition-all font-medium text-slate-700 cursor-not-allowed"
                        placeholder="Tự động sinh"
                      />
                      {errors.barcode && (
                        <p className="text-rose-500 text-xs mt-2 ml-1 font-medium">
                          {errors.barcode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-6 pt-2">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Mô tả chi tiết
                  </h3>
                </div>
                <textarea
                  {...register("description")}
                  rows="5"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 focus:bg-white transition-all font-medium text-slate-900 resize-none min-h-[160px]"
                  placeholder="Viết mô tả ngắn gọn về đặc điểm của sản phẩm..."
                ></textarea>
              </section>
            </div>
            <div className="md:col-span-4 space-y-8">
              <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-slate-600">
                  <ImageIcon size={18} />
                  <span className="text-[13px] font-medium">
                    Hình ảnh sản phẩm
                  </span>
                </div>

                <div className="relative group aspect-square bg-white rounded-[2rem] border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Upload size={36} strokeWidth={1.5} className="mb-2" />
                      <p className="text-xs font-medium">Tải ảnh lên</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />

                  {preview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium">
                        Thay đổi hình ảnh
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-3 font-medium">
                  Hỗ trợ định dạng: png, jpg, gif
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 mb-2 text-slate-900">
                  <span className="text-[13px] font-medium">
                    Thanh toán và Trạng thái
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Giá nhập
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register("importPrice")}
                        readOnly={!!existingProduct}
                        className={`w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl ${
                          existingProduct
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                            : "bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                        } transition-all`}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-medium">
                        ₫
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Giá bán
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register("sellPrice")}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-medium">
                        ₫
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-slate-900 mb-1.5 ml-1">
                      Trạng thái hiện tại
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-indigo-400"
                    >
                      <option value="ACTIVE">Đang kinh doanh</option>
                      <option value="INACTIVE">Ngừng kinh doanh</option>
                      <option value="OUT_OF_STOCK">Hết hàng trong kho</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all font-medium text-sm"
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="px-10 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-green-600 transition-all font-medium text-sm shadow-lg shadow-green-100 active:scale-95"
          >
            Lưu dữ liệu sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;

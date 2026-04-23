import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import productService from "../../services/productService";
import orderService from "../../services/orderService";
import { getImageUrl } from "../../utils/imageUrl";

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [waitingOrder, setWaitingOrder] = useState(null);
  const [waitingSeconds, setWaitingSeconds] = useState(300);
  const [finalizingStatus, setFinalizingStatus] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  // Form khách hàng
  const [customerName, setCustomerName] = useState("Khách lẻ");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Load sản phẩm (có debounce search)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await productService.getAll({ search: searchTerm });
        setProducts(res.data.content || res.data || []);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Thêm vào giỏ
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      toast.warning("Sản phẩm đã hết hàng!");
      return;
    }

    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        if (exist.cartQty >= product.stockQuantity) {
          toast.warning(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho!`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQty: item.cartQty + 1 }
            : item,
        );
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  // Cập nhật số lượng
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.cartQty + delta;
          if (newQty > item.stockQuantity) return item; // Không quá tồn kho
          if (newQty < 1) return item;
          return { ...item, cartQty: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  // Tính tổng tiền
  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.sellPrice || 0) * item.cartQty,
    0,
  );

  useEffect(() => {
    if (!waitingOrder || finalResult) return;

    const interval = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalizeOrder("CANCELLED", true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingOrder, finalResult]);

  const formatCountdown = (seconds) => {
    const mm = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const resetAfterFinalize = () => {
    setTimeout(() => {
      setWaitingOrder(null);
      setWaitingSeconds(300);
      setFinalResult(null);
    }, 1200);
  };

  const handleFinalizeOrder = async (status, isAutoCancel = false) => {
    if (!waitingOrder?.id) return;
    setFinalizingStatus(true);
    try {
      await orderService.updateStatus(waitingOrder.id, status);
      setFinalResult(status);
      if (status === "COMPLETED") {
        toast.success("Đơn hàng đã hoàn thành");
        setCart([]);
        setCustomerName("Khách lẻ");
        setCustomerPhone("");
      } else if (!isAutoCancel) {
        toast.info("Đơn hàng đã hủy");
      }
      resetAfterFinalize();
    } catch (error) {
      toast.error(error.response?.data || "Không thể cập nhật trạng thái đơn");
    } finally {
      setFinalizingStatus(false);
    }
  };

  // Thanh toán
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Giỏ hàng trống!");
    const result = await Swal.fire({
      title: "Xác nhận thanh toán?",
      text: "Bạn có chắc chắn muốn thanh toán đơn hàng này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Thanh toán",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        paymentMethod,
        pendingConfirmation: true,
        discount: 0,
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.cartQty,
          price: i.sellPrice,
        })),
      };

      const res = await orderService.create(payload);
      setWaitingOrder(res.data);
      setWaitingSeconds(300);
      setFinalResult(null);
    } catch (error) {
      toast.error(error.response?.data || "Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-shell admin-page-shell--pos flex h-screen overflow-hidden">
      {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
      <div className="flex-1 flex flex-col p-4 pr-2 transition-all duration-300">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tìm tên sản phẩm, mã vạch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          {!isCartOpen && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
            >
              <ShoppingCart size={20} />
              <span className="font-medium">
                {cart.reduce((sum, item) => sum + item.cartQty, 0)}
              </span>
            </button>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto grid gap-2 pb-20 [&::-webkit-scrollbar]:hidden ${isCartOpen ? "grid-cols-4 md:grid-cols-5" : "grid-cols-5 md:grid-cols-6"}`}
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              onClick={() => addToCart(prod)}
              className="relative bg-white p-2 rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-blue-400 transition-all group"
            >
              <span className="absolute top-1.5 left-1.5 bg-[#2DC275] text-white text-[10px] px-1.5 py-0.5 rounded-full z-10 font-medium shadow-sm">
                Tồn: {prod.stockQuantity}
              </span>
              <div className="h-40 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                {prod.thumbnail ? (
                  <img
                    src={getImageUrl(prod.thumbnail)}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400">No Img</span>
                )}
              </div>
              <h4 className="font-semimedium text-slate-900 text-[11px] leading-tight line-clamp-2 min-h-[28px] mb-1">
                {prod.name}
              </h4>
              <div className="flex justify-between items-end">
                <span className="text-slate-900 font-medium text-xs">
                  {prod.sellPrice?.toLocaleString()} ₫
                </span>
                <span className="text-[11px] text-slate-900">{prod.sku}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div
        className={`${
          isCartOpen ? "w-[500px] border-l" : "w-0 overflow-hidden border-none"
        } bg-white shadow-2xl flex flex-col h-full transition-all duration-300`}
      >
        <div className="p-5 border-b bg-blue-50 flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
            Giỏ hàng
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 hover:bg-blue-100 rounded-full text-gray-500 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Thông tin khách */}
        <div className="p-4 border-b">
          <div className="flex items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <input
              className="bg-transparent outline-none flex-1 text-sm text-gray-700 placeholder-gray-400 border-r border-gray-300 pr-2 mr-2"
              placeholder="Khách lẻ"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="bg-transparent outline-none w-28 text-sm text-gray-700 placeholder-gray-400"
              placeholder="Số điện thoại"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              Chưa có sản phẩm
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.thumbnail ? (
                    <img
                      src={getImageUrl(item.thumbnail)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                      No Img
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium line-clamp-1">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.sellPrice?.toLocaleString() || 0} ₫
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                  <button onClick={() => updateQty(item.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">
                    {item.cartQty}
                  </span>
                  <button onClick={() => updateQty(item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-medium min-w-[70px] text-right">
                  {((item.sellPrice || 0) * item.cartQty).toLocaleString()}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Payment */}
        <div className="p-5 border-t bg-gray-50">
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
            <div className="flex justify-between mb-2 text-gray-600">
              <span>Tổng tiền hàng:</span>{" "}
              <span>{totalAmount.toLocaleString()} ₫</span>
            </div>
            <div className="flex justify-between mb-3 text-gray-600">
              <span>Giảm giá:</span> <span>0 ₫</span>
            </div>
            <div className="border-t my-3"></div>
            <div className="flex justify-between text-2xl font-medium text-green-700">
              <span>Thanh toán:</span>{" "}
              <span>{totalAmount.toLocaleString()} ₫</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`flex justify-center gap-2 py-2 rounded-full border ${paymentMethod === "CASH" ? "bg-green-100 border-green-500 text-green-700" : "bg-white"}`}
            >
              Tiền mặt
            </button>
            <button
              onClick={() => setPaymentMethod("TRANSFER")}
              className={`flex justify-center gap-2 py-2 rounded-full border ${paymentMethod === "TRANSFER" ? "bg-green-100 border-green-500 text-green-700" : "bg-white"}`}
            >
              Chuyển khoản
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-medium text-lg shadow-lg"
          >
            {loading ? "Đang xử lý..." : "THANH TOÁN NGAY"}
          </button>
        </div>
      </div>

      {waitingOrder && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-2">
              Mã đơn: {waitingOrder.code}
            </p>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              Chờ thanh toán
            </h3>

            {!finalResult ? (
              <>
                <div className="w-24 h-24 mx-auto my-5 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                <p className="text-slate-600 mb-1">Thời gian còn lại</p>
                <p className="text-3xl font-bold text-emerald-600 mb-5">
                  {formatCountdown(waitingSeconds)}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFinalizeOrder("COMPLETED")}
                    disabled={finalizingStatus}
                    className="py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {finalizingStatus ? "Đang xử lý..." : "Hoàn thành"}
                  </button>
                  <button
                    onClick={() => handleFinalizeOrder("CANCELLED")}
                    disabled={finalizingStatus}
                    className="py-2.5 rounded-xl bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 disabled:opacity-60"
                  >
                    Hủy
                  </button>
                </div>
              </>
            ) : finalResult === "COMPLETED" ? (
              <div className="py-8 flex flex-col items-center gap-3 text-emerald-600">
                <CheckCircle size={56} />
                <p className="text-lg font-medium">Thanh toán hoàn thành</p>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-3 text-rose-600">
                <XCircle size={56} />
                <p className="text-lg font-medium">Đơn hàng đã hủy</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;

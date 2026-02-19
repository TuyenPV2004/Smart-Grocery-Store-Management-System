import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  User,
  ChevronRight,
} from "lucide-react";
import productService from "../services/productService";
import orderService from "../services/orderService";

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);

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
      alert("Sản phẩm đã hết hàng!");
      return;
    }

    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        if (exist.cartQty >= product.stockQuantity) {
          alert(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho!`);
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

  // Thanh toán
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    if (!window.confirm("Xác nhận thanh toán?")) return;

    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        paymentMethod,
        discount: 0,
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.cartQty,
          price: i.sellPrice,
        })),
      };

      await orderService.create(payload);
      alert("Thanh toán thành công!");
      setCart([]);
      setCustomerName("Khách lẻ");
      setCustomerPhone("");
    } catch (error) {
      alert(error.response?.data || "Lỗi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <ShoppingCart size={20} />
              <span className="font-bold">
                {cart.reduce((sum, item) => sum + item.cartQty, 0)}
              </span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {products.map((prod) => (
            <div
              key={prod.id}
              onClick={() => addToCart(prod)}
              className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-blue-400 transition-all"
            >
              <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {prod.thumbnail ? (
                  <img
                    src={`http://localhost:8080/${prod.thumbnail}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>
              <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[40px]">
                {prod.name}
              </h4>
              <div className="text-xs text-gray-500 mb-1">SKU: {prod.sku}</div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-blue-600 font-bold">
                  {prod.sellPrice?.toLocaleString()} ₫
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${prod.stockQuantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  Tồn: {prod.stockQuantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div
        className={`${
          isCartOpen ? "w-[400px] border-l" : "w-0 overflow-hidden border-none"
        } bg-white shadow-2xl flex flex-col h-full transition-all duration-300`}
      >
        <div className="p-5 border-b bg-blue-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Giỏ hàng
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 hover:bg-blue-100 rounded-full text-gray-500 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Thông tin khách */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
            <User className="w-4 h-4 text-gray-500" />
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder="Tên khách hàng..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <input
            className="w-full bg-gray-50 p-2 rounded border outline-none text-sm"
            placeholder="Số điện thoại"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              Chưa có sản phẩm
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
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
                  <span className="text-sm font-bold w-4 text-center">
                    {item.cartQty}
                  </span>
                  <button onClick={() => updateQty(item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-bold min-w-[70px] text-right">
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
          <div className="flex justify-between mb-2 text-gray-600">
            <span>Tổng tiền hàng:</span>{" "}
            <span>{totalAmount.toLocaleString()} ₫</span>
          </div>
          <div className="flex justify-between mb-4 text-gray-600">
            <span>Giảm giá:</span> <span>0 ₫</span>
          </div>
          <div className="flex justify-between mb-6 text-2xl font-bold text-blue-700">
            <span>Thanh toán:</span>{" "}
            <span>{totalAmount.toLocaleString()} ₫</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`flex justify-center gap-2 py-2 rounded border ${paymentMethod === "CASH" ? "bg-blue-100 border-blue-500 text-blue-700" : "bg-white"}`}
            >
            Tiền mặt
            </button>
            <button
              onClick={() => setPaymentMethod("TRANSFER")}
              className={`flex justify-center gap-2 py-2 rounded border ${paymentMethod === "TRANSFER" ? "bg-blue-100 border-blue-500 text-blue-700" : "bg-white"}`}
            >
            Chuyển khoản
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg"
          >
            {loading ? "Đang xử lý..." : "THANH TOÁN NGAY"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosPage;

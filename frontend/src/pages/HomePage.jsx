import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
} from "lucide-react";
import productService from "../services/productService";
import categoryService from "../services/categoryService";
import ProductCard from "../components/common/ProductCard";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAll({ pageSize: 8 }), // Fetch first 8 products for "Featured"
          categoryService.getFlat(),
        ]);

        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="font-poppins bg-[#F8FAFC] min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-800 text-white overflow-hidden rounded-b-[3rem] shadow-xl mb-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Chào mừng đến với Grocery Store
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Thực phẩm tươi ngon <br />
              <span className="text-green-300">Giao ngay tận nhà</span>
            </h1>
            <p className="text-lg text-green-50 mb-10 max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              Chúng tôi cam kết cung cấp các sản phẩm hữu cơ, tươi sống và an
              toàn vệ sinh thực phẩm cho gia đình bạn mỗi ngày.
            </p>
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link
                to="/products"
                className="bg-white text-green-700 font-bold px-8 py-4 rounded-2xl hover:bg-green-50 transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center gap-2"
              >
                Mua sắm ngay <ArrowRight size={20} />
              </Link>
              <button className="bg-transparent border-2 border-white/30 text-white font-medium px-8 py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                Xem khuyến mãi
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-20 pb-20">
        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8 -mt-24 relative z-20">
          {[
            {
              icon: Truck,
              title: "Giao hàng miễn phí",
              desc: "Cho đơn hàng trên 500k",
            },
            {
              icon: ShieldCheck,
              title: "Đảm bảo chất lượng",
              desc: "Hoàn tiền nếu không hài lòng",
            },
            {
              icon: Headphones,
              title: "Hỗ trợ 24/7",
              desc: "Luôn sẵn sàng tư vấn",
            },
            {
              icon: ShoppingBag,
              title: "Thanh toán an toàn",
              desc: "Đa dạng phương thức",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Danh mục nổi bật
              </h2>
              <p className="text-slate-500">
                Khám phá các loại sản phẩm đa dạng
              </p>
            </div>
            <Link
              to="/categories"
              className="text-green-600 font-medium hover:text-green-700 flex items-center gap-1 group"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.slice(0, 6).map((cat) => (
              <div key={cat.id} className="group cursor-pointer">
                <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm aspect-square flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:border-green-200 transition-all duration-300 group-hover:-translate-y-1">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                    {/* Placeholder icon if no image */}
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="font-bold text-center text-slate-700 group-hover:text-green-700 transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>
            ))}
            {loading &&
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-slate-200 rounded-[2rem] aspect-square"
                  ></div>
                ))}
          </div>
        </section>

        {/* Banner Promo */}
        <section className="bg-indigo-900 rounded-[3rem] overflow-hidden relative shadow-2xl p-10 md:p-16 flex items-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604719312566-b7e605d6d48c?q=80&w=2691&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-xl">
            <span className="text-indigo-300 font-bold tracking-wider uppercase text-sm mb-4 block">
              Khuyến mãi đặc biệt
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Giảm giá 20% cho <br /> Rau củ quả hữu cơ
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              Áp dụng cho tất cả đơn hàng trên 300k. Chỉ trong tuần này, nhanh
              tay đặt hàng ngay!
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-indigo-900 px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-50 transition-colors active:scale-95 shadow-lg">
                Mua ngay
              </button>
              <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl font-mono font-bold tracking-widest border border-white/20">
                FRESH20
              </div>
            </div>
          </div>
          {/* Decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-1/3 translate-x-1/4">
            <Star size={400} />
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Gợi ý cho bạn
              </h2>
            </div>
            <Link
              to="/products"
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.length > 0
              ? products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              : !loading && (
                  <div className="col-span-4 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Chưa có sản phẩm nào.</p>
                  </div>
                )}
            {loading &&
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-[350px] animate-pulse"
                  ></div>
                ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-green-50 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Đăng ký nhận tin
            </h2>
            <p className="text-slate-500 mb-8">
              Nhận thông báo về các sản phẩm mới và khuyến mãi đặc biệt sớm
              nhất.
            </p>
            <form className="flex gap-3 bg-white p-2 rounded-2xl shadow-xl shadow-green-900/5 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
                Đăng ký
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;

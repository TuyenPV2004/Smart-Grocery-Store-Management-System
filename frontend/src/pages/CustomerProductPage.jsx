import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import ProductCard from "../components/common/ProductCard";
import productService from "../services/productService";
import categoryService from "../services/categoryService";

const CustomerProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get filters from URL
  const currentCategory = searchParams.get("category");
  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentCategory, currentSearch]);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getTree();
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        status: "ACTIVE", 
        pageSize: 1000,   
      };
      if (currentSearch) params.keyword = currentSearch;
      if (currentCategory) params.categoryId = currentCategory;

      const res = await productService.getAll(params);
      const productList = res.data?.content || res.data || [];
      setProducts(Array.isArray(productList) ? productList : []);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set("category", categoryId);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
    setShowFilters(false); 
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get("search");
    const newParams = new URLSearchParams(searchParams);

    if (query) {
      newParams.set("search", query);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };
  const renderCategories = (cats, level = 0) => {
    return (
      <ul
        className={`space-y-1 ${level > 0 ? "ml-4 border-l border-slate-100 pl-4" : ""}`}
      >
        {cats.map((cat) => (
          <li key={cat.id}>
            <button
              onClick={() => handleCategorySelect(cat.id)}
              className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                currentCategory === String(cat.id)
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat.name}
            </button>
            {cat.children &&
              cat.children.length > 0 &&
              renderCategories(cat.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Tất cả sản phẩm</h1>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-3 bg-white border border-slate-200 rounded-xl text-slate-600"
            >
              <Filter size={20} />
            </button>

            <form onSubmit={handleSearch} className="flex-1 md:w-80 relative">
              <input
                name="search"
                type="text"
                defaultValue={currentSearch}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium text-slate-700"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
            </form>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Danh mục</h3>
                {currentCategory && (
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="text-xs text-rose-500 hover:underline font-medium"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors mb-1 ${
                    !currentCategory
                      ? "bg-green-50 text-green-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  Tất cả
                </button>
                {renderCategories(categories)}
              </div>
            </div>
          </aside>

          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setShowFilters(false)}
            >
              <div
                className="absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-2xl animate-in slide-in-from-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-slate-800">Bộ lọc</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-slate-50 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-100px)]">
                  <h4 className="font-medium text-slate-900 mb-3">Danh mục</h4>
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors mb-1 ${
                      !currentCategory
                        ? "bg-green-50 text-green-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    Tất cả
                  </button>
                  {renderCategories(categories)}
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-slate-500">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
                {currentCategory && (
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="mt-6 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Xem tất cả sản phẩm
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductPage;

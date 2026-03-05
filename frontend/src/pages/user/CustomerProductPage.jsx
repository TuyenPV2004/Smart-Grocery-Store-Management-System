import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import ProductCard from "../../components/common/ProductCard";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";

const PRICE_RANGES = [
  { label: "Dưới 100.000đ", min: 0, max: 100000 },
  { label: "100.000đ – 500.000đ", min: 100000, max: 500000 },
  { label: "500.000đ – 1.000.000đ", min: 500000, max: 1000000 },
  { label: "Trên 1.000.000đ", min: 1000000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "name-asc", label: "Tên A → Z" },
];

const getEffectivePrice = (product) => {
  let price = product.sellPrice;
  if (product.activePromotion && product.status === "ACTIVE") {
    if (product.activePromotion.discountType === "PERCENTAGE") {
      price = price - (price * product.activePromotion.discountValue) / 100;
    } else {
      price = price - product.activePromotion.discountValue;
    }
    if (price < 0) price = 0;
  }
  return price;
};

const CustomerProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Accordion: only one parent category open at a time
  const [openParentId, setOpenParentId] = useState(null);

  // Sort & price filter state
  const [sortBy, setSortBy] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [customMinPrice, setCustomMinPrice] = useState("");
  const [customMaxPrice, setCustomMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // Get filters from URL
  const currentCategory = searchParams.get("category");
  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentCategory, currentSearch]);

  // Auto-open parent category that contains the selected child
  useEffect(() => {
    if (currentCategory && categories.length > 0) {
      for (const parent of categories) {
        if (String(parent.id) === currentCategory) {
          setOpenParentId(parent.id);
          return;
        }
        if (parent.children?.some((c) => String(c.id) === currentCategory)) {
          setOpenParentId(parent.id);
          return;
        }
      }
    }
  }, [currentCategory, categories]);

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

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Price range filter
    let minPrice = null;
    let maxPrice = null;

    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      minPrice = range.min;
      maxPrice = range.max;
    } else if (customMinPrice || customMaxPrice) {
      minPrice = customMinPrice ? Number(customMinPrice) : 0;
      maxPrice = customMaxPrice ? Number(customMaxPrice) : Infinity;
    }

    if (minPrice !== null) {
      result = result.filter((p) => {
        const price = getEffectivePrice(p);
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
    }

    return result;
  }, [products, sortBy, selectedPriceRange, customMinPrice, customMaxPrice]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    currentCategory,
    currentSearch,
    sortBy,
    selectedPriceRange,
    customMinPrice,
    customMaxPrice,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const handleToggleParent = (parentId) => {
    setOpenParentId((prev) => (prev === parentId ? null : parentId));
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

  const handlePriceRangeSelect = (index) => {
    setCustomMinPrice("");
    setCustomMaxPrice("");
    setSelectedPriceRange((prev) => (prev === index ? null : index));
  };

  const handleCustomPriceApply = () => {
    setSelectedPriceRange(null);
  };

  const clearAllFilters = () => {
    setSortBy("");
    setSelectedPriceRange(null);
    setCustomMinPrice("");
    setCustomMaxPrice("");
    handleCategorySelect(null);
  };

  const hasActiveFilters =
    currentCategory ||
    sortBy ||
    selectedPriceRange !== null ||
    customMinPrice ||
    customMaxPrice;

  // Find category name by id from the tree
  const findCategoryName = (cats, id) => {
    for (const cat of cats) {
      if (String(cat.id) === id) return cat.name;
      if (cat.children) {
        const found = findCategoryName(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategoryName = currentCategory
    ? findCategoryName(categories, currentCategory)
    : null;

  // Accordion category renderer
  const renderAccordionCategories = (cats) => {
    return (
      <ul className="space-y-1">
        {cats.map((cat) => {
          const hasChildren = cat.children && cat.children.length > 0;
          const isOpen = openParentId === cat.id;
          const isSelected = currentCategory === String(cat.id);

          return (
            <li key={cat.id}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    handleCategorySelect(cat.id);
                    if (hasChildren) handleToggleParent(cat.id);
                  }}
                  className={`text-left flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {cat.name}
                </button>
                {hasChildren && (
                  <button
                    onClick={() => handleToggleParent(cat.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                )}
              </div>
              {hasChildren && isOpen && (
                <ul className="ml-4 border-l border-slate-100 pl-4 space-y-1 mt-1">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() => handleCategorySelect(child.id)}
                        className={`text-left w-full py-1.5 px-3 rounded-lg text-sm transition-colors ${
                          currentCategory === String(child.id)
                            ? "bg-green-50 text-green-700 font-medium"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Shared filter sidebar content
  const renderFilterContent = () => (
    <>
      {/* Categories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-800">Danh mục</h4>
          {currentCategory && (
            <button
              onClick={() => handleCategorySelect(null)}
              className="text-xs text-rose-500 hover:underline font-medium"
            >
              Xóa
            </button>
          )}
        </div>
        <button
          onClick={() => {
            handleCategorySelect(null);
            setOpenParentId(null);
          }}
          className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors mb-1 ${
            !currentCategory
              ? "bg-green-50 text-green-700 font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Tất cả
        </button>
        {renderAccordionCategories(categories)}
      </div>

      {/* Sort */}
      <div className="mb-6">
        <h4 className="font-bold text-slate-800 mb-3">Sắp xếp</h4>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                sortBy === opt.value
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-bold text-slate-800 mb-3">Khoảng giá</h4>
        <div className="space-y-1 mb-3">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() => handlePriceRangeSelect(idx)}
              className={`text-left w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                selectedPriceRange === idx
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500 mb-2 font-medium">Tùy chỉnh</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              placeholder="Từ"
              value={customMinPrice}
              onChange={(e) => setCustomMinPrice(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="number"
              min="0"
              placeholder="Đến"
              value={customMaxPrice}
              onChange={(e) => setCustomMaxPrice(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400"
            />
          </div>
          <button
            onClick={handleCustomPriceApply}
            className="mt-2 w-full py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 border border-rose-200 text-rose-500 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors"
        >
          Xóa tất cả bộ lọc
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-poppins">
      <div className="max-w-7xl mx-auto">
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
                placeholder="Tìm kiếm sản phẩm"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-medium text-slate-700"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
            </form>
          </div>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                {selectedCategoryName || "Danh mục"}
                <button
                  onClick={() => handleCategorySelect(null)}
                  className="hover:text-green-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {sortBy && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <button
                  onClick={() => setSortBy("")}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {(selectedPriceRange !== null ||
              customMinPrice ||
              customMaxPrice) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                {selectedPriceRange !== null
                  ? PRICE_RANGES[selectedPriceRange].label
                  : `${customMinPrice || "0"}đ – ${customMaxPrice || "∞"}đ`}
                <button
                  onClick={() => {
                    setSelectedPriceRange(null);
                    setCustomMinPrice("");
                    setCustomMaxPrice("");
                  }}
                  className="hover:text-amber-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {renderFilterContent()}
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
                  {renderFilterContent()}
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {!loading && (
              <p className="text-sm text-slate-500 mb-4">
                Hiển thị{" "}
                <span className="font-semibold text-slate-700">
                  {filteredProducts.length}
                </span>{" "}
                sản phẩm
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {filteredProducts.length > PRODUCTS_PER_PAGE && (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Trang {currentPage}/{totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-sm rounded-lg border ${
                              currentPage === page
                                ? "bg-green-600 text-white border-green-600"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-6 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Xóa bộ lọc
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

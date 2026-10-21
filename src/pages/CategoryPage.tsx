import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BeautyProduct, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface CategoryPageProps {
  products: BeautyProduct[];
  categories: ProductCategory[];
  onDirectOrder: (product: BeautyProduct) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  products,
  categories,
  onDirectOrder
}) => {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState<'latest' | 'price-asc' | 'price-desc'>('latest');
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  const category = useMemo(() => {
    return categories.find((c) => c.slug === slug);
  }, [categories, slug]);

  useEffect(() => {
    const categoryName = category?.name || slug || 'الأقسام';
    document.title = `${categoryName} | متجر ROZA BEAUTY DZ في الجزائر`;
    
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.setAttribute('href', `https://roza-dz.ai.studio/category/${slug}`);
    }

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (metaDesc) {
      metaDesc.setAttribute('content', `تسوقي تشكيلة ${categoryName} الأصلية من متجر ROZA BEAUTY DZ في الجزائر. أجهزة أصلية مع ضمان رسمي وتوصيل سريع لـ 69 ولاية والدفع عند الاستلام.`);
    }

    return () => {
      document.title = 'ROZA BEAUTY DZ | المتجر الرسمي للأجهزة والجمال في الجزائر - الدفع عند الاستلام';
      if (canonical) {
        canonical.setAttribute('href', 'https://roza-dz.ai.studio/');
      }
    };
  }, [category, slug]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = p.categorySlug === slug || (!p.categorySlug && slug === 'home-appliances');
      const matchPrice = p.price <= maxPrice;
      const isVis = p.isVisible !== false;
      return matchCat && matchPrice && isVis;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, slug, maxPrice, sortBy]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-[#fdeaf1] to-[#f4ecf8] rounded-3xl p-6 sm:p-8 border border-[#f7dfe8] flex flex-col gap-2 text-right">
        <nav className="flex items-center gap-2 text-xs text-[#8a6b7a] mb-1">
          <Link to="/" className="hover:text-[#d94f86] transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-[#4a2b3d] font-bold">{category?.name || slug}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-black text-[#4a2b3d] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#d94f86]" />
          <span>{category?.name || slug}</span>
        </h1>
        {category?.description && (
          <p className="text-xs sm:text-sm text-[#8a6b7a] max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Filters and Sorting Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#f7dfe8] flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-bold text-[#4a2b3d]">
          <SlidersHorizontal className="w-4 h-4 text-[#d94f86]" />
          <span>المنتجات المتاحة: ({filteredProducts.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Max Price Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[#8a6b7a]">الحد الأقصى للسعر:</span>
            <span className="font-bold text-[#d94f86]">{maxPrice.toLocaleString()} د.ج</span>
            <input
              type="range"
              min={2000}
              max={100000}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#d94f86] w-24 sm:w-32 cursor-pointer"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#fdeaf1] px-3 py-1.5 rounded-xl border border-[#f7dfe8]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8a6b7a]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#4a2b3d] font-medium focus:outline-none cursor-pointer"
            >
              <option value="latest">الأحدث</option>
              <option value="price-asc">الأقل سعراً</option>
              <option value="price-desc">الأعلى سعراً</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#f7dfe8] text-[#8a6b7a]">
          <p className="font-bold text-base mb-1 text-[#4a2b3d]">لا توجد منتجات في هذا القسم تطابق التصفية</p>
          <p className="text-xs text-[#8a6b7a]">جرب رفع الحد الأقصى للسعر أو اختر قسماً آخر</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
            />
          ))}
        </div>
      )}
    </div>
  );
};

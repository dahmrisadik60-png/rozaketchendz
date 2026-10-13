import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BeautyProduct, ProductCategory, StoreBanner } from '../types';
import { HeroBanner } from '../components/HeroBanner';
import { FeatureBadges } from '../components/FeatureBadges';
import { CategoryProductSection } from '../components/CategoryProductSection';
import { FaqAccordion } from '../components/FaqAccordion';
import { ProductCard } from '../components/ProductCard';
import { Sparkles, Search, X } from 'lucide-react';

interface HomePageProps {
  products: BeautyProduct[];
  categories: ProductCategory[];
  banner: StoreBanner;
  onDirectOrder: (product: BeautyProduct) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  banner,
  onDirectOrder
}) => {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';

  // Filter products by visibility
  const visibleProducts = useMemo(() => {
    return products.filter((p) => p.isVisible !== false);
  }, [products]);

  // Filtered by search query or favorites
  const displayedProducts = useMemo(() => {
    let list = visibleProducts;
    if (searchQ) {
      const q = searchQ.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          (p.brandName && p.brandName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [visibleProducts, searchQ]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const map = new Map<string, BeautyProduct[]>();
    categories.forEach((cat) => {
      map.set(cat.slug, []);
    });

    displayedProducts.forEach((prod) => {
      const slug = prod.categorySlug || 'home-appliances';
      const arr = map.get(slug);
      if (arr) {
        arr.push(prod);
      } else {
        const defaultArr = map.get('home-appliances') || [];
        defaultArr.push(prod);
        map.set('home-appliances', defaultArr);
      }
    });

    return map;
  }, [categories, displayedProducts]);

  return (
    <div className="flex flex-col gap-8 sm:gap-12 pb-10">
      {/* 3) Main Hero Banner */}
      <HeroBanner banner={banner} />

      {/* 4) Four Perks / Value Propositions */}
      <FeatureBadges />

      {/* Search or Filter Active Notice */}
      {searchQ && (
        <div className="bg-[#fdeaf1] border border-[#f7dfe8] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4a2b3d] font-bold">
            <Search className="w-4 h-4 text-[#d94f86]" />
            <span>نتائج البحث عن: "{searchQ}" ({displayedProducts.length} منتج)</span>
          </div>
          <Link
            to="/"
            className="text-xs text-[#d94f86] hover:underline font-bold flex items-center gap-1"
          >
            <span>مسح البحث</span>
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 5) Product Sections */}
      <div id="products" className="flex flex-col gap-10">
        {/* If searching, display search results grid */}
        {searchQ ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#4a2b3d] mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d94f86]" />
              <span>المنتجات المطابقة للبحث</span>
            </h2>
            {displayedProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#f7dfe8] text-[#8a6b7a]">
                <p className="font-bold text-base mb-1 text-[#4a2b3d]">لم نجد أي منتج يطابق بحثك</p>
                <p className="text-xs text-[#8a6b7a]">جرب البحث بكلمات أخرى أو تصفح كل الأقسام</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {displayedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onDirectOrder={onDirectOrder}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Storefront Category Sections with Mobile Sliders & Desktop Grids */
          categories.map((cat) => {
            const catProds = productsByCategory.get(cat.slug) || [];
            if (catProds.length === 0) return null;

            return (
              <CategoryProductSection
                key={cat.id}
                category={cat}
                products={catProds}
                onDirectOrder={onDirectOrder}
              />
            );
          })
        )}
      </div>

      {/* 7) Algerian FAQ Accordion Section */}
      <FaqAccordion />
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { BeautyProduct, ProductCategory } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryProductSectionProps {
  category: ProductCategory;
  products: BeautyProduct[];
  onDirectOrder: (product: BeautyProduct) => void;
}

export const CategoryProductSection: React.FC<CategoryProductSectionProps> = ({
  category,
  products,
  onDirectOrder
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active slide index on horizontal scroll
  const handleScroll = () => {
    if (!scrollRef.current || products.length === 0) return;
    const el = scrollRef.current;
    const scrollLeft = Math.abs(el.scrollLeft);
    const scrollWidth = el.scrollWidth - el.clientWidth;
    
    if (scrollWidth <= 0) {
      setActiveIndex(0);
      return;
    }

    // Determine current index based on scroll progress
    const itemWidth = el.scrollWidth / products.length;
    const rawIndex = Math.round(scrollLeft / itemWidth);
    const clamped = Math.max(0, Math.min(rawIndex, products.length - 1));
    setActiveIndex(clamped);
  };

  const scrollToItem = (idx: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const itemWidth = el.scrollWidth / products.length;
    // Scroll in RTL
    el.scrollTo({
      left: -(idx * itemWidth),
      behavior: 'smooth'
    });
    setActiveIndex(idx);
  };

  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      {/* 5) Section Header: Bold title on right + "مشاهدة الكل" on left with #d94f86 underline */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f7dfe8]">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-[#4a2b3d] flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#d94f86]" />
            <span>{category.name}</span>
          </h2>
          {category.description && (
            <p className="text-xs text-[#8a6b7a] mt-0.5 hidden sm:block">
              {category.description}
            </p>
          )}
        </div>

        {/* "مشاهدة الكل" with underline in identity color #d94f86 */}
        <Link
          to={`/category/${category.slug}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#d94f86] pb-0.5 border-b-2 border-[#d94f86] hover:opacity-80 transition-all group"
        >
          <span>مشاهدة الكل</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 5.b) Mobile Horizontal Slider (scroll-snap, 2 cards visible, 3rd peeking out) */}
      <div className="md:hidden flex flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar pb-2 pt-1 -mx-3.5 px-3.5"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[45vw] min-w-[155px] max-w-[210px] shrink-0 snap-start flex flex-col"
            >
              <ProductCard
                product={product}
                onDirectOrder={onDirectOrder}
              />
            </div>
          ))}
        </div>

        {/* Pagination Dots: Active is elongated rectangle in #d94f86, others are soft rose circles */}
        {products.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {products.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToItem(idx)}
                className={`transition-all duration-300 cursor-pointer ${
                  idx === activeIndex
                    ? 'w-6 h-2 rounded-full bg-[#d94f86]'
                    : 'w-2 h-2 rounded-full bg-[#f7dfe8] hover:bg-[#edd6e0]'
                }`}
                aria-label={`الانتقال إلى المنتج رقم ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5.c) Desktop Grid View (for screen width >= 768px) */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onDirectOrder={onDirectOrder}
          />
        ))}
      </div>
    </section>
  );
};

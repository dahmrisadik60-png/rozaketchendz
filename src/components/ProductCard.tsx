import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { BeautyProduct } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: BeautyProduct;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  product, 
  compact = false 
}) => {
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const favorited = isFavorite(product.id);

  const hasDiscount =
    Boolean(product.originalPrice && product.originalPrice > product.price);

  return (
    <div className="group bg-white rounded-2xl border border-[#f7dfe8] hover:border-[#d94f86]/50 shadow-[0_4px_15px_rgba(217,79,134,0.06)] hover:shadow-[0_8px_25px_rgba(217,79,134,0.18)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative h-full">
      {/* Top badges & Favorite heart */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          {hasDiscount ? (
            <span className="px-2 py-0.5 rounded-lg bg-[#d94f86] text-white text-[10px] sm:text-[11px] font-black tracking-wide shadow-xs">
              PROMO !
            </span>
          ) : product.isFeatured ? (
            <span className="px-2 py-0.5 rounded-lg bg-[#c9a45c] text-white text-[10px] font-bold shadow-xs">
              الأكثر طلباً
            </span>
          ) : <span />}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-colors pointer-events-auto cursor-pointer shadow-xs ${
            favorited
              ? 'bg-[#d94f86] text-white'
              : 'bg-white/90 text-[#8a6b7a] hover:text-[#d94f86] hover:bg-white'
          }`}
          title={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          aria-label="المفضلة"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square bg-[#fff8f5] overflow-hidden shrink-0"
        aria-label={`شاهد تفاصيل ${product.title}`}
      >
        <img
          src={
            product.images[0] ||
            'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-1.webp'
          }
          alt={`${product.title}`}
          width={300}
          height={300}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="eager"
          decoding="async"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-[#4a2b3d]/70 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs">
            نفذ من المخزون
          </div>
        )}
      </Link>

      {/* Content & Details */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-2 text-right">
        <div>
          <div className="flex items-center justify-between text-[10px] text-[#8a6b7a] mb-0.5">
            <span className="text-[#d94f86] font-bold truncate max-w-[80px]">
              {product.brandName || 'Roza Beauty'}
            </span>
            <div className="flex items-center gap-0.5 text-[#f9d784]">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[#4a2b3d] font-bold">{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3
            className="font-bold text-xs sm:text-sm text-[#4a2b3d] hover:text-[#d94f86] transition-colors line-clamp-2 leading-snug min-h-[2.3rem]"
            title={product.title}
          >
            <Link to={`/product/${product.id}`}>{product.title}</Link>
          </h3>
        </div>

        <div className="pt-2 border-t border-[#f7dfe8] flex flex-col gap-2">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-[#8a6b7a] line-through font-semibold leading-none">
                {product.originalPrice?.toLocaleString()} {product.currency || 'د.ج'}
              </span>
            )}
            <span className="text-sm sm:text-base font-black text-[#d94f86] leading-tight">
              {product.price.toLocaleString()} {product.currency || 'د.ج'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-full">
            <Link
              to={`/product/${product.id}`}
              className="flex-1 py-2 sm:py-2.5 px-2.5 rounded-xl bg-[#d94f86] hover:bg-[#c93d78] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs shadow-rose-900/15 active:scale-98 transition-all text-center"
            >
              <span>شاهد التفاصيل</span>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] hover:text-[#d94f86] transition-colors cursor-pointer"
              title="إضافة للسلة"
              aria-label="إضافة للسلة"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

import React, { useState, useEffect, useMemo } from 'react';
import { BeautyProduct } from '../types';
import { Star, CheckCircle2, Sparkles, Check, ShoppingBag, ShoppingCart } from 'lucide-react';
import fassilAlbumProducts from '../data/fassil_products_album.json';

interface ProductDetailsProps {
  product: BeautyProduct;
  onOpenOrderModal: () => void;
  onAddToCart?: () => void;
  showGallery?: boolean;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onOpenOrderModal,
  onAddToCart,
  showGallery = false
}) => {
  // Read full images array from product or look up in fassil_products_album.json
  const productImages = useMemo(() => {
    const cleanTitle = (product.title || '').trim().toLowerCase();
    const albumMatch = (fassilAlbumProducts as Array<{
      title?: string;
      url?: string;
      images?: string[];
      image?: string;
    }>).find((item) => {
      const itemTitle = (item.title || '').trim().toLowerCase();
      if (!itemTitle) return false;
      return (
        itemTitle === cleanTitle ||
        cleanTitle.includes(itemTitle) ||
        itemTitle.includes(cleanTitle) ||
        (product.id && item.url && item.url.includes(product.id))
      );
    });

    const albumImages = albumMatch?.images && Array.isArray(albumMatch.images) && albumMatch.images.length > 0
      ? albumMatch.images
      : (albumMatch?.image ? [albumMatch.image] : []);

    const merged = Array.from(new Set([
      ...(albumImages.length > 0 ? albumImages : []),
      ...(product.images && product.images.length > 0 ? product.images : []),
      ...(product.image ? [product.image] : [])
    ])).filter(Boolean);

    return merged.length > 0 ? merged : [
      'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-1.webp'
    ];
  }, [product]);

  const [selectedImage, setSelectedImage] = useState(productImages[0] || '');

  useEffect(() => {
    if (productImages.length > 0) {
      setSelectedImage(productImages[0]);
    }
  }, [productImages]);

  return (
    <div className="product-detail-container w-full flex flex-col gap-5 text-right">
      
      {/* 1. معروض الصور المضمن (عند التفعيل أو العرض المستقل) */}
      {showGallery && (
        <div className="product-gallery-section flex flex-col gap-3.5 mb-2">
          {/* الصورة الرئيسية الكبيرة */}
          <div className="main-image-view w-full text-center bg-[#fff8f5] rounded-2xl border border-[#f7dfe8] p-3 overflow-hidden shadow-2xs">
            <img 
              src={selectedImage} 
              alt={`${product.title} - صورة المنتج الأصلية | متجر ROZA BEAUTY DZ في الجزائر`} 
              width={400}
              height={400}
              className="w-full max-h-[400px] object-contain rounded-xl mx-auto transition-all duration-300"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* ألبوم الصور المصغرة بالأسفل */}
          {productImages.length > 1 && (
            <div className="thumbnails-gallery flex gap-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
              {productImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`${product.title} - صورة ألبوم ${idx + 1} | أجهزة متجر ROZA BEAUTY DZ`}
                  width={80}
                  height={80}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl cursor-pointer transition-all duration-200 shrink-0 ${
                    selectedImage === imgUrl 
                      ? 'border-2 border-[#d94f86] ring-2 ring-[#d94f86]/30 scale-105 shadow-xs' 
                      : 'border border-[#f7dfe8] opacity-80 hover:opacity-100 hover:border-[#d94f86]'
                  }`}
                  loading="eager"
                  decoding="async"
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Title & Metadata */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8a6b7a] mb-2 font-medium">
          <span className="text-[#d94f86] font-bold">{product.brandName}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-semibold">متوفر للتوصيل الفوري</span>
          <span aria-hidden="true">·</span>
          <span>شحن 69 ولاية</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#4a2b3d] leading-snug tracking-tight">
          {product.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#8a6b7a] mt-1 font-medium">
          {product.tagline}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center text-[#c9a45c]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#c9a45c] text-[#c9a45c]" />
            ))}
          </div>
          <span className="text-xs font-bold text-[#4a2b3d]">{(product.rating || 5.0).toFixed(1)} / 5.0</span>
          <span className="text-xs text-[#8a6b7a]">({product.reviewsCount} تقييم من زبائن في الجزائر)</span>
        </div>
      </div>

      {/* Direct Clear Price Block */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#f7dfe8] shadow-[0_4px_15px_rgba(217,79,134,0.06)] flex items-center justify-between">
        <div>
          <span className="text-xs text-[#8a6b7a] block mb-1 font-medium">السعر الرسمي للجهاز:</span>
          <div className="text-2xl sm:text-3xl font-black text-[#d94f86] tracking-tight">
            {product.price.toLocaleString()} {product.currency}
          </div>
          <span className="text-[11px] text-[#8a6b7a] block mt-0.5">
            الدفع نقداً بعد استلام الجهاز وتفحصه
          </span>
        </div>

        <div className="text-left">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>منتج أصلي 100%</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons: Direct Order + Add To Cart */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onOpenOrderModal}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#e8709b] to-[#c93d78] hover:from-[#d94f86] hover:to-[#b8386d] text-white text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 hover:shadow-xl active:scale-99 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>أطلب الآن - الدفع عند الاستلام</span>
          <Sparkles className="w-4 h-4 text-[#f9d784] animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => onAddToCart ? onAddToCart() : null}
          className="w-full py-3 px-4 rounded-2xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#d94f86] text-sm font-bold flex items-center justify-center gap-2 border border-[#f7dfe8] transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-[#d94f86]" />
          <span>إضافة إلى سلة المشتريات</span>
        </button>
      </div>

      {/* Concise 4 Focused Bullet Points */}
      <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] shadow-xs">
        <h2 className="font-extrabold text-[#4a2b3d] text-sm mb-3.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#d94f86]" />
          <span>{product.keyPointsTitle || 'أهم مميزات الجهاز:'}</span>
        </h2>
        <ul className="flex flex-col gap-3">
          {product.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4a2b3d] leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#d94f86] shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Specifications */}
      <div className="bg-white rounded-2xl border border-[#f7dfe8] overflow-hidden">
        <h2 className="p-3 bg-[#fff8f5] border-b border-[#f7dfe8] font-bold text-xs text-[#4a2b3d]">
          {product.specsTitle || 'المواصفات التقنية الرسمية:'}
        </h2>
        <div className="divide-y divide-[#f7dfe8] text-xs">
          {product.specs.map((spec, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-[#fff8f5]/50">
              <span className="text-[#8a6b7a] font-medium">{spec.label}</span>
              <span className="text-[#4a2b3d] font-bold text-left">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

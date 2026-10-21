import React, { useState, useEffect, useMemo } from 'react';
import { BeautyProduct } from '../types';
import { Star, CheckCircle2, Sparkles, Check, ShoppingBag } from 'lucide-react';
import fassilAlbumProducts from '../data/fassil_products_album.json';

interface ProductDetailsProps {
  product: BeautyProduct;
  onOpenOrderModal: () => void;
  onAddToCart?: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onOpenOrderModal,
}) => {
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
      <div className="product-gallery-section flex flex-col gap-3.5 mb-2">
        <div className="main-image-view w-full text-center bg-[#fff8f5] rounded-2xl border border-[#f7dfe8] p-3 overflow-hidden shadow-2xs">
          <img 
            src={selectedImage} 
            alt={`${product.title}`} 
            width={400}
            height={400}
            className="w-full max-h-[400px] object-contain rounded-xl mx-auto transition-all duration-300"
            loading="eager"
            decoding="async"
          />
        </div>
        {productImages.length > 1 && (
          <div className="thumbnails-gallery flex gap-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
            {productImages.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`${product.title} - صورة ألبوم ${idx + 1}`}
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
      
      <div>
        <div className="flex items-center gap-2 text-xs text-[#8a6b7a] mb-2 font-medium">
          <span className="text-[#d94f86] font-bold">{product.brandName}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-semibold">متوفر للتوصيل الفوري</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#4a2b3d] leading-snug tracking-tight">
          {product.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#8a6b7a] mt-1 font-medium">
          {product.tagline}
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center text-[#c9a45c]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#c9a45c] text-[#c9a45c]" />
            ))}
          </div>
          <span className="text-xs font-bold text-[#4a2b3d]">{(product.rating || 5.0).toFixed(1)} / 5.0</span>
          <span className="text-xs text-[#8a6b7a]">({product.reviewsCount} تقييم)</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#f7dfe8] shadow-[0_4px_15px_rgba(217,79,134,0.06)] flex items-center justify-between">
        <div>
          <span className="text-xs text-[#8a6b7a] block mb-1 font-medium">السعر:</span>
          <div className="text-2xl sm:text-3xl font-black text-[#d94f86] tracking-tight">
            {product.price.toLocaleString()} {product.currency}
          </div>
        </div>
        <div className="text-left">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>منتج أصلي 100%</span>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenOrderModal}
        className="w-full py-4 rounded-xl bg-[#d94f86] hover:bg-[#c93d78] text-white font-black text-lg shadow-lg shadow-rose-950/15 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>أطلب الآن - الدفع عند الاستلام</span>
      </button>

      <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8]">
        <h3 className="font-bold text-[#4a2b3d] text-sm mb-3">
          {product.keyPointsTitle || 'لماذا تختارين هذا المنتج؟'}
        </h3>
        <ul className="space-y-2">
          {product.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#4a2b3d] leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#d94f86] shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8]">
        <h3 className="font-bold text-[#4a2b3d] text-sm mb-3">
          {product.specsTitle || 'المواصفات التقنية:'}
        </h3>
        <div className="space-y-2 text-xs text-[#4a2b3d]">
          {product.specs.map((spec, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#f7dfe8]/50 last:border-0">
              <span className="font-bold text-[#8a6b7a]">{spec.label}:</span>
              <span className="font-medium text-left">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

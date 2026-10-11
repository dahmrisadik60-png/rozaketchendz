import React from 'react';
import { BeautyProduct } from '../types';
import { Star, ShieldCheck, CheckCircle2, Sparkles, Check, ShoppingBag } from 'lucide-react';

interface ProductDetailsProps {
  product: BeautyProduct;
  onOpenOrderModal: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onOpenOrderModal
}) => {
  return (
    <div className="w-full flex flex-col gap-5 text-right">
      
      {/* Title & Metadata (Clean Anti-Slop Discipline) */}
      <div>
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 font-medium">
          <span className="text-rose-600 font-bold">{product.brandName}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-semibold">متوفر للتوصيل الفوري</span>
          <span aria-hidden="true">·</span>
          <span>شحن 58 ولاية</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug tracking-tight">
          {product.title}
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">
          {product.tagline}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-stone-800">{(product.rating || 5.0).toFixed(1)} / 5.0</span>
          <span className="text-xs text-stone-500">({product.reviewsCount} تقييم من زبائن في الجزائر)</span>
        </div>
      </div>

      {/* Direct Clear Price Block (NO BUNDLES / NO OFFERS) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200/90 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-stone-500 block mb-1 font-medium">السعر الرسمي للجهاز:</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            {product.price.toLocaleString()} {product.currency}
          </div>
          <span className="text-[11px] text-stone-500 block mt-0.5">
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

      {/* CTA Button to Open Order Popup Modal */}
      <button
        type="button"
        onClick={onOpenOrderModal}
        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 hover:shadow-xl active:scale-99 transition-all cursor-pointer"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>أطلب الآن - الدفع عند الاستلام</span>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </button>

      {/* Concise 4 Focused Bullet Points (وصف مختصر جداً في 4 نقاط مركزة) */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h3 className="font-extrabold text-stone-900 text-sm mb-3.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>{product.keyPointsTitle || 'أهم مميزات المنتج:'}</span>
        </h3>
        <ul className="flex flex-col gap-3">
          {product.keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Specifications */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-3 bg-stone-50 border-b border-stone-200 font-bold text-xs text-stone-800">
          {product.specsTitle || 'المواصفات التقنية الرسمية:'}
        </div>
        <div className="divide-y divide-stone-100 text-xs">
          {product.specs.map((spec, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-stone-50/50">
              <span className="text-stone-500 font-medium">{spec.label}</span>
              <span className="text-stone-800 font-bold text-left">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guarantee & Verification at Door */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-black text-emerald-950">
            حق المعاينة الكامل عند باب المنزل:
          </span>
          <p className="text-emerald-900 leading-relaxed font-medium">
            {product.guaranteeText}
          </p>
        </div>
      </div>

    </div>
  );
};

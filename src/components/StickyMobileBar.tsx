import React from 'react';
import { ShoppingBag, Sparkles, ShoppingCart } from 'lucide-react';

interface StickyMobileBarProps {
  price: number;
  currency: string;
  onOpenOrderModal: () => void;
  onAddToCart?: () => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  price,
  currency,
  onOpenOrderModal,
  onAddToCart
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#f7dfe8] px-3.5 py-2.5 sm:py-3 shadow-[0_-8px_25px_rgba(217,79,134,0.18)]">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5 text-right">
        {/* Price display */}
        <div className="flex flex-col shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-base sm:text-xl font-black text-[#d94f86] tracking-tight">
              {price.toLocaleString()} {currency}
            </span>
          </div>
          <span className="text-[10px] text-[#8a6b7a] font-medium hidden xs:inline">
            الدفع عند الاستلام
          </span>
        </div>

        {/* Buttons group */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              className="p-3 rounded-xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#d94f86] transition-colors border border-[#f7dfe8] cursor-pointer"
              title="إضافة إلى السلة"
            >
              <ShoppingCart className="w-5 h-5 text-[#d94f86]" />
            </button>
          )}

          {/* Action Button: "أطلب الآن" triggers Popup Modal */}
          <button
            type="button"
            onClick={onOpenOrderModal}
            className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-[#d94f86] hover:bg-[#c93d78] text-white font-black text-sm sm:text-base shadow-md shadow-rose-900/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>أطلب الآن</span>
            <Sparkles className="w-3.5 h-3.5 text-[#f9d784] animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
};

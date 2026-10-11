import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface StickyMobileBarProps {
  price: number;
  currency: string;
  onOpenOrderModal: () => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  price,
  currency,
  onOpenOrderModal
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 px-3.5 py-2.5 sm:py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.12)]">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-right">
        {/* Price display */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-lg sm:text-xl font-black text-red-600 tracking-tight">
              {price.toLocaleString()} {currency}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
            الدفع نقداً بعد المعاينة عند الاستلام
          </span>
        </div>

        {/* Action Button: "أطلب الآن" triggers Popup Modal */}
        <button
          type="button"
          onClick={onOpenOrderModal}
          className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm sm:text-base shadow-md shadow-red-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>أطلب الآن</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        </button>
      </div>
    </div>
  );
};

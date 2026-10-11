import React from 'react';
import { Phone, MessageSquare, ShieldCheck, Truck, Lock, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAdminPrompt: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdminPrompt }) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-200 text-[11px] sm:text-xs py-1.5 px-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium">توصيل متوفر لكافة الـ 58 ولاية • الدفع عند الاستلام</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Phone: 0777413872 */}
            <a
              href="tel:0777413872"
              className="flex items-center gap-1 font-mono font-bold text-white hover:text-rose-300 transition-colors"
              title="اتصال هاتفي مباشر"
            >
              <Phone className="w-3 h-3 text-rose-400" />
              <span>0777413872</span>
            </a>

            {/* Discreet Admin Trigger (No visible text) */}
            <button
              type="button"
              onClick={onOpenAdminPrompt}
              className="text-stone-400 hover:text-stone-200 p-1 rounded transition-colors cursor-pointer opacity-40 hover:opacity-100"
              aria-label="Admin"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Luxury Brand Bar */}
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-500/20">
            R
          </div>
          <div>
            <div className="font-black text-base sm:text-lg text-stone-900 leading-tight flex items-center gap-1.5">
              <span>ROZA BEAUTY DZ</span>
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-[11px] text-rose-700/80 font-medium">
              المتجر الرسمي للأجهزة والجمال في الجزائر
            </div>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/213777413872"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="تواصل عبر الواتساب"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">واتساب</span>
            <span className="font-mono text-[11px]" dir="ltr">0777413872</span>
          </a>

          <a
            href="tel:0777413872"
            className="sm:hidden p-2 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors"
            title="اتصال هاتفي"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};

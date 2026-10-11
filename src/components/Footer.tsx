import React from 'react';
import { Phone, MessageSquare, ShieldCheck, Truck, Sparkles, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdminPrompt: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminPrompt }) => {
  return (
    <footer className="w-full bg-stone-900 text-stone-300 pt-10 pb-24 border-t border-stone-800 text-right mt-16">
      <div className="max-w-3xl mx-auto px-4 flex flex-col gap-8">
        
        {/* Brand & Contact Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-black text-sm">
                R
              </div>
              <span className="text-lg font-black text-white">Roza Beauty DZ</span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              العلامة الجزائرية الموثوقة للأجهزة المنزلية العصرية. أجهزة أصلية مع ضمان الجودة وتوصيل سريع لكافة الـ 58 ولاية.
            </p>
          </div>

          {/* Official Phone Contact: 0777413872 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-stone-400">للاستفسارات والطلب المباشر بالهاتف:</span>
            <div className="flex items-center gap-2">
              <a
                href="tel:0777413872"
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-mono font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-rose-400" />
                <span>0777413872</span>
              </a>

              <a
                href="https://wa.me/213777413872"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white transition-colors"
                title="واتساب 0777413872"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-800/60 border border-stone-800">
            <Truck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">توصيل لـ 58 ولاية</div>
              <div className="text-[11px] text-stone-400 mt-0.5">توصيل سريع لباب المنزل أو لمكتب التوزيع</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-800/60 border border-stone-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">الدفع عند الاستلام 100%</div>
              <div className="text-[11px] text-stone-400 mt-0.5">افحص وتأكد من محتوى الجهاز قبل الدفع</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-800/60 border border-stone-800">
            <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">جهاز أصلي 100%</div>
              <div className="text-[11px] text-stone-400 mt-0.5">ضمان الجودة مع إمكانية المعاينة عند الاستلام</div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-800 text-[11px] text-stone-500">
          <div>
            © {new Date().getFullYear()} Roza Beauty DZ. جميع الحقوق محفوظة.
          </div>
          
          {/* Discreet Admin Lock icon without any visible text */}
          <button
            type="button"
            onClick={onOpenAdminPrompt}
            className="text-stone-500 hover:text-stone-300 p-1 transition-colors cursor-pointer opacity-30 hover:opacity-100"
            aria-label="Admin"
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>

      </div>
    </footer>
  );
};

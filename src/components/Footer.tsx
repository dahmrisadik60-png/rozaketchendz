import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, MessageSquare, ShieldCheck, Truck, RotateCcw, 
  Award, Lock, ChevronLeft 
} from 'lucide-react';
import { ProductCategory } from '../types';
import { subscribeToCategories } from '../services/firebase';
import { DEFAULT_CATEGORIES } from '../data/categories';

interface FooterProps {
  onOpenAdminPrompt: () => void;
  categories?: ProductCategory[];
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminPrompt, categories: initialCategories }) => {
  const [categories, setCategories] = useState<ProductCategory[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      return;
    }

    const unsub = subscribeToCategories((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });

    return () => unsub();
  }, [initialCategories]);

  return (
    <footer className="w-full bg-gradient-to-b from-[#b8386d] via-[#a82f61] to-[#8d204e] text-white pt-12 pb-24 border-t border-[#f7dfe8]/25 text-right mt-16 shadow-[0_-10px_30px_rgba(184,56,109,0.15)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
        
        {/* 4 Guarantees / Store Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10 border-b border-white/15">
          {/* Badge 1: 69 Wilayas */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 hover:border-white/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">توصيل لـ 69 ولاية</div>
              <div className="text-xs text-pink-100/90 mt-1 leading-relaxed">
                توصيل سريع لباب المنزل أو لمكتب التوزيع.
              </div>
            </div>
          </div>

          {/* Badge 2: Cash on Delivery */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 hover:border-white/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">الدفع عند الاستلام</div>
              <div className="text-xs text-pink-100/90 mt-1 leading-relaxed">
                افحص المنتج وتأكد منه قبل الدفع.
              </div>
            </div>
          </div>

          {/* Badge 3: 100% Authentic */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 hover:border-white/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-[#f9d784]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">منتجات أصلية 100%</div>
              <div className="text-xs text-pink-100/90 mt-1 leading-relaxed">
                ضمان الجودة والأصالة لكل منتجاتنا.
              </div>
            </div>
          </div>

          {/* Badge 4: Flexible Return */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 hover:border-white/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">استرجاع مرن</div>
              <div className="text-xs text-pink-100/90 mt-1 leading-relaxed">
                إمكانية الاسترجاع عند المعاينة حسب الشروط.
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/15">
          
          {/* Col 1 & 2: Store Identity & Description */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2.5 inline-flex w-fit">
              <div className="w-9 h-9 rounded-xl bg-white text-[#b8386d] flex items-center justify-center font-black text-base shadow-sm">
                R
              </div>
              <span className="text-xl font-black text-white tracking-tight">Roza Beauty DZ</span>
            </Link>
            <p className="text-xs text-pink-100/90 leading-relaxed mt-1 max-w-md">
              Roza Beauty DZ — المتجر الجزائري المتخصص في الأجهزة المنزلية وأجهزة العناية بالجمال والشعر والبشرة. منتجات أصلية بضمان، وتوصيل سريع لكافة الـ 69 ولاية مع الدفع عند الاستلام.
            </p>
          </div>

          {/* Col 3: Categories Link Column */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>الأقسام</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-pink-100/80 hover:text-white transition-colors flex items-center gap-1 group py-0.5"
                  >
                    <ChevronLeft className="w-3 h-3 text-pink-200/60 group-hover:text-white transition-colors" />
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Links Column */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>روابط سريعة</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="text-pink-100/80 hover:text-white transition-colors flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-pink-200/60 group-hover:text-white transition-colors" />
                  <span>الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#favorites"
                  className="text-pink-100/80 hover:text-white transition-colors flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-pink-200/60 group-hover:text-white transition-colors" />
                  <span>المفضلة</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#cart"
                  className="text-pink-100/80 hover:text-white transition-colors flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-pink-200/60 group-hover:text-white transition-colors" />
                  <span>السلة</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/checkout"
                  className="text-pink-100/80 hover:text-white transition-colors flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-pink-200/60 group-hover:text-white transition-colors" />
                  <span>إتمام الطلب</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact Us Column */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              تواصل معنا
            </h4>
            <p className="text-[11px] text-pink-100/90 mb-3 leading-relaxed">
              للاستفسارات والطلب المباشر بالهاتف أو عبر الواتساب:
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="tel:0777413872"
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-mono font-bold text-xs flex items-center gap-2 transition-colors border border-white/25 w-fit shadow-xs"
                dir="ltr"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                <span>0777413872</span>
              </a>

              <a
                href="https://wa.me/213777413872"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors border border-emerald-400/40 w-fit shadow-xs"
                title="واتساب 0777413872"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>مراسلتنا عبر واتساب</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/15 text-xs text-pink-100/80">
          <div>
            © 2026 Roza Beauty DZ. جميع الحقوق محفوظة.
          </div>
          
          {/* Admin Lock Access Button - Visible and accessible on mobile and desktop */}
          <button
            type="button"
            onClick={onOpenAdminPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="لوحة الإدارة"
            title="لوحة الإدارة"
          >
            <Lock className="w-3.5 h-3.5 text-pink-200" />
            <span>لوحة الإدارة</span>
          </button>
        </div>

      </div>
    </footer>
  );
};

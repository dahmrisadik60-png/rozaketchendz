import React from 'react';
import { ArrowLeft, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { StoreBanner } from '../types';

interface HeroBannerProps {
  banner: StoreBanner;
  onCtaClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ banner, onCtaClick }) => {
  if (!banner.enabled) return null;

  const heroImg = banner.heroImageUrl || banner.imageUrl;
  const shouldShowImage = banner.showHeroImage !== false && Boolean(heroImg);
  const badgeLabel = banner.heroImageBadge || 'PROMO';
  const shouldShowBadge = banner.showImageBadge !== false && Boolean(badgeLabel);

  return (
    <section className="w-full">
      {/* Main Hero Banner: 28px rounded corners, brand rose gradient, translucent inner border, rose shadow */}
      <div className="w-full rounded-[28px] bg-gradient-to-br from-[#e8709b] via-[#d94f86] to-[#c93d78] text-white p-6 sm:p-8 md:p-10 border border-white/30 ring-1 ring-white/15 ring-inset shadow-[0_20px_45px_rgba(217,79,134,0.3)] relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#b8386d]/30 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-10">
          
          {/* 1) Text Block: Right-aligned on desktop in RTL, centered on mobile */}
          <div
            className={`flex flex-col ${
              shouldShowImage
                ? 'order-2 md:order-1 items-center md:items-start text-center md:text-right md:flex-1'
                : 'w-full items-center md:items-start text-center md:text-right max-w-3xl'
            }`}
          >
            {/* Kicker badge with side lines */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 text-white/95 text-xs sm:text-sm font-bold">
              <span className="w-6 sm:w-10 h-[2px] bg-white/40 rounded-full" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f9d784]" />
                <span>{banner.badgeText || 'تخفيضات الموسم'}</span>
              </span>
              <span className="w-6 sm:w-10 h-[2px] bg-white/40 rounded-full" />
            </div>

            {/* Large bold white headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3 leading-tight tracking-tight">
              {banner.title}
            </h1>

            {/* Short paragraph description */}
            <p className="text-xs sm:text-sm md:text-base text-white/95 max-w-xl mt-2.5 sm:mt-3 leading-relaxed">
              {banner.subtitle}
            </p>

            {/* Two Action Buttons: "تسوق الآن" + "اكتشف التصنيفات" */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5 sm:mt-6 w-full max-w-md">
              {/* Button 1: "تسوق الآن" */}
              <a
                href={banner.ctaLink || '#products'}
                onClick={onCtaClick}
                className="flex-1 min-w-[140px] py-3 px-5 rounded-2xl bg-white text-[#c93d78] hover:text-[#b8386d] hover:bg-[#fff8f5] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/15 active:scale-98 transition-all cursor-pointer"
              >
                <span>{banner.ctaText || 'تسوق الآن'}</span>
                <ArrowLeft className="w-4 h-4" />
              </a>

              {/* Button 2: "اكتشف التصنيفات" */}
              <a
                href="#products"
                className="flex-1 min-w-[140px] py-3 px-5 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/35 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-xs active:scale-98 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>اكتشف التصنيفات</span>
              </a>
            </div>

            {/* Reassurance footnote */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4 sm:mt-5 text-[11px] sm:text-xs text-white/90 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>توصيل سريع لكافة الـ 69 ولاية • الدفع عند الاستلام بعد المعاينة</span>
            </div>
          </div>

          {/* 2) Circular Image: Centered on top on mobile (180-220px), Far Left on desktop (260-320px) */}
          {shouldShowImage && (
            <div className="order-1 md:order-2 shrink-0 flex items-center justify-center self-center">
              <div className="relative group">
                {/* Responsive circle sizing */}
                <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden border-4 md:border-[5px] border-white/40 shadow-2xl bg-white/10 mx-auto transition-transform duration-500 group-hover:scale-105">
                  <img
                    src={heroImg}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>

                {/* Decorative highlight badge (e.g. "PROMO") */}
                {shouldShowBadge && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-[#d94f86] font-black text-[11px] sm:text-xs shadow-md tracking-wider whitespace-nowrap">
                    {badgeLabel}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

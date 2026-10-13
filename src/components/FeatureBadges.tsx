import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export const FeatureBadges: React.FC = () => {
  const features = [
    {
      icon: Truck,
      title: 'توصيل سريع',
      description: 'شحن سريع لكافة الـ 69 ولاية لباب المنزل أو للمكتب مع إمكانية التتبع.',
      bgColor: 'bg-[#fdeaf1]',
      iconColor: 'text-[#d94f86]'
    },
    {
      icon: ShieldCheck,
      title: 'منتجات أصلية وبالضمان',
      description: 'ضمان الجودة والأصالة 100% لجميع الأجهزة مع حق المعاينة المسبقة.',
      bgColor: 'bg-[#f4ecf8]',
      iconColor: 'text-[#c93d78]'
    },
    {
      icon: RotateCcw,
      title: 'استرجاع مرن',
      description: 'افحص الطرد وتأكد من محتواه عند الاستلام قبل تسليم المبلغ للموزع.',
      bgColor: 'bg-[#fdeaf1]',
      iconColor: 'text-[#d94f86]'
    },
    {
      icon: Headphones,
      title: 'دعم متواصل',
      description: 'خدمة زبائن ومتابعة هاتفية وعبر الواتساب 0777413872 لمرافقتكم دائماً.',
      bgColor: 'bg-[#f4ecf8]',
      iconColor: 'text-[#c9a45c]'
    }
  ];

  return (
    <section className="w-full">
      {/* 4) Four Perks: 4 warm white rounded cards stacked vertically on mobile, responsive grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-4 gap-3 sm:gap-4">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="w-full p-4 rounded-2xl bg-white border border-[#f7dfe8] shadow-[0_4px_15px_rgba(217,79,134,0.06)] hover:border-[#d94f86]/40 transition-colors flex items-center gap-3.5 text-right"
            >
              {/* Icon inside light tinted box on the right (in RTL) */}
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.iconColor} flex items-center justify-center shrink-0 border border-[#f7dfe8]`}>
                <Icon className="w-6 h-6 stroke-[2]" />
              </div>

              {/* Title & muted description */}
              <div className="flex flex-col">
                <h3 className="font-black text-sm text-[#4a2b3d] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#8a6b7a] font-medium leading-relaxed mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

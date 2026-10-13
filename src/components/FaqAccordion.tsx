import React, { useState } from 'react';
import { HelpCircle, Plus, Minus, MessageCircle, Phone } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'how-to-order',
    question: 'كيفاش نطلب المنتج؟',
    answer: 'الأمر بسيط جداً! اختر المنتج اللي يعجبك واضغط على زر "اشتر الآن"، املأ الاستمارة باسمك ورقم هاتفك وولايتك، وفريق خدمة الزبائن يتصل بيك هاتفياً في غضون وقت قصير لتأكيد طلبك وتفاصيل التوصيل.'
  },
  {
    id: 'payment-method',
    question: 'كيفاش نخلص؟ وهل الدفع مسبق؟',
    answer: 'لا يوجد أي دفع مسبق نهائياً! الدفع نقداً عند الاستلام (يداً بيد). بعد ما يوصلك الموزع إلى باب منزلك أو للمكتب، تستلم طردك وتدفع المبلغ نقداً.'
  },
  {
    id: 'delivery-time',
    question: 'شحال يستغرق التوصيل؟',
    answer: 'التوصيل سريع لكافة الـ 69 ولاية جزائرية! يستغرق عادة بين 24 إلى 48 ساعة للمدن الرئيسية، ومن 48 إلى 72 ساعة للمناطق والولايات البعيدة مع إمكانية تتبع مسار الشحنة.'
  },
  {
    id: 'package-inspection',
    question: 'هل نقدر نفتح ونتأكد من الطرد قبل ما نخلص؟',
    answer: 'نعم بكل تأكيد! من حقك معاينة الطرد والتأكد من سلامة المنتج ومطابقته لطلبك بحضور موزع التوصيل قبل تسليم المبلغ.'
  },
  {
    id: 'product-warranty',
    question: 'هل المنتجات أصلية وفيها ضمان؟',
    answer: 'جميع منتجاتنا وأجهزتنا أصلية 100% ومجربة، ونوفر ضمان الجودة مع إمكانية الاسترجاع أو الاستبدال السريع في حال وجود أي عيب مصنعي.'
  },
  {
    id: 'support-contact',
    question: 'كيفاش نتواصل معاكم إذا احتجت مساعدة أو استفسار؟',
    answer: 'فريق دعم Roza Beauty DZ متواجد لمرافقتك يومياً! يمكنك الاتصال بنا مباشرة على الهاتف 0777413872 أو مراسلتنا عبر الواتساب على نفس الرقم.'
  }
];

export const FaqAccordion: React.FC = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'how-to-order': true
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className="w-full">
      {/* Big card with soft light rose background and rounded corners */}
      <div className="bg-[#fdeaf1]/50 rounded-3xl p-4 sm:p-7 border border-[#f7dfe8] shadow-xs">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdeaf1] text-[#d94f86] border border-[#f7dfe8] text-xs font-black mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إجابات فورية</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#4a2b3d] leading-tight">
            أسئلة يتكررو بزاف
          </h2>
          <p className="text-xs sm:text-sm text-[#8a6b7a] mt-1 max-w-md mx-auto">
            كل ما تحتاجه حول طريقة الطلب، الدفع، التوصيل لكافة الـ 69 ولاية والضمان
          </p>
        </div>

        {/* Questions list */}
        <div className="flex flex-col gap-2.5">
          {FAQ_ITEMS.map((item) => {
            const isOpen = !!openIds[item.id];
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#f7dfe8] overflow-hidden shadow-xs transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-xs sm:text-sm text-[#4a2b3d] leading-snug">
                    {item.question}
                  </span>

                  {/* Circle icon on the left (in RTL) */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isOpen
                        ? 'bg-[#d94f86] text-white shadow-xs'
                        : 'bg-[#fdeaf1] text-[#d94f86] hover:bg-[#f7dfe8]'
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {/* Answer accordion */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#8a6b7a] leading-relaxed border-t border-[#f7dfe8] animate-fadeIn">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct quick contact pill */}
        <div className="mt-5 pt-4 border-t border-[#f7dfe8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8a6b7a]">
          <span className="font-medium">عندك سؤال آخر ما لقيتهش هنا؟</span>
          <div className="flex items-center gap-2">
            <a
              href="tel:0777413872"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#4a2b3d] font-bold border border-[#f7dfe8] hover:border-[#d94f86] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#d94f86]" />
              <span dir="ltr">0777413872</span>
            </a>
            <a
              href="https://wa.me/213777413872"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب مباشر</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

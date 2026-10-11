import React from 'react';
import { Order } from '../types';
import { CheckCircle2, Phone, MessageSquare, X, ShieldCheck } from 'lucide-react';

interface SuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `السلام عليكم، لقد قمت بطلب مصفف الشعر Roza Beauty 5 في 1 برقم الطلب (${order.orderNumber}).\nالاسم: ${order.fullName}\nالهاتف: ${order.phone}\nالولاية: ${order.wilayaName}\nالمبلغ المطلوب: ${order.grandTotal} د.ج`
    );
    window.open(`https://wa.me/213777413872?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-200 text-center relative animate-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold mb-2">
          رقم الطلب: {order.orderNumber}
        </span>

        <h3 className="text-2xl font-black text-stone-900 tracking-tight">
          تم استلام طلبك بنجاح! 🎉
        </h3>
        <p className="text-stone-600 text-xs sm:text-sm mt-1 mb-5">
          شكراً لثقتك بـ Roza Beauty DZ. سنتصل بك على الرقم <span className="font-bold text-stone-900" dir="ltr">{order.phone}</span> لتأكيد موعد وعنوان التوصيل المناسب لك.
        </p>

        {/* Invoice Summary Box */}
        <div className="bg-stone-50 rounded-2xl p-4 text-right border border-stone-200/80 mb-5 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between text-stone-600">
            <span>الاسم واللقب:</span>
            <span className="font-bold text-stone-800">{order.fullName}</span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>عنوان التوصيل:</span>
            <span className="font-bold text-stone-800">{order.wilayaName} - {order.commune}</span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>نوع التوصيل:</span>
            <span className="font-bold text-stone-800">
              {order.deliveryType === 'home' ? 'توصيل لباب المنزل' : 'استلام من مكتب التوصيل'}
            </span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>الكمية:</span>
            <span className="font-bold text-stone-800">{order.quantity} جهاز</span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-stone-900 text-sm font-black">
            <span>المبلغ الإجمالي عند الاستلام:</span>
            <span className="text-rose-600 text-base font-black">
              {order.grandTotal.toLocaleString()} د.ج
            </span>
          </div>
        </div>

        {/* Verification Reminder */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 py-2 px-3 rounded-xl mb-5 border border-emerald-100 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>تذكير: الدفع نقداً بعد فتح الطرد وفحص الجهاز بين يديك!</span>
        </div>

        {/* Contact Support: 0777413872 */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleWhatsAppSupport}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>تأكيد أسرع عبر واتساب (0777413872)</span>
          </button>
          
          <a
            href="tel:0777413872"
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>0777413872</span>
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-stone-400 hover:text-stone-700 underline font-medium cursor-pointer"
        >
          العودة للصفحة الرئيسية
        </button>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { BeautyProduct, DeliveryType, Order } from '../types';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../data/wilayas';
import { TrackingService } from '../services/tracking';
import { createFirestoreOrder } from '../services/firebase';
import { 
  X, Check, ShieldCheck, Home, Building2, 
  Sparkles, AlertCircle, Phone, User, MapPin, 
  Plus, Minus 
} from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: BeautyProduct;
  onSubmitOrder: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmitOrder
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // 16 - Alger
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTrackedInitiate, setHasTrackedInitiate] = useState(false);

  const selectedWilaya = getWilayaByCode(selectedWilayaCode) || ALGERIA_WILAYAS[15];

  // Update communes when wilaya changes
  useEffect(() => {
    if (selectedWilaya && selectedWilaya.communes.length > 0) {
      setSelectedCommune(selectedWilaya.communes[0]);
    } else {
      setSelectedCommune('');
    }
  }, [selectedWilayaCode]);

  // Track InitiateCheckout on open
  useEffect(() => {
    if (isOpen && !hasTrackedInitiate) {
      TrackingService.trackInitiateCheckout({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1
      });
      setHasTrackedInitiate(true);
    }
    if (!isOpen) {
      setHasTrackedInitiate(false);
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const deliveryFee = deliveryType === 'home' 
    ? selectedWilaya.homeDeliveryPrice 
    : selectedWilaya.deskDeliveryPrice;

  const productTotal = product.price * quantity;
  const grandTotal = productTotal + deliveryFee;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanPhone = phone.replace(/[\s-]/g, '');
    const algerianPhoneRegex = /^(00213|\+213|0)(5|6|7)[0-9]{8}$/;
    if (!cleanPhone) {
      newErrors.phone = 'رقم الهاتف مطلوب لتأكيد الطلب';
    } else if (!algerianPhoneRegex.test(cleanPhone)) {
      newErrors.phone = 'يرجى إدخال رقم هاتف جزائري صالح (مثال: 0777413872 أو 0550123456)';
    }

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = 'يرجى إدخال الاسم الكامل';
    }

    if (!selectedCommune.trim()) {
      newErrors.commune = 'يرجى اختيار أو كتابة البلدية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const orderNumber = `RB-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toLocaleString('ar-DZ'),
      fullName: fullName.trim(),
      phone: phone.trim(),
      wilayaCode: selectedWilaya.code,
      wilayaName: selectedWilaya.nameAr,
      commune: selectedCommune.trim(),
      deliveryType,
      deliveryFee,
      productId: product.id,
      productTitle: product.title,
      quantity,
      unitPrice: product.price,
      productTotal,
      grandTotal,
      status: 'new',
      notes: notes.trim()
    };

    // Track Pixel Purchase / Lead
    TrackingService.trackPurchase({
      orderNumber,
      productTitle: product.title,
      productId: product.id,
      grandTotal,
      quantity,
      phone: phone.trim()
    });

    try {
      await createFirestoreOrder(newOrder);
    } catch (err) {
      console.error('Failed to save order to Firestore:', err);
    }

    setIsSubmitting(false);
    onSubmitOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a2b3d]/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-[#f7dfe8] text-right relative animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Close Button */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-[#f7dfe8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8a6b7a] hover:text-[#4a2b3d] hover:bg-[#fdeaf1] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center flex-1 pr-6">
            <h2 className="text-lg sm:text-xl font-black text-[#4a2b3d] tracking-tight">
              للطلب يرجى ملء المعلومات
            </h2>
            <p className="text-[11px] text-[#8a6b7a] font-medium">
              الدفع نقداً عند الاستلام بعد المعاينة والتأكد من الجهاز 🤝
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          
          {/* Product Mini Preview & Quantity */}
          <div className="flex items-center justify-between p-3 bg-[#fdeaf1]/50 rounded-2xl border border-[#f7dfe8]">
            <div className="flex items-center gap-2.5">
              <img 
                src={product.images[0]} 
                alt={product.title} 
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-cover border border-[#f7dfe8]" 
                loading="eager"
                decoding="async"
              />
              <div>
                <div className="text-xs font-bold text-[#4a2b3d] line-clamp-1">{product.title}</div>
                <div className="text-xs font-black text-[#d94f86]">
                  {product.price.toLocaleString()} {product.currency}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-[#f7dfe8]">
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="w-6 h-6 rounded-lg bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] flex items-center justify-center cursor-pointer"
                title="تقليل"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold text-xs text-[#4a2b3d] w-4 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(prev => prev + 1)}
                className="w-6 h-6 rounded-lg bg-[#d94f86] hover:bg-[#c93d78] text-white flex items-center justify-center cursor-pointer"
                title="زيادة"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Field: Phone Number (رقم الهاتف) */}
          <div>
            <label className="block text-xs font-bold text-[#4a2b3d] mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#d94f86]" />
              <span>رقم الهاتف</span>
              <span className="text-[#d94f86]">*</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="05 / 06 / 07 XX XX XX XX"
              className={`w-full px-3.5 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 font-mono text-right text-[#4a2b3d] ${
                errors.phone
                  ? 'border-[#d94f86] bg-[#fdeaf1]/40 focus:ring-[#d94f86]/30'
                  : 'border-[#f7dfe8] bg-[#fff8f5] focus:border-[#d94f86] focus:ring-[#d94f86]/20 focus:bg-white'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-[#c93d78] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Field: Full Name (الاسم الكامل) */}
          <div>
            <label className="block text-xs font-bold text-[#4a2b3d] mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#d94f86]" />
              <span>الاسم الكامل</span>
              <span className="text-[#d94f86]">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              placeholder="مثال: مريم بلقاسم"
              className={`w-full px-3.5 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 text-[#4a2b3d] ${
                errors.fullName
                  ? 'border-[#d94f86] bg-[#fdeaf1]/40 focus:ring-[#d94f86]/30'
                  : 'border-[#f7dfe8] bg-[#fff8f5] focus:border-[#d94f86] focus:ring-[#d94f86]/20 focus:bg-white'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-[#c93d78] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Field: Wilaya (69 wilayas) & Commune */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#d94f86]" />
                <span>الولاية (69 ولاية)</span>
                <span className="text-[#d94f86]">*</span>
              </label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                className="w-full px-3 py-3 rounded-xl border border-[#f7dfe8] bg-[#fff8f5] focus:border-[#d94f86] focus:ring-2 focus:ring-[#d94f86]/20 focus:bg-white text-xs font-semibold text-[#4a2b3d]"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.nameAr} ({w.nameFr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                البلدية <span className="text-[#d94f86]">*</span>
              </label>
              {selectedWilaya.communes && selectedWilaya.communes.length > 0 ? (
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-[#f7dfe8] bg-[#fff8f5] focus:border-[#d94f86] focus:ring-2 focus:ring-[#d94f86]/20 focus:bg-white text-xs font-semibold text-[#4a2b3d]"
                >
                  {selectedWilaya.communes.map((com, idx) => (
                    <option key={idx} value={com}>
                      {com}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  placeholder="اكتبي البلدية"
                  className="w-full px-3 py-3 rounded-xl border border-[#f7dfe8] bg-[#fff8f5] text-xs text-[#4a2b3d] focus:border-[#d94f86] focus:bg-white"
                />
              )}
            </div>
          </div>

          {/* Interactive Delivery Cards: "إلى المنزل" vs "مكتب التوصيل" */}
          <div>
            <label className="block text-xs font-bold text-[#4a2b3d] mb-2">
              طريقة التوصيل:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Card 1: إلى المنزل (خلال 48 ساعة) */}
              <div
                onClick={() => setDeliveryType('home')}
                className={`cursor-pointer rounded-2xl p-3 border-2 flex flex-col justify-between gap-1 transition-all ${
                  deliveryType === 'home'
                    ? 'border-[#d94f86] bg-[#fdeaf1]/40 shadow-xs ring-1 ring-[#d94f86]/30'
                    : 'border-[#f7dfe8] bg-white hover:border-[#edd6e0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Home className={`w-4 h-4 ${deliveryType === 'home' ? 'text-[#d94f86]' : 'text-[#8a6b7a]'}`} />
                    <span className="text-xs font-bold text-[#4a2b3d]">إلى المنزل</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deliveryType === 'home' ? 'border-[#d94f86] bg-[#d94f86] text-white' : 'border-[#edd6e0] bg-white'
                  }`}>
                    {deliveryType === 'home' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[11px] text-[#8a6b7a]">
                  (خلال 48 ساعة)
                </div>

                <div className="mt-1 pt-1 border-t border-[#f7dfe8] text-xs font-extrabold text-[#4a2b3d]">
                  {selectedWilaya.homeDeliveryPrice} {product.currency}
                </div>
              </div>

              {/* Card 2: مكتب التوصيل (خلال 24 ساعة) */}
              <div
                onClick={() => setDeliveryType('desk')}
                className={`cursor-pointer rounded-2xl p-3 border-2 flex flex-col justify-between gap-1 transition-all ${
                  deliveryType === 'desk'
                    ? 'border-[#d94f86] bg-[#fdeaf1]/40 shadow-xs ring-1 ring-[#d94f86]/30'
                    : 'border-[#f7dfe8] bg-white hover:border-[#edd6e0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className={`w-4 h-4 ${deliveryType === 'desk' ? 'text-[#d94f86]' : 'text-[#8a6b7a]'}`} />
                    <span className="text-xs font-bold text-[#4a2b3d]">مكتب التوصيل</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    deliveryType === 'desk' ? 'border-[#d94f86] bg-[#d94f86] text-white' : 'border-[#edd6e0] bg-white'
                  }`}>
                    {deliveryType === 'desk' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[11px] text-[#8a6b7a]">
                  (خلال 24 ساعة)
                </div>

                <div className="mt-1 pt-1 border-t border-[#f7dfe8] text-xs font-extrabold text-[#4a2b3d]">
                  {selectedWilaya.deskDeliveryPrice} {product.currency}
                </div>
              </div>

            </div>
          </div>

          {/* Optional notes */}
          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية أو وقت الاتصال المفضل (اختياري)..."
              className="w-full px-3 py-2 rounded-xl border border-[#f7dfe8] bg-[#fff8f5] text-xs text-[#4a2b3d] focus:outline-none focus:border-[#d94f86] focus:bg-white"
            />
          </div>

          {/* Grand Total Summary Display */}
          <div className="p-3.5 bg-[#fff8f5] rounded-2xl border border-[#f7dfe8] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#4a2b3d] block font-medium">المبلغ الإجمالي المطلوب عند الاستلام:</span>
              <span className="text-[10px] text-[#8a6b7a]">
                (سعر الجهاز: {productTotal.toLocaleString()} + الشحن: {deliveryFee} د.ج)
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#d94f86]">
              {grandTotal.toLocaleString()} {product.currency}
            </div>
          </div>

          {/* Reassurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-100 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>معاينة وتفحص الجهاز قبل دفع أي دينار للموزع!</span>
          </div>

          {/* Rose Purchase Button: "اطمئن واطلب الآن" */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#e8709b] to-[#c93d78] hover:from-[#d94f86] hover:to-[#b8386d] text-white font-black text-base sm:text-lg shadow-lg shadow-rose-900/20 active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري تسجيل طلبك...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#f9d784] animate-pulse" />
                <span>اطمئن واطلب الآن</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold mr-1">
                  {grandTotal.toLocaleString()} {product.currency}
                </span>
              </>
            )}
          </button>

          {/* Support Helpline: 0777413872 */}
          <div className="text-center text-[11px] text-[#8a6b7a] font-medium">
            هل لديك أي استفسار؟ اتصلي بخدمة الزبائن على الرقم:{' '}
            <a href="tel:0777413872" className="text-[#d94f86] font-bold font-mono">
              0777413872
            </a>
          </div>

        </form>
      </div>
    </div>
  );
};

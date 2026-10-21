import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ALGERIA_WILAYAS, getWilayaByCode } from '../data/wilayas';
import { DeliveryType, Order } from '../types';
import { createFirestoreOrder } from '../services/firebase';
import { TrackingService } from '../services/tracking';
import { 
  ShoppingBag, ShieldCheck, MessageSquare, 
  MapPin, User, CheckCircle2 
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal } = useCart();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16);
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  const selectedWilaya = getWilayaByCode(selectedWilayaCode) || ALGERIA_WILAYAS[15];

  useEffect(() => {
    if (selectedWilaya && selectedWilaya.communes.length > 0) {
      setSelectedCommune(selectedWilaya.communes[0]);
    } else {
      setSelectedCommune('');
    }
  }, [selectedWilayaCode]);

  // Track InitiateCheckout
  useEffect(() => {
    if (cart.length > 0) {
      TrackingService.trackInitiateCheckout({
        id: cart[0].product.id,
        title: `Cart (${cart.length} items)`,
        price: subtotal,
        quantity: cart.reduce((s, i) => s + i.quantity, 0)
      });
    }
  }, []);

  const deliveryFee =
    deliveryType === 'home'
      ? selectedWilaya.homeDeliveryPrice
      : selectedWilaya.deskDeliveryPrice;

  const grandTotal = subtotal + deliveryFee;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم واللقب الكامل';
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف للتأكيد';
    } else if (!/^(05|06|07)[0-9]{8}$/.test(cleanPhone)) {
      newErrors.phone = 'رقم غير صحيح (يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام)';
    }
    if (!selectedCommune) {
      newErrors.commune = 'يرجى اختيار البلدية';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderNumber = `RB-${Math.floor(10000 + Math.random() * 90000)}`;

      const orderItems = cart.map((i) => ({
        productId: i.product.id,
        productTitle: i.product.title,
        quantity: i.quantity,
        unitPrice: i.product.price,
        image: i.product.images[0] || ''
      }));

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        createdAt: new Date().toLocaleString('ar-DZ'),
        fullName: fullName.trim(),
        phone: phone.replace(/\s+/g, ''),
        wilayaCode: selectedWilaya.code,
        wilayaName: selectedWilaya.nameAr,
        commune: selectedCommune.trim(),
        deliveryType,
        deliveryFee,
        productId: cart[0].product.id,
        productTitle:
          cart.length === 1
            ? cart[0].product.title
            : `${cart[0].product.title} + ${cart.length - 1} منتجات أخرى`,
        quantity: cart.reduce((s, i) => s + i.quantity, 0),
        unitPrice: cart[0].product.price,
        productTotal: subtotal,
        grandTotal,
        status: 'new',
        notes: address.trim()
          ? `العنوان: ${address.trim()}${notes.trim() ? ' | ' + notes.trim() : ''}`
          : notes.trim(),
        items: orderItems
      };

      // Track Purchase event
      TrackingService.trackPurchase({
        orderNumber,
        productTitle: newOrder.productTitle,
        productId: newOrder.productId,
        grandTotal,
        quantity: newOrder.quantity,
        phone: newOrder.phone
      });

      // Save to Firestore
      try {
        await createFirestoreOrder(newOrder);
      } catch (err) {
        console.error('Error saving order to Firestore:', err);
      }

      setSubmittedOrder(newOrder);
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully submitted
  if (submittedOrder) {
    const whatsappMsg = encodeURIComponent(
      `السلام عليكم، لقد قمت بطلب جديد برقم (${submittedOrder.orderNumber}):\n` +
      `الاسم: ${submittedOrder.fullName}\n` +
      `الهاتف: ${submittedOrder.phone}\n` +
      `الولاية: ${submittedOrder.wilayaName} (${submittedOrder.commune})\n` +
      `المبلغ الإجمالي: ${submittedOrder.grandTotal} د.ج\n` +
      `المنتجات:\n` +
      (submittedOrder.items || [])
        .map((i) => `- ${i.productTitle} (الكمية: ${i.quantity})`)
        .join('\n')
    );

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-right">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#f7dfe8] shadow-xl flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#4a2b3d] mb-2">
              تهانينا! تم تسجيل طلبك بنجاح
            </h1>
            <p className="text-xs sm:text-sm text-[#8a6b7a]">
              رقم طلبك هو:{' '}
              <span className="font-mono font-bold text-[#d94f86] text-base">
                {submittedOrder.orderNumber}
              </span>
            </p>
          </div>

          <div className="w-full bg-[#fff8f5] rounded-2xl p-4 sm:p-5 border border-[#f7dfe8] text-xs sm:text-sm text-right flex flex-col gap-2.5">
            <div className="flex justify-between border-b border-[#f7dfe8] pb-2">
              <span className="text-[#8a6b7a]">الاسم واللقب:</span>
              <span className="font-bold text-[#4a2b3d]">{submittedOrder.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-[#f7dfe8] pb-2">
              <span className="text-[#8a6b7a]">الهاتف:</span>
              <span className="font-mono font-bold text-[#4a2b3d]" dir="ltr">{submittedOrder.phone}</span>
            </div>
            <div className="flex justify-between border-b border-[#f7dfe8] pb-2">
              <span className="text-[#8a6b7a]">مكان التسليم:</span>
              <span className="font-bold text-[#4a2b3d]">{submittedOrder.wilayaName} - {submittedOrder.commune}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm sm:text-base font-black">
              <span className="text-[#4a2b3d]">المبلغ الإجمالي عند الاستلام:</span>
              <span className="text-[#d94f86]">{submittedOrder.grandTotal.toLocaleString()} د.ج</span>
            </div>
          </div>

          <p className="text-xs text-[#8a6b7a] leading-relaxed max-w-md">
            سيتصل بك فريق خدمة زبائن Roza Beauty قريباً على رقم هاتفك لتأكيد الشحن والتسليم. يرجى إبقاء هاتفك مفتوحاً.
          </p>

          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/213777413872?text=${whatsappMsg}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>إرسال تفاصيل الطلب عبر واتساب</span>
            </a>

            <Link
              to="/"
              className="py-3 px-5 rounded-xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-[#f7dfe8]"
            >
              <span>العودة للمتجر</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart empty and not submitted
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#fdeaf1] text-[#d94f86] flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#4a2b3d]">سلتك فارغة حالياً</h2>
        <p className="text-xs text-[#8a6b7a]">
          يرجى إضافة منتجات إلى السلة قبل التوجه إلى صفحة إتمام الطلب.
        </p>
        <Link
          to="/"
          className="py-2.5 px-6 rounded-xl bg-[#d94f86] text-white font-bold text-xs hover:bg-[#c93d78] transition-colors shadow-xs"
        >
          تصفح المنتجات الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-3.5 sm:px-6 text-right pb-24">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#4a2b3d] leading-tight">
          إتمام الطلب - الدفع عند الاستلام
        </h1>
        <p className="text-xs sm:text-sm text-[#8a6b7a] mt-1">
          أدخل معلوماتك بدقة، وسيتصل بك مندوبنا لتأكيد الشحن فوراً
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-5">
          {/* Customer Details Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col gap-4">
            <h2 className="font-bold text-sm text-[#4a2b3d] flex items-center gap-2">
              <User className="w-4 h-4 text-[#d94f86]" />
              <span>المعلومات الشخصية</span>
            </h2>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                الاسم واللقب الكامل <span className="text-[#d94f86]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="مثال: أمينة بوعلام"
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.fullName
                    ? 'border-[#d94f86] focus:ring-[#d94f86]/30'
                    : 'border-[#f7dfe8] focus:border-[#d94f86] focus:ring-[#d94f86]/20'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-[#c93d78] mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                رقم الهاتف (للتأكيد والتوصيل) <span className="text-[#d94f86]">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="مثال: 0777413872"
                dir="ltr"
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:outline-none focus:ring-2 font-mono text-right ${
                  errors.phone
                    ? 'border-[#d94f86] focus:ring-[#d94f86]/30'
                    : 'border-[#f7dfe8] focus:border-[#d94f86] focus:ring-[#d94f86]/20'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-[#c93d78] mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Shipping Address Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col gap-4">
            <h2 className="font-bold text-sm text-[#4a2b3d] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#d94f86]" />
              <span>عنوان التوصيل (69 ولاية)</span>
            </h2>

            {/* Wilaya Selection */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                الولاية <span className="text-[#d94f86]">*</span>
              </label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-[#f7dfe8] text-xs sm:text-sm text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Commune Selection */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                البلدية <span className="text-[#d94f86]">*</span>
              </label>
              <select
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#f7dfe8] text-xs sm:text-sm text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none"
              >
                {selectedWilaya.communes.map((comm) => (
                  <option key={comm} value={comm}>
                    {comm}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                العنوان التفصيلي / الحي
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="اسم الحي أو الشارع أو المعلم القريب"
                className="w-full p-3 rounded-xl border border-[#f7dfe8] text-xs sm:text-sm text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none"
              />
            </div>

            {/* Delivery Type (Home or Desk) */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-2">
                طريقة الاستلام:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    deliveryType === 'home'
                      ? 'border-[#d94f86] bg-[#fdeaf1]/60 ring-2 ring-[#d94f86]/20'
                      : 'border-[#f7dfe8] bg-white hover:bg-[#fff8f5]'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === 'home'}
                    onChange={() => setDeliveryType('home')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#4a2b3d]">توصيل للبيت</span>
                    <span className="font-black text-xs text-[#d94f86]">
                      {selectedWilaya.homeDeliveryPrice} د.ج
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8a6b7a]">حتى باب منزلك</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    deliveryType === 'desk'
                      ? 'border-[#d94f86] bg-[#fdeaf1]/60 ring-2 ring-[#d94f86]/20'
                      : 'border-[#f7dfe8] bg-white hover:bg-[#fff8f5]'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === 'desk'}
                    onChange={() => setDeliveryType('desk')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#4a2b3d]">استلام من المكتب</span>
                    <span className="font-black text-xs text-[#d94f86]">
                      {selectedWilaya.deskDeliveryPrice} د.ج
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8a6b7a]">مكتب التوصيل بالولاية</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                ملاحظات إضافية للموزع (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة"
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs text-[#4a2b3d] bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#e8709b] to-[#c93d78] hover:from-[#d94f86] hover:to-[#b8386d] disabled:opacity-50 text-white font-black text-base shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <span>جاري تسجيل الطلب...</span>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>تأكيد الطلب والدفع عند الاستلام ({grandTotal.toLocaleString()} د.ج)</span>
              </>
            )}
          </button>
        </form>

        {/* Order Summary Column */}
        <aside className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col gap-4 sticky top-24">
          <h2 className="font-bold text-sm text-[#4a2b3d] border-b border-[#f7dfe8] pb-3">
            ملخص السلة ({cart.reduce((s, i) => s + i.quantity, 0)} منتج)
          </h2>

          <div className="divide-y divide-[#f7dfe8] max-h-80 overflow-y-auto">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="py-2.5 flex items-center gap-3">
                <img
                  src={product.images[0] || ''}
                  alt={product.title}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-xl object-cover bg-[#fff8f5] shrink-0 border border-[#f7dfe8]"
                  loading="eager"
                  decoding="async"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-[#4a2b3d] truncate">
                    {product.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#8a6b7a] mt-1">
                    <span>الكمية: {quantity}</span>
                    <span className="font-bold text-[#d94f86]">
                      {(product.price * quantity).toLocaleString()} د.ج
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#f7dfe8] flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-[#8a6b7a]">
              <span>المجموع الجزئي للمنتجات:</span>
              <span className="font-bold text-[#4a2b3d]">{subtotal.toLocaleString()} د.ج</span>
            </div>
            <div className="flex justify-between text-[#8a6b7a]">
              <span>تكلفة الشحن ({selectedWilaya.nameAr}):</span>
              <span className="font-bold text-[#4a2b3d]">{deliveryFee.toLocaleString()} د.ج</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#f7dfe8] text-sm sm:text-base font-black text-[#4a2b3d]">
              <span>المبلغ الإجمالي للدفع:</span>
              <span className="text-[#d94f86]">{grandTotal.toLocaleString()} د.ج</span>
            </div>
          </div>

          {/* Algerian Trust Badge */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-emerald-900">
              <span className="font-bold block">ضمان المعاينة قبل الدفع:</span>
              <span>يمكنك فتح الطرد والتأكد من المنتجات بالكامل قبل تسليم المبلغ لموزع التوصيل.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

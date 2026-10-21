import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#4a2b3d]/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 text-right border-l border-[#f7dfe8] animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#f7dfe8] flex items-center justify-between bg-[#fff8f5]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-black text-[#4a2b3d]">
              سلة المشتريات ({totalItems})
            </h2>
          </div>
          <span className="text-xs text-[#d94f86] font-bold bg-[#fdeaf1] px-2 py-1 rounded-lg border border-[#f7dfe8]">
            توصيل لـ 69 ولاية
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#f7dfe8]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8a6b7a]">
              <div className="w-16 h-16 rounded-full bg-[#fdeaf1] text-[#d94f86] flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-[#4a2b3d] mb-1">سلتك فارغة حالياً</h3>
              <p className="text-xs text-[#8a6b7a] max-w-xs mb-5">
                تصفح أفضل منتجات وأجهزة Roza Beauty DZ الأصلية وأضف ما يعجبك!
              </p>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#d94f86] text-white text-xs font-bold hover:bg-[#c93d78] transition-colors shadow-xs cursor-pointer"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div key={product.id} className="py-3.5 flex items-start gap-3">
                {/* Product Thumbnail */}
                <img
                  src={product.images[0] || ''}
                  alt={product.title}
                  width={72}
                  height={72}
                  className="w-18 h-18 rounded-xl object-cover bg-[#fff8f5] border border-[#f7dfe8] shrink-0"
                  loading="eager"
                  decoding="async"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => setIsCartDrawerOpen(false)}
                      className="font-bold text-xs sm:text-sm text-[#4a2b3d] hover:text-[#d94f86] line-clamp-2 leading-tight"
                    >
                      {product.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="text-[#8a6b7a] hover:text-[#c93d78] p-1 transition-colors shrink-0 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-xs sm:text-sm text-[#d94f86]">
                      {(product.price * quantity).toLocaleString()} {product.currency || 'د.ج'}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-[#fdeaf1] rounded-xl p-0.5 border border-[#f7dfe8]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#4a2b3d] hover:bg-[#fff8f5] shadow-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-[#4a2b3d]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#4a2b3d] hover:bg-[#fff8f5] shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#f7dfe8] bg-[#fff8f5] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#8a6b7a]">المجموع الجزئي:</span>
              <span className="font-black text-base sm:text-lg text-[#4a2b3d]">
                {subtotal.toLocaleString()} د.ج
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8a6b7a]">
              <span>مصاريف التوصيل:</span>
              <span>تُحسب في الخطوة التالية حسب الولاية</span>
            </div>

            <Link
              to="/checkout"
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#e8709b] to-[#c93d78] hover:from-[#d94f86] hover:to-[#b8386d] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-rose-900/20 transition-all text-center active:scale-98"
            >
              <span>إتمام الطلب والدفع عند الاستلام</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="text-center text-xs text-[#8a6b7a] hover:text-[#4a2b3d] font-medium py-1 cursor-pointer"
            >
              متابعة التسوق
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

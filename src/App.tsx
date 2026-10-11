import React, { useState, useEffect } from 'react';
import { BeautyProduct, Order, CustomerReview } from './types';
import { 
  getStoredProduct, 
  getStoredOrders, 
  saveOrder, 
  saveStoredProduct, 
  getStoredReviews, 
  saveStoredReviews 
} from './services/storage';
import { TrackingService, initPixels } from './services/tracking';
import { Header } from './components/Header';
import { ImageGallery } from './components/ImageGallery';
import { ProductDetails } from './components/ProductDetails';
import { CustomerReviews } from './components/CustomerReviews';
import { OrderModal } from './components/OrderModal';
import { StickyMobileBar } from './components/StickyMobileBar';
import { AdminModal } from './components/AdminModal';
import { SuccessModal } from './components/SuccessModal';
import { Footer } from './components/Footer';

export default function App() {
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadedProduct = getStoredProduct();
    const loadedOrders = getStoredOrders();
    const loadedReviews = getStoredReviews();
    setProduct(loadedProduct);
    setOrders(loadedOrders);
    setReviews(loadedReviews);

    // Initialize Pixels
    initPixels();
    TrackingService.trackPageView('RozaBeauty_LandingPage');

    if (loadedProduct) {
      TrackingService.trackViewContent({
        id: loadedProduct.id,
        title: loadedProduct.title,
        price: loadedProduct.price,
        currency: loadedProduct.currency
      });
    }
  }, []);

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmitted = (newOrder: Order) => {
    const updated = saveOrder(newOrder);
    setOrders(updated);
    setCompletedOrder(newOrder);
  };

  const handleProductUpdated = (updated: BeautyProduct) => {
    setProduct(updated);
    saveStoredProduct(updated);
  };

  const handleReviewsUpdated = (updated: CustomerReview[]) => {
    setReviews(updated);
    saveStoredReviews(updated);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans antialiased flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Official Header (PIN protected admin access, contact 0777413872) */}
      <Header onOpenAdminPrompt={() => setIsAdminOpen(true)} />

      {/* Main Container - Mobile First layout */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex flex-col gap-8">
        
        {/* Top Product Showcase (Gallery + Details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7 items-start">
          {/* Smart Responsive Image Engine */}
          <div className="w-full sticky md:top-20">
            <ImageGallery
              images={product.images}
              productTitle={product.title}
            />
          </div>

          {/* Product Details (Direct price, 4 concise points & "أطلب الآن" CTA) */}
          <div className="w-full">
            <ProductDetails
              product={product}
              onOpenOrderModal={handleOpenOrderModal}
            />
          </div>
        </div>

        {/* Customer Reviews Section in Algerian Darija (Dynamic Live Sync) */}
        <div className="w-full pt-4 border-t border-rose-100/80">
          <CustomerReviews reviews={reviews} />
        </div>

      </main>

      {/* Sticky Mobile Bar with "أطلب الآن" opening the Order Popup Modal */}
      <StickyMobileBar
        price={product.price}
        currency={product.currency}
        onOpenOrderModal={handleOpenOrderModal}
      />

      {/* Popup Order Modal ("للطلب يرجى ملء المعلومات") */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={product}
        onSubmitOrder={handleOrderSubmitted}
      />

      {/* Success Modal upon order completion */}
      <SuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      {/* Admin Dashboard Protected by PIN 2009 with Dynamic Product & Reviews Manager */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        product={product}
        onProductUpdated={handleProductUpdated}
        orders={orders}
        onOrdersUpdated={(updated) => setOrders(updated)}
        reviews={reviews}
        onReviewsUpdated={handleReviewsUpdated}
      />

      {/* Official Footer with 0777413872 contact & 58 wilayas coverage */}
      <Footer onOpenAdminPrompt={() => setIsAdminOpen(true)} />
    </div>
  );
}

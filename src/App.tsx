import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  BeautyProduct, 
  Order, 
  CustomerReview, 
  ProductCategory, 
  StoreBanner 
} from './types';
import { 
  getStoredProduct, 
  getStoredOrders, 
  saveStoredProduct, 
  getStoredReviews, 
  saveStoredReviews 
} from './services/storage';
import { TrackingService, initPixels, setRuntimePixelConfig } from './services/tracking';
import { 
  subscribeToProduct, 
  subscribeToReviews, 
  subscribeToPixelConfig,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToBanner,
  runStorefrontMigration
} from './services/firebase';
import { CartProvider } from './context/CartProvider';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { OrderModal } from './components/OrderModal';
import { SuccessModal } from './components/SuccessModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CategoryPage } from './pages/CategoryPage';
import { CheckoutPage } from './pages/CheckoutPage';

import { DEFAULT_CATEGORIES, DEFAULT_BANNER } from './data/categories';
import { ROZA_BEAUTY_PRODUCT } from './data/products';

export default function App() {
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [productsList, setProductsList] = useState<BeautyProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [banner, setBanner] = useState<StoreBanner>(DEFAULT_BANNER);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  // Direct buy popup modal state (same behavior as before)
  const [modalProduct, setModalProduct] = useState<BeautyProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Admin Modal (opens via Footer Lock, Header Lock, Drawer, or /admin URL)
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/admin' || window.location.hash === '#admin';
  });

  useEffect(() => {
    const handleUrlCheck = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, []);

  useEffect(() => {
    // 1. Initial local load
    const loadedProduct = getStoredProduct();
    const loadedOrders = getStoredOrders();
    const loadedReviews = getStoredReviews();
    setProduct(loadedProduct);
    setOrders(loadedOrders);
    setReviews(loadedReviews);

    // Initial products fallback with loaded product
    if (loadedProduct) {
      setProductsList([loadedProduct]);
    }

    // 2. Initialize Pixels
    initPixels();
    TrackingService.trackPageView('RozaBeauty_Home');

    // 3. Automatic 1-time migration if products collection is empty
    runStorefrontMigration();

    // 4. Live sync from Firestore
    const unsubProduct = subscribeToProduct((firestoreProduct) => {
      setProduct(firestoreProduct);
      saveStoredProduct(firestoreProduct);
    });

    const unsubProducts = subscribeToProducts((allProds) => {
      if (allProds.length > 0) {
        setProductsList(allProds);
      }
    });

    const unsubCategories = subscribeToCategories((allCats) => {
      if (allCats.length > 0) {
        setCategories(allCats);
      }
    });

    const unsubBanner = subscribeToBanner((b) => {
      setBanner(b);
    });

    const unsubReviews = subscribeToReviews((firestoreReviews) => {
      setReviews(firestoreReviews);
      saveStoredReviews(firestoreReviews);
    });

    const unsubPixels = subscribeToPixelConfig((firestorePixels) => {
      setRuntimePixelConfig(firestorePixels);
    });

    return () => {
      unsubProduct();
      unsubProducts();
      unsubCategories();
      unsubBanner();
      unsubReviews();
      unsubPixels();
    };
  }, []);

  const handleOpenDirectOrder = (targetProduct: BeautyProduct) => {
    setModalProduct(targetProduct);
    setIsOrderModalOpen(true);
  };

  const handleOrderSubmitted = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
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

  const activeProduct = product || ROZA_BEAUTY_PRODUCT;
  const currentCatalog = productsList.length > 0 ? productsList : [activeProduct];

  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-[#fff8f5] text-[#4a2b3d] font-sans antialiased flex flex-col selection:bg-[#d94f86] selection:text-white">
          {/* Official Header with Search, Cart Counter, Favorites, 0777413872 */}
          <Header
            onOpenAdminPrompt={() => setIsAdminOpen(true)}
            categories={categories}
          />

          {/* Slideout Cart Drawer */}
          <CartDrawer />

          {/* Main App Container */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6">
            <Routes>
              {/* Home Page: Hero Banner, 4 Perks, Categories & Products Grid */}
              <Route
                path="/"
                element={
                  <HomePage
                    products={currentCatalog}
                    categories={categories}
                    banner={banner}
                    onDirectOrder={handleOpenDirectOrder}
                  />
                }
              />

              {/* Dynamic Product Page: Exact design of original landing page, dynamic for any id */}
              <Route
                path="/product/:id"
                element={
                  <ProductPage
                    products={currentCatalog}
                    reviews={reviews}
                    onOpenOrderModal={handleOpenDirectOrder}
                  />
                }
              />

              {/* Category Page with sorting & price filter */}
              <Route
                path="/category/:slug"
                element={
                  <CategoryPage
                    products={currentCatalog}
                    categories={categories}
                    onDirectOrder={handleOpenDirectOrder}
                  />
                }
              />

              {/* Checkout Page: 69 wilayas, order notes, WhatsApp thank-you confirmation */}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Admin Direct Route: opens AdminModal directly on /admin */}
              <Route
                path="/admin"
                element={
                  <HomePage
                    products={currentCatalog}
                    categories={categories}
                    banner={banner}
                    onDirectOrder={handleOpenDirectOrder}
                  />
                }
              />

              {/* Catch-all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Direct Buy Popup Modal ("أطلب الآن" maintains exact original behavior) */}
          {modalProduct && (
            <OrderModal
              isOpen={isOrderModalOpen}
              onClose={() => setIsOrderModalOpen(false)}
              product={modalProduct}
              onSubmitOrder={handleOrderSubmitted}
            />
          )}

          {/* Success Confirmation Modal */}
          <SuccessModal
            order={completedOrder}
            onClose={() => setCompletedOrder(null)}
          />

          {/* Admin Dashboard (PIN 2009 + Google Auth dahmrisadik60@gmail.com) */}
          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => {
              setIsAdminOpen(false);
              if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
                window.history.replaceState(null, '', '/');
              }
            }}
            product={activeProduct}
            onProductUpdated={handleProductUpdated}
            orders={orders}
            onOrdersUpdated={(updated) => setOrders(updated)}
            reviews={reviews}
            onReviewsUpdated={handleReviewsUpdated}
            products={currentCatalog}
            categories={categories}
            banner={banner}
          />

          {/* Official Footer with 0777413872 contact & 69 wilayas */}
          <Footer 
            onOpenAdminPrompt={() => setIsAdminOpen(true)} 
            categories={categories}
          />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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
  saveStoredReviews,
  getStoredCatalogProducts,
  saveStoredCatalogProducts,
  getStoredCategories,
  saveStoredCategories
} from './services/storage';
import { TrackingService, initPixels, setRuntimePixelConfig, initTrafficSource } from './services/tracking';
import { 
  subscribeToProduct, 
  subscribeToReviews, 
  subscribeToPixelConfig,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToBanner,
  saveReviewsToFirestore,
  runStorefrontMigration
} from './services/firebase';
import { CartProvider } from './context/CartProvider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Core Home Page remains eagerly loaded for instant initial render
import { HomePage } from './pages/HomePage';

// Lazy-loaded secondary pages and modals for optimal initial bundle size and speed
const ProductPage = lazy(() => import('./pages/ProductPage').then(m => ({ default: m.ProductPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const OrderModal = lazy(() => import('./components/OrderModal').then(m => ({ default: m.OrderModal })));
const SuccessModal = lazy(() => import('./components/SuccessModal').then(m => ({ default: m.SuccessModal })));
const AdminModal = lazy(() => import('./components/AdminModal').then(m => ({ default: m.AdminModal })));

import { DEFAULT_CATEGORIES, DEFAULT_BANNER } from './data/categories';
import { ROZA_BEAUTY_PRODUCT } from './data/products';
import { FASSIL_STORE_PRODUCTS } from './data/fassilCatalog';

export default function App() {
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [productsList, setProductsList] = useState<BeautyProduct[]>(() => {
    return getStoredCatalogProducts();
  });
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const stored = getStoredCategories();
    return stored.length > 0 ? stored : DEFAULT_CATEGORIES;
  });
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

    // Initial products fallback: keep stored catalog products if any exist
    const storedCatalog = getStoredCatalogProducts();
    if (storedCatalog && storedCatalog.length > 0) {
      setProductsList(storedCatalog);
    } else if (loadedProduct) {
      setProductsList([loadedProduct]);
      saveStoredCatalogProducts([loadedProduct]);
    }

    // 2. Initialize Traffic Source (UTM) & Pixels
    initTrafficSource();
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
        saveStoredCatalogProducts(allProds);
      } else if (localStorage.getItem('roza_catalog_cleared') === 'true') {
        setProductsList([]);
        saveStoredCatalogProducts([]);
      }
    });

    const unsubCategories = subscribeToCategories((allCats) => {
      if (allCats.length > 0) {
        setCategories(allCats);
        saveStoredCategories(allCats);
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

  const handleOpenDirectOrder = useCallback((targetProduct: BeautyProduct) => {
    setModalProduct(targetProduct);
    setIsOrderModalOpen(true);
  }, []);

  const handleOrderSubmitted = useCallback((newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCompletedOrder(newOrder);
  }, []);

  const handleProductUpdated = useCallback((updated: BeautyProduct) => {
    setProduct(updated);
    saveStoredProduct(updated);
  }, []);

  const handleReviewsUpdated = useCallback((updated: CustomerReview[]) => {
    setReviews(updated);
    saveStoredReviews(updated);
  }, []);

  const handleAddReview = useCallback((newReview: CustomerReview) => {
    setReviews((prev) => {
      const updated = [newReview, ...prev];
      saveStoredReviews(updated);
      saveReviewsToFirestore(updated).catch((err) => {
        console.warn('Reviews cloud sync notice:', err);
      });
      return updated;
    });
  }, []);

  const handleCatalogUpdated = useCallback((updated: BeautyProduct[]) => {
    setProductsList(updated);
    saveStoredCatalogProducts(updated);
  }, []);

  const handleCategoriesUpdated = useCallback((updated: ProductCategory[]) => {
    setCategories(updated);
    saveStoredCategories(updated);
  }, []);

  const activeProduct = product || ROZA_BEAUTY_PRODUCT;
  // The categorized fassil.shop catalog (src/data/fassilProducts.json) ships with the site:
  // products already saved in Firestore win, the rest are added automatically.
  const currentCatalog = productsList;

  // Same for categories: make sure every default category exists even if Firestore has an older list
  const currentCategories = useMemo(() => {
    const slugs = new Set(categories.map((c) => c.slug));
    return [...categories, ...DEFAULT_CATEGORIES.filter((c) => !slugs.has(c.slug))];
  }, [categories]);

  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-[#fff8f5] text-[#4a2b3d] font-sans antialiased flex flex-col selection:bg-[#d94f86] selection:text-white">
          {/* Official Header with Search, Cart Counter, Favorites, 0777413872 */}
          <Header
            onOpenAdminPrompt={() => setIsAdminOpen(true)}
            categories={currentCategories}
          />

          {/* Slideout Cart Drawer */}
          <Suspense fallback={null}>
            <CartDrawer />
          </Suspense>

          {/* Main App Container */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6">
            <Suspense fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
                <div className="w-10 h-10 border-3 border-[#f7dfe8] border-t-[#d94f86] rounded-full animate-spin" />
              </div>
            }>
              <Routes>
                {/* Home Page: Hero Banner, 4 Perks, Categories & Products Grid */}
                <Route
                  path="/"
                  element={
                    <HomePage
                      products={currentCatalog}
                      categories={currentCategories}
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
                      onAddReview={handleAddReview}
                    />
                  }
                />

                {/* Category Page with sorting & price filter */}
                <Route
                  path="/category/:slug"
                  element={
                    <CategoryPage
                      products={currentCatalog}
                      categories={currentCategories}
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
                      categories={currentCategories}
                      banner={banner}
                      onDirectOrder={handleOpenDirectOrder}
                    />
                  }
                />

                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>

          {/* Direct Buy Popup Modal ("أطلب الآن" maintains exact original behavior) */}
          {modalProduct && (
            <Suspense fallback={null}>
              <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                product={modalProduct}
                onSubmitOrder={handleOrderSubmitted}
              />
            </Suspense>
          )}

          {/* Success Confirmation Modal */}
          {completedOrder && (
            <Suspense fallback={null}>
              <SuccessModal
                order={completedOrder}
                onClose={() => setCompletedOrder(null)}
              />
            </Suspense>
          )}

          {/* Admin Dashboard (PIN 2009 + Google Auth dahmrisadik60@gmail.com) */}
          {isAdminOpen && (
            <Suspense fallback={null}>
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
                onProductsUpdated={handleCatalogUpdated}
                categories={currentCategories}
                onCategoriesUpdated={handleCategoriesUpdated}
                banner={banner}
              />
            </Suspense>
          )}

          {/* Official Footer with 0777413872 contact & 69 wilayas */}
          <Footer 
            onOpenAdminPrompt={() => setIsAdminOpen(true)} 
            categories={currentCategories}
          />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

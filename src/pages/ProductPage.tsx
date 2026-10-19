import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BeautyProduct, CustomerReview } from '../types';
import { ImageGallery } from '../components/ImageGallery';
import { ProductDetails } from '../components/ProductDetails';
import { CustomerReviews } from '../components/CustomerReviews';
import { StickyMobileBar } from '../components/StickyMobileBar';
import { ProductCard } from '../components/ProductCard';
import { TrackingService } from '../services/tracking';
import { useCart } from '../context/CartContext';
import { Sparkles } from 'lucide-react';
import { ProductSeo } from '../components/ProductSeo';
import fassilAlbumProducts from '../data/fassil_products_album.json';

interface ProductPageProps {
  products: BeautyProduct[];
  reviews: CustomerReview[];
  onOpenOrderModal: (product: BeautyProduct) => void;
  onAddReview?: (review: CustomerReview) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  products,
  reviews,
  onOpenOrderModal,
  onAddReview
}) => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  // Find target product by id and enrich with full images array from fassil_products_album.json
  const product = useMemo(() => {
    const rawProd = products.find((p) => p.id === id) || products[0];
    if (!rawProd) return null;

    // Look for matching product in album JSON by title or URL or id
    const cleanTitle = (rawProd.title || '').trim().toLowerCase();
    const albumMatch = (fassilAlbumProducts as Array<{
      title?: string;
      url?: string;
      images?: string[];
      image?: string;
    }>).find((item) => {
      const itemTitle = (item.title || '').trim().toLowerCase();
      if (!itemTitle) return false;
      return (
        itemTitle === cleanTitle ||
        cleanTitle.includes(itemTitle) ||
        itemTitle.includes(cleanTitle) ||
        (rawProd.id && item.url && item.url.includes(rawProd.id))
      );
    });

    const albumImages = albumMatch?.images && Array.isArray(albumMatch.images) && albumMatch.images.length > 0
      ? albumMatch.images
      : (albumMatch?.image ? [albumMatch.image] : []);

    const combinedImages = Array.from(new Set([
      ...(albumImages.length > 0 ? albumImages : []),
      ...(rawProd.images && Array.isArray(rawProd.images) ? rawProd.images : []),
      ...(rawProd.image ? [rawProd.image] : [])
    ])).filter(Boolean);

    return {
      ...rawProd,
      images: combinedImages.length > 0 ? combinedImages : (rawProd.images || [])
    };
  }, [products, id]);

  // Similar products in same category (excluding current)
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.isVisible !== false)
      .slice(0, 4);
  }, [products, product]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      TrackingService.trackViewContent({
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency
      });
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <p className="text-[#8a6b7a] font-bold mb-4">جاري تحميل بيانات المنتج...</p>
        <Link to="/" className="text-[#d94f86] font-bold hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Dynamic SEO Meta Tags & Schema.org JSON-LD Structured Data */}
      <ProductSeo product={product} />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#8a6b7a]">
        <Link to="/" className="hover:text-[#d94f86] transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        {product.categorySlug && (
          <>
            <Link
              to={`/category/${product.categorySlug}`}
              className="hover:text-[#d94f86] transition-colors"
            >
              {product.categoryName || 'الأقسام'}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#4a2b3d] font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-start">
        {/* Responsive Image Gallery */}
        <div className="w-full sticky md:top-24">
          <ImageGallery
            images={product.images}
            productTitle={product.title}
          />
        </div>

        {/* Product Details & Actions */}
        <div className="w-full">
          <ProductDetails
            product={product}
            onOpenOrderModal={() => onOpenOrderModal(product)}
            onAddToCart={() => addToCart(product, 1)}
          />
        </div>
      </div>

      {/* Customer Reviews Section with Interactive Submission */}
      <div className="w-full pt-8 border-t border-[#f7dfe8]">
        <CustomerReviews 
          reviews={reviews} 
          productId={product.id}
          onAddReview={onAddReview}
        />
      </div>

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <section className="w-full pt-8 border-t border-[#f7dfe8] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-black text-[#4a2b3d] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d94f86]" />
              <span>منتجات مقترحة قد تعجبك</span>
            </h2>
            <Link
              to="/"
              className="text-xs sm:text-sm font-bold text-[#d94f86] hover:underline"
            >
              عرض كل المنتجات
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onDirectOrder={() => onOpenOrderModal(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Bar for this product */}
      <StickyMobileBar
        price={product.price}
        currency={product.currency}
        onOpenOrderModal={() => onOpenOrderModal(product)}
        onAddToCart={() => addToCart(product, 1)}
      />
    </div>
  );
};

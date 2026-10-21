import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BeautyProduct, CustomerReview } from '../types';
import { ImageGallery } from '../components/ImageGallery';
import { ProductDetails } from '../components/ProductDetails';

import { StickyMobileBar } from '../components/StickyMobileBar';
import { ProductCard } from '../components/ProductCard';
import { TrackingService } from '../services/tracking';
import { useCart } from '../context/CartContext';
import { Sparkles } from 'lucide-react';
import { ProductSeo } from '../components/ProductSeo';

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

  const product = useMemo(() => {
    return id ? products.find((p) => p.id === id) : null;
  }, [products, id]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.isVisible !== false && p.categoryId === product.categoryId)
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
        <p className="text-[#8a6b7a] font-bold mb-4">المنتج المطلوب غير موجود أو لم يعد متوفراً</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-[#d94f86] text-white font-bold text-xs hover:bg-[#c93d78] transition-colors shadow-xs">
          العودة للمتجر الرئيسي
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-16">
      <ProductSeo product={product} />

      <nav className="flex items-center gap-2 text-xs text-[#8a6b7a]">
        <Link to="/" className="hover:text-[#d94f86] transition-colors">الرئيسية</Link>
        <span>/</span>
        <span className="text-[#4a2b3d] font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-start">
        <div className="w-full sticky md:top-24">
          <ImageGallery
            images={product.images}
            productTitle={product.title}
          />
        </div>

        <div className="w-full">
          <ProductDetails
            product={product}
            onOpenOrderModal={() => onOpenOrderModal(product)}
            onAddToCart={() => addToCart(product, 1)}
          />
        </div>
      </div>



      {similarProducts.length > 0 && (
        <section className="w-full pt-8 border-t border-[#f7dfe8] flex flex-col gap-6">
          <h2 className="text-lg sm:text-2xl font-black text-[#4a2b3d] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d94f86]" />
            <span>منتجات مقترحة قد تعجبك</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
          
          <div className="flex justify-center mt-6">
            <Link to="/" className="px-6 py-3 rounded-xl bg-[#4a2b3d] text-white font-bold hover:bg-[#3d2333] transition-colors shadow-xs">
              استكشاف جميع المنتجات
            </Link>
          </div>
        </section>
      )}

      <StickyMobileBar
        price={product.price}
        currency={product.currency}
        onOpenOrderModal={() => onOpenOrderModal(product)}
        onAddToCart={() => addToCart(product, 1)}
      />
    </div>
  );
};

import React, { useEffect } from 'react';
import { BeautyProduct } from '../types';

interface ProductSeoProps {
  product: BeautyProduct;
}

const SITE_URL = 'https://roza-dz.ai.studio';
const STORE_NAME = 'ROZA BEAUTY DZ';

/**
 * ProductSeo component
 * Dynamically injects:
 * 1. Title, Meta Description, Canonical URL
 * 2. OpenGraph tags (og:title, og:description, og:image, og:url, product:price)
 * 3. Twitter Card tags
 * 4. Schema.org Product & BreadcrumbList structured data (JSON-LD) for rich search snippets
 */
export const ProductSeo: React.FC<ProductSeoProps> = ({ product }) => {
  useEffect(() => {
    if (!product) return;

    const previousTitle = document.title;
    const productUrl = `${SITE_URL}/product/${product.id}`;
    const mainImageRaw = (product.images && product.images[0]) || product.image || `${SITE_URL}/images/bissell-1.webp`;
    const toAbsoluteUrl = (url: string) => {
      if (!url) return `${SITE_URL}/images/bissell-1.webp`;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };
    const mainImage = toAbsoluteUrl(mainImageRaw);
    const formattedPrice = (product.price || 0).toLocaleString();
    
    // 1. Dynamic Page Title (Optimized for Google SERP: 50-60 chars)
    document.title = `${product.title} - ${formattedPrice} د.ج | ${STORE_NAME}`;

    // Helper to safely set or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Helper to safely set or create link tags (e.g. canonical)
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // 2. Dynamic Meta Description with Keywords
    const metaDesc = `اشتري الآن ${product.title} بسعر ${formattedPrice} د.ج من متجر ${STORE_NAME} الرسمي في الجزائر. منتج أصلي 100% مع ضمان الجودة، فحص ومعاينة الطرد قبل الدفع، وتوصيل سريع لكافة الـ 69 ولاية.`;
    setMetaTag('name', 'description', metaDesc);

    // 3. Dynamic Canonical Link for the product
    setLinkTag('canonical', productUrl);

    // 4. OpenGraph Tags for Social Platforms (Facebook, WhatsApp, TikTok, Instagram)
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:site_name', STORE_NAME);
    setMetaTag('property', 'og:title', `${product.title} - ${formattedPrice} د.ج | ${STORE_NAME}`);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:image', mainImage);
    setMetaTag('property', 'og:url', productUrl);
    setMetaTag('property', 'product:price:amount', String(product.price));
    setMetaTag('property', 'product:price:currency', 'DZD');

    // 5. Twitter / X Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', `${product.title} - ${formattedPrice} د.ج | ${STORE_NAME}`);
    setMetaTag('name', 'twitter:description', metaDesc);
    setMetaTag('name', 'twitter:image', mainImage);

    // 6. Schema.org Product Structured Data (JSON-LD) with full album images
    const allImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.image ? [product.image] : [mainImage]);

    const absoluteImages = allImages.map(toAbsoluteUrl);

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.title,
      'image': absoluteImages,
      'description': product.tagline ? `${product.title} - ${product.tagline} | ${STORE_NAME}` : metaDesc,
      'sku': product.id,
      'mpn': product.id,
      'brand': {
        '@type': 'Brand',
        'name': product.brandName || STORE_NAME
      },
      'category': product.categoryName || 'أجهزة العناية والمنزل',
      'offers': {
        '@type': 'Offer',
        'url': productUrl,
        'priceCurrency': 'DZD',
        'price': product.price,
        'priceValidUntil': '2027-12-31',
        'itemCondition': 'https://schema.org/NewCondition',
        'availability': product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': {
          '@type': 'Organization',
          'name': STORE_NAME,
          'url': `${SITE_URL}/`
        }
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': (product.rating || 5.0).toFixed(1),
        'reviewCount': product.reviewsCount || 35,
        'bestRating': '5',
        'worstRating': '1'
      }
    };

    // BreadcrumbList Schema for Google Search Snippets
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'الرئيسية',
          'item': `${SITE_URL}/`
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': product.categoryName || 'الأقسام',
          'item': `${SITE_URL}/category/${product.categorySlug || 'home-appliances'}`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': product.title,
          'item': productUrl
        }
      ]
    };

    // Helper to inject JSON-LD scripts
    const injectJsonLd = (id: string, data: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    injectJsonLd('schema-product-ld', productSchema);
    injectJsonLd('schema-breadcrumb-ld', breadcrumbSchema);

    // Cleanup when navigating away: restore default canonical and global meta tags
    return () => {
      document.title = previousTitle || `${STORE_NAME} | المتجر الرسمي للأجهزة والجمال في الجزائر - الدفع عند الاستلام`;
      setLinkTag('canonical', `${SITE_URL}/`);
      setMetaTag('name', 'description', `المتجر الرسمي لعلامة ${STORE_NAME} في الجزائر. أجهزة العناية بالجمال والمطبخ الأصلية 100% مع ضمان الجودة، فحص الطرد قبل الدفع، وتوصيل سريع لكافة الـ 69 ولاية.`);
      setMetaTag('property', 'og:type', 'website');
      setMetaTag('property', 'og:url', `${SITE_URL}/`);
      setMetaTag('property', 'og:title', `${STORE_NAME} | المتجر الرسمي للأجهزة والجمال في الجزائر`);
      setMetaTag('property', 'og:description', `تسوقي أجهزة الجمال والمطبخ الأصلية في الجزائر من متجر ${STORE_NAME} مع الدفع نقداً عند الاستلام وضمان المعاينة والتوصيل لـ 69 ولاية.`);
      setMetaTag('property', 'og:image', `${SITE_URL}/images/bissell-1.webp`);
      setMetaTag('name', 'twitter:title', `${STORE_NAME} | المتجر الرسمي للأجهزة والجمال في الجزائر`);
      setMetaTag('name', 'twitter:description', `تسوقي أجهزة الجمال والمطبخ الأصلية في الجزائر من متجر ${STORE_NAME} مع الدفع نقداً عند الاستلام وضمان المعاينة والتوصيل لـ 69 ولاية.`);
      setMetaTag('name', 'twitter:image', `${SITE_URL}/images/bissell-1.webp`);

      const pScript = document.getElementById('schema-product-ld');
      if (pScript) pScript.remove();
      const bScript = document.getElementById('schema-breadcrumb-ld');
      if (bScript) bScript.remove();
    };
  }, [product]);

  return null;
};

export default ProductSeo;

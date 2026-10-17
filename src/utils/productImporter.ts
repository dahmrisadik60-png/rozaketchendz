import { BeautyProduct } from '../types';
import { categorizeProductTitle } from './categoryClassifier';

function parseNumericPrice(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function extractBrand(title: string): string {
  if (!title) return 'Roza DZ';
  const firstWord = title.trim().split(/\s+/)[0];
  const commonBrands = [
    'BOSCH', 'SIEMENS', 'SMEG', 'Sage', 'DeLonghi', "De'Longhi",
    'Dyson', 'Bissell', 'Ninja', 'Philips', 'PHILIPS', 'Braun',
    'Krups', 'Kenwood', 'Moulinex', 'Tefal', 'TEFAL', 'Aiper', 'AIPER',
    'Tineco', 'Dreame', 'DREAME', 'Roborock', 'ECOVACS', 'Rowenta', 'Shark'
  ];
  for (const b of commonBrands) {
    if (title.toLowerCase().includes(b.toLowerCase())) {
      return b;
    }
  }
  return firstWord || 'Roza DZ';
}

function generateCleanId(title: string, url?: string): string {
  if (url) {
    const match = url.match(/\/product\/([^\/]+)/);
    if (match && match[1]) {
      return match[1].toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 50);
    }
  }
  return 'prod-' + title.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 45) + '-' + Math.floor(Math.random() * 1000);
}

export function convertExtractedToBeautyProducts(
  extractedList: Array<{
    title: string;
    price: string | number;
    oldPrice?: string | number;
    image?: string;
    url?: string;
    category?: string;
  }>
): BeautyProduct[] {
  return extractedList.map((item, idx) => {
    const title = (item.title || '').trim();
    const currentPrice = parseNumericPrice(item.price);
    let oldPrice = parseNumericPrice(item.oldPrice);
    if (!oldPrice || oldPrice <= currentPrice) {
      oldPrice = Math.round(currentPrice * 1.15 / 100) * 100; // 15% promo reference
    }

    const catInfo = categorizeProductTitle(title);
    const brand = extractBrand(title);
    const id = generateCleanId(title, item.url) || `prod-ext-${idx}-${Date.now()}`;

    return {
      id,
      brandName: brand,
      title,
      tagline: `منتج أصلي معتمد من ${brand} بجودة عالية وضمان المعاينة قبل الاستلام.`,
      price: currentPrice || 15000,
      originalPrice: oldPrice,
      currency: 'د.ج',
      images: item.image ? [item.image] : [],
      keyPoints: [
        'منتج أصلي 100% مستورد بجودة عالمية مطابقة للمواصفات.',
        'تصميم عملي وأداء عالي مصمم للاستخدام اليومي الشاق.',
        'يشمل ضمان الجودة وخدمة ما بعد البيع مع إمكانية المعاينة عند الاستلام.'
      ],
      keyPointsTitle: `أبرز مميزات ${brand}:`,
      specs: [
        { label: 'العلامة التجارية', value: brand },
        { label: 'القسم', value: catInfo.name },
        { label: 'الحالة', value: 'أصلي جديد 100%' },
        { label: 'الضمان', value: '12 شهراً مع حق المعاينة' }
      ],
      rating: 5.0,
      reviewsCount: Math.floor(Math.random() * 40) + 15,
      inStock: true,
      guaranteeText: 'لك كامل الحق في فتح الطرد ومعاينة المنتج والتأكد منه عند الاستلام قبل الدفع',
      categoryId: catInfo.id,
      categorySlug: catInfo.slug,
      categoryName: catInfo.name,
      isFeatured: idx < 10,
      isVisible: true,
      stockCount: 25
    };
  });
}

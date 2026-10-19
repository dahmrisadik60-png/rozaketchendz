import { BeautyProduct } from '../types';

export interface CategoryDef {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryDef> = {
  COFFEE: {
    id: 'cat-coffee-machines',
    name: 'ماكينات القهوة والاسبريسو',
    nameEn: 'Coffee & Espresso Machines',
    slug: 'coffee-machines'
  },
  HOME: {
    id: 'cat-home',
    name: 'المكانس والروبوتات الذكية',
    nameEn: 'Vacuums & Smart Robots',
    slug: 'home-appliances'
  },
  STEAM: {
    id: 'cat-steam',
    name: 'التنظيف بالبخار وغسل السجاد',
    nameEn: 'Steam & Carpet Cleaning',
    slug: 'steam-cleaners'
  },
  POOL: {
    id: 'cat-pool',
    name: 'روبوتات ومعدات المسابح',
    nameEn: 'Pool Robots & Equipment',
    slug: 'pool-robots'
  },
  AIRFRYER: {
    id: 'cat-airfryers',
    name: 'المقالي الهوائية والطباخات المتعددة',
    nameEn: 'Air Fryers & Multicookers',
    slug: 'air-fryers'
  },
  BLENDER: {
    id: 'cat-blenders',
    name: 'الخلاطات والمفرومات والعصارات',
    nameEn: 'Blenders, Choppers & Juicers',
    slug: 'blenders-juicers'
  },
  FOODPROC: {
    id: 'cat-food-processors',
    name: 'روبوتات الطبخ والعجانات',
    nameEn: 'Food Processors & Dough Machines',
    slug: 'food-processors'
  },
  GRILL: {
    id: 'cat-grills',
    name: 'الشوايات والبلانشا والطبخ الكهربائي',
    nameEn: 'Grills, Plancha & Electric Cooking',
    slug: 'grills-cooking'
  },
  BREAKFAST: {
    id: 'cat-breakfast',
    name: 'الغلايات والمحمصات وأجهزة الفطور',
    nameEn: 'Kettles, Toasters & Breakfast',
    slug: 'kettles-toasters'
  },
  COOKWARE: {
    id: 'cat-cookware',
    name: 'أواني الطبخ والطناجر والسكاكين',
    nameEn: 'Cookware & Knives',
    slug: 'cookware'
  },
  ICE: {
    id: 'cat-ice',
    name: 'المثلجات والمشروبات الباردة',
    nameEn: 'Ice Cream & Cold Drinks',
    slug: 'ice-cold-drinks'
  },
  LARGE: {
    id: 'cat-large',
    name: 'الأفران والأجهزة الكبيرة والتدفئة',
    nameEn: 'Ovens & Large Appliances',
    slug: 'large-appliances'
  },
  HAIR: {
    id: 'cat-hair',
    name: 'العناية بالشعر والتصفيف',
    nameEn: 'Hair Care & Styling',
    slug: 'hair-beauty'
  },
  BEAUTY: {
    id: 'cat-beauty',
    name: 'الحلاقة والإزالة والعناية الشخصية',
    nameEn: 'Shaving, Hair Removal & Personal Care',
    slug: 'beauty-personal-care'
  },
  IRON: {
    id: 'cat-iron',
    name: 'الكي والخياطة',
    nameEn: 'Ironing & Sewing',
    slug: 'ironing-sewing'
  },
  ELECTRONICS: {
    id: 'cat-electronics',
    name: 'إلكترونيات ورياضة وأطفال',
    nameEn: 'Electronics, Sports & Kids',
    slug: 'electronics-gaming'
  },
  PARTS: {
    id: 'cat-parts',
    name: 'قطع غيار وإكسسوارات',
    nameEn: 'Spare Parts & Accessories',
    slug: 'spare-parts'
  },
  GENERAL: {
    id: 'cat-general',
    name: 'عام',
    nameEn: 'General',
    slug: 'general'
  },
  KITCHEN: {
    id: 'cat-blenders',
    name: 'الخلاطات والمفرومات والعصارات',
    nameEn: 'Blenders, Choppers & Juicers',
    slug: 'blenders-juicers'
  }
};

/**
 * Finds a category definition from its Arabic name (the `category` field of fassilProducts.json).
 */
export function getCategoryByName(name?: string): CategoryDef | undefined {
  if (!name) return undefined;
  return Object.values(CATEGORY_DEFINITIONS).find((c) => c.name === name.trim());
}

/**
 * Classifies a product title into one of the designated categories based on keywords.
 */
export function classifyProductTitle(title: string): CategoryDef {
  if (!title || typeof title !== 'string') return CATEGORY_DEFINITIONS.GENERAL;

  const t = title.toLowerCase();

  // 1. Electronics & Gaming (Scooters, Consoles, Gaming, Drones, Smartwatches)
  if (
    t.includes('scooter') ||
    t.includes('gokido') ||
    t.includes('trottinette') ||
    t.includes('gaming') ||
    t.includes('jeu') ||
    t.includes('playstation') ||
    t.includes('ps5') ||
    t.includes('ps4') ||
    t.includes('xbox') ||
    t.includes('console') ||
    t.includes('manette') ||
    t.includes('casque gaming') ||
    t.includes('smartwatch') ||
    t.includes('سكوتر') ||
    t.includes('العاب') ||
    t.includes('ألعاب') ||
    t.includes('بلايستيشن') ||
    t.includes('اكس بوكس')
  ) {
    return CATEGORY_DEFINITIONS.ELECTRONICS;
  }

  // 2. Beauty & Personal Care (Hair styling, Dryers, Epilators, Shavers, IPL, Oral-B)
  if (
    t.includes('airwrap') ||
    t.includes('lisseur') ||
    t.includes('airstrait') ||
    t.includes('sèche cheveux') ||
    t.includes('seche-cheveux') ||
    t.includes('sèche-cheveux') ||
    t.includes('supersonic') ||
    t.includes('styler') ||
    t.includes('épilateur') ||
    t.includes('epilateur') ||
    t.includes('rasoir') ||
    t.includes('ipl') ||
    t.includes('lumiere pulsee') ||
    t.includes('lumière pulsée') ||
    t.includes('silk·expert') ||
    t.includes('silk-expert') ||
    t.includes('shaver') ||
    t.includes('tondeuse') ||
    t.includes('oral-b') ||
    t.includes('brosse à dents') ||
    t.includes('dentifrice') ||
    t.includes('مجفف شعر') ||
    t.includes('مصفف') ||
    t.includes('سشوار') ||
    t.includes('إزالة شعر') ||
    t.includes('حلاقة') ||
    t.includes('تجميل') ||
    t.includes('عناية')
  ) {
    return CATEGORY_DEFINITIONS.BEAUTY;
  }

  // 3. Coffee & Espresso Machines (Specific Kitchen subtype or direct category)
  if (
    t.includes('expresso encastrable') ||
    t.includes('machine expresso') ||
    t.includes('machine à café') ||
    t.includes('machine a cafe') ||
    t.includes('cafetiere') ||
    t.includes('cafetière') ||
    t.includes('nespresso') ||
    t.includes('lor barista') ||
    t.includes('l’or barista') ||
    t.includes('clessidra') ||
    t.includes('delonghi magnifica') ||
    t.includes('dedica style')
  ) {
    return CATEGORY_DEFINITIONS.COFFEE;
  }

  // 4. Kitchen Appliances (Air fryers, Blenders, Mixers, Beaters, Cookeo, Cookware)
  if (
    t.includes('air fryer') ||
    t.includes('friteuse') ||
    t.includes('blender') ||
    t.includes('mixeur') ||
    t.includes('batteur') ||
    t.includes('pétrin') ||
    t.includes('petrin') ||
    t.includes('expresso') ||
    t.includes('espresso') ||
    t.includes('café') ||
    t.includes('cafe') ||
    t.includes('cafetiere') ||
    t.includes('cafetière') ||
    t.includes('broyeur') ||
    t.includes('moulin') ||
    t.includes('delonghi') ||
    t.includes('de’longhi') ||
    t.includes('smeg') ||
    t.includes('krups') ||
    t.includes('dolce gusto') ||
    t.includes('cookeo') ||
    t.includes('hachoir') ||
    t.includes('moulinex') ||
    t.includes('multicuiseur') ||
    t.includes('kitchenaid') ||
    t.includes('bouilloire') ||
    t.includes('grill') ||
    t.includes('grille-pain') ||
    t.includes('toaster') ||
    t.includes('plancha') ||
    t.includes('raclette') ||
    t.includes('gaufrier') ||
    t.includes('presse-agrume') ||
    t.includes('extracteur') ||
    t.includes('centrifugeuse') ||
    t.includes('mousseur') ||
    t.includes('batterie de cuisine') ||
    t.includes('cocotte') ||
    t.includes('casserole') ||
    t.includes('poele') ||
    t.includes('poêle') ||
    t.includes('قلاية') ||
    t.includes('مقلاة') ||
    t.includes('خلاط') ||
    t.includes('عجانة') ||
    t.includes('قهوة') ||
    t.includes('مطبخ')
  ) {
    return CATEGORY_DEFINITIONS.KITCHEN;
  }

  // 5. Home Appliances (Vacuums, Robot Cleaners, Steam Cleaners, Pool Cleaners, Irons)
  if (
    t.includes('aspirateur') ||
    t.includes('robot') ||
    t.includes('laveur') ||
    t.includes('piscine') ||
    t.includes('pool') ||
    t.includes('skimmer') ||
    t.includes('scuba') ||
    t.includes('seagull') ||
    t.includes('bissell') ||
    t.includes('crosswave') ||
    t.includes('spotclean') ||
    t.includes('nettoyeur') ||
    t.includes('vapeur') ||
    t.includes('steam') ||
    t.includes('défroisseur') ||
    t.includes('defroisseur') ||
    t.includes('fer à repasser') ||
    t.includes('centrale vapeur') ||
    t.includes('rowenta') ||
    t.includes('karcher') ||
    t.includes('kärcher') ||
    t.includes('tineco') ||
    t.includes('dreame') ||
    t.includes('roborock') ||
    t.includes('ecovacs') ||
    t.includes('roomba') ||
    t.includes('irobot') ||
    t.includes('shampouineuse') ||
    t.includes('lave-vaisselle') ||
    t.includes('radiateur') ||
    t.includes('climatiseur') ||
    t.includes('مكنسة') ||
    t.includes('بخار') ||
    t.includes('تنظيف') ||
    t.includes('غسيل') ||
    t.includes('كهرومنزلية')
  ) {
    return CATEGORY_DEFINITIONS.HOME;
  }

  // 6. Default Fallback
  return CATEGORY_DEFINITIONS.GENERAL;
}

/**
 * Detects brand from title
 */
export function extractBrand(title: string): string {
  if (!title) return 'Roza DZ';
  const t = title.toUpperCase();
  const knownBrands = [
    'BOSCH', 'SIEMENS', 'SMEG', 'DYSON', 'BRAUN', 'BISSELL',
    'NINJA', 'DELONGHI', "DE'LONGHI", 'ROWENTA', 'AIPER', 'ARIETE',
    'KENWOOD', 'PHILIPS', 'SAGE', 'ECOVACS', 'MOULINEX', 'KITCHENAID',
    'KRUPS', 'SHUNZAO', 'ARTHUR MARTIN', 'ACE GOKIDO', 'GOKIDO', 'ORAL-B'
  ];

  for (const b of knownBrands) {
    if (t.includes(b)) {
      return b.replace("DE'LONGHI", "De'Longhi").replace('ACE GOKIDO', 'Gokido');
    }
  }
  return 'ماركة أصلية معتمدة';
}

/**
 * Parses numeric price from any price string (e.g. "44000 د.ج", "44,000", "44000")
 */
export function parseNumericPrice(priceStr: string | number | undefined): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const digits = String(priceStr).replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Transforms any cleaned/extracted product into a complete active BeautyProduct for the store
 */
export function transformToActiveProduct(
  item: {
    title: string;
    currentPrice?: string | number;
    price?: string | number;
    oldPrice?: string | number;
    image?: string;
    images?: string[];
    url?: string;
    category?: string;
  },
  index: number
): BeautyProduct {
  const title = (item.title || '').trim();
  const catDef = getCategoryByName(item.category) || classifyProductTitle(title);
  const brand = extractBrand(title);
  const parsedPrice = parseNumericPrice(item.currentPrice || item.price) || 25000;
  const parsedOldPrice = parseNumericPrice(item.oldPrice);

  // Generate a clean slug ID
  const cleanSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const id = `prod-extracted-${cleanSlug || 'item'}-${index + 1}`;

  const rawImages = (item.images && Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : (item.image ? [item.image] : []);

  const validImages = rawImages
    .map((img) => (typeof img === 'string' ? img.trim() : ''))
    .filter((img) => img.startsWith('http') || img.startsWith('/'));

  const finalImages = validImages.length > 0
    ? validImages
    : ['https://i0.wp.com/fassil.shop/wp-content/uploads/2026/08/FASSIL-SHOP-26.webp?w=2318&ssl=1'];

  return {
    id,
    brandName: brand,
    title,
    tagline: `منتج أصلي 100% عالي الجودة من فئة ${catDef.name} مع ضمان كامل وحق المعاينة عند الاستلام.`,
    price: parsedPrice,
    originalPrice: parsedOldPrice && parsedOldPrice > parsedPrice ? parsedOldPrice : Math.round(parsedPrice * 1.15),
    currency: 'د.ج',
    images: finalImages,
    keyPoints: [
      `أصلي 100% معتمد مع ضمان الجودة والأداء العالي.`,
      `تصنيف رسمي ضمن قسم ${catDef.name} لتلبية احتياجاتك اليومية بكفاءة.`,
      `الدفع الآمن عند الاستلام بعد فحص ومعاينة المنتج بالكامل.`,
      `توصيل سريع وموثوق إلى جميع الولايات الـ 69.`
    ],
    keyPointsTitle: `أبرز مميزات ${brand}:`,
    specs: [
      { label: 'العلامة التجارية', value: brand },
      { label: 'القسم الرئيسي', value: catDef.name },
      { label: 'الحالة', value: 'أصلي جديد 100% في العلبة الأصلية' },
      { label: 'الضمان', value: 'ضمان الجودة الرسمي مع المعاينة قبل الدفع' },
      { label: 'التوصيل', value: 'متوفر لجميع الولايات مع خيار التوصيل للمنزل أو المكتب' }
    ],
    rating: 5.0,
    reviewsCount: Math.floor(Math.random() * 45) + 15,
    inStock: true, // Active status
    isVisible: true, // Published status
    stockCount: 45,
    guaranteeText: 'لك كامل الحق في فتح الطرد ومعاينة الجهاز وملحقاته قبل تسليم المبلغ لمندوب التوصيل',
    categoryId: catDef.id,
    categorySlug: catDef.slug,
    categoryName: catDef.name,
    isFeatured: index < 6,
    description: `منتج ${title} متوفر الآن في متجرنا الأصلي بضمان معتمد وتوصيل فوري لجميع الولايات.`
  };
}

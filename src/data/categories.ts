import { ProductCategory, StoreBanner } from '../types';

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-kitchen',
    name: 'أجهزة المطبخ',
    slug: 'kitchen-appliances',
    description: 'المقالي الهوائية، الخلاطات، العجانات، صانعات القهوة ومعدات المطبخ الذكية',
    icon: 'UtensilsCrossed',
    order: 1
  },
  {
    id: 'cat-home',
    name: 'الأجهزة الكهرومنزلية',
    slug: 'home-appliances',
    description: 'المكانس الذكية، أجهزة التنظيف بالبخار، روبوتات المسابح والأجهزة المنزلية',
    icon: 'Sparkles',
    order: 2
  },
  {
    id: 'cat-beauty',
    name: 'العناية والتجميل',
    slug: 'beauty-personal-care',
    description: 'مصففات ومجففات الشعر، أجهزة إزالة الشعر بالليزر، وماكينات الحلاقة والعناية الشخصية',
    icon: 'Heart',
    order: 3
  },
  {
    id: 'cat-electronics',
    name: 'إلكترونيات وألعاب',
    slug: 'electronics-gaming',
    description: 'السكوترات الكهربائية، منصات الألعاب، والأجهزة الإلكترونية الذكية',
    icon: 'Smartphone',
    order: 4
  },
  {
    id: 'cat-coffee-machines',
    name: 'ماكينات القهوة والاسبريسو',
    slug: 'coffee-machines',
    description: 'أفخم ماكينات القهوة والاسبريسو العالمية الأصلية: BOSCH, SIEMENS, SMEG, Sage, DeLonghi',
    icon: 'Coffee',
    order: 5
  },
  {
    id: 'cat-general',
    name: 'عام',
    slug: 'general',
    description: 'المنتجات والإكسسوارات العامة والملحقات',
    icon: 'Package',
    order: 6
  }
];

export const DEFAULT_BANNER: StoreBanner = {
  title: 'روزا بيوتي الجزائر: الجمال والأناقة تبدأ هنا',
  subtitle: 'أجهزة تنظيف وعناية أصلية 100% مع ضمان الجودة والدفع عند الاستلام بعد المعاينة والتوصيل لـ 69 ولاية',
  badgeText: 'العلامة الأكثر ثقة في الجزائر ★ 5.0',
  ctaText: 'تسوق الآن',
  ctaLink: '#products',
  imageUrl: 'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-1.webp',
  enabled: true,
  heroImageUrl: 'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-1.webp',
  heroImageBadge: 'PROMO',
  showHeroImage: true,
  showImageBadge: true
};

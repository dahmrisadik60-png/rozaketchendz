import { ProductCategory, StoreBanner } from '../types';

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-appliances',
    name: 'أجهزة العناية والمنزل',
    slug: 'home-appliances',
    description: 'أفضل أجهزة التنظيف الذكية والعناية المنزلية العصرية',
    icon: 'Sparkles',
    order: 1
  },
  {
    id: 'cat-hair-beauty',
    name: 'تصفيف وجمال الشعر',
    slug: 'hair-beauty',
    description: 'مصففات ومجففات الشعر الاحترافية بتقنيات السيراميك والأيونات',
    icon: 'Flame',
    order: 2
  },
  {
    id: 'cat-skincare',
    name: 'العناية بالبشرة والوجه',
    slug: 'skincare',
    description: 'أجهزة تنظيف وتقشير البشرة ومساج الوجه',
    icon: 'Heart',
    order: 3
  },
  {
    id: 'cat-accessories',
    name: 'الملحقات وقطع الغيار',
    slug: 'accessories',
    description: 'السوائل والفرش والملحقات الأصلية لجميع الأجهزة',
    icon: 'Package',
    order: 4
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

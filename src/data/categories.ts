import { ProductCategory, StoreBanner } from '../types';

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-coffee-machines',
    name: 'ماكينات القهوة والاسبريسو',
    slug: 'coffee-machines',
    description: 'ماكينات القهوة والاسبريسو الأصلية: DeLonghi, Siemens, Smeg, Sage, Krups, Nespresso ومطاحن القهوة',
    icon: 'Coffee',
    order: 1
  },
  {
    id: 'cat-home',
    name: 'المكانس والروبوتات الذكية',
    slug: 'home-appliances',
    description: 'المكانس الكهربائية، المكانس اللاسلكية، الروبوتات الذكية وأجهزة غسل الأرضيات والنوافذ',
    icon: 'Home',
    order: 2
  },
  {
    id: 'cat-steam',
    name: 'التنظيف بالبخار وغسل السجاد',
    slug: 'steam-cleaners',
    description: 'أجهزة التنظيف بالبخار، غسل السجاد والأرائك، إزالة البقع والمنظفات بالضغط العالي',
    icon: 'Sparkles',
    order: 3
  },
  {
    id: 'cat-pool',
    name: 'روبوتات ومعدات المسابح',
    slug: 'pool-robots',
    description: 'روبوتات تنظيف المسابح الذكية والمسابح المنزلية',
    icon: 'Sparkles',
    order: 4
  },
  {
    id: 'cat-airfryers',
    name: 'المقالي الهوائية والطباخات المتعددة',
    slug: 'air-fryers',
    description: 'المقالي الهوائية بدون زيت، Cookeo والطباخات المتعددة الوظائف',
    icon: 'UtensilsCrossed',
    order: 5
  },
  {
    id: 'cat-blenders',
    name: 'الخلاطات والمفرومات والعصارات',
    slug: 'blenders-juicers',
    description: 'الخلاطات، الخلاطات اليدوية، المفرمات، عصارات الفواكه ومطاحن المطبخ',
    icon: 'UtensilsCrossed',
    order: 6
  },
  {
    id: 'cat-food-processors',
    name: 'روبوتات الطبخ والعجانات',
    slug: 'food-processors',
    description: 'روبوتات الطبخ والعجن، آلات الباستا وآلات الخبز',
    icon: 'UtensilsCrossed',
    order: 7
  },
  {
    id: 'cat-grills',
    name: 'الشوايات والبلانشا والطبخ الكهربائي',
    slug: 'grills-cooking',
    description: 'الشوايات، البلانشا، الرّاكليت، الشواء الكهربائي وصفائح الحث',
    icon: 'UtensilsCrossed',
    order: 8
  },
  {
    id: 'cat-breakfast',
    name: 'الغلايات والمحمصات وأجهزة الفطور',
    slug: 'kettles-toasters',
    description: 'الغلايات الكهربائية، محمصات الخبز، آلات الوافل والكريب وصانعات الياغورت',
    icon: 'UtensilsCrossed',
    order: 9
  },
  {
    id: 'cat-cookware',
    name: 'أواني الطبخ والطناجر والسكاكين',
    slug: 'cookware',
    description: 'أواني الطبخ، طناجر الضغط، السكاكين، الموازين وأدوات المطبخ',
    icon: 'UtensilsCrossed',
    order: 10
  },
  {
    id: 'cat-ice',
    name: 'المثلجات والمشروبات الباردة',
    slug: 'ice-cold-drinks',
    description: 'آلات الآيس كريم، المشروبات المثلجة ومصنوعات الثلج',
    icon: 'UtensilsCrossed',
    order: 11
  },
  {
    id: 'cat-large',
    name: 'الأفران والأجهزة الكبيرة والتدفئة',
    slug: 'large-appliances',
    description: 'الأفران، المايكرويف، غسالات الأواني، مواقد الغاز ومدافئ التدفئة',
    icon: 'Home',
    order: 12
  },
  {
    id: 'cat-hair',
    name: 'العناية بالشعر والتصفيف',
    slug: 'hair-beauty',
    description: 'مجففات ومصففات الشعر: Dyson, Shark, Remington, Revlon',
    icon: 'Heart',
    order: 13
  },
  {
    id: 'cat-beauty',
    name: 'الحلاقة والإزالة والعناية الشخصية',
    slug: 'beauty-personal-care',
    description: 'أجهزة إزالة الشعر بالضوء النبضي، ماكينات الحلاقة وفرش الأسنان الكهربائية',
    icon: 'Heart',
    order: 14
  },
  {
    id: 'cat-iron',
    name: 'الكي والخياطة',
    slug: 'ironing-sewing',
    description: 'مكاوي البخار، محطات الكي، مزيلات التجاعيد وآلات الخياطة',
    icon: 'Home',
    order: 15
  },
  {
    id: 'cat-electronics',
    name: 'إلكترونيات ورياضة وأطفال',
    slug: 'electronics-gaming',
    description: 'السكوترات الكهربائية، الدراجات الرياضية، أجهزة العرض ومستلزمات الأطفال',
    icon: 'Smartphone',
    order: 16
  },
  {
    id: 'cat-parts',
    name: 'قطع غيار وإكسسوارات',
    slug: 'spare-parts',
    description: 'قطع الغيار الأصلية، الفلاتر، الملحقات ومواد التنظيف',
    icon: 'Package',
    order: 17
  },
  {
    id: 'cat-general',
    name: 'عام',
    slug: 'general',
    description: 'المنتجات والإكسسوارات العامة والملحقات',
    icon: 'Package',
    order: 18
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

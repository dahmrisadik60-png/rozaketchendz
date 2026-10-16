import { BeautyProduct } from '../types';

export const ROZA_BEAUTY_PRODUCT: BeautyProduct = {
  id: 'bissell-crosswave-omniforce',
  brandName: 'Roza Beauty DZ',
  title: "L'aspirateur Bissell CrossWave OmniForce اللاسلكي - غسيل وتنظيف عميق وتنشيف في خطوة واحدة",
  tagline: 'الابتكار الأقوى من Bissell لتنظيف وغسيل جميع أنواع الأرضيات والسجاد لاسلكياً وبكل سهولة.',
  price: 62000,
  currency: 'د.ج',
  images: [
    '/src/assets/images/luxury_studio_dark_1792075516585.jpg',
    '/src/assets/images/side_angle_view_1792075518909.jpg',
    '/src/assets/images/macro_detail_closeup_1792075515181.jpg',
    '/src/assets/images/lifestyle_home_floor_1792075515685.jpg',
    'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-1.webp',
    'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-2.webp',
    'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-3.webp',
    'https://raw.githubusercontent.com/dahmrisadik60-png/rozaketchendz/main/public/images/bissell-4.webp'
  ],
  keyPoints: [
    'تنظيف متكامل في خطوة واحدة: يجمع الـ Aspirateur بين شفط الأتربة وغسيل وتجفيف الأرضيات والسجاد في نفس الوقت لتوفير الوقت والجهد.',
    'تقنية الخزانين المنفصلين: يعتمد على نظام فصل تام بين المياه النظيفة ومحلول التنظيف عن المياه والمخلفات المتسخة لضمان التنظيف بماء نظيف دائماً.',
    'حرية الحركة اللاسلكية: تصميم لاسلكي ببطارية قوية يتيح لك التنظيف بسلاسة في كل زاوية من البيت دون تقييد الأسلاك.',
    'قاعدة الشحن والتنظيف الذاتي: يأتي مع قاعدة ذكية لإعادة الشحن ولتنظيف الفرشاة ذاتياً بعد الاستخدام لحماية الجهاز والحفاظ على نظافته.'
  ],
  keyPointsTitle: 'لماذا تختار Aspirateur Bissell CrossWave OmniForce؟',
  specs: [
    { label: 'العلامة التجارية', value: 'Bissell' },
    { label: 'الملحقات', value: 'قاعدة شحن وتنظيف ذاتي + محول كهربائي (شاحن) + عبوة سائل لتنظيف متعدد الأسطح' },
    { label: 'القوة والأداء', value: 'قوة شفط وتنظيف عالية: محرك قوي مخصص لشفط الأتربة والمخلفات الجافة والمياه المتسخة في وقت واحد وبفعالية عالية على مختلف الأسطح (سيراميك، رخام، باركيه، وسجاد)' },
    { label: 'نوع الحماية', value: 'نظام حماية ذكي للمحرك عند امتلاء خزان المياه المتسخة / حماية ضد الحرارة الزائدة' },
    { label: 'السلك الكهربائي', value: 'لاسلكي (يعمل ببطارية قابلة للشحن) مع شاحن مرفق' },
    { label: 'الضمان', value: 'ضمان الجودة لمدة 12 شهراً مع إمكانية المعاينة عند الاستلام' }
  ],
  rating: 5.0,
  reviewsCount: 342,
  inStock: true,
  guaranteeText: 'لك كامل الحق في فتح الطرد ومعاينة الجهاز وملحقاته والتأكد منها عند الاستلام',
  originalPrice: 75000,
  categoryId: 'cat-appliances',
  categorySlug: 'home-appliances',
  categoryName: 'أجهزة العناية والمنزل',
  isFeatured: true,
  isVisible: true,
  stockCount: 45
};

import { CSV_IMPORTED_PRODUCTS } from './importedProducts';

export const INITIAL_STORE_PRODUCTS: BeautyProduct[] = [
  ROZA_BEAUTY_PRODUCT,
  ...CSV_IMPORTED_PRODUCTS
];


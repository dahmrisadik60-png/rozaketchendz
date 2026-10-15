import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  query,
  limit,
  writeBatch
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Order, 
  OrderStatus, 
  BeautyProduct, 
  CustomerReview, 
  PixelConfig,
  ProductCategory,
  StoreBanner,
  TrackingEventDoc,
  AdSpend
} from '../types';
import { ROZA_BEAUTY_PRODUCT } from '../data/products';
import { ALGERIAN_CUSTOMER_REVIEWS } from '../data/reviews';
import { DEFAULT_CATEGORIES, DEFAULT_BANNER } from '../data/categories';

export const ADMIN_EMAIL = 'dahmrisadik60@gmail.com';

export const DEFAULT_PIXEL_CONFIG: PixelConfig = {
  metaPixelId: '',
  tikTokPixelId: '',
  googleTagId: '',
  enabled: true
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app, firebaseConfig.storageBucket);

// Error Handling conforming strictly to Firebase Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// -------------------------------------------------------------
// FIREBASE STORAGE: Upload images and return download URLs
// -------------------------------------------------------------
export async function uploadImageToStorage(file: File): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firebase Storage upload timed out after 3.5s')), 3500)
  );

  try {
    const fileExt = file.name.split('.').pop() || 'webp';
    const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `products/${cleanName}`);

    const uploadTask = async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/webp'
      });
      return await getDownloadURL(snapshot.ref);
    };

    return await Promise.race([uploadTask(), timeoutPromise]);
  } catch (error) {
    console.warn('Firebase Storage upload failed or timed out:', error);
    throw error;
  }
}

/**
 * Recursively removes any undefined keys so Firestore setDoc / updateDoc never fails.
 */
export function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null ? stripUndefined(item) : item
    ) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        clean[key] =
          typeof value === 'object' && value !== null
            ? stripUndefined(value)
            : value;
      }
    }
    return clean as T;
  }
  return obj;
}

// -------------------------------------------------------------
// SETTINGS: Product Settings (/settings/product) - LEGACY & SINGLE-PRODUCT COMPAT
// -------------------------------------------------------------
export async function getProductFromFirestore(): Promise<BeautyProduct> {
  const path = 'settings/product';
  try {
    const docRef = doc(db, 'settings', 'product');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<BeautyProduct>;
      if (data && data.title) {
        return {
          ...ROZA_BEAUTY_PRODUCT,
          ...data,
          keyPointsTitle: data.keyPointsTitle || ROZA_BEAUTY_PRODUCT.keyPointsTitle || '',
          specsTitle: data.specsTitle || 'المواصفات التقنية الرسمية:',
          images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ROZA_BEAUTY_PRODUCT.images,
          keyPoints: Array.isArray(data.keyPoints) && data.keyPoints.length > 0 ? data.keyPoints : ROZA_BEAUTY_PRODUCT.keyPoints,
          specs: Array.isArray(data.specs) && data.specs.length > 0 ? data.specs : ROZA_BEAUTY_PRODUCT.specs
        };
      }
    }
    return ROZA_BEAUTY_PRODUCT;
  } catch (error) {
    console.error('Error fetching product from Firestore:', error);
    return ROZA_BEAUTY_PRODUCT;
  }
}

export function subscribeToProduct(
  onUpdate: (product: BeautyProduct) => void,
  onError?: (error: unknown) => void
): () => void {
  const docRef = doc(db, 'settings', 'product');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<BeautyProduct>;
        if (data && data.title) {
          onUpdate({
            ...ROZA_BEAUTY_PRODUCT,
            ...data,
            keyPointsTitle: data.keyPointsTitle || ROZA_BEAUTY_PRODUCT.keyPointsTitle || '',
            specsTitle: data.specsTitle || 'المواصفات التقنية الرسمية:',
            images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ROZA_BEAUTY_PRODUCT.images,
            keyPoints: Array.isArray(data.keyPoints) && data.keyPoints.length > 0 ? data.keyPoints : ROZA_BEAUTY_PRODUCT.keyPoints,
            specs: Array.isArray(data.specs) && data.specs.length > 0 ? data.specs : ROZA_BEAUTY_PRODUCT.specs
          });
          return;
        }
      }
      onUpdate(ROZA_BEAUTY_PRODUCT);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Product snapshot listener error:', error);
    }
  );
}

export async function saveProductToFirestore(product: BeautyProduct): Promise<void> {
  const path = 'settings/product';
  try {
    const docRef = doc(db, 'settings', 'product');
    const cleanProduct: BeautyProduct = {
      id: product.id || ROZA_BEAUTY_PRODUCT.id,
      brandName: product.brandName || ROZA_BEAUTY_PRODUCT.brandName,
      title: product.title || ROZA_BEAUTY_PRODUCT.title,
      tagline: product.tagline || ROZA_BEAUTY_PRODUCT.tagline,
      price: Number(product.price) || ROZA_BEAUTY_PRODUCT.price,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      currency: product.currency || ROZA_BEAUTY_PRODUCT.currency,
      images: Array.isArray(product.images) ? product.images : ROZA_BEAUTY_PRODUCT.images,
      keyPoints: Array.isArray(product.keyPoints) ? product.keyPoints : ROZA_BEAUTY_PRODUCT.keyPoints,
      keyPointsTitle: product.keyPointsTitle || ROZA_BEAUTY_PRODUCT.keyPointsTitle || '',
      specs: Array.isArray(product.specs) ? product.specs : ROZA_BEAUTY_PRODUCT.specs,
      specsTitle: product.specsTitle || 'المواصفات التقنية الرسمية:',
      rating: Number(product.rating) || ROZA_BEAUTY_PRODUCT.rating,
      reviewsCount: Number(product.reviewsCount) || ROZA_BEAUTY_PRODUCT.reviewsCount,
      inStock: Boolean(product.inStock),
      guaranteeText: product.guaranteeText || ROZA_BEAUTY_PRODUCT.guaranteeText,
      categoryId: product.categoryId || 'cat-appliances',
      categorySlug: product.categorySlug || 'home-appliances',
      categoryName: product.categoryName || 'أجهزة العناية والمنزل',
      isFeatured: product.isFeatured ?? true,
      isVisible: product.isVisible ?? true
    };
    await setDoc(docRef, stripUndefined(cleanProduct));

    // Also mirror to /products/{productId} for multi-product store consistency
    if (cleanProduct.id) {
      await saveCatalogProduct(cleanProduct);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// SETTINGS: Customer Reviews (/settings/reviews)
// -------------------------------------------------------------
export async function getReviewsFromFirestore(): Promise<CustomerReview[]> {
  try {
    const docRef = doc(db, 'settings', 'reviews');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
    return ALGERIAN_CUSTOMER_REVIEWS;
  } catch (error) {
    console.error('Error fetching reviews from Firestore:', error);
    return ALGERIAN_CUSTOMER_REVIEWS;
  }
}

export function subscribeToReviews(
  onUpdate: (reviews: CustomerReview[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const docRef = doc(db, 'settings', 'reviews');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          onUpdate(data.items);
          return;
        }
      }
      onUpdate(ALGERIAN_CUSTOMER_REVIEWS);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Reviews snapshot listener error:', error);
    }
  );
}

export async function saveReviewsToFirestore(reviews: CustomerReview[]): Promise<void> {
  const path = 'settings/reviews';
  try {
    const docRef = doc(db, 'settings', 'reviews');
    const cleanReviews = reviews.map((r) => ({
      id: r.id,
      author: r.author || 'زبون من الجزائر',
      wilaya: r.wilaya || '16 - الجزائر',
      rating: Number(r.rating) || 5,
      date: r.date || 'منذ يومين',
      comment: r.comment || '',
      verified: Boolean(r.verified)
    }));
    await setDoc(docRef, { items: stripUndefined(cleanReviews) });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// SETTINGS: Pixels Configuration (/settings/pixels)
// -------------------------------------------------------------
export async function getPixelConfigFromFirestore(): Promise<PixelConfig> {
  try {
    const docRef = doc(db, 'settings', 'pixels');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<PixelConfig>;
      if (data) {
        return {
          metaPixelId: data.metaPixelId || '',
          tikTokPixelId: data.tikTokPixelId || '',
          googleTagId: data.googleTagId || '',
          enabled: data.enabled !== undefined ? data.enabled : true
        };
      }
    }
    return DEFAULT_PIXEL_CONFIG;
  } catch (error) {
    console.error('Error fetching pixel config from Firestore:', error);
    return DEFAULT_PIXEL_CONFIG;
  }
}

export function subscribeToPixelConfig(
  onUpdate: (config: PixelConfig) => void,
  onError?: (error: unknown) => void
): () => void {
  const docRef = doc(db, 'settings', 'pixels');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<PixelConfig>;
        if (data) {
          onUpdate({
            metaPixelId: data.metaPixelId || '',
            tikTokPixelId: data.tikTokPixelId || '',
            googleTagId: data.googleTagId || '',
            enabled: data.enabled !== undefined ? data.enabled : true
          });
          return;
        }
      }
      onUpdate(DEFAULT_PIXEL_CONFIG);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Pixel config snapshot listener error:', error);
    }
  );
}

export async function savePixelConfigToFirestore(config: PixelConfig): Promise<void> {
  const path = 'settings/pixels';
  try {
    const docRef = doc(db, 'settings', 'pixels');
    await setDoc(docRef, {
      metaPixelId: config.metaPixelId || '',
      tikTokPixelId: config.tikTokPixelId || '',
      googleTagId: config.googleTagId || '',
      enabled: Boolean(config.enabled)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// SETTINGS: Main Hero Banner (/settings/banner)
// -------------------------------------------------------------
export async function getBannerFromFirestore(): Promise<StoreBanner> {
  try {
    const docRef = doc(db, 'settings', 'banner');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<StoreBanner>;
      if (data && data.title) {
        return {
          ...DEFAULT_BANNER,
          ...data
        };
      }
    }
    return DEFAULT_BANNER;
  } catch (error) {
    console.error('Error fetching banner from Firestore:', error);
    return DEFAULT_BANNER;
  }
}

export function subscribeToBanner(
  onUpdate: (banner: StoreBanner) => void,
  onError?: (error: unknown) => void
): () => void {
  const docRef = doc(db, 'settings', 'banner');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<StoreBanner>;
        if (data && data.title) {
          const effectiveHeroImg = data.heroImageUrl !== undefined ? data.heroImageUrl : (data.imageUrl || DEFAULT_BANNER.imageUrl);
          const effectiveShowImg = data.showHeroImage !== undefined ? data.showHeroImage : Boolean(effectiveHeroImg);
          onUpdate({
            ...DEFAULT_BANNER,
            ...data,
            heroImageUrl: effectiveHeroImg,
            imageUrl: data.imageUrl || effectiveHeroImg,
            showHeroImage: effectiveShowImg,
            heroImageBadge: data.heroImageBadge || 'PROMO',
            showImageBadge: data.showImageBadge !== undefined ? data.showImageBadge : true
          });
          return;
        }
      }
      onUpdate(DEFAULT_BANNER);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Banner snapshot listener error:', error);
    }
  );
}

export async function saveBannerToFirestore(banner: StoreBanner): Promise<void> {
  const path = 'settings/banner';
  try {
    const docRef = doc(db, 'settings', 'banner');
    await setDoc(docRef, stripUndefined(banner));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// MULTI-PRODUCT CATALOG (/products & /categories)
// -------------------------------------------------------------

// Fetch single product by id from /products/{id} (or fallback to /settings/product)
export async function getCatalogProductById(productId: string): Promise<BeautyProduct | null> {
  try {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BeautyProduct;
      return {
        ...data,
        images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [ROZA_BEAUTY_PRODUCT.images[0]],
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        specs: Array.isArray(data.specs) ? data.specs : [],
        inStock: data.inStock !== false,
        isVisible: data.isVisible !== false
      };
    }
    // Fallback if it matches settings/product
    const fallback = await getProductFromFirestore();
    if (fallback.id === productId) {
      return fallback;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching catalog product ${productId}:`, error);
    return null;
  }
}

// Subscribe to all products in /products
export function subscribeToProducts(
  onUpdate: (products: BeautyProduct[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collectionRef = collection(db, 'products');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const prods: BeautyProduct[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as BeautyProduct;
        prods.push({
          ...data,
          id: d.id,
          images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [ROZA_BEAUTY_PRODUCT.images[0]],
          keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
          specs: Array.isArray(data.specs) ? data.specs : [],
          inStock: data.inStock !== false,
          isVisible: data.isVisible !== false
        });
      });
      onUpdate(prods);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Products snapshot listener error:', error);
    }
  );
}

// Save or update catalog product
export async function saveCatalogProduct(product: BeautyProduct): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const docRef = doc(db, 'products', product.id);
    const cleanProduct: BeautyProduct = {
      id: product.id,
      brandName: product.brandName || 'Roza Beauty DZ',
      title: product.title,
      tagline: product.tagline || '',
      price: Number(product.price) || 0,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      currency: product.currency || 'د.ج',
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [ROZA_BEAUTY_PRODUCT.images[0]],
      keyPoints: Array.isArray(product.keyPoints) ? product.keyPoints : [],
      keyPointsTitle: product.keyPointsTitle || '',
      specs: Array.isArray(product.specs) ? product.specs : [],
      specsTitle: product.specsTitle || 'المواصفات التقنية الرسمية:',
      rating: Number(product.rating) || 5.0,
      reviewsCount: Number(product.reviewsCount) || 0,
      inStock: product.inStock !== false,
      guaranteeText: product.guaranteeText || 'ضمان الجودة مع إمكانية المعاينة عند الاستلام',
      categoryId: product.categoryId || 'cat-appliances',
      categorySlug: product.categorySlug || 'home-appliances',
      categoryName: product.categoryName || 'أجهزة العناية والمنزل',
      isFeatured: Boolean(product.isFeatured),
      isVisible: product.isVisible !== false,
      stockCount: product.stockCount !== undefined ? Number(product.stockCount) : 50,
      description: product.description || ''
    };
    await setDoc(docRef, stripUndefined(cleanProduct));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete catalog product
export async function deleteCatalogProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to categories in /categories
export function subscribeToCategories(
  onUpdate: (cats: ProductCategory[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collectionRef = collection(db, 'categories');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const cats: ProductCategory[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ProductCategory;
        cats.push({
          ...data,
          id: d.id
        });
      });
      // Sort by order
      cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      onUpdate(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Categories snapshot listener error:', error);
    }
  );
}

// Save or update category
export async function saveCategory(category: ProductCategory): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, stripUndefined(category));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete category
export async function deleteCategory(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// AUTOMATIC MIGRATION: Migrate current product & categories to collections
// Runs automatically once if /products collection is empty
// -------------------------------------------------------------
export async function runStorefrontMigration(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('Migrating initial products and categories to Firestore...');
      // 1. Get current product from settings/product or fallback
      const currentProduct = await getProductFromFirestore();
      const primaryProduct: BeautyProduct = {
        ...currentProduct,
        id: currentProduct.id || ROZA_BEAUTY_PRODUCT.id,
        originalPrice: 75000,
        categoryId: 'cat-appliances',
        categorySlug: 'home-appliances',
        categoryName: 'أجهزة العناية والمنزل',
        isFeatured: true,
        isVisible: true,
        stockCount: 45
      };

      // 2. Add companion sample product so the store looks vibrant immediately
      const companionProduct: BeautyProduct = {
        id: 'roza-beauty-styler-5in1',
        brandName: 'Roza Beauty DZ',
        title: 'مصفف ومجفف الشعر الاحترافي Roza Beauty DZ 5 في 1 بتقنية الأيونات والسيراميك',
        tagline: 'مصفف شامل لتجفيف، تمليس، وتمويج الشعر بمختلف التسريحات في المنزل دون الحاجة لصالونات التجميل.',
        price: 4800,
        originalPrice: 6500,
        currency: 'د.ج',
        images: [
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'
        ],
        keyPoints: [
          '5 رؤوس قابلة للتبديل: تجفيف، تمويج خفيف، كيرلي كثيف، تمليس ناعم وتكثيف الجذور.',
          'تقنية الأيونات السالبة لمنع تطاير الشعر وهيجانه ومنحه لمعاناً حريرياً يدوم طويلاً.',
          '3 مستويات حرارة وسرعة تناسب جميع أنواع الشعر (الجاف، الناعم، والمجعد).',
          'سلك دوار 360 درجة لسهولة الحركة وتصفيف سريع وآمن دون تشابك.'
        ],
        keyPointsTitle: 'لماذا تختارين مصفف Roza Beauty 5 في 1؟',
        specs: [
          { label: 'العلامة التجارية', value: 'Roza Beauty DZ' },
          { label: 'الملحقات', value: '5 رؤوس مختلفة + فرشاة هوائية + محول كهربائي' },
          { label: 'القوة والجهد', value: '1000 واط - 220 فولت' },
          { label: 'الضمان', value: 'ضمان الجودة لمدة 12 شهراً مع إمكانية المعاينة عند الاستلام' }
        ],
        specsTitle: 'المواصفات التقنية الرسمية:',
        rating: 4.9,
        reviewsCount: 184,
        inStock: true,
        guaranteeText: 'لك كامل الحق في فتح الطرد ومعاينة الجهاز وملحقاته والتأكد منها عند الاستلام',
        categoryId: 'cat-hair-beauty',
        categorySlug: 'hair-beauty',
        categoryName: 'تصفيف وجمال الشعر',
        isFeatured: true,
        isVisible: true,
        stockCount: 60
      };

      await saveCatalogProduct(primaryProduct);
      await saveCatalogProduct(companionProduct);

      // Save categories
      for (const cat of DEFAULT_CATEGORIES) {
        await saveCategory(cat);
      }

      // Save banner
      const bannerSnap = await getDoc(doc(db, 'settings', 'banner'));
      if (!bannerSnap.exists()) {
        await saveBannerToFirestore(DEFAULT_BANNER);
      }
      console.log('Migration completed successfully.');
    }
  } catch (err) {
    console.error('Migration non-fatal error:', err);
  }
}

// -------------------------------------------------------------
// ORDERS: Create order in Firestore
// -------------------------------------------------------------
export async function createFirestoreOrder(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    const orderPayload = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      fullName: order.fullName,
      phone: order.phone,
      wilayaCode: Number(order.wilayaCode),
      wilayaName: order.wilayaName,
      commune: order.commune,
      deliveryType: order.deliveryType,
      deliveryFee: Number(order.deliveryFee),
      productId: order.productId,
      productTitle: order.productTitle,
      quantity: Number(order.quantity),
      unitPrice: Number(order.unitPrice),
      productTotal: Number(order.productTotal),
      grandTotal: Number(order.grandTotal),
      status: order.status,
      notes: order.notes || '',
      items: Array.isArray(order.items) ? order.items : []
    };
    await setDoc(orderDocRef, stripUndefined(orderPayload));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Real-time listener for orders in Firestore
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collectionPath = 'orders';
  const ordersQuery = query(collection(db, collectionPath), limit(1000));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        orders.push({
          id: docSnap.id,
          orderNumber: data.orderNumber || '',
          createdAt: data.createdAt || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          wilayaCode: data.wilayaCode || 16,
          wilayaName: data.wilayaName || '',
          commune: data.commune || '',
          deliveryType: data.deliveryType || 'home',
          deliveryFee: data.deliveryFee || 0,
          productId: data.productId || '',
          productTitle: data.productTitle || '',
          quantity: data.quantity || 1,
          unitPrice: data.unitPrice || 0,
          productTotal: data.productTotal || 0,
          grandTotal: data.grandTotal || 0,
          status: data.status || 'new',
          notes: data.notes || '',
          items: Array.isArray(data.items) ? data.items : []
        });
      });
      onUpdate(orders);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

// Update order status in Firestore
export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete single order in Firestore
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk delete orders in Firestore
export async function deleteMultipleOrdersFromFirestore(orderIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderIds.forEach((id) => {
      const docRef = doc(db, 'orders', id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'orders');
  }
}

// Sign in with Google using popup
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Sign out admin
export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

// Auth state observer
export function onAdminAuthStateChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// -------------------------------------------------------------
// ANALYTICS & EVENTS (/events)
// -------------------------------------------------------------
export function subscribeToEvents(
  onUpdate: (events: TrackingEventDoc[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collectionRef = collection(db, 'events');
  const eventsQuery = query(collectionRef, limit(1000));
  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events: TrackingEventDoc[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as TrackingEventDoc;
        events.push({
          ...data,
          id: d.id
        });
      });
      // Sort newest first
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(events);
    },
    (error) => {
      if (onError) onError(error);
      console.error('Events snapshot listener error:', error);
    }
  );
}

// -------------------------------------------------------------
// AD SPEND (/adSpend)
// -------------------------------------------------------------
export function subscribeToAdSpend(
  onUpdate: (spends: AdSpend[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const collectionRef = collection(db, 'adSpend');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: AdSpend[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as AdSpend;
        list.push({
          ...data,
          id: d.id
        });
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      console.error('AdSpend snapshot listener error:', error);
    }
  );
}

export async function saveAdSpend(spend: {
  id?: string;
  source: string;
  campaign?: string;
  amount: number;
  date: string;
  notes?: string;
}): Promise<void> {
  const spendId = spend.id || doc(collection(db, 'adSpend')).id;
  const path = `adSpend/${spendId}`;
  try {
    const docRef = doc(db, 'adSpend', spendId);
    const payload: AdSpend = {
      id: spendId,
      source: spend.source.trim().toLowerCase(),
      campaign: spend.campaign ? spend.campaign.trim() : '',
      amount: Number(spend.amount) || 0,
      date: spend.date,
      createdAt: new Date().toISOString(),
      notes: spend.notes || ''
    };
    await setDoc(docRef, stripUndefined(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAdSpend(spendId: string): Promise<void> {
  const path = `adSpend/${spendId}`;
  try {
    const docRef = doc(db, 'adSpend', spendId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


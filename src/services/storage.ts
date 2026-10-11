import { Order, BeautyProduct, OrderStatus, CustomerReview } from '../types';
import { ROZA_BEAUTY_PRODUCT } from '../data/products';
import { ALGERIAN_CUSTOMER_REVIEWS } from '../data/reviews';

export const STORAGE_ORDERS_KEY = 'roza_orders';
export const STORAGE_INITIALIZED_KEY = 'roza_orders_initialized';
export const STORAGE_PRODUCT_KEY = 'roza_beauty_product';
export const STORAGE_REVIEWS_KEY = 'roza_reviews';

const INITIAL_SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-beauty-101',
    orderNumber: 'RB-84920',
    createdAt: new Date(Date.now() - 3600000 * 2).toLocaleString('ar-DZ'),
    fullName: 'مريم حشاني',
    phone: '0555123490',
    wilayaCode: 16,
    wilayaName: '16 - الجزائر العاصمة',
    commune: 'دالي ابراهيم',
    deliveryType: 'home',
    deliveryFee: 400,
    productId: 'roza-beauty-styler-5in1',
    productTitle: 'مصفف ومجفف الشعر الاحترافي Roza Beauty DZ 5 في 1',
    quantity: 1,
    unitPrice: 4800,
    productTotal: 4800,
    grandTotal: 5200,
    status: 'confirmed',
    notes: 'التسليم بعد الساعة 16:00 مساءً'
  },
  {
    id: 'ord-beauty-102',
    orderNumber: 'RB-84919',
    createdAt: new Date(Date.now() - 3600000 * 5).toLocaleString('ar-DZ'),
    fullName: 'نوال بوطالب',
    phone: '0770984512',
    wilayaCode: 31,
    wilayaName: '31 - وهران',
    commune: 'السانية',
    deliveryType: 'desk',
    deliveryFee: 350,
    productId: 'roza-beauty-styler-5in1',
    productTitle: 'مصفف ومجفف الشعر الاحترافي Roza Beauty DZ 5 في 1',
    quantity: 1,
    unitPrice: 4800,
    productTotal: 4800,
    grandTotal: 5150,
    status: 'called',
    notes: 'استلام من مكتب التوصيل'
  },
  {
    id: 'ord-beauty-103',
    orderNumber: 'RB-84918',
    createdAt: new Date(Date.now() - 3600000 * 9).toLocaleString('ar-DZ'),
    fullName: 'سارة بوعلام',
    phone: '0662334455',
    wilayaCode: 25,
    wilayaName: '25 - قسنطينة',
    commune: 'الخروب',
    deliveryType: 'home',
    deliveryFee: 550,
    productId: 'roza-beauty-styler-5in1',
    productTitle: 'مصفف ومجفف الشعر الاحترافي Roza Beauty DZ 5 في 1',
    quantity: 1,
    unitPrice: 4800,
    productTotal: 4800,
    grandTotal: 5350,
    status: 'new',
    notes: ''
  }
];

/**
 * Get stored orders: Default/mock data is loaded ONLY if localStorage is completely empty on first visit.
 */
export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    
    // If 'roza_orders' exists in localStorage (including '[]'), use it directly
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing roza_orders:', e);
      }
    }

    // Check if the store was already initialized in the past
    const isInitialized = localStorage.getItem(STORAGE_INITIALIZED_KEY);
    if (isInitialized === 'true') {
      // User explicitly cleared or deleted orders: return empty list, DO NOT re-seed!
      return [];
    }

    // Only on very first visit: seed initial samples
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_SAMPLE_ORDERS));
    return INITIAL_SAMPLE_ORDERS;
  } catch (e) {
    console.error('Failed to load orders from storage:', e);
    return [];
  }
}

/**
 * Save new order directly to localStorage
 */
export function saveOrder(order: Order): Order[] {
  try {
    const orders = getStoredOrders();
    const updated = [order, ...orders];
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save order to storage:', e);
    return [];
  }
}

/**
 * Update order status and persist to localStorage
 */
export function updateOrderStatus(orderId: string, status: OrderStatus): Order[] {
  try {
    const orders = getStoredOrders();
    const updated = orders.map(ord => ord.id === orderId ? { ...ord, status } : ord);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to update order status:', e);
    return [];
  }
}

/**
 * Delete a single order permanently from localStorage
 */
export function deleteOrder(orderId: string): Order[] {
  try {
    const current = getStoredOrders();
    const updated = current.filter(o => o.id !== orderId);
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    localStorage.setItem('roza_beauty_orders', JSON.stringify(updated));
    localStorage.setItem('roza_dz_orders', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete order:', e);
    return [];
  }
}

/**
 * Delete multiple selected orders permanently from localStorage
 */
export function deleteMultipleOrders(orderIds: string[]): Order[] {
  try {
    const current = getStoredOrders();
    const updated = current.filter(o => !orderIds.includes(o.id));
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    localStorage.setItem('roza_beauty_orders', JSON.stringify(updated));
    localStorage.setItem('roza_dz_orders', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete multiple orders:', e);
    return [];
  }
}

/**
 * Clear orders by status from localStorage
 */
export function clearOrdersByStatus(statuses: OrderStatus[]): Order[] {
  try {
    const current = getStoredOrders();
    const updated = current.filter(o => !statuses.includes(o.status));
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
    localStorage.setItem('roza_beauty_orders', JSON.stringify(updated));
    localStorage.setItem('roza_dz_orders', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to clear orders by status:', e);
    return [];
  }
}

/**
 * Clear all orders completely from localStorage
 */
export function clearAllOrders(): Order[] {
  try {
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify([]));
    localStorage.setItem('roza_beauty_orders', JSON.stringify([]));
    localStorage.setItem('roza_dz_orders', JSON.stringify([]));
    return [];
  } catch (e) {
    console.error('Failed to clear all orders:', e);
    return [];
  }
}

export function getStoredProduct(): BeautyProduct {
  try {
    const keys = [
      STORAGE_PRODUCT_KEY,
      'roza_product',
      'roza_beauty_dz_product',
      'roza_custom_product',
      'roza_product_data'
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.title && parsed.id === ROZA_BEAUTY_PRODUCT.id) {
            return {
              ...ROZA_BEAUTY_PRODUCT,
              ...parsed,
              images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : ROZA_BEAUTY_PRODUCT.images,
              keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : ROZA_BEAUTY_PRODUCT.keyPoints,
              keyPointsTitle: parsed.keyPointsTitle !== undefined ? parsed.keyPointsTitle : ROZA_BEAUTY_PRODUCT.keyPointsTitle,
              specsTitle: parsed.specsTitle !== undefined ? parsed.specsTitle : ROZA_BEAUTY_PRODUCT.specsTitle
            };
          }
        } catch (e) {
          console.error(`Error parsing stored product for key ${key}:`, e);
        }
      }
    }
    localStorage.setItem(STORAGE_PRODUCT_KEY, JSON.stringify(ROZA_BEAUTY_PRODUCT));
    return ROZA_BEAUTY_PRODUCT;
  } catch (e) {
    console.error('Failed to load product from storage:', e);
    return ROZA_BEAUTY_PRODUCT;
  }
}

export function saveStoredProduct(product: BeautyProduct): void {
  try {
    const serialized = JSON.stringify(product);
    localStorage.setItem(STORAGE_PRODUCT_KEY, serialized);
    localStorage.setItem('roza_product', serialized);
    localStorage.setItem('roza_beauty_dz_product', serialized);
    localStorage.setItem('roza_custom_product', serialized);
    localStorage.setItem('roza_product_data', serialized);
    localStorage.setItem('roza_custom_edits_saved', 'true');
  } catch (e) {
    console.error('Failed to save product:', e);
  }
}

export function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(ALGERIAN_CUSTOMER_REVIEWS));
    return ALGERIAN_CUSTOMER_REVIEWS;
  } catch (e) {
    console.error('Failed to load reviews from storage:', e);
    return ALGERIAN_CUSTOMER_REVIEWS;
  }
}

export function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews:', e);
  }
}

/**
 * Export orders to Excel/CSV with UTF-8 BOM (\uFEFF)
 */
export function exportOrdersToCSV(orders: Order[]): void {
  const headers = [
    'رقم الطلب',
    'تاريخ الطلب',
    'اسم العميل',
    'رقم الهاتف',
    'الولاية',
    'البلدية',
    'نوع التوصيل',
    'المنتج',
    'الكمية',
    'سعر القطعة (د.ج)',
    'سعر المنتجات (د.ج)',
    'سعر الشحن (د.ج)',
    'المبلغ الإجمالي (د.ج)',
    'حالة الطلب',
    'ملاحظات الزبون'
  ];

  const statusTranslations: Record<OrderStatus, string> = {
    new: 'جديد (غير مؤكد)',
    called: 'تم الاتصال بالعميل',
    confirmed: 'مؤكد',
    shipped: 'جاري الشحن',
    delivered: 'تم التسليم بنجاح',
    cancelled: 'ملغى'
  };

  const rows = orders.map(ord => [
    `"${ord.orderNumber}"`,
    `"${ord.createdAt}"`,
    `"${ord.fullName}"`,
    `"\t${ord.phone}"`,
    `"${ord.wilayaName}"`,
    `"${ord.commune}"`,
    `"${ord.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}"`,
    `"${ord.productTitle.replace(/"/g, '""')}"`,
    ord.quantity,
    ord.unitPrice,
    ord.productTotal,
    ord.deliveryFee,
    ord.grandTotal,
    `"${statusTranslations[ord.status] || ord.status}"`,
    `"${(ord.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `طلبات_Roza_Beauty_الجزائر_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

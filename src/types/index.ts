export interface Wilaya {
  code: number;
  nameAr: string;
  nameFr: string;
  homeDeliveryPrice: number;
  deskDeliveryPrice: number;
  communes: string[];
}

export type DeliveryType = 'home' | 'desk';

export interface CustomerReview {
  id: string;
  author: string;
  wilaya: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface BeautyProduct {
  id: string;
  brandName: string;
  title: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  keyPoints: string[];
  keyPointsTitle?: string;
  specs: { label: string; value: string }[];
  specsTitle?: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  guaranteeText: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  isFeatured?: boolean;
  isVisible?: boolean;
  stockCount?: number;
  description?: string;
}

export interface CartItem {
  product: BeautyProduct;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export type OrderStatus = 'new' | 'called' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  fullName: string;
  phone: string;
  wilayaCode: number;
  wilayaName: string;
  commune: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  productTotal: number;
  grandTotal: number;
  status: OrderStatus;
  notes?: string;
  items?: OrderItem[];
}

export interface StoreBanner {
  title: string;
  subtitle: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  enabled: boolean;
  heroImageUrl?: string;
  heroImageBadge?: string;
  showHeroImage?: boolean;
  showImageBadge?: boolean;
}

export interface PixelConfig {
  metaPixelId: string;
  tikTokPixelId: string;
  googleTagId: string;
  enabled: boolean;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  platform: 'Meta' | 'TikTok' | 'Google' | 'All';
  eventName: string;
  data: Record<string, any>;
}

export type TrackingEventType = 'product_view' | 'search' | 'add_to_cart' | 'order_placed';

export interface TrackingEventDoc {
  id?: string;
  type: TrackingEventType;
  source: string;
  createdAt: string;
  productId?: string;
  query?: string;
  orderId?: string;
  total?: number;
}

export interface AdSpend {
  id: string;
  source: string;
  campaign?: string;
  amount: number;
  date: string;
  createdAt: string;
  notes?: string;
}

export interface SourceMetric {
  source: string;
  views: number;
  cartAdds: number;
  orders: number;
  revenue: number;
  spend: number;
  costPerOrder: number;
  roas: number;
}

export interface ProductMetric {
  productId: string;
  productTitle: string;
  views: number;
  cartAdds: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface SearchTermMetric {
  query: string;
  count: number;
}


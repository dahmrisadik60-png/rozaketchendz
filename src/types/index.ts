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

export interface BeautyProduct {
  id: string;
  brandName: string;
  title: string;
  tagline: string;
  price: number;
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

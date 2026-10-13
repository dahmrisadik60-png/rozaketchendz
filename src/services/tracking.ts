import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PixelConfig, PixelEventLog, TrackingEventType } from '../types';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    ttq?: {
      track: (event: string, params?: any) => void;
      page: () => void;
      load: (pixelId: string) => void;
    };
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_PIXEL_CONFIG_KEY = 'roza_dz_pixel_config';
const STORAGE_PIXEL_LOGS_KEY = 'roza_dz_pixel_logs';
const STORAGE_UTM_SOURCE_KEY = 'roza_dz_utm_source';
const STORAGE_UTM_CAMPAIGN_KEY = 'roza_dz_utm_campaign';

/**
 * Initializes and persists UTM traffic source in sessionStorage on first visit
 */
export function initTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || params.get('source');
    const utmCampaign = params.get('utm_campaign') || params.get('campaign');

    if (utmSource) {
      const cleanSource = utmSource.trim().toLowerCase().slice(0, 64);
      sessionStorage.setItem(STORAGE_UTM_SOURCE_KEY, cleanSource);
      if (utmCampaign) {
        sessionStorage.setItem(STORAGE_UTM_CAMPAIGN_KEY, utmCampaign.trim().slice(0, 128));
      }
      return cleanSource;
    }

    const existing = sessionStorage.getItem(STORAGE_UTM_SOURCE_KEY);
    if (existing) {
      return existing;
    }

    // Infer from document.referrer
    let inferred = 'direct';
    const ref = (document.referrer || '').toLowerCase();
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) {
      inferred = 'facebook';
    } else if (ref.includes('instagram.com')) {
      inferred = 'instagram';
    } else if (ref.includes('tiktok.com')) {
      inferred = 'tiktok';
    } else if (ref.includes('google.com') || ref.includes('google.dz')) {
      inferred = 'google';
    } else if (ref.includes('snapchat.com')) {
      inferred = 'snapchat';
    } else if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      inferred = 'youtube';
    } else if (ref) {
      try {
        const url = new URL(ref);
        inferred = url.hostname.replace(/^www\./, '').slice(0, 32);
      } catch {
        inferred = 'referral';
      }
    }

    sessionStorage.setItem(STORAGE_UTM_SOURCE_KEY, inferred);
    return inferred;
  } catch (err) {
    console.warn('Traffic source init warning:', err);
    return 'direct';
  }
}

/**
 * Retrieves the current visitor's traffic source (e.g. facebook, instagram, direct)
 */
export function getTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const src = sessionStorage.getItem(STORAGE_UTM_SOURCE_KEY);
    if (src) return src;
    return initTrafficSource();
  } catch {
    return 'direct';
  }
}

/**
 * Logs an event to the Firestore 'events' collection
 * Strictly non-blocking for visitor reliability
 */
export async function logStoreEvent(
  type: TrackingEventType,
  payload: {
    productId?: string;
    query?: string;
    orderId?: string;
    total?: number;
    source?: string;
  } = {}
): Promise<void> {
  try {
    const source = payload.source || getTrafficSource() || 'direct';
    const eventDocRef = doc(collection(db, 'events'));
    const docData: Record<string, any> = {
      type,
      source: source.slice(0, 64),
      createdAt: new Date().toISOString()
    };

    if (payload.productId) {
      docData.productId = String(payload.productId).slice(0, 128);
    }
    if (payload.query) {
      docData.query = String(payload.query).trim().slice(0, 128);
    }
    if (payload.orderId) {
      docData.orderId = String(payload.orderId).slice(0, 128);
    }
    if (payload.total !== undefined && payload.total !== null) {
      docData.total = Number(payload.total) || 0;
    }

    await setDoc(eventDocRef, docData);
  } catch (err) {
    // Non-fatal for users
    console.warn('Store event logging error:', err);
  }
}

export const DEFAULT_PIXEL_CONFIG: PixelConfig = {
  metaPixelId: '',
  tikTokPixelId: '',
  googleTagId: '',
  enabled: true
};

let currentRuntimePixelConfig: PixelConfig | null = null;

export function setRuntimePixelConfig(config: PixelConfig): void {
  currentRuntimePixelConfig = config;
  initPixels(config);
}

export function getPixelConfig(): PixelConfig {
  if (currentRuntimePixelConfig) {
    return currentRuntimePixelConfig;
  }
  try {
    const raw = localStorage.getItem(STORAGE_PIXEL_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load pixel config:', e);
  }
  return DEFAULT_PIXEL_CONFIG;
}

export function savePixelConfig(config: PixelConfig): void {
  try {
    localStorage.setItem(STORAGE_PIXEL_CONFIG_KEY, JSON.stringify(config));
    initPixels(config);
  } catch (e) {
    console.error('Failed to save pixel config:', e);
  }
}

export function getPixelLogs(): PixelEventLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_PIXEL_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load pixel logs:', e);
  }
  return [];
}

export function addPixelLog(log: Omit<PixelEventLog, 'id' | 'timestamp'>): void {
  try {
    const current = getPixelLogs();
    const newLog: PixelEventLog = {
      ...log,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('ar-DZ')
    };
    const updated = [newLog, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_PIXEL_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save pixel log:', e);
  }
}

export function clearPixelLogs(): void {
  try {
    localStorage.removeItem(STORAGE_PIXEL_LOGS_KEY);
  } catch (e) {
    console.error('Failed to clear logs:', e);
  }
}

// Initialize pixels dynamically
export function initPixels(config?: PixelConfig): void {
  const cfg = config || getPixelConfig();
  if (!cfg.enabled) return;

  // Initialize Meta Pixel
  if (cfg.metaPixelId && typeof window !== 'undefined') {
    if (!window.fbq) {
      /* eslint-disable */
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s && s.parentNode && s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }
    try {
      window.fbq?.('init', cfg.metaPixelId);
      window.fbq?.('track', 'PageView');
    } catch (e) {
      console.warn('Meta Pixel Init error:', e);
    }
  }

  // Initialize TikTok Pixel
  if (cfg.tikTokPixelId && typeof window !== 'undefined') {
    if (!window.ttq) {
      /* eslint-disable */
      (function(w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer = function(t: any, e: any) {
          t[e] = function() {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
          }
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function(e: any, n: any) {
          var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date;
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var o = document.createElement("script");
          o.type = "text/javascript";
          o.async = !0;
          o.src = r + "?sdkid=" + e + "&lib=" + t;
          var a = document.getElementsByTagName("script")[0];
          a && a.parentNode && a.parentNode.insertBefore(o, a);
        };
      })(window, document, 'ttq');
      /* eslint-enable */
    }
    try {
      window.ttq?.load(cfg.tikTokPixelId);
      window.ttq?.page();
    } catch (e) {
      console.warn('TikTok Pixel Init error:', e);
    }
  }

  // Initialize Google Tag
  if (cfg.googleTagId && typeof window !== 'undefined') {
    if (!window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.googleTagId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', cfg.googleTagId);
    }
  }
}

/**
 * Universal Event Dispatcher
 */
export const TrackingService = {
  // PageView
  trackPageView(pageName: string = 'RozaDZ_LandingPage') {
    const config = getPixelConfig();
    addPixelLog({
      platform: 'All',
      eventName: 'PageView',
      data: { page: pageName }
    });

    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'PageView');
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.page();
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'page_view', { page_title: pageName });
      } catch (e) {}
    }
  },

  // ViewContent
  trackViewContent(product: { id: string; title: string; price: number; currency: string }) {
    const config = getPixelConfig();
    const data = {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price,
      currency: 'DZD'
    };

    addPixelLog({
      platform: 'All',
      eventName: 'ViewContent',
      data
    });

    // Also persist event to Firestore /events collection
    if (product.id) {
      logStoreEvent('product_view', { productId: product.id });
    }

    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'ViewContent', data);
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.track('ViewContent', {
          content_id: product.id,
          content_type: 'product',
          content_name: product.title,
          price: product.price,
          currency: 'DZD'
        });
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'view_item', {
          items: [{ id: product.id, name: product.title, price: product.price }]
        });
      } catch (e) {}
    }
  },

  // AddToCart
  trackAddToCart(product: { id: string; title: string; price: number; currency: string; quantity: number }) {
    const config = getPixelConfig();
    const data = {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'DZD',
      num_items: product.quantity
    };

    addPixelLog({
      platform: 'All',
      eventName: 'AddToCart',
      data
    });

    // Also persist event to Firestore /events collection
    if (product.id) {
      logStoreEvent('add_to_cart', { productId: product.id });
    }

    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'AddToCart', data);
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.track('AddToCart', {
          content_id: product.id,
          content_type: 'product',
          content_name: product.title,
          quantity: product.quantity,
          price: product.price,
          value: product.price * product.quantity,
          currency: 'DZD'
        });
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'add_to_cart', {
          value: product.price * product.quantity,
          currency: 'DZD',
          items: [{ id: product.id, name: product.title, price: product.price, quantity: product.quantity }]
        });
      } catch (e) {}
    }
  },

  // InitiateCheckout
  trackInitiateCheckout(product: { id: string; title: string; price: number; quantity: number }) {
    const config = getPixelConfig();
    const data = {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'DZD',
      num_items: product.quantity
    };

    addPixelLog({
      platform: 'All',
      eventName: 'InitiateCheckout',
      data
    });

    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', data);
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.track('InitiateCheckout', {
          content_id: product.id,
          content_type: 'product',
          content_name: product.title,
          quantity: product.quantity,
          price: product.price,
          value: product.price * product.quantity,
          currency: 'DZD'
        });
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'begin_checkout', {
          value: product.price * product.quantity,
          currency: 'DZD',
          items: [{ id: product.id, name: product.title, price: product.price, quantity: product.quantity }]
        });
      } catch (e) {}
    }
  },

  // Purchase / Lead (Algeria COD success)
  trackPurchase(order: {
    orderNumber: string;
    productTitle: string;
    productId: string;
    grandTotal: number;
    quantity: number;
    phone: string;
  }) {
    const config = getPixelConfig();
    const data = {
      content_name: order.productTitle,
      content_ids: [order.productId],
      content_type: 'product',
      value: order.grandTotal,
      currency: 'DZD',
      num_items: order.quantity,
      order_id: order.orderNumber
    };

    addPixelLog({
      platform: 'All',
      eventName: 'Purchase',
      data
    });

    // Also trigger Lead event as standard Algerian COD best practice
    addPixelLog({
      platform: 'All',
      eventName: 'Lead',
      data: { order_id: order.orderNumber, value: order.grandTotal, currency: 'DZD' }
    });

    // Persist order_placed event to Firestore /events collection
    logStoreEvent('order_placed', {
      orderId: order.orderNumber,
      total: order.grandTotal,
      productId: order.productId
    });

    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'Purchase', data);
        window.fbq('track', 'Lead', {
          content_name: order.productTitle,
          value: order.grandTotal,
          currency: 'DZD'
        });
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.track('CompletePayment', {
          content_id: order.productId,
          content_type: 'product',
          content_name: order.productTitle,
          quantity: order.quantity,
          value: order.grandTotal,
          currency: 'DZD'
        });
        window.ttq.track('SubmitForm', {
          value: order.grandTotal,
          currency: 'DZD'
        });
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'purchase', {
          transaction_id: order.orderNumber,
          value: order.grandTotal,
          currency: 'DZD',
          items: [{ id: order.productId, name: order.productTitle, price: order.grandTotal / order.quantity, quantity: order.quantity }]
        });
      } catch (e) {}
    }
  },

  // Search
  trackSearch(query: string) {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();

    addPixelLog({
      platform: 'All',
      eventName: 'Search',
      data: { query: cleanQuery }
    });

    // Persist search query to Firestore /events collection
    logStoreEvent('search', { query: cleanQuery });

    const config = getPixelConfig();
    if (!config.enabled) return;

    if (window.fbq) {
      try {
        window.fbq('track', 'Search', { search_string: cleanQuery });
      } catch (e) {}
    }
    if (window.ttq) {
      try {
        window.ttq.track('Search', { query: cleanQuery });
      } catch (e) {}
    }
    if (window.gtag && config.googleTagId) {
      try {
        window.gtag('event', 'search', { search_term: cleanQuery });
      } catch (e) {}
    }
  }
};


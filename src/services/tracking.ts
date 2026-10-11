import { PixelConfig, PixelEventLog } from '../types';

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

export const DEFAULT_PIXEL_CONFIG: PixelConfig = {
  metaPixelId: '',
  tikTokPixelId: '',
  googleTagId: '',
  enabled: true
};

export function getPixelConfig(): PixelConfig {
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
  }
};

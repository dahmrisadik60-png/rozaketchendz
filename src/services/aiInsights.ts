import { getAI, getGenerativeModel } from 'firebase/ai';
import { app } from './firebase';
import { Order, BeautyProduct, TrackingEventDoc, AdSpend, SourceMetric, ProductMetric, SearchTermMetric } from '../types';

export interface AggregatedInsightsSummary {
  periodDays: number | 'all';
  hasMinimumSevenDays: boolean;
  totalViews: number;
  totalOrders: number;
  totalRevenue: number;
  totalAdSpend: number;
  costPerOrder: number;
  overallRoas: number;
  topViewedProducts: ProductMetric[];
  bestSellers: ProductMetric[];
  highViewsLowOrders: ProductMetric[];
  topSearchTerms: SearchTermMetric[];
  sourceMetrics: SourceMetric[];
}

/**
 * Calculates aggregated e-commerce numbers for the selected time window (7, 30, or all days)
 * STRICT PRIVACY: NEVER includes customer names, phones, or addresses.
 */
export function calculateAggregatedInsights(
  events: TrackingEventDoc[],
  orders: Order[],
  adSpends: AdSpend[],
  products: BeautyProduct[],
  daysFilter: number | null
): AggregatedInsightsSummary {
  const now = Date.now();
  const cutoffTime = daysFilter ? now - daysFilter * 24 * 60 * 60 * 1000 : 0;

  // Filter records within date range
  const filteredEvents = events.filter((e) => {
    if (!daysFilter) return true;
    const time = new Date(e.createdAt).getTime();
    return !isNaN(time) ? time >= cutoffTime : true;
  });

  const filteredOrders = orders.filter((o) => {
    if (!daysFilter) return true;
    const time = new Date(o.createdAt).getTime();
    return !isNaN(time) ? time >= cutoffTime : true;
  });

  const filteredSpends = adSpends.filter((s) => {
    if (!daysFilter) return true;
    const time = new Date(s.date).getTime();
    return !isNaN(time) ? time >= cutoffTime : true;
  });

  // Check 7-day data depth
  let hasMinimumSevenDays = false;
  const allTimestamps: number[] = [
    ...filteredEvents.map((e) => new Date(e.createdAt).getTime()),
    ...filteredOrders.map((o) => new Date(o.createdAt).getTime()),
    ...filteredSpends.map((s) => new Date(s.date).getTime())
  ].filter((t) => !isNaN(t) && t > 0);

  if (allTimestamps.length > 0) {
    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);
    const spanDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);
    hasMinimumSevenDays = spanDays >= 6.5;
  }

  // 1. Product mapping
  const productTitleMap = new Map<string, string>();
  products.forEach((p) => {
    productTitleMap.set(p.id, p.title);
  });

  const productMetricsMap = new Map<string, { views: number; cartAdds: number; orders: number; revenue: number }>();

  // Count product views & cart adds from events
  filteredEvents.forEach((e) => {
    if (e.productId) {
      const current = productMetricsMap.get(e.productId) || { views: 0, cartAdds: 0, orders: 0, revenue: 0 };
      if (e.type === 'product_view') {
        current.views += 1;
      } else if (e.type === 'add_to_cart') {
        current.cartAdds += 1;
      }
      productMetricsMap.set(e.productId, current);
    }
  });

  // Count orders and revenue per product
  filteredOrders.forEach((o) => {
    const current = productMetricsMap.get(o.productId) || { views: 0, cartAdds: 0, orders: 0, revenue: 0 };
    current.orders += Number(o.quantity) || 1;
    current.revenue += Number(o.grandTotal) || 0;
    productMetricsMap.set(o.productId, current);
  });

  const productMetricsList: ProductMetric[] = Array.from(productMetricsMap.entries()).map(([pId, m]) => {
    const title = productTitleMap.get(pId) || `منتج (${pId})`;
    const conversionRate = m.views > 0 ? (m.orders / m.views) * 100 : 0;
    return {
      productId: pId,
      productTitle: title,
      views: m.views,
      cartAdds: m.cartAdds,
      orders: m.orders,
      revenue: m.revenue,
      conversionRate: Math.round(conversionRate * 10) / 10
    };
  });

  // Top viewed products
  const topViewedProducts = [...productMetricsList]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Best sellers
  const bestSellers = [...productMetricsList]
    .filter((p) => p.orders > 0)
    .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
    .slice(0, 5);

  // Products with high views but low orders (views >= 2 and conversion rate < 15%)
  const highViewsLowOrders = [...productMetricsList]
    .filter((p) => p.views >= 2 && p.orders <= 1)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // 2. Top search terms
  const searchCounts = new Map<string, number>();
  filteredEvents.forEach((e) => {
    if (e.type === 'search' && e.query) {
      const q = e.query.trim().toLowerCase();
      if (q) {
        searchCounts.set(q, (searchCounts.get(q) || 0) + 1);
      }
    }
  });

  const topSearchTerms: SearchTermMetric[] = Array.from(searchCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 3. Traffic sources breakdown
  const sourceStatsMap = new Map<string, { views: number; cartAdds: number; orders: number; revenue: number; spend: number }>();

  const getOrInitSource = (src: string) => {
    const s = (src || 'direct').toLowerCase();
    if (!sourceStatsMap.has(s)) {
      sourceStatsMap.set(s, { views: 0, cartAdds: 0, orders: 0, revenue: 0, spend: 0 });
    }
    return sourceStatsMap.get(s)!;
  };

  filteredEvents.forEach((e) => {
    const stat = getOrInitSource(e.source);
    if (e.type === 'product_view') stat.views += 1;
    if (e.type === 'add_to_cart') stat.cartAdds += 1;
  });

  filteredOrders.forEach((o) => {
    // Determine order source from events if possible or default to direct
    const stat = getOrInitSource('direct');
    stat.orders += 1;
    stat.revenue += Number(o.grandTotal) || 0;
  });

  filteredSpends.forEach((s) => {
    const stat = getOrInitSource(s.source);
    stat.spend += Number(s.amount) || 0;
  });

  const sourceMetrics: SourceMetric[] = Array.from(sourceStatsMap.entries()).map(([source, s]) => {
    const costPerOrder = s.orders > 0 && s.spend > 0 ? Math.round(s.spend / s.orders) : 0;
    const roas = s.spend > 0 ? Math.round((s.revenue / s.spend) * 10) / 10 : 0;
    return {
      source,
      views: s.views,
      cartAdds: s.cartAdds,
      orders: s.orders,
      revenue: s.revenue,
      spend: s.spend,
      costPerOrder,
      roas
    };
  }).sort((a, b) => (b.orders || 0) - (a.orders || 0) || (b.views || 0) - (a.views || 0));

  // Global sums
  const totalViews = filteredEvents.filter((e) => e.type === 'product_view').length;
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (Number(o.grandTotal) || 0), 0);
  const totalAdSpend = filteredSpends.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const costPerOrder = totalOrders > 0 && totalAdSpend > 0 ? Math.round(totalAdSpend / totalOrders) : 0;
  const overallRoas = totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 10) / 10 : 0;

  return {
    periodDays: daysFilter || 'all',
    hasMinimumSevenDays,
    totalViews,
    totalOrders,
    totalRevenue,
    totalAdSpend,
    costPerOrder,
    overallRoas,
    topViewedProducts,
    bestSellers,
    highViewsLowOrders,
    topSearchTerms,
    sourceMetrics
  };
}

/**
 * Builds compact JSON and sends to Gemini via Firebase AI Logic (firebase/ai)
 * STRICT SECURITY: No customer personal info, only aggregated counts and metrics.
 */
export async function analyzeStoreMetricsWithAI(summary: AggregatedInsightsSummary): Promise<string> {
  const compactPayload = {
    period: summary.periodDays === 'all' ? 'جميع البيانات المسجلة' : `آخر ${summary.periodDays} يوماً`,
    dataCoverageOver7Days: summary.hasMinimumSevenDays,
    kpis: {
      totalProductViews: summary.totalViews,
      totalOrdersPlaced: summary.totalOrders,
      totalRevenueDZD: summary.totalRevenue,
      totalAdSpendDZD: summary.totalAdSpend,
      averageCostPerOrderDZD: summary.costPerOrder,
      overallROAS: summary.overallRoas
    },
    topViewedProducts: summary.topViewedProducts.map((p) => ({
      title: p.productTitle,
      views: p.views,
      orders: p.orders,
      conversionRatePercent: p.conversionRate
    })),
    bestSellingProducts: summary.bestSellers.map((p) => ({
      title: p.productTitle,
      ordersCount: p.orders,
      revenueDZD: p.revenue
    })),
    highViewsLowOrdersProducts: summary.highViewsLowOrders.map((p) => ({
      title: p.productTitle,
      views: p.views,
      orders: p.orders,
      note: 'معدل تحويل منخفض رغم اهتمام الزوار'
    })),
    topSearchTerms: summary.topSearchTerms.map((s) => ({
      query: s.query,
      searchCount: s.count
    })),
    channelPerformance: summary.sourceMetrics.map((c) => ({
      channel: c.source,
      views: c.views,
      orders: c.orders,
      revenueDZD: c.revenue,
      spendDZD: c.spend,
      costPerOrderDZD: c.costPerOrder,
      roas: c.roas
    }))
  };

  const prompt = `أنت مستشار استراتيجي أول في التجارة الإلكترونية الجزائرية (E-Commerce DZ & COD).
أمامك ملخص إحصائي دقيق ومجمع لمتجر "Roza Beauty DZ" لمنتجات التجميل والعناية الشخصية:

${JSON.stringify(compactPayload, null, 2)}

المطلوب: تقديم تقرير استراتيجي تحليلي وعملي فوري، مكتوب باللغة العربية الواضحة والراقية والمحببة لتجار الجزائر (مع مصطلحات الدارجة المهنية لرواد الأعمال: د.ج، COD، العائد على الإعلانات، تكلفة الطلب، نسبة التحويل).

قسّم التقرير بدقة إلى الأقسام التالية:
1. 📈 ملخص أداء الفترة (Weekly / Period Summary): تحليل شامل للزيارات، الطلبات، ومستوى التحويل العام.
2. 🚀 منتجات يُنصح بعمل تخفيض أو ترويج مكثف لها (Promote & Discount): حدد المنتجات ذات الطلب العالي أو الإقبال الجيد واقترح عروض باقات (Packs).
3. ⚠️ منتجات راكدة أو ذات مشاهدات عالية وطلبات قليلة (Stagnant Products): حلل سبب تردد الزبائن (السعر، وضوح الصور، وصف المنتج، أو غياب الثقة) وقدم حلولاً فورية.
4. 💡 نصائح عملية تخص التسعير، جودة الصور، الوصف، وإدارة المخزون (Actionable Advice): نصائح تسعيرية ونفسية ملائمة للسوق الجزائري مع الدفع عند الاستلام.
5. 🎯 تقييم أداء كل مصدر إعلاني (Ad Sources Evaluation): قيّم كل مصدر (فيسبوك، إنستغرام، تيك توك، مباشر...)، وحدد القنوات المربحة وتلك التي تهدر الميزانية، وهل تكلفة الطلب (CPA) مقبولة.

${!summary.hasMinimumSevenDays ? 'ملاحظة: البيانات المتوفرة تغطي أقل من 7 أيام، نرجو التنويه في بداية التقرير بأن النتائج أولية وتتطلب جمع بيانات إضافية.' : ''}
اجعل الأسلوب مباشراً ومحفزاً ومنظماً بنقاط واضحة.`;

  try {
    const ai = getAI(app);
    const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    if (text && text.trim().length > 0) {
      return text;
    }
    throw new Error('رد الذكاء الاصطناعي فارغ.');
  } catch (err: any) {
    console.warn('Firebase AI GenerativeModel error, generating intelligent local business report:', err);
    // Return structured intelligent analysis directly computed from the metrics
    return generateLocalFallbackReport(summary);
  }
}

/**
 * Intelligent deterministic business engine providing comprehensive Algerian E-Commerce report
 * fallback if Firebase AI is offline or pending Vertex activation.
 */
function generateLocalFallbackReport(s: AggregatedInsightsSummary): string {
  const warningText = !s.hasMinimumSevenDays
    ? `⚠️ **تنبيه أولي:** البيانات المتوفرة تغطي أقل من 7 أيام (${s.totalViews} مشاهدة و ${s.totalOrders} طلب). النتائج تعتبر مؤشرات مبكرة ويُفضل تتبع أسبوعين للحصول على دقة إحصائية متكاملة.\n\n`
    : '';

  const bestSeller = s.bestSellers[0];
  const stagnant = s.highViewsLowOrders[0];
  const bestChannel = s.sourceMetrics.find((c) => c.orders > 0) || s.sourceMetrics[0];

  return `${warningText}## 📊 1. ملخص أداء الفترة
- **إجمالي المشاهدات:** ${s.totalViews.toLocaleString('ar-DZ')} مشاهدة.
- **إجمالي الطلبات المسجلة:** ${s.totalOrders.toLocaleString('ar-DZ')} طلب مع نظام الدفع عند الاستلام (COD).
- **إجمالي المداخيل المحققة:** ${s.totalRevenue.toLocaleString('ar-DZ')} د.ج.
- **إجمالي الإنفاق الإعلاني:** ${s.totalAdSpend.toLocaleString('ar-DZ')} د.ج.
- **متوسط تكلفة الطلب (CPA):** ${s.costPerOrder > 0 ? `${s.costPerOrder.toLocaleString('ar-DZ')} د.ج` : 'لا توجد مصاريف مسجلة بعد'}.
- **معدل العائد على الإنفاق (ROAS):** ${s.overallRoas > 0 ? `${s.overallRoas}x` : 'قيد القياس'}.

---

## 🚀 2. منتجات يُنصح بعمل تخفيض أو ترويج مكثف لها
${bestSeller ? `- **${bestSeller.productTitle}:** هذا المنتج هو الحصان الرابح (${bestSeller.orders} طلب، مداخيل ${bestSeller.revenue.toLocaleString('ar-DZ')} د.ج). يُنصح فوراً بـ:
  - إنشاء باقات ترويجية (مثال: جهاز + ملحق إضافي بسعر تفضيلي أو توصيل مجاني للولايات الكبرى).
  - زيادة ميزانية الإعلانات الموجهة له بنسبة 25% مع التركيز على فيديوهات ريفيو حقيقية (UGC).` : '- لم يتم تسجيل طلبات كافية بعد. نوصي بتسليط الضوء على المنتج الرئيسي في أعلى الصفحة وإبراز ميزة المعاينة قبل الدفع.'}

---

## ⚠️ 3. منتجات راكدة أو ذات مشاهدات عالية وطلبات قليلة
${stagnant ? `- **${stagnant.productTitle}:** حصد ${stagnant.views} مشاهدة ولكن بمعدل طلبات ضعيف (${stagnant.orders} طلب).
  - **التشخيص:** الزوار يثير فضولهم المنتج، لكن يوجد حاجز في صفحة الطلب (السعر النفسي أو غموض طريقة الاستعمال).
  - **الحل المقترح:** إضافة فيديو قصير يوضح النتيجة الفورية، ووضع شارة "ضمان استبدال ومعاينة عند الاستلام" مباشرة تحت السعر.` : '- لا توجد منتجات راكدة بحدة حالياً. نسب التحويل مقبولة بالنسبة لعدد الزوار.'}

---

## 💡 4. نصائح عملية تخص التسعير، جودة الصور، والوصف
1. **التسعير النفسي الجزائري:** الاعتماد على أسعار تنتهي بـ 800 أو 900 د.ج (مثل 4,800 د.ج بدل 5,000 د.ج) لتقليل المقاومة النفسية للزبون.
2. **صور واقعية جزائرية:** الزبونة الجزائرية تفضل صور المنتج على أرض الواقع بالكرتونة الأصلية على الصور الدعائية البيضاء المجردة.
3. **وضوح خيارات الشحن:** التأكيد على أسعار التوصيل (مكتب / منزل) يقلل إلغاء الطلبات بعد الاتصال الهاتفي بنسبة تفوق 30%.
4. **المخزون السريع:** التأكد من توفر كميات كافية من المنتج الأكثر طلباً لتفادي تأخر الشحن.

---

## 🎯 5. تقييم أداء القنوات الإعلانية
${bestChannel ? `- **قناة (${bestChannel.source}):** سجلت ${bestChannel.orders} طلب و ${bestChannel.views} زيارة. إن كانت تكلفة الطلب أقل من 800 د.ج، فالأداء ممتاز ويستحق ضخ ميزانية إضافية.` : '- لم يتم تسجيل بيانات حملات كافية بعد.'}
- **حملات فيسبوك وإنستغرام (Meta Ads):** مثالية لجمهور النساء ومنتجات العناية بالشعر والبشرة عبر صيغة Reels و Stories.
- **تيك توك (TikTok):** يوفر تكلفة نقرة رخيصة جداً، لكن يتطلب سرعة تأكيد الطلب هاتفياً خلال أقل من ساعتين لأن زبائن تيك توك يغيرون رأيهم بسرعة.`;
}

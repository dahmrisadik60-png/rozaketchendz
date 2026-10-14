import React, { useState, useMemo } from 'react';
import { 
  Sparkles, TrendingUp, ShoppingBag, Eye, DollarSign, 
  Calendar, AlertTriangle, Search, Plus, Trash2, ArrowUpRight, 
  CheckCircle2, RefreshCw, Layers, Copy, Check, BarChart2
} from 'lucide-react';
import { 
  Order, 
  BeautyProduct, 
  TrackingEventDoc, 
  AdSpend 
} from '../types';
import { 
  calculateAggregatedInsights, 
  analyzeStoreMetricsWithAI 
} from '../services/aiInsights';
import { saveAdSpend, deleteAdSpend } from '../services/firebase';

interface AiInsightsTabProps {
  orders: Order[];
  products: BeautyProduct[];
  events: TrackingEventDoc[];
  adSpends: AdSpend[];
  isGoogleAdmin: boolean;
  onNotice: (msg: string) => void;
}

const FormattedReportView: React.FC<{ text: string }> = ({ text }) => {
  const renderFormattedLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-black text-[#4a2b3d]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm text-[#4a2b3d] leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-0.5" />;

        if (line.startsWith('## ') || line.startsWith('### ')) {
          const title = line.replace(/^#{2,3}\s+/, '');
          return (
            <div key={idx} className="pt-2 pb-1 border-b border-[#f7dfe8]">
              <h5 className="font-black text-sm sm:text-base text-[#8d2a58] flex items-center gap-2">
                {title}
              </h5>
            </div>
          );
        }

        if (line === '---') {
          return <hr key={idx} className="my-2 border-[#f7dfe8]" />;
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
          const bulletContent = line.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pr-1 sm:pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d94f86] mt-2 shrink-0" />
              <div className="flex-1">{renderFormattedLine(bulletContent)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedLine(line)}
          </p>
        );
      })}
    </div>
  );
};

export const AiInsightsTab: React.FC<AiInsightsTabProps> = ({
  orders,
  products,
  events,
  adSpends,
  isGoogleAdmin,
  onNotice
}) => {
  // Period filter: 7 days, 30 days, or null (all time)
  const [daysFilter, setDaysFilter] = useState<number | null>(7);

  // Ad Spend form state
  const [spendSource, setSpendSource] = useState('facebook');
  const [customSource, setCustomSource] = useState('');
  const [spendCampaign, setSpendCampaign] = useState('');
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [spendDate, setSpendDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [spendNotes, setSpendNotes] = useState('');
  const [isSavingSpend, setIsSavingSpend] = useState(false);

  // AI Analysis state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Computed summary
  const summary = useMemo(() => {
    return calculateAggregatedInsights(events, orders, adSpends, products, daysFilter);
  }, [events, orders, adSpends, products, daysFilter]);

  // Handle adding new ad spend
  const handleAddAdSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSource = spendSource === 'other' ? customSource.trim() : spendSource;
    const amountNum = Number(spendAmount);

    if (!effectiveSource) {
      alert('يرجى تحديد مصدر الإعلان أو إدخال اسمه');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      alert('يرجى إدخال مبلغ صحيح بالدينار الجزائري');
      return;
    }

    setIsSavingSpend(true);
    try {
      await saveAdSpend({
        source: effectiveSource,
        campaign: spendCampaign.trim(),
        amount: amountNum,
        date: spendDate || new Date().toISOString().split('T')[0],
        notes: spendNotes.trim()
      });
      setSpendAmount('');
      setSpendCampaign('');
      setSpendNotes('');
      onNotice('تم تسجيل الإنفاق الإعلاني بنجاح');
    } catch (err: any) {
      console.error(err);
      alert('تعذر حفظ الإنفاق الإعلاني. تأكد من صلاحيات الأدمن');
    } finally {
      setIsSavingSpend(false);
    }
  };

  const handleDeleteAdSpend = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل من الإنفاق الإعلاني؟')) return;
    try {
      await deleteAdSpend(id);
      onNotice('تم حذف سجل الإنفاق بنجاح');
    } catch (err) {
      console.error(err);
      alert('تعذر حذف السجل');
    }
  };

  // Run AI analysis
  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const report = await analyzeStoreMetricsWithAI(summary);
      setAiReport(report);
      onNotice('تم توليد التقرير الاستراتيجي بالذكاء الاصطناعي بنجاح!');
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || 'تعذر استدعاء الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header with Time Range Selector & AI CTA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#b8386d] to-[#d94f86] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-black text-[#4a2b3d] text-base sm:text-lg">
              ذكاء الأعمال ورؤى الذكاء الاصطناعي (AI Insights)
            </h3>
          </div>
          <p className="text-xs text-[#8a6b7a] mt-1">
            تحليل شامل لأرقام المتجر، مصادر الزيارات، تكلفة الإعلانات، وتوصيات نمو موجهة للسوق الجزائري.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#fff8f5] p-1.5 rounded-xl border border-[#f7dfe8] shrink-0 self-stretch md:self-auto justify-center">
          <button
            type="button"
            onClick={() => setDaysFilter(7)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              daysFilter === 7
                ? 'bg-[#d94f86] text-white shadow-xs'
                : 'text-[#8a6b7a] hover:text-[#4a2b3d]'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            type="button"
            onClick={() => setDaysFilter(30)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              daysFilter === 30
                ? 'bg-[#d94f86] text-white shadow-xs'
                : 'text-[#8a6b7a] hover:text-[#4a2b3d]'
            }`}
          >
            آخر 30 يوماً
          </button>
          <button
            type="button"
            onClick={() => setDaysFilter(null)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              daysFilter === null
                ? 'bg-[#d94f86] text-white shadow-xs'
                : 'text-[#8a6b7a] hover:text-[#4a2b3d]'
            }`}
          >
            كامل الفترة
          </button>
        </div>
      </div>

      {/* 2. Warning if less than 7 days of data */}
      {!summary.hasMinimumSevenDays && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-bold mb-0.5">تنبيه فترة البيانات (أقل من 7 أيام):</strong>
            البيانات المسجلة تغطي أقل من 7 أيام كاملة. التحليلات الإحصائية وتوصيات الذكاء الاصطناعي قد تكون أولية حتى يتم جمع عينة كافية من الزيارات والمشتريات خلال دورة أسبوعية كاملة.
          </div>
        </div>
      )}

      {/* 3. "Analyze with AI" Section with Gemini Button (Hero Placement for Instant Access) */}
      <div className="bg-gradient-to-r from-[#4a2b3d] via-[#6d3255] to-[#4a2b3d] text-white p-5 sm:p-6 rounded-3xl shadow-lg border-2 border-amber-300/30 ring-4 ring-rose-500/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded-full text-[11px] font-black mb-2 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>محلل الذكاء الاصطناعي للسوق الجزائري (Gemini AI Advisor)</span>
            </div>
            <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>استخراج تقرير استراتيجي فوري بالذكاء الاصطناعي</span>
            </h4>
            <p className="text-xs text-rose-100/80 mt-1 leading-relaxed">
              يقوم الذكاء الاصطناعي بفحص جميع أرقام المبيعات، الزيارات، سلوك البحث، وتكلفة الإعلانات لتقديم توصيات تسعيرية، باقات ترويجية، كشف المنتجات الراكدة، وتقييم كفاءة كل قناة إعلانية.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAiLoading}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 via-rose-500 to-[#d94f86] hover:from-amber-300 hover:to-[#c93d78] text-[#4a2b3d] hover:text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isAiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span className="text-white">جاري تحليل الأرقام واستخراج الرؤى...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#4a2b3d]" />
                <span>⚡ تشغيل التحليل بالذكاء الاصطناعي الآن</span>
              </>
            )}
          </button>
        </div>

        {/* AI Error display */}
        {aiError && (
          <div className="mt-4 p-3.5 bg-rose-900/80 border border-rose-400/50 rounded-xl text-rose-100 text-xs flex items-center justify-between gap-2">
            <span>{aiError}</span>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              className="px-3 py-1 bg-white text-rose-900 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* AI Report Card */}
        {aiReport && (
          <div className="mt-5 bg-white text-[#4a2b3d] p-5 sm:p-6 rounded-2xl border border-[#f7dfe8] shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f7dfe8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-[#4a2b3d]">تقرير المستشار الذكي (Roza AI Advisor)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 bg-[#fff8f5] hover:bg-[#fdeaf1] text-[#d94f86] border border-[#f7dfe8] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="نسخ التقرير"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ التقرير</span>
                  </>
                )}
              </button>
            </div>

            <FormattedReportView text={aiReport} />
          </div>
        )}
      </div>

      {/* 4. Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>المشاهدات</span>
            <Eye className="w-4 h-4 text-[#d94f86]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#4a2b3d]">
            {summary.totalViews.toLocaleString('ar-DZ')}
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">مشاهدات للمنتجات</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>الطلبات</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {summary.totalOrders.toLocaleString('ar-DZ')}
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">طلبات مؤكدة</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>المداخيل</span>
            <DollarSign className="w-4 h-4 text-[#b8386d]" />
          </div>
          <div className="text-lg sm:text-xl font-black text-[#4a2b3d] truncate" title={`${summary.totalRevenue} د.ج`}>
            {summary.totalRevenue.toLocaleString('ar-DZ')} <span className="text-xs font-normal">د.ج</span>
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">قيمة المبيعات الإجمالية</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>الإنفاق الإعلاني</span>
            <BarChart2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-800 truncate">
            {summary.totalAdSpend.toLocaleString('ar-DZ')} <span className="text-xs font-normal">د.ج</span>
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">المصاريف المسجلة</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>تكلفة الطلب</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-900 truncate">
            {summary.costPerOrder > 0 ? `${summary.costPerOrder.toLocaleString('ar-DZ')} د.ج` : '—'}
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">متوسط CPA</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8a6b7a] text-xs font-medium mb-1">
            <span>عائد الإعلان</span>
            <TrendingUp className="w-4 h-4 text-[#d94f86]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#d94f86]">
            {summary.overallRoas > 0 ? `${summary.overallRoas}x` : '—'}
          </div>
          <div className="text-[10px] text-[#8a6b7a] mt-1">ROAS المداخيل/الإنفاق</div>
        </div>
      </div>

      {/* 5. Products Performance Breakdown (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Viewed Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm pb-2 mb-3 border-b border-[#f7dfe8]">
            <Eye className="w-4 h-4 text-[#d94f86]" />
            <span>المنتجات الأكثر مشاهدة</span>
          </div>

          {summary.topViewedProducts.length === 0 ? (
            <div className="text-xs text-[#8a6b7a] py-6 text-center">لا توجد مشاهدات مسجلة بعد في هذه الفترة</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {summary.topViewedProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between p-2 rounded-xl bg-[#fff8f5] border border-[#f7dfe8] text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-[#fdeaf1] text-[#d94f86] text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#4a2b3d] truncate max-w-[150px]" title={p.productTitle}>
                      {p.productTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[#8a6b7a]">{p.views} مشاهدة</span>
                    <span className="text-[11px] font-bold text-emerald-700">{p.orders} طلب</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm pb-2 mb-3 border-b border-[#f7dfe8]">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>المنتجات الأكثر مبيعاً</span>
          </div>

          {summary.bestSellers.length === 0 ? (
            <div className="text-xs text-[#8a6b7a] py-6 text-center">لا توجد طلبات مسجلة بعد في هذه الفترة</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {summary.bestSellers.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between p-2 rounded-xl bg-[#fff8f5] border border-[#f7dfe8] text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#4a2b3d] truncate max-w-[140px]" title={p.productTitle}>
                      {p.productTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-emerald-700">{p.orders} طلب</span>
                    <span className="text-[11px] text-[#8a6b7a]">{p.revenue.toLocaleString('ar-DZ')} د.ج</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High Views, Few Orders (Stagnant / Leaky Funnel) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm pb-2 mb-3 border-b border-[#f7dfe8]">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>مشاهدات عالية بطلبات قليلة</span>
          </div>

          {summary.highViewsLowOrders.length === 0 ? (
            <div className="text-xs text-[#8a6b7a] py-6 text-center">لا توجد اختناقات ملحوظة في التحويل حالياً</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {summary.highViewsLowOrders.map((p) => (
                <div key={p.productId} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex flex-col gap-1">
                  <div className="font-bold text-amber-950 truncate" title={p.productTitle}>
                    {p.productTitle}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-900 mt-0.5">
                    <span>{p.views} مشاهدة ⇄ {p.orders} طلب</span>
                    <span className="bg-amber-200/80 px-2 py-0.5 rounded-md font-bold text-[10px]">
                      تحويل: {p.conversionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Top Search Terms */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs">
        <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm pb-2 mb-3 border-b border-[#f7dfe8]">
          <Search className="w-4 h-4 text-[#d94f86]" />
          <span>أكثر كلمات البحث بحثاً من الزوار</span>
        </div>

        {summary.topSearchTerms.length === 0 ? (
          <div className="text-xs text-[#8a6b7a] py-4 text-center">لم يقم الزوار بالبحث عن كلمات بعد</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summary.topSearchTerms.map((s, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fff8f5] border border-[#f7dfe8] rounded-xl text-xs text-[#4a2b3d]"
              >
                <span className="font-bold text-[#b8386d]">{s.query}</span>
                <span className="text-[10px] bg-[#fdeaf1] text-[#d94f86] px-1.5 py-0.5 rounded-md font-black">
                  {s.count} مرة
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Traffic Sources Breakdown (Orders, Revenue, Spend, CPA, ROAS) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#f7dfe8]">
          <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm">
            <Layers className="w-4 h-4 text-[#d94f86]" />
            <span>الأداء المالي حسب مصدر الزيارات (Source Performance)</span>
          </div>
          <span className="text-xs text-[#8a6b7a]">فيسبوك، إنستغرام، تيك توك، مباشر...</span>
        </div>

        {summary.sourceMetrics.length === 0 ? (
          <div className="text-xs text-[#8a6b7a] py-6 text-center">لا توجد مصادر مسجلة بعد في هذه الفترة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#fff8f5] text-[#8a6b7a] border-b border-[#f7dfe8]">
                  <th className="p-2.5 font-bold">مصدر الزيارة</th>
                  <th className="p-2.5 font-bold">المشاهدات</th>
                  <th className="p-2.5 font-bold">الطلبات</th>
                  <th className="p-2.5 font-bold">المداخيل (د.ج)</th>
                  <th className="p-2.5 font-bold">الإنفاق الإعلاني (د.ج)</th>
                  <th className="p-2.5 font-bold">تكلفة الطلب (CPA)</th>
                  <th className="p-2.5 font-bold">العائد (ROAS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7dfe8]">
                {summary.sourceMetrics.map((src) => (
                  <tr key={src.source} className="hover:bg-[#fff8f5]/60 transition-colors">
                    <td className="p-2.5 font-black text-[#4a2b3d]">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#fdeaf1] text-[#b8386d]">
                        {src.source}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#8a6b7a]">{src.views}</td>
                    <td className="p-2.5 font-bold text-emerald-700">{src.orders}</td>
                    <td className="p-2.5 font-bold text-[#4a2b3d]">{src.revenue.toLocaleString('ar-DZ')} د.ج</td>
                    <td className="p-2.5 font-bold text-amber-800">
                      {src.spend > 0 ? `${src.spend.toLocaleString('ar-DZ')} د.ج` : '0 د.ج'}
                    </td>
                    <td className="p-2.5 font-bold text-purple-900">
                      {src.costPerOrder > 0 ? `${src.costPerOrder.toLocaleString('ar-DZ')} د.ج` : '—'}
                    </td>
                    <td className="p-2.5 font-bold">
                      {src.roas > 0 ? (
                        <span className={`px-2 py-0.5 rounded-md ${src.roas >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {src.roas}x
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. Ad Spend Form & Past Records Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Add Ad Spend Form */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm pb-2 mb-3 border-b border-[#f7dfe8]">
            <Plus className="w-4 h-4 text-[#d94f86]" />
            <span>تسجيل إنفاق إعلاني جديد</span>
          </div>

          <form onSubmit={handleAddAdSpend} className="flex flex-col gap-3">
            {/* Source dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">مصدر الإعلان / القناة:</label>
              <select
                value={spendSource}
                onChange={(e) => setSpendSource(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d]"
              >
                <option value="facebook">Facebook Ads (فيسبوك)</option>
                <option value="instagram">Instagram Ads (إنستغرام)</option>
                <option value="tiktok">TikTok Ads (تيك توك)</option>
                <option value="google">Google Ads (غوغل)</option>
                <option value="snapchat">Snapchat Ads (سناب شات)</option>
                <option value="other">مصدر مخصص آخر...</option>
              </select>
            </div>

            {spendSource === 'other' && (
              <div>
                <label className="block text-xs font-bold text-[#4a2b3d] mb-1">اسم المصدر:</label>
                <input
                  type="text"
                  placeholder="مثال: influencer, telegram..."
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d]"
                  required
                />
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">اسم الحملة (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: Styler 5in1 - Ramadan Promo"
                value={spendCampaign}
                onChange={(e) => setSpendCampaign(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d]"
              />
            </div>

            {/* Amount & Date in 2 cols */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#4a2b3d] mb-1">المبلغ المنفق (د.ج):</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="مثال: 5000"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d] font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4a2b3d] mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={spendDate}
                  onChange={(e) => setSpendDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d]"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-[#4a2b3d] mb-1">ملاحظات (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: تجربة إعلان فيديو ريلز جديد"
                value={spendNotes}
                onChange={(e) => setSpendNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:border-[#d94f86] outline-hidden bg-white text-[#4a2b3d]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSpend}
              className="mt-2 w-full py-2.5 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSavingSpend ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>تسجيل الإنفاق الإعلاني</span>
            </button>
          </form>
        </div>

        {/* Existing Ad Spend Records List */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#f7dfe8]">
            <div className="flex items-center gap-2 text-[#4a2b3d] font-bold text-sm">
              <Calendar className="w-4 h-4 text-[#d94f86]" />
              <span>سجلات الإنفاق الإعلاني المسجلة ({adSpends.length})</span>
            </div>
            <span className="text-[11px] text-[#8a6b7a]">المجموع: {adSpends.reduce((acc, s) => acc + s.amount, 0).toLocaleString('ar-DZ')} د.ج</span>
          </div>

          {adSpends.length === 0 ? (
            <div className="text-xs text-[#8a6b7a] py-8 text-center flex-1 flex flex-col items-center justify-center">
              <span>لم تقم بإدخال أي مصاريف إعلانية بعد.</span>
              <span className="text-[11px] text-[#8a6b7a]/80 mt-1">أدخل المبالغ التي تنفقها على فيسبوك وتيك توك لحساب تكلفة كل طلب تلقائياً.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[360px] flex flex-col gap-2">
              {adSpends.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-[#fff8f5] rounded-xl border border-[#f7dfe8] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#b8386d] uppercase">{s.source}</span>
                      {s.campaign && <span className="text-[11px] text-[#8a6b7a]">({s.campaign})</span>}
                    </div>
                    <div className="text-[11px] text-[#8a6b7a] flex items-center gap-2">
                      <span>التاريخ: {s.date}</span>
                      {s.notes && <span>• {s.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#4a2b3d]">{s.amount.toLocaleString('ar-DZ')} د.ج</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAdSpend(s.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-[#fdeaf1] rounded-lg transition-colors cursor-pointer"
                      title="حذف السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

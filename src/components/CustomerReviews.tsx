import React, { useState, useMemo } from 'react';
import { CustomerReview } from '../types';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { Star, CheckCircle, Heart, Plus, Send, Sparkles, X, MessageSquareHeart } from 'lucide-react';

interface CustomerReviewsProps {
  reviews: CustomerReview[];
  productId?: string;
  onAddReview?: (review: CustomerReview) => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ 
  reviews, 
  productId,
  onAddReview 
}) => {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter reviews by product if productId is provided and reviews have productId
  const displayedReviews = useMemo(() => {
    if (!productId) return reviews;
    const productSpecific = reviews.filter((r) => !r.productId || r.productId === productId);
    return productSpecific.length > 0 ? productSpecific : reviews;
  }, [reviews, productId]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (displayedReviews.length === 0) return 5.0;
    const sum = displayedReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / displayedReviews.length).toFixed(1);
  }, [displayedReviews]);

  const ratingLabels: Record<number, string> = {
    1: 'سيء 1/5',
    2: 'مقبول 2/5',
    3: 'جيد 3/5',
    4: 'جيد جداً 4/5',
    5: 'ممتاز جداً 5/5 ⭐'
  };

  const quickDarijaComments = [
    'سلعة ماشاء الله أصلية كيما في الصور والفيديو، والتوصيل سريع مع المعاينة قبل الدفع.',
    'روعة بزاف وخفيفة في اليد وتسهل الخدمة، شريتها وعجبتني بزاف أنصحكم بيها.',
    'تعامل في القمة، فتحت الباكي وتأكدت من السلعة عاد خلصت ليفغور، ربي يباركلكم.'
  ];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim()) {
      alert('يرجى كتابة الاسم أو اللقب');
      return;
    }
    if (!comment.trim()) {
      alert('يرجى كتابة تعليقكِ أو رأيكِ حول المنتج');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateStr = `منذ لحظات (${now.toLocaleDateString('ar-DZ')})`;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      author: author.trim(),
      wilaya: wilaya || 'الجزائر العاصمة',
      rating,
      date: dateStr,
      comment: comment.trim(),
      verified: true,
      productId
    };

    if (onAddReview) {
      onAddReview(newRev);
    }

    setIsSubmitting(false);
    setAuthor('');
    setComment('');
    setIsOpenForm(false);
    setSuccessMessage('❤️ شكراً جزيلاً لكِ على مشاركة تجربتكِ! تم نشر تقييمكِ بنجاح.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <section className="w-full mt-6 flex flex-col gap-5 text-right">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f7dfe8]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#d94f86] mb-1">
            <Heart className="w-4 h-4 fill-[#d94f86] text-[#d94f86]" />
            <span>تجارب حقيقية من زبوناتنا في 69 ولاية</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#4a2b3d] tracking-tight">
            آراء وتقييمات العملاء
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Global score */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#f7dfe8] shadow-xs">
            <div className="flex items-center text-[#c9a45c]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#c9a45c]" />
              ))}
            </div>
            <span className="text-xs font-black text-[#4a2b3d]">{averageRating} / 5</span>
            <span className="text-[11px] text-[#8a6b7a]">({displayedReviews.length} تقييم)</span>
          </div>

          {/* Add Review Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpenForm(!isOpenForm)}
            className="px-4 py-2 bg-gradient-to-r from-[#d94f86] to-[#b8386d] hover:from-[#c93d78] hover:to-[#a32e5f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isOpenForm ? (
              <>
                <X className="w-4 h-4" />
                <span>إغلاق النموذج</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>✍️ أضف تقييمك وتجربتك</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Interactive Add Review Form */}
      {isOpenForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white p-5 rounded-2xl border-2 border-[#f7dfe8] shadow-md flex flex-col gap-4 animate-in fade-in text-xs"
        >
          <div className="flex items-center justify-between border-b border-[#f7dfe8] pb-2.5">
            <h3 className="font-bold text-sm text-[#4a2b3d] flex items-center gap-2">
              <MessageSquareHeart className="w-4 h-4 text-[#d94f86]" />
              <span>شاركينا تجربتكِ ورأيكِ حول المنتج</span>
            </h3>
            <span className="text-[11px] text-[#8a6b7a]">يساعد رأيك المشترين الجدد</span>
          </div>

          {/* Rating Stars Picker */}
          <div>
            <label className="block font-bold text-[#4a2b3d] mb-1.5">
              تقييمكِ الإجمالي للمنتج: <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isActive = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                      title={ratingLabels[starVal]}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          isActive
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="font-bold text-[#d94f86] text-xs">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Author Name */}
            <div>
              <label className="block font-bold text-[#4a2b3d] mb-1">
                اسمكِ الكريم أو اللقب: <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثال: فاطمة الزهراء، أمينة، سارة..."
                className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none font-medium"
                required
              />
            </div>

            {/* Wilaya Selection */}
            <div>
              <label className="block font-bold text-[#4a2b3d] mb-1">
                الولاية: <span className="text-rose-600">*</span>
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none font-medium"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.nameAr.replace(/^\d+\s*-\s*/, '')}>
                    {w.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#4a2b3d]">
                رأيكِ الصريح وتجربتكِ مع المنتج والتوصيل: <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] text-[#8a6b7a]">يمكنكِ الكتابة بالدارجة الجزائرية أو العربية</span>
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتبي كيف وصلكِ المنتج، جودته، هل مطابق للصور، وسرعة التوصيل..."
              className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs bg-[#fff8f5] focus:bg-white focus:border-[#d94f86] focus:outline-none resize-y leading-relaxed font-medium"
              required
            />

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#8a6b7a] font-bold">عبارات سريعة:</span>
              {quickDarijaComments.map((txt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setComment(txt)}
                  className="text-[10px] bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#d94f86] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {txt.slice(0, 32)}...
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f7dfe8]">
            <button
              type="button"
              onClick={() => setIsOpenForm(false)}
              className="px-4 py-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !author.trim() || !comment.trim()}
              className="px-5 py-2 bg-gradient-to-r from-[#d94f86] to-[#b8386d] hover:from-[#c93d78] hover:to-[#a32e5f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'نشر التقييم الآن'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {displayedReviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between gap-3 hover:border-[#d94f86]/40 transition-colors"
          >
            {/* Top row: stars + verified + date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-[#c9a45c]">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#c9a45c]" />
                  ))}
                </div>
                <span className="text-[10px] text-[#8a6b7a]">{rev.date}</span>
              </div>

              {/* Review Comment in Algerian Darija */}
              <p className="text-xs sm:text-[13px] text-[#4a2b3d] leading-relaxed font-medium">
                "{rev.comment}"
              </p>
            </div>

            {/* Author info & Algerian Wilaya */}
            <div className="pt-2.5 border-t border-[#f7dfe8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#fdeaf1] text-[#d94f86] flex items-center justify-center text-[10px] font-bold">
                  {rev.author.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#4a2b3d] leading-none">
                    {rev.author}
                  </div>
                  <div className="text-[10px] text-[#8a6b7a] mt-0.5">
                    ولاية {rev.wilaya}
                  </div>
                </div>
              </div>

              {rev.verified && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>زبونة مؤكدة</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

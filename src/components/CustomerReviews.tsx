import React from 'react';
import { CustomerReview } from '../types';
import { Star, CheckCircle, Heart, MessageSquareQuote } from 'lucide-react';

interface CustomerReviewsProps {
  reviews: CustomerReview[];
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ reviews }) => {
  return (
    <section className="w-full mt-6 flex flex-col gap-4 text-right">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-1">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>تجارب حقيقية من ولايات الجزائر</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
            آراء وتقييمات زبوناتنا بالدارجة الجزائرية
          </h2>
        </div>

        {/* Global score */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-rose-100 shadow-xs">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-stone-900">5.0 / 5</span>
          <span className="text-[11px] text-stone-500">· تقييم ممتاز</span>
        </div>
      </div>

      {/* Reviews Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between gap-3 hover:border-rose-200 transition-colors"
          >
            {/* Top row: stars + verified + date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-stone-400">{rev.date}</span>
              </div>

              {/* Review Comment in Algerian Darija */}
              <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-medium">
                "{rev.comment}"
              </p>
            </div>

            {/* Author info & Algerian Wilaya */}
            <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">
                  {rev.author.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 leading-none">
                    {rev.author}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    ولاية {rev.wilaya}
                  </div>
                </div>
              </div>

              {rev.verified && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
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

import React from 'react';
import { CustomerReview } from '../types';
import { Star, CheckCircle, Heart } from 'lucide-react';

interface CustomerReviewsProps {
  reviews: CustomerReview[];
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ reviews }) => {
  return (
    <section className="w-full mt-6 flex flex-col gap-4 text-right">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f7dfe8]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#d94f86] mb-1">
            <Heart className="w-4 h-4 fill-[#d94f86] text-[#d94f86]" />
            <span>تجارب حقيقية من ولايات الجزائر</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#4a2b3d] tracking-tight">
            آراء وتقييمات زبوناتنا بالدارجة الجزائرية
          </h2>
        </div>

        {/* Global score */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#f7dfe8] shadow-xs">
          <div className="flex items-center text-[#c9a45c]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-[#c9a45c]" />
            ))}
          </div>
          <span className="text-xs font-bold text-[#4a2b3d]">5.0 / 5</span>
          <span className="text-[11px] text-[#8a6b7a]">· تقييم ممتاز</span>
        </div>
      </div>

      {/* Reviews Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex flex-col justify-between gap-3 hover:border-[#d94f86]/40 transition-colors"
          >
            {/* Top row: stars + verified + date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-[#c9a45c]">
                  {[...Array(rev.rating)].map((_, i) => (
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

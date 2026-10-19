import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Maximize2, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productTitle: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productTitle
}) => {
  const displayImages = images && images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [aspectMode, setAspectMode] = useState<'cover' | 'contain'>('contain');

  // Reset index if images length changes
  useEffect(() => {
    if (currentIndex >= displayImages.length) {
      setCurrentIndex(0);
    }
  }, [displayImages.length, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Touch swipe support for mobile
  const minSwipeDistance = 45;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRtl = true;
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        isRtl ? handleNext() : handlePrev();
      } else {
        isRtl ? handlePrev() : handleNext();
      }
    }
  };

  // Keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const currentImage = displayImages[currentIndex] || displayImages[0] || '';

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Main Responsive Image Frame */}
      <div 
        className="relative w-full rounded-2xl overflow-hidden border border-[#f7dfe8] shadow-[0_4px_15px_rgba(217,79,134,0.06)] group transition-all duration-300 bg-white"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Responsive Aspect Ratio Container */}
        <div className="relative w-full aspect-[4/5] max-h-[640px] flex items-center justify-center overflow-hidden bg-[#fff8f5]">
          
          {/* Ambient Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-60 scale-125 pointer-events-none transition-all duration-500"
            style={{ backgroundImage: `url(${currentImage})` }}
          />

          {/* Primary Product Image with Auto-adaptation */}
          <img
            src={currentImage}
            alt={`${productTitle} - صورة أصلية ${currentIndex + 1} | متجر ROZA BEAUTY DZ في الجزائر`}
            referrerPolicy="no-referrer"
            className={`relative z-10 w-full h-full transition-all duration-500 ${
              aspectMode === 'contain' ? 'object-contain' : 'object-cover'
            }`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {/* Image index badge */}
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-[#4a2b3d]/80 backdrop-blur-md text-white text-xs font-semibold tracking-wider border border-white/15">
            {currentIndex + 1} / {displayImages.length}
          </div>

          {/* Aspect Mode & Fullscreen Controls */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAspectMode(prev => prev === 'cover' ? 'contain' : 'cover')}
              className="px-2 py-1 rounded-lg bg-[#4a2b3d]/80 hover:bg-[#4a2b3d] text-white text-[11px] font-medium border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
              title="تغيير نمط العرض (كامل / احتواء)"
            >
              {aspectMode === 'cover' ? 'عرض ممتلئ' : 'عرض كامل'}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg bg-[#4a2b3d]/80 hover:bg-[#4a2b3d] text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
              title="تكبير الصورة"
              aria-label="تكبير الصورة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="الصورة السابقة"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#4a2b3d] flex items-center justify-center shadow-[0_4px_15px_rgba(217,79,134,0.15)] transition-transform active:scale-95 sm:opacity-90 hover:scale-105 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="الصورة التالية"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#4a2b3d] flex items-center justify-center shadow-[0_4px_15px_rgba(217,79,134,0.15)] transition-transform active:scale-95 sm:opacity-90 hover:scale-105 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Swipe indicator dots for mobile */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#4a2b3d]/60 backdrop-blur-sm">
              {displayImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? 'w-5 bg-[#d94f86]' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`انتقل للصورة ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Thumbnails Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white cursor-pointer ${
              idx === currentIndex
                ? 'border-[#d94f86] scale-102 shadow-md ring-2 ring-[#d94f86]/30'
                : 'border-[#f7dfe8] hover:border-[#edd6e0] opacity-80 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt={`${productTitle} - زاوية وعرض ${idx + 1} | ألبوم صور متجر ROZA BEAUTY DZ الرسمي`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#4a2b3d]/95 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-white/90 text-sm font-semibold">
              {currentIndex + 1} / {displayImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              aria-label="إغلاق التكبير"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div 
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={`${productTitle} - عرض مكبر فائق الوضوح | متجر ROZA BEAUTY DZ الرسمي في الجزائر`}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

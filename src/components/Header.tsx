import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, MessageSquare, Truck, Lock, Sparkles, 
  ShoppingCart, Heart, Search, X, Menu, ChevronLeft,
  ShoppingBag, CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { TrackingService } from '../services/tracking';

interface HeaderProps {
  onOpenAdminPrompt: () => void;
  categories?: { id: string; name: string; slug: string }[];
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdminPrompt, categories = [] }) => {
  const { totalItems, favorites, setIsCartDrawerOpen } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      TrackingService.trackSearch(searchQuery.trim());
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}#products`);
      setIsSearchOpen(false);
    }
  };

  const announcementText = "توصيل لكافة الـ 69 ولاية • الدفع عند الاستلام • منتجات أصلية";

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#f7dfe8] shadow-[0_4px_20px_rgba(217,79,134,0.06)]">
        {/* 1) Top Announcement Bar - Rich Rose Gradient with non-stop infinite marquee */}
        <div className="bg-gradient-to-r from-[#b8386d] via-[#d94f86] to-[#b8386d] text-white text-[11px] sm:text-xs py-1.5 overflow-hidden relative shadow-xs">
          <div className="w-full flex overflow-hidden">
            <div className="animate-marquee-rtl flex items-center gap-8 whitespace-nowrap font-bold text-white tracking-wide">
              {/* Loop repeating text segments so marquee never has any empty gaps */}
              <div className="flex items-center gap-8 shrink-0">
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
              </div>

              {/* Exact duplicate block for seamless continuous 100% loop */}
              <div className="flex items-center gap-8 shrink-0">
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />
                  {announcementText}
                </span>
                <span className="opacity-70">•</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2) Main Sticky Header Bar */}
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5">
          {/* Right side in RTL: Mobile Menu Button (☰) + Store Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Drawer Trigger (☰) */}
            <button
              type="button"
              onClick={() => setIsMenuDrawerOpen(true)}
              className="p-2 -mr-1 rounded-xl text-[#4a2b3d] hover:text-[#d94f86] hover:bg-[#fdeaf1] transition-colors cursor-pointer"
              title="القائمة والأقسام"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#e8709b] via-[#d94f86] to-[#c93d78] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shadow-rose-900/15 group-hover:scale-105 transition-transform">
                R
              </div>
              <div className="flex flex-col">
                <div className="font-black text-sm sm:text-base md:text-lg text-[#4a2b3d] leading-tight flex items-center gap-1">
                  <span>ROZA BEAUTY DZ</span>
                  <Sparkles className="w-3 h-3 text-[#c9a45c] hidden xs:inline" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#d94f86] font-semibold hidden sm:block">
                  المتجر الجزائري للأجهزة والعناية
                </div>
              </div>
            </Link>
          </div>

          {/* Center Search Input (Desktop) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-4 relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج، جهاز، أو علامة تجارية..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#fff8f5] border border-[#f7dfe8] text-xs sm:text-sm text-[#4a2b3d] placeholder-[#8a6b7a] focus:bg-white focus:border-[#d94f86] focus:outline-none focus:ring-2 focus:ring-[#fdeaf1] transition-all text-right"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a6b7a] hover:text-[#d94f86] transition-colors p-1 cursor-pointer"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Left side in RTL: Search Toggle, Wishlist, Cart Drawer */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Icon (opens full-width input) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isSearchOpen 
                  ? 'bg-[#fdeaf1] text-[#d94f86]' 
                  : 'text-[#4a2b3d] hover:text-[#d94f86] hover:bg-[#fdeaf1]'
              }`}
              title="بحث في المتجر"
              aria-label="البحث"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist / Favorites Heart Icon */}
            <button
              type="button"
              onClick={() => navigate('/?filter=favorites#products')}
              className="relative p-2 rounded-xl text-[#4a2b3d] hover:text-[#d94f86] hover:bg-[#fdeaf1] transition-colors cursor-pointer"
              title="المفضلة"
              aria-label="المفضلة"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#d94f86] text-white text-[10px] font-bold flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Cart Icon with rose circular badge */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 rounded-xl text-[#4a2b3d] hover:text-[#d94f86] hover:bg-[#fdeaf1] transition-colors cursor-pointer"
              title="سلة المشتريات"
              aria-label="السلة"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d94f86] text-white text-[10px] font-mono font-black flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Desktop WhatsApp Contact */}
            <a
              href="https://wa.me/213777413872"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold items-center gap-1.5 transition-colors mr-1 border border-emerald-100"
              title="تواصل عبر الواتساب"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>واتساب 0777413872</span>
            </a>

            {/* Desktop Admin Lock Trigger */}
            <button
              type="button"
              onClick={onOpenAdminPrompt}
              className="hidden sm:flex p-2 rounded-xl text-[#8a6b7a] hover:text-[#d94f86] hover:bg-[#fdeaf1] transition-colors cursor-pointer"
              title="لوحة الإدارة"
              aria-label="لوحة الإدارة"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full-width Search Bar (Smooth dropdown on mobile and desktop toggle) */}
        {isSearchOpen && (
          <div className="w-full bg-[#fff8f5] border-t border-[#f7dfe8] px-3.5 py-3 shadow-md animate-fadeIn">
            <div className="max-w-6xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اكتب اسم المنتج أو الجهاز الذي تبحث عنه..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#f7dfe8] text-xs sm:text-sm text-[#4a2b3d] placeholder-[#8a6b7a] focus:bg-white focus:border-[#d94f86] focus:outline-none focus:ring-2 focus:ring-[#fdeaf1] transition-all text-right"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6b7a] hover:text-[#d94f86] p-1 cursor-pointer"
                    aria-label="تأكيد البحث"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2.5 rounded-xl bg-white border border-[#f7dfe8] hover:bg-[#fdeaf1] text-[#4a2b3d] transition-colors cursor-pointer"
                  title="إغلاق البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Categories Horizontal Bar for Desktop */}
        {categories.length > 0 && (
          <div className="hidden md:block bg-[#fff8f5] border-t border-[#f7dfe8]/60">
            <div className="max-w-6xl mx-auto px-6">
              <nav className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar text-xs font-bold text-[#4a2b3d]">
                <Link
                  to="/"
                  className="px-3 py-1 rounded-lg hover:bg-[#fdeaf1] hover:text-[#d94f86] transition-colors whitespace-nowrap shrink-0"
                >
                  جميع المنتجات
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="px-3 py-1 rounded-lg hover:bg-[#fdeaf1] hover:text-[#d94f86] transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* 2.b) Mobile Categories Side Drawer (درج جانبي بقائمة الأقسام) */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-[#4a2b3d]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuDrawerOpen(false)}
          />

          {/* Drawer content sliding from right in RTL */}
          <div className="relative w-[85vw] max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-[#f7dfe8] animate-slideRight">
            <div>
              {/* Drawer Top Header */}
              <div className="p-4 bg-[#fff8f5] border-b border-[#f7dfe8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e8709b] to-[#c93d78] text-white flex items-center justify-center font-black text-sm shadow-xs">
                    R
                  </div>
                  <div>
                    <h3 className="font-black text-[#4a2b3d] text-sm">Roza Beauty DZ</h3>
                    <p className="text-[10px] text-[#8a6b7a] font-medium">أقسام وتصنيفات المتجر</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#fdeaf1] text-[#8a6b7a] hover:text-[#4a2b3d] transition-colors cursor-pointer"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories list */}
              <div className="p-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8a6b7a] block mb-2 px-2">
                  الأقسام الرئيسية
                </span>

                <div className="flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] hover:text-[#d94f86] font-bold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c9a45c]" />
                      <span>جميع المنتجات</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-[#8a6b7a]" />
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsMenuDrawerOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] hover:text-[#d94f86] font-bold text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d94f86]" />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-[#8a6b7a]" />
                    </Link>
                  ))}
                </div>

                {/* Quick Store Links */}
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8a6b7a] block mt-5 mb-2 px-2">
                  روابط سريعة
                </span>

                <div className="flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] font-bold text-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#c9a45c]" />
                    <span>الرئيسية</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      navigate('/?filter=favorites#products');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] font-bold text-xs text-right w-full cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-[#d94f86]" />
                      <span>المفضلة</span>
                    </div>
                    {favorites.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#fdeaf1] text-[#d94f86] text-[10px] font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      setIsCartDrawerOpen(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] font-bold text-xs text-right w-full cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-[#8a6b7a]" />
                      <span>سلة المشتريات</span>
                    </div>
                    {totalItems > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#d94f86] text-white text-[10px] font-mono font-bold">
                        {totalItems}
                      </span>
                    )}
                  </button>

                  <Link
                    to="/checkout"
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#fdeaf1] text-[#4a2b3d] font-bold text-xs transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>إتمام الطلب</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      onOpenAdminPrompt();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#fff8f5] hover:bg-[#fdeaf1] text-[#4a2b3d] hover:text-[#d94f86] font-bold text-xs w-full text-right transition-colors border border-[#f7dfe8] cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#d94f86]" />
                    <span>لوحة تحكم المدير</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Bottom: Support & Admin Trigger */}
            <div className="p-4 bg-[#fff8f5] border-t border-[#f7dfe8] flex flex-col gap-2.5">
              <a
                href="tel:0777413872"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#f7dfe8] text-[#4a2b3d] text-xs font-bold hover:border-[#d94f86] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#d94f86]" />
                  <span>اتصال مباشر</span>
                </div>
                <span className="font-mono text-[#8a6b7a]" dir="ltr">0777413872</span>
              </a>

              <a
                href="https://wa.me/213777413872"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>واتساب خدمة الزبائن</span>
                </div>
                <span className="font-mono text-[11px]" dir="ltr">0777413872</span>
              </a>

              {/* Discreet admin lock button */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#8a6b7a]">
                <span>توصيل لـ 69 ولاية • دفع عند الاستلام</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    onOpenAdminPrompt();
                  }}
                  className="p-1 hover:text-[#4a2b3d] transition-colors cursor-pointer"
                  title="لوحة الإدارة"
                >
                  <Lock className="w-3.5 h-3.5 text-[#d94f86]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

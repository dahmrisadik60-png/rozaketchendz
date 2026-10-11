import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, BeautyProduct, PixelConfig, PixelEventLog, CustomerReview } from '../types';
import { 
  updateOrderStatus, 
  deleteOrder, 
  deleteMultipleOrders,
  clearOrdersByStatus,
  clearAllOrders,
  exportOrdersToCSV, 
  saveStoredProduct,
  saveStoredReviews
} from '../services/storage';
import { 
  getPixelConfig, 
  savePixelConfig, 
  getPixelLogs, 
  clearPixelLogs, 
  TrackingService 
} from '../services/tracking';
import { 
  X, Download, Search, Phone, MessageSquare, Trash2, 
  Package, Settings, Activity, Plus, Save, RefreshCw, 
  Send, Check, KeyRound, AlertCircle, Upload, CheckSquare, Square,
  Star, Heart, Sparkles, Award, ListPlus, Image as ImageIcon, ShieldCheck
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: BeautyProduct;
  onProductUpdated: (updatedProduct: BeautyProduct) => void;
  orders: Order[];
  onOrdersUpdated: (updatedOrders: Order[]) => void;
  reviews: CustomerReview[];
  onReviewsUpdated: (updatedReviews: CustomerReview[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
  orders,
  onOrdersUpdated,
  reviews,
  onReviewsUpdated
}) => {
  // PIN Protection (Secret Code: 2009)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Local synchronized state for immediate reactive UI updates
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [localProduct, setLocalProduct] = useState<BeautyProduct>(product);
  const [localReviews, setLocalReviews] = useState<CustomerReview[]>(reviews);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  const [activeTab, setActiveTab] = useState<'orders' | 'product' | 'reviews' | 'pixels'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected orders for bulk deletion
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Pixel Config State
  const [pixelConfig, setPixelConfig] = useState<PixelConfig>(getPixelConfig());
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>(getPixelLogs());

  // Image upload
  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New review form state
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewWilaya, setNewReviewWilaya] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Key point input
  const [newKeyPointText, setNewKeyPointText] = useState('');

  // New spec row state
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPixelLogs(getPixelLogs());
    } else {
      setPinError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle PIN verification (2009)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '2009') {
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('كلمة السر غير صحيحة!');
    }
  };

  // Filter Orders based on localOrders
  const filteredOrders = localOrders.filter((ord) => {
    const matchesSearch = 
      ord.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.phone.includes(searchQuery) ||
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.wilayaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.commune.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Order KPIs in real-time
  const totalRevenue = localOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const confirmedOrdersCount = localOrders.filter((o) => o.status === 'confirmed' || o.status === 'delivered').length;
  const newOrdersCount = localOrders.filter((o) => o.status === 'new').length;

  // Update order status
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setLocalOrders(updated);
    onOrdersUpdated(updated);
  };

  // Permanent Single Delete Order
  const handleDeleteSingle = (orderId: string, orderNumber: string) => {
    const updated = deleteOrder(orderId);
    setLocalOrders(updated);
    onOrdersUpdated(updated);
    setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    showNotice(`تم حذف الطلب (${orderNumber}) بنجاح وبشكل دائم`);
  };

  // Permanent Bulk Delete Selected Orders
  const handleDeleteSelected = () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    const updated = deleteMultipleOrders(selectedOrderIds);
    setLocalOrders(updated);
    onOrdersUpdated(updated);
    setSelectedOrderIds([]);
    showNotice(`تم حذف ${count} طلبات محددة بنجاح وبشكل دائم`);
  };

  // Permanent Delete Processed Orders
  const handleDeleteProcessed = () => {
    const updated = clearOrdersByStatus(['delivered', 'cancelled']);
    setLocalOrders(updated);
    onOrdersUpdated(updated);
    setSelectedOrderIds([]);
    showNotice('تم حذف كافة الطلبات المعالجة (الملغاة والمسلمة) بنجاح');
  };

  // Permanent Clear All Orders
  const handleClearAll = () => {
    const updated = clearAllOrders();
    setLocalOrders(updated);
    onOrdersUpdated([]);
    setSelectedOrderIds([]);
    showNotice('تم مسح جميع الطلبات نهائياً من الذاكرة');
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  // Central product updater that updates local state, saves immediately to localStorage, and syncs live with storefront
  const updateProductAndSave = (updated: BeautyProduct, noticeMessage?: string) => {
    setLocalProduct(updated);
    saveStoredProduct(updated);
    onProductUpdated(updated);
    if (noticeMessage) {
      showNotice(noticeMessage);
    }
  };

  // Helper for single field updates (Title, Tagline, Price, Titles, Guarantee, Ratings)
  const handleProductFieldChange = <K extends keyof BeautyProduct>(field: K, value: BeautyProduct[K]) => {
    const updated = {
      ...localProduct,
      [field]: value
    };
    updateProductAndSave(updated);
  };

  // Save Product Modifications explicitly with user feedback banner
  const handleSaveProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateProductAndSave(localProduct, '✅ تم حفظ وتثبيت كافة تعديلات ومواصفات المنتج فورياً ودائماً في المتجر!');
  };

  // Add Key Point
  const handleAddKeyPoint = () => {
    if (!newKeyPointText.trim()) return;
    const updated = {
      ...localProduct,
      keyPoints: [...localProduct.keyPoints, newKeyPointText.trim()]
    };
    updateProductAndSave(updated, 'تمت إضافة الميزة وحفظها فورياً في المتجر!');
    setNewKeyPointText('');
  };

  // Edit Key Point
  const handleUpdateKeyPoint = (index: number, value: string) => {
    const updated = {
      ...localProduct,
      keyPoints: localProduct.keyPoints.map((kp, idx) => idx === index ? value : kp)
    };
    updateProductAndSave(updated);
  };

  // Delete Key Point
  const handleDeleteKeyPoint = (index: number) => {
    const updated = {
      ...localProduct,
      keyPoints: localProduct.keyPoints.filter((_, idx) => idx !== index)
    };
    updateProductAndSave(updated, 'تم حذف الميزة وحفظ التعديل في المتجر!');
  };

  // Add Spec Row
  const handleAddSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    const updated = {
      ...localProduct,
      specs: [...localProduct.specs, { label: newSpecLabel.trim(), value: newSpecValue.trim() }]
    };
    updateProductAndSave(updated, 'تمت إضافة الخاصية وحفظها في المتجر!');
    setNewSpecLabel('');
    setNewSpecValue('');
  };

  // Update Spec Row
  const handleUpdateSpec = (index: number, field: 'label' | 'value', text: string) => {
    const updated = {
      ...localProduct,
      specs: localProduct.specs.map((s, idx) => idx === index ? { ...s, [field]: text } : s)
    };
    updateProductAndSave(updated);
  };

  // Delete Spec Row
  const handleDeleteSpec = (index: number) => {
    const updated = {
      ...localProduct,
      specs: localProduct.specs.filter((_, idx) => idx !== index)
    };
    updateProductAndSave(updated, 'تم حذف السطر وحفظ التعديل!');
  };

  // Local File Upload with immediate auto-save
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          const updated = {
            ...localProduct,
            images: [...localProduct.images, ...newImages]
          };
          updateProductAndSave(updated, `✅ تم رفع ${newImages.length} صورة وحفظها فورياً في ألبوم المتجر!`);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      const updated = {
        ...localProduct,
        images: [...localProduct.images, newImageUrl.trim()]
      };
      updateProductAndSave(updated, '✅ تمت إضافة رابط الصورة وحفظه في ألبوم المتجر!');
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = {
      ...localProduct,
      images: localProduct.images.filter((_, idx) => idx !== indexToRemove)
    };
    updateProductAndSave(updated, 'تم حذف الصورة وحفظ التعديل فورياً في المتجر!');
  };

  // Clear other images to leave only newly added images (ضع هاذم التصوير في الالبوم واذف الاخرين)
  const handleClearOtherImages = (keepIndex?: number) => {
    if (keepIndex !== undefined && localProduct.images[keepIndex]) {
      const updated = {
        ...localProduct,
        images: [localProduct.images[keepIndex]]
      };
      updateProductAndSave(updated, 'تم حذف بقية الصور والاحتفاظ بالصورة المحددة فقط!');
    } else {
      const updated = {
        ...localProduct,
        images: []
      };
      updateProductAndSave(updated, 'تم إفراغ الألبوم بالكامل! يمكنك الآن رفع صورك الجديدة فقط.');
    }
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary <= 0 || indexToPrimary >= localProduct.images.length) return;
    const selected = localProduct.images[indexToPrimary];
    const rest = localProduct.images.filter((_, idx) => idx !== indexToPrimary);
    const updated = {
      ...localProduct,
      images: [selected, ...rest]
    };
    updateProductAndSave(updated, 'تم تعيين هذه الصورة كصورة رئيسية للمنتج وحفظ التعديل!');
  };

  // REVIEWS MANAGEMENT
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor.trim(),
      wilaya: newReviewWilaya.trim() || 'الجزائر',
      rating: newReviewRating,
      date: 'الآن',
      comment: newReviewComment.trim(),
      verified: true
    };

    const updated = [newRev, ...localReviews];
    setLocalReviews(updated);
    saveStoredReviews(updated);
    onReviewsUpdated(updated);

    setNewReviewAuthor('');
    setNewReviewWilaya('');
    setNewReviewComment('');
    setNewReviewRating(5);
    showNotice('تمت إضافة رأي الزبونة الجديد بنجاح وحفظه في الموقع!');
  };

  const handleDeleteReview = (reviewId: string) => {
    const updated = localReviews.filter(r => r.id !== reviewId);
    setLocalReviews(updated);
    saveStoredReviews(updated);
    onReviewsUpdated(updated);
    showNotice('تم حذف التقييم بنجاح.');
  };

  // PIXEL SETTINGS
  const handleSavePixelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    savePixelConfig(pixelConfig);
    showNotice('تم حفظ إعدادات الـ Pixels وتفعيلها بنجاح!');
  };

  const handleTestPixelEvent = (eventName: string) => {
    if (eventName === 'PageView') {
      TrackingService.trackPageView('RozaBeauty_Admin_Test');
    } else if (eventName === 'InitiateCheckout') {
      TrackingService.trackInitiateCheckout({
        id: localProduct.id,
        title: localProduct.title,
        price: localProduct.price,
        quantity: 1
      });
    } else if (eventName === 'Purchase') {
      TrackingService.trackPurchase({
        orderNumber: `TEST-RB-${Math.floor(1000 + Math.random() * 9000)}`,
        productTitle: localProduct.title,
        productId: localProduct.id,
        grandTotal: localProduct.price,
        quantity: 1,
        phone: '0777413872'
      });
    }
    setPixelLogs(getPixelLogs());
  };

  // WhatsApp click handler
  const openWhatsApp = (phone: string, clientName: string, orderNumber: string) => {
    const cleanPhone = phone.startsWith('0') ? '213' + phone.substring(1) : phone;
    const msg = encodeURIComponent(`السلام عليكم، مرحباً بك أختي ${clientName}.\nمعك خدمة العملاء من Roza Beauty DZ.\nبخصوص طلبك لمصفف الشعر 5 في 1 برقم (${orderNumber})، نود تأكيد موعد وعنوان التوصيل المناسب لك. شكراً لك!`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-rose-200 overflow-hidden text-right animate-in fade-in zoom-in-95">
        
        {/* Modal Topbar */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center font-black text-white text-base">
              R
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                لوحة التحكم وإدارة المتجر | Roza Beauty DZ
              </h2>
              <p className="text-xs text-stone-400">
                إدارة الطلبات، تعديل تفاصيل المنتج، آراء الزبائن، والـ Pixels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. PIN SECURITY SCREEN (REQUIRE CODE: 2009) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
              <KeyRound className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-stone-900 mb-1">
              لوحة الإدارة محمية برمز الأمان
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              يرجى إدخال كلمة السر للوصول للوحة التحكم وتعديل محتوى المتجر
            </p>

            <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-3">
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  maxLength={10}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="أدخل كلمة السر..."
                  className="w-full py-3 px-4 rounded-xl border border-stone-300 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-600 font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow transition-colors cursor-pointer"
              >
                فتح لوحة التحكم
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-400 hover:text-stone-600 underline mt-2 cursor-pointer"
              >
                العودة للمتجر
              </button>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-stone-200 px-4 pt-2 bg-stone-50 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-rose-600 text-rose-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>إدارة الطلبات ({localOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('product')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'product'
                    ? 'border-rose-600 text-rose-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>تعديل تفاصيل ومواصفات المنتج</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-rose-600 text-rose-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>آراء وتقييمات الزبونات ({localReviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('pixels')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'pixels'
                    ? 'border-rose-600 text-rose-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>تتبع Pixels والإعلانات</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50 flex flex-col gap-4">

              {/* Action feedback toast */}
              {actionNotice && (
                <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl text-center shadow-md flex items-center justify-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{actionNotice}</span>
                </div>
              )}

              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <div className="flex flex-col gap-5">
                  {/* Real-time KPI Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                      <div className="text-xs text-stone-500 font-semibold mb-1">إجمالي المبيعات</div>
                      <div className="text-lg sm:text-xl font-black text-rose-600">
                        {totalRevenue.toLocaleString()} د.ج
                      </div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                      <div className="text-xs text-stone-500 font-semibold mb-1">إجمالي الطلبات</div>
                      <div className="text-lg sm:text-xl font-black text-stone-800">{localOrders.length} طلب</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                      <div className="text-xs text-stone-500 font-semibold mb-1">طلبات جديدة</div>
                      <div className="text-lg sm:text-xl font-black text-amber-600">{newOrdersCount} طلب</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                      <div className="text-xs text-stone-500 font-semibold mb-1">طلبات مؤكدة</div>
                      <div className="text-lg sm:text-xl font-black text-emerald-600">{confirmedOrdersCount} طلب</div>
                    </div>
                  </div>

                  {/* Filter & Export Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث بالاسم، رقم الهاتف، رقم الطلب، أو الولاية..."
                          className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs py-2 px-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="all">كل الحالات ({localOrders.length})</option>
                        <option value="new">جديد</option>
                        <option value="called">تم الاتصال</option>
                        <option value="confirmed">مؤكد</option>
                        <option value="shipped">جاري الشحن</option>
                        <option value="delivered">تم التسليم</option>
                        <option value="cancelled">ملغى</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportOrdersToCSV(localOrders)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير الطلبات بملف Excel / CSV</span>
                    </button>
                  </div>

                  {/* Bulk Delete Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-100 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-semibold cursor-pointer"
                      >
                        {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                          <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span>تحديد الكل ({selectedOrderIds.length})</span>
                      </button>

                      {selectedOrderIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الطلبات المحددة ({selectedOrderIds.length})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteProcessed}
                        className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 text-stone-600 hover:text-red-700 font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                        title="حذف جميع الطلبات الملغاة أو المسلمة"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف الطلبات المعالجة (ملغى / مسلّم)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-bold cursor-pointer"
                        title="مسح كافة الطلبات"
                      >
                        مسح كافة الطلبات
                      </button>
                    </div>
                  </div>

                  {/* Orders Cards List */}
                  <div className="flex flex-col gap-3">
                    {filteredOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center text-stone-500 border border-stone-200">
                        لا توجد أي طلبات محفوظة حالياً
                      </div>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        return (
                          <div
                            key={ord.id}
                            className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                              isSelected ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400/30' : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-[280px]">
                              <button
                                type="button"
                                onClick={() => toggleSelectOrder(ord.id)}
                                className="mt-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="text-xs text-stone-400">{ord.createdAt}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ord.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                    ord.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    ord.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                    ord.status === 'called' ? 'bg-amber-100 text-amber-800' :
                                    ord.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {ord.status === 'new' && 'جديد'}
                                    {ord.status === 'called' && 'تم الاتصال'}
                                    {ord.status === 'confirmed' && 'مؤكد'}
                                    {ord.status === 'shipped' && 'جاري الشحن'}
                                    {ord.status === 'delivered' && 'تم التسليم'}
                                    {ord.status === 'cancelled' && 'ملغى'}
                                  </span>
                                </div>

                                <div className="font-bold text-sm text-stone-900 mt-1">
                                  {ord.fullName}
                                </div>

                                <div className="text-xs text-stone-600 flex items-center gap-2">
                                  <span className="font-mono text-stone-800 font-bold">{ord.phone}</span>
                                  <span>•</span>
                                  <span>{ord.wilayaName} ({ord.commune})</span>
                                  <span>•</span>
                                  <span className="text-[11px] text-stone-500 font-medium">
                                    {ord.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}
                                  </span>
                                </div>

                                {ord.notes && (
                                  <div className="text-[11px] text-stone-500 italic bg-stone-50 p-1.5 rounded-lg border border-stone-100 mt-1">
                                    ملاحظة الزبونة: {ord.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col text-left md:text-right">
                              <div className="text-xs font-medium text-stone-700">
                                الكمية: {ord.quantity} جهاز
                              </div>
                              <div className="text-sm font-black text-rose-600 mt-1">
                                الإجمالي: {ord.grandTotal.toLocaleString()} د.ج
                                <span className="text-[11px] text-stone-400 font-normal mr-1">
                                  (شحن: {ord.deliveryFee} د.ج)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={`tel:${ord.phone}`}
                                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                                title="اتصال هاتفي مباشر بالزبونة"
                              >
                                <Phone className="w-4 h-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() => openWhatsApp(ord.phone, ord.fullName, ord.orderNumber)}
                                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                title="مراسلة واتساب"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              <select
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                                className="text-xs py-1.5 px-2 rounded-xl border border-stone-200 bg-white font-medium focus:outline-none focus:border-rose-500"
                              >
                                <option value="new">جديد</option>
                                <option value="called">تم الاتصال</option>
                                <option value="confirmed">مؤكد</option>
                                <option value="shipped">جاري الشحن</option>
                                <option value="delivered">تم التسليم</option>
                                <option value="cancelled">ملغى</option>
                              </select>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingle(ord.id, ord.orderNumber);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer active:scale-95 border border-red-100 shrink-0"
                                title="حذف هذا الطلب نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCT & CONTENT MANAGER (DYNAMIC PRODUCT EDITOR) */}
              {activeTab === 'product' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Save Button Top Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-stone-900 text-sm">
                          لوحة التحكم الديناميكية لتعديل محتوى ومواصفات المنتج
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>حفظ تلقائي فوري</span>
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        كافة تعديلاتك، صورك، ونصوصك تُحفظ فورياً وتلقائياً في الـ LocalStorage وتنعكس مباشرة على المتجر.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveProduct()}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ وتثبيت التعديلات</span>
                    </button>
                  </div>

                  {/* A) الأساسيات: العنوان، الوصف التوضيحي، والسعر */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>أ) البيانات الأساسية للمنتج:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          عنوان المنتج الرئيسي (Title)
                        </label>
                        <input
                          type="text"
                          value={localProduct.title}
                          onChange={(e) => handleProductFieldChange('title', e.target.value)}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          سعر المنتج بالدينار الجزائري (د.ج)
                        </label>
                        <input
                          type="number"
                          value={localProduct.price}
                          onChange={(e) => handleProductFieldChange('price', Number(e.target.value))}
                          className="w-full text-xs font-black text-rose-600 p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          الوصف التوضيحي تحت العنوان (Tagline)
                        </label>
                        <input
                          type="text"
                          value={localProduct.tagline}
                          onChange={(e) => handleProductFieldChange('tagline', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* B) نقاط "أهم المميزات" (تعديل، إضافة، أو حذف) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                        <ListPlus className="w-4 h-4" />
                        <span>ب) نقاط "أهم المميزات" المعروضة للزبون ({localProduct.keyPoints.length}):</span>
                      </h4>
                    </div>

                    {/* خانة تعديل عنوان قسم المميزات الرئيسي حسب المنتج */}
                    <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-300 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-black text-rose-950">
                          خانة تعديل عنوان قسم المميزات الرئيسي (العنوان المعروض فوق النقاط):
                        </label>
                        <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                          يظهر مباشرة فوق نقاط المنتج
                        </span>
                      </div>
                      <input
                        type="text"
                        value={localProduct.keyPointsTitle || ''}
                        onChange={(e) => handleProductFieldChange('keyPointsTitle', e.target.value)}
                        placeholder="أهم مميزات مصفف Roza Beauty 5 في 1:"
                        className="w-full text-xs font-black p-3 rounded-xl border-2 border-rose-400 focus:outline-none focus:border-rose-600 bg-white text-stone-900 shadow-inner"
                      />
                      <span className="text-[11px] text-rose-900 mt-1.5 block font-medium">
                        ✨ يمكنك كتابة أي عنوان يناسب منتجك الجديد (مثال: أهم مميزات مصفف Roza Beauty 5 في 1: أو أهم مميزات ماكينة الحلاقة... إلخ). التعديل يحفظ فورياً!
                      </span>
                    </div>

                    {/* Existing Features List */}
                    <div className="flex flex-col gap-2.5">
                      {localProduct.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => handleUpdateKeyPoint(idx, e.target.value)}
                            className="flex-1 text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteKeyPoint(idx)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف هذه الميزة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Feature */}
                    <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                      <input
                        type="text"
                        value={newKeyPointText}
                        onChange={(e) => setNewKeyPointText(e.target.value)}
                        placeholder="اكتب ميزة جديدة لإضافتها..."
                        className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyPoint}
                        className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة ميزة</span>
                      </button>
                    </div>
                  </div>

                  {/* C) جدول المواصفات التقنية الرسمية */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>ج) جدول "المواصفات التقنية الرسمية":</span>
                    </h4>

                    {/* خانة تعديل عنوان جدول المواصفات */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        عنوان جدول المواصفات (العنوان المعروض أعلى الجدول):
                      </label>
                      <input
                        type="text"
                        value={localProduct.specsTitle || ''}
                        onChange={(e) => handleProductFieldChange('specsTitle', e.target.value)}
                        placeholder="المواصفات التقنية الرسمية:"
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {localProduct.specs.map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                          <input
                            type="text"
                            value={spec.label}
                            onChange={(e) => handleUpdateSpec(idx, 'label', e.target.value)}
                            placeholder="العنصر (مثال: القوة)"
                            className="sm:col-span-2 text-xs font-bold p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                            placeholder="القيمة (مثال: 1200 واط)"
                            className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteSpec(idx)}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="حذف هذا السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Spec Row */}
                    <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                      <input
                        type="text"
                        value={newSpecLabel}
                        onChange={(e) => setNewSpecLabel(e.target.value)}
                        placeholder="اسم الخاصية الجديدة..."
                        className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="text"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        placeholder="القيمة..."
                        className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSpec}
                        className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة سطر</span>
                      </button>
                    </div>
                  </div>

                  {/* D) نص الضمان الذهبي والمعاينة عند الاستلام وتقييم النجوم */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>د) نص الضمان الذهبي وتقييمات المتجر:</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        نص رسالة الضمان والمعاينة قبل الدفع
                      </label>
                      <textarea
                        rows={2}
                        value={localProduct.guaranteeText || ''}
                        onChange={(e) => handleProductFieldChange('guaranteeText', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        placeholder="لك كامل الحق في فتح الطرد ومعاينة الجهاز عند الاستلام..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          عدد التقييمات المعروض للزبائن (Reviews Count)
                        </label>
                        <input
                          type="number"
                          value={localProduct.reviewsCount}
                          onChange={(e) => handleProductFieldChange('reviewsCount', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          تقييم النجوم الرسمي (من 5)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={localProduct.rating}
                          onChange={(e) => handleProductFieldChange('rating', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E) معرض الصور: رفع محلي + روابط مباشرة + خيار إفراغ الصور القديمة */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>هـ) إدارة صور ألبوم المنتج ({localProduct.images.length}):</span>
                      </h4>

                      {localProduct.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearOtherImages()}
                          className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl font-bold border border-red-200 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
                          title="حذف جميع الصور القديمة لوضع صورك الخاصة فقط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف كافة الصور القديمة (لإبقاء صوري فقط)</span>
                        </button>
                      )}
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium leading-relaxed">
                      💡 <strong>نصيحة لإدارة الألبوم:</strong> يمكنك الضغط على <em>"رفع صورة من هاتفك"</em> لإضافة صورك الجديدة، واستخدام زر <em>"حذف كافة الصور القديمة"</em> لحذف الصور الافتراضية وحفظ صورك الخاصة فقط فورياً!
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        <Upload className="w-4 h-4" />
                        <span>رفع صورة من هاتفك أو حاسوبك</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLocalFileUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />

                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="url"
                          dir="ltr"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="أو ضعي رابط صورة مباشر..."
                          className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة الرابط</span>
                        </button>
                      </div>
                    </div>

                    {localProduct.images.length === 0 ? (
                      <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                        <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-stone-600">الألبوم فارغ حالياً</p>
                        <p className="text-[11px] text-stone-500 mt-1">ارفعي صور منتجك بالزر الوردي أعلاه لتعرض لزبائنك</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {localProduct.images.map((img, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-stone-200 aspect-square bg-stone-100 group shadow-xs">
                            <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-between items-center">
                                <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {idx === 0 ? 'رئيسية' : `#${idx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow transition-colors cursor-pointer"
                                  title="حذف هذه الصورة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="w-full py-1 bg-white/90 hover:bg-white text-stone-900 rounded-lg text-[10px] font-bold shadow cursor-pointer transition-colors"
                                >
                                  تعيين كرئيسية ⭐
                                </button>
                              )}
                            </div>

                            {/* Always visible badge */}
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                              {idx === 0 ? '⭐ الرئيسية' : `#${idx + 1}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="sm:hidden absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-600 text-white shadow"
                              title="حذف الصورة"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Changes Bottom Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveProduct()}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ كافة التعديلات فورياً في المتجر</span>
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 3: CUSTOMER REVIEWS MANAGER */}
              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Add New Review Form */}
                  <div className="bg-white p-5 rounded-2xl border border-rose-200">
                    <h3 className="font-black text-stone-900 text-sm mb-1 flex items-center gap-1.5 text-rose-700">
                      <Plus className="w-4 h-4" />
                      <span>إضافة رأي وتقييم جديد بالدارجة الجزائرية:</span>
                    </h3>
                    <p className="text-xs text-stone-500 mb-4">
                      أضيفي تعليق زبونة جديدة ليعرض مباشرة في قسم تقييمات المتجر
                    </p>

                    <form onSubmit={handleAddReview} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          اسم الزبونة <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="مثال: نسيمة بلقاسم"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          الولاية (مثال: وهران، قسنطينة) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newReviewWilaya}
                          onChange={(e) => setNewReviewWilaya(e.target.value)}
                          placeholder="مثال: عنابة"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          عدد النجوم (التقييم)
                        </label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500 bg-white"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 نجوم - ممتاز)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 نجوم - جيد جداً)</option>
                          <option value={3}>⭐⭐⭐ (3 نجوم)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          نص التعليق بالدارجة الجزائرية <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="اكتب الرأي بالدارجة... (مثال: هايل بزاف وصلني في 24 ساعة وسرحلي شعري روعة)"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة الرأي للمتجر</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Reviews List */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-1">
                      <span>الآراء الحالية المعروضة على المتجر ({localReviews.length}):</span>
                    </div>

                    {localReviews.length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl text-center text-xs text-stone-500 border border-stone-200">
                        لا توجد آراء محفوظة حالياً. يمكنك إضافة آراء جديدة من النموذج أعلاه.
                      </div>
                    ) : (
                      localReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-900">{rev.author}</span>
                              <span className="text-[11px] text-stone-400">· {rev.wilaya}</span>
                              <div className="flex items-center text-amber-400">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-stone-700 leading-relaxed font-medium">
                              "{rev.comment}"
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف هذا الرأي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: PIXEL TRACKING */}
              {activeTab === 'pixels' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-sm">
                      <Activity className="w-4 h-4" />
                      <span>إعدادات وتتبع Pixels الإعلانية (Meta Pixel & TikTok Pixel)</span>
                    </div>
                    <p className="text-xs text-stone-600 mb-4">
                      المحرك ينقل تلقائياً أحداث الزيارة والشراء (PageView, ViewContent, InitiateCheckout, Purchase/Lead)
                      لخوارزميات الإعلانات لتخفيض تكلفة الاكتساب.
                    </p>

                    <form onSubmit={handleSavePixelConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          معرّف Meta Pixel ID (فيسبوك / إنستغرام)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.metaPixelId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, metaPixelId: e.target.value.trim() })}
                          placeholder="مثال: 948271630192837"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          معرّف TikTok Pixel ID
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.tikTokPixelId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, tikTokPixelId: e.target.value.trim() })}
                          placeholder="مثال: C6ABCD1234EFGH5678"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          معرّف Google Tag / GA4 ID
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.googleTagId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, googleTagId: e.target.value.trim() })}
                          placeholder="مثال: G-XXXXXXX"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pixel-enabled-beauty"
                            checked={pixelConfig.enabled}
                            onChange={(e) => setPixelConfig({ ...pixelConfig, enabled: e.target.checked })}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                          />
                          <label htmlFor="pixel-enabled-beauty" className="text-xs font-semibold text-stone-700">
                            تفعيل محرك التتبع الإعلاني التلقائي
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ المعرّفات</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pixel Live Test Sandbox */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-stone-800">اختبار إرسال الأحداث للتأكد من التتبع:</div>
                      <button
                        type="button"
                        onClick={clearPixelLogs}
                        className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>مسح السجل</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('PageView')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث PageView</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('InitiateCheckout')}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث InitiateCheckout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('Purchase')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث Purchase / Lead</span>
                      </button>
                    </div>

                    {/* Event Logs */}
                    <div className="bg-stone-900 text-stone-200 rounded-xl p-3 font-mono text-xs max-h-48 overflow-y-auto" dir="ltr">
                      <div className="text-stone-400 text-[11px] mb-1 font-sans">سجل الأحداث الأخيرة (Event Logs):</div>
                      {pixelLogs.length === 0 ? (
                        <div className="text-stone-500 text-[11px] italic">لم تسجل أي أحداث بعد...</div>
                      ) : (
                        pixelLogs.map((log) => (
                          <div key={log.id} className="py-1 border-b border-stone-800 text-[11px] flex items-start gap-2">
                            <span className="text-stone-400">[{log.timestamp}]</span>
                            <span className="font-bold text-emerald-400">[{log.eventName}]</span>
                            <span className="text-stone-300 truncate">{JSON.stringify(log.data)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};

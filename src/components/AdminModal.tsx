import React, { useState, useEffect, useRef } from 'react';
import { 
  Order, 
  OrderStatus, 
  BeautyProduct, 
  PixelConfig, 
  PixelEventLog, 
  CustomerReview,
  ProductCategory,
  StoreBanner,
  TrackingEventDoc,
  AdSpend
} from '../types';
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
import type { User } from 'firebase/auth';
import { 
  ADMIN_EMAIL, 
  signInWithGoogle, 
  signOutAdmin, 
  onAdminAuthStateChanged, 
  subscribeToOrders, 
  updateOrderStatusInFirestore, 
  deleteOrderFromFirestore, 
  deleteMultipleOrdersFromFirestore, 
  saveProductToFirestore, 
  saveReviewsToFirestore, 
  savePixelConfigToFirestore, 
  uploadImageToStorage,
  saveCatalogProduct,
  deleteCatalogProduct,
  saveCategory,
  deleteCategory,
  saveBannerToFirestore,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToBanner,
  subscribeToEvents,
  subscribeToAdSpend
} from '../services/firebase';
import { AiInsightsTab } from './AiInsightsTab';
import { DEFAULT_BANNER } from '../data/categories';
import { compressImage } from '../utils/imageCompressor';
import { 
  X, Download, Search, Phone, MessageSquare, Trash2, 
  Package, Settings, Activity, Plus, Save, RefreshCw, 
  Send, Check, KeyRound, AlertCircle, Upload, CheckSquare, Square, 
  Star, Heart, Sparkles, Award, ListPlus, Image as ImageIcon, ShieldCheck,
  Layers, LayoutTemplate, Edit, Eye, EyeOff, Smartphone, Monitor, UploadCloud
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
  products?: BeautyProduct[];
  categories?: ProductCategory[];
  banner?: StoreBanner;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
  orders,
  onOrdersUpdated,
  reviews,
  onReviewsUpdated,
  products = [],
  categories = [],
  banner
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

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'banner' | 'product' | 'reviews' | 'pixels' | 'analytics'>('orders');

  // Analytics & Ad Spend states
  const [eventsList, setEventsList] = useState<TrackingEventDoc[]>([]);
  const [adSpendList, setAdSpendList] = useState<AdSpend[]>([]);

  // Multi-products catalog management states
  const [localProductsList, setLocalProductsList] = useState<BeautyProduct[]>(products);
  const [localCategoriesList, setLocalCategoriesList] = useState<ProductCategory[]>(categories);
  const [localBanner, setLocalBanner] = useState<StoreBanner>(() => {
    if (banner) {
      const heroImg = banner.heroImageUrl !== undefined ? banner.heroImageUrl : (banner.imageUrl || DEFAULT_BANNER.imageUrl);
      return {
        ...banner,
        heroImageUrl: heroImg,
        imageUrl: banner.imageUrl || heroImg,
        heroImageBadge: banner.heroImageBadge || 'PROMO',
        showHeroImage: banner.showHeroImage !== undefined ? banner.showHeroImage : Boolean(heroImg),
        showImageBadge: banner.showImageBadge !== undefined ? banner.showImageBadge : true
      };
    }
    return DEFAULT_BANNER;
  });

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState(false);
  const [bannerDirectUrlInput, setBannerDirectUrlInput] = useState('');

  const [editingProduct, setEditingProduct] = useState<BeautyProduct | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isSavingCatalogProduct, setIsSavingCatalogProduct] = useState(false);
  const catalogFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCatalogImages, setIsUploadingCatalogImages] = useState(false);
  const [isCatalogDragOver, setIsCatalogDragOver] = useState(false);

  const handleCatalogFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || !editingProduct) return;

    const fileList = Array.from(files);
    setIsUploadingCatalogImages(true);
    showNotice(`⏳ جاري معالجة ورفع ${fileList.length} صورة للمنتج...`);

    try {
      const uploadedUrls: string[] = [];
      for (const file of fileList) {
        try {
          const compressed = await compressImage(file, 900, 0.85);
          const downloadUrl = await uploadImageToStorage(compressed);
          uploadedUrls.push(downloadUrl);
        } catch (storageErr) {
          console.warn('Firebase storage upload failed, attempting direct upload:', storageErr);
          try {
            const downloadUrl = await uploadImageToStorage(file);
            uploadedUrls.push(downloadUrl);
          } catch (directErr) {
            console.warn('Storage fallback to data URL:', directErr);
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedUrls.push(dataUrl);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setEditingProduct((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            images: [...prev.images, ...uploadedUrls]
          };
        });
        showNotice(`✅ تم بنجاح إضافة ${uploadedUrls.length} صورة للمنتج من جهازك! اضغط "حفظ المنتج" لتثبيت التغييرات.`);
      }
    } catch (err) {
      console.error('Failed to upload product images:', err);
      showNotice('❌ حدث خطأ أثناء رفع الصور. يرجى التأكد من الملف والمحاولة مرة أخرى.');
    } finally {
      setIsUploadingCatalogImages(false);
      if (catalogFileInputRef.current) {
        catalogFileInputRef.current.value = '';
      }
    }
  };

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      setLocalProductsList(products);
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) {
      setLocalCategoriesList(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (banner) {
      const heroImg = banner.heroImageUrl !== undefined ? banner.heroImageUrl : (banner.imageUrl || DEFAULT_BANNER.imageUrl);
      setLocalBanner({
        ...banner,
        heroImageUrl: heroImg,
        imageUrl: banner.imageUrl || heroImg,
        heroImageBadge: banner.heroImageBadge || 'PROMO',
        showHeroImage: banner.showHeroImage !== undefined ? banner.showHeroImage : Boolean(heroImg),
        showImageBadge: banner.showImageBadge !== undefined ? banner.showImageBadge : true
      });
    }
  }, [banner]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected orders for bulk deletion
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Google Auth & Firestore states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const isGoogleAdmin = Boolean(
    currentUser?.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  useEffect(() => {
    const unsub = onAdminAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync when authenticated with authorized Google account
  useEffect(() => {
    if (isOpen && isAuthenticated && isGoogleAdmin) {
      const unsubOrders = subscribeToOrders(
        (ordersFromDb) => {
          setLocalOrders(ordersFromDb);
          onOrdersUpdated(ordersFromDb);
        },
        (err) => {
          console.error('Firestore subscription error:', err);
        }
      );

      const unsubEvents = subscribeToEvents(
        (eventsFromDb) => {
          setEventsList(eventsFromDb);
        },
        (err) => {
          console.error('Firestore events subscription error:', err);
        }
      );

      const unsubSpends = subscribeToAdSpend(
        (spendsFromDb) => {
          setAdSpendList(spendsFromDb);
        },
        (err) => {
          console.error('Firestore adSpend subscription error:', err);
        }
      );

      return () => {
        unsubOrders();
        unsubEvents();
        unsubSpends();
      };
    }
  }, [isOpen, isAuthenticated, isGoogleAdmin]);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const user = await signInWithGoogle();
      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setAuthError(`الحساب (${user.email}) غير مصرح له. يرجى الدخول بحساب ${ADMIN_EMAIL}`);
      } else {
        showNotice('تم تسجيل الدخول بنجاح بحساب الأدمن المصرح!');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('تعذر تسجيل الدخول بـ Google. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutAdmin();
      showNotice('تم تسجيل الخروج بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  // Pixel Config State
  const [pixelConfig, setPixelConfig] = useState<PixelConfig>(getPixelConfig());
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>(getPixelLogs());

  // Firestore saving & upload states
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isSavingPixel, setIsSavingPixel] = useState(false);

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

  // In-app styled confirmation modal state (no window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPixelLogs(getPixelLogs());
      setPixelConfig(getPixelConfig());
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

  // Update order status directly in Firestore
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
      showNotice('تم تحديث حالة الطلب في Firestore بنجاح');
    } catch (e) {
      console.error(e);
      showNotice('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  // Permanent Single Delete Order directly in Firestore
  const handleDeleteSingle = async (orderId: string, orderNumber: string) => {
    try {
      await deleteOrderFromFirestore(orderId);
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
      showNotice(`تم حذف الطلب (${orderNumber}) بنجاح وبشكل دائم من Firestore`);
    } catch (e) {
      console.error(e);
      showNotice('حدث خطأ أثناء حذف الطلب');
    }
  };

  // Permanent Bulk Delete Selected Orders directly in Firestore
  const handleDeleteSelected = async () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    try {
      await deleteMultipleOrdersFromFirestore(selectedOrderIds);
      setSelectedOrderIds([]);
      showNotice(`تم حذف ${count} طلبات محددة بنجاح وبشكل دائم من Firestore`);
    } catch (e) {
      console.error(e);
      showNotice('حدث خطأ أثناء حذف الطلبات');
    }
  };

  // Permanent Delete Processed Orders directly in Firestore
  const handleDeleteProcessed = async () => {
    const ids = localOrders
      .filter(o => o.status === 'delivered' || o.status === 'cancelled')
      .map(o => o.id);
    if (ids.length === 0) {
      showNotice('لا توجد طلبات معالجة لحذفها');
      return;
    }
    try {
      await deleteMultipleOrdersFromFirestore(ids);
      setSelectedOrderIds([]);
      showNotice('تم حذف كافة الطلبات المعالجة (الملغاة والمسلمة) بنجاح من Firestore');
    } catch (e) {
      console.error(e);
      showNotice('حدث خطأ أثناء حذف الطلبات المعالجة');
    }
  };

  // Permanent Clear All Orders directly in Firestore
  const handleClearAll = async () => {
    const ids = localOrders.map(o => o.id);
    if (ids.length === 0) return;
    try {
      await deleteMultipleOrdersFromFirestore(ids);
      setSelectedOrderIds([]);
      showNotice('تم مسح جميع الطلبات نهائياً من Firestore');
    } catch (e) {
      console.error(e);
      showNotice('حدث خطأ أثناء مسح الطلبات');
    }
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

  // Helper for single field updates (Title, Tagline, Price, Titles, Guarantee, Ratings)
  const handleProductFieldChange = <K extends keyof BeautyProduct>(field: K, value: BeautyProduct[K]) => {
    setLocalProduct((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Save Product Modifications explicitly to Firestore (/settings/product)
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProduct(true);
    try {
      await saveProductToFirestore(localProduct);
      saveStoredProduct(localProduct);
      onProductUpdated(localProduct);
      showNotice('✅ تم حفظ وتثبيت كافة تعديلات ومواصفات المنتج في Firestore بنجاح!');
    } catch (err: unknown) {
      console.error('Failed to save product in Firestore:', err);
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED')) {
        showNotice(`❌ فشل الحفظ في Firestore: يرجى تسجيل الدخول بحساب Google المصرح به (${ADMIN_EMAIL})`);
      } else {
        showNotice(`❌ خطأ في الحفظ: ${errStr.slice(0, 90)}`);
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Add Key Point
  const handleAddKeyPoint = () => {
    if (!newKeyPointText.trim()) return;
    setLocalProduct((prev) => ({
      ...prev,
      keyPoints: [...prev.keyPoints, newKeyPointText.trim()]
    }));
    setNewKeyPointText('');
  };

  // Edit Key Point
  const handleUpdateKeyPoint = (index: number, value: string) => {
    setLocalProduct((prev) => ({
      ...prev,
      keyPoints: prev.keyPoints.map((kp, idx) => idx === index ? value : kp)
    }));
  };

  // Delete Key Point
  const handleDeleteKeyPoint = (index: number) => {
    setLocalProduct((prev) => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, idx) => idx !== index)
    }));
  };

  // Add Spec Row
  const handleAddSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    setLocalProduct((prev) => ({
      ...prev,
      specs: [...prev.specs, { label: newSpecLabel.trim(), value: newSpecValue.trim() }]
    }));
    setNewSpecLabel('');
    setNewSpecValue('');
  };

  // Update Spec Row
  const handleUpdateSpec = (index: number, field: 'label' | 'value', text: string) => {
    setLocalProduct((prev) => ({
      ...prev,
      specs: prev.specs.map((s, idx) => idx === index ? { ...s, [field]: text } : s)
    }));
  };

  // Delete Spec Row
  const handleDeleteSpec = (index: number) => {
    setLocalProduct((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, idx) => idx !== index)
    }));
  };

  // Local File Upload with Firebase Storage upload and URL storage only
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploadingImage(true);
    showNotice('⏳ جاري رفع الصور إلى Firebase Storage...');

    try {
      const uploadedUrls: string[] = [];
      for (const file of fileList) {
        const compressed = await compressImage(file, 800, 0.85);
        const downloadUrl = await uploadImageToStorage(compressed);
        uploadedUrls.push(downloadUrl);
      }

      setLocalProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      showNotice(`✅ تم رفع ${uploadedUrls.length} صورة إلى Firebase Storage بنجاح! اضغط "حفظ" لتأكيد النشر.`);
    } catch (err) {
      console.error('Failed to upload image to Firebase Storage:', err);
      showNotice('❌ فشل رفع الصور إلى Firebase Storage. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setLocalProduct((prev) => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setLocalProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Clear other images to leave only newly added images (ضع هاذم التصوير في الالبوم واذف الاخرين)
  const handleClearOtherImages = (keepIndex?: number) => {
    if (keepIndex !== undefined && localProduct.images[keepIndex]) {
      setLocalProduct((prev) => ({
        ...prev,
        images: [prev.images[keepIndex]]
      }));
    } else {
      setLocalProduct((prev) => ({
        ...prev,
        images: []
      }));
    }
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary <= 0 || indexToPrimary >= localProduct.images.length) return;
    setLocalProduct((prev) => {
      const selected = prev.images[indexToPrimary];
      const rest = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [selected, ...rest]
      };
    });
  };

  // Banner Circular Image Handlers
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBannerImg(true);
    showNotice('⏳ جاري ضغط صورة البانر ورفعها إلى Firebase Storage...');

    try {
      // 1. Compress image to max 800px width with quality 0.85
      const compressedFile = await compressImage(file, 800, 0.85);

      // 2. Upload to Firebase Storage
      const downloadUrl = await uploadImageToStorage(compressedFile);

      // 3. Update localBanner
      setLocalBanner((prev) => ({
        ...prev,
        heroImageUrl: downloadUrl,
        imageUrl: downloadUrl,
        showHeroImage: true
      }));

      showNotice('✅ تم رفع صورة البانر وضغطها بنجاح! اضغط "حفظ البانر" لتأكيد النشر.');
    } catch (err: unknown) {
      console.error('Failed to upload banner image:', err);
      showNotice('❌ فشل رفع صورة البانر. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingBannerImg(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleApplyDirectBannerUrl = () => {
    if (!bannerDirectUrlInput.trim()) return;
    const url = bannerDirectUrlInput.trim();
    setLocalBanner((prev) => ({
      ...prev,
      heroImageUrl: url,
      imageUrl: url,
      showHeroImage: true
    }));
    setBannerDirectUrlInput('');
    showNotice('✅ تم تطبيق رابط الصورة الدائرية للبانر بنجاح!');
  };

  const handleDeleteBannerImage = () => {
    setLocalBanner((prev) => ({
      ...prev,
      heroImageUrl: '',
      imageUrl: '',
      showHeroImage: false
    }));
    showNotice('تم حذف صورة البانر (ستختفي الدائرة ويتوسع النص تلقائياً).');
  };

  // REVIEWS MANAGEMENT: Save to Firestore (/settings/reviews)
  const handleAddReview = async (e: React.FormEvent) => {
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
    setIsSavingReview(true);
    try {
      await saveReviewsToFirestore(updated);
      setLocalReviews(updated);
      saveStoredReviews(updated);
      onReviewsUpdated(updated);

      setNewReviewAuthor('');
      setNewReviewWilaya('');
      setNewReviewComment('');
      setNewReviewRating(5);
      showNotice('✅ تم حفظ ونشر رأي الزبونة في Firestore بنجاح!');
    } catch (err: unknown) {
      console.error('Failed to save reviews to Firestore:', err);
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED')) {
        showNotice(`❌ فشل الحفظ في Firestore: يرجى تسجيل الدخول بحساب Google المصرح به (${ADMIN_EMAIL})`);
      } else {
        showNotice(`❌ خطأ: ${errStr.slice(0, 90)}`);
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const updated = localReviews.filter(r => r.id !== reviewId);
    try {
      await saveReviewsToFirestore(updated);
      setLocalReviews(updated);
      saveStoredReviews(updated);
      onReviewsUpdated(updated);
      showNotice('تم حذف التقييم من Firestore بنجاح.');
    } catch (err: unknown) {
      console.error('Failed to delete review in Firestore:', err);
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED')) {
        showNotice(`❌ فشل الحذف في Firestore: يرجى تسجيل الدخول بحساب Google المصرح به (${ADMIN_EMAIL})`);
      } else {
        showNotice(`❌ خطأ: ${errStr.slice(0, 90)}`);
      }
    }
  };

  // PIXEL SETTINGS: Save to Firestore (/settings/pixels)
  const handleSavePixelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPixel(true);
    try {
      await savePixelConfigToFirestore(pixelConfig);
      savePixelConfig(pixelConfig);
      showNotice('✅ تم حفظ إعدادات الـ Pixels في Firestore وتفعيلها بنجاح!');
    } catch (err: unknown) {
      console.error('Failed to save pixel config to Firestore:', err);
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED')) {
        showNotice(`❌ فشل الحفظ في Firestore: يرجى تسجيل الدخول بحساب Google المصرح به (${ADMIN_EMAIL})`);
      } else {
        showNotice(`❌ خطأ: ${errStr.slice(0, 90)}`);
      }
    } finally {
      setIsSavingPixel(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a2b3d]/50 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#f7dfe8] overflow-hidden text-right animate-in fade-in zoom-in-95">
        
        {/* Modal Topbar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#b8386d] via-[#c93d78] to-[#d94f86] text-white flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#d94f86] flex items-center justify-center font-black text-base shadow-sm">
              R
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                لوحة التحكم وإدارة المتجر | Roza Beauty DZ
              </h2>
              <p className="text-xs text-pink-100">
                إدارة الطلبات، تعديل تفاصيل المنتجات، آراء الزبائن، والـ Pixels
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick AI Advisor Button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs ${
                  activeTab === 'analytics'
                    ? 'bg-white text-[#d94f86] ring-2 ring-amber-300'
                    : 'bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-[#4a2b3d]'
                }`}
                title="فتح مستشار الذكاء الاصطناعي (AI)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#4a2b3d]" />
                <span>مستشار AI ✨</span>
              </button>
            )}

            {isAuthenticated && (
              !currentUser ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#fff8f5] text-[#4a2b3d] text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  title="تسجيل الدخول بحساب Google لتفعيل الحفظ في Firestore"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>دخول Google</span>
                </button>
              ) : isGoogleAdmin ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 rounded-xl text-[11px] text-white">
                  <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="font-mono text-xs" dir="ltr">{currentUser.email}</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignOut}
                    className="text-pink-100 hover:text-white mr-1 text-[10px] underline cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 rounded-xl text-[11px] text-pink-200">
                  <span>غير مصرح</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignOut}
                    className="text-pink-100 hover:text-white mr-1 text-[10px] underline cursor-pointer"
                  >
                    تبديل
                  </button>
                </div>
              )
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. PIN SECURITY SCREEN (REQUIRE CODE: 2009) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#fdeaf1] text-[#d94f86] flex items-center justify-center mb-4 ring-8 ring-[#fdeaf1]/50">
              <KeyRound className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-[#4a2b3d] mb-1">
              لوحة الإدارة محمية برمز الأمان
            </h3>
            <p className="text-xs text-[#8a6b7a] mb-6">
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
                  className="w-full py-3 px-4 rounded-xl border border-[#f7dfe8] bg-[#fff8f5] text-[#4a2b3d] text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#d94f86]/30 focus:border-[#d94f86]"
                />
              </div>

              {pinError && (
                <div className="text-xs text-[#c93d78] font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#d94f86] hover:bg-[#c93d78] text-white font-bold text-sm shadow transition-colors cursor-pointer"
              >
                فتح لوحة التحكم
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#8a6b7a] hover:text-[#4a2b3d] underline mt-2 cursor-pointer"
              >
                العودة للمتجر
              </button>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-[#f7dfe8] px-4 pt-2 bg-[#fff8f5] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>الطلبات ({localOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>إدارة المنتجات ({localProductsList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <ListPlus className="w-4 h-4" />
                <span>إدارة الأقسام ({localCategoriesList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'banner'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>البانر الرئيسي</span>
              </button>

              <button
                onClick={() => setActiveTab('product')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'product'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>تفاصيل منتج الهبوط</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>الآراء ({localReviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('pixels')}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'pixels'
                    ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>الـ Pixels والتتبع</span>
              </button>

              {/* Analytics & AI Insights tab - Visible to authenticated admins */}
              {(isGoogleAdmin || isAuthenticated) && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'border-[#d94f86] text-[#d94f86] bg-white rounded-t-xl shadow-xs font-black'
                      : 'border-transparent text-[#8a6b7a] hover:text-[#4a2b3d]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>الذكاء الاصطناعي والتحليلات (AI)</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-gradient-to-r from-amber-500 to-[#d94f86] text-white rounded-full font-black shadow-2xs">
                    AI
                  </span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fff8f5]/60 flex flex-col gap-4">

              {/* Action feedback toast */}
              {actionNotice && (
                <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl text-center shadow-md flex items-center justify-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{actionNotice}</span>
                </div>
              )}

              {/* Persistent Google Admin Status Bar across all tabs */}
              {!isGoogleAdmin ? (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-950 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5 text-right w-full sm:w-auto">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold block">تسجيل الدخول كمدير مطلوب:</span>
                      <span className="text-amber-800 text-[11px]">
                        لحفظ التعديلات في Firestore وعرض الطلبات، يجب تسجيل الدخول بحساب{' '}
                        <strong className="font-mono text-rose-700 font-bold" dir="ltr">{ADMIN_EMAIL}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isAuthLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{isAuthLoading ? 'جاري الاتصال...' : 'دخول بحساب المدير Google'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>حساب المدير المعتمد: <strong className="font-mono text-emerald-800" dir="ltr">{currentUser?.email}</strong> (صلاحيات كاملة في Firestore)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignOut}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              )}

              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                !isGoogleAdmin ? (
                  <div className="bg-white rounded-3xl border border-[#f7dfe8] p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm my-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#fff8f5] border border-[#f7dfe8] flex items-center justify-center mb-4 shadow-xs">
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>

                    <h3 className="text-lg font-black text-[#4a2b3d] mb-2">
                      تسجيل الدخول بـ Google لعرض وإدارة الطلبات
                    </h3>

                    <p className="text-xs text-[#8a6b7a] mb-6 max-w-sm leading-relaxed">
                      يتم تخزين وحماية الطلبات في قاعدة بيانات Firebase Firestore المشتركة. للوصول إليها وإدارتها، يرجى تسجيل الدخول بحساب Google المصرح له (<span className="font-mono text-rose-600 font-bold" dir="ltr">{ADMIN_EMAIL}</span>).
                    </p>

                    {currentUser && !isGoogleAdmin && (
                      <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between gap-2 text-right">
                        <span>
                          أنت مسجل حالياً بـ: <strong className="font-mono">{currentUser.email}</strong> (غير مصرح)
                        </span>
                        <button
                          type="button"
                          onClick={handleGoogleSignOut}
                          className="font-bold underline hover:text-rose-900 cursor-pointer"
                        >
                          خروج
                        </button>
                      </div>
                    )}

                    {authError && (
                      <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 text-right">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#fff8f5] text-[#4a2b3d] font-bold text-xs sm:text-sm rounded-xl border border-[#f7dfe8] shadow-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {isAuthLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول بـ Google'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* Google Admin Account Status Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold">قاعدة بيانات Firestore متصلة مباشرة</span>
                        <span className="text-emerald-700">|</span>
                        <span className="font-mono text-emerald-800" dir="ltr">{currentUser?.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleSignOut}
                        className="text-[#8a6b7a] hover:text-[#4a2b3d] underline text-xs cursor-pointer"
                      >
                        تسجيل الخروج
                      </button>
                    </div>

                    {/* Real-time KPI Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-[#f7dfe8] shadow-xs">
                      <div className="text-xs text-[#8a6b7a] font-semibold mb-1">إجمالي المبيعات</div>
                      <div className="text-lg sm:text-xl font-black text-[#d94f86]">
                        {totalRevenue.toLocaleString()} د.ج
                      </div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#f7dfe8] shadow-xs">
                      <div className="text-xs text-[#8a6b7a] font-semibold mb-1">إجمالي الطلبات</div>
                      <div className="text-lg sm:text-xl font-black text-[#4a2b3d]">{localOrders.length} طلب</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#f7dfe8] shadow-xs">
                      <div className="text-xs text-[#8a6b7a] font-semibold mb-1">طلبات جديدة</div>
                      <div className="text-lg sm:text-xl font-black text-amber-600">{newOrdersCount} طلب</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-[#f7dfe8] shadow-xs">
                      <div className="text-xs text-[#8a6b7a] font-semibold mb-1">طلبات مؤكدة</div>
                      <div className="text-lg sm:text-xl font-black text-emerald-600">{confirmedOrdersCount} طلب</div>
                    </div>
                  </div>

                  {/* Filter & Export Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#f7dfe8]">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-[#8a6b7a] absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث بالاسم، رقم الهاتف، رقم الطلب، أو الولاية..."
                          className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs py-2 px-3 rounded-xl border border-[#f7dfe8] bg-white focus:outline-none focus:border-rose-500"
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

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveTab('analytics')}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-[#d94f86] hover:from-amber-600 hover:to-[#c93d78] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                        title="تحليل شامل للمبيعات والطلبات بالذكاء الاصطناعي"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تحليل المبيعات بـ AI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportOrdersToCSV(localOrders)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        <span>تصدير الطلبات بملف Excel / CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Delete Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#fdeaf1] rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#fff8f5] border border-[#f7dfe8] rounded-lg text-[#4a2b3d] font-semibold cursor-pointer"
                      >
                        {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#d94f86]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#8a6b7a]" />
                        )}
                        <span>تحديد الكل ({selectedOrderIds.length})</span>
                      </button>

                      {selectedOrderIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'حذف الطلبات المحددة',
                              message: `هل أنت متأكد من حذف ${selectedOrderIds.length} طلبات محددة نهائياً من قاعدة البيانات؟`,
                              confirmText: 'نعم احذف',
                              onConfirm: async () => {
                                await handleDeleteSelected();
                              }
                            });
                          }}
                          className="px-3 py-1.5 bg-[#d94f86] hover:bg-[#c93d78] text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الطلبات المحددة ({selectedOrderIds.length})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'حذف الطلبات المعالجة',
                            message: 'هل أنت متأكد من حذف جميع الطلبات المعالجة (الملغاة والمسلمة) نهائياً من قاعدة البيانات؟',
                            confirmText: 'نعم احذف',
                            onConfirm: async () => {
                              await handleDeleteProcessed();
                            }
                          });
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#fdeaf1] border border-[#f7dfe8] text-[#c93d78] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="حذف جميع الطلبات الملغاة أو المسلمة"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف الطلبات المعالجة (ملغى / مسلّم)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'مسح كافة الطلبات',
                            message: 'تحذير: هل أنت متأكد من مسح جميع الطلبات نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
                            confirmText: 'نعم امسح الكل',
                            onConfirm: async () => {
                              await handleClearAll();
                            }
                          });
                        }}
                        className="px-2.5 py-1.5 text-[#c93d78] hover:bg-[#fdeaf1] rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        title="مسح كافة الطلبات"
                      >
                        مسح كافة الطلبات
                      </button>
                    </div>
                  </div>

                  {/* Orders Cards List */}
                  <div className="flex flex-col gap-3">
                    {filteredOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center text-[#8a6b7a] border border-[#f7dfe8]">
                        لا توجد أي طلبات محفوظة حالياً
                      </div>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        return (
                          <div
                            key={ord.id}
                            className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                              isSelected ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400/30' : 'border-[#f7dfe8] hover:border-[#f7dfe8]'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-[280px]">
                              <button
                                type="button"
                                onClick={() => toggleSelectOrder(ord.id)}
                                className="mt-1 text-[#8a6b7a] hover:text-rose-600 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#fdeaf1] text-[#4a2b3d]">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="text-xs text-[#8a6b7a]">{ord.createdAt}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ord.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                    ord.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                    ord.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                    ord.status === 'called' ? 'bg-amber-100 text-amber-800' :
                                    ord.status === 'cancelled' ? 'bg-[#fdeaf1] text-[#c93d78]' :
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

                                <div className="font-bold text-sm text-[#4a2b3d] mt-1">
                                  {ord.fullName}
                                </div>

                                <div className="text-xs text-[#8a6b7a] flex items-center gap-2">
                                  <span className="font-mono text-[#4a2b3d] font-bold">{ord.phone}</span>
                                  <span>•</span>
                                  <span>{ord.wilayaName} ({ord.commune})</span>
                                  <span>•</span>
                                  <span className="text-[11px] text-[#8a6b7a] font-medium">
                                    {ord.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}
                                  </span>
                                </div>
                                {ord.items && ord.items.length > 0 ? (
                                  <div className="flex flex-col gap-1 mt-1 bg-[#fdeaf1]/60 p-2 rounded-xl border border-[#f7dfe8]">
                                    <span className="text-[11px] font-bold text-[#b8386d]">المنتجات المطلوبة:</span>
                                    {ord.items.map((item, i) => (
                                      <div key={i} className="text-xs text-[#4a2b3d] flex items-center justify-between">
                                        <span>• {item.productTitle}</span>
                                        <span className="font-mono font-bold text-[#d94f86]">({item.quantity} × {item.unitPrice} د.ج)</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-[#4a2b3d] font-medium mt-1">
                                    المنتج: {ord.productTitle}
                                  </div>
                                )}

                                {ord.notes && (
                                  <div className="text-[11px] text-[#8a6b7a] italic bg-[#fff8f5] p-1.5 rounded-lg border border-[#f7dfe8] mt-1">
                                    ملاحظة الزبونة: {ord.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col text-left md:text-right">
                              <div className="text-xs font-medium text-[#8a6b7a]">
                                الكمية: {ord.quantity} جهاز
                              </div>
                              <div className="text-sm font-black text-[#d94f86] mt-1">
                                الإجمالي: {ord.grandTotal.toLocaleString()} د.ج
                                <span className="text-[11px] text-[#8a6b7a] font-normal mr-1">
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
                                className="text-xs py-1.5 px-2 rounded-xl border border-[#f7dfe8] bg-white font-medium focus:outline-none focus:border-[#d94f86]"
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
                                className="px-2.5 py-1.5 rounded-xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#c93d78] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer active:scale-95 border border-[#f7dfe8] shrink-0"
                                title="حذف هذا الطلب نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#c93d78]" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )
            )}

              {/* TAB: MULTI-PRODUCTS CATALOG MANAGER */}
              {activeTab === 'products' && (
                <div className="flex flex-col gap-6">
                  {/* Top Bar with Add Product CTA */}
                  <div className="bg-white p-4 rounded-2xl border border-[#f7dfe8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h3 className="font-black text-[#4a2b3d] text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#d94f86]" />
                        <span>إدارة كتالوج المنتجات ({localProductsList.length} منتج)</span>
                      </h3>
                      <p className="text-xs text-[#8a6b7a] mt-0.5">
                        إضافة، تعديل الأسعار، المخزون، الصور، وإظهار أو إخفاء أي منتج في المتجر
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct({
                          id: `prod-${Date.now()}`,
                          brandName: 'Roza Beauty DZ',
                          title: '',
                          tagline: '',
                          price: 4500,
                          originalPrice: 6000,
                          currency: 'د.ج',
                          images: [],
                          keyPoints: ['منتج أصلي مضمون وعالي الجودة'],
                          keyPointsTitle: 'المميزات الرئيسية:',
                          specs: [{ label: 'الضمان', value: '12 شهراً' }],
                          specsTitle: 'المواصفات التقنية:',
                          rating: 5.0,
                          reviewsCount: 25,
                          inStock: true,
                          guaranteeText: 'حق المعاينة والتأكد من المنتج قبل الدفع عند الاستلام',
                          categoryId: localCategoriesList[0]?.id || 'cat-appliances',
                          categorySlug: localCategoriesList[0]?.slug || 'home-appliances',
                          categoryName: localCategoriesList[0]?.name || 'أجهزة العناية والمنزل',
                          isFeatured: false,
                          isVisible: true,
                          stockCount: 50
                        });
                        setIsCreatingProduct(true);
                      }}
                      className="px-4 py-2 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة منتج جديد</span>
                    </button>
                  </div>

                  {/* Product Form Modal / Section */}
                  {editingProduct && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#f7dfe8] shadow-md flex flex-col gap-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-[#f7dfe8] pb-3">
                        <h4 className="font-bold text-sm text-[#4a2b3d] flex items-center gap-2">
                          <Edit className="w-4 h-4 text-[#d94f86]" />
                          <span>{isCreatingProduct ? 'إضافة منتج جديد للكتالوج' : `تعديل المنتج: ${editingProduct.title}`}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setIsCreatingProduct(false);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#fdeaf1] text-[#8a6b7a] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Title */}
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-[#4a2b3d] mb-1">عنوان واسم المنتج:</label>
                          <input
                            type="text"
                            value={editingProduct.title}
                            onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                            placeholder="مثال: مجفف ومصفف الشعر 5 في 1"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs font-bold"
                          />
                        </div>

                        {/* Tagline */}
                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block font-bold text-[#4a2b3d]">الوصف المختصر (Tagline):</label>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingProduct.title) {
                                  alert('يرجى كتابة اسم أو عنوان المنتج أولاً لتوليد وصف ملائم');
                                  return;
                                }
                                const suggestions = [
                                  `الحل المثالي والأصلي لإطلالة ساحرة ونتائج احترافية في دقائق معدودة، مع ضمان الجودة والمعاينة عند الاستلام.`,
                                  `تصميم عصري متطور لراحة يومية ونتائج مبهرة، توصيل سريع لـ 58 ولاية مع الدفع عند الاستلام.`,
                                  `المنتج الأكثر طلباً لجودته العالية وسهولة استخدامه، مع ضمان استبدال مجاني وتجربة مضمونة.`,
                                  `عناية فائقة تدوم طويلاً، متوفر الآن بسعر ترويجي حصري وكمية محدودة!`
                                ];
                                const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
                                setEditingProduct({ ...editingProduct, tagline: `${editingProduct.title} - ${pick}` });
                                showNotice('✨ تم توليد وصف تسويقي جذاب بالذكاء الاصطناعي!');
                              }}
                              className="text-[11px] text-[#d94f86] hover:text-[#b8386d] font-black flex items-center gap-1 cursor-pointer hover:underline"
                              title="توليد عبارة تسويقية جذابة للسوق الجزائري"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>توليد وصف ذكي (AI)</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editingProduct.tagline}
                            onChange={(e) => setEditingProduct({ ...editingProduct, tagline: e.target.value })}
                            placeholder="عبارة تسويقية موجزة ومحفزة للشراء"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs"
                          />
                        </div>

                        {/* Price & Original Price */}
                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">السعر الحالي (د.ج):</label>
                          <input
                            type="number"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">السعر القديم المشطوب (د.ج):</label>
                          <input
                            type="number"
                            value={editingProduct.originalPrice || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="اختياري (لعرض شارة التخفيض)"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs"
                          />
                        </div>

                        {/* Category selection */}
                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">القسم / التصنيف:</label>
                          <select
                            value={editingProduct.categorySlug || 'home-appliances'}
                            onChange={(e) => {
                              const found = localCategoriesList.find((c) => c.slug === e.target.value);
                              setEditingProduct({
                                ...editingProduct,
                                categorySlug: e.target.value,
                                categoryId: found?.id || 'cat-appliances',
                                categoryName: found?.name || 'أجهزة العناية والمنزل'
                              });
                            }}
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs bg-white"
                          >
                            {localCategoriesList.map((cat) => (
                              <option key={cat.id} value={cat.slug}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stock & Visibility */}
                        <div className="flex items-center gap-4 pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingProduct.inStock}
                              onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                              className="w-4 h-4 text-rose-600 rounded"
                            />
                            <span className="font-bold text-[#4a2b3d]">متوفر في المخزون</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingProduct.isVisible !== false}
                              onChange={(e) => setEditingProduct({ ...editingProduct,  isVisible: e.target.checked })}
                              className="w-4 h-4 text-rose-600 rounded"
                            />
                            <span className="font-bold text-[#4a2b3d]">معروض في المتجر</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingProduct.isFeatured)}
                              onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                              className="w-4 h-4 text-rose-600 rounded"
                            />
                            <span className="font-bold text-[#4a2b3d]">مميز (الأكثر طلباً)</span>
                          </label>
                        </div>

                        {/* Images Management with Device Upload (Phone/Desktop) & URL */}
                        <div className="sm:col-span-2 pt-3 border-t border-[#f7dfe8]">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block font-bold text-[#4a2b3d] text-xs sm:text-sm flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-[#d94f86]" />
                              <span>صور المنتج ({editingProduct.images.length} صور)</span>
                              <span className="text-[11px] font-normal text-[#8a6b7a]">(الصورة الأولى هي الرئيسية)</span>
                            </label>
                            {editingProduct.images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct({
                                    ...editingProduct,
                                    images: [editingProduct.images[0]]
                                  });
                                }}
                                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                              >
                                إبقاء الرئيسية فقط
                              </button>
                            )}
                          </div>

                          {/* Upload Box: Phone or Desktop with support for ANY image format */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsCatalogDragOver(true);
                            }}
                            onDragLeave={() => setIsCatalogDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsCatalogDragOver(false);
                              if (e.dataTransfer.files) {
                                handleCatalogFileUpload(e.dataTransfer.files);
                              }
                            }}
                            className={`p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 ${
                              isCatalogDragOver
                                ? 'border-[#d94f86] bg-[#fdeaf1]'
                                : 'border-[#f7dfe8] bg-[#fff8f5] hover:border-[#d94f86]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 text-right w-full sm:w-auto">
                              <div className="w-10 h-10 rounded-xl bg-white border border-[#f7dfe8] flex items-center justify-center text-[#d94f86] shrink-0 shadow-2xs">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-[#4a2b3d] flex items-center gap-2 flex-wrap">
                                  <span>إضافة صور من الهاتف أو الكمبيوتر</span>
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                    <Smartphone className="w-3 h-3" />
                                    <span>هاتف</span>
                                    <span>/</span>
                                    <Monitor className="w-3 h-3" />
                                    <span>سطح المكتب</span>
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8a6b7a] mt-0.5">
                                  تُقبل الصور بأي صيغة (JPG, PNG, WebP, GIF, SVG, HEIC...). يمكنك اختيار عدة صور معاً.
                                </p>
                              </div>
                            </div>

                            <input
                              ref={catalogFileInputRef}
                              type="file"
                              accept="image/*, .png, .jpg, .jpeg, .webp, .gif, .svg, .avif, .heic, .heif, .bmp, .ico"
                              multiple
                              className="hidden"
                              onChange={(e) => handleCatalogFileUpload(e.target.files)}
                            />

                            <button
                              type="button"
                              onClick={() => catalogFileInputRef.current?.click()}
                              disabled={isUploadingCatalogImages}
                              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#b8386d] to-[#d94f86] hover:from-[#a32e5f] hover:to-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                            >
                              {isUploadingCatalogImages ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>جاري الرفع والضغط...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  <span>اختيار صور من الجهاز</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Fallback Direct URL input */}
                          <div className="flex gap-2 mb-3">
                            <input
                              type="url"
                              dir="ltr"
                              placeholder="أو أدخل رابط صورة مباشر من الإنترنت..."
                              id="new-catalog-img-input"
                              className="flex-1 p-2 border border-[#f7dfe8] rounded-xl text-xs bg-white text-left focus:border-[#d94f86] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('new-catalog-img-input') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  setEditingProduct({
                                    ...editingProduct,
                                    images: [...editingProduct.images, input.value.trim()]
                                  });
                                  input.value = '';
                                }
                              }}
                              className="px-3.5 py-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border border-[#f7dfe8]"
                            >
                              إضافة الرابط
                            </button>
                          </div>

                          {/* Image Gallery Thumbnails */}
                          {editingProduct.images.length === 0 ? (
                            <div className="p-4 text-center bg-white rounded-xl border border-dashed border-[#f7dfe8] text-xs text-[#8a6b7a]">
                              لا توجد صور لهذا المنتج بعد. اضغط على الزر الوردي أعلاه لاختيار صور من هاتفك أو سطح المكتب.
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                              {editingProduct.images.map((img, i) => (
                                <div
                                  key={i}
                                  className={`relative rounded-xl border-2 overflow-hidden group bg-white shadow-xs aspect-square flex items-center justify-center ${
                                    i === 0 ? 'border-[#d94f86] ring-2 ring-[#fdeaf1]' : 'border-[#f7dfe8]'
                                  }`}
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover" />

                                  {/* Badge for primary image */}
                                  {i === 0 ? (
                                    <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#d94f86] text-white text-[9px] font-bold rounded-md shadow-xs flex items-center gap-0.5">
                                      <Star className="w-2.5 h-2.5 fill-white" />
                                      <span>الرئيسية</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const selected = editingProduct.images[i];
                                        const rest = editingProduct.images.filter((_, idx) => idx !== i);
                                        setEditingProduct({
                                          ...editingProduct,
                                          images: [selected, ...rest]
                                        });
                                      }}
                                      title="تعيين هذه الصورة كرئيسية"
                                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/75 hover:bg-[#d94f86] text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                    >
                                      تعيين رئيسية
                                    </button>
                                  )}

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProduct({
                                        ...editingProduct,
                                        images: editingProduct.images.filter((_, idx) => idx !== i)
                                      });
                                    }}
                                    title="حذف الصورة"
                                    className="absolute bottom-1 left-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-3 border-t border-[#f7dfe8]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setIsCreatingProduct(false);
                          }}
                          className="px-4 py-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>

                        <button
                          type="button"
                          disabled={isSavingCatalogProduct || !editingProduct.title}
                          onClick={async () => {
                            setIsSavingCatalogProduct(true);
                            try {
                              await saveCatalogProduct(editingProduct);
                              setLocalProductsList((prev) => {
                                const index = prev.findIndex((p) => p.id === editingProduct.id);
                                if (index > -1) {
                                  const copy = [...prev];
                                  copy[index] = editingProduct;
                                  return copy;
                                }
                                return [editingProduct, ...prev];
                              });
                              showNotice('تم حفظ المنتج في Firestore بنجاح!');
                              setEditingProduct(null);
                              setIsCreatingProduct(false);
                            } catch (err: unknown) {
                              const errStr = err instanceof Error ? err.message : String(err);
                              showNotice(`❌ فشل الحفظ: ${errStr.slice(0, 90)}`);
                            } finally {
                              setIsSavingCatalogProduct(false);
                            }
                          }}
                          className="px-5 py-2 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingCatalogProduct ? 'جاري الحفظ...' : 'حفظ المنتج في Firestore'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Products Grid / Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localProductsList.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl p-4 border border-[#f7dfe8] shadow-2xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={prod.images[0] || ''}
                            alt={prod.title}
                            className="w-16 h-16 rounded-xl object-cover bg-[#fff8f5] border border-[#f7dfe8] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-[#d94f86] font-bold block">
                              {prod.categoryName || 'عام'}
                            </span>
                            <h4 className="font-bold text-xs text-[#4a2b3d] line-clamp-2 leading-tight">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-black text-[#d94f86] text-xs">
                                {prod.price.toLocaleString()} {prod.currency || 'د.ج'}
                              </span>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-[#8a6b7a] line-through">
                                  {prod.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#f7dfe8] text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                prod.isVisible !== false ? 'bg-emerald-500' : 'bg-[#edd6e0]'
                              }`}
                            />
                            <span className="text-[11px] text-[#8a6b7a]">
                              {prod.isVisible !== false ? 'معروض' : 'مخفي'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsCreatingProduct(false);
                              }}
                              className="px-2.5 py-1 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'حذف المنتج نهائياً',
                                  message: `هل تريد حذف هذا المنتج (${prod.title}) نهائياً من المتجر وقاعدة البيانات؟`,
                                  confirmText: 'نعم احذف',
                                  onConfirm: async () => {
                                    try {
                                      await deleteCatalogProduct(prod.id);
                                      setLocalProductsList((prev) => prev.filter((p) => p.id !== prod.id));
                                      showNotice('تم حذف المنتج بنجاح.');
                                    } catch (err: unknown) {
                                      const errStr = err instanceof Error ? err.message : String(err);
                                      showNotice(`❌ فشل الحذف: ${errStr.slice(0, 90)}`);
                                    }
                                  }
                                });
                              }}
                              className="p-1.5 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#c93d78] rounded-lg text-xs transition-colors cursor-pointer border border-[#f7dfe8]"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: CATEGORIES MANAGER */}
              {activeTab === 'categories' && (
                <div className="flex flex-col gap-6">
                  {/* Top Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-[#f7dfe8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h3 className="font-black text-[#4a2b3d] text-sm flex items-center gap-2">
                        <ListPlus className="w-4 h-4 text-[#d94f86]" />
                        <span>إدارة أقسام وتصنيفات المتجر</span>
                      </h3>
                      <p className="text-xs text-[#8a6b7a] mt-0.5">
                        إضافة أقسام جديدة لتوزيع المنتجات في الصفحة الرئيسية وقائمة التصفح
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory({
                          id: `cat-${Date.now()}`,
                          name: '',
                          slug: '',
                          description: '',
                          order: localCategoriesList.length + 1
                        });
                        setIsCreatingCategory(true);
                      }}
                      className="px-4 py-2 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة قسم جديد</span>
                    </button>
                  </div>

                  {/* Category Edit Form */}
                  {editingCategory && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#f7dfe8] shadow-md flex flex-col gap-4">
                      <h4 className="font-bold text-sm text-[#4a2b3d]">
                        {isCreatingCategory ? 'إضافة قسم جديد' : `تعديل القسم: ${editingCategory.name}`}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">اسم القسم باللغة العربية:</label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            placeholder="مثال: أجهزة تصفيف الشعر"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">معرّف الرابط (Slug بالإنجليزية):</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={editingCategory.slug}
                            onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="مثال: hair-stylers"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#4a2b3d] mb-1">الوصف المختصر:</label>
                          <input
                            type="text"
                            value={editingCategory.description || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                            placeholder="وصف القسم"
                            className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#f7dfe8]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(null);
                            setIsCreatingCategory(false);
                          }}
                          className="px-4 py-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>

                        <button
                          type="button"
                          disabled={isSavingCategory || !editingCategory.name || !editingCategory.slug}
                          onClick={async () => {
                            setIsSavingCategory(true);
                            try {
                              await saveCategory(editingCategory);
                              setLocalCategoriesList((prev) => {
                                const idx = prev.findIndex((c) => c.id === editingCategory.id);
                                if (idx > -1) {
                                  const copy = [...prev];
                                  copy[idx] = editingCategory;
                                  return copy;
                                }
                                return [...prev, editingCategory];
                              });
                              showNotice('تم حفظ القسم في Firestore بنجاح!');
                              setEditingCategory(null);
                              setIsCreatingCategory(false);
                            } catch (err: unknown) {
                              const errStr = err instanceof Error ? err.message : String(err);
                              showNotice(`❌ فشل حفظ القسم: ${errStr.slice(0, 90)}`);
                            } finally {
                              setIsSavingCategory(false);
                            }
                          }}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                        >
                          {isSavingCategory ? 'جاري الحفظ...' : 'حفظ القسم في Firestore'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {localCategoriesList.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white p-4 rounded-2xl border border-[#f7dfe8] shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-[#4a2b3d]">{cat.name}</h4>
                          <span className="font-mono text-[11px] text-[#8a6b7a] block" dir="ltr">
                            /category/{cat.slug}
                          </span>
                          {cat.description && (
                            <p className="text-[11px] text-[#8a6b7a] mt-1 line-clamp-1">{cat.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCreatingCategory(false);
                            }}
                            className="p-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] rounded-xl transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'حذف القسم نهائياً',
                                message: `هل تريد حذف هذا القسم (${cat.name}) نهائياً من المتجر وقاعدة البيانات؟`,
                                confirmText: 'نعم احذف',
                                onConfirm: async () => {
                                  try {
                                    await deleteCategory(cat.id);
                                    setLocalCategoriesList((prev) => prev.filter((c) => c.id !== cat.id));
                                    showNotice('تم حذف القسم بنجاح.');
                                  } catch (err: unknown) {
                                    const errStr = err instanceof Error ? err.message : String(err);
                                    showNotice(`❌ فشل الحذف: ${errStr.slice(0, 90)}`);
                                  }
                                }
                              });
                            }}
                            className="p-2 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#c93d78] rounded-xl transition-colors cursor-pointer border border-[#f7dfe8]"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: BANNER SETTINGS */}
              {activeTab === 'banner' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#f7dfe8] pb-3">
                      <div>
                        <h3 className="font-black text-[#4a2b3d] text-sm flex items-center gap-2">
                          <LayoutTemplate className="w-4 h-4 text-[#d94f86]" />
                          <span>تعديل البانر الرئيسي الكبير في الصفحة الرئيسية</span>
                        </h3>
                        <p className="text-xs text-[#8a6b7a] mt-0.5">
                          تعديل العنوان الترويجي، النصوص، الصورة، وزر الدعوة للشراء
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isSavingBanner}
                        onClick={async () => {
                          setIsSavingBanner(true);
                          try {
                            await saveBannerToFirestore(localBanner);
                            showNotice('تم حفظ إعدادات البانر في Firestore بنجاح!');
                          } catch (err: unknown) {
                            const errStr = err instanceof Error ? err.message : String(err);
                            showNotice(`❌ فشل الحفظ: ${errStr.slice(0, 90)}`);
                          } finally {
                            setIsSavingBanner(false);
                          }
                        }}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingBanner ? 'جاري الحفظ...' : 'حفظ البانر في Firestore'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#4a2b3d] mb-1">العنوان الرئيسي للبانر:</label>
                        <input
                          type="text"
                          value={localBanner.title}
                          onChange={(e) => setLocalBanner({ ...localBanner, title: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#f7dfe8] font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#4a2b3d] mb-1">النص التوضيحي للبانر:</label>
                        <textarea
                          rows={2}
                          value={localBanner.subtitle}
                          onChange={(e) => setLocalBanner({ ...localBanner, subtitle: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#f7dfe8]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#4a2b3d] mb-1">شارة البانر العلوية (Badge):</label>
                        <input
                          type="text"
                          value={localBanner.badgeText}
                          onChange={(e) => setLocalBanner({ ...localBanner, badgeText: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#f7dfe8]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#4a2b3d] mb-1">نص زر الشراء (CTA):</label>
                        <input
                          type="text"
                          value={localBanner.ctaText}
                          onChange={(e) => setLocalBanner({ ...localBanner, ctaText: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-[#f7dfe8] font-bold"
                        />
                      </div>

                      {/* Dedicated Section: صورة البانر الدائرية */}
                      <div className="sm:col-span-2 mt-2 pt-4 border-t border-[#f7dfe8]">
                        <div className="bg-[#fff8f5] border border-[#f7dfe8] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f7dfe8] pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#fdeaf1] text-[#d94f86] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-[#4a2b3d]">صورة البانر الدائرية</h4>
                                <p className="text-[11px] text-[#8a6b7a]">
                                  تحكم في الصورة الدائرية، رفعها من جهازك مع ضغط فوري، أو حذفها لتوسيع النص
                                </p>
                              </div>
                            </div>

                            {/* Option: إظهار الصورة في البانر */}
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#f7dfe8] hover:border-[#edd6e0] transition-colors w-fit">
                              <input
                                type="checkbox"
                                checked={localBanner.showHeroImage !== false && Boolean(localBanner.heroImageUrl || localBanner.imageUrl)}
                                onChange={(e) => setLocalBanner({ ...localBanner, showHeroImage: e.target.checked })}
                                className="w-4 h-4 text-[#d94f86] rounded"
                              />
                              <span className="text-xs font-bold text-[#4a2b3d]">إظهار الصورة في البانر</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                            {/* 1) معاينة مباشرة للصورة الحالية */}
                            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#f7dfe8] text-center shadow-2xs">
                              <span className="text-xs font-bold text-[#4a2b3d] mb-2">معاينة الصورة الحالية:</span>
                              {(localBanner.heroImageUrl || localBanner.imageUrl) ? (
                                <div className="relative group my-2">
                                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#d94f86]/30 shadow-md bg-[#fff8f5]">
                                    <img
                                      src={localBanner.heroImageUrl || localBanner.imageUrl}
                                      alt="معاينة صورة البانر"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {localBanner.showImageBadge !== false && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#d94f86] text-white font-black text-[10px] shadow-sm tracking-wider whitespace-nowrap">
                                      {localBanner.heroImageBadge || 'PROMO'}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#f7dfe8] flex flex-col items-center justify-center text-[#8a6b7a] p-2 my-2">
                                  <ImageIcon className="w-8 h-8 mb-1 text-[#8a6b7a]" />
                                  <span className="text-[10px] font-bold">لا توجد صورة</span>
                                  <span className="text-[9px] text-[#8a6b7a] mt-0.5">(النص يتوسع تلقائياً)</span>
                                </div>
                              )}

                              {/* زر "حذف الصورة" */}
                              {(localBanner.heroImageUrl || localBanner.imageUrl) && (
                                <button
                                  type="button"
                                  onClick={handleDeleteBannerImage}
                                  className="mt-3 px-3 py-1.5 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#c93d78] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#f7dfe8]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف الصورة</span>
                                </button>
                              )}
                            </div>

                            {/* 2) أدوات التحكم والرفع والروابط */}
                            <div className="md:col-span-8 flex flex-col gap-3.5">
                              {/* زر "رفع صورة من هاتفك أو حاسوبك" مع ضغط تلقائي */}
                              <div>
                                <label className="block font-bold text-[#4a2b3d] text-xs mb-1.5">
                                  رفع صورة من جهازك (يتم ضغطها تلقائياً لأقصى عرض 800px لتسريع التحميل):
                                </label>
                                <input
                                  ref={bannerFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleBannerFileUpload}
                                />
                                <button
                                  type="button"
                                  disabled={isUploadingBannerImg}
                                  onClick={() => bannerFileInputRef.current?.click()}
                                  className="w-full py-2.5 px-4 bg-white hover:bg-[#fff8f5] border border-[#f7dfe8] rounded-xl text-xs font-bold text-[#4a2b3d] flex items-center justify-center gap-2 shadow-2xs hover:border-[#d94f86] transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <Upload className="w-4 h-4 text-[#d94f86]" />
                                  <span>
                                    {isUploadingBannerImg
                                      ? 'جاري ضغط ورفع الصورة...'
                                      : 'رفع صورة من هاتفك أو حاسوبك'}
                                  </span>
                                </button>
                              </div>

                              {/* حقل "أو ضع رابط صورة مباشر" مع زر تطبيق */}
                              <div>
                                <label className="block font-bold text-[#4a2b3d] text-xs mb-1">
                                  أو ضع رابط صورة مباشر:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    dir="ltr"
                                    placeholder="https://example.com/image.webp"
                                    value={bannerDirectUrlInput}
                                    onChange={(e) => setBannerDirectUrlInput(e.target.value)}
                                    className="flex-1 p-2.5 rounded-xl border border-[#f7dfe8] text-xs text-left bg-white text-[#4a2b3d] focus:outline-none focus:border-[#d94f86]"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleApplyDirectBannerUrl}
                                    className="px-4 py-2.5 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                                  >
                                    تطبيق
                                  </button>
                                </div>
                              </div>

                              {/* حقل نص "شارة الصورة" وخيار إظهار/إخفاء الشارة */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f7dfe8]">
                                <div>
                                  <label className="block font-bold text-[#4a2b3d] text-xs mb-1">
                                    شارة الصورة (افتراضياً PROMO):
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="PROMO"
                                    value={localBanner.heroImageBadge || ''}
                                    onChange={(e) =>
                                      setLocalBanner({ ...localBanner, heroImageBadge: e.target.value })
                                    }
                                    className="w-full p-2.5 rounded-xl border border-[#f7dfe8] text-xs font-bold"
                                  />
                                </div>

                                <div className="flex items-end pb-2">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#4a2b3d]">
                                    <input
                                      type="checkbox"
                                      checked={localBanner.showImageBadge !== false}
                                      onChange={(e) =>
                                        setLocalBanner({ ...localBanner, showImageBadge: e.target.checked })
                                      }
                                      className="w-4 h-4 text-rose-600 rounded"
                                    />
                                    <span>إظهار الشارة أسفل الدائرة</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="banner-enabled-check"
                          checked={localBanner.enabled}
                          onChange={(e) => setLocalBanner({ ...localBanner, enabled: e.target.checked })}
                          className="w-4 h-4 text-rose-600 rounded"
                        />
                        <label htmlFor="banner-enabled-check" className="font-bold text-[#4a2b3d] cursor-pointer">
                          إظهار البانر في واجهة المتجر
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PRODUCT & CONTENT MANAGER (DYNAMIC PRODUCT EDITOR) */}
              {activeTab === 'product' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Save Button Top Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-[#f7dfe8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-[#4a2b3d] text-sm">
                          لوحة التحكم لتعديل محتوى ومواصفات المنتج
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>حفظ في Firestore</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#8a6b7a] mt-0.5">
                        كافة تعديلاتك، صورك، ونصوصك تُحفظ في Firestore وتنعكس مباشرة على كافة زوار المتجر.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveProduct()}
                      disabled={isSavingProduct}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProduct ? 'جاري الحفظ في Firestore...' : 'حفظ وتثبيت التعديلات'}</span>
                    </button>
                  </div>

                  {/* A) الأساسيات: العنوان، الوصف التوضيحي، والسعر */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
                    <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>أ) البيانات الأساسية للمنتج:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          عنوان المنتج الرئيسي (Title)
                        </label>
                        <input
                          type="text"
                          value={localProduct.title}
                          onChange={(e) => handleProductFieldChange('title', e.target.value)}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          سعر المنتج بالدينار الجزائري (د.ج)
                        </label>
                        <input
                          type="number"
                          value={localProduct.price}
                          onChange={(e) => handleProductFieldChange('price', Number(e.target.value))}
                          className="w-full text-xs font-black text-rose-600 p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          الوصف التوضيحي تحت العنوان (Tagline)
                        </label>
                        <input
                          type="text"
                          value={localProduct.tagline}
                          onChange={(e) => handleProductFieldChange('tagline', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* B) نقاط "أهم المميزات" (تعديل، إضافة، أو حذف) */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
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
                        className="w-full text-xs font-black p-3 rounded-xl border-2 border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d] shadow-inner"
                      />
                      <span className="text-[11px] text-[#8a6b7a] mt-1.5 block font-medium">
                        ✨ يمكنك كتابة أي عنوان يناسب منتجك الجديد (مثال: أهم مميزات مصفف Roza Beauty 5 في 1: أو أهم مميزات ماكينة الحلاقة... إلخ). التعديل يحفظ فورياً!
                      </span>
                    </div>

                    {/* Existing Features List */}
                    <div className="flex flex-col gap-2.5">
                      {localProduct.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#fdeaf1] text-[#c93d78] font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => handleUpdateKeyPoint(idx, e.target.value)}
                            className="flex-1 text-xs p-2.5 rounded-xl border border-[#f7dfe8] bg-white text-[#4a2b3d] focus:outline-none focus:border-[#d94f86]"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteKeyPoint(idx)}
                            className="p-2 text-[#8a6b7a] hover:text-[#c93d78] hover:bg-[#fdeaf1] rounded-xl transition-colors cursor-pointer"
                            title="حذف هذه الميزة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Feature */}
                    <div className="pt-2 border-t border-[#f7dfe8] flex items-center gap-2">
                      <input
                        type="text"
                        value={newKeyPointText}
                        onChange={(e) => setNewKeyPointText(e.target.value)}
                        placeholder="اكتب ميزة جديدة لإضافتها..."
                        className="flex-1 text-xs p-2.5 rounded-xl border border-[#f7dfe8] bg-white text-[#4a2b3d] focus:outline-none focus:border-[#d94f86]"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyPoint}
                        className="px-4 py-2.5 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة ميزة</span>
                      </button>
                    </div>
                  </div>

                  {/* C) جدول المواصفات التقنية الرسمية */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
                    <h4 className="text-xs font-black text-[#4a2b3d] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#c9a45c]" />
                      <span>ج) جدول "المواصفات التقنية الرسمية":</span>
                    </h4>

                    {/* خانة تعديل عنوان جدول المواصفات */}
                    <div className="bg-[#fff8f5] p-3 rounded-xl border border-[#f7dfe8]">
                      <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                        عنوان جدول المواصفات (العنوان المعروض أعلى الجدول):
                      </label>
                      <input
                        type="text"
                        value={localProduct.specsTitle || ''}
                        onChange={(e) => handleProductFieldChange('specsTitle', e.target.value)}
                        placeholder="المواصفات التقنية الرسمية:"
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d]"
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
                            className="sm:col-span-2 text-xs font-bold p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d]"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                            placeholder="القيمة (مثال: 1200 واط)"
                            className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d]"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteSpec(idx)}
                              className="p-2 text-[#8a6b7a] hover:text-[#c93d78] hover:bg-[#fdeaf1] rounded-xl transition-colors cursor-pointer"
                              title="حذف هذا السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Spec Row */}
                    <div className="pt-2 border-t border-[#f7dfe8] grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                      <input
                        type="text"
                        value={newSpecLabel}
                        onChange={(e) => setNewSpecLabel(e.target.value)}
                        placeholder="اسم الخاصية الجديدة..."
                        className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d]"
                      />
                      <input
                        type="text"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        placeholder="القيمة..."
                        className="sm:col-span-2 text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-[#d94f86] bg-white text-[#4a2b3d]"
                      />
                      <button
                        type="button"
                        onClick={handleAddSpec}
                        className="px-4 py-2.5 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة سطر</span>
                      </button>
                    </div>
                  </div>

                  {/* D) نص الضمان الذهبي والمعاينة عند الاستلام وتقييم النجوم */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
                    <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>د) نص الضمان الذهبي وتقييمات المتجر:</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                        نص رسالة الضمان والمعاينة قبل الدفع
                      </label>
                      <textarea
                        rows={2}
                        value={localProduct.guaranteeText || ''}
                        onChange={(e) => handleProductFieldChange('guaranteeText', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        placeholder="لك كامل الحق في فتح الطرد ومعاينة الجهاز عند الاستلام..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          عدد التقييمات المعروض للزبائن (Reviews Count)
                        </label>
                        <input
                          type="number"
                          value={localProduct.reviewsCount}
                          onChange={(e) => handleProductFieldChange('reviewsCount', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          تقييم النجوم الرسمي (من 5)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={localProduct.rating}
                          onChange={(e) => handleProductFieldChange('rating', Number(e.target.value))}
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E) معرض الصور: رفع محلي + روابط مباشرة + خيار إفراغ الصور القديمة */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8] flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>هـ) إدارة صور ألبوم المنتج ({localProduct.images.length}):</span>
                      </h4>

                      {localProduct.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearOtherImages()}
                          className="text-xs text-[#c93d78] hover:text-[#b8386d] bg-[#fdeaf1] hover:bg-[#f7dfe8] px-3 py-1.5 rounded-xl font-bold border border-[#f7dfe8] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
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
                        disabled={isUploadingImage}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploadingImage ? 'جاري الرفع إلى Storage...' : 'رفع صورة من هاتفك أو حاسوبك'}</span>
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
                          className="flex-1 text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3.5 py-2.5 bg-[#d94f86] hover:bg-[#c93d78] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة الرابط</span>
                        </button>
                      </div>
                    </div>

                    {localProduct.images.length === 0 ? (
                      <div className="p-8 text-center bg-[#fff8f5] rounded-2xl border border-dashed border-[#f7dfe8]">
                        <ImageIcon className="w-8 h-8 text-[#8a6b7a] mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#4a2b3d]">الألبوم فارغ حالياً</p>
                        <p className="text-[11px] text-[#8a6b7a] mt-1">ارفعي صور منتجك بالزر الوردي أعلاه لتعرض لزبائنك</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {localProduct.images.map((img, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-[#f7dfe8] aspect-square bg-[#fff8f5] group shadow-xs">
                            <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-[#4a2b3d]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-between items-center">
                                <span className="bg-[#4a2b3d]/85 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {idx === 0 ? 'رئيسية' : `#${idx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="p-1.5 rounded-full bg-[#c93d78] text-white hover:bg-[#b8386d] shadow transition-colors cursor-pointer"
                                  title="حذف هذه الصورة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="w-full py-1 bg-white/95 hover:bg-white text-[#4a2b3d] rounded-lg text-[10px] font-bold shadow cursor-pointer transition-colors"
                                >
                                  تعيين كرئيسية ⭐
                                </button>
                              )}
                            </div>

                            {/* Always visible badge */}
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#4a2b3d]/80 text-white text-[10px] font-bold">
                              {idx === 0 ? '⭐ الرئيسية' : `#${idx + 1}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="sm:hidden absolute top-1.5 right-1.5 p-1.5 rounded-full bg-[#c93d78] text-white shadow"
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
                      disabled={isSavingProduct}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#e8709b] to-[#c93d78] hover:from-[#d94f86] hover:to-[#b8386d] text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProduct ? 'جاري الحفظ في Firestore...' : 'حفظ كافة التعديلات في Firestore'}</span>
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 3: CUSTOMER REVIEWS MANAGER */}
              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Add New Review Form */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8]">
                    <h3 className="font-black text-[#4a2b3d] text-sm mb-1 flex items-center gap-1.5 text-[#d94f86]">
                      <Plus className="w-4 h-4" />
                      <span>إضافة رأي وتقييم جديد بالدارجة الجزائرية:</span>
                    </h3>
                    <p className="text-xs text-[#8a6b7a] mb-4">
                      أضيفي تعليق زبونة جديدة ليعرض مباشرة في قسم تقييمات المتجر
                    </p>

                    <form onSubmit={handleAddReview} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          اسم الزبونة <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="مثال: نسيمة بلقاسم"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          الولاية (مثال: وهران، قسنطينة) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newReviewWilaya}
                          onChange={(e) => setNewReviewWilaya(e.target.value)}
                          placeholder="مثال: عنابة"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          عدد النجوم (التقييم)
                        </label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500 bg-white"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 نجوم - ممتاز)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 نجوم - جيد جداً)</option>
                          <option value={3}>⭐⭐⭐ (3 نجوم)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          نص التعليق بالدارجة الجزائرية <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="اكتب الرأي بالدارجة... (مثال: هايل بزاف وصلني في 24 ساعة وسرحلي شعري روعة)"
                          required
                          className="w-full text-xs p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingReview}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isSavingReview ? 'جاري الحفظ في Firestore...' : 'إضافة الرأي للمتجر'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Reviews List */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#4a2b3d] px-1">
                      <span>الآراء الحالية المعروضة على المتجر ({localReviews.length}):</span>
                    </div>

                    {localReviews.length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl text-center text-xs text-[#8a6b7a] border border-[#f7dfe8]">
                        لا توجد آراء محفوظة حالياً. يمكنك إضافة آراء جديدة من النموذج أعلاه.
                      </div>
                    ) : (
                      localReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white p-4 rounded-2xl border border-[#f7dfe8] shadow-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#4a2b3d]">{rev.author}</span>
                              <span className="text-[11px] text-[#8a6b7a]">· {rev.wilaya}</span>
                              <div className="flex items-center text-[#c9a45c]">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-[#c9a45c]" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#4a2b3d] leading-relaxed font-medium">
                              "{rev.comment}"
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-2 text-[#8a6b7a] hover:text-[#c93d78] hover:bg-[#fdeaf1] rounded-xl transition-colors cursor-pointer"
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
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8]">
                    <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-sm">
                      <Activity className="w-4 h-4" />
                      <span>إعدادات وتتبع Pixels الإعلانية (Meta Pixel & TikTok Pixel)</span>
                    </div>
                    <p className="text-xs text-[#8a6b7a] mb-4">
                      المحرك ينقل تلقائياً أحداث الزيارة والشراء (PageView, ViewContent, InitiateCheckout, Purchase/Lead)
                      لخوارزميات الإعلانات لتخفيض تكلفة الاكتساب.
                    </p>

                    <form onSubmit={handleSavePixelConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          معرّف Meta Pixel ID (فيسبوك / إنستغرام)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.metaPixelId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, metaPixelId: e.target.value.trim() })}
                          placeholder="مثال: 948271630192837"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          معرّف TikTok Pixel ID
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.tikTokPixelId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, tikTokPixelId: e.target.value.trim() })}
                          placeholder="مثال: C6ABCD1234EFGH5678"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4a2b3d] mb-1">
                          معرّف Google Tag / GA4 ID
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={pixelConfig.googleTagId}
                          onChange={(e) => setPixelConfig({ ...pixelConfig, googleTagId: e.target.value.trim() })}
                          placeholder="مثال: G-XXXXXXX"
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#f7dfe8] focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between pt-2 border-t border-[#f7dfe8]">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pixel-enabled-beauty"
                            checked={pixelConfig.enabled}
                            onChange={(e) => setPixelConfig({ ...pixelConfig, enabled: e.target.checked })}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                          />
                          <label htmlFor="pixel-enabled-beauty" className="text-xs font-semibold text-[#4a2b3d]">
                            تفعيل محرك التتبع الإعلاني التلقائي
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingPixel}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingPixel ? 'جاري الحفظ في Firestore...' : 'حفظ المعرّفات في Firestore'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pixel Live Test Sandbox */}
                  <div className="bg-white p-5 rounded-2xl border border-[#f7dfe8]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-[#4a2b3d]">اختبار إرسال الأحداث للتأكد من التتبع:</div>
                      <button
                        type="button"
                        onClick={clearPixelLogs}
                        className="text-[11px] text-[#8a6b7a] hover:text-[#4a2b3d] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>مسح السجل</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('PageView')}
                        className="px-3 py-1.5 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#d94f86] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[#f7dfe8]"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث PageView</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('InitiateCheckout')}
                        className="px-3 py-1.5 bg-[#f4ecf8] hover:bg-[#edd6e0] text-[#c93d78] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[#f7dfe8]"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث InitiateCheckout</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestPixelEvent('Purchase')}
                        className="px-3 py-1.5 bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#b8386d] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[#f7dfe8]"
                      >
                        <Send className="w-3 h-3" />
                        <span>حدث Purchase / Lead</span>
                      </button>
                    </div>

                    {/* Event Logs: Rich deep plum gradient without dark stone or black */}
                    <div className="bg-gradient-to-br from-[#4a2b3d] to-[#60354f] text-pink-100 rounded-xl p-3.5 font-mono text-xs max-h-48 overflow-y-auto border border-[#b8386d]/40 shadow-inner" dir="ltr">
                      <div className="text-pink-300 text-[11px] mb-1.5 font-sans font-bold">سجل الأحداث الأخيرة (Event Logs):</div>
                      {pixelLogs.length === 0 ? (
                        <div className="text-pink-300/70 text-[11px] italic">لم تسجل أي أحداث بعد...</div>
                      ) : (
                        pixelLogs.map((log) => (
                          <div key={log.id} className="py-1 border-b border-pink-900/40 text-[11px] flex items-start gap-2">
                            <span className="text-pink-300">[{log.timestamp}]</span>
                            <span className="font-bold text-[#f9d784]">[{log.eventName}]</span>
                            <span className="text-pink-100 truncate">{JSON.stringify(log.data)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics & AI Insights Tab Content */}
              {activeTab === 'analytics' && (
                <AiInsightsTab
                  orders={localOrders}
                  products={localProductsList}
                  events={eventsList}
                  adSpends={adSpendList}
                  isGoogleAdmin={isGoogleAdmin}
                  onNotice={showNotice}
                />
              )}

            </div>
          </>
        )}

      </div>

      {/* Styled In-App Deletion Confirmation Modal (Zero window.confirm, 100% theme consistent) */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#4a2b3d]/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#f7dfe8] shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#fdeaf1] text-[#c93d78] flex items-center justify-center mb-3.5 border border-[#f7dfe8]">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#4a2b3d]">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-[#8a6b7a] mt-1.5 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#d94f86] hover:bg-[#c93d78] text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                {confirmDialog.confirmText || 'نعم احذف'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#fdeaf1] hover:bg-[#f7dfe8] text-[#4a2b3d] text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

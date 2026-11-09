import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Wifi,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  Share2,
  Info,
  ArrowRight,
  Send,
  AlertCircle,
  Store,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Restaurant,
  Category,
  MenuItem,
  CartItem,
  OrderType,
  ItemSize,
  Review,
} from '../types';
import { store } from '../services/store';
import { firestoreMenuService } from '../services/firestoreMenuService';
import { firestoreOperationsService } from '../services/firestoreOperationsService';

interface PublicMenuViewProps {
  restaurantId: string;
  tableParam?: string;
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  onSelectRestaurantId: (id: string) => void;
  restaurants: Restaurant[];
}

export const PublicMenuView: React.FC<PublicMenuViewProps> = ({
  restaurantId,
  tableParam,
  onNavigate,
  onSelectRestaurantId,
  restaurants,
}) => {
  const restaurant = store.getRestaurantById(restaurantId) || restaurants[0];

  // Increment view counter once on mount
  useEffect(() => {
    if (restaurant) {
      store.incrementRestaurantViews(restaurant.id);
    }
  }, [restaurant?.id]);

  // Tenant scoped data
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  // Item customization modal state
  const [selectedSize, setSelectedSize] = useState<ItemSize | undefined>(undefined);
  const [selectedOptions, setSelectedOptions] = useState<{ groupName: string; optionName: string; additionalPrice: number }[]>([]);
  const [itemNote, setItemNote] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [tableNumber, setTableNumber] = useState<string>(tableParam || 'الطاولة رقم 1');

  // New Review state
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Success order notification
  const [lastPlacedOrderNumber, setLastPlacedOrderNumber] = useState<string | null>(null);

  const refreshData = () => {
    if (!restaurant) return;
    setCategories(store.getCategoriesByRestaurant(restaurant.id));
    setItems(store.getItemsByRestaurant(restaurant.id));
    setReviews(store.getReviewsByRestaurant(restaurant.id, true)); // approved reviews only
  };

  useEffect(() => {
    refreshData();

    // Local reactive store subscription
    const unsubStore = store.subscribe(() => {
      refreshData();
    });

    // Cloud Firestore real-time categories and items subscription (Phase 3B-3)
    let unsubMenu: (() => void) | undefined;
    if (restaurant?.id) {
      unsubMenu = firestoreMenuService.subscribeRestaurantMenu(
        restaurant.id,
        ({ categories: remoteCats, items: remoteItems }) => {
          // Public menu only shows active categories
          setCategories(remoteCats.filter((c) => c.isActive !== false));
          setItems(remoteItems);
        }
      );
    }

    // Cloud Firestore real-time approved reviews subscription (Phase 3B-4)
    let unsubReviews: (() => void) | undefined;
    if (restaurant?.id) {
      unsubReviews = firestoreOperationsService.subscribeReviews(
        restaurant.id,
        true, // approved only for visitors
        (remoteReviews) => {
          setReviews(remoteReviews);
        }
      );
    }

    return () => {
      unsubStore();
      if (unsubMenu) unsubMenu();
      if (unsubReviews) unsubReviews();
    };
  }, [restaurant?.id]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">المطعم غير موجود</h2>
        <button
          onClick={() => onNavigate('landing')}
          className="bg-amber-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-sm"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Check if public menu is disabled by Super Admin
  if (restaurant.access && restaurant.access.allowPublicMenu === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">المنيو غير متاح حالياً</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          نعتذر، قائمة الطعام لمطعم {restaurant.nameAr} متوقفة مؤقتاً لأعمال الصيانة والتحديث.
          يرجى التحقق لاحقاً أو التواصل مع المطعم مباشرة.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    );
  }

  const appearance = restaurant.appearance || {
    primaryColor: '#f59e0b',
    secondaryColor: '#0f172a',
    fontFamily: 'Cairo',
    cardLayout: 'cards',
    showCalories: true,
    showBadges: true,
    showAllergens: true,
    buttonShape: 'rounded',
    backgroundColor: '#020617',
    headerStyle: 'banner',
  };

  // Open Item Detail
  const handleOpenItemDetails = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined);
    setSelectedOptions([]);
    setItemNote('');
    setItemQuantity(1);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedItemForModal) return;

    let unitPrice = selectedSize ? selectedSize.price : (selectedItemForModal.discountPrice || selectedItemForModal.price);
    selectedOptions.forEach((opt) => {
      unitPrice += opt.additionalPrice;
    });

    const newCartItem: CartItem = {
      cartItemId: `ci-${Date.now()}-${Math.random()}`,
      menuItemId: selectedItemForModal.id,
      nameAr: selectedItemForModal.nameAr,
      nameEn: selectedItemForModal.nameEn,
      unitPrice,
      quantity: itemQuantity,
      selectedSize,
      selectedOptions: [...selectedOptions],
      notes: itemNote,
      imageUrl: selectedItemForModal.imageUrl,
    };

    setCart([...cart, newCartItem]);
    setSelectedItemForModal(null);
  };

  // Direct quick add
  const handleQuickAdd = (item: MenuItem) => {
    if ((item.sizes && item.sizes.length > 0) || (item.options && item.options.length > 0)) {
      handleOpenItemDetails(item);
      return;
    }

    const unitPrice = item.discountPrice || item.price;
    const newCartItem: CartItem = {
      cartItemId: `ci-${Date.now()}-${Math.random()}`,
      menuItemId: item.id,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      unitPrice,
      quantity: 1,
      imageUrl: item.imageUrl,
    };

    setCart([...cart, newCartItem]);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = (subtotal * (restaurant.settings.taxPercentage || 0)) / 100;
  const delivery = orderType === 'delivery' ? (restaurant.settings.deliveryFee || 0) : 0;
  const total = subtotal + tax + delivery;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Order via Cloud Firestore & WhatsApp
  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('يرجى إدخال اسمك ورقم هاتفك لتأكيد الطلب');
      return;
    }
    if (orderType === 'delivery' && !customerAddress.trim()) {
      alert('يرجى كتابة عنوان التوصيل');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // 1. Record order in Cloud Firestore & get WhatsApp URL
      const { order: created, whatsappLink: waUrl } = await firestoreOperationsService.submitOrder(
        restaurant,
        {
          items: cart,
          orderType,
          tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
          customerName,
          customerPhone,
          address: orderType === 'delivery' ? customerAddress : undefined,
          notes: orderNotes,
        }
      );

      // 2. Clear cart & trigger celebration
      setCart([]);
      setIsCartOpen(false);
      setLastPlacedOrderNumber(created.orderNumber);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 3. Open WhatsApp formatted order link
      if (waUrl) {
        window.open(waUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      alert(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit Review via Cloud Firestore
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await firestoreOperationsService.submitReview(restaurant.id, {
        customerName: reviewerName,
        rating: reviewerRating,
        comment: reviewerComment,
      });

      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSubmitted(false);
        setReviewerName('');
        setReviewerComment('');
      }, 2000);
    } catch (err: any) {
      console.error('Review submission error:', err);
      alert(err.message || 'تعذر إرسال التقييم، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch =
      item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (!restaurant || (restaurant.access && !restaurant.access.allowPublicMenu) || restaurant.status === 'blocked') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">المنيو غير متاح حالياً</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            عذراً، هذا المنيو متوقف مؤقتاً أو غير مصرح بعرضه للعامة من قِبل إدارة المطعم.
          </p>
          <button
            onClick={() => onNavigate('landing')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
          >
            العودة للموقع الرئيسي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Cairo',sans-serif] pb-28">
      {/* Table Detection Notification Banner */}
      {tableParam && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-center gap-2 shadow-md">
          <Sparkles className="w-4 h-4" />
          <span>أهلاً بك! تم ضبط طلبك تلقائياً على: {tableParam}</span>
        </div>
      )}

      {/* Restaurant Header & Cover */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-44 sm:h-60 w-full relative overflow-hidden bg-slate-900">
          <img
            src={restaurant.coverUrl}
            alt={restaurant.nameAr}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Top Bar on Cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              onClick={() => onNavigate('landing')}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-2 rounded-full transition"
              title="معلومات المطعم والواي فاي"
            >
              <Info className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Restaurant Identity Container */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-20">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-right">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-xl shrink-0 bg-slate-950">
              <img
                src={restaurant.logoUrl}
                alt={restaurant.nameAr}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{restaurant.nameAr}</h1>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {restaurant.cuisineType}
                </span>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مفتوح للطلب
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {restaurant.description}
              </p>

              {/* Meta details */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{restaurant.settings.workingHours}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{restaurant.settings.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs (Menu / Reviews) */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex border-b border-slate-800 gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'menu'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>قائمة الطعام ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>آراء الزوار ({reviews.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MENU */}
      {activeTab === 'menu' && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ابحث عن طبقك أو مشروبك المفضل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          {/* Sticky Categories Bar */}
          <div className="sticky top-20 z-30 -mx-4 px-4 py-2 bg-slate-950/90 backdrop-blur-md border-y border-slate-800/80">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                  activeCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                الكل ({items.length})
              </button>
              {categories.map((cat) => {
                const count = items.filter((i) => i.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${
                      activeCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.nameAr}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                لا توجد نتائج مطابقة لبحثك في هذا القسم
              </div>
            ) : (
              filteredItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden p-3.5 flex gap-3.5 transition group hover:border-slate-700 ${
                      !item.isAvailable ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Item Thumbnail */}
                    <div
                      onClick={() => handleOpenItemDetails(item)}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative cursor-pointer"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.nameAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {item.discountPrice && (
                        <div className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          خصم
                        </div>
                      )}
                      {item.isFeatured && (
                        <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          ⭐ مميز
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div
                        onClick={() => handleOpenItemDetails(item)}
                        className="cursor-pointer space-y-1"
                      >
                        <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition line-clamp-1">
                          {item.nameAr}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.descriptionAr}
                        </p>
                        {item.calories && (
                          <div className="text-[10px] text-slate-500">
                            🔥 {item.calories} سعرة
                          </div>
                        )}
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
                        <div>
                          <span className="text-amber-400 font-black text-sm">
                            {item.discountPrice || item.price} {restaurant.currency}
                          </span>
                          {item.discountPrice && (
                            <span className="text-[10px] text-slate-500 line-through mr-1.5">
                              {item.price}
                            </span>
                          )}
                        </div>

                        {item.isAvailable ? (
                          <button
                            onClick={() => handleQuickAdd(item)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>طلب</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold">نفد من المطبخ</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REVIEWS & FEEDBACK */}
      {activeTab === 'reviews' && (
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>تقييمات وتجارب رواد {restaurant.nameAr}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                رأيك يهمنا دائماً لتطوير أصنافنا وخدمتنا.
              </p>
            </div>

            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
            >
              + أضف تقييمك وتجربتك
            </button>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد تقييمات منشورة حتى الآن. كن أول من يشارك تجربته!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{rev.customerName}</span>
                    <span className="text-slate-500 text-[10px]">{rev.createdAt}</span>
                  </div>
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="text-slate-300 leading-relaxed">{rev.comment}</p>

                  {rev.reply && (
                    <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <span className="text-amber-400 font-bold">رد المطعم:</span>
                      <p className="text-slate-300">{rev.reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer active:scale-98 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm">
                {totalItemsCount}
              </div>
              <div className="text-right">
                <div className="font-black text-sm leading-tight">سلة الطلبات جاهزة</div>
                <div className="text-[10px] font-bold text-slate-900/80">
                  اضغط للمراجعة والإرسال عبر WhatsApp
                </div>
              </div>
            </div>

            <div className="text-left font-black text-base">
              {total.toFixed(2)} {restaurant.currency}
            </div>
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">{selectedItemForModal.nameAr}</h3>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            <div className="h-44 rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={selectedItemForModal.imageUrl}
                alt={selectedItemForModal.nameAr}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedItemForModal.descriptionAr}
            </p>

            {/* Sizes Selection */}
            {selectedItemForModal.sizes && selectedItemForModal.sizes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-white">اختر الحجم المطلوب:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedItemForModal.sizes.map((sz, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        selectedSize?.name === sz.name
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{sz.name}</span>
                      <span className="text-[11px] text-amber-400">
                        {sz.price} {restaurant.currency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Options / Add-ons */}
            {selectedItemForModal.options && selectedItemForModal.options.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {selectedItemForModal.options.map((grp, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    <label className="block text-xs font-bold text-white">{grp.name}:</label>
                    <div className="space-y-1.5">
                      {grp.items.map((opt, oIdx) => {
                        const isChecked = selectedOptions.some(
                          (o) => o.groupName === grp.name && o.optionName === opt.name
                        );
                        return (
                          <label
                            key={oIdx}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedOptions([
                                      ...selectedOptions,
                                      {
                                        groupName: grp.name,
                                        optionName: opt.name,
                                        additionalPrice: opt.additionalPrice,
                                      },
                                    ]);
                                  } else {
                                    setSelectedOptions(
                                      selectedOptions.filter(
                                        (o) =>
                                          !(
                                            o.groupName === grp.name &&
                                            o.optionName === opt.name
                                          )
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                              />
                              <span className="text-slate-200">{opt.name}</span>
                            </div>
                            {opt.additionalPrice > 0 && (
                              <span className="text-amber-400 font-bold">
                                +{opt.additionalPrice} {restaurant.currency}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Customer Notes */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-white">ملاحظات خاصة للطلب:</label>
              <input
                type="text"
                placeholder="مثال: بدون طماطم، ثوم زيادة، الخبز مقمر..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantity and Add Button */}
            <div className="pt-3 flex items-center justify-between gap-4 border-t border-slate-800">
              <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-sm w-5 text-center">{itemQuantity}</span>
                <button
                  type="button"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow transition"
              >
                إضافة إلى السلة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & WhatsApp Order Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">مراجعة وتأكيد الطلب</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-white truncate">{item.nameAr}</div>
                    {item.selectedSize && (
                      <div className="text-[10px] text-amber-400 font-semibold">
                        الحجم: {item.selectedSize.name}
                      </div>
                    )}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        {item.selectedOptions.map((o) => o.optionName).join(' + ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[10px] text-slate-400 italic">ملاحظة: {item.notes}</div>
                    )}
                    <div className="text-amber-400 font-bold">
                      {(item.unitPrice * item.quantity).toFixed(2)} {restaurant.currency}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => handleUpdateCartQuantity(item.cartItemId, -1)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white text-xs">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateCartQuantity(item.cartItemId, 1)}
                      className="text-amber-400 hover:text-amber-300 p-1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Type Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-white">نوع الطلب:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`py-2 rounded-xl border transition ${
                    orderType === 'dine_in'
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  داخل المطعم 🪑
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-2 rounded-xl border transition ${
                    orderType === 'takeaway'
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  استلام سفري 🛍️
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-2 rounded-xl border transition ${
                    orderType === 'delivery'
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  توصيل خارجي 🛵
                </button>
              </div>
            </div>

            {/* Dine-in Table Number */}
            {orderType === 'dine_in' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الطاولة:
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="مثال: طاولة 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Customer Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">الاسم الكريم *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد السعيد"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم الجوال *:</label>
                <input
                  type="text"
                  required
                  placeholder="0501234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Address if delivery */}
            {orderType === 'delivery' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان التوصيل التفصيلي *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="الحي، الشارع، رقم المبنى..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>المجموع الفرعي:</span>
                <span>
                  {subtotal.toFixed(2)} {restaurant.currency}
                </span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>ضريبة القيمة المضافة ({restaurant.settings.taxPercentage}%):</span>
                  <span>
                    {tax.toFixed(2)} {restaurant.currency}
                  </span>
                </div>
              )}
              {delivery > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>رسوم التوصيل:</span>
                  <span>
                    {delivery.toFixed(2)} {restaurant.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                <span>المجموع الإجمالي:</span>
                <span className="text-amber-400">
                  {total.toFixed(2)} {restaurant.currency}
                </span>
              </div>
            </div>

            {/* Action Button: Send via WhatsApp */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmittingOrder}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>{isSubmittingOrder ? 'جارٍ تسجيل الطلب وفتح WhatsApp...' : 'إرسال الطلب فوراً عبر WhatsApp'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Info & WiFi Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">معلومات {restaurant.nameAr}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {restaurant.settings.wifiName && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Wifi className="w-4 h-4" />
                    <span>واي فاي الصالة (Guest WiFi):</span>
                  </div>
                  <div className="text-white font-mono">
                    الشبكة: {restaurant.settings.wifiName}
                  </div>
                  {restaurant.settings.wifiPassword && (
                    <div className="text-slate-400 font-mono">
                      كلمة المرور: {restaurant.settings.wifiPassword}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">ساعات العمل:</span>
                <span className="text-white font-bold">{restaurant.settings.workingHours}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">العنوان:</span>
                <span className="text-white font-bold">{restaurant.settings.address}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">هاتف المطعم:</span>
                <span className="text-emerald-400 font-mono font-bold">{restaurant.phone}</span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition mt-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">تقييم تجربتك في {restaurant.nameAr}</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <div className="font-bold text-white text-sm">شكراً لمشاركتك رأيك القيّم!</div>
                <p className="text-slate-400 text-xs">تم تسجيل تقييمك بنجاح وسيسعد فريقنا بمراجعته.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">تقييمك بالنجوم:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewerRating(star)}
                        className="text-2xl text-amber-400 hover:scale-110 transition"
                      >
                        {star <= reviewerRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">اسمك الكريم *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خالد العبدالله"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">رأيك وملاحظاتك *:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="شاركنا رأيك في جودة الأطباق وسرعة الخدمة..."
                    value={reviewerComment}
                    onChange={(e) => setReviewerComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

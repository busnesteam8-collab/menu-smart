import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  MessageCircle,
  Star,
  Settings,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
  Copy,
  AlertCircle,
  Sparkles,
  Save,
  Check,
  ChevronDown,
  Wifi,
  MapPin,
  TrendingUp,
  X,
  Share2,
  Palette,
  Layers,
  ArrowUpDown,
  History,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  Restaurant,
  Category,
  MenuItem,
  Order,
  Review,
  ItemSize,
  ItemOption,
  RestaurantTable,
  MenuAppearance,
  OrderStatus,
} from '../types';
import { store } from '../services/store';
import { firestoreRestaurantService } from '../services/firestoreRestaurantService';
import { firestoreMenuService, MenuSyncStatus } from '../services/firestoreMenuService';
import { firestoreOperationsService, OperationsSyncStatus } from '../services/firestoreOperationsService';
import { useAuth } from '../context/AuthContext';

interface RestaurantAdminDashboardProps {
  restaurantId: string;
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  onSelectRestaurantId: (id: string) => void;
}

export const RestaurantAdminDashboard: React.FC<RestaurantAdminDashboardProps> = ({
  restaurantId,
  onNavigate,
  onSelectRestaurantId,
}) => {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'menu' | 'tables' | 'appearance' | 'whatsapp' | 'reviews' | 'profile' | 'billing'
  >('overview');

  const restaurant = store.getRestaurantById(restaurantId);
  const currentPlan = restaurant ? store.getPlanById(restaurant.subscription.planId) : undefined;

  // Tenant scoped data
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [payments, setPayments] = useState(store.getPaymentsByRestaurant(restaurantId));

  // Category & Item Modals & Sync States (Phase 3B-3)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameAr, setCategoryNameAr] = useState('');
  const [categoryNameEn, setCategoryNameEn] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🍽️');
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  // Firestore Menu Sync Status
  const [menuSyncStatus, setMenuSyncStatus] = useState<MenuSyncStatus>(
    firestoreMenuService.getStatus(restaurantId)
  );
  const [isSyncingMenu, setIsSyncingMenu] = useState(false);
  const [menuSyncNotice, setMenuSyncNotice] = useState<string | null>(null);

  // Firestore Operations (Tables, Orders, Reviews) Sync Status (Phase 3B-4)
  const [operationsSyncStatus, setOperationsSyncStatus] = useState<OperationsSyncStatus>(
    firestoreOperationsService.getStatus(restaurantId)
  );
  const [isSyncingOperations, setIsSyncingOperations] = useState(false);
  const [operationsNotice, setOperationsNotice] = useState<string | null>(null);

  // Item Form Fields
  const [itemNameAr, setItemNameAr] = useState('');
  const [itemNameEn, setItemNameEn] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemDiscountPrice, setItemDiscountPrice] = useState<number | undefined>(undefined);
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemCalories, setItemCalories] = useState<number | undefined>(undefined);
  const [itemPrepTime, setItemPrepTime] = useState('');
  const [itemIsFeatured, setItemIsFeatured] = useState(false);
  const [itemAllergens, setItemAllergens] = useState<string[]>([]);

  // Tables State & Modal
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableLocation, setTableLocation] = useState<'indoor' | 'outdoor' | 'vip' | 'terrace'>('indoor');
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [tableQrDataUrl, setTableQrDataUrl] = useState<string>('');

  // Menu Appearance State
  const [appearanceForm, setAppearanceForm] = useState<MenuAppearance>(
    restaurant?.appearance || {
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
    }
  );
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  // Settings & Profile Form
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsForm, setSettingsForm] = useState(restaurant?.settings || ({} as any));
  const [nameArForm, setNameArForm] = useState(restaurant?.nameAr || '');
  const [phoneForm, setPhoneForm] = useState(restaurant?.phone || '');
  const [whatsappForm, setWhatsappForm] = useState(restaurant?.whatsappNumber || '');
  const [workingHoursForm, setWorkingHoursForm] = useState(restaurant?.settings.workingHours || '');
  const [addressForm, setAddressForm] = useState(restaurant?.settings.address || '');
  const [currencyForm, setCurrencyForm] = useState(restaurant?.currency || 'ج.م');

  // Review Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Reload data
  const refreshData = () => {
    if (!restaurant) return;
    setCategories(store.getCategoriesByRestaurant(restaurant.id));
    setItems(store.getItemsByRestaurant(restaurant.id));
    setOrders(store.getOrdersByRestaurant(restaurant.id));
    setReviews(store.getReviewsByRestaurant(restaurant.id));
    setTables(store.getTablesByRestaurant(restaurant.id));
    setPayments(store.getPaymentsByRestaurant(restaurant.id));
  };

  useEffect(() => {
    refreshData();

    // Subscribe to local store changes
    const unsubStore = store.subscribe(() => {
      refreshData();
    });

    // Subscribe to Cloud Firestore real-time menu categories and items (Phase 3B-3)
    const unsubMenu = firestoreMenuService.subscribeRestaurantMenu(
      restaurantId,
      ({ categories: remoteCats, items: remoteItems }) => {
        setCategories(remoteCats);
        setItems(remoteItems);
      }
    );

    // Subscribe to menu sync status
    const unsubStatus = firestoreMenuService.subscribeStatus(restaurantId, setMenuSyncStatus);

    // Subscribe to Cloud Firestore real-time tables (Phase 3B-4)
    const unsubTables = firestoreOperationsService.subscribeTables(restaurantId, setTables);

    // Subscribe to Cloud Firestore real-time orders (Phase 3B-4)
    const unsubOrders = firestoreOperationsService.subscribeOrders(restaurantId, setOrders);

    // Subscribe to Cloud Firestore real-time reviews (Phase 3B-4: restaurant admin reads all)
    const unsubReviews = firestoreOperationsService.subscribeReviews(restaurantId, false, setReviews);

    // Subscribe to operations sync status
    const unsubOpStatus = firestoreOperationsService.subscribeStatus(restaurantId, setOperationsSyncStatus);

    return () => {
      unsubStore();
      unsubMenu();
      unsubStatus();
      unsubTables();
      unsubOrders();
      unsubReviews();
      unsubOpStatus();
    };
  }, [restaurantId]);

  useEffect(() => {
    if (restaurant) {
      setSettingsForm(restaurant.settings);
      setNameArForm(restaurant.nameAr);
      setPhoneForm(restaurant.phone);
      setWhatsappForm(restaurant.whatsappNumber);
      setWorkingHoursForm(restaurant.settings.workingHours);
      setAddressForm(restaurant.settings.address);
      setCurrencyForm(restaurant.currency || 'ج.م');
      if (restaurant.appearance) {
        setAppearanceForm(restaurant.appearance);
      }
    }
  }, [restaurant]);

  // Generate Table QR Code
  useEffect(() => {
    if (!restaurant || !selectedTableForQr) return;
    const url = `${window.location.origin}/?rest=${restaurant.id}&table=${encodeURIComponent(
      selectedTableForQr.tableNumber
    )}`;
    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: appearanceForm.primaryColor || '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUri) => {
        setTableQrDataUrl(dataUri);
      })
      .catch((err) => console.error('Table QR generation error', err));
  }, [restaurant, selectedTableForQr, appearanceForm.primaryColor]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold mb-2">لم يتم العثور على المطعم المطلوب</h2>
        <button
          onClick={() => onNavigate('landing')}
          className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          العودة للموقع الرئيسي
        </button>
      </div>
    );
  }

  // Check if restaurant admin access is disabled by Super Admin
  if (restaurant.access && restaurant.access.allowDashboard === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">لوحة التحكم معطلة مؤقتاً</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          تم إيقاف صلاحية الوصول للوحة التحكم الخاصة بمطعم {restaurant.nameAr} من قبل إدارة المنصة.
          يرجى التواصل مع الدعم الفني للاستفسار.
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

  // Check subscription validity (Super Admin can inspect for support)
  const subStatus = store.isSubscriptionActive(restaurant.id);
  if (!subStatus.isValid && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">انتهت صلاحية اشتراك المطعم</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          انتهت صلاحية باقة اشتراك مطعم {restaurant.nameAr} ({restaurant.subscription?.renewalDate || 'منتهي'}).
          يرجى التواصل مع إدارة منصة Menu Smart لتجديد الاشتراك واستئناف إدارة المنيو والطلبات.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm cursor-pointer shadow"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    );
  }

  // Open Category Modal (Create or Edit)
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryNameAr(cat.nameAr);
      setCategoryNameEn(cat.nameEn);
      setCategoryIcon(cat.icon || '🍽️');
      setCategoryIsActive(cat.isActive);
    } else {
      if (currentPlan && categories.length >= currentPlan.categoryLimit) {
        alert(
          `لقد وصلت للحد الأقصى للتصنيفات المتاحة في باقتك (${currentPlan.categoryLimit} تصنيف). يرجى ترقية الباقة لإضافة المزيد.`
        );
        return;
      }
      setEditingCategory(null);
      setCategoryNameAr('');
      setCategoryNameEn('');
      setCategoryIcon('🍽️');
      setCategoryIsActive(true);
    }
    setShowCategoryModal(true);
  };

  // Save Category to Cloud Firestore (Phase 3B-3)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameAr.trim()) return;

    const catToSave: Category = {
      id: editingCategory
        ? editingCategory.id
        : `cat-${restaurant.id}-${Date.now().toString().slice(-4)}`,
      restaurantId: restaurant.id,
      nameAr: categoryNameAr.trim(),
      nameEn: categoryNameEn.trim() || categoryNameAr.trim(),
      icon: categoryIcon || '🍽️',
      sortOrder: editingCategory ? editingCategory.sortOrder : categories.length + 1,
      isActive: categoryIsActive,
    };

    try {
      await firestoreMenuService.saveCategory(restaurant.id, catToSave);
    } catch (err: any) {
      store.saveCategory(catToSave);
    }

    setCategoryNameAr('');
    setCategoryNameEn('');
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  // Delete Category from Cloud Firestore (with cascade check)
  const handleDeleteCategory = async (cat: Category) => {
    const catItemCount = items.filter((i) => i.categoryId === cat.id).length;
    const confirmText =
      catItemCount > 0
        ? `تحذير: يحتوي قسم "${cat.nameAr}" على ${catItemCount} أصناف. سيتم حذف هذا القسم وجميع الأصناف التابعة له من Cloud Firestore. هل أنت متأكد؟`
        : `هل أنت متأكد من حذف قسم "${cat.nameAr}" من Cloud Firestore؟`;

    if (window.confirm(confirmText)) {
      try {
        await firestoreMenuService.deleteCategory(restaurant.id, cat.id);
      } catch (err: any) {
        store.deleteCategory(cat.id, restaurant.id);
      }
      if (selectedCategoryFilter === cat.id) {
        setSelectedCategoryFilter('all');
      }
    }
  };

  // Toggle Category Active Status
  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      await firestoreMenuService.toggleCategoryStatus(restaurant.id, cat.id, !cat.isActive);
    } catch (err: any) {
      store.saveCategory({ ...cat, isActive: !cat.isActive });
    }
  };

  // Open Item Modal
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemNameAr(item.nameAr);
      setItemNameEn(item.nameEn);
      setItemCategoryId(item.categoryId);
      setItemDescription(item.descriptionAr);
      setItemPrice(item.price);
      setItemDiscountPrice(item.discountPrice);
      setItemImageUrl(item.imageUrl);
      setItemCalories(item.calories);
      setItemPrepTime(item.prepTime || '');
      setItemIsFeatured(item.isFeatured);
      setItemAllergens(item.allergens || []);
    } else {
      // Check item limit
      if (currentPlan && items.length >= currentPlan.itemLimit) {
        alert(
          `لقد وصلت للحد الأقصى للأصناف في باقتك (${currentPlan.itemLimit} صنف). يرجى الترقية لإضافة أصناف أخرى.`
        );
        return;
      }
      setEditingItem(null);
      setItemNameAr('');
      setItemNameEn('');
      setItemCategoryId(categories[0]?.id || '');
      setItemDescription('');
      setItemPrice(20);
      setItemDiscountPrice(undefined);
      setItemImageUrl(
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80'
      );
      setItemCalories(350);
      setItemPrepTime('10 دقائق');
      setItemIsFeatured(false);
      setItemAllergens([]);
    }
    setShowItemModal(true);
  };

  // Save Item to Cloud Firestore (Phase 3B-3)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameAr.trim() || !itemCategoryId) return;

    const itemToSave: MenuItem = {
      id: editingItem
        ? editingItem.id
        : `item-${restaurant.id}-${Date.now().toString().slice(-4)}`,
      restaurantId: restaurant.id,
      categoryId: itemCategoryId,
      nameAr: itemNameAr.trim(),
      nameEn: itemNameEn.trim() || itemNameAr.trim(),
      descriptionAr: itemDescription,
      price: Number(itemPrice),
      discountPrice: itemDiscountPrice ? Number(itemDiscountPrice) : undefined,
      imageUrl:
        itemImageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80',
      isAvailable: editingItem ? editingItem.isAvailable : true,
      isFeatured: itemIsFeatured,
      calories: itemCalories ? Number(itemCalories) : undefined,
      prepTime: itemPrepTime,
      allergens: itemAllergens,
      sizes: editingItem?.sizes,
      options: editingItem?.options,
      sortOrder: editingItem?.sortOrder || items.length + 1,
    };

    try {
      await firestoreMenuService.saveMenuItem(restaurant.id, itemToSave);
      setShowItemModal(false);
    } catch (err: any) {
      alert(err?.message || 'فشل حفظ الصنف في Cloud Firestore');
    }
  };

  // Toggle Item Availability in Cloud Firestore
  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      await firestoreMenuService.toggleItemAvailability(
        restaurant.id,
        item.id,
        !item.isAvailable
      );
    } catch (err: any) {
      store.toggleItemAvailability(item.id, restaurant.id);
    }
  };

  // Delete Item from Cloud Firestore
  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`هل أنت متأكد من حذف ${item.nameAr} من Cloud Firestore؟`)) {
      try {
        await firestoreMenuService.deleteMenuItem(restaurant.id, item.id);
      } catch (err: any) {
        store.deleteItem(item.id, restaurant.id);
      }
    }
  };

  // 1-Click Sync Local Menu to Cloud Firestore
  const handleSyncMenuToCloud = async () => {
    if (
      !window.confirm(
        'هل توافق على مزامنة وتصدير جميع أقسام وأصناف المنيو الحالية إلى Cloud Firestore الآن؟ هذه العملية آمنة ولا تنشئ أي تكرار.'
      )
    ) {
      return;
    }
    setIsSyncingMenu(true);
    setMenuSyncNotice(null);
    try {
      const res = await firestoreMenuService.importLocalMenuToFirestore(restaurant.id);
      setMenuSyncNotice(
        `✓ تم بنجاح مزامنة ${res.categoriesCount} أقسام و ${res.itemsCount} أصناف مع Cloud Firestore!`
      );
      setTimeout(() => setMenuSyncNotice(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'فشلت مزامنة المنيو مع Cloud Firestore');
    } finally {
      setIsSyncingMenu(false);
    }
  };

  // Sync Operations (Tables & Reviews) with Cloud Firestore (Phase 3B-4)
  const handleSyncOperationsToCloud = async () => {
    if (!restaurant) return;
    setIsSyncingOperations(true);
    setOperationsNotice(null);
    try {
      const res = await firestoreOperationsService.importLocalTablesAndReviews(restaurant.id);
      setOperationsNotice(
        `✓ تم بنجاح مزامنة ${res.tablesCount} طاولة و ${res.reviewsCount} تقييم مع Cloud Firestore!`
      );
      setTimeout(() => setOperationsNotice(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'فشلت المزامنة مع Cloud Firestore');
    } finally {
      setIsSyncingOperations(false);
    }
  };

  // Handle Save Table (Phase 3B-4: Cloud Firestore)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim() || !restaurant) return;

    // Check table limits
    if (currentPlan && tables.length >= currentPlan.tableLimit) {
      alert(`لقد وصلت للحد الأقصى للطاولات في باقتك (${currentPlan.tableLimit} طاولة). يرجى ترقية الباقة لإضافة طاولات إضافية.`);
      return;
    }

    const newTable: RestaurantTable = {
      id: `tbl-${restaurant.id}-${Date.now().toString().slice(-4)}`,
      restaurantId: restaurant.id,
      tableNumber: tableNumberInput.trim(),
      nameAr: tableNameInput.trim() || tableNumberInput.trim(),
      capacity: Number(tableCapacity),
      location: tableLocation,
      isActive: true,
    };

    try {
      await firestoreOperationsService.saveTable(restaurant.id, newTable);
    } catch (err: any) {
      console.warn('Table saved locally:', err);
    }

    setShowTableModal(false);
    setTableNumberInput('');
    setTableNameInput('');
  };

  // Save Appearance (Phase 3B-2: Firestore Sync)
  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    store.updateRestaurantAppearance(restaurant.id, appearanceForm);
    try {
      await firestoreRestaurantService.updateRestaurantProfile(restaurant.id, {
        appearance: appearanceForm,
      });
    } catch (err) {
      console.warn('Appearance saved locally; cloud sync pending:', err);
    }
    setAppearanceSaved(true);
    setTimeout(() => setAppearanceSaved(false), 3000);
  };

  // Restore Default Appearance
  const handleRestoreDefaultAppearance = async () => {
    if (window.confirm('هل تريد استعادة التصميم والمظهر الافتراضي للمنيو؟')) {
      store.restoreDefaultAppearance(restaurant.id);
      const updated = store.getRestaurantById(restaurant.id);
      if (updated?.appearance) {
        setAppearanceForm(updated.appearance);
        try {
          await firestoreRestaurantService.updateRestaurantProfile(restaurant.id, {
            appearance: updated.appearance,
          });
        } catch (err) {
          console.warn('Default appearance restored locally; cloud sync pending:', err);
        }
      }
      alert('تمت استعادة التصميم الافتراضي بنجاح.');
    }
  };

  // Save Settings & Profile (Phase 3B-2: Firestore Sync)
  const handleSaveProfileAndSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileUpdates = {
      nameAr: nameArForm,
      phone: phoneForm,
      whatsappNumber: whatsappForm,
      currency: currencyForm,
    };
    const settingsUpdates = {
      ...settingsForm,
      workingHours: workingHoursForm,
      address: addressForm,
    };

    store.updateRestaurantProfile(restaurant.id, profileUpdates);
    store.updateRestaurantSettings(restaurant.id, settingsUpdates);

    try {
      await firestoreRestaurantService.updateRestaurantProfile(restaurant.id, {
        ...profileUpdates,
        settings: settingsUpdates,
      });
    } catch (err) {
      console.warn('Profile saved locally; cloud sync pending:', err);
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
    const matchesSearch =
      item.nameAr.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(itemSearchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const approvedReviews = reviews.filter((r) => r.isApproved);
  const avgRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Cairo',sans-serif] flex flex-col">
      {/* Top Tenant Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={restaurant.logoUrl}
              alt={restaurant.nameAr}
              className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">{restaurant.nameAr}</h1>
                <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                  باقة {currentPlan?.nameAr || restaurant.subscription.planId}
                </span>
                {restaurant.status === 'pending' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">
                    قيد مراجعة الإدارة
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                المعرف: <span className="font-mono text-amber-400">{restaurant.id}</span> • الرابط:{' '}
                <span className="text-emerald-400 font-mono">/{restaurant.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('public_menu')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة المنيو الحي للعملاء</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>المؤشرات والطلبات</span>
            </div>
            {orders.filter((o) => o.status === 'new').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {orders.filter((o) => o.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UtensilsCrossed className="w-4 h-4" />
              <span>إدارة المنيو والأصناف</span>
            </div>
            <span className="text-[11px] opacity-75">{items.length} صنف</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4" />
              <span>الطاولات ورموز QR</span>
            </div>
            <span className="text-[11px] opacity-75">{tables.length} طاولة</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition ${
              activeTab === 'appearance'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>تخصيص المظهر (Appearance)</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition ${
              activeTab === 'whatsapp'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>إعدادات الواتساب والطلب</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4" />
              <span>التقييمات والمراجعات</span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold">{avgRating} ★</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الهوية والملف التعريفي</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-right px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
              activeTab === 'billing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>الاشتراك والفوترة</span>
            </div>
            <span className="text-[10px] uppercase font-mono bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded">
              {restaurant.subscription.planId}
            </span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Plan Limits Strip */}
              {currentPlan && (
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">استهلاك حدود باقة {currentPlan.nameAr}:</span>
                    <span className="text-slate-400">
                      الأصناف: <strong className="text-white">{items.length}</strong>/{currentPlan.itemLimit}
                    </span>
                    <span className="text-slate-400">
                      التصنيفات: <strong className="text-white">{categories.length}</strong>/{currentPlan.categoryLimit}
                    </span>
                    <span className="text-slate-400">
                      الطاولات: <strong className="text-white">{tables.length}</strong>/{currentPlan.tableLimit}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    ترقية الباقة الآن
                  </button>
                </div>
              )}

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-xs font-semibold">إجمالي الزيارات</span>
                  <div className="text-2xl font-black text-white mt-1">{restaurant.viewsCount || 0}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>زيارات حقيقية للمنيو</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-xs font-semibold">طلبات الواتساب</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">{orders.length}</div>
                  <div className="text-[11px] text-slate-400 mt-1">طلبات مسجلة</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-xs font-semibold">الأصناف المتاحة</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {items.filter((i) => i.isAvailable).length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">من أصل {items.length} صنف</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-xs font-semibold">متوسط التقييم</span>
                  <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
                    <span>{avgRating}</span>
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {approvedReviews.length} تقييم معتمد
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>سجل الطلبات الواردة من المنيو الرقمي</span>
                  </h3>
                  <span className="text-xs text-slate-400">تحديث لحظي</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    لم يتم تسجيل أي طلبات حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-400 text-sm">
                              {ord.orderNumber}
                            </span>
                            <span className="text-slate-300 font-bold">• {ord.customerName}</span>
                            <span className="text-slate-500 font-mono">({ord.customerPhone})</span>
                            {ord.tableNumber && (
                              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">
                                {ord.tableNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400">
                            {ord.items.map((i) => `${i.nameAr} (${i.quantity})`).join(' + ')}
                          </div>
                          <div className="text-[10px] text-slate-500">{ord.createdAt}</div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                          <div className="text-left font-black text-sm text-white">
                            {ord.total.toFixed(2)} {restaurant.currency}
                          </div>
                          <select
                            value={ord.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as OrderStatus;
                              await firestoreOperationsService.updateOrderStatus(
                                restaurant.id,
                                ord.id,
                                newStatus
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                              ord.status === 'completed' || ord.status === 'delivered'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : ord.status === 'preparing' || ord.status === 'ready'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : ord.status === 'confirmed'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            <option value="pending" className="bg-slate-900 text-white">معلق (Pending)</option>
                            <option value="new" className="bg-slate-900 text-white">جديد (New)</option>
                            <option value="confirmed" className="bg-slate-900 text-white">مؤكد (Confirmed)</option>
                            <option value="preparing" className="bg-slate-900 text-white">قيد التحضير (Preparing)</option>
                            <option value="ready" className="bg-slate-900 text-white">جاهز للاستلام (Ready)</option>
                            <option value="delivered" className="bg-slate-900 text-white">تم التسليم (Delivered)</option>
                            <option value="completed" className="bg-slate-900 text-white">مكتمل (Completed)</option>
                            <option value="cancelled" className="bg-slate-900 text-white">ملغي (Cancelled)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MENU & ITEMS (Phase 3B-3 Cloud Firestore) */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Cloud Menu Sync Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      menuSyncStatus.isConnected
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                        <span>قاعدة بيانات المنيو السحابية (Cloud Firestore):</span>
                      </span>
                      <span className="text-emerald-400 font-mono text-xs font-bold">
                        {categories.length} أقسام • {items.length} أصناف
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يتم حفظ الأقسام والأصناف فورياً في سحابة Firestore مع عزل تام لكل مطعم.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncMenuToCloud}
                    disabled={isSyncingMenu}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-amber-500/30 cursor-pointer disabled:opacity-50"
                    title="مزامنة وتصدير المنيو المحلي إلى Cloud Firestore"
                  >
                    <span>{isSyncingMenu ? 'جارٍ المزامنة السحابية...' : 'مزامنة المنيو مع Firestore'}</span>
                  </button>
                </div>
              </div>

              {menuSyncNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{menuSyncNotice}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenItemModal()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة طبق / صنف جديد</span>
                  </button>
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة تصنيف جديد</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="بحث في الأصناف..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Categories Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  جميع الأصناف ({items.length})
                </button>
                {categories.map((cat) => {
                  const catItemCount = items.filter((i) => i.categoryId === cat.id).length;
                  const isSelected = selectedCategoryFilter === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition border ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.nameAr}</span>
                        <span className="opacity-70 text-[10px]">({catItemCount})</span>
                        {!cat.isActive && (
                          <span className="bg-rose-500/20 text-rose-400 text-[9px] px-1 rounded">
                            مخفي
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-1 border-r border-slate-700/60 pr-1.5 mr-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCategoryModal(cat);
                          }}
                          title="تعديل هذا القسم"
                          className="text-slate-400 hover:text-white transition"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat);
                          }}
                          title="حذف هذا القسم"
                          className="text-rose-400 hover:text-rose-300 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                    لا توجد أصناف في هذا التصنيف.
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);

                    return (
                      <div
                        key={item.id}
                        className={`bg-slate-900 rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                          item.isAvailable
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-rose-900/40 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="h-36 relative overflow-hidden bg-slate-950">
                            <img
                              src={item.imageUrl}
                              alt={item.nameAr}
                              className="w-full h-full object-cover"
                            />
                            {item.discountPrice && (
                              <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                                خصم مميز
                              </div>
                            )}
                            {item.isFeatured && (
                              <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>الأكثر طلباً</span>
                              </div>
                            )}
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-lg">
                                  غير متوفر حالياً
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-white text-sm">{item.nameAr}</h4>
                                <span className="text-[10px] text-slate-400">{cat?.nameAr}</span>
                              </div>
                              <div className="text-left">
                                <div className="text-amber-400 font-black text-sm">
                                  {item.discountPrice || item.price} {restaurant.currency}
                                </div>
                                {item.discountPrice && (
                                  <div className="text-[10px] text-slate-500 line-through">
                                    {item.price} {restaurant.currency}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {item.descriptionAr}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <button
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                              item.isAvailable
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.isAvailable ? '✓ متوفر للطلب' : '✕ غير متوفر'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenItemModal(item)}
                              title="تعديل بيانات الصنف"
                              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="حذف الصنف من السحابة"
                              className="p-1.5 hover:bg-rose-900/30 text-rose-400 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TABLES & QR MANAGEMENT */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Operations Cloud Sync Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      operationsSyncStatus.isConnected
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span>إدارة العمليات السحابية (Cloud Firestore Operations):</span>
                      </span>
                      <span className="text-emerald-400 font-mono text-xs font-bold">
                        {tables.length} طاولات • {orders.length} طلبات • {reviews.length} تقييمات
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يتم حفظ الطاولات والطلبات والتقييمات وتحديثها فورياً عبر قواعد الأمان السحابية.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncOperationsToCloud}
                    disabled={isSyncingOperations}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-amber-500/30 cursor-pointer disabled:opacity-50"
                    title="مزامنة الطاولات والتقييمات المحلية إلى Cloud Firestore"
                  >
                    <span>{isSyncingOperations ? 'جارٍ المزامنة السحابية...' : 'مزامنة الطاولات والتقييمات مع السحابة'}</span>
                  </button>
                </div>
              </div>

              {operationsNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{operationsNotice}</span>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-amber-400" />
                      <span>إدارة الطاولات وتوليد رموز QR</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      أضف طاولات الصالة والتراس، ولد رمز QR لكل طاولة بدقة عالية مع إمكانية الطباعة المباشرة لكروت الطاولات.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTableModal(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة طاولة جديدة</span>
                  </button>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tables.map((tbl) => (
                    <div
                      key={tbl.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm">{tbl.tableNumber}</h4>
                            <span className="text-[11px] text-slate-400">{tbl.nameAr}</span>
                          </div>
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {tbl.location}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          السعة: {tbl.capacity || 4} أشخاص
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedTableForQr(tbl)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>عرض وطباعة الـ QR</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm(`هل أنت متأكد من حذف ${tbl.tableNumber}؟`)) {
                              await firestoreOperationsService.deleteTable(restaurant.id, tbl.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-900/30 text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table QR Stand Preview Card if Selected */}
              {selectedTableForQr && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-base">
                      كارت الطاولة الجاهز للطباعة: {selectedTableForQr.tableNumber}
                    </h3>
                    <button
                      onClick={() => setSelectedTableForQr(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-4">
                    {/* The Stand */}
                    <div className="w-64 bg-white text-slate-950 p-6 rounded-3xl shadow-2xl text-center border-4 border-slate-200 space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <img
                          src={restaurant.logoUrl}
                          alt="Logo"
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                        />
                        <div className="text-right">
                          <h4 className="font-black text-sm text-slate-900">{restaurant.nameAr}</h4>
                          <span className="text-[10px] text-slate-500">{restaurant.cuisineType}</span>
                        </div>
                      </div>

                      <div className="bg-amber-500 text-slate-950 text-xs font-black py-1 px-3 rounded-full">
                        {selectedTableForQr.tableNumber}
                      </div>

                      <div className="p-2 border-2 border-slate-200 rounded-2xl bg-white mx-auto w-48 h-48 flex items-center justify-center">
                        {tableQrDataUrl && (
                          <img src={tableQrDataUrl} alt="Table QR" className="w-full h-full object-contain" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">امسح الكاميرا لتصفح المنيو</p>
                        <p className="text-[10px] text-slate-500">واطلب مباشرة إلى طاولتك</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <a
                        href={tableQrDataUrl}
                        download={`QR-${restaurant.slug}-${selectedTableForQr.tableNumber}.png`}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل صورة QR بدقة عالية (PNG)</span>
                      </a>
                      <button
                        onClick={() => window.print()}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة كارت الطاولة الآن</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENU APPEARANCE CUSTOMIZER */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveAppearance} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Palette className="w-5 h-5 text-amber-400" />
                      <span>استوديو تخصيص تصميم ومظهر المنيو (Menu Appearance)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      تحكم بالألوان والخطوط وشكل بطاقات الأصناف ليطابق هوية مطعمك الخاصة بدقة.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultAppearance}
                      className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl transition"
                    >
                      استعادة الافتراضي
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ ونشر المظهر</span>
                    </button>
                  </div>
                </div>

                {appearanceSaved && (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl font-bold">
                    ✓ تم حفظ تصميم المنيو بنجاح وسيشاهده زوارك فوراً!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Primary & Secondary Color */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">اللون الرئيسي المميز:</label>
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2">
                      <input
                        type="color"
                        value={appearanceForm.primaryColor}
                        onChange={(e) => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-white">{appearanceForm.primaryColor}</span>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">نوع الخط العربي:</label>
                    <select
                      value={appearanceForm.fontFamily}
                      onChange={(e) =>
                        setAppearanceForm({
                          ...appearanceForm,
                          fontFamily: e.target.value as MenuAppearance['fontFamily'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Cairo">Cairo (خط كايرو العصري)</option>
                      <option value="Tajawal">Tajawal (خط تجوال الأنيق)</option>
                      <option value="Almarai">Almarai (خط المراعي الواضح)</option>
                      <option value="Readex Pro">Readex Pro (خط ريدكس الهندسي)</option>
                    </select>
                  </div>

                  {/* Card Layout */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">شكل عرض بطاقات الأطباق:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cards', 'list', 'compact'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAppearanceForm({ ...appearanceForm, cardLayout: mode })}
                          className={`py-2 rounded-xl border text-xs font-bold transition ${
                            appearanceForm.cardLayout === mode
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {mode === 'cards' ? 'بطاقات عمودية' : mode === 'list' ? 'قائمة أفقية' : 'شبكة مدمجة'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Shape */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1.5">شكل الأزرار:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['rounded', 'pill', 'square'] as const).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => setAppearanceForm({ ...appearanceForm, buttonShape: shape })}
                          className={`py-2 rounded-xl border text-xs font-bold transition ${
                            appearanceForm.buttonShape === shape
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {shape === 'rounded' ? 'دائري ناعم' : shape === 'pill' ? 'كبسولة (Pill)' : 'مربع حاد'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceForm.showCalories}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, showCalories: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>إظهار السعرات الحرارية على بطاقات الأطباق</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceForm.showBadges}
                      onChange={(e) =>
                        setAppearanceForm({ ...appearanceForm, showBadges: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>إظهار شارات "الأكثر طلباً" والخصومات</span>
                  </label>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: WHATSAPP SETTINGS */}
          {activeTab === 'whatsapp' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-3xl text-xs">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>إعدادات استقبال الطلبات عبر الواتساب</span>
              </h2>

              <form onSubmit={handleSaveProfileAndSettings} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    رقم الواتساب المستلم للطلبات (مع مفتاح الدولة):
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsappForm}
                    onChange={(e) => setWhatsappForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">ضريبة القيمة المضافة (%):</label>
                    <input
                      type="number"
                      value={settingsForm.taxPercentage}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, taxPercentage: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">رسوم التوصيل:</label>
                    <input
                      type="number"
                      value={settingsForm.deliveryFee}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الحد الأدنى للطلب:</label>
                    <input
                      type="number"
                      value={settingsForm.minimumOrder}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, minimumOrder: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow"
                  >
                    حفظ إعدادات الواتساب
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>إدارة مراجعات وتقييمات العملاء</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    متوسط التقييم العام: <strong className="text-amber-400">{avgRating} / 5.0</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    لا توجد أي تقييمات مسجلة حتى الآن.
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{rev.customerName}</span>
                          <span className="text-[10px] text-slate-500">{rev.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await firestoreOperationsService.setReviewApproval(
                                restaurant.id,
                                rev.id,
                                !rev.isApproved
                              );
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              rev.isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500 text-slate-950 shadow'
                            }`}
                          >
                            {rev.isApproved ? '✓ معتمد بالمنيو' : 'اعتماد ونشر'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`هل أنت متأكد من حذف تقييم ${rev.customerName}؟`)) {
                                await firestoreOperationsService.deleteReview(restaurant.id, rev.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-900/30 text-rose-400 rounded-lg transition cursor-pointer"
                            title="حذف التقييم نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex text-amber-400">{'★'.repeat(rev.rating)}</div>
                      <p className="text-slate-300">{rev.comment}</p>

                      {rev.reply && (
                        <div className="bg-slate-900 p-2.5 rounded-xl text-amber-400 border border-slate-800">
                          رد المطعم: <span className="text-slate-300">{rev.reply}</span>
                        </div>
                      )}

                      {/* Reply Input Form */}
                      {replyingReviewId === rev.id ? (
                        <div className="pt-2 flex items-center gap-2 border-t border-slate-800/60">
                          <input
                            type="text"
                            placeholder="اكتب ردك على التقييم..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={async () => {
                              if (!replyText.trim()) return;
                              await firestoreOperationsService.replyToReview(restaurant.id, rev.id, replyText);
                              setReplyingReviewId(null);
                              setReplyText('');
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                          >
                            حفظ الرد
                          </button>
                          <button
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyText('');
                            }}
                            className="text-slate-400 hover:text-white px-2 py-1.5 text-xs transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => {
                              setReplyingReviewId(rev.id);
                              setReplyText(rev.reply || '');
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline transition"
                          >
                            {rev.reply ? 'تعديل الرد' : '+ الرد على التقييم'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-3xl text-xs">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>الهوية والملف التعريفي</span>
              </h2>

              <form onSubmit={handleSaveProfileAndSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم المطعم بالعربية:</label>
                    <input
                      type="text"
                      required
                      value={nameArForm}
                      onChange={(e) => setNameArForm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">رقم الاتصال:</label>
                    <input
                      type="text"
                      value={phoneForm}
                      onChange={(e) => setPhoneForm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ساعات العمل:</label>
                  <input
                    type="text"
                    value={workingHoursForm}
                    onChange={(e) => setWorkingHoursForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">العنوان:</label>
                  <input
                    type="text"
                    value={addressForm}
                    onChange={(e) => setAddressForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">عملة المنيو والأسعار:</label>
                  <select
                    value={currencyForm}
                    onChange={(e) => setCurrencyForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ج.م">ج.م (الجنيه المصري - EGP)</option>
                    <option value="ر.س">ر.س (الريال السعودي - SAR)</option>
                    <option value="د.إ">د.إ (الدرهم الإماراتي - AED)</option>
                    <option value="د.ك">د.ك (الدينار الكويتي - KWD)</option>
                    <option value="$">$ (الدولار الأمريكي - USD)</option>
                    <option value="€">€ (اليورو - EUR)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم شبكة الواي فاي للضيوف:</label>
                    <input
                      type="text"
                      value={settingsForm.wifiName || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, wifiName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">كلمة مرور الواي فاي:</label>
                    <input
                      type="text"
                      value={settingsForm.wifiPassword || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, wifiPassword: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow"
                  >
                    حفظ الهوية
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: BILLING */}
          {activeTab === 'billing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-3xl text-xs">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>الاشتراك والفوترة</span>
              </h2>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-400">الباقة الحالية:</span>
                    <h3 className="text-xl font-black text-white">{currentPlan?.nameAr}</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
                    {restaurant.subscription.status === 'active' ? 'مفعل' : 'فترة تجريبية'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block">دورة الدفع:</span>
                    <span className="font-bold text-white">
                      {restaurant.subscription.billingCycle === 'annual' ? 'دفع سنوي' : 'دفع شهري'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">قيمة الاشتراك:</span>
                    <span className="font-bold text-amber-400">
                      {restaurant.subscription.price} {restaurant.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاريخ التجديد القادم:</span>
                    <span className="font-bold text-white">{restaurant.subscription.renewalDate}</span>
                  </div>
                </div>
              </div>

              {/* Payments History */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">سجل المدفوعات المسجلة:</h4>
                {payments.length === 0 ? (
                  <div className="text-slate-500 p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    لا توجد مدفوعات مسجلة بعد.
                  </div>
                ) : (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {p.amount} {p.currency} ({p.paymentMethod})
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          التاريخ: {p.date} • المرجع: {p.referenceNumber || 'لا يوجد'}
                        </div>
                      </div>
                      <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        دفعة مسجلة يدوياً
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">إضافة طاولة جديدة</h3>
              <button onClick={() => setShowTableModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم الطاولة *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طاولة 5 أو VIP 2"
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم / موقع الطاولة:</label>
                <input
                  type="text"
                  placeholder="مثال: الصالة العائلية أو التراس الخارجي"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">السعة (عدد الأشخاص):</label>
                  <input
                    type="number"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">المنطقة:</label>
                  <select
                    value={tableLocation}
                    onChange={(e) =>
                      setTableLocation(e.target.value as 'indoor' | 'outdoor' | 'vip' | 'terrace')
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="indoor">داخلي (Indoor)</option>
                    <option value="outdoor">خارجي (Outdoor)</option>
                    <option value="vip">VIP خاص</option>
                    <option value="terrace">تراس (Terrace)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow"
                >
                  حفظ الطاولة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal (Create or Edit) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'تعديل بيانات التصنيف السحابي' : 'إضافة تصنيف جديد للمنيو'}
              </h3>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">اسم التصنيف بالعربية *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: البرجر، المشاوي، المشروبات"
                  value={categoryNameAr}
                  onChange={(e) => setCategoryNameAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الاسم بالإنجليزية (اختياري):</label>
                <input
                  type="text"
                  placeholder="e.g. Burgers, Grills, Drinks"
                  value={categoryNameEn}
                  onChange={(e) => setCategoryNameEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رمز تعبيري (Emoji):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🍔"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center text-base"
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    {['🍔', '🍕', '🥩', '🍟', '🥗', '🍰', '☕', '🥤', '🥪'].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setCategoryIcon(emoji)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryIsActive}
                    onChange={(e) => setCategoryIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span className="text-slate-300">تفعيل القسم وإظهاره للزبائن في المنيو العام</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(false);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow cursor-pointer"
                >
                  {editingCategory ? 'تحديث التصنيف السحابي' : 'حفظ التصنيف في Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'تعديل بيانات الصنف' : 'إضافة طبق أو مشروب جديد'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">اسم الطبق بالعربية *:</label>
                  <input
                    type="text"
                    required
                    value={itemNameAr}
                    onChange={(e) => setItemNameAr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">التصنيف *:</label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الوصف والمكونات:</label>
                <textarea
                  rows={2}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">السعر ({restaurant.currency}) *:</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">سعر الخصم (اختياري):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={itemDiscountPrice || ''}
                    onChange={(e) =>
                      setItemDiscountPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">السعرات الحرارية:</label>
                  <input
                    type="number"
                    value={itemCalories || ''}
                    onChange={(e) =>
                      setItemCalories(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-300">رابط صورة الصنف (Image URL):</label>
                  <span className="text-[10px] text-amber-400">يدعم روابط Unsplash والويب المباشرة</span>
                </div>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
                {/* Instant Image Presets */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    أو اختر صورة طبق جاهزة عالية الجودة بنقرة واحدة:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {[
                      {
                        label: '🍔 برجر لحم',
                        url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🍕 بيتزا إيطالية',
                        url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🥩 مشاوي وشاورما',
                        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🍟 مقبلات وبطاطس',
                        url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🥗 سلطة سيزر',
                        url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🍰 تشيز كيك وحلى',
                        url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '☕ قهوة ومشروبات',
                        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=450&fit=crop&q=80',
                      },
                      {
                        label: '🥤 عصير فريش',
                        url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=450&fit=crop&q=80',
                      },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setItemImageUrl(preset.url)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsFeatured}
                    onChange={(e) => setItemIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>تمييز الصنف بشارة "الأكثر طلباً ⭐"</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-xl shadow"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

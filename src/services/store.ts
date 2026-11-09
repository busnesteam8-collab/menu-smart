import {
  Restaurant,
  Category,
  MenuItem,
  Order,
  Review,
  SubscriptionPlan,
  CartItem,
  OrderType,
  PlatformStaff,
  ActivityLog,
  ManualPaymentRecord,
  SubscriptionHistoryItem,
  WebsiteContent,
  PlatformSettings,
  RestaurantTable,
  MenuAppearance,
  StaffPermission,
  RestaurantStatus,
} from '../types';

export const PRIMARY_SUPER_ADMIN_EMAIL = 'busnesteam8@gmail.com';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    nameAr: 'باقة البداية',
    nameEn: 'Starter Plan',
    descriptionAr: 'مثالية للكافيهات والمطاعم الصغيرة وعربات الطعام Food Trucks التي تبدأ مسيرتها الرقمية.',
    monthlyPrice: 149,
    annualPrice: 1430,
    annualDiscountPercent: 20,
    currency: 'ج.م',
    popular: false,
    itemLimit: 50,
    categoryLimit: 8,
    tableLimit: 10,
    branchLimit: 1,
    userLimit: 2,
    isActive: true,
    sortOrder: 1,
    isDefault: true,
    features: [
      'منيو إلكتروني تفاعلي سريع',
      'عدد حتى 50 صنف في المنيو',
      'توليد رمز QR عالي الجودة للطباعة',
      'تلقي الطلبات مباشرة عبر الواتساب',
      'تحديث الأسعار والأصناف فورياً',
      'دعم فني سريع عبر الواتساب',
    ],
    featureFlags: {
      qrStudio: true,
      tableOrdering: true,
      whatsappDirect: true,
      reviewsSystem: false,
      analytics: false,
      customDomain: false,
      appearanceCustomization: false,
      multiLanguage: false,
      exportReports: false,
    },
  },
  {
    id: 'pro',
    nameAr: 'باقة المحترفين',
    nameEn: 'Pro Plan',
    descriptionAr: 'الأكثر شعبية للمطاعم النشطة، مع خيارات الطاولات والتقييمات وإحصائيات متقدمة.',
    monthlyPrice: 289,
    annualPrice: 2770,
    annualDiscountPercent: 20,
    currency: 'ج.م',
    popular: true,
    badge: 'الأكثر اختياراً',
    itemLimit: 250,
    categoryLimit: 25,
    tableLimit: 50,
    branchLimit: 3,
    userLimit: 5,
    isActive: true,
    sortOrder: 2,
    isDefault: false,
    features: [
      'جميع مزايا باقة البداية',
      'أصناف وتصنيفات موسعة (250 صنف)',
      'توليد رموز QR مخصصة لكل طاولة على حدة',
      'خيارات متقدمة للإضافات والأحجام (Sizes & Add-ons)',
      'نظام تقييمات العملاء وإدارتها',
      'إحصائيات تفاعلية للزيارات والأصناف الأكثر طلباً',
      'تخصيص كامل لألوان وهوية المنيو (Appearance Studio)',
      'دعم العملاء ذو أولوية 24/7',
    ],
    featureFlags: {
      qrStudio: true,
      tableOrdering: true,
      whatsappDirect: true,
      reviewsSystem: true,
      analytics: true,
      customDomain: false,
      appearanceCustomization: true,
      multiLanguage: true,
      exportReports: true,
    },
  },
  {
    id: 'enterprise',
    nameAr: 'باقة الشركات والسلاسل',
    nameEn: 'Enterprise Plan',
    descriptionAr: 'لسلاسل المطاعم المتعددة الفروع والماركات التجارية الكبرى مع دعم مخصص.',
    monthlyPrice: 599,
    annualPrice: 5750,
    annualDiscountPercent: 20,
    currency: 'ج.م',
    popular: false,
    badge: 'للسلاسل والفروع',
    itemLimit: 1000,
    categoryLimit: 100,
    tableLimit: 200,
    branchLimit: 15,
    userLimit: 20,
    isActive: true,
    sortOrder: 3,
    isDefault: false,
    features: [
      'جميع مزايا باقة المحترفين',
      'إدارة حتى 15 فرعاً من لوحة تحكم واحدة',
      'أصناف غير محدودة وحسابات متعددة للموظفين',
      'ربط نطاق مخصص (Custom Domain)',
      'تقارير تحليلية معمقة للمبيعات وتفضيلات الزوار',
      'مدير حساب مخصص وتدريب لفريق العمل',
      'نسخ احتياطي يومي ومعدل تشغيل 99.9%',
    ],
    featureFlags: {
      qrStudio: true,
      tableOrdering: true,
      whatsappDirect: true,
      reviewsSystem: true,
      analytics: true,
      customDomain: true,
      appearanceCustomization: true,
      multiLanguage: true,
      exportReports: true,
    },
  },
];

export const INITIAL_WEBSITE_CONTENT: WebsiteContent = {
  platformName: 'Menu Smart',
  platformSlogan: 'منصة إدارة منيوهات المطاعم الذكية',
  platformDescription: 'منصة سحابية متكاملة تمنح مطعمك منيو QR إلكتروني فائق السرعة، ونظام طلبات مباشر عبر الواتساب بدون عمولات، ولوحة تحكم ذكية لإدارة الفروع والأصناف بلحظة.',
  logoUrl: '',
  supportPhone: '+966501234567',
  supportWhatsApp: '966501234567',
  supportEmail: 'support@menusmart.app',
  currency: 'ج.م',
  socialLinks: {
    twitter: 'https://twitter.com/menusmart',
    instagram: 'https://instagram.com/menusmart',
    linkedin: 'https://linkedin.com/company/menusmart',
  },
  hero: {
    badge: 'الجيل القادم من منيوهات المطاعم والكافيهات الذكية',
    title: 'حوّل منيو مطعمك إلى',
    highlight: 'تجربة ذكية تفاعلية',
    subtitle: 'منصة سحابية متطورة تمنح مطعمك منيو QR فائق السرعة، مع خيارات الإضافات والأحجام، ورموز QR مخصصة للطاولات، واستقبال الطلبات منسقة على واتساب بلحظة واحدة وبدون عمولات.',
    primaryCtaText: 'ابدأ تجربتك المجانية (14 يوماً)',
    secondaryCtaText: 'تجرِبة المنيو التفاعلي كعميل',
  },
  sectionsVisibility: {
    hero: true,
    interactivePreview: true,
    stats: true,
    features: true,
    howItWorks: true,
    pricing: true,
    faq: true,
    cta: true,
  },
  features: [
    {
      id: 'f1',
      title: 'استوديو رموز QR مخصص للطاولات',
      description: 'أنشئ رموز QR ذكية مخصصة برقم كل طاولة وبألوان علامتك التجارية، مع إمكانية التنزيل والطباعة المباشرة لكروت الطاولات.',
      icon: 'QrCode',
    },
    {
      id: 'f2',
      title: 'طلب فوري عبر WhatsApp بدون وسيط',
      description: 'يصل الطلب لمحادثة واتساب مطعمك منسقاً بدقة متناهية: رقم الطاولة، الأصناف، الإضافات، والأسعار مع المجموع النهائي.',
      icon: 'MessageCircle',
    },
    {
      id: 'f3',
      title: 'تحديث فوري للأسعار ونفاد الأصناف',
      description: 'وداعاً لإعادة طباعة المنيو الورقي المرهقة والمكلفة. عدل الأسعار وعطّل الأصناف المنتهية بلحظة واحدة من هاتفك.',
      icon: 'Zap',
    },
    {
      id: 'f4',
      title: 'نظام تقييمات العملاء وحماية السمعة',
      description: 'اجمع آراء وتقييمات زوار مطعمك، مع تحكم كامل لاعتماد التقييمات أو الرد على ملاحظات الزبائن لبناء ولاء دائم.',
      icon: 'Star',
    },
    {
      id: 'f5',
      title: 'إحصائيات حية للأطباق والزيارات',
      description: 'اكتشف الأطباق الأكثر مبيعاً والأوقات الأكثر إقبالاً، مع تتبع دقيق لعدد الزيارات والطلبات المنفذة عبر الواتساب.',
      icon: 'TrendingUp',
    },
    {
      id: 'f6',
      title: 'عزل أمني تام للمستأجرين Multi-Tenant',
      description: 'بيانات كل مطعم معزولة تماماً برقم فريد، ولا يمكن لأي مطعم أو طرف ثالث الوصول لبيانات أو تقارير غيره.',
      icon: 'Layers',
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: 'سجل مطعمك وأضف الأصناف',
      description: 'أدخل اسم مطعمك ورقم الواتساب، ثم أضف تصنيفاتك وأطباقك مع الصور والأسعار والإضافات بسهولة تامة.',
    },
    {
      step: 2,
      title: 'اطبع رموز الـ QR للطاولات',
      description: 'ولد رموز الـ QR الجذابة للطاولات أو الكاونتر بلمسة زر، واطبع كروت أنيقة لعملائك ليمسحوها بهواتفهم.',
    },
    {
      step: 3,
      title: 'استقبل الطلبات على واتساب',
      description: 'يتصفح العملاء المنيو ويرسلون طلباتهم مباشرة إلى رقم واتساب مطعمك بدون أي تطبيقات أو وسطاء.',
    },
  ],
  faqs: [
    {
      id: 'faq1',
      question: 'هل أحتاج لشراء أجهزة كاشير أو تابلت معقدة لتشغيل المنصة؟',
      answer: 'إطلاقاً! منصة Menu Smart سحابية بالكامل وتعمل على أي هاتف ذكي، كمبيوتر، أو لابتوب لديك. لا حاجة لتنزيل تطبيقات أو شراء أجهزة مكلفة، وتستقبل الطلبات مباشرة على رقم الواتساب الخاص بمطعمك.',
    },
    {
      id: 'faq2',
      question: 'كيف تصل طلبات الزبائن إلى المطعم؟',
      answer: 'عندما يختار العميل أصنافه وملاحظاته وطاولته من المنيو الرقمي، يضغط على زر "إرسال الطلب عبر واتساب"، فيتم إنشاء رسالة واتساب منسقة ومفصلة آلياً تحتوي على اسم العميل ورقم طاولته والأصناف والمجموع مع الضريبة مباشرة لمحادثة مطعمك.',
    },
    {
      id: 'faq3',
      question: 'هل تأخذ منصة Menu Smart أي نسبة أو عمولة من مبيعاتي؟',
      answer: 'صفر بالمائة (0%) عمولة! نحن نؤمن بأن أرباح مبيعاتك حق لك بالكامل. نظامنا يعتمد على اشتراك شهري أو سنوي ثابت فقط بدون أي رسوم خفية على المبيعات إطلاقاً.',
    },
    {
      id: 'faq4',
      question: 'هل يمكنني توليد رموز QR مختلفة لكل طاولة على حدة؟',
      answer: 'نعم! لوحة تحكم مطعمك تتيح لك بضغطة زر توليد رمز QR مخصص لكل طاولة (طاولة 1، طاولة 2...). عندما يمسح العميل الرمز، يظهر رقم طاولته تلقائياً في الطلب ليعرف فريق العمل مكان تقديم الطلب بدقة.',
    },
    {
      id: 'faq5',
      question: 'ماذا لو احتجت لتغيير سعر طبق أو إيقاف صنف نفد من المطبخ؟',
      answer: 'يتم التحديث فوراً في أجزاء من الثانية! افتح لوحة تحكم المطعم وعطّل الصنف أو عدل سعره بضغطة واحدة، وسيظهر التغيير مباشرة لكل عميل يفتح المنيو دون الحاجة لإعادة طباعة أي أوراق.',
    },
    {
      id: 'faq6',
      question: 'هل يمكنني تجربة المنصة قبل الدفع؟',
      answer: 'نعم، نوفر فترة تجريبية مجانية بالكامل لمدة 14 يوماً مع كافة المزايا المتقدمة لتجربة المنصة في مطعمك واكتشاف كيف تضاعف راحة عملائك وفريقك.',
    },
  ],
  seo: {
    metaTitle: 'Menu Smart - منصة إدارة منيوهات المطاعم الذكية',
    metaDescription: 'منصة SaaS سحابية متكاملة متعددة المستأجرين (Multi-Tenant) لإدارة المنيو الإلكتروني والطلبات عبر الواتساب ورموز QR للمطاعم والكافيهات.',
    keywords: 'منيو إلكتروني, منيو مطاعم, كود qr, منيو باركود, طلبات واتساب, منيو كافيهات, منيو سمارت, saas restaurant menu',
  },
};

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  registrationEnabled: true,
  registrationDisabledMessage: 'عذراً، باب التسجيل لشركاء جدد مغلق مؤقتاً لأعمال الصيانة والتطوير. يرجى التواصل معنا عبر الدعم الفني.',
  freeTrialDays: 14,
  defaultCurrency: 'ج.م',
  defaultTaxPercentage: 14,
  globalAnnouncement: 'مرحباً بكم في منصة Menu Smart! تم إطلاق ميزة استوديو تصميم المظهر المتقدم للمنيو.',
  showGlobalAnnouncement: true,
  whatsappTemplate: 'مرحباً {restaurant_name} 👋 أود تأكيد طلب جديد من المنيو الذكي:',
  applyPriceChangesTo: 'new_only',
  defaultPlanId: 'starter',
  ordersEnabledGlobally: true,
  reviewsEnabledGlobally: true,
};

export const INITIAL_STAFF: PlatformStaff[] = [
  {
    id: 'staff-primary-owner',
    name: 'المالك الرئيسي (Super Admin)',
    email: PRIMARY_SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    permissions: [
      'manage_restaurants',
      'manage_subscriptions',
      'manage_pricing',
      'manage_content',
      'manage_settings',
      'manage_staff',
      'view_analytics',
    ],
    isActive: true,
    createdAt: '2026-01-01',
    lastLogin: '2026-11-05 12:00',
  },
  {
    id: 'staff-2',
    name: 'فريق الدعم والعمليات',
    email: 'support-agent@menusmart.app',
    role: 'staff',
    permissions: ['manage_restaurants', 'manage_subscriptions', 'view_analytics'],
    isActive: true,
    createdAt: '2026-02-15',
    lastLogin: '2026-11-04 18:30',
  },
];

const DEFAULT_MENU_APPEARANCE: MenuAppearance = {
  primaryColor: '#f59e0b', // amber-500
  secondaryColor: '#0f172a', // slate-900
  fontFamily: 'Cairo',
  cardLayout: 'cards',
  showCalories: true,
  showBadges: true,
  showAllergens: true,
  buttonShape: 'rounded',
  backgroundColor: '#020617', // slate-950
  headerStyle: 'banner',
};

const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    slug: 'shawarma-alreef',
    nameAr: 'شاورما ومشاوي الريف',
    nameEn: 'Al-Reef Shawarma & Grill',
    description: 'أشهى ساندوتشات الشاورما على الفحم، ومشاوي حلبية أصيلة مع المقبلات الشامية الطازجة يومياً.',
    cuisineType: 'شاورما ومشاوي شرقية',
    city: 'القاهرة',
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=240&h=240&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=400&fit=crop&q=80',
    phone: '+201012345678',
    whatsappNumber: '201012345678',
    currency: 'ج.م',
    status: 'active',
    access: {
      allowDashboard: true,
      allowPublicMenu: true,
    },
    subscription: {
      planId: 'pro',
      billingCycle: 'annual',
      status: 'active',
      startDate: '2026-01-10',
      renewalDate: '2027-01-10',
      price: 2770,
    },
    settings: {
      enableOrdering: true,
      enableTableOrdering: true,
      enableReviews: true,
      autoApproveReviews: false,
      taxPercentage: 14,
      deliveryFee: 25,
      minimumOrder: 50,
      workingHours: 'يومياً: 12:00 ظهراً - 02:00 بعد منتصف الليل',
      address: 'شارع التسعين، التجمع الخامس، القاهرة',
      city: 'القاهرة',
      instagram: 'shawarma_alreef',
      tiktok: 'alreef_grill',
      themeColor: 'amber',
      wifiName: 'AlReef_Guest',
      wifiPassword: 'WelcomeToAlreef',
    },
    appearance: {
      ...DEFAULT_MENU_APPEARANCE,
      primaryColor: '#f59e0b',
    },
    createdAt: '2026-01-10',
    ownerEmail: 'owner@shawarma-alreef.eg',
    ownerName: 'عبدالرحمن الشهري',
    viewsCount: 3840,
    ordersCount: 420,
  },
  {
    id: 'rest-2',
    slug: 'laprima-cafe',
    nameAr: 'لا بريما سبيشالتي كافيه',
    nameEn: 'La Prima Specialty Coffee',
    description: 'تجربة قهوة مختصة لا تُنسى من أجود محاصيل البن العالمية مع معجنات وحلويات فرنسية فاخرة.',
    cuisineType: 'مقهى ومخبوزات فرنسية',
    city: 'الإسكندرية',
    logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=240&h=240&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&h=400&fit=crop&q=80',
    phone: '+201198765432',
    whatsappNumber: '201198765432',
    currency: 'ج.م',
    status: 'active',
    access: {
      allowDashboard: true,
      allowPublicMenu: true,
    },
    subscription: {
      planId: 'enterprise',
      billingCycle: 'monthly',
      status: 'active',
      startDate: '2026-02-01',
      renewalDate: '2026-12-01',
      price: 599,
    },
    settings: {
      enableOrdering: true,
      enableTableOrdering: true,
      enableReviews: true,
      autoApproveReviews: true,
      taxPercentage: 14,
      deliveryFee: 30,
      minimumOrder: 60,
      workingHours: 'يومياً: 06:30 صباحاً - 12:00 منتصف الليل',
      address: 'طريق الكورنيش، سيدي جابر، الإسكندرية',
      city: 'الإسكندرية',
      instagram: 'laprima_specialty',
      themeColor: 'indigo',
      wifiName: 'LaPrima_Wifi',
      wifiPassword: 'CoffeeIsArt2026',
    },
    appearance: {
      ...DEFAULT_MENU_APPEARANCE,
      primaryColor: '#6366f1', // Indigo
      fontFamily: 'Tajawal',
    },
    createdAt: '2026-02-01',
    ownerEmail: 'manager@laprima.eg',
    ownerName: 'سعود المنصور',
    viewsCount: 5120,
    ordersCount: 685,
  },
  {
    id: 'rest-3',
    slug: 'burger-station',
    nameAr: 'برجر ستيشن آرتيزان',
    nameEn: 'Burger Station Artisan',
    description: 'لحوم أنجوس أسترالية طازجة مع خبز بريوش مخبوز يومياً وصلصاتنا الخاصة المميزة.',
    cuisineType: 'برجر وساندوتشات',
    city: 'الجيزة',
    logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&h=240&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=400&fit=crop&q=80',
    phone: '+201240001122',
    whatsappNumber: '201240001122',
    currency: 'ج.م',
    status: 'pending',
    access: {
      allowDashboard: true,
      allowPublicMenu: false, // In pending approval state, public menu hidden
    },
    subscription: {
      planId: 'starter',
      billingCycle: 'monthly',
      status: 'trial',
      startDate: '2026-11-01',
      renewalDate: '2026-11-15',
      price: 149,
    },
    settings: {
      enableOrdering: true,
      enableTableOrdering: false,
      enableReviews: true,
      autoApproveReviews: false,
      taxPercentage: 15,
      deliveryFee: 10,
      minimumOrder: 20,
      workingHours: 'يومياً: 01:00 ظهراً - 03:00 فجراً',
      address: 'شارع الأمير سلطان، جدة',
      city: 'جدة',
      themeColor: 'orange',
    },
    appearance: {
      ...DEFAULT_MENU_APPEARANCE,
      primaryColor: '#f97316',
    },
    createdAt: '2026-11-01',
    ownerEmail: 'contact@burger-station.sa',
    ownerName: 'فيصل الغامدي',
    viewsCount: 140,
    ordersCount: 8,
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1-1', restaurantId: 'rest-1', nameAr: 'سندوتشات الشاورما', nameEn: 'Shawarma Sandwiches', icon: '🌯', sortOrder: 1, isActive: true },
  { id: 'cat-1-2', restaurantId: 'rest-1', nameAr: 'أطباق المشاوي والمشكل', nameEn: 'Grills & Platters', icon: '🥩', sortOrder: 2, isActive: true },
  { id: 'cat-1-3', restaurantId: 'rest-1', nameAr: 'المقبلات والصلصات', nameEn: 'Appetizers & Dips', icon: '🥗', sortOrder: 3, isActive: true },
  { id: 'cat-1-4', restaurantId: 'rest-1', nameAr: 'المشروبات والعصائر الطازجة', nameEn: 'Beverages & Fresh Juices', icon: '🥤', sortOrder: 4, isActive: true },

  { id: 'cat-2-1', restaurantId: 'rest-2', nameAr: 'قهوة ساخنة ومختصة', nameEn: 'Hot & Specialty Coffee', icon: '☕', sortOrder: 1, isActive: true },
  { id: 'cat-2-2', restaurantId: 'rest-2', nameAr: 'المشروبات الباردة والآيس', nameEn: 'Iced & Cold Drinks', icon: '🧊', sortOrder: 2, isActive: true },
  { id: 'cat-2-3', restaurantId: 'rest-2', nameAr: 'حلويات وكرواسون فرنسي', nameEn: 'Pastries & Desserts', icon: '🥐', sortOrder: 3, isActive: true },
  { id: 'cat-2-4', restaurantId: 'rest-2', nameAr: 'فطور وساندوتشات خفيفة', nameEn: 'Breakfast & Light Sandwiches', icon: '🥪', sortOrder: 4, isActive: true },
];

const INITIAL_ITEMS: MenuItem[] = [
  {
    id: 'item-1-1',
    restaurantId: 'rest-1',
    categoryId: 'cat-1-1',
    nameAr: 'شاورما لحم الريف الملكية',
    nameEn: 'Royal Beef Shawarma',
    descriptionAr: 'شرائح لحم عجل طازج متبل بالبهارات الريفية الخاصة مع الطحينة والبقدونس والبصل المشوي بخبز الصاج.',
    price: 18,
    discountPrice: 15,
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 460,
    prepTime: '8-12 دقائق',
    allergens: ['سمسم', 'غلوتين'],
    sizes: [
      { name: 'عادي (خبز صاج)', price: 15 },
      { name: 'صاروخ كبير', price: 22 },
      { name: 'وجبة عربي مع البطاطس والمخلل', price: 29 },
    ],
    options: [
      {
        name: 'إضافات مفضلة',
        required: false,
        items: [
          { name: 'إضافة جبنة موزاريلا ذائبة', additionalPrice: 4 },
          { name: 'صلصة طحينة إضافية', additionalPrice: 2 },
          { name: 'دبس رمان أصلي', additionalPrice: 2 },
          { name: 'شطة ريفية حارة', additionalPrice: 1 },
        ],
      },
    ],
  },
  {
    id: 'item-1-2',
    restaurantId: 'rest-1',
    categoryId: 'cat-1-1',
    nameAr: 'شاورما دجاج مدخن على الفحم',
    nameEn: 'Smoked Chicken Shawarma',
    descriptionAr: 'دجاج متبل بخلطة الثوم والليمون مشوي على الفحم مع صوص الثومية الفاخر والبطاطس المقرمشة.',
    price: 14,
    imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 420,
    prepTime: '6-10 دقائق',
    allergens: ['غلوتين', 'بيض'],
  },
  {
    id: 'item-1-3',
    restaurantId: 'rest-1',
    categoryId: 'cat-1-2',
    nameAr: 'صحن كباب حلبي مشكل فاخر (نصف كيلو)',
    nameEn: 'Halabi Mixed Kebab Platter',
    descriptionAr: 'تشكيلة مميزة من كباب اللحم البلدي وكباب الدجاج وأوصال اللحم مع البصل المشوي والطماطم والخبز المحمص.',
    price: 78,
    discountPrice: 69,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 820,
    prepTime: '18-25 دقيقة',
    allergens: ['غلوتين'],
  },
  {
    id: 'item-1-4',
    restaurantId: 'rest-1',
    categoryId: 'cat-1-3',
    nameAr: 'حمص بيروتي باللحمة والصنوبر',
    nameEn: 'Hummus with Minced Meat & Pine Nuts',
    descriptionAr: 'حمص ناعم بزيت الزيتون البكر مع لحم مفروم محمر وصنوبر ذهبي محمص يقدم مع خبز ساخن.',
    price: 24,
    imageUrl: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: false,
    calories: 380,
    prepTime: '5 دقائق',
    allergens: ['سمسم', 'مكسرات'],
  },
  {
    id: 'item-1-5',
    restaurantId: 'rest-1',
    categoryId: 'cat-1-4',
    nameAr: 'عصير رمان طبيعي طازج مع النعناع',
    nameEn: 'Fresh Pomegranate Juice',
    descriptionAr: 'عصير رمان بلدي معصور طازج بدون أي إضافات سكر مع أوراق النعناع المنعشة.',
    price: 16,
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: false,
    calories: 140,
    prepTime: '3 دقائق',
  },

  {
    id: 'item-2-1',
    restaurantId: 'rest-2',
    categoryId: 'cat-2-1',
    nameAr: 'فلات وايت إثيوبي فاخر (Flat White)',
    nameEn: 'Specialty Ethiopian Flat White',
    descriptionAr: 'دبل شوت إسبريسو من محصول قوجي الإثيوبي المعالج تجفيفياً مع حليب مبخر ناعم برسمة لاتي آرت.',
    price: 21,
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 130,
    prepTime: '4 دقائق',
    allergens: ['لاكتوز'],
  },
  {
    id: 'item-2-2',
    restaurantId: 'rest-2',
    categoryId: 'cat-2-1',
    nameAr: 'قهوة مقطرة V60 كولومبي هويلا',
    nameEn: 'V60 Drip Colombian Huila',
    descriptionAr: 'استخلاص يدوي متقن بإيحاءات الشوكولاتة الداكنة والحمضيات اللطيفة، قوام متوازن ومميز.',
    price: 24,
    discountPrice: 20,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 5,
    prepTime: '6 دقائق',
  },
  {
    id: 'item-2-3',
    restaurantId: 'rest-2',
    categoryId: 'cat-2-2',
    nameAr: 'سبانش لاتيه مثلج مميز (Iced Spanish Latte)',
    nameEn: 'Signature Iced Spanish Latte',
    descriptionAr: 'المشروب البارد الأكثر طلباً بمزيج الحليب المكثف المحلى المكرمل مع الإسبريسو المركز وقطع الثلج.',
    price: 26,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 280,
    prepTime: '3 دقائق',
    allergens: ['لاكتوز'],
  },
  {
    id: 'item-2-4',
    restaurantId: 'rest-2',
    categoryId: 'cat-2-3',
    nameAr: 'سان سباستيان تشيز كيك مع صوص الشوكولاتة',
    nameEn: 'San Sebastian Cheesecake with Belgian Chocolate',
    descriptionAr: 'كعكة الجبن الإسبانية المحروقة الغنية والطرية تقدم دافئة مع سكب صوص الشوكولاتة البلجيكية الفاخرة.',
    price: 32,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=450&fit=crop&q=80',
    isAvailable: true,
    isFeatured: true,
    calories: 490,
    prepTime: '3 دقائق',
    allergens: ['بيض', 'لاكتوز', 'غلوتين'],
  },
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    restaurantId: 'rest-1',
    customerName: 'عبدالرحمن الشهري',
    rating: 5,
    comment: 'شاورما اللحم ممتازة جداً وخبز الصاج خفيف ومقرمش، التغليف نظيف والطلب وصل بالوقت المحدد!',
    isApproved: true,
    reply: 'أهلاً بك أخي عبدالرحمن، نسعد دائماً بخدمتك ونتطلع لزيارتك القادمة!',
    createdAt: '2026-11-01',
  },
  {
    id: 'rev-2',
    restaurantId: 'rest-1',
    customerName: 'سارة العتيبي',
    rating: 5,
    comment: 'أفضل كباب حلبي في الرياض بدون منازع، الطعم متقن والخدمة عبر الواتساب سريعة جداً.',
    isApproved: true,
    createdAt: '2026-11-03',
  },
  {
    id: 'rev-3',
    restaurantId: 'rest-1',
    customerName: 'فهد القحطاني',
    rating: 4,
    comment: 'الأكل لذيذ وجودة اللحم عالية، أتمنى زيادة فروعكم في شرق الرياض.',
    isApproved: false,
    createdAt: '2026-11-04',
  },
  {
    id: 'rev-4',
    restaurantId: 'rest-2',
    customerName: 'نورة الدوسري',
    rating: 5,
    comment: 'الفلات وايت موزون بطريقة احترافية وحبات البن ممتازة، التشيز كيك خفيف ولذيذ جداً.',
    isApproved: true,
    reply: 'شكراً لكِ نورة، رضاكم غايتنا ونسعد بتقديم أعلى معايير القهوة المختصة.',
    createdAt: '2026-11-02',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    restaurantId: 'rest-1',
    orderNumber: '#1042',
    orderType: 'dine_in',
    tableNumber: 'الطاولة رقم 4',
    customerName: 'محمد الدوسري',
    customerPhone: '0501112233',
    items: [
      {
        cartItemId: 'c1',
        menuItemId: 'item-1-1',
        nameAr: 'شاورما لحم الريف الملكية',
        nameEn: 'Royal Beef Shawarma',
        unitPrice: 22,
        quantity: 2,
        selectedSize: { name: 'صاروخ كبير', price: 22 },
        imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=80',
      },
      {
        cartItemId: 'c2',
        menuItemId: 'item-1-5',
        nameAr: 'عصير رمان طبيعي طازج مع النعناع',
        nameEn: 'Fresh Pomegranate Juice',
        unitPrice: 16,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&h=450&fit=crop&q=80',
      },
    ],
    subtotal: 76,
    tax: 11.4,
    deliveryFee: 0,
    total: 87.4,
    status: 'completed',
    createdAt: '2026-11-05 10:15',
  },
];

const INITIAL_TABLES: RestaurantTable[] = [
  { id: 'tbl-1-1', restaurantId: 'rest-1', tableNumber: 'طاولة 1', nameAr: 'الصالة الداخلية', capacity: 4, location: 'indoor', isActive: true },
  { id: 'tbl-1-2', restaurantId: 'rest-1', tableNumber: 'طاولة 2', nameAr: 'بجوار النافذة', capacity: 2, location: 'indoor', isActive: true },
  { id: 'tbl-1-3', restaurantId: 'rest-1', tableNumber: 'طاولة 3', nameAr: 'جلسة عائلية VIP', capacity: 8, location: 'vip', isActive: true },
  { id: 'tbl-1-4', restaurantId: 'rest-1', tableNumber: 'طاولة 4', nameAr: 'التراس الخارجي', capacity: 4, location: 'outdoor', isActive: true },

  { id: 'tbl-2-1', restaurantId: 'rest-2', tableNumber: 'بار القهوة 1', nameAr: 'كاونتر الإسبريسو', capacity: 2, location: 'indoor', isActive: true },
  { id: 'tbl-2-2', restaurantId: 'rest-2', tableNumber: 'طاولة 2', nameAr: 'جلسة هادئة للعمل', capacity: 2, location: 'indoor', isActive: true },
  { id: 'tbl-2-3', restaurantId: 'rest-2', tableNumber: 'طاولة 3 خارجية', nameAr: 'التراس المفتوح', capacity: 4, location: 'terrace', isActive: true },
];

const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-05 11:30',
    actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
    actorName: 'Super Admin',
    category: 'settings',
    action: 'تهيئة منصة Menu Smart السحابية',
    details: 'تم تحديث إعدادات المنصة وتفعيل أنظمة الاشتراكات الديناميكية وعزل المستأجرين.',
  },
  {
    id: 'log-2',
    timestamp: '2026-11-05 11:45',
    actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
    actorName: 'Super Admin',
    category: 'subscriptions',
    action: 'تفعيل اشتراك شاورما الريف',
    details: 'تم تفعيل باقة المحترفين السنوية لمطعم شاورما ومشاوي الريف (rest-1).',
    targetId: 'rest-1',
  },
];

const STORAGE_KEYS = {
  RESTAURANTS: 'menusmart_restaurants_v2',
  CATEGORIES: 'menusmart_categories_v2',
  ITEMS: 'menusmart_items_v2',
  REVIEWS: 'menusmart_reviews_v2',
  ORDERS: 'menusmart_orders_v2',
  PLANS: 'menusmart_plans_v2',
  WEBSITE: 'menusmart_website_v2',
  SETTINGS: 'menusmart_settings_v2',
  STAFF: 'menusmart_staff_v2',
  LOGS: 'menusmart_logs_v2',
  PAYMENTS: 'menusmart_payments_v2',
  TABLES: 'menusmart_tables_v2',
};

class StoreService {
  private restaurants: Restaurant[] = [];
  private categories: Category[] = [];
  private items: MenuItem[] = [];
  private reviews: Review[] = [];
  private orders: Order[] = [];
  private plans: SubscriptionPlan[] = [];
  private websiteContent: WebsiteContent = INITIAL_WEBSITE_CONTENT;
  private platformSettings: PlatformSettings = INITIAL_PLATFORM_SETTINGS;
  private staff: PlatformStaff[] = [];
  private activityLogs: ActivityLog[] = [];
  private manualPayments: ManualPaymentRecord[] = [];
  private tables: RestaurantTable[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof localStorage === 'undefined') {
        this.restaurants = INITIAL_RESTAURANTS;
        this.categories = INITIAL_CATEGORIES;
        this.items = INITIAL_ITEMS;
        this.reviews = INITIAL_REVIEWS;
        this.orders = INITIAL_ORDERS;
        this.plans = INITIAL_PLANS;
        this.websiteContent = INITIAL_WEBSITE_CONTENT;
        this.platformSettings = INITIAL_PLATFORM_SETTINGS;
        this.staff = INITIAL_STAFF;
        this.activityLogs = INITIAL_ACTIVITY_LOGS;
        this.tables = INITIAL_TABLES;
        return;
      }
      const storedRest = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
      this.restaurants = storedRest ? JSON.parse(storedRest) : INITIAL_RESTAURANTS;

      const storedCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      this.categories = storedCat ? JSON.parse(storedCat) : INITIAL_CATEGORIES;

      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      this.items = storedItems ? JSON.parse(storedItems) : INITIAL_ITEMS;

      const storedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      this.reviews = storedReviews ? JSON.parse(storedReviews) : INITIAL_REVIEWS;

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = storedOrders ? JSON.parse(storedOrders) : INITIAL_ORDERS;

      const storedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      this.plans = storedPlans ? JSON.parse(storedPlans) : INITIAL_PLANS;

      const storedWeb = localStorage.getItem(STORAGE_KEYS.WEBSITE);
      this.websiteContent = storedWeb ? JSON.parse(storedWeb) : INITIAL_WEBSITE_CONTENT;

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.platformSettings = storedSettings ? JSON.parse(storedSettings) : INITIAL_PLATFORM_SETTINGS;

      const storedStaff = localStorage.getItem(STORAGE_KEYS.STAFF);
      this.staff = storedStaff ? JSON.parse(storedStaff) : INITIAL_STAFF;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.activityLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_ACTIVITY_LOGS;

      const storedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      this.manualPayments = storedPayments ? JSON.parse(storedPayments) : [];

      const storedTables = localStorage.getItem(STORAGE_KEYS.TABLES);
      this.tables = storedTables ? JSON.parse(storedTables) : INITIAL_TABLES;

      // Migrate existing cached items to Egyptian Pound (ج.م) and normalize access schema
      this.plans = this.plans.map((p) => ({
        ...p,
        currency: p.currency === 'ر.س' ? 'ج.م' : p.currency || 'ج.م',
      }));
      this.restaurants = this.restaurants.map((r: any) => ({
        ...r,
        currency: r.currency === 'ر.س' ? 'ج.م' : r.currency || 'ج.م',
        access: {
          allowDashboard: r.access?.allowDashboard ?? (r as any).allowDashboardAccess ?? true,
          allowPublicMenu: r.access?.allowPublicMenu ?? true,
        },
      }));
      if (this.platformSettings && this.platformSettings.defaultCurrency === 'ر.س') {
        this.platformSettings.defaultCurrency = 'ج.م';
      }
      if (this.websiteContent && this.websiteContent.currency === 'ر.س') {
        this.websiteContent.currency = 'ج.م';
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seed data', e);
      this.restaurants = INITIAL_RESTAURANTS;
      this.categories = INITIAL_CATEGORIES;
      this.items = INITIAL_ITEMS;
      this.reviews = INITIAL_REVIEWS;
      this.orders = INITIAL_ORDERS;
      this.plans = INITIAL_PLANS;
      this.websiteContent = INITIAL_WEBSITE_CONTENT;
      this.platformSettings = INITIAL_PLATFORM_SETTINGS;
      this.staff = INITIAL_STAFF;
      this.activityLogs = INITIAL_ACTIVITY_LOGS;
      this.tables = INITIAL_TABLES;
    }
  }

  private saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(this.restaurants));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(this.items));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
      localStorage.setItem(STORAGE_KEYS.WEBSITE, JSON.stringify(this.websiteContent));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.platformSettings));
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staff));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.activityLogs));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(this.manualPayments));
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(this.tables));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Activity Logs ---
  public logActivity(log: {
    actorEmail: string;
    actorName: string;
    category: ActivityLog['category'];
    action: string;
    details: string;
    targetId?: string;
  }) {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ...log,
    };
    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 200) {
      this.activityLogs = this.activityLogs.slice(0, 200);
    }
    this.saveState();
  }

  public getActivityLogs(): ActivityLog[] {
    return [...this.activityLogs];
  }

  // --- Dynamic Subscription Plans Management ---
  public getPlans(): SubscriptionPlan[] {
    return [...this.plans].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public setPlansFromFirestore(plans: SubscriptionPlan[]) {
    if (Array.isArray(plans) && plans.length > 0) {
      this.plans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
      this.saveState();
      this.notify();
    }
  }

  public getActivePlans(): SubscriptionPlan[] {
    return this.getPlans().filter((p) => p.isActive);
  }

  public getPlanById(id: string): SubscriptionPlan | undefined {
    return this.plans.find((p) => p.id === id);
  }

  public savePlan(plan: SubscriptionPlan, actor: string = 'Super Admin') {
    const idx = this.plans.findIndex((p) => p.id === plan.id);
    const isNew = idx === -1;
    if (isNew) {
      this.plans.push(plan);
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'pricing',
        action: `إنشاء باقة جديدة: ${plan.nameAr}`,
        details: `تم إنشاء الباقة بسعر شهري ${plan.monthlyPrice} ${plan.currency} وسنوي ${plan.annualPrice} ${plan.currency}.`,
        targetId: plan.id,
      });
    } else {
      this.plans[idx] = plan;
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'pricing',
        action: `تعديل باقة: ${plan.nameAr}`,
        details: `تم تحديث أسعار ومميزات باقة ${plan.nameAr}.`,
        targetId: plan.id,
      });
    }

    // If marked as default, unset others
    if (plan.isDefault) {
      this.plans.forEach((p) => {
        if (p.id !== plan.id) p.isDefault = false;
      });
    }

    this.saveState();
  }

  public deletePlan(planId: string, actor: string = 'Super Admin') {
    const plan = this.plans.find((p) => p.id === planId);
    this.plans = this.plans.filter((p) => p.id !== planId);
    this.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: actor,
      category: 'pricing',
      action: `حذف باقة: ${plan?.nameAr || planId}`,
      details: `تم حذف الباقة نهائياً من قائمة الأسعار.`,
      targetId: planId,
    });
    this.saveState();
  }

  // --- Website Content Management (CMS) ---
  public getWebsiteContent(): WebsiteContent {
    return { ...this.websiteContent };
  }

  public updateWebsiteContent(content: Partial<WebsiteContent>, actor: string = 'Super Admin') {
    this.websiteContent = {
      ...this.websiteContent,
      ...content,
    };
    this.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: actor,
      category: 'content',
      action: 'تحديث محتوى الموقع الرئيسي (Website Content)',
      details: 'تم حفظ ونشر التعديلات على نصوص وأقسام الموقع الرئيسي فوراً.',
    });
    this.saveState();
  }

  // --- Platform Settings ---
  public getPlatformSettings(): PlatformSettings {
    return { ...this.platformSettings };
  }

  public setPlatformSettingsFromFirestore(settings: PlatformSettings) {
    if (settings && typeof settings === 'object') {
      this.platformSettings = {
        ...this.platformSettings,
        ...settings,
      };
      this.saveState();
      this.notify();
    }
  }

  public updatePlatformSettings(settings: Partial<PlatformSettings>, actor: string = 'Super Admin') {
    this.platformSettings = {
      ...this.platformSettings,
      ...settings,
    };
    this.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: actor,
      category: 'settings',
      action: 'تعديل الإعدادات العامة للمنصة',
      details: 'تم تحديث إعدادات التسجيل والعملات والضرائب وشريط الإعلانات.',
    });
    this.saveState();
  }

  // --- Staff & Permissions Management ---
  public getStaff(): PlatformStaff[] {
    return [...this.staff];
  }

  public saveStaffMember(member: PlatformStaff, actor: string = 'Super Admin') {
    // Primary owner cannot be downgraded or removed
    if (member.email === PRIMARY_SUPER_ADMIN_EMAIL) {
      member.role = 'super_admin';
      member.isActive = true;
      member.permissions = [
        'manage_restaurants',
        'manage_subscriptions',
        'manage_pricing',
        'manage_content',
        'manage_settings',
        'manage_staff',
        'view_analytics',
      ];
    }

    const idx = this.staff.findIndex((s) => s.id === member.id);
    if (idx !== -1) {
      this.staff[idx] = member;
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'staff',
        action: `تعديل صلاحيات الموظف: ${member.name}`,
        details: `الصلاحيات الحالية: ${member.permissions.join(', ')}`,
        targetId: member.id,
      });
    } else {
      this.staff.push(member);
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'staff',
        action: `إضافة موظف/مدير جديد: ${member.name}`,
        details: `البريد: ${member.email} - الدور: ${member.role}`,
        targetId: member.id,
      });
    }
    this.saveState();
  }

  public deleteStaffMember(id: string, actor: string = 'Super Admin') {
    const member = this.staff.find((s) => s.id === id);
    if (member?.email === PRIMARY_SUPER_ADMIN_EMAIL) {
      throw new Error('لا يمكن حذف حساب المالك الرئيسي للمنصة.');
    }
    this.staff = this.staff.filter((s) => s.id !== id);
    this.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: actor,
      category: 'staff',
      action: `حذف حساب الموظف: ${member?.name}`,
      details: `تم إلغاء صلاحيات الحساب: ${member?.email}`,
      targetId: id,
    });
    this.saveState();
  }

  // --- Multi-Tenant Restaurants Management ---
  public getAllRestaurants(): Restaurant[] {
    return [...this.restaurants];
  }

  public setRestaurantsFromFirestore(restaurants: Restaurant[]) {
    if (Array.isArray(restaurants) && restaurants.length > 0) {
      this.restaurants = [...restaurants];
      this.saveState();
      this.notify();
    }
  }

  public upsertRestaurantFromFirestore(restaurant: Restaurant) {
    if (restaurant && restaurant.id) {
      const idx = this.restaurants.findIndex((r) => r.id === restaurant.id);
      if (idx >= 0) {
        this.restaurants[idx] = { ...this.restaurants[idx], ...restaurant };
      } else {
        this.restaurants.push(restaurant);
      }
      this.saveState();
      this.notify();
    }
  }

  public deleteRestaurant(id: string, actor: string = 'Super Admin') {
    const r = this.getRestaurantById(id);
    this.restaurants = this.restaurants.filter((res) => res.id !== id);
    if (r) {
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'restaurants',
        action: `حذف مطعم: ${r.nameAr}`,
        details: `تم حذف المطعم بالكامل (${r.slug}) - المعرف: ${r.id}`,
        targetId: r.id,
      });
    }
    this.saveState();
    this.notify();
  }

  public getRestaurantById(id: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.id === id);
  }

  public getRestaurantBySlug(slug: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.slug.toLowerCase() === slug.toLowerCase());
  }

  public incrementRestaurantViews(id: string) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.viewsCount = (r.viewsCount || 0) + 1;
      this.saveState();
    }
  }

  public updateRestaurantStatus(id: string, status: RestaurantStatus, actor: string = 'Super Admin') {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.status = status;
      if (status === 'blocked' || status === 'suspended') {
        r.access.allowDashboard = false;
        r.access.allowPublicMenu = false;
      } else if (status === 'active') {
        r.access.allowDashboard = true;
        r.access.allowPublicMenu = true;
      }
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'restaurants',
        action: `تغيير حالة المطعم إلى: ${status}`,
        details: `مطعم: ${r.nameAr} (${r.slug}) - المعرف: ${r.id}`,
        targetId: r.id,
      });
      this.saveState();
    }
  }

  public updateRestaurantAccess(
    id: string,
    access: { allowDashboard: boolean; allowPublicMenu: boolean },
    actor: string = 'Super Admin'
  ) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.access = { ...r.access, ...access };
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'restaurants',
        action: `تعديل صلاحيات الوصول لمطعم: ${r.nameAr}`,
        details: `لوحة التحكم: ${access.allowDashboard ? 'متاحة' : 'معطلة'} | المنيو العام: ${access.allowPublicMenu ? 'متاح' : 'معطل'}`,
        targetId: r.id,
      });
      this.saveState();
    }
  }

  public updateRestaurantSubscription(
    id: string,
    planId: string,
    billingCycle: 'monthly' | 'annual',
    actor: string = 'Super Admin'
  ) {
    const r = this.restaurants.find((res) => res.id === id);
    const plan = this.getPlanById(planId);
    if (r && plan) {
      const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
      r.subscription = {
        ...r.subscription,
        planId,
        billingCycle,
        price,
        status: 'active',
      };
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'subscriptions',
        action: `ترقية/تعديل باقة الاشتراك لمطعم: ${r.nameAr}`,
        details: `الباقة الجديدة: ${plan.nameAr} (${billingCycle === 'annual' ? 'دفع سنوي' : 'دفع شهري'}) - السعر: ${price} ${plan.currency}`,
        targetId: r.id,
      });
      this.saveState();
    }
  }

  public extendRestaurantSubscription(
    id: string,
    additionalMonths: number,
    actor: string = 'Super Admin'
  ) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      const currentRenewal = new Date(r.subscription.renewalDate || Date.now());
      currentRenewal.setMonth(currentRenewal.getMonth() + additionalMonths);
      r.subscription.renewalDate = currentRenewal.toISOString().split('T')[0];
      r.subscription.status = 'active';

      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'subscriptions',
        action: `تمديد اشتراك يدوي لمطعم: ${r.nameAr}`,
        details: `تم تمديد الاشتراك بمقدار ${additionalMonths} شهر. التاريخ الجديد: ${r.subscription.renewalDate}`,
        targetId: r.id,
      });
      this.saveState();
    }
  }

  public recordManualPayment(record: Omit<ManualPaymentRecord, 'id' | 'isManualRecorded'>, actor: string = 'Super Admin') {
    const newRecord: ManualPaymentRecord = {
      ...record,
      id: `pay-${Date.now()}`,
      isManualRecorded: true,
    };
    this.manualPayments.unshift(newRecord);

    const r = this.getRestaurantById(record.restaurantId);
    this.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: actor,
      category: 'subscriptions',
      action: `تسجيل دفعة يدوية: ${record.amount} ${record.currency}`,
      details: `مطعم: ${r?.nameAr || record.restaurantId} - طريقة الدفع: ${record.paymentMethod} - رقم المرجع: ${record.referenceNumber || 'لا يوجد'}`,
      targetId: record.restaurantId,
    });
    this.saveState();
    return newRecord;
  }

  public getPaymentsByRestaurant(restaurantId: string): ManualPaymentRecord[] {
    return this.manualPayments.filter((p) => p.restaurantId === restaurantId);
  }

  public getAllPayments(): ManualPaymentRecord[] {
    return [...this.manualPayments];
  }

  public updateRestaurantAppearance(id: string, appearance: Partial<MenuAppearance>) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.appearance = { ...r.appearance, ...appearance };
      this.saveState();
    }
  }

  public restoreDefaultAppearance(id: string) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.appearance = { ...DEFAULT_MENU_APPEARANCE };
      this.saveState();
    }
  }

  public updateRestaurantSettings(id: string, newSettings: Partial<Restaurant['settings']>) {
    const r = this.restaurants.find((res) => res.id === id);
    if (r) {
      r.settings = { ...r.settings, ...newSettings };
      this.saveState();
    }
  }

  public updateRestaurantProfile(id: string, updates: Partial<Restaurant>, isSuperAdmin: boolean = false) {
    const index = this.restaurants.findIndex((res) => res.id === id);
    if (index !== -1) {
      if (!isSuperAdmin) {
        // Strict Security Guard: Non-Super-Admin (Restaurant Owner) CANNOT modify administrative or ownership fields
        const sanitizedUpdates: Partial<Restaurant> = { ...updates };
        delete sanitizedUpdates.id;
        delete sanitizedUpdates.status;
        delete sanitizedUpdates.access;
        delete sanitizedUpdates.subscription;
        delete sanitizedUpdates.ownerUid;
        delete sanitizedUpdates.ownerEmail;
        delete sanitizedUpdates.createdAt;
        this.restaurants[index] = { ...this.restaurants[index], ...sanitizedUpdates };
      } else {
        this.restaurants[index] = { ...this.restaurants[index], ...updates };
      }
      this.saveState();
    }
  }

  public bindRestaurantOwnerUid(restaurantId: string, ownerUid: string, ownerEmail: string): boolean {
    const restaurant = this.restaurants.find((res) => res.id === restaurantId);
    if (!restaurant) return false;

    // Security Check: If already bound to a UID, prevent hijacking or changing
    if (restaurant.ownerUid && restaurant.ownerUid !== ownerUid) {
      console.warn(`[Security Alert] Denied attempt to rebind ownerUid for restaurant ${restaurantId}`);
      return false;
    }

    // Security Check: Owner email must match verified email
    if (restaurant.ownerEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
      console.warn(`[Security Alert] Email mismatch during initial UID binding for ${restaurantId}`);
      return false;
    }

    restaurant.ownerUid = ownerUid;
    this.saveState();
    return true;
  }

  public isSubscriptionActive(restaurantId: string): {
    isValid: boolean;
    status: 'active' | 'trial' | 'expired' | 'suspended' | 'blocked';
    renewalDate?: string;
    daysRemaining?: number;
    message?: string;
  } {
    const restaurant = this.getRestaurantById(restaurantId);
    if (!restaurant) {
      return { isValid: false, status: 'blocked', message: 'المطعم غير مسجل في النظام' };
    }

    if (restaurant.status === 'blocked') {
      return { isValid: false, status: 'blocked', message: 'تم حظر حساب هذا المطعم من قِبل إدارة المنصة' };
    }

    if (restaurant.status === 'suspended') {
      return { isValid: false, status: 'suspended', message: 'تم تعليق حساب هذا المطعم مؤقتاً' };
    }

    const sub = restaurant.subscription;
    if (!sub) {
      return { isValid: false, status: 'expired', message: 'لا توجد باقة اشتراك مرتبطة بهذا المطعم' };
    }

    if (sub.status === 'expired') {
      return { isValid: false, status: 'expired', renewalDate: sub.renewalDate, message: 'انتهت صلاحية باقة الاشتراك' };
    }

    if (sub.renewalDate) {
      const renewalTime = new Date(sub.renewalDate).setHours(23, 59, 59, 999);
      const nowTime = Date.now();
      if (nowTime > renewalTime) {
        return {
          isValid: false,
          status: 'expired',
          renewalDate: sub.renewalDate,
          daysRemaining: 0,
          message: `انتهت صلاحية الاشتراك بتاريخ ${sub.renewalDate}`,
        };
      }
      const daysRemaining = Math.max(0, Math.ceil((renewalTime - nowTime) / (1000 * 60 * 60 * 24)));
      return {
        isValid: true,
        status: sub.status,
        renewalDate: sub.renewalDate,
        daysRemaining,
      };
    }

    return { isValid: true, status: sub.status };
  }

  public setRestaurantFeatureOverride(restaurantId: string, featureKey: string, enabled: boolean, actor: string = 'Super Admin') {
    const r = this.restaurants.find((res) => res.id === restaurantId);
    if (r) {
      if (!r.customFeatures) r.customFeatures = {};
      r.customFeatures[featureKey] = enabled;
      this.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: actor,
        category: 'settings',
        action: `تعديل ميزة خاصة بالمطعم: ${featureKey} = ${enabled ? 'مفعل' : 'معطل'}`,
        details: `مطعم: ${r.nameAr}`,
        targetId: restaurantId,
      });
      this.saveState();
    }
  }

  // --- Feature Management System ---
  public hasFeature(restaurantId: string, featureKey: keyof SubscriptionPlan['featureFlags']): boolean {
    const restaurant = this.getRestaurantById(restaurantId);
    if (!restaurant) return false;

    // Check custom overrides first
    if (restaurant.customFeatures && typeof restaurant.customFeatures[featureKey] === 'boolean') {
      return restaurant.customFeatures[featureKey];
    }

    // Check if subscription expired
    if (restaurant.subscription.status === 'expired') {
      return false;
    }

    // Lookup plan
    const plan = this.getPlanById(restaurant.subscription.planId);
    if (!plan) return false;

    return !!plan.featureFlags[featureKey];
  }

  public registerRestaurant(data: {
    nameAr: string;
    nameEn: string;
    slug: string;
    cuisineType: string;
    city: string;
    phone: string;
    whatsappNumber: string;
    ownerEmail: string;
    ownerUid?: string;
    ownerName?: string;
    planId: string;
    billingCycle: 'monthly' | 'annual';
  }): Restaurant {
    if (!this.platformSettings.registrationEnabled) {
      throw new Error(this.platformSettings.registrationDisabledMessage);
    }

    const newId = `rest-${Date.now().toString().slice(-6)}`;
    const plan = this.getPlanById(data.planId) || this.getActivePlans()[0];
    const price = data.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

    const trialDays = this.platformSettings.freeTrialDays || 14;
    const renewalDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newRestaurant: Restaurant = {
      id: newId,
      slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
      nameAr: data.nameAr,
      nameEn: data.nameEn || data.nameAr,
      description: `أشهى المأكولات والمشروبات في ${data.nameAr}. نتشرف بخدمتكم وتلبية طلباتكم.`,
      cuisineType: data.cuisineType,
      city: data.city,
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=240&h=240&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=400&fit=crop&q=80',
      phone: data.phone,
      whatsappNumber: data.whatsappNumber.replace(/[^0-9]/g, ''),
      currency: plan.currency || this.platformSettings.defaultCurrency || 'ج.م',
      status: 'pending', // Pending Super Admin approval
      access: {
        allowDashboard: true,
        allowPublicMenu: true,
      },
      subscription: {
        planId: data.planId,
        billingCycle: data.billingCycle,
        status: 'trial',
        startDate: new Date().toISOString().split('T')[0],
        renewalDate,
        price,
      },
      settings: {
        enableOrdering: true,
        enableTableOrdering: true,
        enableReviews: true,
        autoApproveReviews: false,
        taxPercentage: this.platformSettings.defaultTaxPercentage || 14,
        deliveryFee: 25,
        minimumOrder: 50,
        workingHours: 'يومياً: 01:00 ظهراً - 01:00 صباحاً',
        address: `${data.city}، مصر`,
        city: data.city,
        themeColor: 'amber',
      },
      appearance: {
        ...DEFAULT_MENU_APPEARANCE,
      },
      createdAt: new Date().toISOString().split('T')[0],
      ownerEmail: data.ownerEmail,
      ownerUid: data.ownerUid,
      ownerName: data.ownerName || 'مالك المطعم',
      viewsCount: 0,
      ordersCount: 0,
    };

    // Welcome Categories
    const defaultCat1: Category = {
      id: `cat-${newId}-1`,
      restaurantId: newId,
      nameAr: 'الأطباق الرئيسية',
      nameEn: 'Main Courses',
      icon: '🍽️',
      sortOrder: 1,
      isActive: true,
    };
    const defaultCat2: Category = {
      id: `cat-${newId}-2`,
      restaurantId: newId,
      nameAr: 'المشروبات المنعشة',
      nameEn: 'Cold Drinks',
      icon: '🥤',
      sortOrder: 2,
      isActive: true,
    };

    // Welcome Tables
    const defaultTable1: RestaurantTable = {
      id: `tbl-${newId}-1`,
      restaurantId: newId,
      tableNumber: 'طاولة 1',
      nameAr: 'الصالة الداخلية',
      capacity: 4,
      location: 'indoor',
      isActive: true,
    };

    this.restaurants.unshift(newRestaurant);
    this.categories.push(defaultCat1, defaultCat2);
    this.tables.push(defaultTable1);

    this.logActivity({
      actorEmail: data.ownerEmail,
      actorName: data.ownerName || data.nameAr,
      category: 'restaurants',
      action: `طلب تسجيل مطعم جديد: ${data.nameAr}`,
      details: `تم إنشاء حساب المطعم بنجاح (معرف: ${newId}) في انتظار مراجعة الإدارة.`,
      targetId: newId,
    });

    this.saveState();
    return newRestaurant;
  }

  // --- Strict Tenant Scoped Category Methods ---
  public setCategoriesFromFirestore(restaurantId: string, remoteCategories: Category[]) {
    this.categories = [
      ...this.categories.filter((c) => c.restaurantId !== restaurantId),
      ...remoteCategories,
    ];
    this.saveState();
    this.notify();
  }

  public setItemsFromFirestore(restaurantId: string, remoteItems: MenuItem[]) {
    this.items = [
      ...this.items.filter((i) => i.restaurantId !== restaurantId),
      ...remoteItems,
    ];
    this.saveState();
    this.notify();
  }

  public getCategoriesByRestaurant(restaurantId: string): Category[] {
    return this.categories
      .filter((c) => c.restaurantId === restaurantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public saveCategory(category: Category) {
    const idx = this.categories.findIndex((c) => c.id === category.id);
    if (idx !== -1) {
      this.categories[idx] = category;
    } else {
      this.categories.push(category);
    }
    this.saveState();
  }

  public reorderCategories(restaurantId: string, orderedCategoryIds: string[]) {
    orderedCategoryIds.forEach((id, index) => {
      const cat = this.categories.find((c) => c.id === id && c.restaurantId === restaurantId);
      if (cat) cat.sortOrder = index + 1;
    });
    this.saveState();
  }

  public deleteCategory(categoryId: string, restaurantId: string) {
    this.categories = this.categories.filter(
      (c) => !(c.id === categoryId && c.restaurantId === restaurantId)
    );
    this.items = this.items.filter(
      (item) => !(item.categoryId === categoryId && item.restaurantId === restaurantId)
    );
    this.saveState();
  }

  // --- Strict Tenant Scoped Item Methods ---
  public getItemsByRestaurant(restaurantId: string): MenuItem[] {
    return this.items
      .filter((i) => i.restaurantId === restaurantId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  public saveItem(item: MenuItem) {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      this.items[idx] = item;
    } else {
      this.items.push(item);
    }
    this.saveState();
  }

  public deleteItem(itemId: string, restaurantId: string) {
    this.items = this.items.filter(
      (i) => !(i.id === itemId && i.restaurantId === restaurantId)
    );
    this.saveState();
  }

  public toggleItemAvailability(itemId: string, restaurantId: string) {
    const item = this.items.find((i) => i.id === itemId && i.restaurantId === restaurantId);
    if (item) {
      item.isAvailable = !item.isAvailable;
      this.saveState();
    }
  }

  // --- Strict Tenant Tables Management ---
  public setTablesFromFirestore(restaurantId: string, remoteTables: RestaurantTable[]) {
    this.tables = [
      ...this.tables.filter((t) => t.restaurantId !== restaurantId),
      ...remoteTables,
    ];
    this.saveState();
    this.notify();
  }

  public getTablesByRestaurant(restaurantId: string): RestaurantTable[] {
    return this.tables.filter((t) => t.restaurantId === restaurantId);
  }

  public saveTable(table: RestaurantTable) {
    const idx = this.tables.findIndex((t) => t.id === table.id);
    if (idx !== -1) {
      this.tables[idx] = table;
    } else {
      this.tables.push(table);
    }
    this.saveState();
  }

  public deleteTable(tableId: string, restaurantId: string) {
    this.tables = this.tables.filter(
      (t) => !(t.id === tableId && t.restaurantId === restaurantId)
    );
    this.saveState();
  }

  // --- Tenant Scoped Order & WhatsApp Methods ---
  public setOrdersFromFirestore(restaurantId: string, remoteOrders: Order[]) {
    this.orders = [
      ...this.orders.filter((o) => o.restaurantId !== restaurantId),
      ...remoteOrders,
    ];
    this.saveState();
    this.notify();
  }

  public getOrdersByRestaurant(restaurantId: string): Order[] {
    return this.orders
      .filter((o) => o.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Order {
    const count = this.orders.filter((o) => o.restaurantId === order.restaurantId).length + 1;
    const orderNumber = `#${1000 + count}`;
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    this.orders.unshift(newOrder);

    const rest = this.restaurants.find((r) => r.id === order.restaurantId);
    if (rest) {
      rest.ordersCount = (rest.ordersCount || 0) + 1;
    }

    this.saveState();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, restaurantId: string, status: Order['status']) {
    const ord = this.orders.find((o) => o.id === orderId && o.restaurantId === restaurantId);
    if (ord) {
      ord.status = status;
      this.saveState();
    }
  }

  // --- Tenant Scoped Reviews ---
  public setReviewsFromFirestore(restaurantId: string, remoteReviews: Review[]) {
    this.reviews = [
      ...this.reviews.filter((r) => r.restaurantId !== restaurantId),
      ...remoteReviews,
    ];
    this.saveState();
    this.notify();
  }

  public getReviewsByRestaurant(restaurantId: string, approvedOnly = false): Review[] {
    return this.reviews
      .filter((r) => r.restaurantId === restaurantId && (!approvedOnly || r.isApproved))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.reviews.unshift(newReview);
    this.saveState();
    return newReview;
  }

  public toggleReviewApproval(reviewId: string, restaurantId: string) {
    const rev = this.reviews.find((r) => r.id === reviewId && r.restaurantId === restaurantId);
    if (rev) {
      rev.isApproved = !rev.isApproved;
      this.saveState();
    }
  }

  public setReviewApproval(reviewId: string, restaurantId: string, isApproved: boolean) {
    const rev = this.reviews.find((r) => r.id === reviewId && r.restaurantId === restaurantId);
    if (rev) {
      rev.isApproved = isApproved;
      this.saveState();
    }
  }

  public replyToReview(reviewId: string, restaurantId: string, replyText: string) {
    const rev = this.reviews.find((r) => r.id === reviewId && r.restaurantId === restaurantId);
    if (rev) {
      rev.reply = replyText;
      this.saveState();
    }
  }

  public deleteReview(reviewId: string, restaurantId: string) {
    this.reviews = this.reviews.filter(
      (r) => !(r.id === reviewId && r.restaurantId === restaurantId)
    );
    this.saveState();
  }

  // --- WhatsApp Link Formatter ---
  public generateWhatsAppOrderLink(restaurant: Restaurant, order: Order): string {
    const cleanPhone = restaurant.whatsappNumber.replace(/[^0-9]/g, '');

    let typeText = 'طلب محلي (تناول داخل المطعم)';
    if (order.orderType === 'takeaway') typeText = 'طلب استلام من الفرع السفري (Takeaway)';
    if (order.orderType === 'delivery') typeText = 'طلب توصيل خارجي (Delivery)';

    let message = `مرحباً ${restaurant.nameAr} 👋\n`;
    message += `أود تأكيد طلب جديد من المنيو الذكي:\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *رقم الطلب:* ${order.orderNumber}\n`;
    message += `🛵 *نوع الطلب:* ${typeText}\n`;
    if (order.tableNumber) {
      message += `🪑 *الطاولة:* ${order.tableNumber}\n`;
    }
    message += `👤 *اسم العميل:* ${order.customerName}\n`;
    message += `📱 *رقم الجوال:* ${order.customerPhone}\n`;
    if (order.address && order.orderType === 'delivery') {
      message += `📍 *العنوان:* ${order.address}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🛒 *تفاصيل الأصناف المطلوبة:*\n`;

    order.items.forEach((item, index) => {
      message += `${index + 1}. *${item.nameAr}* × ${item.quantity} = ${(item.unitPrice * item.quantity).toFixed(2)} ${restaurant.currency}\n`;
      if (item.selectedSize) {
        message += `   ▫️ الحجم: ${item.selectedSize.name}\n`;
      }
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        const opts = item.selectedOptions.map((o) => o.optionName).join(' + ');
        message += `   ▫️ إضافات: ${opts}\n`;
      }
      if (item.notes) {
        message += `   ▫️ ملاحظة خاصة: ${item.notes}\n`;
      }
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *المجموع الفرعي:* ${order.subtotal.toFixed(2)} ${restaurant.currency}\n`;
    if (order.tax > 0) {
      message += `🧾 *ضريبة القيمة المضافة:* ${order.tax.toFixed(2)} ${restaurant.currency}\n`;
    }
    if (order.deliveryFee > 0) {
      message += `🛵 *رسوم التوصيل:* ${order.deliveryFee.toFixed(2)} ${restaurant.currency}\n`;
    }
    message += `✨ *المجموع الإجمالي النهائي:* *${order.total.toFixed(2)} ${restaurant.currency}*\n`;

    if (order.notes) {
      message += `📝 *ملاحظات العميل:* ${order.notes}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `تم إرسال هذا الطلب عبر منصة *${this.websiteContent.platformName}* الذكية.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  // Reset to initial demo data
  public resetToDemo() {
    this.restaurants = INITIAL_RESTAURANTS;
    this.categories = INITIAL_CATEGORIES;
    this.items = INITIAL_ITEMS;
    this.reviews = INITIAL_REVIEWS;
    this.orders = INITIAL_ORDERS;
    this.plans = INITIAL_PLANS;
    this.websiteContent = INITIAL_WEBSITE_CONTENT;
    this.platformSettings = INITIAL_PLATFORM_SETTINGS;
    this.staff = INITIAL_STAFF;
    this.activityLogs = INITIAL_ACTIVITY_LOGS;
    this.manualPayments = [];
    this.tables = INITIAL_TABLES;
    this.saveState();
  }
}

export const store = new StoreService();
export const SUBSCRIPTION_PLANS = store.getPlans();

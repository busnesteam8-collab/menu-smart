import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  MessageCircle,
  MapPin,
  UtensilsCrossed,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { store } from '../services/store';
import { firestoreRestaurantService } from '../services/firestoreRestaurantService';
import { Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';

interface RegisterRestaurantPageProps {
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  onSelectRestaurantId: (id: string) => void;
}

export const RegisterRestaurantPage: React.FC<RegisterRestaurantPageProps> = ({
  onNavigate,
  onSelectRestaurantId,
}) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [activePlans, setActivePlans] = useState(store.getActivePlans());
  const [settings, setSettings] = useState(store.getPlatformSettings());

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [cuisineType, setCuisineType] = useState('برجر ووجبات سريعة');
  const [city, setCity] = useState('القاهرة');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlans[0]?.id || 'starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // React to reactive store updates (including Firestore synced plans)
  React.useEffect(() => {
    const unsub = store.subscribe(() => {
      const updated = store.getActivePlans();
      setActivePlans(updated);
      setSettings(store.getPlatformSettings());
      if (!selectedPlanId && updated.length > 0) {
        setSelectedPlanId(updated[0].id);
      }
    });
    return unsub;
  }, [selectedPlanId]);

  // Account State
  const [ownerName, setOwnerName] = useState(currentUser?.displayName || '');
  const [ownerEmail, setOwnerEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');

  // Keep email/name in sync if user signs in during the flow
  React.useEffect(() => {
    if (currentUser?.email) {
      setOwnerEmail(currentUser.email);
    }
    if (currentUser?.displayName && !ownerName) {
      setOwnerName(currentUser.displayName);
    }
  }, [currentUser]);

  // Created Result
  const [createdRestaurant, setCreatedRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNameArChange = (val: string) => {
    setNameAr(val);
    if (!slug) {
      // Auto-generate english-friendly slug
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated || `restaurant-${Math.floor(Math.random() * 900 + 100)}`);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!nameAr.trim()) {
      setErrorMessage('يرجى كتابة اسم المطعم باللغة العربية');
      return;
    }
    if (!slug.trim()) {
      setErrorMessage('يرجى تحديد المعرف الإنجليزي الفريد (Slug)');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (!whatsappNumber.trim()) {
      setErrorMessage('يرجى إدخال رقم الواتساب المخصص لاستقبال الطلبات');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = () => {
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('يشترط تسجيل الدخول أولاً بحساب Google موثق لربط ملكية المطعم بالمعرف الأمني (UID) ومنع الانتحال.');
      return;
    }

    if (!ownerEmail.trim()) {
      setErrorMessage('يرجى تحديد البريد الإلكتروني المعتمد للمطعم');
      return;
    }

    setIsSubmitting(true);
    try {
      let newRest: Restaurant;
      try {
        newRest = await firestoreRestaurantService.registerRestaurant({
          nameAr,
          nameEn: nameEn || nameAr,
          slug,
          cuisineType,
          city,
          phone,
          whatsappNumber,
          ownerEmail: currentUser.email || ownerEmail,
          ownerUid: currentUser.uid,
          ownerName: ownerName || currentUser.displayName || 'مالك المطعم',
          planId: selectedPlanId,
          billingCycle,
        });
      } catch (cloudErr: any) {
        console.warn('Fallback to local registration due to cloud error:', cloudErr);
        // Fallback to local store if offline
        newRest = store.registerRestaurant({
          nameAr,
          nameEn: nameEn || nameAr,
          slug,
          cuisineType,
          city,
          phone,
          whatsappNumber,
          ownerEmail: currentUser.email || ownerEmail,
          ownerUid: currentUser.uid,
          ownerName: ownerName || currentUser.displayName || 'مالك المطعم',
          planId: selectedPlanId,
          billingCycle,
        });
      }

      setCreatedRestaurant(newRest);
      onSelectRestaurantId(newRest.id);
      setStep(4);

      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-right font-['Cairo',sans-serif]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mb-3"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للموقع الرئيسي</span>
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">تسجيل مطعم جديد في Menu Smart</h1>
          </div>
          <p className="text-slate-400 text-sm">
            انضم الآن وابدأ استقبال طلبات زبائنك على الواتساب مع منيو QR تفاعلي ذكي.
          </p>
        </div>

        {/* Wizard Steps indicator */}
        {step < 4 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                step >= 1
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-500'
              }`}
            >
              <div className="text-xs font-bold">الخطوة 1</div>
              <div className="text-sm font-black hidden sm:block">بيانات المطعم</div>
            </div>
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                step >= 2
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-500'
              }`}
            >
              <div className="text-xs font-bold">الخطوة 2</div>
              <div className="text-sm font-black hidden sm:block">اختيار الباقة</div>
            </div>
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                step >= 3
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-500'
              }`}
            >
              <div className="text-xs font-bold">الخطوة 3</div>
              <div className="text-sm font-black hidden sm:block">حساب المالك</div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-4 rounded-xl text-sm mb-6 font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Restaurant Info */}
        {step === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="border-b border-slate-700/60 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <span>البيانات الأساسية للمطعم / الكافيه</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ستظهر هذه البيانات في رأس المنيو وعلى كروت الطاولات الخاصة بزبائنك.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم المطعم بالعربية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم ستيشن برجر"
                  value={nameAr}
                  onChange={(e) => handleNameArChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Station Burger"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Slug URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المعرف الفريد لرابط المنيو (Slug) *
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400 direction-ltr">
                <span className="text-slate-500 font-mono text-xs pl-2">menusmart.app/</span>
                <input
                  type="text"
                  required
                  placeholder="station-burger"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none w-full text-right"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                هذا هو الرابط المباشر الذي سيفتحه زوارك لمشاهدة المنيو.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نوع المأكولات / التصنيف *
                </label>
                <select
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="برجر ووجبات سريعة">برجر ووجبات سريعة</option>
                  <option value="مقهى ومخبوزات فرنسية">مقهى ومخبوزات فرنسية</option>
                  <option value="شاورما ومشاوي شرقية">شاورما ومشاوي شرقية</option>
                  <option value="بيتزا وباستا إيطالية">بيتزا وباستا إيطالية</option>
                  <option value="مأكولات بحرية">مأكولات بحرية</option>
                  <option value="حلويات وآيس كريم">حلويات وآيس كريم</option>
                  <option value="مأكولات صحية ودايت">مأكولات صحية ودايت</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">المدينة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الرياض"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>رقم الهاتف المعتمد *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم الواتساب لاستقبال الطلبات *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="966501234567 (مع مفتاح الدولة)"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>المتابعة لاختيار الباقة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-700/60 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>اختر باقة الاشتراك المناسبة</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  جميع الباقات تشمل تجربة مجانية 14 يوماً ولا تتطلب بطاقة دفع حالياً.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    billingCycle === 'monthly'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  شهري
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    billingCycle === 'annual'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>سنوي</span>
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    خصم 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans List */}
            <div className="space-y-4">
              {activePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                const period = billingCycle === 'annual' ? 'سنوياً' : 'شهرياً';

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{plan.nameAr}</span>
                        {plan.badge && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{plan.descriptionAr}</p>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded">
                          الأصناف: حتى {plan.itemLimit} صنف
                        </span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded">
                          الفروع: {plan.branchLimit} فرع
                        </span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded">
                          طلبات واتساب غير محدودة
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-left">
                        <div className="text-xl font-black text-amber-400">
                          {price} <span className="text-xs text-slate-400">{plan.currency || 'ج.م'} / {period}</span>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition mt-2 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لبيانات المطعم</span>
              </button>
              <button
                type="button"
                onClick={handleStep2Submit}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>المتابعة لإنشاء الحساب</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Owner Account */}
        {step === 3 && (
          <form
            onSubmit={handleFinalSubmit}
            className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="border-b border-slate-700/60 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>توثيق ملكية المطعم وربط الحساب</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                يشترط النظام ربط المطعم بمعرف أمني فريد (ownerUid) صادر عن Firebase لمنع انتحال الهوية أو التلاعب بالملكية.
              </p>
            </div>

            {currentUser ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم توثيق الحساب بنجاح عبر Firebase Authentication</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 font-sans">البريد المعتمد:</span>{' '}
                      <span className="text-white">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">معرف المالك (ownerUid):</span>{' '}
                      <span className="text-amber-400">{currentUser.uid.slice(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>اسم مالك المطعم أو المدير المسؤول *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: صالح عبدالله"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>البريد الإلكتروني المربوط (محمي وموثق)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none direction-ltr text-right cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-emerald-400 mt-1">
                    ✓ تم التحقق من ملكية هذا البريد، ولن يتمكن أي طرف آخر من تعديله أو انتحاله.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">تسجيل الدخول مطلوب لتوثيق ملكية المطعم</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    لحماية بيانات مطعمك ومنع حجز المطاعم بحسابات وهمية أو بريد غير مملوك، يرجى تسجيل الدخول بحساب Google.
                    سيتم استخراج المعرف الأمني (UID) تلقائياً وقفل ملكية المطعم باسمك.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>تسجيل الدخول والتحقق عبر Google</span>
                </button>
              </div>
            )}

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-slate-200">ملخص الطلب:</div>
              <div>
                • المطعم: <span className="text-amber-400 font-bold">{nameAr}</span> ({cuisineType} - {city})
              </div>
              <div>
                • الباقة:{' '}
                <span className="text-white font-bold">
                  {activePlans.find((p) => p.id === selectedPlanId)?.nameAr || selectedPlanId}
                </span>{' '}
                ({billingCycle === 'annual' ? 'دفع سنوي' : 'دفع شهري'})
              </div>
              <div>
                • واتساب الطلبات: <span className="text-emerald-400 font-mono">{whatsappNumber}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للباقات</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جارٍ إنشاء الحساب وتجهيز المنيو...</span>
                ) : (
                  <>
                    <span>إتمام التسجيل وتفعيل المنيو</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success Screen */}
        {step === 4 && createdRestaurant && (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                تهانينا! تم إنشاء حساب مطعمك بنجاح 🎉
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto">
                تم تهيئة المنيو السحابي الخاص بمطعم{' '}
                <span className="text-amber-400 font-bold">{createdRestaurant.nameAr}</span> مع
                تصنيفات افتراضية ورابط فريد جاهز للمشاركة.
              </p>
            </div>

            {/* Restaurant Access Cards */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700/60 max-w-md mx-auto text-xs text-slate-300 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">معرف المطعم (Tenant ID):</span>
                <span className="font-mono text-amber-400 font-bold">{createdRestaurant.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">رابط المنيو الرقمي:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  /{createdRestaurant.slug}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">حالة المطعم:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    createdRestaurant.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {createdRestaurant.status === 'active'
                    ? 'نشط - تجربة مجانية (14 يوماً)'
                    : 'قيد المراجعة في Cloud Firestore (بانتظار اعتماد الإدارة)'}
                </span>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectRestaurantId(createdRestaurant.id);
                  onNavigate('restaurant_admin');
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>دخول لوحة تحكم المطعم وإضافة الأصناف</span>
              </button>

              <button
                onClick={() => {
                  onSelectRestaurantId(createdRestaurant.id);
                  onNavigate('public_menu');
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>استعراض المنيو كما يراه زبائنك</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

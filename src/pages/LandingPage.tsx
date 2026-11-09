import React, { useState, useEffect } from 'react';
import {
  QrCode,
  MessageCircle,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Star,
  Users,
  Layers,
  ChefHat,
  Coffee,
  Check,
  Store,
  DollarSign,
  HelpCircle,
  Bell,
  Phone,
  Mail,
} from 'lucide-react';
import { store } from '../services/store';
import { Restaurant, SubscriptionPlan, WebsiteContent, PlatformSettings } from '../types';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  onSelectRestaurantId: (id: string) => void;
  restaurants: Restaurant[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectRestaurantId,
  restaurants,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'shawarma' | 'coffee'>('shawarma');

  const [cms, setCms] = useState<WebsiteContent>(store.getWebsiteContent());
  const [plans, setPlans] = useState<SubscriptionPlan[]>(store.getActivePlans());
  const [settings, setSettings] = useState<PlatformSettings>(store.getPlatformSettings());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCms(store.getWebsiteContent());
      setPlans(store.getActivePlans());
      setSettings(store.getPlatformSettings());
    });
    return unsub;
  }, []);

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="w-6 h-6" />;
      case 'MessageCircle':
        return <MessageCircle className="w-6 h-6" />;
      case 'Zap':
        return <Zap className="w-6 h-6" />;
      case 'Star':
        return <Star className="w-6 h-6" />;
      case 'TrendingUp':
        return <TrendingUp className="w-6 h-6" />;
      case 'Layers':
      default:
        return <Layers className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Cairo',sans-serif]">
      {/* Global Announcement Banner */}
      {settings.showGlobalAnnouncement && settings.globalAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-center gap-2 text-center shadow-inner">
          <Bell className="w-3.5 h-3.5 animate-bounce shrink-0" />
          <span>{settings.globalAnnouncement}</span>
        </div>
      )}

      {/* Hero Section */}
      {cms.sectionsVisibility.hero && (
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-800">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column Copy */}
              <div className="lg:col-span-7 space-y-6 text-right">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs sm:text-sm font-bold shadow-inner">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{cms.hero.badge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.25] tracking-tight">
                  {cms.hero.title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
                    {cms.hero.highlight}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  {cms.hero.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-3">
                  <button
                    onClick={() => {
                      if (!settings.registrationEnabled) {
                        alert(settings.registrationDisabledMessage);
                      } else {
                        onNavigate('register');
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/25 transition active:scale-95 cursor-pointer"
                  >
                    <span>{cms.hero.primaryCtaText}</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectRestaurantId('rest-1');
                      onNavigate('public_menu');
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-base px-6 py-4 rounded-2xl transition cursor-pointer"
                  >
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <span>{cms.hero.secondaryCtaText}</span>
                  </button>
                </div>

                {/* Stats */}
                {cms.sectionsVisibility.stats && (
                  <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-black text-white">+{restaurants.length * 120}</div>
                      <div className="text-xs text-slate-400 font-medium">مطعم وكافيه شريك</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400">0%</div>
                      <div className="text-xs text-slate-400 font-medium">عمولة على المبيعات</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">99.9%</div>
                      <div className="text-xs text-slate-400 font-medium">سرعة وجاهزية سحابية</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Phone Showcase */}
              {cms.sectionsVisibility.interactivePreview && (
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-[340px] bg-slate-950 border-4 border-slate-800 rounded-[2.5rem] p-3 shadow-2xl shadow-amber-500/10">
                    <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl mb-3 text-xs font-bold border border-slate-800">
                      <button
                        onClick={() => {
                          setActivePreviewTab('shawarma');
                          onSelectRestaurantId('rest-1');
                        }}
                        className={`flex-1 py-1.5 rounded-lg transition ${
                          activePreviewTab === 'shawarma'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        شاورما الريف
                      </button>
                      <button
                        onClick={() => {
                          setActivePreviewTab('coffee');
                          onSelectRestaurantId('rest-2');
                        }}
                        className={`flex-1 py-1.5 rounded-lg transition ${
                          activePreviewTab === 'coffee'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        لا بريما كافيه
                      </button>
                    </div>

                    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80 text-right">
                      <div className="h-28 relative overflow-hidden">
                        <img
                          src={
                            activePreviewTab === 'shawarma'
                              ? 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=200&fit=crop&q=80'
                              : 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=200&fit=crop&q=80'
                          }
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <div className="absolute bottom-2 right-3 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md">
                            <img
                              src={
                                activePreviewTab === 'shawarma'
                                  ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop&q=80'
                                  : 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop&q=80'
                              }
                              alt="Logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">
                              {activePreviewTab === 'shawarma' ? 'شاورما ومشاوي الريف' : 'لا بريما كافيه'}
                            </h4>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                              ● مفتوح الآن
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 space-y-2 text-xs">
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="font-bold text-white text-xs">
                              {activePreviewTab === 'shawarma' ? 'شاورما لحم ملكية' : 'فلات وايت إثيوبي'}
                            </div>
                            <div className="text-[10px] text-slate-400">مع الإضافات والصلصات</div>
                            <div className="text-amber-400 font-black text-xs">
                              {activePreviewTab === 'shawarma' ? '15 ج.م' : '21 ج.م'}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              onSelectRestaurantId(activePreviewTab === 'shawarma' ? 'rest-1' : 'rest-2');
                              onNavigate('public_menu');
                            }}
                            className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow"
                          >
                            + أضف للطلب
                          </button>
                        </div>

                        <div className="bg-emerald-950/60 border border-emerald-800/80 p-2.5 rounded-xl text-center">
                          <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>طلب فوري مباشر عبر WhatsApp</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            بدون تسجيل، بضغطة زر إلى واتساب المطعم
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onSelectRestaurantId(activePreviewTab === 'shawarma' ? 'rest-1' : 'rest-2');
                            onNavigate('public_menu');
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1"
                        >
                          <span>فتح المنيو الكامل بالشاشة الكاملة</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Features Grid */}
      {cms.sectionsVisibility.features && (
        <section className="py-20 bg-slate-950 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                لماذا {cms.platformName}؟
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                كل ما تحتاجه لإدارة وتحديث منيو مطعمك في مكان واحد
              </h2>
              <p className="text-slate-400 text-base">
                {cms.platformDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cms.features.map((feat) => (
                <div
                  key={feat.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-6 rounded-2xl shadow-lg transition group text-right"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition">
                    {getFeatureIcon(feat.icon)}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works (3 Steps) */}
      {cms.sectionsVisibility.howItWorks && (
        <section className="py-20 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                سهولة فائقة
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
                3 خطوات بسيطة لإطلاق منيو مطعمك اليوم
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {cms.howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="bg-slate-800/60 border border-slate-700/60 p-8 rounded-3xl relative text-right"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Pricing Section */}
      {cms.sectionsVisibility.pricing && (
        <section className="py-20 bg-slate-950 border-b border-slate-800" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                خطط أسعار عادلة ومحدثة
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                باقات مرنة تناسب حجم أعمالك
              </h2>
              <p className="text-slate-400 text-base">
                اختر الخطة المناسبة لمطعمك، وبدون أي عمولات على مبيعاتك إطلاقاً.
              </p>

              <div className="inline-flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mt-4">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
                    billingCycle === 'monthly'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الدفع الشهري
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition ${
                    billingCycle === 'annual'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>الدفع السنوي</span>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    خصم حتى 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                const period = billingCycle === 'annual' ? 'سنوياً' : 'شهرياً';

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-8 flex flex-col justify-between border transition text-right ${
                      plan.popular
                        ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500 shadow-2xl shadow-amber-500/15 lg:-translate-y-2'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full shadow-md">
                        {plan.badge || 'الأكثر اختياراً'}
                      </div>
                    )}

                    <div>
                      <h3 className="text-2xl font-black text-white">{plan.nameAr}</h3>
                      <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.descriptionAr}</p>

                      <div className="my-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white">{price}</span>
                          <span className="text-amber-400 font-bold text-sm">{plan.currency}</span>
                          <span className="text-slate-400 text-xs">/ {period}</span>
                        </div>
                        {billingCycle === 'annual' && (
                          <p className="text-emerald-400 text-xs font-medium mt-1">
                            وفرت ما يعادل شهرين مجاناً!
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 pt-6 border-t border-slate-800">
                        <p className="text-xs font-bold text-slate-300">مزايا الباقة:</p>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          if (!settings.registrationEnabled) {
                            alert(settings.registrationDisabledMessage);
                          } else {
                            onNavigate('register');
                          }
                        }}
                        className={`w-full py-3.5 rounded-xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        <span>اشترك في {plan.nameAr}</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic FAQs */}
      {cms.sectionsVisibility.faq && (
        <section className="py-20 bg-slate-900 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                الأسئلة الشائعة
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
                كل ما تود معرفته عن {cms.platformName}
              </h2>
            </div>

            <div className="space-y-4">
              {cms.faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-slate-800/70 border border-slate-700/60 rounded-2xl overflow-hidden transition text-right"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full text-right p-5 flex items-center justify-between gap-4 font-bold text-white text-base hover:text-amber-400 transition"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 text-slate-300 text-sm leading-relaxed border-t border-slate-700/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {cms.sectionsVisibility.cta && (
        <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-3xl p-10 sm:p-14 text-slate-950 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
                جاهز لتطوير تجربة زوار مطعمك ومضاعفة طلباتك؟
              </h2>
              <p className="text-base sm:text-lg text-slate-900/90 font-medium max-w-2xl mx-auto mb-8">
                انضم لأكثر من 350 مطعم وكافيه يعتمدون على {cms.platformName} لتقديم تجربة منيو عصرية وسريعة.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (!settings.registrationEnabled) {
                      alert(settings.registrationDisabledMessage);
                    } else {
                      onNavigate('register');
                    }
                  }}
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
                >
                  أنشئ حساب مطعمك الآن (مجاناً {settings.freeTrialDays} يوم)
                </button>
                <button
                  onClick={() => onNavigate('super_admin')}
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-slate-950 border border-slate-950/20 font-bold text-base px-6 py-4 rounded-2xl transition cursor-pointer"
                >
                  استعراض لوحة Super Admin للمنصة
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

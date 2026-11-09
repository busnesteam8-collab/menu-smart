import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  LogIn,
  AlertTriangle,
  RefreshCw,
  Home,
  Store,
  CheckCircle2,
  AlertCircle,
  MailCheck,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { PRIMARY_SUPER_ADMIN_EMAIL } from '../services/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSuperAdmin?: boolean;
  requireRestaurantOwner?: boolean;
  restaurantId?: string;
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  onSelectRestaurantId?: (id: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireSuperAdmin = false,
  requireRestaurantOwner = false,
  restaurantId,
  onNavigate,
  onSelectRestaurantId,
}) => {
  const {
    currentUser,
    loading,
    isSuperAdmin,
    hasServerCustomClaim,
    signInWithGoogle,
    checkRestaurantAccess,
    refreshAuth,
  } = useAuth();

  // 1. Loading State Screen
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-xl">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">جاري التحقق من الهوية والصلاحيات</h3>
        <p className="text-sm text-slate-400 max-w-md">
          يتم الآن فحص رمز التحقق المشفر (Firebase Token) والتأكد من مطابقة شروط الوصول الآمن...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated User Screen
  if ((requireAuth || requireSuperAdmin || requireRestaurantOwner) && !currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">تسجيل الدخول مطلوب</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              هذه المنطقة محمية بالكامل بواسطة **Firebase Authentication**. يجب تسجيل الدخول للتحقق من هويتك وصلاحياتك قبل فتح لوحة التحكم.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm"
            >
              <LogIn className="w-5 h-5" />
              <span>تسجيل الدخول عبر Google</span>
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition text-xs"
            >
              <Home className="w-4 h-4" />
              <span>العودة للموقع الرئيسي</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Super Admin Route Protection
  if (requireSuperAdmin) {
    // Check if email matches primary owner
    if (currentUser?.email !== PRIMARY_SUPER_ADMIN_EMAIL) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">وصول محظور (Access Denied)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                لوحة **Super Admin** مخصصة حصراً للمالك العام للمنصة. أنت مسجل حالياً بالبريد الإلكتروني:
              </p>
              <div className="bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono text-amber-400 border border-slate-800">
                {currentUser?.email}
              </div>
              <p className="text-[11px] text-red-400/90 font-medium">
                هذا الحساب لا يملك تصريح الإدارة العامة.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('landing')}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition text-xs"
              >
                <Home className="w-4 h-4" />
                <span>العودة إلى الصفحة الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Check if email is verified
    if (!currentUser.emailVerified) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">توثيق البريد الإلكتروني مطلوب</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                يشترط نظام الأمان توثيق البريد الإلكتروني (<span className="text-white font-mono">{currentUser.email}</span>) بحالة <span className="text-emerald-400 font-bold font-mono">email_verified: true</span> لمنع التلاعب.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={refreshAuth}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl transition text-xs shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة فحص حالة التوثيق بعد التحقق</span>
              </button>
              <button
                onClick={() => onNavigate('landing')}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl transition text-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>العودة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 4. Restaurant Owner Route Protection
  if (requireRestaurantOwner && restaurantId) {
    const accessCheck = checkRestaurantAccess(restaurantId);

    if (!accessCheck.allowed) {
      const isExpired = accessCheck.reason === 'subscription_expired';
      const isDisabled = accessCheck.reason === 'disabled';

      return (
        <div className="min-h-[75vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
              isExpired
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : isDisabled
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              {isExpired ? <Clock className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {isExpired
                  ? 'انتهت صلاحية اشتراك المطعم'
                  : isDisabled
                  ? 'لوحة التحكم معطلة إدارياً'
                  : 'غير مصرح بالدخول لهذا المطعم'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {accessCheck.message}
              </p>
              <div className="text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 text-right space-y-1">
                <div><span className="text-slate-500">المطعم المطلوب:</span> <span className="font-mono text-amber-400">{restaurantId}</span></div>
                <div><span className="text-slate-500">حسابك الحالي:</span> <span className="font-mono text-slate-200">{currentUser?.email}</span></div>
                <div><span className="text-slate-500">المعرف الأمني (UID):</span> <span className="font-mono text-slate-400 text-[10px]">{currentUser?.uid}</span></div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {isExpired && (
                <a
                  href="https://wa.me/201012345678?text=مرحباً، أريد تجديد باقة اشتراك مطعمي في Menu Smart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-2.5 px-4 rounded-xl transition text-xs shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل مع الإدارة لتجديد الاشتراك</span>
                </a>
              )}
              <button
                onClick={() => onNavigate('landing')}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition text-xs"
              >
                <Home className="w-4 h-4" />
                <span>العودة للموقع الرئيسي</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Access Granted - Render Protected Children
  return (
    <>
      {/* Super Admin Audit Banner showing token claims */}
      {requireSuperAdmin && (
        <div className="bg-slate-900/90 border-b border-amber-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">جلسة Super Admin موثقة:</span>
            <span className="font-mono text-amber-400">{currentUser?.email}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
              Email Verified
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline">معرف Firebase UID: <span className="font-mono text-slate-300">{currentUser?.uid.slice(0, 10)}...</span></span>
            {hasServerCustomClaim ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Custom Claims مفعّلة
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold flex items-center gap-1" title="توثيق بريد المالك مؤكد. لتفعيل الـ Custom Claims الإضافية على الرمز، يتم تشغيل سكربت Admin SDK في الخادم.">
                <AlertCircle className="w-3 h-3" /> موثق بالبريد والرمز المشفر
              </span>
            )}
          </div>
        </div>
      )}

      {children}
    </>
  );
};

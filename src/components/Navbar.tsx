import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShieldAlert,
  Store,
  QrCode,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Layers,
  Menu,
  X,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Restaurant } from '../types';
import { store, PRIMARY_SUPER_ADMIN_EMAIL } from '../services/store';
import { useAuth } from '../context/AuthContext';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentView: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register';
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
  selectedRestaurantId: string;
  onSelectRestaurantId: (id: string) => void;
  restaurants: Restaurant[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  selectedRestaurantId,
  onSelectRestaurantId,
  restaurants,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    currentUser,
    loading: isAuthLoading,
    signInWithGoogle: handleGoogleSignIn,
    logout: handleSignOut,
    isSuperAdmin,
  } = useAuth();
  const activeRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0];

  const handleResetDemo = () => {
    if (window.confirm('هل تريد إعادة تعيين البيانات التجريبية للمنصة؟')) {
      store.resetToDemo();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Multi-Tenant Context Switcher Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-slate-950 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded-full font-bold">
            <Layers className="w-3.5 h-3.5" /> Multi-Tenant SaaS
          </span>
          <span className="hidden sm:inline text-slate-900/90 font-semibold">
            منصة متكاملة: تصفح المنصة من منظور العميل أو صاحب المطعم أو المدير العام
          </span>
        </div>

        {/* Tenant Selector */}
        <div className="flex items-center gap-2 mr-auto sm:mr-0">
          <span className="text-slate-900 font-bold hidden md:inline">المطعم النشط:</span>
          <div className="relative">
            <select
              value={selectedRestaurantId}
              onChange={(e) => onSelectRestaurantId(e.target.value)}
              className="bg-white/90 hover:bg-white text-slate-900 font-bold text-xs py-1 px-2.5 rounded-lg border border-amber-400 shadow-sm focus:outline-none cursor-pointer"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id} className="text-slate-900">
                  {r.nameAr} ({r.cuisineType})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleResetDemo}
            title="إعادة ضبط البيانات الافتراضية"
            className="flex items-center gap-1 bg-black/10 hover:bg-black/20 text-slate-950 px-2 py-1 rounded text-xs transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden lg:inline">إعادة ضبط البيانات</span>
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-between p-2 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-6 h-6 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition">
                  Menu Smart
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded">
                  سحابي
                </span>
              </div>
              <p className="text-[11px] text-slate-400">منصة المنيو الذكي للمطاعم</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'landing'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              الموقع الرئيسي
            </button>

            <button
              onClick={() => onNavigate('public_menu')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'public_menu'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              منيو الزوار (العميل)
            </button>

            <button
              onClick={() => onNavigate('restaurant_admin')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'restaurant_admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Store className="w-4 h-4" />
              لوحة تحكم المطعم
            </button>

            <button
              onClick={() => onNavigate('super_admin')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'super_admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              لوحة Super Admin
            </button>
          </nav>

          {/* Right Action CTA & Firebase Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-right">
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                    {currentUser.email === PRIMARY_SUPER_ADMIN_EMAIL && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-bold">
                        Super Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> متصل بـ Firebase
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="تسجيل الخروج"
                  className="p-1 text-slate-400 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAuthLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('register')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              انضم كشريك مطعم
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              currentView === 'landing' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            الموقع الرئيسي
          </button>
          <button
            onClick={() => {
              onNavigate('public_menu');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              currentView === 'public_menu' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            استعراض منيو الزوار ({activeRestaurant?.nameAr})
          </button>
          <button
            onClick={() => {
              onNavigate('restaurant_admin');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              currentView === 'restaurant_admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            لوحة تحكم المطعم
          </button>
          <button
            onClick={() => {
              onNavigate('super_admin');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              currentView === 'super_admin' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            لوحة Super Admin (إدارة المنصة)
          </button>
          <button
            onClick={() => {
              onNavigate('register');
              setMobileMenuOpen(false);
            }}
            className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-950 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل مطعم جديد
          </button>

          {currentUser ? (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-2 text-xs">
              <span className="text-slate-300">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="w-full text-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول باستخدام Google
            </button>
          )}
        </div>
      )}
    </header>

  );
};

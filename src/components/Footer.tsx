import React from 'react';
import { UtensilsCrossed, ShieldCheck, Heart, MessageCircle, Phone, Mail, Globe } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center p-2 shadow-lg shadow-amber-500/20">
                <UtensilsCrossed className="w-6 h-6 text-slate-950 font-black" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Menu Smart</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              المنصة السحابية الرائدة لإدارة المنيو الرقمي التفاعلي للمطاعم والكافيهات مع نظام الطلب عبر الواتساب ورموز QR الذكية المخصصة.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>نظام عزل بيانات متعدد المستأجرين بنسبة 100%</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              أقسام المنصة
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-amber-400 transition"
                >
                  الموقع التعريفي والمزايا
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('register')}
                  className="hover:text-amber-400 transition font-medium text-amber-500"
                >
                  تسجيل مطعم جديد (تجربة مجانية)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('public_menu')}
                  className="hover:text-amber-400 transition"
                >
                  تجربة منيو الزوار الحي
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('restaurant_admin')}
                  className="hover:text-amber-400 transition"
                >
                  لوحة تحكم صاحب المطعم
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('super_admin')}
                  className="hover:text-amber-400 transition"
                >
                  لوحة إدارة المنصة (Super Admin)
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              مزايا Menu Smart
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>⚡ سرعة تحميل فائقة وتصفح بدون انتظار</li>
              <li>📱 رموز QR ذكية مخصصة لكل طاولة</li>
              <li>💬 استلام الطلبات منسقة مباشرة عبر واتساب</li>
              <li>📊 إحصائيات حية للأطباق الأكثر مبيعاً</li>
              <li>⭐ إدارة تقييمات وملاحظات الزوار</li>
              <li>🌐 دعم اللغتين العربية والإنجليزية</li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              المساعدة وخدمة العملاء
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              فريقنا جاهز لمساعدتكم في إعداد منيو مطعمكم وتدريب الموظفين خلال دقائق.
            </p>
            <div className="space-y-2.5 text-sm">
              <a
                href="https://wa.me/966500000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>دعم مباشر عبر واتساب (24/7)</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4" />
                <span>support@menusmart.app</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="w-4 h-4" />
                <span>المملكة العربية السعودية • الخليج العربي</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Menu Smart SaaS. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">سياسة الخصوصية</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">شروط الخدمة</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">اتفاقية مستوى الخدمة SLA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

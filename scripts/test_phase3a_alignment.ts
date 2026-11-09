import { store } from '../src/services/store';
import { Restaurant } from '../src/types';
import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPhase3ATests() {
  console.log('====================================================');
  console.log('🧪 بدء اختبارات المرحلة 3A: توحيد مخطط بيانات المطاعم');
  console.log('====================================================\n');

  // Test 1: إنشاء مطعم جديد
  console.log('--- اختبار 1: إنشاء مطعم جديد بهيكل access و subscription الموحد ---');
  const testOwnerUid = 'uid-test-owner-7890';
  const testOwnerEmail = 'owner.test@menusmart.eg';
  const newRestaurant = store.registerRestaurant({
    nameAr: 'مطعم الأهرامات الذهبية',
    nameEn: 'Golden Pyramids Grill',
    slug: 'golden-pyramids',
    cuisineType: 'مشاوي شرقية',
    city: 'الجيزة',
    phone: '01099887766',
    whatsappNumber: '201099887766',
    ownerEmail: testOwnerEmail,
    ownerUid: testOwnerUid,
    ownerName: 'محمود فهمي',
    planId: 'pro',
    billingCycle: 'monthly',
  });

  assert(Boolean(newRestaurant && newRestaurant.id), '1.1 تم إنشاء المطعم وحصل على معرف فريد (Tenant ID)');
  assert(newRestaurant.access !== undefined, '1.2 كائن access موجود في المطعم');
  assert(typeof newRestaurant.access.allowDashboard === 'boolean', '1.3 حقل access.allowDashboard معرف كـ boolean');
  assert(typeof newRestaurant.access.allowPublicMenu === 'boolean', '1.4 حقل access.allowPublicMenu معرف كـ boolean');
  assert(newRestaurant.access.allowDashboard === true, '1.5 القيمة الافتراضية لـ allowDashboard هي true');
  assert(newRestaurant.access.allowPublicMenu === true, '1.6 القيمة الافتراضية لـ allowPublicMenu هي true');
  assert(newRestaurant.ownerUid === testOwnerUid, '1.7 معرف المالك (ownerUid) مربوط ومخزن بشكل صحيح');
  assert(newRestaurant.ownerEmail === testOwnerEmail, '1.8 بريد المالك (ownerEmail) مربوط بشكل صحيح');
  assert(newRestaurant.subscription.planId === 'pro', '1.9 باقة الاشتراك pro مسجلة في كائن subscription');
  assert(newRestaurant.subscription.status === 'trial', '1.10 حالة الاشتراك المبدئية trial');

  // Test 2: قراءة إعدادات المطعم
  console.log('\n--- اختبار 2: قراءة إعدادات المطعم والتأكد من مطابقة المخطط ---');
  const loadedRestaurant = store.getRestaurantById(newRestaurant.id);
  assert(loadedRestaurant !== undefined, '2.1 تم العثور على المطعم عبر getRestaurantById');
  assert(loadedRestaurant?.slug === 'golden-pyramids', '2.2 مطابقة المعرف slug');
  assert(loadedRestaurant?.access.allowDashboard === true, '2.3 قراءة allowDashboard بنجاح');
  assert(loadedRestaurant?.access.allowPublicMenu === true, '2.4 قراءة allowPublicMenu بنجاح');
  assert(Boolean(loadedRestaurant?.subscription.renewalDate), '2.5 تاريخ التجديد renewalDate محدد');
  assert(Boolean(loadedRestaurant?.settings.taxPercentage), '2.6 قراءة إعدادات المطعم settings');

  // Test 3: تعديل allowDashboard و allowPublicMenu بواسطة Super Admin
  console.log('\n--- اختبار 3: تعديل allowDashboard و allowPublicMenu بواسطة Super Admin ---');
  store.updateRestaurantAccess(newRestaurant.id, {
    allowDashboard: false,
    allowPublicMenu: false,
  }, 'Super Admin Audit Test');

  const afterAccessUpdate = store.getRestaurantById(newRestaurant.id);
  assert(afterAccessUpdate?.access.allowDashboard === false, '3.1 تم تعطيل allowDashboard بنجاح بواسطة Super Admin');
  assert(afterAccessUpdate?.access.allowPublicMenu === false, '3.2 تم تعطيل allowPublicMenu بنجاح بواسطة Super Admin');

  // إعادة التفعيل
  store.updateRestaurantAccess(newRestaurant.id, {
    allowDashboard: true,
    allowPublicMenu: true,
  }, 'Super Admin Audit Test');
  const restoredAccess = store.getRestaurantById(newRestaurant.id);
  assert(restoredAccess?.access.allowDashboard === true && restoredAccess?.access.allowPublicMenu === true, '3.3 تمت استعادة الصلاحيات بنجاح');

  // Test 4: منع صاحب المطعم من تعديل حقول الاشتراك
  console.log('\n--- اختبار 4: منع صاحب المطعم من تعديل حقول الاشتراك والحالة ---');
  const originalPlanId = loadedRestaurant!.subscription.planId;
  const originalStatus = loadedRestaurant!.status;
  const originalRenewal = loadedRestaurant!.subscription.renewalDate;

  // محاولة تعديل احتيالي من قبل صاحب المطعم (isSuperAdmin = false)
  store.updateRestaurantProfile(newRestaurant.id, {
    nameAr: 'اسم معدل مسموح',
    status: 'active' as any, // محاولة ترقية الحالة ذاتياً
    subscription: {
      planId: 'enterprise', // محاولة ترقية الباقة مجاناً
      billingCycle: 'annual',
      status: 'active',
      startDate: '2026-01-01',
      renewalDate: '2099-01-01', // محاولة مد الاشتراك لعام 2099
      price: 0,
    },
  } as any, false);

  const afterHackingAttempt = store.getRestaurantById(newRestaurant.id);
  assert(afterHackingAttempt?.nameAr === 'اسم معدل مسموح', '4.1 تم قبول تعديل الاسم المصرح به');
  assert(afterHackingAttempt?.status === originalStatus, '4.2 تم إحباط محاولة تعديل status من قبل صاحب المطعم');
  assert(afterHackingAttempt?.subscription.planId === originalPlanId, '4.3 تم إحباط محاولة تغيير planId');
  assert(afterHackingAttempt?.subscription.renewalDate === originalRenewal, '4.4 تم إحباط محاولة تغيير renewalDate');

  // Test 5: منع تغيير ownerUid بعد ربط الملكية
  console.log('\n--- اختبار 5: منع تغيير ownerUid بعد ربط الملكية ---');
  // محاولة 1: عبر bindRestaurantOwnerUid بمعرف آخر
  const rebindResult = store.bindRestaurantOwnerUid(newRestaurant.id, 'attacker-uid-999', testOwnerEmail);
  assert(rebindResult === false, '5.1 رفض إعادة ربط ownerUid لمستخدم آخر');

  // محاولة 2: عبر بريد مختلف
  const emailMismatchResult = store.bindRestaurantOwnerUid(newRestaurant.id, testOwnerUid, 'different.email@attacker.com');
  assert(emailMismatchResult === false, '5.2 رفض ربط UID مع بريد غير مطابق');

  // محاولة 3: عبر updateRestaurantProfile من صاحب المطعم
  store.updateRestaurantProfile(newRestaurant.id, {
    ownerUid: 'stolen-uid-1234',
    ownerEmail: 'hacker@attacker.com',
  } as any, false);

  const afterOwnerTamper = store.getRestaurantById(newRestaurant.id);
  assert(afterOwnerTamper?.ownerUid === testOwnerUid, '5.3 حماية ownerUid من التعديل عبر الملف الشخصي');
  assert(afterOwnerTamper?.ownerEmail === testOwnerEmail, '5.4 حماية ownerEmail من التعديل عبر الملف الشخصي');

  // Test 6: ظهور المنيو العام عند السماح به
  console.log('\n--- اختبار 6: ظهور المنيو العام عند السماح به ---');
  store.updateRestaurantAccess(newRestaurant.id, { allowDashboard: true, allowPublicMenu: true });
  const publicAllowedRest = store.getRestaurantById(newRestaurant.id);
  const isPublicMenuAccessible = Boolean(
    publicAllowedRest &&
    publicAllowedRest.access.allowPublicMenu === true &&
    publicAllowedRest.status !== 'blocked'
  );
  assert(isPublicMenuAccessible === true, '6.1 المنيو العام متاح ومعروض بنجاح للجمهور');

  // Test 7: حجب المنيو العام عند تعطيله
  console.log('\n--- اختبار 7: حجب المنيو العام عند تعطيله ---');
  store.updateRestaurantAccess(newRestaurant.id, { allowDashboard: true, allowPublicMenu: false });
  const publicBlockedRest = store.getRestaurantById(newRestaurant.id);
  const isPublicMenuBlocked = Boolean(
    !publicBlockedRest ||
    publicBlockedRest.access.allowPublicMenu === false ||
    publicBlockedRest.status === 'blocked'
  );
  assert(isPublicMenuBlocked === true, '7.1 المنيو العام محجوب تماماً عند ضبط allowPublicMenu = false');

  // Test 8: فحص انتهاء الاشتراك في store.isSubscriptionActive
  console.log('\n--- اختبار 8: فحص انتهاء صلاحية الاشتراك عبر التاريخ والحالة ---');
  // اختبار مطعم فعال
  const activeCheck = store.isSubscriptionActive(newRestaurant.id);
  assert(activeCheck.isValid === true, '8.1 الاشتراك التجريبي الحالي صالح وغير منتهي');

  // إنشاء مطعم منتهي التاريخ
  const expiredRest = store.registerRestaurant({
    nameAr: 'مطعم منتهي الصلاحية',
    nameEn: 'Expired Grill',
    slug: 'expired-grill',
    cuisineType: 'برجر',
    city: 'القاهرة',
    phone: '01011112222',
    whatsappNumber: '201011112222',
    ownerEmail: 'expired@test.com',
    ownerUid: 'uid-expired-1',
    planId: 'starter',
    billingCycle: 'monthly',
  });
  // تعيين تاريخ تجديد سابق يدوياً كمحاكاة للانتهاء
  expiredRest.subscription.renewalDate = '2025-01-01';
  const expiredCheck = store.isSubscriptionActive(expiredRest.id);
  assert(expiredCheck.isValid === false, '8.2 تم رصد انتهاء صلاحية الاشتراك بناءً على التاريخ بدقة');
  assert(expiredCheck.status === 'expired', '8.3 تم تصنيف الحالة كـ expired');

  // Test 9: فحص توافق المخطط في الملفات والقواعد
  console.log('\n--- اختبار 9: التحقق من عدم وجود أي استخدام قديم لـ allowDashboardAccess ---');
  const firestoreRulesContent = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
  const blueprintContent = fs.readFileSync(path.join(process.cwd(), 'firebase-blueprint.json'), 'utf8');

  assert(!firestoreRulesContent.includes('allowDashboardAccess'), '9.1 لا يوجد allowDashboardAccess داخل firestore.rules');
  assert(!blueprintContent.includes('allowDashboardAccess'), '9.2 لا يوجد allowDashboardAccess داخل firebase-blueprint.json');
  assert(firestoreRulesContent.includes('resource.data.access.allowPublicMenu == true'), '9.3 firestore.rules تقرأ access.allowPublicMenu الموحد');
  assert(firestoreRulesContent.includes('incoming().access.allowDashboard == existing().access.allowDashboard'), '9.4 firestore.rules تحمي access.allowDashboard الموحد');

  console.log('\n====================================================');
  console.log(`🎉 اكتملت جميع الاختبارات بنجاح تام! (${passedTests}/${totalTests})`);
  console.log('====================================================\n');
}

runPhase3ATests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

import { store, PRIMARY_SUPER_ADMIN_EMAIL } from '../src/services/store';
import { Restaurant } from '../src/types';

// Standalone Phase 3A verification runner
function runPhase3ATests() {
  console.log('====================================================');
  console.log('     MENU SMART - PHASE 3A VERIFICATION SUITE       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean, extraInfo?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${description} ${extraInfo ? `-> ${extraInfo}` : ''}`);
      failed++;
    }
  }

  // 1. Create New Restaurant Test
  console.log('--- TEST 1: إنشاء مطعم جديد وتوثيق المعرفات ---');
  const testUid = 'firebase-user-uid-test-12345';
  const testEmail = 'chef.ahmed@menusmart-test.eg';
  const testSlug = `test-shawarma-${Date.now().toString().slice(-4)}`;

  const createdRest = store.registerRestaurant({
    nameAr: 'شاورما الشام التجريبية',
    nameEn: 'Sham Shawarma Test',
    slug: testSlug,
    cuisineType: 'شاورما ومشاوي',
    city: 'القاهرة',
    phone: '+201099887766',
    whatsappNumber: '201099887766',
    ownerEmail: testEmail,
    ownerUid: testUid,
    ownerName: 'أحمد الشامي',
    planId: 'starter',
    billingCycle: 'monthly',
  });

  assert('إنشاء المطعم بنجاح وتوليد معرف فريد', !!createdRest.id && createdRest.id.startsWith('rest-'));
  assert('تثبيت ownerUid الموثق للمطعم', createdRest.ownerUid === testUid, `Actual: ${createdRest.ownerUid}`);
  assert('تثبيت ownerEmail للمطعم', createdRest.ownerEmail === testEmail, `Actual: ${createdRest.ownerEmail}`);
  assert('حالة المطعم الجديد قيد المراجعة (pending)', createdRest.status === 'pending', `Actual: ${createdRest.status}`);
  assert(
    'هيكل الصلاحيات الموحد access: { allowDashboard, allowPublicMenu }',
    createdRest.access &&
    typeof createdRest.access.allowDashboard === 'boolean' &&
    typeof createdRest.access.allowPublicMenu === 'boolean',
    `Actual access: ${JSON.stringify(createdRest.access)}`
  );

  // 2. Read Restaurant Settings Test
  console.log('\n--- TEST 2: قراءة إعدادات المطعم والصلاحيات ---');
  const fetchedRest = store.getRestaurantById(createdRest.id);
  assert('استرجاع المطعم بالمعرف بنجاح', !!fetchedRest && fetchedRest.id === createdRest.id);
  assert('قراءة إعدادات المطعم (settings.enableOrdering)', fetchedRest?.settings?.enableOrdering === true);
  assert('قراءة نسبة الضريبة الافتراضية', typeof fetchedRest?.settings?.taxPercentage === 'number');
  assert('قراءة العملة بالجنيه المصري (ج.م)', fetchedRest?.currency === 'ج.م', `Actual: ${fetchedRest?.currency}`);

  // 3. Super Admin Access Modification Test
  console.log('\n--- TEST 3: تعديل allowDashboard وallowPublicMenu بواسطة Super Admin ---');
  store.updateRestaurantAccess(createdRest.id, { allowDashboard: false, allowPublicMenu: false });
  let updatedRest = store.getRestaurantById(createdRest.id);
  assert('تعطيل لوحة التحكم والمنيو العام بنجاح', updatedRest?.access.allowDashboard === false && updatedRest?.access.allowPublicMenu === false);

  store.updateRestaurantAccess(createdRest.id, { allowDashboard: true, allowPublicMenu: true });
  updatedRest = store.getRestaurantById(createdRest.id);
  assert('إعادة تفعيل لوحة التحكم والمنيو العام بنجاح', updatedRest?.access.allowDashboard === true && updatedRest?.access.allowPublicMenu === true);

  // 4. Prevention of Owner modifying Subscription fields Test
  console.log('\n--- TEST 4: منع صاحب المطعم من تعديل حقول الاشتراك والوضع الإداري ---');
  const originalPlanId = updatedRest?.subscription.planId;
  const originalStatus = updatedRest?.status;
  const originalRenewalDate = updatedRest?.subscription.renewalDate;

  // Attempt hostile update as restaurant owner (isSuperAdmin = false)
  store.updateRestaurantProfile(
    createdRest.id,
    {
      nameAr: 'شاورما الشام - اسم محدث شرعياً',
      status: 'active', // Unauthorized attempt to self-activate
      subscription: {
        planId: 'enterprise', // Unauthorized upgrade
        billingCycle: 'annual',
        status: 'active',
        startDate: '2020-01-01',
        renewalDate: '2099-01-01', // Unauthorized extension
        price: 0,
      },
    } as any,
    false // Non-admin caller
  );

  const afterHostileUpdate = store.getRestaurantById(createdRest.id);
  assert('السماح بتحديث الاسم التشغيلي المسموح', afterHostileUpdate?.nameAr === 'شاورما الشام - اسم محدث شرعياً');
  assert('منع تعديل حالة المطعم status وتظل pending', afterHostileUpdate?.status === originalStatus, `Actual: ${afterHostileUpdate?.status}`);
  assert('منع ترقية الباقة planId', afterHostileUpdate?.subscription.planId === originalPlanId, `Actual: ${afterHostileUpdate?.subscription.planId}`);
  assert('منع تمديد تاريخ التجديد renewalDate', afterHostileUpdate?.subscription.renewalDate === originalRenewalDate, `Actual: ${afterHostileUpdate?.subscription.renewalDate}`);

  // 5. Prevention of changing ownerUid after binding Test
  console.log('\n--- TEST 5: منع تغيير أو انتحال ownerUid بعد ربط الملكية ---');
  // Attempt to re-bind with different UID
  const rebindResult = store.bindRestaurantOwnerUid(createdRest.id, 'hacker-uid-888', 'hacker@attacker.com');
  assert('رفض محاولة إعادة ربط ownerUid لمطعم مقيد مسبقاً', rebindResult === false);

  // Attempt via profile update as non-admin
  store.updateRestaurantProfile(
    createdRest.id,
    {
      ownerUid: 'hacker-uid-888',
      ownerEmail: 'hacker@attacker.com',
    } as any,
    false
  );
  const afterUidTamper = store.getRestaurantById(createdRest.id);
  assert('بقاء ownerUid الأصلي دون تغيير', afterUidTamper?.ownerUid === testUid, `Actual: ${afterUidTamper?.ownerUid}`);
  assert('بقاء ownerEmail الأصلي دون تغيير', afterUidTamper?.ownerEmail === testEmail, `Actual: ${afterUidTamper?.ownerEmail}`);

  // 6. Public Menu Visibility when allowed
  console.log('\n--- TEST 6: ظهور المنيو العام عند السماح به وتفعيل المطعم ---');
  store.updateRestaurantStatus(createdRest.id, 'active');
  store.updateRestaurantAccess(createdRest.id, { allowDashboard: true, allowPublicMenu: true });
  const activeRest = store.getRestaurantById(createdRest.id)!;
  const isPublicMenuAccessible = activeRest.access.allowPublicMenu === true && activeRest.status === 'active';
  assert('المنيو العام متاح للزوار (allowPublicMenu == true && status == "active")', isPublicMenuAccessible === true);

  // 7. Public Menu Blocked when disabled
  console.log('\n--- TEST 7: حجب المنيو العام عند تعطيله ---');
  store.updateRestaurantAccess(createdRest.id, { allowDashboard: true, allowPublicMenu: false });
  const disabledMenuRest = store.getRestaurantById(createdRest.id)!;
  const isMenuBlockedWhenDisabled = !(disabledMenuRest.access.allowPublicMenu === true && disabledMenuRest.status === 'active');
  assert('حجب المنيو العام عند allowPublicMenu === false', isMenuBlockedWhenDisabled === true);

  // Test when blocked by status
  store.updateRestaurantStatus(createdRest.id, 'blocked');
  const blockedRest = store.getRestaurantById(createdRest.id)!;
  const isMenuBlockedWhenStatusBlocked = !(blockedRest.access.allowPublicMenu === true && blockedRest.status === 'active');
  assert('حجب المنيو العام عند status === "blocked"', isMenuBlockedWhenStatusBlocked === true);

  // Test 8: Subscription Expiration Check
  console.log('\n--- TEST 8: التحقق من صلاحية الاشتراك وإيقاف المنتهي ---');
  store.updateRestaurantStatus(createdRest.id, 'active');
  const expiredRest = store.getRestaurantById(createdRest.id)!;
  expiredRest.subscription.renewalDate = '2020-01-01'; // Expired date in the past
  const subActiveCheck = store.isSubscriptionActive(createdRest.id);
  assert(
    'كشف انتهاء الاشتراك تلقائياً عند تجاوز تاريخ التجديد',
    subActiveCheck.isValid === false && subActiveCheck.status === 'expired',
    `status: ${subActiveCheck.status}, isValid: ${subActiveCheck.isValid}`
  );

  console.log('\n====================================================');
  console.log(`نتائج الاختبارات: ${passed} ناجح | ${failed} فاشل`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3ATests();

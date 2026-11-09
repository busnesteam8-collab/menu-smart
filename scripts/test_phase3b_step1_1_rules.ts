// Automated verification suite for Phase 3B Step 1.1: Secure Subscription Expiry Enforcement

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function compareTimestamps(t1: FirestoreTimestamp, t2: FirestoreTimestamp): number {
  if (t1.seconds !== t2.seconds) {
    return t1.seconds - t2.seconds;
  }
  return t1.nanoseconds - t2.nanoseconds;
}

export function isTimestamp(val: any): val is FirestoreTimestamp {
  return typeof val === 'object' && val !== null && typeof val.seconds === 'number' && typeof val.nanoseconds === 'number';
}

interface RuleContext {
  auth?: {
    uid: string;
    token: {
      email?: string;
      email_verified?: boolean;
    };
  } | null;
  requestTime: FirestoreTimestamp; // Exactly mirrors Firestore request.time
}

interface RestaurantDoc {
  id: string;
  nameAr: string;
  ownerUid?: string;
  ownerEmail?: string;
  status: 'active' | 'suspended' | 'blocked' | 'pending' | 'expired';
  access: {
    allowDashboard: boolean;
    allowPublicMenu: boolean;
  };
  subscription?: {
    planId: string;
    status: 'active' | 'expired' | 'trial';
    renewalDate: string; // ISO string 'YYYY-MM-DD'
    renewalTimestamp?: FirestoreTimestamp; // Firestore Timestamp
    [k: string]: any;
  };
  [k: string]: any;
}

const dbStore: Record<string, RestaurantDoc> = {};

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isSuperAdmin(ctx: RuleContext): boolean {
  return ctx.auth != null &&
         ctx.auth.token.email === 'busnesteam8@gmail.com' &&
         ctx.auth.token.email_verified === true;
}

function getRestaurantData(restaurantId: string): RestaurantDoc {
  const rest = dbStore[restaurantId];
  if (!rest) {
    throw new Error(`Document not found: /databases/(default)/documents/restaurants/${restaurantId}`);
  }
  return rest;
}

function isRestaurantOwnerIdentity(restaurantId: string, ctx: RuleContext): boolean {
  try {
    const rest = getRestaurantData(restaurantId);
    if (!ctx.auth) return false;
    const matchUid = rest.ownerUid !== undefined && rest.ownerUid === ctx.auth.uid;
    const matchEmail = rest.ownerUid === undefined &&
                       rest.ownerEmail !== undefined &&
                       rest.ownerEmail === ctx.auth.token.email &&
                       ctx.auth.token.email_verified === true;
    return matchUid || matchEmail;
  } catch {
    return false;
  }
}

// Updated isOperationalRestaurantOwner function exactly mirroring firestore.rules
function isOperationalRestaurantOwner(restaurantId: string, ctx: RuleContext): boolean {
  try {
    const rest = getRestaurantData(restaurantId);
    return isRestaurantOwnerIdentity(restaurantId, ctx) &&
           rest.status === 'active' &&
           (rest.access && rest.access.allowDashboard === true) &&
           ('subscription' in rest) &&
           (rest.subscription?.status === 'active' || rest.subscription?.status === 'trial') &&
           ('renewalTimestamp' in (rest.subscription || {})) &&
           isTimestamp(rest.subscription?.renewalTimestamp) &&
           compareTimestamps(rest.subscription.renewalTimestamp, ctx.requestTime) > 0;
  } catch {
    return false;
  }
}

// Subcollection Operations
function evaluateCategoryWrite(restaurantId: string, categoryId: string, incoming: any, ctx: RuleContext): boolean {
  if (!isValidId(categoryId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (typeof incoming.name !== 'string' || incoming.name.length === 0 || incoming.name.length > 100) return false;
  return isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
}

function evaluateMenuItemWrite(restaurantId: string, itemId: string, incoming: any, ctx: RuleContext): boolean {
  if (!isValidId(itemId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (typeof incoming.name !== 'string' || incoming.name.length === 0 || incoming.name.length > 120) return false;
  if (typeof incoming.price !== 'number' || incoming.price < 0) return false;
  return isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
}

function evaluateTableWrite(restaurantId: string, tableId: string, incoming: any, ctx: RuleContext): boolean {
  if (!isValidId(tableId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (typeof incoming.tableNumber !== 'string' || incoming.tableNumber.length === 0 || incoming.tableNumber.length > 40) return false;
  return isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
}

function evaluateOrderCreate(restaurantId: string, orderId: string, incoming: any): boolean {
  if (!isValidId(orderId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (incoming.status !== 'pending') return false;
  if (typeof incoming.totalAmount !== 'number' || incoming.totalAmount < 0 || incoming.totalAmount > 50000) return false;
  if (typeof incoming.customerName !== 'string' || incoming.customerName.length === 0 || incoming.customerName.length > 80) return false;
  if (typeof incoming.orderNumber !== 'string' || incoming.orderNumber.length > 32) return false;
  if (!Array.isArray(incoming.items) || incoming.items.length === 0 || incoming.items.length > 100) return false;
  return true;
}

function evaluateOrderUpdate(restaurantId: string, existing: any, incoming: any, ctx: RuleContext): boolean {
  const allowed = isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
  if (!allowed) return false;
  if (incoming.restaurantId !== existing.restaurantId) return false;
  if (incoming.orderNumber !== existing.orderNumber) return false;
  if (incoming.customerName !== existing.customerName) return false;
  return true;
}

function evaluateReviewCreate(restaurantId: string, reviewId: string, incoming: any): boolean {
  if (!isValidId(reviewId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (typeof incoming.rating !== 'number' || incoming.rating < 1 || incoming.rating > 5) return false;
  if (incoming.isApproved !== false) return false;
  if (typeof incoming.customerName !== 'string' || incoming.customerName.length === 0 || incoming.customerName.length > 80) return false;
  if (incoming.comment !== undefined && (typeof incoming.comment !== 'string' || incoming.comment.length > 600)) return false;
  return true;
}

function evaluateReviewUpdate(restaurantId: string, existing: any, incoming: any, ctx: RuleContext): boolean {
  const allowed = isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
  if (!allowed) return false;
  if (incoming.restaurantId !== existing.restaurantId) return false;
  if (incoming.rating !== existing.rating) return false;
  if (incoming.customerName !== existing.customerName) return false;
  return true;
}

function evaluateRestaurantUpdate(restaurantId: string, incoming: any, ctx: RuleContext): boolean {
  const existing = dbStore[restaurantId];
  if (!existing || !isValidId(restaurantId)) return false;

  if (isSuperAdmin(ctx)) return true;

  const isOwner = ctx.auth != null && (
    (existing.ownerUid !== undefined && existing.ownerUid === ctx.auth.uid) ||
    (existing.ownerUid === undefined && existing.ownerEmail !== undefined && existing.ownerEmail === ctx.auth.token.email && ctx.auth.token.email_verified === true)
  );

  if (!isOwner) return false;
  if (existing.status !== 'active') return false;
  if (existing.access?.allowDashboard !== true) return false;

  // Subscription must be valid and unexpired for the owner to update the restaurant profile
  if (!('subscription' in existing)) return false;
  if (existing.subscription?.status !== 'active' && existing.subscription?.status !== 'trial') return false;
  if (!('renewalTimestamp' in (existing.subscription || {}))) return false;
  if (!isTimestamp(existing.subscription?.renewalTimestamp)) return false;
  if (compareTimestamps(existing.subscription.renewalTimestamp, ctx.requestTime) <= 0) return false;

  // Locked identifier & status
  if (incoming.id !== existing.id) return false;
  if (incoming.status !== existing.status) return false;

  // Locked ownership
  if (incoming.ownerEmail !== existing.ownerEmail) return false;
  const uidValid = existing.ownerUid !== undefined
    ? incoming.ownerUid === existing.ownerUid
    : incoming.ownerUid === ctx.auth?.uid;
  if (!uidValid) return false;

  // Locked access
  if (incoming.access?.allowDashboard !== existing.access?.allowDashboard) return false;
  if (incoming.access?.allowPublicMenu !== existing.access?.allowPublicMenu) return false;

  // Locked subscription fields: owner cannot modify subscription, planId, renewalDate, or renewalTimestamp
  if (existing.planId !== undefined && incoming.planId !== existing.planId) return false;
  if (existing.subscription !== undefined && JSON.stringify(incoming.subscription) !== JSON.stringify(existing.subscription)) return false;
  if (existing.subscriptionStartDate !== undefined && incoming.subscriptionStartDate !== existing.subscriptionStartDate) return false;
  if (existing.subscriptionEndDate !== undefined && incoming.subscriptionEndDate !== existing.subscriptionEndDate) return false;

  return true;
}

// ----------------- TEST EXECUTION -----------------
console.log('================================================================');
console.log('  MENU SMART - PHASE 3B STEP 1.1 RULES VERIFICATION SUITE       ');
console.log('  Testing Native Firestore Timestamp Subscription Expiry Logic  ');
console.log('================================================================\n');

// Standard Server Request Time: 2026-11-07 12:00:00 UTC
const serverTime: FirestoreTimestamp = { seconds: 1794052800, nanoseconds: 0 };
// Future Time (e.g. 2027-01-01)
const futureTimestamp: FirestoreTimestamp = { seconds: 1798761600, nanoseconds: 0 };
// Past Time (e.g. 2025-01-01)
const pastTimestamp: FirestoreTimestamp = { seconds: 1735689600, nanoseconds: 0 };
// Exact Equal Time
const exactMatchTimestamp: FirestoreTimestamp = { seconds: 1794052800, nanoseconds: 0 };

// Setup Test Databases
dbStore['rest-1-active-valid'] = {
  id: 'rest-1-active-valid',
  nameAr: 'مطعم نشط واشتراك سارٍ',
  ownerUid: 'uid-1',
  ownerEmail: 'owner1@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'pro',
    status: 'active',
    renewalDate: '2027-01-01',
    renewalTimestamp: futureTimestamp,
  },
};

dbStore['rest-2-past-timestamp'] = {
  id: 'rest-2-past-timestamp',
  nameAr: 'مطعم نشط ولكن تاريخ التجديد في الماضي',
  ownerUid: 'uid-2',
  ownerEmail: 'owner2@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'pro',
    status: 'active', // status says active, but timestamp is expired!
    renewalDate: '2025-01-01',
    renewalTimestamp: pastTimestamp,
  },
};

dbStore['rest-3-exact-match-timestamp'] = {
  id: 'rest-3-exact-match-timestamp',
  nameAr: 'مطعم تاريخ التجديد يساوي وقت الخادم بالثانية',
  ownerUid: 'uid-3',
  ownerEmail: 'owner3@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'starter',
    status: 'active',
    renewalDate: '2026-11-07',
    renewalTimestamp: exactMatchTimestamp,
  },
};

dbStore['rest-4-status-expired'] = {
  id: 'rest-4-status-expired',
  nameAr: 'مطعم نشط ولكن حالة الاشتراك expired',
  ownerUid: 'uid-4',
  ownerEmail: 'owner4@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'starter',
    status: 'expired',
    renewalDate: '2027-01-01',
    renewalTimestamp: futureTimestamp,
  },
};

dbStore['rest-5-no-timestamp'] = {
  id: 'rest-5-no-timestamp',
  nameAr: 'مطعم نشط بدون حقل renewalTimestamp',
  ownerUid: 'uid-5',
  ownerEmail: 'owner5@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'starter',
    status: 'active',
    renewalDate: '2027-01-01',
    // renewalTimestamp is intentionally missing!
  },
};

dbStore['rest-6-suspended'] = {
  id: 'rest-6-suspended',
  nameAr: 'مطعم معلق واشتراكه سارٍ',
  ownerUid: 'uid-6',
  ownerEmail: 'owner6@test.com',
  status: 'suspended',
  access: { allowDashboard: true, allowPublicMenu: true },
  subscription: {
    planId: 'pro',
    status: 'active',
    renewalDate: '2027-01-01',
    renewalTimestamp: futureTimestamp,
  },
};

dbStore['rest-7-disabled-dashboard'] = {
  id: 'rest-7-disabled-dashboard',
  nameAr: 'مطعم نشط ولكن allowDashboard معطل',
  ownerUid: 'uid-7',
  ownerEmail: 'owner7@test.com',
  status: 'active',
  access: { allowDashboard: false, allowPublicMenu: true },
  subscription: {
    planId: 'pro',
    status: 'active',
    renewalDate: '2027-01-01',
    renewalTimestamp: futureTimestamp,
  },
};

dbStore['rest-8-legacy-restaurant'] = {
  id: 'rest-8-legacy-restaurant',
  nameAr: 'مطعم قديم بدون renewalTimestamp',
  ownerEmail: 'legacy@test.com',
  status: 'active',
  access: { allowDashboard: true, allowPublicMenu: true },
  // No subscription object or no renewalTimestamp
};

let passed = 0;
let total = 0;

function assertTest(desc: string, actual: boolean, expected: boolean) {
  total++;
  if (actual === expected) {
    passed++;
    console.log(`  [PASS] Test ${total}: ${desc}`);
  } else {
    console.error(`  [FAIL] Test ${total}: ${desc} (Expected ${expected}, got ${actual})`);
  }
}

// User Contexts
const ctx1: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-1', token: { email: 'owner1@test.com', email_verified: true } } };
const ctx2: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-2', token: { email: 'owner2@test.com', email_verified: true } } };
const ctx3: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-3', token: { email: 'owner3@test.com', email_verified: true } } };
const ctx4: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-4', token: { email: 'owner4@test.com', email_verified: true } } };
const ctx5: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-5', token: { email: 'owner5@test.com', email_verified: true } } };
const ctx6: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-6', token: { email: 'owner6@test.com', email_verified: true } } };
const ctx7: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-7', token: { email: 'owner7@test.com', email_verified: true } } };
const legacyCtx: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-legacy', token: { email: 'legacy@test.com', email_verified: true } } };
const adminCtx: RuleContext = { requestTime: serverTime, auth: { uid: 'uid-admin', token: { email: 'busnesteam8@gmail.com', email_verified: true } } };

console.log('--- 1. Required Ten Scenarios ---');

// 1. مطعم active واشتراكه ساري وrenewalTimestamp في المستقبل: ALLOW
assertTest('1. مطعم active واشتراكه ساري و renewalTimestamp في المستقبل -> ALLOW',
  evaluateCategoryWrite('rest-1-active-valid', 'cat-1', { restaurantId: 'rest-1-active-valid', name: 'مشويات' }, ctx1),
  true
);

// 2. مطعم active لكن renewalTimestamp في الماضي: DENY
assertTest('2. مطعم active لكن renewalTimestamp في الماضي -> DENY',
  evaluateCategoryWrite('rest-2-past-timestamp', 'cat-2', { restaurantId: 'rest-2-past-timestamp', name: 'أطباق جديدة' }, ctx2),
  false
);

// 3. مطعم active لكن renewalTimestamp يساوي request.time: DENY
assertTest('3. مطعم active لكن renewalTimestamp يساوي request.time تماماً -> DENY',
  evaluateCategoryWrite('rest-3-exact-match-timestamp', 'cat-3', { restaurantId: 'rest-3-exact-match-timestamp', name: 'مقبلات' }, ctx3),
  false
);

// 4. مطعم active لكن subscription.status == expired: DENY
assertTest('4. مطعم active لكن subscription.status == expired -> DENY',
  evaluateCategoryWrite('rest-4-status-expired', 'cat-4', { restaurantId: 'rest-4-status-expired', name: 'حلويات' }, ctx4),
  false
);

// 5. مطعم active دون renewalTimestamp: DENY
assertTest('5. مطعم active دون renewalTimestamp -> DENY',
  evaluateCategoryWrite('rest-5-no-timestamp', 'cat-5', { restaurantId: 'rest-5-no-timestamp', name: 'عصائر' }, ctx5),
  false
);

// 6. مطعم suspended واشتراكه ساري: DENY للمالك
assertTest('6. مطعم suspended واشتراكه ساري -> DENY للمالك',
  evaluateCategoryWrite('rest-6-suspended', 'cat-6', { restaurantId: 'rest-6-suspended', name: 'ساندوتشات' }, ctx6),
  false
);

// 7. مطعم allowDashboard == false: DENY للمالك
assertTest('7. مطعم allowDashboard == false -> DENY للمالك',
  evaluateCategoryWrite('rest-7-disabled-dashboard', 'cat-7', { restaurantId: 'rest-7-disabled-dashboard', name: 'وجبات عائلية' }, ctx7),
  false
);

// 8. Super Admin مع مطعم منتهٍ: ALLOW إداريًا
assertTest('8. Super Admin مع مطعم منتهٍ -> ALLOW إدارياً',
  evaluateCategoryWrite('rest-2-past-timestamp', 'cat-admin-1', { restaurantId: 'rest-2-past-timestamp', name: 'تصنيف إداري' }, adminCtx),
  true
);

// 9. Super Admin مع مطعم معلق: ALLOW إداريًا
assertTest('9. Super Admin مع مطعم معلق -> ALLOW إدارياً',
  evaluateCategoryWrite('rest-6-suspended', 'cat-admin-2', { restaurantId: 'rest-6-suspended', name: 'تصنيف مصرح به' }, adminCtx),
  true
);

// 10. مالك مطعم A يحاول الكتابة في مطعم B: DENY
assertTest('10. مالك مطعم A يحاول الكتابة في مطعم B -> DENY',
  evaluateCategoryWrite('rest-2-past-timestamp', 'cat-hack', { restaurantId: 'rest-2-past-timestamp', name: 'اختراق بين المستأجرين' }, ctx1),
  false
);

console.log('\n--- 2. Additional Subcollection & Path Protection Tests ---');

// Menu Items check on expired restaurant
assertTest('11. مالك مطعم منتهٍ يمنع من إضافة صنف طعام -> DENY',
  evaluateMenuItemWrite('rest-2-past-timestamp', 'item-x', { restaurantId: 'rest-2-past-timestamp', name: 'طبق', price: 50 }, ctx2),
  false
);

// Tables check on expired restaurant
assertTest('12. مالك مطعم منتهٍ يمنع من إضافة طاولة -> DENY',
  evaluateTableWrite('rest-2-past-timestamp', 'tbl-x', { restaurantId: 'rest-2-past-timestamp', tableNumber: 'طاولة 1' }, ctx2),
  false
);

// Order status update on expired restaurant
assertTest('13. مالك مطعم منتهٍ يمنع من تحديث حالة الطلبات -> DENY',
  evaluateOrderUpdate('rest-2-past-timestamp',
    { restaurantId: 'rest-2-past-timestamp', orderNumber: '#101', customerName: 'سعيد' },
    { restaurantId: 'rest-2-past-timestamp', orderNumber: '#101', customerName: 'سعيد', status: 'accepted' },
    ctx2
  ),
  false
);

// Review approval on expired restaurant
assertTest('14. مالك مطعم منتهٍ يمنع من اعتماد التقييمات -> DENY',
  evaluateReviewUpdate('rest-2-past-timestamp',
    { restaurantId: 'rest-2-past-timestamp', rating: 5, customerName: 'عميل' },
    { restaurantId: 'rest-2-past-timestamp', rating: 5, customerName: 'عميل', isApproved: true },
    ctx2
  ),
  false
);

// Restaurant document profile update on expired restaurant
assertTest('15. مالك مطعم منتهٍ يمنع من تعديل ملف المطعم -> DENY',
  evaluateRestaurantUpdate('rest-2-past-timestamp', {
    ...dbStore['rest-2-past-timestamp'],
    description: 'تعديل وصف مطعم منتهي الاشتراك'
  }, ctx2),
  false
);

// Owner trying to modify their own renewalTimestamp or subscription
assertTest('16. مالك مطعم نشط يمنع من تمديد renewalTimestamp لنفسه -> DENY',
  evaluateRestaurantUpdate('rest-1-active-valid', {
    ...dbStore['rest-1-active-valid'],
    subscription: {
      ...dbStore['rest-1-active-valid'].subscription,
      renewalTimestamp: { seconds: 1999999999, nanoseconds: 0 }
    }
  }, ctx1),
  false
);

// Super Admin can extend renewalTimestamp and fix subscription on expired restaurant
assertTest('17. Super Admin يستطيع تمديد اشتراك مطعم منتهٍ وتعديل renewalTimestamp -> ALLOW',
  evaluateRestaurantUpdate('rest-2-past-timestamp', {
    ...dbStore['rest-2-past-timestamp'],
    subscription: {
      ...dbStore['rest-2-past-timestamp'].subscription,
      renewalTimestamp: futureTimestamp,
      status: 'active'
    }
  }, adminCtx),
  true
);

console.log('\n--- 3. Public Customer Order & Review Verification ---');

// Public customer can create valid pending order
assertTest('18. الزائر يستطيع إنشاء طلب جديد بحالة pending فقط -> ALLOW',
  evaluateOrderCreate('rest-1-active-valid', 'ord-new', {
    restaurantId: 'rest-1-active-valid',
    status: 'pending',
    totalAmount: 120,
    customerName: 'محمد أحمد',
    orderNumber: '#ORD-77',
    items: [{ id: 'item-1', name: 'برجر', qty: 1 }]
  }),
  true
);

// Public customer cannot create non-pending order
assertTest('19. الزائر يمنع من إنشاء طلب بحالة accepted مباشرة -> DENY',
  evaluateOrderCreate('rest-1-active-valid', 'ord-hack', {
    restaurantId: 'rest-1-active-valid',
    status: 'accepted',
    totalAmount: 120,
    customerName: 'مخترق',
    orderNumber: '#ORD-88',
    items: [{ id: 'item-1', qty: 1 }]
  }),
  false
);

// Public customer can submit unapproved review
assertTest('20. الزائر يستطيع إرسال تقييم بحالة isApproved == false فقط -> ALLOW',
  evaluateReviewCreate('rest-1-active-valid', 'rev-new', {
    restaurantId: 'rest-1-active-valid',
    rating: 5,
    customerName: 'خالد',
    comment: 'خدمة ممتازة',
    isApproved: false
  }),
  true
);

// Public customer cannot submit self-approved review
assertTest('21. الزائر يمنع من اعتماد التقييم ذاتياً (isApproved: true) -> DENY',
  evaluateReviewCreate('rest-1-active-valid', 'rev-bypass', {
    restaurantId: 'rest-1-active-valid',
    rating: 5,
    customerName: 'مخادع',
    isApproved: true
  }),
  false
);

console.log('\n--- 4. Legacy Restaurant Compatibility ---');

// Legacy restaurant without renewalTimestamp is DENIED operational writes for owner
assertTest('22. صاحب مطعم قديم بدون renewalTimestamp يمنع من العمليات التشغيلية -> DENY',
  evaluateCategoryWrite('rest-8-legacy-restaurant', 'cat-leg', { restaurantId: 'rest-8-legacy-restaurant', name: 'قسم جديد' }, legacyCtx),
  false
);

// Super Admin can access and migrate legacy restaurant
assertTest('23. Super Admin يستطيع الوصول وتحديث المطعم القديم وإضافة renewalTimestamp -> ALLOW',
  evaluateRestaurantUpdate('rest-8-legacy-restaurant', {
    ...dbStore['rest-8-legacy-restaurant'],
    subscription: {
      planId: 'starter',
      status: 'active',
      startDate: '2026-11-07',
      renewalDate: '2027-01-01',
      renewalTimestamp: futureTimestamp
    }
  }, adminCtx),
  true
);

console.log(`\n================================================================`);
console.log(`  RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log(`================================================================\n`);

if (passed === total) {
  console.log('ALL PHASE 3B STEP 1.1 RULES TESTS PASSED WITH 100% SUCCESS!\n');
} else {
  process.exit(1);
}

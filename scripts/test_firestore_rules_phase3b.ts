import fs from 'fs';

// Accurate emulator for the boolean logic defined in firestore.rules
interface RuleContext {
  auth?: {
    uid: string;
    token: {
      email?: string;
      email_verified?: boolean;
    };
  } | null;
  database?: string;
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
    status: string;
    renewalDate: string;
    [k: string]: any;
  };
  planId?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  [k: string]: any;
}

// Global DB Mock
const dbStore: {
  restaurants: Record<string, RestaurantDoc>;
  categories: Record<string, any>;
  menu_items: Record<string, any>;
  tables: Record<string, any>;
  orders: Record<string, any>;
  reviews: Record<string, any>;
} = {
  restaurants: {},
  categories: {},
  menu_items: {},
  tables: {},
  orders: {},
  reviews: {},
};

// Implement Firestore Rule Helper functions exactly as written in firestore.rules
function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isSuperAdmin(ctx: RuleContext): boolean {
  return ctx.auth != null &&
         ctx.auth.token.email === 'busnesteam8@gmail.com' &&
         ctx.auth.token.email_verified === true;
}

function getRestaurantData(restaurantId: string): RestaurantDoc {
  const rest = dbStore.restaurants[restaurantId];
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

function isOperationalRestaurantOwner(restaurantId: string, ctx: RuleContext): boolean {
  try {
    const rest = getRestaurantData(restaurantId);
    return isRestaurantOwnerIdentity(restaurantId, ctx) &&
           rest.status === 'active' &&
           rest.access &&
           rest.access.allowDashboard === true;
  } catch {
    return false;
  }
}

// Operations evaluation
function evaluateRestaurantRead(restaurantId: string, ctx: RuleContext): boolean {
  const resource = dbStore.restaurants[restaurantId];
  if (!resource) return false;

  const publicAccess = resource.access?.allowPublicMenu === true && resource.status === 'active';
  const superAdmin = isSuperAdmin(ctx);
  const owner = ctx.auth != null && (
    (resource.ownerUid !== undefined && resource.ownerUid === ctx.auth.uid) ||
    (resource.ownerUid === undefined && resource.ownerEmail !== undefined && resource.ownerEmail === ctx.auth.token.email && ctx.auth.token.email_verified === true)
  );

  return publicAccess || superAdmin || owner;
}

function evaluateRestaurantUpdate(restaurantId: string, incoming: any, ctx: RuleContext): boolean {
  const existing = dbStore.restaurants[restaurantId];
  if (!existing || !isValidId(restaurantId)) return false;

  if (isSuperAdmin(ctx)) return true;

  const isOwner = ctx.auth != null && (
    (existing.ownerUid !== undefined && existing.ownerUid === ctx.auth.uid) ||
    (existing.ownerUid === undefined && existing.ownerEmail !== undefined && existing.ownerEmail === ctx.auth.token.email && ctx.auth.token.email_verified === true)
  );

  if (!isOwner) return false;
  if (existing.status !== 'active') return false;
  if (existing.access?.allowDashboard !== true) return false;

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

  // Locked subscription fields
  if (existing.planId !== undefined && incoming.planId !== existing.planId) return false;
  if (existing.subscription !== undefined && JSON.stringify(incoming.subscription) !== JSON.stringify(existing.subscription)) return false;
  if (existing.subscriptionStartDate !== undefined && incoming.subscriptionStartDate !== existing.subscriptionStartDate) return false;
  if (existing.subscriptionEndDate !== undefined && incoming.subscriptionEndDate !== existing.subscriptionEndDate) return false;

  return true;
}

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

function evaluateOrderCreate(restaurantId: string, orderId: string, incoming: any, ctx: RuleContext): boolean {
  if (!isValidId(orderId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (incoming.status !== 'pending') return false;
  if (typeof incoming.totalAmount !== 'number' || incoming.totalAmount < 0 || incoming.totalAmount > 50000) return false;
  if (typeof incoming.customerName !== 'string' || incoming.customerName.length === 0 || incoming.customerName.length > 80) return false;
  if (typeof incoming.orderNumber !== 'string' || incoming.orderNumber.length > 32) return false;
  if (!Array.isArray(incoming.items) || incoming.items.length === 0 || incoming.items.length > 100) return false;
  return true;
}

function evaluateOrderRead(restaurantId: string, ctx: RuleContext): boolean {
  return isSuperAdmin(ctx) || isRestaurantOwnerIdentity(restaurantId, ctx);
}

function evaluateOrderUpdate(restaurantId: string, existing: any, incoming: any, ctx: RuleContext): boolean {
  const allowed = isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
  if (!allowed) return false;
  if (incoming.restaurantId !== existing.restaurantId) return false;
  if (incoming.orderNumber !== existing.orderNumber) return false;
  if (incoming.customerName !== existing.customerName) return false;
  return true;
}

function evaluateReviewCreate(restaurantId: string, reviewId: string, incoming: any, ctx: RuleContext): boolean {
  if (!isValidId(reviewId)) return false;
  if (incoming.restaurantId !== restaurantId) return false;
  if (typeof incoming.rating !== 'number' || incoming.rating < 1 || incoming.rating > 5) return false;
  if (incoming.isApproved !== false) return false;
  if (typeof incoming.customerName !== 'string' || incoming.customerName.length === 0 || incoming.customerName.length > 80) return false;
  if (incoming.comment !== undefined && (typeof incoming.comment !== 'string' || incoming.comment.length > 600)) return false;
  return true;
}

function evaluateReviewRead(restaurantId: string, reviewDoc: any, ctx: RuleContext): boolean {
  return reviewDoc.isApproved === true || isSuperAdmin(ctx) || isRestaurantOwnerIdentity(restaurantId, ctx);
}

function evaluateReviewUpdate(restaurantId: string, existing: any, incoming: any, ctx: RuleContext): boolean {
  const allowed = isSuperAdmin(ctx) || isOperationalRestaurantOwner(restaurantId, ctx);
  if (!allowed) return false;
  if (incoming.restaurantId !== existing.restaurantId) return false;
  if (incoming.rating !== existing.rating) return false;
  if (incoming.customerName !== existing.customerName) return false;
  return true;
}

// ----------------- TEST RUNNER -----------------
console.log('=== RUNNING PHASE 3B FIRESTORE RULES VERIFICATION SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(description: string, condition: boolean) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${description}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${description}`);
  }
}

// Setup DB Mock Entities
dbStore.restaurants = {
  'rest-active': {
    id: 'rest-active',
    nameAr: 'مطعم السعادة النشط',
    ownerUid: 'uid-owner-1',
    ownerEmail: 'owner1@restaurant.com',
    status: 'active',
    access: { allowDashboard: true, allowPublicMenu: true },
    subscription: { planId: 'pro', status: 'active', renewalDate: '2026-12-31' },
  },
  'rest-suspended': {
    id: 'rest-suspended',
    nameAr: 'مطعم معلق من الإدارة',
    ownerUid: 'uid-owner-2',
    ownerEmail: 'owner2@restaurant.com',
    status: 'suspended',
    access: { allowDashboard: false, allowPublicMenu: false },
    subscription: { planId: 'pro', status: 'suspended', renewalDate: '2026-12-31' },
  },
  'rest-disabled-dash': {
    id: 'rest-disabled-dash',
    nameAr: 'مطعم نشط لكن معطل اللوحة',
    ownerUid: 'uid-owner-3',
    ownerEmail: 'owner3@restaurant.com',
    status: 'active',
    access: { allowDashboard: false, allowPublicMenu: true },
    subscription: { planId: 'starter', status: 'active', renewalDate: '2026-12-31' },
  },
  'rest-expired': {
    id: 'rest-expired',
    nameAr: 'مطعم منتهي الاشتراك',
    ownerUid: 'uid-owner-4',
    ownerEmail: 'owner4@restaurant.com',
    status: 'expired',
    access: { allowDashboard: false, allowPublicMenu: false },
    subscription: { planId: 'starter', status: 'expired', renewalDate: '2025-01-01' },
  },
  'rest-legacy': {
    id: 'rest-legacy',
    nameAr: 'مطعم قديم بدون uid',
    ownerEmail: 'legacy@restaurant.com',
    status: 'active',
    access: { allowDashboard: true, allowPublicMenu: true },
  },
};

const superAdminCtx: RuleContext = {
  auth: { uid: 'uid-admin', token: { email: 'busnesteam8@gmail.com', email_verified: true } }
};
const fakeAdminCtx: RuleContext = {
  auth: { uid: 'uid-fake', token: { email: 'busnesteam8@gmail.com', email_verified: false } }
};
const activeOwnerCtx: RuleContext = {
  auth: { uid: 'uid-owner-1', token: { email: 'owner1@restaurant.com', email_verified: true } }
};
const suspendedOwnerCtx: RuleContext = {
  auth: { uid: 'uid-owner-2', token: { email: 'owner2@restaurant.com', email_verified: true } }
};
const disabledDashOwnerCtx: RuleContext = {
  auth: { uid: 'uid-owner-3', token: { email: 'owner3@restaurant.com', email_verified: true } }
};
const expiredOwnerCtx: RuleContext = {
  auth: { uid: 'uid-owner-4', token: { email: 'owner4@restaurant.com', email_verified: true } }
};
const legacyOwnerCtx: RuleContext = {
  auth: { uid: 'uid-legacy', token: { email: 'legacy@restaurant.com', email_verified: true } }
};
const visitorCtx: RuleContext = { auth: null };
const unverifiedUserCtx: RuleContext = {
  auth: { uid: 'uid-unverified', token: { email: 'stranger@gmail.com', email_verified: false } }
};

// 1. Super Admin authentication & verification tests
assert('Super Admin with verified email is authorized', isSuperAdmin(superAdminCtx) === true);
assert('Spoofed Super Admin email without email_verified == true is rejected', isSuperAdmin(fakeAdminCtx) === false);
assert('Super Admin has access to manage suspended restaurant categories',
  evaluateCategoryWrite('rest-suspended', 'cat-1', { restaurantId: 'rest-suspended', name: 'أطباق جديدة' }, superAdminCtx) === true
);

// 2. Active Owner operational tests
assert('Active owner can create category in their restaurant',
  evaluateCategoryWrite('rest-active', 'cat-1', { restaurantId: 'rest-active', name: 'مشويات' }, activeOwnerCtx) === true
);
assert('Active owner can create menu item in their restaurant',
  evaluateMenuItemWrite('rest-active', 'item-1', { restaurantId: 'rest-active', name: 'شاورما دجاج', price: 65 }, activeOwnerCtx) === true
);
assert('Active owner can create table in their restaurant',
  evaluateTableWrite('rest-active', 'table-1', { restaurantId: 'rest-active', tableNumber: 'طاولة 5' }, activeOwnerCtx) === true
);
assert('Active owner can update order status in their restaurant',
  evaluateOrderUpdate('rest-active',
    { restaurantId: 'rest-active', orderNumber: '#101', customerName: 'أحمد', status: 'pending' },
    { restaurantId: 'rest-active', orderNumber: '#101', customerName: 'أحمد', status: 'accepted' },
    activeOwnerCtx
  ) === true
);
assert('Active owner can approve review in their restaurant',
  evaluateReviewUpdate('rest-active',
    { restaurantId: 'rest-active', rating: 5, customerName: 'محمود', isApproved: false },
    { restaurantId: 'rest-active', rating: 5, customerName: 'محمود', isApproved: true },
    activeOwnerCtx
  ) === true
);

// 3. Suspended Owner security enforcement tests (MUST BE DENIED!)
assert('Suspended owner is DENIED from creating category',
  evaluateCategoryWrite('rest-suspended', 'cat-sub', { restaurantId: 'rest-suspended', name: 'تصنيف ممنوع' }, suspendedOwnerCtx) === false
);
assert('Suspended owner is DENIED from creating menu item',
  evaluateMenuItemWrite('rest-suspended', 'item-sub', { restaurantId: 'rest-suspended', name: 'طبق ممنوع', price: 50 }, suspendedOwnerCtx) === false
);
assert('Suspended owner is DENIED from updating order status',
  evaluateOrderUpdate('rest-suspended',
    { restaurantId: 'rest-suspended', orderNumber: '#102', customerName: 'علي', status: 'pending' },
    { restaurantId: 'rest-suspended', orderNumber: '#102', customerName: 'علي', status: 'accepted' },
    suspendedOwnerCtx
  ) === false
);
assert('Suspended owner is DENIED from approving reviews',
  evaluateReviewUpdate('rest-suspended',
    { restaurantId: 'rest-suspended', rating: 5, customerName: 'علي', isApproved: false },
    { restaurantId: 'rest-suspended', rating: 5, customerName: 'علي', isApproved: true },
    suspendedOwnerCtx
  ) === false
);
assert('Suspended owner is DENIED from updating their restaurant document',
  evaluateRestaurantUpdate('rest-suspended', {
    ...dbStore.restaurants['rest-suspended'],
    description: 'محاولة تعديل الوصف أثناء الإيقاف',
  }, suspendedOwnerCtx) === false
);

// 4. Disabled Dashboard Owner security enforcement tests (MUST BE DENIED!)
assert('Owner with allowDashboard == false is DENIED from operational category write',
  evaluateCategoryWrite('rest-disabled-dash', 'cat-3', { restaurantId: 'rest-disabled-dash', name: 'تصنيف جديد' }, disabledDashOwnerCtx) === false
);
assert('Owner with allowDashboard == false is DENIED from operational item write',
  evaluateMenuItemWrite('rest-disabled-dash', 'item-3', { restaurantId: 'rest-disabled-dash', name: 'عصير برتقال', price: 20 }, disabledDashOwnerCtx) === false
);
assert('Owner with allowDashboard == false is DENIED from restaurant doc update',
  evaluateRestaurantUpdate('rest-disabled-dash', {
    ...dbStore.restaurants['rest-disabled-dash'],
    description: 'تعديل ممنوع بدون لوحة',
  }, disabledDashOwnerCtx) === false
);

// 5. Expired Status Owner security enforcement tests (MUST BE DENIED!)
assert('Owner of expired restaurant is DENIED from operational writes',
  evaluateCategoryWrite('rest-expired', 'cat-exp', { restaurantId: 'rest-expired', name: 'تصنيف منتهي' }, expiredOwnerCtx) === false
);

// 6. Cross-Tenant Protection (Owner A vs Restaurant B)
assert('Owner A is strictly DENIED from modifying Restaurant B categories',
  evaluateCategoryWrite('rest-suspended', 'cat-x', { restaurantId: 'rest-suspended', name: 'اختراق' }, activeOwnerCtx) === false
);
assert('Owner A is strictly DENIED from reading Restaurant B orders',
  evaluateOrderRead('rest-suspended', activeOwnerCtx) === false
);

// 7. Visitor and Customer Rights & Restrictions
assert('Visitor CAN create pending order with valid fields',
  evaluateOrderCreate('rest-active', 'ord-1', {
    restaurantId: 'rest-active',
    status: 'pending',
    totalAmount: 180,
    customerName: 'كريم خالد',
    orderNumber: '#ORD-999',
    items: [{ id: 'item-1', name: 'برجر', qty: 2 }]
  }, visitorCtx) === true
);
assert('Visitor is DENIED from creating non-pending order (e.g. accepted)',
  evaluateOrderCreate('rest-active', 'ord-hack', {
    restaurantId: 'rest-active',
    status: 'accepted',
    totalAmount: 180,
    customerName: 'مهاجم',
    orderNumber: '#ORD-000',
    items: [{ id: 'item-1', qty: 1 }]
  }, visitorCtx) === false
);
assert('Visitor is strictly DENIED from reading orders directly',
  evaluateOrderRead('rest-active', visitorCtx) === false
);
assert('Visitor can submit review ONLY with isApproved == false',
  evaluateReviewCreate('rest-active', 'rev-1', {
    restaurantId: 'rest-active',
    rating: 5,
    customerName: 'طارق',
    comment: 'مطعم رائع',
    isApproved: false
  }, visitorCtx) === true
);
assert('Visitor is strictly DENIED from self-approving their review (isApproved: true)',
  evaluateReviewCreate('rest-active', 'rev-bypass', {
    restaurantId: 'rest-active',
    rating: 5,
    customerName: 'مهاجم',
    isApproved: true
  }, visitorCtx) === false
);
assert('Visitor CANNOT read unapproved reviews',
  evaluateReviewRead('rest-active', { isApproved: false }, visitorCtx) === false
);
assert('Visitor CAN read approved reviews',
  evaluateReviewRead('rest-active', { isApproved: true }, visitorCtx) === true
);
assert('Visitor CANNOT read restaurant document if status == suspended and allowPublicMenu == false',
  evaluateRestaurantRead('rest-suspended', visitorCtx) === false
);
assert('Visitor CAN read restaurant document if status == active and allowPublicMenu == true',
  evaluateRestaurantRead('rest-active', visitorCtx) === true
);

// 8. Privilege Escalation & Shadow Field Protections
assert('Active owner CANNOT elevate themselves to Super Admin or change subscription in restaurant update',
  evaluateRestaurantUpdate('rest-active', {
    ...dbStore.restaurants['rest-active'],
    subscription: { planId: 'enterprise-free', status: 'lifetime', renewalDate: '2099-12-31' }
  }, activeOwnerCtx) === false
);
assert('Active owner CANNOT change their restaurant status to bypass controls',
  evaluateRestaurantUpdate('rest-active', {
    ...dbStore.restaurants['rest-active'],
    status: 'suspended'
  }, activeOwnerCtx) === false
);
assert('Active owner CANNOT reassign ownerUid to another UID',
  evaluateRestaurantUpdate('rest-active', {
    ...dbStore.restaurants['rest-active'],
    ownerUid: 'uid-hacker'
  }, activeOwnerCtx) === false
);
assert('Active owner CAN update general fields like description while preserving locked fields',
  evaluateRestaurantUpdate('rest-active', {
    ...dbStore.restaurants['rest-active'],
    description: 'وصف جديد ومحدث للمطعم'
  }, activeOwnerCtx) === true
);

// 9. Legacy restaurant support with secure email claiming
assert('Legacy restaurant owner with verified email has operational access',
  isOperationalRestaurantOwner('rest-legacy', legacyOwnerCtx) === true
);
assert('Unverified legacy email is DENIED operational access',
  isOperationalRestaurantOwner('rest-legacy', unverifiedUserCtx) === false
);
assert('Legacy owner claiming ownerUid can only set it to their own request.auth.uid',
  evaluateRestaurantUpdate('rest-legacy', {
    ...dbStore.restaurants['rest-legacy'],
    ownerUid: 'uid-legacy'
  }, legacyOwnerCtx) === true
);
assert('Legacy owner claiming ownerUid CANNOT set it to a different UID',
  evaluateRestaurantUpdate('rest-legacy', {
    ...dbStore.restaurants['rest-legacy'],
    ownerUid: 'uid-other-user'
  }, legacyOwnerCtx) === false
);

console.log(`\n=== RESULTS: ${passedTests} / ${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
  console.log('ALL PHASE 3B RULES SECURITY TESTS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}

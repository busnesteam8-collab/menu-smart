// Audit script to test CURRENTLY DEPLOYED firestore.rules logic
// against subscription expiration scenarios where restaurant status remains 'active'.

interface RuleContext {
  auth?: {
    uid: string;
    token: {
      email?: string;
      email_verified?: boolean;
    };
  } | null;
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
    [k: string]: any;
  };
}

const dbStore: Record<string, RestaurantDoc> = {
  // Case A: Active with valid future renewal date
  'rest-active-valid': {
    id: 'rest-active-valid',
    nameAr: 'مطعم نشط باشتراك سارٍ',
    ownerUid: 'uid-owner-A',
    ownerEmail: 'ownerA@restaurant.com',
    status: 'active',
    access: { allowDashboard: true, allowPublicMenu: true },
    subscription: {
      planId: 'pro',
      status: 'active',
      renewalDate: '2027-01-01', // Future date
    },
  },
  // Case B: Active restaurant, but subscription.status == 'expired'
  'rest-active-expired-status': {
    id: 'rest-active-expired-status',
    nameAr: 'مطعم نشط ولكن حالة الاشتراك منتهية',
    ownerUid: 'uid-owner-B',
    ownerEmail: 'ownerB@restaurant.com',
    status: 'active', // Note: status is still active!
    access: { allowDashboard: true, allowPublicMenu: true },
    subscription: {
      planId: 'pro',
      status: 'expired', // Subscription status expired
      renewalDate: '2027-01-01',
    },
  },
  // Case C: Active restaurant with subscription.status == 'active', BUT renewalDate is in the past!
  'rest-active-passed-date': {
    id: 'rest-active-passed-date',
    nameAr: 'مطعم نشط وتاريخ التجديد قديم ومنتهٍ',
    ownerUid: 'uid-owner-C',
    ownerEmail: 'ownerC@restaurant.com',
    status: 'active', // Note: status is still active!
    access: { allowDashboard: true, allowPublicMenu: true },
    subscription: {
      planId: 'starter',
      status: 'active', // status still says active!
      renewalDate: '2025-01-01', // Date in the past (2025 vs 2026)
    },
  },
  // Case D: Restaurant where status == 'expired'
  'rest-status-expired': {
    id: 'rest-status-expired',
    nameAr: 'مطعم بحالة expired في المستند',
    ownerUid: 'uid-owner-D',
    ownerEmail: 'ownerD@restaurant.com',
    status: 'expired',
    access: { allowDashboard: true, allowPublicMenu: true },
    subscription: {
      planId: 'starter',
      status: 'expired',
      renewalDate: '2025-01-01',
    },
  },
};

// --- Exact Logic of CURRENTLY DEPLOYED firestore.rules ---
function isSuperAdmin(ctx: RuleContext): boolean {
  return ctx.auth != null &&
         ctx.auth.token.email === 'busnesteam8@gmail.com' &&
         ctx.auth.token.email_verified === true;
}

function isRestaurantOwnerIdentity(restaurantId: string, ctx: RuleContext): boolean {
  const rest = dbStore[restaurantId];
  if (!rest || !ctx.auth) return false;
  return (
    (rest.ownerUid !== undefined && rest.ownerUid === ctx.auth.uid) ||
    (rest.ownerUid === undefined && rest.ownerEmail !== undefined && rest.ownerEmail === ctx.auth.token.email && ctx.auth.token.email_verified === true)
  );
}

// Current operational check in firestore.rules
function isOperationalRestaurantOwner_CURRENT(restaurantId: string, ctx: RuleContext): boolean {
  const rest = dbStore[restaurantId];
  if (!rest) return false;
  return isRestaurantOwnerIdentity(restaurantId, ctx) &&
         rest.status === 'active' &&
         rest.access &&
         rest.access.allowDashboard === true;
}

// Check operational category creation
function evaluateCategoryWrite_CURRENT(restaurantId: string, ctx: RuleContext): boolean {
  return isSuperAdmin(ctx) || isOperationalRestaurantOwner_CURRENT(restaurantId, ctx);
}

console.log('=== AUDIT TEST OF CURRENTLY DEPLOYED FIRESTORE RULES ===\n');

const ownerACtx: RuleContext = { auth: { uid: 'uid-owner-A', token: { email: 'ownerA@restaurant.com', email_verified: true } } };
const ownerBCtx: RuleContext = { auth: { uid: 'uid-owner-B', token: { email: 'ownerB@restaurant.com', email_verified: true } } };
const ownerCCtx: RuleContext = { auth: { uid: 'uid-owner-C', token: { email: 'ownerC@restaurant.com', email_verified: true } } };
const ownerDCtx: RuleContext = { auth: { uid: 'uid-owner-D', token: { email: 'ownerD@restaurant.com', email_verified: true } } };
const adminCtx: RuleContext = { auth: { uid: 'uid-admin', token: { email: 'busnesteam8@gmail.com', email_verified: true } } };

// Test 1: Active with valid future renewal date
const t1 = evaluateCategoryWrite_CURRENT('rest-active-valid', ownerACtx);
console.log(`Test 1 [Active + Valid Date]: Can Owner write? ${t1 ? 'ALLOWED (Expected)' : 'DENIED'}`);

// Test 2: Active restaurant, but subscription.status == 'expired'
const t2 = evaluateCategoryWrite_CURRENT('rest-active-expired-status', ownerBCtx);
console.log(`Test 2 [Active status + subscription.status == "expired"]: Can Owner write? ${t2 ? 'ALLOWED (VULNERABILITY: Not blocked by current rules!)' : 'DENIED (Protected)'}`);

// Test 3: Active restaurant with subscription.status == 'active', BUT renewalDate is expired ('2025-01-01')
const t3 = evaluateCategoryWrite_CURRENT('rest-active-passed-date', ownerCCtx);
console.log(`Test 3 [Active status + Expired renewalDate]: Can Owner write? ${t3 ? 'ALLOWED (VULNERABILITY: Not blocked by current rules!)' : 'DENIED (Protected)'}`);

// Test 4: Restaurant where status == 'expired'
const t4 = evaluateCategoryWrite_CURRENT('rest-status-expired', ownerDCtx);
console.log(`Test 4 [Restaurant status == "expired"]: Can Owner write? ${t4 ? 'ALLOWED' : 'DENIED (Protected by rest.status check)'}`);

// Test 5: Super Admin on expired restaurant
const t5 = evaluateCategoryWrite_CURRENT('rest-active-passed-date', adminCtx);
console.log(`Test 5 [Super Admin on expired restaurant]: Can Admin write? ${t5 ? 'ALLOWED (Expected)' : 'DENIED'}`);

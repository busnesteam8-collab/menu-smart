import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, IdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle as firebaseSignInWithGoogle, logoutUser } from '../services/firebase';
import { store, PRIMARY_SUPER_ADMIN_EMAIL } from '../services/store';

export interface RestaurantAccessCheck {
  allowed: boolean;
  reason?: 'unauthenticated' | 'not_owner' | 'disabled' | 'suspended' | 'subscription_expired' | 'not_found';
  message?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  idTokenResult: IdTokenResult | null;
  claims: Record<string, any>;
  isSuperAdmin: boolean;
  hasServerCustomClaim: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkRestaurantAccess: (restaurantId: string) => RestaurantAccessCheck;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [idTokenResult, setIdTokenResult] = useState<IdTokenResult | null>(null);
  const [claims, setClaims] = useState<Record<string, any>>({});

  const reloadUserTokens = async (user: User | null) => {
    if (user) {
      try {
        const tokenRes = await user.getIdTokenResult(true);
        setIdTokenResult(tokenRes);
        setClaims(tokenRes.claims || {});
      } catch (err) {
        console.warn('Could not retrieve ID token result:', err);
        setIdTokenResult(null);
        setClaims({});
      }
    } else {
      setIdTokenResult(null);
      setClaims({});
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await reloadUserTokens(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAuth = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser(auth.currentUser);
      await reloadUserTokens(auth.currentUser);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await firebaseSignInWithGoogle();
      setCurrentUser(user);
      await reloadUserTokens(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
      setIdTokenResult(null);
      setClaims({});
    } finally {
      setLoading(false);
    }
  };

  // Has server-side custom claim
  const hasServerCustomClaim = !!(
    claims.super_admin === true ||
    claims.role === 'super_admin' ||
    claims.admin === true
  );

  // Super Admin validation:
  // Must be authenticated, email must match primary owner, and email must be verified.
  const isSuperAdmin = !!(
    currentUser &&
    currentUser.email === PRIMARY_SUPER_ADMIN_EMAIL &&
    currentUser.emailVerified === true
  );

  // Restaurant access validation:
  const checkRestaurantAccess = (restaurantId: string): RestaurantAccessCheck => {
    if (!currentUser) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        message: 'يجب تسجيل الدخول أولاً للوصول إلى لوحة تحكم المطعم.',
      };
    }

    const restaurant = store.getRestaurantById(restaurantId);
    if (!restaurant) {
      return {
        allowed: false,
        reason: 'not_found',
        message: 'المطعم المطلوب غير موجود في النظام.',
      };
    }

    // Super Admin can inspect for administrative support
    if (isSuperAdmin) {
      return { allowed: true };
    }

    // Check ownership: ownerUid is primary identifier
    let isOwner = false;
    if (restaurant.ownerUid) {
      // If ownerUid is set, only exact UID match is allowed
      isOwner = restaurant.ownerUid === currentUser.uid;
    } else if (restaurant.ownerEmail && currentUser.email) {
      // For initial binding of unlinked restaurants: requires verified email matching ownerEmail
      if (
        restaurant.ownerEmail.toLowerCase() === currentUser.email.toLowerCase() &&
        currentUser.emailVerified === true
      ) {
        // Securely bind ownerUid on verified initial sign-in
        store.bindRestaurantOwnerUid(restaurantId, currentUser.uid, currentUser.email);
        isOwner = true;
      }
    }

    if (!isOwner) {
      return {
        allowed: false,
        reason: 'not_owner',
        message: 'ليس لديك صلاحية لإدارة هذا المطعم. أنت لست المالك المسجل لهذا الحساب.',
      };
    }

    // Check if dashboard access was disabled by administration
    if (restaurant.access && restaurant.access.allowDashboard === false) {
      return {
        allowed: false,
        reason: 'disabled',
        message: 'تم تعطيل لوحة التحكم لهذا المطعم من قِبل إدارة المنصة.',
      };
    }

    // Check if restaurant is suspended or blocked
    if (restaurant.status === 'suspended' || restaurant.status === 'blocked') {
      return {
        allowed: false,
        reason: 'suspended',
        message: 'تم إيقاف حساب هذا المطعم مؤقتاً. يرجى التواصل مع إدارة المنصة.',
      };
    }

    // Check subscription validity via store.isSubscriptionActive
    const subCheck = store.isSubscriptionActive(restaurantId);
    if (!subCheck.isValid) {
      return {
        allowed: false,
        reason: 'subscription_expired',
        message: subCheck.message || `انتهت صلاحية اشتراك المطعم (${restaurant.subscription?.renewalDate || ''}). يرجى تجديد الاشتراك للوصول إلى لوحة التحكم.`,
      };
    }

    return { allowed: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        idTokenResult,
        claims,
        isSuperAdmin,
        hasServerCustomClaim,
        signInWithGoogle,
        logout,
        refreshAuth,
        checkRestaurantAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

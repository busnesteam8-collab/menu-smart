import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import {
  Restaurant,
  RestaurantStatus,
  RestaurantAccessControl,
  RestaurantSubscription,
} from '../types';
import { store, PRIMARY_SUPER_ADMIN_EMAIL } from './store';

export interface RestaurantSyncStatus {
  isConnected: boolean;
  isLoading: boolean;
  isFirestoreEmpty: boolean;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  restaurantsCount: number;
}

class FirestoreRestaurantService {
  private syncStatus: RestaurantSyncStatus = {
    isConnected: false,
    isLoading: true,
    isFirestoreEmpty: false,
    isOffline: false,
    lastSyncedAt: null,
    error: null,
    restaurantsCount: 0,
  };

  private listeners: Array<(status: RestaurantSyncStatus) => void> = [];
  private unsubscribeAll: Unsubscribe | null = null;
  private isInitialized = false;

  public getStatus(): RestaurantSyncStatus {
    return { ...this.syncStatus };
  }

  public subscribeStatus(callback: (status: RestaurantSyncStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Error in restaurant sync listener:', err);
      }
    });
  }

  private updateStatus(patch: Partial<RestaurantSyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...patch };
    this.notify();
  }

  /**
   * Helper to check if current user is Super Admin
   */
  public isAuthorizedSuperAdmin(): boolean {
    const user = auth.currentUser;
    return !!(
      user &&
      user.email?.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase() &&
      user.emailVerified === true
    );
  }

  /**
   * Normalizes document data from Firestore into frontend Restaurant format
   */
  private normalizeRestaurantData(id: string, data: any): Restaurant {
    return {
      ...data,
      id,
      status: data.status || 'pending',
      access: {
        allowDashboard: data.access?.allowDashboard ?? (data.status === 'active'),
        allowPublicMenu: data.access?.allowPublicMenu ?? (data.status === 'active'),
      },
      subscription: {
        ...data.subscription,
        planId: data.subscription?.planId || 'starter',
        billingCycle: data.subscription?.billingCycle || 'monthly',
        status: data.subscription?.status || 'active',
        startDate: data.subscription?.startDate || new Date().toISOString().split('T')[0],
        renewalDate: data.subscription?.renewalDate || new Date().toISOString().split('T')[0],
        renewalTimestamp: data.subscription?.renewalTimestamp || null,
        price: data.subscription?.price || 0,
      },
      viewsCount: Number(data.viewsCount || 0),
      ordersCount: Number(data.ordersCount || 0),
    };
  }

  /**
   * Initialize real-time synchronization of all restaurants
   */
  public init(): () => void {
    if (this.isInitialized) {
      return () => this.stop();
    }
    this.isInitialized = true;

    try {
      const restCol = collection(db, 'restaurants');
      this.unsubscribeAll = onSnapshot(
        restCol,
        (snapshot) => {
          this.updateStatus({
            isLoading: false,
            isConnected: true,
            isOffline: false,
            error: null,
            restaurantsCount: snapshot.docs.length,
            lastSyncedAt: new Date(),
          });

          if (!snapshot.empty) {
            const remoteRestaurants: Restaurant[] = [];
            snapshot.forEach((docSnap) => {
              const r = this.normalizeRestaurantData(docSnap.id, docSnap.data());
              remoteRestaurants.push(r);
            });

            // Update local store with Firestore data
            store.setRestaurantsFromFirestore(remoteRestaurants);
            this.updateStatus({ isFirestoreEmpty: false });
          } else {
            // Firestore collection is currently empty
            this.updateStatus({ isFirestoreEmpty: true });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'restaurants');
          this.updateStatus({
            isLoading: false,
            isOffline: true,
            error: 'تعذر تحميل بيانات المطاعم من السحابة. يتم استخدام النسخة المحلية الاحتياطية.',
          });
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'restaurants');
      this.updateStatus({ isLoading: false, isOffline: true });
    }

    return () => this.stop();
  }

  public stop() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll();
      this.unsubscribeAll = null;
    }
    this.isInitialized = false;
  }

  /**
   * Listen to a single restaurant document in real-time
   */
  public subscribeToRestaurant(
    restaurantId: string,
    callback: (restaurant: Restaurant | null) => void
  ): Unsubscribe {
    const docRef = doc(db, 'restaurants', restaurantId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const r = this.normalizeRestaurantData(docSnap.id, docSnap.data());
          store.upsertRestaurantFromFirestore(r);
          callback(r);
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `restaurants/${restaurantId}`);
        // Fallback to local store
        callback(store.getRestaurantById(restaurantId) || null);
      }
    );
  }

  /**
   * Register a new restaurant (self-service or Super Admin)
   */
  public async registerRestaurant(data: {
    nameAr: string;
    nameEn?: string;
    slug: string;
    cuisineType: string;
    city: string;
    phone: string;
    whatsappNumber: string;
    ownerEmail: string;
    ownerUid?: string;
    ownerName?: string;
    planId: string;
    billingCycle: 'monthly' | 'annual';
  }): Promise<Restaurant> {
    const isSuperAdmin = this.isAuthorizedSuperAdmin();
    const settings = store.getPlatformSettings();

    if (!isSuperAdmin && !settings.registrationEnabled) {
      throw new Error(settings.registrationDisabledMessage || 'التسجيل مغلق مؤقتاً.');
    }

    const newId = `rest-${Date.now().toString().slice(-6)}`;
    const plan = store.getPlanById(data.planId) || store.getActivePlans()[0];
    const price = data.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

    const trialDays = settings.freeTrialDays || 14;
    const renewalDateObj = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const renewalDateStr = renewalDateObj.toISOString().split('T')[0];
    const renewalTimestamp = Timestamp.fromDate(renewalDateObj);

    // Initial status and access
    // Non-admin self registration is strictly 'pending' and access flags false until Super Admin approves
    const status: RestaurantStatus = isSuperAdmin ? 'active' : 'pending';
    const access: RestaurantAccessControl = {
      allowDashboard: isSuperAdmin,
      allowPublicMenu: isSuperAdmin,
    };

    const newRestaurant: Restaurant = {
      id: newId,
      slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
      nameAr: data.nameAr,
      nameEn: data.nameEn || data.nameAr,
      description: `أشهى المأكولات والمشروبات في ${data.nameAr}. نتشرف بخدمتكم وتلبية طلباتكم.`,
      cuisineType: data.cuisineType,
      city: data.city,
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=240&h=240&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=400&fit=crop&q=80',
      phone: data.phone,
      whatsappNumber: data.whatsappNumber.replace(/[^0-9]/g, ''),
      currency: plan.currency || settings.defaultCurrency || 'ج.م',
      status,
      access,
      subscription: {
        planId: data.planId,
        billingCycle: data.billingCycle,
        status: 'trial',
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: renewalDateStr,
        renewalTimestamp,
        price,
      },
      settings: {
        enableOrdering: true,
        enableTableOrdering: true,
        enableReviews: true,
        autoApproveReviews: false,
        taxPercentage: settings.defaultTaxPercentage || 14,
        deliveryFee: 25,
        minimumOrder: 50,
        workingHours: 'يومياً: 10:00 ص - 1:00 ص',
        address: `${data.city} - شارع التحرير الرئيسي`,
        city: data.city,
        themeColor: '#f59e0b',
      },
      appearance: {
        primaryColor: '#f59e0b',
        secondaryColor: '#0f172a',
        fontFamily: 'Cairo',
        cardLayout: 'cards',
        showCalories: true,
        showBadges: true,
        showAllergens: true,
        buttonShape: 'rounded',
        backgroundColor: '#020617',
        headerStyle: 'banner',
      },
      createdAt: new Date().toISOString(),
      ownerEmail: data.ownerEmail,
      ownerUid: data.ownerUid || auth.currentUser?.uid,
      ownerName: data.ownerName || data.nameAr,
      viewsCount: 0,
      ordersCount: 0,
    };

    try {
      const docRef = doc(db, 'restaurants', newId);
      await setDoc(docRef, newRestaurant);
      // Sync locally
      store.upsertRestaurantFromFirestore(newRestaurant);
      this.updateStatus({ isFirestoreEmpty: false });
      return newRestaurant;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `restaurants/${newId}`);
      throw error;
    }
  }

  /**
   * Super Admin action: Update restaurant status (active, suspended, blocked, pending)
   */
  public async updateRestaurantStatus(
    restaurantId: string,
    newStatus: RestaurantStatus
  ): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: تغيير حالة المطاعم محصور بالمدير العام فقط.');
    }

    const current = store.getRestaurantById(restaurantId);
    if (!current) throw new Error('المطعم غير موجود.');

    // Adjust access flags automatically based on status
    const access: RestaurantAccessControl = {
      allowDashboard: newStatus === 'active',
      allowPublicMenu: newStatus === 'active',
    };

    const updates = {
      status: newStatus,
      access,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, updates);
      // Update local store and log activity
      store.updateRestaurantStatus(restaurantId, newStatus, auth.currentUser?.displayName || 'Super Admin');
      store.updateRestaurantAccess(restaurantId, access, auth.currentUser?.displayName || 'Super Admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
      throw error;
    }
  }

  /**
   * Super Admin action: Update restaurant access control independently
   */
  public async updateRestaurantAccess(
    restaurantId: string,
    access: RestaurantAccessControl
  ): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: تعديل صلاحيات الوصول محصور بالمدير العام فقط.');
    }

    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, { access });
      store.updateRestaurantAccess(restaurantId, access, auth.currentUser?.displayName || 'Super Admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
      throw error;
    }
  }

  /**
   * Super Admin action: Update or extend restaurant subscription
   */
  public async updateRestaurantSubscription(
    restaurantId: string,
    data: {
      planId?: string;
      billingCycle?: 'monthly' | 'annual';
      status?: 'active' | 'expired' | 'trial';
      extendDays?: number;
      renewalDate?: string;
    }
  ): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: إدارة الاشتراكات وتمديدها محصور بالمدير العام.');
    }

    const current = store.getRestaurantById(restaurantId);
    if (!current) throw new Error('المطعم غير موجود.');

    const sub = current.subscription;
    const planId = data.planId || sub.planId;
    const billingCycle = data.billingCycle || sub.billingCycle;
    const plan = store.getPlanById(planId);
    const price = billingCycle === 'annual' ? (plan?.annualPrice || sub.price) : (plan?.monthlyPrice || sub.price);

    let renewalDateStr = data.renewalDate || sub.renewalDate;
    if (data.extendDays && data.extendDays > 0) {
      const baseDate = new Date(renewalDateStr);
      const effectiveBase = isNaN(baseDate.getTime()) || baseDate < new Date() ? new Date() : baseDate;
      const extended = new Date(effectiveBase.getTime() + data.extendDays * 24 * 60 * 60 * 1000);
      renewalDateStr = extended.toISOString().split('T')[0];
    }

    const renewalTimestamp = Timestamp.fromDate(new Date(renewalDateStr));
    const newSubStatus = data.status || (new Date(renewalDateStr) > new Date() ? 'active' : 'expired');

    const updatedSubscription: RestaurantSubscription = {
      ...sub,
      planId,
      billingCycle,
      status: newSubStatus,
      renewalDate: renewalDateStr,
      renewalTimestamp,
      price,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, { subscription: updatedSubscription });
      store.upsertRestaurantFromFirestore({
        ...current,
        subscription: updatedSubscription,
      });
      store.logActivity({
        actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
        actorName: auth.currentUser?.displayName || 'Super Admin',
        category: 'subscriptions',
        action: `تمديد/تعديل اشتراك مطعم: ${current.nameAr}`,
        details: `الباقة: ${planId} | تاريخ التجديد: ${renewalDateStr} | الحالة: ${newSubStatus}`,
        targetId: restaurantId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
      throw error;
    }
  }

  /**
   * Update restaurant profile (Owner or Super Admin)
   */
  public async updateRestaurantProfile(
    restaurantId: string,
    updates: Partial<Restaurant>
  ): Promise<void> {
    const isSuperAdmin = this.isAuthorizedSuperAdmin();
    const current = store.getRestaurantById(restaurantId);
    if (!current) throw new Error('المطعم غير موجود.');

    // If not super admin, strictly filter out administrative fields
    const safeUpdates: any = {};
    if (updates.nameAr) safeUpdates.nameAr = updates.nameAr;
    if (updates.nameEn) safeUpdates.nameEn = updates.nameEn;
    if (updates.description !== undefined) safeUpdates.description = updates.description;
    if (updates.cuisineType) safeUpdates.cuisineType = updates.cuisineType;
    if (updates.city) safeUpdates.city = updates.city;
    if (updates.phone) safeUpdates.phone = updates.phone;
    if (updates.whatsappNumber) safeUpdates.whatsappNumber = updates.whatsappNumber;
    if (updates.logoUrl) safeUpdates.logoUrl = updates.logoUrl;
    if (updates.coverUrl) safeUpdates.coverUrl = updates.coverUrl;
    if (updates.settings) safeUpdates.settings = updates.settings;
    if (updates.appearance) safeUpdates.appearance = updates.appearance;

    // Super Admin overrides only
    if (isSuperAdmin) {
      if (updates.slug) safeUpdates.slug = updates.slug;
      if (updates.currency) safeUpdates.currency = updates.currency;
      if (updates.ownerName) safeUpdates.ownerName = updates.ownerName;
      if (updates.ownerEmail) safeUpdates.ownerEmail = updates.ownerEmail;
      if (updates.ownerUid) safeUpdates.ownerUid = updates.ownerUid;
      if (updates.status) safeUpdates.status = updates.status;
      if (updates.access) safeUpdates.access = updates.access;
      if (updates.subscription) safeUpdates.subscription = updates.subscription;
    }

    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(docRef, safeUpdates);
      store.updateRestaurantProfile(restaurantId, safeUpdates, isSuperAdmin);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
      throw error;
    }
  }

  /**
   * Super Admin action: Delete a restaurant permanently from Firestore
   */
  public async deleteRestaurant(restaurantId: string): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: حذف المطاعم محصور بالمدير العام فقط.');
    }

    const current = store.getRestaurantById(restaurantId);

    try {
      const docRef = doc(db, 'restaurants', restaurantId);
      await deleteDoc(docRef);
      // Remove locally
      store.deleteRestaurant(restaurantId, auth.currentUser?.displayName || 'Super Admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}`);
      throw error;
    }
  }

  /**
   * Super Admin 1-Click Import of Local Restaurants to Cloud Firestore
   */
  public async importLocalRestaurantsToFirestore(
    restaurantsToImport: Restaurant[]
  ): Promise<{ importedCount: number }> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: استيراد المطاعم إلى السحابة محصور بالمدير العام.');
    }

    let count = 0;
    for (const r of restaurantsToImport) {
      if (!r.id) continue;

      // Ensure renewalTimestamp is present as a Firestore Timestamp
      const renewalDateObj = new Date(r.subscription?.renewalDate || Date.now() + 14 * 24 * 60 * 60 * 1000);
      const renewalTimestamp = Timestamp.fromDate(
        isNaN(renewalDateObj.getTime()) ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : renewalDateObj
      );

      const restaurantDoc: Restaurant = {
        ...r,
        subscription: {
          ...r.subscription,
          renewalTimestamp,
        },
      };

      const docRef = doc(db, 'restaurants', r.id);
      await setDoc(docRef, restaurantDoc, { merge: true });
      count++;
    }

    this.updateStatus({
      isFirestoreEmpty: false,
      restaurantsCount: count,
      lastSyncedAt: new Date(),
    });

    store.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: auth.currentUser?.displayName || 'Super Admin',
      category: 'restaurants',
      action: 'استيراد المطاعم إلى Cloud Firestore',
      details: `تم اعتماد واستيراد ${count} مطاعم إلى Cloud Firestore بنجاح.`,
    });

    return { importedCount: count };
  }
}

export const firestoreRestaurantService = new FirestoreRestaurantService();

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { SubscriptionPlan, PlatformSettings, Restaurant } from '../types';
import { store, PRIMARY_SUPER_ADMIN_EMAIL } from './store';

export interface SyncStatus {
  isConnected: boolean;
  isPlansLoading: boolean;
  isSettingsLoading: boolean;
  isFirestoreEmpty: boolean;
  isOffline: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  plansCount: number;
  hasRemoteSettings: boolean;
}

class FirestoreConfigService {
  private syncStatus: SyncStatus = {
    isConnected: false,
    isPlansLoading: true,
    isSettingsLoading: true,
    isFirestoreEmpty: false,
    isOffline: false,
    lastSyncedAt: null,
    error: null,
    plansCount: 0,
    hasRemoteSettings: false,
  };

  private listeners: Array<(status: SyncStatus) => void> = [];
  private unsubscribePlans: Unsubscribe | null = null;
  private unsubscribeSettings: Unsubscribe | null = null;
  private isInitialized = false;

  public getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public subscribeStatus(callback: (status: SyncStatus) => void): () => void {
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
        console.error('Error in sync status listener:', err);
      }
    });
  }

  private updateStatus(patch: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...patch };
    this.notify();
  }

  /**
   * Validates if current user has Super Admin write privileges
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
   * Initializes real-time listeners for Plans and Settings
   */
  public init(): () => void {
    if (this.isInitialized) {
      return () => this.stop();
    }
    this.isInitialized = true;

    // 1. Listen to Plans Collection
    try {
      const plansCol = collection(db, 'plans');
      this.unsubscribePlans = onSnapshot(
        plansCol,
        (snapshot) => {
          this.updateStatus({
            isPlansLoading: false,
            isConnected: true,
            isOffline: false,
            error: null,
            plansCount: snapshot.docs.length,
            lastSyncedAt: new Date(),
          });

          if (!snapshot.empty) {
            const remotePlans: SubscriptionPlan[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as SubscriptionPlan;
              remotePlans.push({
                ...data,
                id: docSnap.id,
              });
            });

            // Update local store with Firestore source of truth
            store.setPlansFromFirestore(remotePlans);
            this.updateStatus({ isFirestoreEmpty: false });
          } else {
            // Firestore is empty - maintain local fallback safely
            this.updateStatus({ isFirestoreEmpty: true });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'plans');
          this.updateStatus({
            isPlansLoading: false,
            isOffline: true,
            error: 'تعذر الاتصال بقاعدة بيانات الخطط السحابية. يتم استخدام النسخة المخزنة محلياً.',
          });
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'plans');
      this.updateStatus({ isPlansLoading: false, isOffline: true });
    }

    // 2. Listen to Settings Document (/settings/platform)
    try {
      const settingsDocRef = doc(db, 'settings', 'platform');
      this.unsubscribeSettings = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          this.updateStatus({
            isSettingsLoading: false,
            isConnected: true,
            isOffline: false,
            lastSyncedAt: new Date(),
          });

          if (docSnap.exists()) {
            const data = docSnap.data() as PlatformSettings;
            store.setPlatformSettingsFromFirestore(data);
            this.updateStatus({ hasRemoteSettings: true });
          } else {
            this.updateStatus({ hasRemoteSettings: false });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'settings/platform');
          this.updateStatus({
            isSettingsLoading: false,
            isOffline: true,
            error: 'تعذر الاتصال بإعدادات المنصة السحابية. يتم استخدام الإعدادات المحلية.',
          });
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'settings/platform');
      this.updateStatus({ isSettingsLoading: false, isOffline: true });
    }

    return () => this.stop();
  }

  public stop() {
    if (this.unsubscribePlans) {
      this.unsubscribePlans();
      this.unsubscribePlans = null;
    }
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    this.isInitialized = false;
  }

  // --- CRUD: Subscription Plans ---

  /**
   * Fetch plans one-shot (with fallback)
   */
  public async fetchPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansCol = collection(db, 'plans');
      const snapshot = await getDocs(plansCol);
      if (!snapshot.empty) {
        const plans: SubscriptionPlan[] = [];
        snapshot.forEach((docSnap) => {
          plans.push({ ...(docSnap.data() as SubscriptionPlan), id: docSnap.id });
        });
        store.setPlansFromFirestore(plans);
        return plans.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'plans');
    }
    // Fallback to local store
    return store.getPlans();
  }

  /**
   * Save (Create or Update) plan in Firestore and local store
   */
  public async savePlan(plan: SubscriptionPlan): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: إجراء تعديل الباقات يتطلب تسجيل الدخول بحساب المدير العام الموثق.');
    }

    if (!plan.id || !/^[a-zA-Z0-9_\-]+$/.test(plan.id)) {
      throw new Error('معرف الباقة غير صالح: يجب أن يحتوي فقط على حروف وأرقام وشرطات.');
    }

    // Default currency safety
    if (!plan.currency) {
      plan.currency = store.getPlatformSettings().defaultCurrency || 'ج.م';
    }

    try {
      const planDocRef = doc(db, 'plans', plan.id);
      await setDoc(planDocRef, plan, { merge: true });
      // Update local store cache and record activity log
      store.savePlan(plan, auth.currentUser?.displayName || 'Super Admin');
      this.updateStatus({ isFirestoreEmpty: false, error: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `plans/${plan.id}`);
      throw error;
    }
  }

  /**
   * Delete a plan after strictly verifying no active restaurant uses it
   */
  public async deletePlan(planId: string, currentRestaurants: Restaurant[]): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: حذف الباقات يتطلب تسجيل الدخول بحساب المدير العام الموثق.');
    }

    // Integrity constraint check: Is any restaurant using this plan?
    const inUseRestaurants = currentRestaurants.filter(
      (r) => r.subscription?.planId === planId
    );

    if (inUseRestaurants.length > 0) {
      const names = inUseRestaurants.slice(0, 3).map((r) => r.nameAr).join('، ');
      const extra = inUseRestaurants.length > 3 ? ` و ${inUseRestaurants.length - 3} مطاعم أخرى` : '';
      throw new Error(
        `لا يمكن حذف الباقة لأنها مستخدمة حالياً من قبل ${inUseRestaurants.length} مطعم (${names}${extra}). يرجى نقل المطاعم المشتركة فيها إلى باقة بديلة أولاً قبل الحذف.`
      );
    }

    try {
      const planDocRef = doc(db, 'plans', planId);
      await deleteDoc(planDocRef);
      // Remove from local store
      store.deletePlan(planId, auth.currentUser?.displayName || 'Super Admin');
      this.updateStatus({ error: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `plans/${planId}`);
      throw error;
    }
  }

  // --- CRUD: Platform Settings ---

  /**
   * Fetch platform settings one-shot (with fallback)
   */
  public async fetchPlatformSettings(): Promise<PlatformSettings> {
    try {
      const settingsDocRef = doc(db, 'settings', 'platform');
      const snapshot = await getDoc(settingsDocRef);
      if (snapshot.exists()) {
        const settings = snapshot.data() as PlatformSettings;
        store.setPlatformSettingsFromFirestore(settings);
        return settings;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/platform');
    }
    return store.getPlatformSettings();
  }

  /**
   * Save platform settings to Firestore
   */
  public async savePlatformSettings(newSettings: Partial<PlatformSettings>): Promise<void> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: تعديل إعدادات المنصة يتطلب تسجيل الدخول بحساب المدير العام الموثق.');
    }

    try {
      const current = store.getPlatformSettings();
      const merged: PlatformSettings = {
        ...current,
        ...newSettings,
      };

      const settingsDocRef = doc(db, 'settings', 'platform');
      await setDoc(settingsDocRef, merged, { merge: true });

      // Update local store and log activity
      store.updatePlatformSettings(newSettings, auth.currentUser?.displayName || 'Super Admin');
      this.updateStatus({ hasRemoteSettings: true, error: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/platform');
      throw error;
    }
  }

  // --- Controlled Administrative Migration / Import ---

  /**
   * Safely imports local store plans and settings to Firestore on explicit Super Admin confirmation
   */
  public async importLocalDataToFirestore(
    plansToImport: SubscriptionPlan[],
    settingsToImport: PlatformSettings
  ): Promise<{ importedPlansCount: number; settingsImported: boolean }> {
    if (!this.isAuthorizedSuperAdmin()) {
      throw new Error('غير مصرح لك: استيراد البيانات إلى السحابة محصور بالمدير العام فقط.');
    }

    let count = 0;

    // 1. Idempotently set each plan with merge: true
    for (const plan of plansToImport) {
      if (!plan.id) continue;
      const planDocRef = doc(db, 'plans', plan.id);
      await setDoc(planDocRef, plan, { merge: true });
      count++;
    }

    // 2. Set platform settings document
    const settingsDocRef = doc(db, 'settings', 'platform');
    await setDoc(settingsDocRef, settingsToImport, { merge: true });

    this.updateStatus({
      isFirestoreEmpty: false,
      hasRemoteSettings: true,
      plansCount: count,
      lastSyncedAt: new Date(),
    });

    store.logActivity({
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      actorName: auth.currentUser?.displayName || 'Super Admin',
      category: 'settings',
      action: 'استيراد الخطط والإعدادات إلى السحابة (Cloud Firestore)',
      details: `تم اعتماد واستيراد ${count} باقة وإعدادات المنصة إلى Cloud Firestore بنجاح.`,
    });

    return { importedPlansCount: count, settingsImported: true };
  }
}

export const firestoreConfigService = new FirestoreConfigService();

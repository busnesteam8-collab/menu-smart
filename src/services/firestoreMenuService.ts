import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';
import { Category, MenuItem } from '../types';
import { store } from './store';

export interface MenuSyncStatus {
  restaurantId: string;
  isConnected: boolean;
  isLoading: boolean;
  categoriesCount: number;
  itemsCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
}

class FirestoreMenuService {
  private syncStatuses: Map<string, MenuSyncStatus> = new Map();
  private statusListeners: Array<(status: MenuSyncStatus) => void> = [];

  public getStatus(restaurantId: string): MenuSyncStatus {
    return (
      this.syncStatuses.get(restaurantId) || {
        restaurantId,
        isConnected: false,
        isLoading: true,
        categoriesCount: 0,
        itemsCount: 0,
        lastSyncedAt: null,
        error: null,
      }
    );
  }

  public subscribeStatus(
    restaurantId: string,
    callback: (status: MenuSyncStatus) => void
  ): () => void {
    this.statusListeners.push(callback);
    callback(this.getStatus(restaurantId));
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notify(restaurantId: string) {
    const status = this.getStatus(restaurantId);
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Error in menu sync listener:', err);
      }
    });
  }

  private updateStatus(restaurantId: string, patch: Partial<MenuSyncStatus>) {
    const current = this.getStatus(restaurantId);
    this.syncStatuses.set(restaurantId, { ...current, ...patch });
    this.notify(restaurantId);
  }

  /**
   * Normalizes category document data from Cloud Firestore
   */
  private normalizeCategory(id: string, data: any): Category {
    return {
      id,
      restaurantId: data.restaurantId,
      nameAr: data.nameAr || data.name || '',
      nameEn: data.nameEn || data.nameAr || data.name || '',
      icon: data.icon || '🍽️',
      sortOrder: Number(data.sortOrder || 1),
      isActive: data.isActive !== false,
    };
  }

  /**
   * Normalizes menu item document data from Cloud Firestore
   */
  private normalizeMenuItem(id: string, data: any): MenuItem {
    return {
      id,
      restaurantId: data.restaurantId,
      categoryId: data.categoryId,
      nameAr: data.nameAr || data.name || '',
      nameEn: data.nameEn || data.nameAr || data.name || '',
      descriptionAr: data.descriptionAr || data.description || '',
      price: Number(data.price || 0),
      discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
      imageUrl:
        data.imageUrl ||
        data.image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80',
      isAvailable: data.isAvailable !== false,
      isFeatured: !!data.isFeatured,
      calories: data.calories ? Number(data.calories) : undefined,
      prepTime: data.prepTime || '',
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      sizes: Array.isArray(data.sizes) ? data.sizes : [],
      options: Array.isArray(data.options) ? data.options : [],
      sortOrder: Number(data.sortOrder || 1),
      notes: data.notes || '',
    };
  }

  /**
   * Subscribes to both categories and menu items for a specific restaurant in real-time.
   * Feeds both the local store and components.
   */
  public subscribeRestaurantMenu(
    restaurantId: string,
    callback: (data: { categories: Category[]; items: MenuItem[] }) => void
  ): Unsubscribe {
    if (!restaurantId) return () => {};

    this.updateStatus(restaurantId, { isLoading: true, isConnected: false });

    const categoriesCol = collection(db, 'restaurants', restaurantId, 'categories');
    const itemsCol = collection(db, 'restaurants', restaurantId, 'menu_items');

    let currentCategories: Category[] = store.getCategoriesByRestaurant(restaurantId);
    let currentItems: MenuItem[] = store.getItemsByRestaurant(restaurantId);

    const unsubCategories = onSnapshot(
      categoriesCol,
      (catSnapshot) => {
        const fetchedCats: Category[] = [];
        catSnapshot.forEach((docSnap) => {
          fetchedCats.push(this.normalizeCategory(docSnap.id, docSnap.data()));
        });
        fetchedCats.sort((a, b) => a.sortOrder - b.sortOrder);

        if (!catSnapshot.empty) {
          currentCategories = fetchedCats;
          store.setCategoriesFromFirestore(restaurantId, fetchedCats);
        }

        this.updateStatus(restaurantId, {
          isConnected: true,
          isLoading: false,
          categoriesCount: currentCategories.length,
          lastSyncedAt: new Date(),
          error: null,
        });

        callback({ categories: currentCategories, items: currentItems });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `restaurants/${restaurantId}/categories`);
        this.updateStatus(restaurantId, {
          isLoading: false,
          error: 'تعذر تحميل التصنيفات سحابياً، يتم استخدام النسخة المحلية.',
        });
      }
    );

    const unsubItems = onSnapshot(
      itemsCol,
      (itemSnapshot) => {
        const fetchedItems: MenuItem[] = [];
        itemSnapshot.forEach((docSnap) => {
          fetchedItems.push(this.normalizeMenuItem(docSnap.id, docSnap.data()));
        });
        fetchedItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        if (!itemSnapshot.empty) {
          currentItems = fetchedItems;
          store.setItemsFromFirestore(restaurantId, fetchedItems);
        }

        this.updateStatus(restaurantId, {
          isConnected: true,
          isLoading: false,
          itemsCount: currentItems.length,
          lastSyncedAt: new Date(),
          error: null,
        });

        callback({ categories: currentCategories, items: currentItems });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `restaurants/${restaurantId}/menu_items`);
        this.updateStatus(restaurantId, {
          isLoading: false,
          error: 'تعذر تحميل الأصناف سحابياً، يتم استخدام النسخة المحلية.',
        });
      }
    );

    return () => {
      unsubCategories();
      unsubItems();
    };
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  /**
   * Creates or updates a category in Cloud Firestore
   */
  public async saveCategory(restaurantId: string, category: Category): Promise<Category> {
    if (!category.nameAr || !category.nameAr.trim()) {
      throw new Error('اسم التصنيف بالعربية مطلوب.');
    }

    const categoryId = category.id || `cat-${restaurantId}-${Date.now().toString().slice(-4)}`;

    // Note: 'name' field is required by firestore.rules (incoming().name is string && size <= 100)
    const categoryDoc = {
      id: categoryId,
      restaurantId,
      name: category.nameAr.trim(),
      nameAr: category.nameAr.trim(),
      nameEn: category.nameEn?.trim() || category.nameAr.trim(),
      icon: category.icon || '🍽️',
      sortOrder: Number(category.sortOrder || 1),
      isActive: category.isActive !== false,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
      await setDoc(docRef, categoryDoc, { merge: true });

      // Update local store
      store.saveCategory(categoryDoc);
      return categoryDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${restaurantId}/categories/${categoryId}`);
      // Fallback local save
      store.saveCategory(categoryDoc);
      return categoryDoc;
    }
  }

  /**
   * Reorders categories in Firestore
   */
  public async reorderCategories(
    restaurantId: string,
    orderedCategoryIds: string[]
  ): Promise<void> {
    store.reorderCategories(restaurantId, orderedCategoryIds);

    try {
      for (let i = 0; i < orderedCategoryIds.length; i++) {
        const catId = orderedCategoryIds[i];
        const docRef = doc(db, 'restaurants', restaurantId, 'categories', catId);
        await updateDoc(docRef, { sortOrder: i + 1 });
      }
    } catch (error) {
      console.warn('Could not reorder categories in Firestore, saved locally:', error);
    }
  }

  /**
   * Toggles category visibility (active / hidden)
   */
  public async toggleCategoryStatus(
    restaurantId: string,
    categoryId: string,
    isActive: boolean
  ): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
      await updateDoc(docRef, { isActive });
      const current = store.getCategoriesByRestaurant(restaurantId).find((c) => c.id === categoryId);
      if (current) {
        store.saveCategory({ ...current, isActive });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}/categories/${categoryId}`);
      const current = store.getCategoriesByRestaurant(restaurantId).find((c) => c.id === categoryId);
      if (current) {
        store.saveCategory({ ...current, isActive });
      }
    }
  }

  /**
   * Deletes a category and safely unlinks or deletes its items
   */
  public async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    try {
      // 1. Delete associated items in Firestore
      const items = store.getItemsByRestaurant(restaurantId).filter((i) => i.categoryId === categoryId);
      for (const item of items) {
        const itemRef = doc(db, 'restaurants', restaurantId, 'menu_items', item.id);
        await deleteDoc(itemRef).catch(() => {});
      }

      // 2. Delete the category itself
      const docRef = doc(db, 'restaurants', restaurantId, 'categories', categoryId);
      await deleteDoc(docRef);

      // 3. Delete locally
      store.deleteCategory(categoryId, restaurantId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}/categories/${categoryId}`);
      store.deleteCategory(categoryId, restaurantId);
    }
  }

  // ==========================================
  // MENU ITEMS CRUD
  // ==========================================

  /**
   * Creates or updates a menu item in Cloud Firestore
   */
  public async saveMenuItem(restaurantId: string, item: MenuItem): Promise<MenuItem> {
    if (!item.nameAr || !item.nameAr.trim()) {
      throw new Error('اسم الصنف بالعربية مطلوب.');
    }
    if (!item.categoryId) {
      throw new Error('يرجى تحديد القسم التابع له هذا الصنف.');
    }
    if (item.price === undefined || item.price === null || item.price < 0) {
      throw new Error('يرجى إدخال سعر صالح للصنف.');
    }

    // Guard against heavy Base64 payload storage in Firestore (strictly enforces URLs/presets)
    if (item.imageUrl && item.imageUrl.startsWith('data:') && item.imageUrl.length > 15000) {
      throw new Error(
        'لا يمكن تخزين الصور بتنسيق Base64 كبير الحجم مباشرة في قاعدة البيانات لتجنب استهلاك الحصة السحابية. يرجى استخدام رابط ويب لصورة الطبق (URL) أو اختيار أحد القوالب الجاهزة.'
      );
    }

    const itemId = item.id || `item-${restaurantId}-${Date.now().toString().slice(-4)}`;

    // Note: 'name' field is required by firestore.rules (incoming().name is string && size <= 120)
    const itemDoc = {
      id: itemId,
      restaurantId,
      categoryId: item.categoryId,
      name: item.nameAr.trim(),
      nameAr: item.nameAr.trim(),
      nameEn: item.nameEn?.trim() || item.nameAr.trim(),
      descriptionAr: item.descriptionAr || '',
      price: Number(item.price),
      discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
      imageUrl:
        item.imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=80',
      isAvailable: item.isAvailable !== false,
      isFeatured: !!item.isFeatured,
      calories: item.calories ? Number(item.calories) : null,
      prepTime: item.prepTime || '',
      allergens: item.allergens || [],
      sizes: item.sizes || [],
      options: item.options || [],
      sortOrder: Number(item.sortOrder || 1),
      notes: item.notes || '',
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'menu_items', itemId);
      await setDoc(docRef, itemDoc, { merge: true });

      // Update local store
      store.saveItem(itemDoc as any);
      return itemDoc as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${restaurantId}/menu_items/${itemId}`);
      // Fallback local save
      store.saveItem(itemDoc as any);
      return itemDoc as any;
    }
  }

  /**
   * Toggles item availability (in stock / out of stock)
   */
  public async toggleItemAvailability(
    restaurantId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'menu_items', itemId);
      await updateDoc(docRef, { isAvailable });
      store.toggleItemAvailability(itemId, restaurantId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}/menu_items/${itemId}`);
      store.toggleItemAvailability(itemId, restaurantId);
    }
  }

  /**
   * Deletes a menu item from Cloud Firestore
   */
  public async deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'menu_items', itemId);
      await deleteDoc(docRef);
      store.deleteItem(itemId, restaurantId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}/menu_items/${itemId}`);
      store.deleteItem(itemId, restaurantId);
    }
  }

  /**
   * 1-Click Import of Local Categories and Items to Cloud Firestore
   */
  public async importLocalMenuToFirestore(
    restaurantId: string
  ): Promise<{ categoriesCount: number; itemsCount: number }> {
    const localCats = store.getCategoriesByRestaurant(restaurantId);
    const localItems = store.getItemsByRestaurant(restaurantId);

    let catsCount = 0;
    for (const cat of localCats) {
      await this.saveCategory(restaurantId, cat);
      catsCount++;
    }

    let itemsCount = 0;
    for (const item of localItems) {
      await this.saveMenuItem(restaurantId, item);
      itemsCount++;
    }

    this.updateStatus(restaurantId, {
      categoriesCount: catsCount,
      itemsCount: itemsCount,
      lastSyncedAt: new Date(),
    });

    return { categoriesCount: catsCount, itemsCount: itemsCount };
  }
}

export const firestoreMenuService = new FirestoreMenuService();

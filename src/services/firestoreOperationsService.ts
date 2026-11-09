import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { RestaurantTable, Order, Review, OrderStatus, Restaurant, CartItem } from '../types';
import { store, PRIMARY_SUPER_ADMIN_EMAIL } from './store';

export interface OperationsSyncStatus {
  restaurantId: string;
  isConnected: boolean;
  isLoading: boolean;
  tablesCount: number;
  ordersCount: number;
  reviewsCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
}

class FirestoreOperationsService {
  private syncStatuses: Map<string, OperationsSyncStatus> = new Map();
  private statusListeners: Array<(status: OperationsSyncStatus) => void> = [];

  public getStatus(restaurantId: string): OperationsSyncStatus {
    return (
      this.syncStatuses.get(restaurantId) || {
        restaurantId,
        isConnected: false,
        isLoading: true,
        tablesCount: 0,
        ordersCount: 0,
        reviewsCount: 0,
        lastSyncedAt: null,
        error: null,
      }
    );
  }

  public subscribeStatus(
    restaurantId: string,
    callback: (status: OperationsSyncStatus) => void
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
        console.error('Error in operations sync listener:', err);
      }
    });
  }

  private updateStatus(restaurantId: string, patch: Partial<OperationsSyncStatus>) {
    const current = this.getStatus(restaurantId);
    this.syncStatuses.set(restaurantId, { ...current, ...patch });
    this.notify(restaurantId);
  }

  // ==========================================
  // 1. TABLES & QR CODE MANAGEMENT
  // ==========================================

  private normalizeTable(id: string, data: any): RestaurantTable {
    return {
      id,
      restaurantId: data.restaurantId,
      tableNumber: data.tableNumber || '',
      nameAr: data.nameAr || data.tableNumber || '',
      capacity: Number(data.capacity || 4),
      location: data.location || 'indoor',
      isActive: data.isActive !== false,
    };
  }

  /**
   * Subscribes to restaurant tables in Cloud Firestore in real-time
   */
  public subscribeTables(
    restaurantId: string,
    callback: (tables: RestaurantTable[]) => void
  ): Unsubscribe {
    if (!restaurantId) return () => {};

    const tablesCol = collection(db, 'restaurants', restaurantId, 'tables');

    return onSnapshot(
      tablesCol,
      (snapshot) => {
        const fetchedTables: RestaurantTable[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTables.push(this.normalizeTable(docSnap.id, docSnap.data()));
        });
        fetchedTables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));

        if (!snapshot.empty) {
          store.setTablesFromFirestore(restaurantId, fetchedTables);
        }

        this.updateStatus(restaurantId, {
          isConnected: true,
          isLoading: false,
          tablesCount: fetchedTables.length,
          lastSyncedAt: new Date(),
          error: null,
        });

        callback(fetchedTables);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `restaurants/${restaurantId}/tables`);
        this.updateStatus(restaurantId, {
          isLoading: false,
          error: 'تعذر تحميل الطاولات سحابياً، يتم استخدام النسخة المحلية.',
        });
        callback(store.getTablesByRestaurant(restaurantId));
      }
    );
  }

  /**
   * Creates or updates a table in Cloud Firestore
   */
  public async saveTable(restaurantId: string, table: RestaurantTable): Promise<RestaurantTable> {
    if (!table.tableNumber || !table.tableNumber.trim()) {
      throw new Error('رقم الطاولة مطلوب.');
    }

    const tableId = table.id || `tbl-${restaurantId}-${Date.now().toString().slice(-4)}`;

    const tableDoc = {
      id: tableId,
      restaurantId,
      tableNumber: table.tableNumber.trim(),
      nameAr: table.nameAr?.trim() || table.tableNumber.trim(),
      capacity: Number(table.capacity || 4),
      location: table.location || 'indoor',
      isActive: table.isActive !== false,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'tables', tableId);
      await setDoc(docRef, tableDoc, { merge: true });
      store.saveTable(tableDoc);
      return tableDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${restaurantId}/tables/${tableId}`);
      store.saveTable(tableDoc);
      return tableDoc;
    }
  }

  /**
   * Deletes a table from Cloud Firestore
   */
  public async deleteTable(restaurantId: string, tableId: string): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'tables', tableId);
      await deleteDoc(docRef);
      store.deleteTable(tableId, restaurantId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}/tables/${tableId}`);
      store.deleteTable(tableId, restaurantId);
    }
  }

  /**
   * Generates direct public URL for a specific table QR code
   */
  public generateTableMenuUrl(restaurant: Restaurant, tableNumber: string): string {
    const origin = window.location.origin;
    const identifier = restaurant.slug || restaurant.id;
    return `${origin}/?rest=${encodeURIComponent(identifier)}&table=${encodeURIComponent(tableNumber)}`;
  }

  // ==========================================
  // 2. ORDERS MANAGEMENT
  // ==========================================

  private normalizeOrder(id: string, data: any): Order {
    return {
      id,
      restaurantId: data.restaurantId,
      orderNumber: data.orderNumber || `#${id.slice(-4)}`,
      orderType: data.orderType || 'dine_in',
      tableNumber: data.tableNumber || undefined,
      customerName: data.customerName || 'عميل',
      customerPhone: data.customerPhone || '',
      address: data.address || undefined,
      notes: data.notes || '',
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal || data.totalAmount || data.total || 0),
      tax: Number(data.tax || 0),
      deliveryFee: Number(data.deliveryFee || 0),
      total: Number(data.total || data.totalAmount || 0),
      totalAmount: Number(data.totalAmount || data.total || 0),
      status: (data.status === 'new' ? 'pending' : data.status) || 'pending',
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Subscribes to restaurant orders in real-time (Restaurant Owner or Super Admin only)
   */
  public subscribeOrders(
    restaurantId: string,
    callback: (orders: Order[]) => void
  ): Unsubscribe {
    if (!restaurantId) return () => {};

    const ordersCol = collection(db, 'restaurants', restaurantId, 'orders');

    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push(this.normalizeOrder(docSnap.id, docSnap.data()));
        });
        fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (!snapshot.empty) {
          store.setOrdersFromFirestore(restaurantId, fetchedOrders);
        }

        this.updateStatus(restaurantId, {
          isConnected: true,
          isLoading: false,
          ordersCount: fetchedOrders.length,
          lastSyncedAt: new Date(),
          error: null,
        });

        callback(fetchedOrders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `restaurants/${restaurantId}/orders`);
        this.updateStatus(restaurantId, {
          isLoading: false,
          error: 'تعذر تحميل الطلبات سحابياً، يتم استخدام النسخة المحلية.',
        });
        callback(store.getOrdersByRestaurant(restaurantId));
      }
    );
  }

  /**
   * Creates a new customer order and generates the prepared WhatsApp message.
   * Calculates subtotal, tax, and delivery fee to guarantee invoice accuracy.
   */
  public async submitOrder(
    restaurant: Restaurant,
    orderInput: {
      items: CartItem[];
      orderType: 'dine_in' | 'takeaway' | 'delivery';
      tableNumber?: string;
      customerName: string;
      customerPhone: string;
      address?: string;
      notes?: string;
    }
  ): Promise<{ order: Order; whatsappLink: string }> {
    if (!orderInput.customerName || !orderInput.customerName.trim()) {
      throw new Error('يرجى إدخال اسم العميل.');
    }
    if (!orderInput.customerPhone || !orderInput.customerPhone.trim()) {
      throw new Error('يرجى إدخال رقم هاتف العميل للتواصل.');
    }
    if (!orderInput.items || orderInput.items.length === 0) {
      throw new Error('سلة الطلبات فارغة.');
    }

    // 1. Calculate and verify invoice totals accurately from item snapshots
    const subtotal = orderInput.items.reduce((sum, item) => {
      let itemPrice = Number(item.unitPrice || 0);
      if (item.selectedSize?.price) {
        itemPrice = Number(item.selectedSize.price);
      }
      const optionsPrice =
        item.selectedOptions?.reduce((optSum, o) => optSum + Number(o.additionalPrice || 0), 0) || 0;
      return sum + (itemPrice + optionsPrice) * Number(item.quantity || 1);
    }, 0);

    const taxPercentage = restaurant.settings?.taxPercentage || 0;
    const tax = taxPercentage > 0 ? (subtotal * taxPercentage) / 100 : 0;
    const deliveryFee = orderInput.orderType === 'delivery' ? (restaurant.settings?.deliveryFee || 0) : 0;
    const total = Number((subtotal + tax + deliveryFee).toFixed(2));

    const orderId = `ord-${Date.now().toString().slice(-8)}`;
    const count = (store.getOrdersByRestaurant(restaurant.id).length || 0) + 1;
    const orderNumber = `#${1000 + count}`;
    const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Document adheres strictly to firestore.rules (incoming().status == 'pending', totalAmount <= 50000)
    const orderDoc = {
      id: orderId,
      restaurantId: restaurant.id,
      orderNumber,
      orderType: orderInput.orderType,
      tableNumber: orderInput.tableNumber || null,
      customerName: orderInput.customerName.trim().slice(0, 80),
      customerPhone: orderInput.customerPhone.trim(),
      address: orderInput.address?.trim() || null,
      notes: orderInput.notes?.trim() || '',
      items: orderInput.items.map((i) => ({
        cartItemId: i.cartItemId,
        menuItemId: i.menuItemId,
        nameAr: i.nameAr,
        nameEn: i.nameEn || i.nameAr,
        unitPrice: Number(i.unitPrice),
        quantity: Number(i.quantity),
        selectedSize: i.selectedSize || null,
        selectedOptions: i.selectedOptions || [],
        notes: i.notes || '',
        imageUrl: i.imageUrl || '',
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total,
      totalAmount: total, // Required for firestore.rules
      status: 'pending' as const, // Strictly required by firestore.rules
      createdAt,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      await setDoc(docRef, orderDoc);
      // Sync local store
      store.createOrder(orderDoc as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `restaurants/${restaurant.id}/orders/${orderId}`);
      // Fallback local save so customer never loses their order
      store.createOrder(orderDoc as any);
    }

    const createdOrder: Order = {
      ...orderDoc,
      items: orderInput.items,
      status: 'pending',
      tableNumber: orderDoc.tableNumber || undefined,
      address: orderDoc.address || undefined,
    };

    // Generate formatted WhatsApp message link
    const whatsappLink = store.generateWhatsAppOrderLink(restaurant, createdOrder);

    return { order: createdOrder, whatsappLink };
  }

  /**
   * Updates order operational status in Cloud Firestore (Owner or Super Admin only)
   */
  public async updateOrderStatus(
    restaurantId: string,
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus });
      store.updateOrderStatus(orderId, restaurantId, newStatus as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}/orders/${orderId}`);
      store.updateOrderStatus(orderId, restaurantId, newStatus as any);
    }
  }

  // ==========================================
  // 3. REVIEWS MANAGEMENT
  // ==========================================

  private normalizeReview(id: string, data: any): Review {
    return {
      id,
      restaurantId: data.restaurantId,
      customerName: data.customerName || 'زبون',
      rating: Math.min(5, Math.max(1, Number(data.rating || 5))),
      comment: data.comment || '',
      isApproved: !!data.isApproved,
      reply: data.reply || undefined,
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Subscribes to restaurant reviews in real-time
   * For public visitors: listens only to approved reviews (isApproved == true)
   * For restaurant dashboard: listens to all reviews
   */
  public subscribeReviews(
    restaurantId: string,
    approvedOnly: boolean,
    callback: (reviews: Review[]) => void
  ): Unsubscribe {
    if (!restaurantId) return () => {};

    const reviewsCol = collection(db, 'restaurants', restaurantId, 'reviews');

    return onSnapshot(
      reviewsCol,
      (snapshot) => {
        const fetchedReviews: Review[] = [];
        snapshot.forEach((docSnap) => {
          const rev = this.normalizeReview(docSnap.id, docSnap.data());
          if (!approvedOnly || rev.isApproved) {
            fetchedReviews.push(rev);
          }
        });
        fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (!snapshot.empty) {
          store.setReviewsFromFirestore(restaurantId, fetchedReviews);
        }

        this.updateStatus(restaurantId, {
          isConnected: true,
          isLoading: false,
          reviewsCount: fetchedReviews.length,
          lastSyncedAt: new Date(),
          error: null,
        });

        callback(fetchedReviews);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `restaurants/${restaurantId}/reviews`);
        this.updateStatus(restaurantId, {
          isLoading: false,
          error: 'تعذر تحميل التقييمات سحابياً، يتم استخدام النسخة المحلية.',
        });
        callback(store.getReviewsByRestaurant(restaurantId, approvedOnly));
      }
    );
  }

  /**
   * Submits a customer review with strict validation (rating 1-5, initial isApproved: false)
   */
  public async submitReview(
    restaurantId: string,
    reviewInput: {
      customerName: string;
      rating: number;
      comment?: string;
    }
  ): Promise<Review> {
    if (!reviewInput.customerName || !reviewInput.customerName.trim()) {
      throw new Error('يرجى إدخال اسمك لكتابة التقييم.');
    }
    const rating = Math.min(5, Math.max(1, Math.round(Number(reviewInput.rating || 5))));
    const reviewId = `rev-${Date.now().toString().slice(-8)}`;
    const createdAt = new Date().toISOString().split('T')[0];

    // Document conforms to firestore.rules: isApproved must be false, name size <= 80, comment <= 600
    const reviewDoc = {
      id: reviewId,
      restaurantId,
      customerName: reviewInput.customerName.trim().slice(0, 80),
      rating,
      comment: reviewInput.comment?.trim().slice(0, 600) || '',
      isApproved: false, // Strictly required by firestore.rules (cannot self-approve)
      createdAt,
    };

    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'reviews', reviewId);
      await setDoc(docRef, reviewDoc);
      store.addReview(reviewDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `restaurants/${restaurantId}/reviews/${reviewId}`);
      store.addReview(reviewDoc);
    }

    return reviewDoc;
  }

  /**
   * Approves or rejects a customer review (Owner or Super Admin only)
   */
  public async setReviewApproval(
    restaurantId: string,
    reviewId: string,
    isApproved: boolean
  ): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'reviews', reviewId);
      await updateDoc(docRef, { isApproved });
      store.setReviewApproval(reviewId, restaurantId, isApproved);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}/reviews/${reviewId}`);
      store.setReviewApproval(reviewId, restaurantId, isApproved);
    }
  }

  /**
   * Adds an official owner reply to a review
   */
  public async replyToReview(
    restaurantId: string,
    reviewId: string,
    replyText: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'reviews', reviewId);
      await updateDoc(docRef, { reply: replyText.trim() });
      store.replyToReview(reviewId, restaurantId, replyText.trim());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}/reviews/${reviewId}`);
      store.replyToReview(reviewId, restaurantId, replyText.trim());
    }
  }

  /**
   * Deletes a review from Cloud Firestore
   */
  public async deleteReview(restaurantId: string, reviewId: string): Promise<void> {
    try {
      const docRef = doc(db, 'restaurants', restaurantId, 'reviews', reviewId);
      await deleteDoc(docRef);
      store.deleteReview(reviewId, restaurantId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}/reviews/${reviewId}`);
      store.deleteReview(reviewId, restaurantId);
    }
  }

  /**
   * 1-Click Import of Local Tables and Reviews to Cloud Firestore
   */
  public async importLocalTablesAndReviews(
    restaurantId: string
  ): Promise<{ tablesCount: number; reviewsCount: number }> {
    const localTables = store.getTablesByRestaurant(restaurantId);
    const localReviews = store.getReviewsByRestaurant(restaurantId);

    let tCount = 0;
    for (const t of localTables) {
      await this.saveTable(restaurantId, t);
      tCount++;
    }

    let rCount = 0;
    for (const r of localReviews) {
      const docRef = doc(db, 'restaurants', restaurantId, 'reviews', r.id);
      await setDoc(docRef, r, { merge: true });
      rCount++;
    }

    this.updateStatus(restaurantId, {
      tablesCount: tCount,
      reviewsCount: rCount,
      lastSyncedAt: new Date(),
    });

    return { tablesCount: tCount, reviewsCount: rCount };
  }
}

export const firestoreOperationsService = new FirestoreOperationsService();

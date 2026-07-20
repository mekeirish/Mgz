const firebaseConfig = {
  apiKey: "AIzaSyAgqoYuUbyVNjwACPXoZcBfFMaeBk0udoY",
  authDomain: "mgz-project-e8de4.firebaseapp.com",
  databaseURL: "https://mgz-project-e8de4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mgz-project-e8de4",
  storageBucket: "mgz-project-e8de4.firebasestorage.app",
  messagingSenderId: "344833610568",
  appId: "1:344833610568:web:7c4ad4f8e60acd79d5197d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const messaging = firebase.messaging();

const DB = {
  // --- Firestore ---
  async getCategories() {
    const snapshot = await db.collection('categories').get();
    return snapshot.docs.map(doc => doc.data());
  },
  async getProducts() {
    const snapshot = await db.collection('products').get();
    return snapshot.docs.map(doc => doc.data());
  },
  async getCategoryById(id) {
    const doc = await db.collection('categories').doc(id).get();
    return doc.exists ? doc.data() : null;
  },
  async getProductById(id) {
    const doc = await db.collection('products').doc(id).get();
    return doc.exists ? doc.data() : null;
  },
  async addCategory(category) {
    await db.collection('categories').doc(category.id).set(category);
    return category;
  },
  async addProduct(product) {
    await db.collection('products').doc(product.id).set(product);
    return product;
  },
  async updateCategory(id, data) {
    await db.collection('categories').doc(id).update(data);
    return this.getCategoryById(id);
  },
  async updateProduct(id, data) {
    await db.collection('products').doc(id).update(data);
    return this.getProductById(id);
  },

  // --- Commandes (optionnel) ---
  async addOrder(order) {
    await db.collection('orders').doc(order.id).set(order);
    return order;
  },
  async getOrders() {
    const snapshot = await db.collection('orders').get();
    return snapshot.docs.map(doc => doc.data());
  },
  async updateOrder(id, data) {
    await db.collection('orders').doc(id).update(data);
    return this.getOrderById(id);
  },
  async getOrderById(id) {
    const doc = await db.collection('orders').doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  // --- Tokens de notification ---
  async saveVendorToken(token) {
    await db.collection('vendorTokens').doc('current').set({ token, updatedAt: new Date().toISOString() });
  },
  async getVendorToken() {
    const doc = await db.collection('vendorTokens').doc('current').get();
    return doc.exists ? doc.data().token : null;
  },

  // --- Notification (simplifiée) ---
  async sendPushNotification(title, body) {
    // Pour le moment, on utilise simplement l'API Notification si disponible
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
      console.log('📨 Notification envoyée');
    } else {
      console.warn('⚠️ Notifications non autorisées');
    }
  }
};

// ===================== INIT FCM (simplifié) =====================
(async function initFCM() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notifications autorisées.');
      // Pour le token, on le récupère mais sans forcer l'erreur
      try {
        const token = await messaging.getToken({
          vapidKey: 'BO7hFkdcvKZnbJocjPnFZ_nGmJ0sLwhj_7yZD1jahSZoVERmb_KsM7IRLORQYLK3OmDLS34m5aQyxNOM7hAObrU'
        });
        console.log('📱 Token FCM:', token);
        await DB.saveVendorToken(token);
      } catch (e) {
        console.warn('⚠️ Impossible d\'obtenir le token FCM:', e);
      }
    }
  } catch (error) {
    console.error('❌ Erreur init FCM:', error);
  }
})();
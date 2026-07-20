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

// ========== FIRESTORE ==========
const DB = {
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
  }
};

// ========== NOTIFICATIONS ==========
// Récupérer le token FCM
async function getFCMToken() {
  try {
    const token = await messaging.getToken({
      vapidKey: 'BO7hFkdcvKZnbJocjPnFZ_nGmJ0sLwhj_7yZD1jahSZoVERmb_KsM7IRLORQYLK3OmDLS34m5aQyxNOM7hAObrU'
    });
    console.log('📱 Token FCM:', token);
    // Stocker dans Firestore pour le vendeur
    await db.collection('vendorTokens').doc('current').set({ token, updatedAt: new Date().toISOString() });
    return token;
  } catch (err) {
    console.error('❌ Token FCM:', err);
    return null;
  }
}

// Envoyer une notification (simulée pour le test)
async function sendPushNotification(title, body) {
  console.log(`🔔 Notification: ${title} - ${body}`);
  // Notification locale si la page est ouverte
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
}

// Écouter les messages en premier plan
messaging.onMessage((payload) => {
  console.log('📨 Message reçu:', payload);
  const title = payload.notification?.title || 'Nouvelle notification';
  const body = payload.notification?.body || '';
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
});

// Demander la permission au chargement
document.addEventListener('DOMContentLoaded', async () => {
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await getFCMToken();
    }
  }
});

// Exposer pour le core
window.sendPushNotification = sendPushNotification;
window.getFCMToken = getFCMToken;
const firebaseConfig = {
  apiKey: "AIzaSyAgqoYuUbyVNjwACPXoZcBfFMaeBk0udoY",
  authDomain: "mgz-project-e8de4.firebaseapp.com",
  databaseURL: "https://mgz-project-e8de4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mgz-project-e8de4",
  storageBucket: "mgz-project-e8de4.firebasestorage.app",
  messagingSenderId: "344833610568",
  appId: "1:344833610568:web:7c4ad4f8e60acd79d5197d"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const messaging = firebase.messaging();

// ===================== FIRESTORE =====================
const DB = {
  // --- Lecture ---
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

  // --- Création ---
  async addCategory(category) {
    await db.collection('categories').doc(category.id).set(category);
    return category;
  },

  async addProduct(product) {
    await db.collection('products').doc(product.id).set(product);
    return product;
  },

  // --- Mise à jour ---
  async updateCategory(id, data) {
    await db.collection('categories').doc(id).update(data);
    return this.getCategoryById(id);
  },

  async updateProduct(id, data) {
    await db.collection('products').doc(id).update(data);
    return this.getProductById(id);
  },

  // --- Commandes ---
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

  // ===================== NOTIFICATIONS PUSH =====================
  // Envoyer une notification au vendeur via FCM
  async sendPushNotification(title, body) {
    const token = await this.getVendorToken();
    if (!token) {
      console.warn('⚠️ Aucun token vendeur enregistré.');
      // Fallback : notification locale si la page est ouverte
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
      }
      return;
    }

    // Construction du payload pour FCM
    const payload = {
      token: token,
      notification: {
        title: title,
        body: body,
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [200, 100, 200]
      },
      data: {
        url: '/',
        title: title,
        body: body
      }
    };

    try {
      // Note : l'envoi réel nécessite un serveur sécurisé.
      // Pour ce test, on utilise une simulation avec l'API Notification
      // En production, vous devez appeler l'API FCM depuis un serveur (Cloud Function)
      
      // Pour le test, on utilise la notification du navigateur
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
        console.log('✅ Notification locale envoyée');
      } else {
        console.warn('⚠️ Notifications non autorisées.');
      }
      
      // Simulation d'envoi
      console.log('📨 Notification push envoyée au vendeur :', { title, body, token });
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi push :', error);
      return { success: false, error };
    }
  }
};

// ===================== INITIALISATION FCM =====================
(async function initFCM() {
  try {
    // Demander la permission pour les notifications
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Permission notifications accordée.');
      
      // Récupérer le token avec la clé VAPID
      const token = await messaging.getToken({
        vapidKey: 'BO7hFkdcvKZnbJocjPnFZ_nGmJ0sLwhj_7yZD1jahSZoVERmb_KsM7IRLORQYLK3OmDLS34m5aQyxNOM7hAObrU'
      });
      
      console.log('📱 Token FCM :', token);
      
      // Stocker le token pour le vendeur
      await DB.saveVendorToken(token);
      console.log('💾 Token enregistré dans Firestore.');
    } else {
      console.warn('⚠️ Notifications refusées.');
    }
  } catch (error) {
    console.error('❌ Erreur FCM :', error);
  }
})();

// Gestion des messages en arrière-plan (quand l'onglet est fermé)
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Message reçu en arrière-plan :', payload);
  // La notification sera affichée par le service worker
  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationBody = payload.notification?.body || 'Message reçu';
  new Notification(notificationTitle, { body: notificationBody, icon: '/icon.png' });
});

// Gestion des messages en premier plan (quand l'onglet est ouvert)
messaging.onMessage((payload) => {
  console.log('📨 Message reçu en premier plan :', payload);
  const title = payload.notification?.title || 'Nouvelle notification';
  const body = payload.notification?.body || 'Message reçu';
  
  // Afficher une notification même si l'onglet est ouvert
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
});
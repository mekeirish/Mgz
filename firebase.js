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
  // ... (les fonctions existantes)
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

  // ========== COMMANDES ==========
  async addOrder(order) {
    await db.collection('orders').doc(order.id).set(order);
    return order;
  },
  async getOrders() {
    const snapshot = await db.collection('orders').get();
    return snapshot.docs.map(doc => doc.data());
  },

  // ========== NOTIFICATIONS PUSH ==========
  // Enregistrer le token du vendeur
  async saveVendorToken(token) {
    await db.collection('vendorTokens').doc('current').set({ token, updatedAt: new Date() });
  },
  async getVendorToken() {
    const doc = await db.collection('vendorTokens').doc('current').get();
    return doc.exists ? doc.data().token : null;
  },

  // Envoyer une notification au vendeur
  async sendPushNotification(title, body) {
    const token = await this.getVendorToken();
    if (!token) {
      console.warn('Aucun token vendeur enregistré.');
      return;
    }
    // On utilise FCM pour envoyer la notification
    // Note : normalement, l'envoi doit se faire depuis un serveur sécurisé.
    // Pour le test, on va utiliser une approche simple : on envoie via Firebase Cloud Messaging.
    // Mais comme on est en client, on ne peut pas envoyer directement via FCM.
    // On va stocker la commande et le vendeur recevra la notification via son service worker.
    // Pour le test, on simule une notification locale si le vendeur a le token.
    // On peut utiliser la fonction `messaging.send` qui n'est pas disponible côté client.
    // À la place, on va utiliser la notification API du navigateur si la page est ouverte.
    // Mais pour une notification push même fermée, il faut un service worker.
    // Je vais stocker la notification dans Firestore pour que le service worker la récupère.
    // Ou plus simplement : utiliser l'API Notification (si la page est ouverte).
    // Pour le moment, on va utiliser une notification du navigateur.
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
    } else {
      console.warn('Notifications non autorisées.');
    }
  }
};

// ========== INITIALISATION FCM ==========
(async function initFCM() {
  try {
    const token = await messaging.getToken({
      vapidKey: 'BIB1Hr7ONl7Jl7uX5_Q3PsklTbkQ-L7Ie_Y1x8N5ZxV0QjP-nLRGx7MxHpBqVY-bXwTQl7XbYbZ1J3U3Pp5N8gU' // à remplacer par votre clé VAPID
    });
    console.log('Token FCM :', token);
    // Stocker le token pour le vendeur
    await DB.saveVendorToken(token);
  } catch (err) {
    console.error('Erreur FCM :', err);
  }
})();

// Gestion des messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Message reçu en arrière-plan :', payload);
  // La notification sera affichée par le service worker
});
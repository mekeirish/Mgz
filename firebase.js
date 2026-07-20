// Responsable UNIQUEMENT des accès aux données et de l'authentification.
// Configuration Firebase réelle
const firebaseConfig = {
  apiKey: "AIzaSyAgqoYuUbyVNjwACPXoZcBfFMaeBk0udoY",
  authDomain: "mgz-project-e8de4.firebaseapp.com",
  databaseURL: "https://mgz-project-e8de4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mgz-project-e8de4",
  storageBucket: "mgz-project-e8de4.firebasestorage.app",
  messagingSenderId: "344833610568",
  appId: "1:344833610568:web:7c4ad4f8e60acd79d5197d"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Références aux services
const auth = firebase.auth();
const db = firebase.firestore();

// Fournisseur Facebook
const provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('email');
provider.addScope('public_profile');

// =====================================================
//                     BASE DE DONNÉES
// =====================================================
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
    // category doit contenir un champ 'id' généré par Business.generateId()
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

  // =====================================================
  //                     AUTHENTIFICATION
  // =====================================================
  async loginWithFacebook() {
    try {
      const result = await auth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error('Erreur connexion Facebook :', error);
      throw error;
    }
  },

  async logout() {
    await auth.signOut();
  },

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};
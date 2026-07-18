// Responsable UNIQUEMENT des accès aux données et de l'authentification.
// Configuration Firebase (à remplacer par vos propres valeurs)
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.FacebookAuthProvider();
// Ajouter les permissions nécessaires
provider.addScope('email');
provider.addScope('public_profile');

const DB = {
  // ... (les mêmes fonctions que précédemment, avec l'ajout éventuel d'images)
  // On garde le mock en mémoire, mais on peut y ajouter des utilisateurs si besoin.
  _categories: [
    { id: 'c1', name: 'Vêtements', imageUrl: 'https://via.placeholder.com/150' },
    { id: 'c2', name: 'Électronique', imageUrl: 'https://via.placeholder.com/150' }
  ],
  _products: [
    { id: 'p1', categoryId: 'c1', name: 'T-shirt Minimaliste', price: 25, imageUrl: 'https://via.placeholder.com/150' },
    { id: 'p2', categoryId: 'c2', name: 'Écouteurs sans fil', price: 89, imageUrl: 'https://via.placeholder.com/150' }
  ],

  // --- Lecture ---
  async getCategories() { return [...this._categories]; },
  async getProducts() { return [...this._products]; },
  async getCategoryById(id) { return this._categories.find(c => c.id === id); },
  async getProductById(id) { return this._products.find(p => p.id === id); },

  // --- Création ---
  async addCategory(category) { this._categories.push(category); return category; },
  async addProduct(product) { this._products.push(product); return product; },

  // --- Mise à jour ---
  async updateCategory(id, data) {
    const index = this._categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Catégorie introuvable');
    this._categories[index] = { ...this._categories[index], ...data };
    return this._categories[index];
  },
  async updateProduct(id, data) {
    const index = this._products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Produit introuvable');
    this._products[index] = { ...this._products[index], ...data };
    return this._products[index];
  },

  // ==================== AUTHENTIFICATION ====================
  // Connexion Facebook via popup
  async loginWithFacebook() {
    try {
      const result = await auth.signInWithPopup(provider);
      // Le résultat contient l'utilisateur et les tokens
      return result.user;
    } catch (error) {
      console.error('Erreur connexion Facebook :', error);
      throw error;
    }
  },

  // Déconnexion
  async logout() {
    await auth.signOut();
  },

  // Écouteur d'état d'authentification
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  },

  // Récupérer l'utilisateur courant (synchrone)
  getCurrentUser() {
    return auth.currentUser;
  }
};
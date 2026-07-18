// Responsable UNIQUEMENT de l'état global, du flux et de la communication.
const State = {
  role: 'client',           // 'client' ou 'vendor'
  view: 'categories',       // 'categories' ou 'products'
  activeCategoryId: null,
  categories: [],
  products: [],
  cart: [],
  currentEdit: null,        // { type: 'category'|'product', id, data }
  currentUploadedImageUrl: null,
  uploadTarget: null,
  user: null                // utilisateur connecté (objet traité par Business)
};

const Core = {
  // --- INIT ---
  async init() {
    // Attacher l'écouteur d'authentification
    DB.onAuthStateChanged(async (user) => {
      if (user) {
        // Traiter les données utilisateur
        const userData = Business.processFacebookUser(user);
        State.user = userData;
        // Charger les données de l'application
        await this.loadData();
        // Afficher l'UI de l'application
        UI.showApp(userData);
        // Mettre à jour l'état de l'UI (toggle, etc.)
        this.renderCurrentState();
        // Brancher les listeners (déjà faits mais on peut les réattacher)
        this.setupListeners();
      } else {
        State.user = null;
        UI.showLoginScreen();
        // Masquer les éléments utilisateur
        document.getElementById('user-avatar').classList.add('hidden');
        document.getElementById('user-name').classList.add('hidden');
        document.getElementById('btn-logout').classList.add('hidden');
        // On peut aussi vider le panier ?
        State.cart = [];
        UI.updateCartCount(0);
      }
    });

    // Ajouter les écouteurs pour les boutons de connexion/déconnexion
    document.getElementById('btn-login-facebook').addEventListener('click', () => {
      this.handleLogin();
    });
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.handleLogout();
    });
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
  },

  setupListeners() {
    // On évite de dupliquer les listeners en les ajoutant une seule fois.
    // Nous allons les ajouter dans init après le chargement.
    // Mais on peut les mettre ici et les appeler après le rendu.
    // Pour éviter les doublons, on les met dans init directement.
    // On va plutôt utiliser une approche avec des flags.
    // Pour simplifier, on les attache une seule fois au chargement.
    // On va utiliser une variable pour savoir s'ils sont déjà attachés.
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    // Toggle Rôle
    document.getElementById('role-toggle').addEventListener('change', (e) => {
      State.role = e.target.checked ? 'vendor' : 'client';
      State.view = 'categories';
      this.cancelEdit();
      this.renderCurrentState();
    });

    // Modale Panier
    document.getElementById('btn-cart').addEventListener('click', () => {
      UI.renderCart(State.cart);
      UI.toggleCartModal(true);
    });
    document.getElementById('close-cart').addEventListener('click', () => {
      UI.toggleCartModal(false);
    });
  },

  renderCurrentState() {
    if (!State.user) return; // pas connecté
    if (State.role === 'vendor') {
      UI.renderVendorView(State.categories, State.products);
    } else {
      if (State.view === 'categories') {
        UI.renderClientCategories(State.categories);
      } else if (State.view === 'products') {
        const category = State.categories.find(c => c.id === State.activeCategoryId);
        const categoryProducts = Business.getProductsByCategory(State.products, State.activeCategoryId);
        UI.renderClientProducts(category, categoryProducts);
      }
    }
  },

  // --- NAVIGATION CLIENT ---
  selectCategory(categoryId) {
    State.activeCategoryId = categoryId;
    State.view = 'products';
    this.renderCurrentState();
  },

  showCategories() {
    State.view = 'categories';
    State.activeCategoryId = null;
    this.renderCurrentState();
  },

  handleAddToCart(productId) {
    const product = State.products.find(p => p.id === productId);
    if (product) {
      State.cart = Business.addToCart(State.cart, product);
      UI.updateCartCount(State.cart.reduce((sum, item) => sum + item.quantity, 0));
    }
  },

  // --- ACTIONS VENDEUR : AJOUT ---
  async handleAddCategory() {
    const name = UI.getInputValue('cat-name');
    const imageUrl = State.currentUploadedImageUrl || null;
    try {
      const newCategory = Business.createCategory(name, imageUrl);
      await DB.addCategory(newCategory);
      State.currentUploadedImageUrl = null;
      await this.loadData();
      this.renderCurrentState();
    } catch (e) {
      console.error(e.message);
      alert(e.message);
    }
  },

  async handleAddProduct() {
    const catId = UI.getInputValueWithoutReset('prod-cat');
    const name = UI.getInputValue('prod-name');
    const price = UI.getInputValue('prod-price');
    const imageUrl = State.currentUploadedImageUrl || null;
    try {
      const newProduct = Business.createProduct(name, price, catId, imageUrl);
      await DB.addProduct(newProduct);
      State.currentUploadedImageUrl = null;
      await this.loadData();
      this.renderCurrentState();
    } catch (e) {
      console.error(e.message);
      alert(e.message);
    }
  },

  // --- ACTIONS VENDEUR : MODIFICATION ---
  async startEditCategory(id) {
    const cat = await DB.getCategoryById(id);
    if (!cat) return;
    State.currentEdit = { type: 'category', id, data: { ...cat } };
    State.currentUploadedImageUrl = null;
    this.renderCurrentState();
  },

  async startEditProduct(id) {
    const prod = await DB.getProductById(id);
    if (!prod) return;
    State.currentEdit = { type: 'product', id, data: { ...prod } };
    State.currentUploadedImageUrl = null;
    this.renderCurrentState();
  },

  cancelEdit() {
    State.currentEdit = null;
    State.currentUploadedImageUrl = null;
    this.renderCurrentState();
  },

  async submitEditCategory() {
    const name = UI.getInputValueWithoutReset('cat-name');
    const imageUrl = State.currentUploadedImageUrl || null;
    try {
      const validated = Business.validateCategoryUpdate(name, imageUrl);
      await DB.updateCategory(State.currentEdit.id, validated);
      State.currentEdit = null;
      State.currentUploadedImageUrl = null;
      await this.loadData();
      this.renderCurrentState();
    } catch (e) {
      console.error(e.message);
      alert(e.message);
    }
  },

  async submitEditProduct() {
    const catId = UI.getInputValueWithoutReset('prod-cat');
    const name = UI.getInputValueWithoutReset('prod-name');
    const price = UI.getInputValueWithoutReset('prod-price');
    const imageUrl = State.currentUploadedImageUrl || null;
    try {
      const validated = Business.validateProductUpdate(name, price, catId, imageUrl);
      await DB.updateProduct(State.currentEdit.id, validated);
      State.currentEdit = null;
      State.currentUploadedImageUrl = null;
      await this.loadData();
      this.renderCurrentState();
    } catch (e) {
      console.error(e.message);
      alert(e.message);
    }
  },

  // --- CLOUDINARY WIDGET ---
  openCloudinaryWidget(target) {
    State.uploadTarget = target;
    if (!window.cloudinary) {
      alert('Cloudinary widget non chargé.');
      return;
    }
    const widget = cloudinary.openUploadWidget(
      {
        cloudName: 'h91be5lz',
        uploadPreset: 'mgzcloud1',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        folder: 'lassoshop',
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxFileSize: 5000000
      },
      (error, result) => {
        if (error) {
          console.error('Erreur Cloudinary :', error);
          return;
        }
        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          State.currentUploadedImageUrl = imageUrl;
          UI.updateImagePreview(imageUrl);
        }
      }
    );
    widget.open();
  },

  // --- AUTHENTIFICATION (pont entre UI et Firebase) ---
  async handleLogin() {
    try {
      await DB.loginWithFacebook();
      // L'écouteur onAuthStateChanged gérera la mise à jour
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      alert('Impossible de se connecter avec Facebook. Veuillez réessayer.');
    }
  },

  async handleLogout() {
    try {
      await DB.logout();
      // L'écouteur gérera la déconnexion
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
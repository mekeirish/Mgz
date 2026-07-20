const State = {
  role: 'client',           // 'client' ou 'vendor'
  view: 'categories',
  activeCategoryId: null,
  categories: [],
  products: [],
  cart: [],
  currentEdit: null,
  currentUploadedImageUrl: null,
  uploadTarget: null,
  isVendorAuthenticated: false   // flag pour savoir si le vendeur est connecté
};

const Core = {
  async init() {
    UI.showLoading();
    try {
      await this.loadData();
      this.setupListeners();
      this.renderCurrentState();
    } catch (error) {
      console.error('Erreur d\'initialisation :', error);
      UI.showError('Impossible de charger les données. Vérifiez votre connexion et les règles Firestore.');
    }
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
  },

  async retryLoad() {
    UI.showLoading();
    try {
      await this.loadData();
      this.renderCurrentState();
    } catch (error) {
      console.error('Erreur lors du rechargement :', error);
      UI.showError('Impossible de recharger les données. Vérifiez vos règles Firestore.');
    }
  },

  setupListeners() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    // Toggle Vendeur/Client
    document.getElementById('role-toggle').addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        // On veut passer en mode vendeur => demander l'authentification
        UI.showLoginModal();
        // On ne change pas le rôle immédiatement, on attend la validation
        // On remet le toggle en position initiale si l'utilisateur annule
        // mais on garde la valeur cochée pour le moment ; on gère dans le login
        // On va stocker que le toggle est en attente
        this._pendingToggle = true;
      } else {
        // Passage en client : on déconnecte le vendeur si nécessaire
        if (State.isVendorAuthenticated) {
          State.isVendorAuthenticated = false;
        }
        State.role = 'client';
        State.view = 'categories';
        this.cancelEdit();
        this.renderCurrentState();
      }
    });

    // Gestion de la modale de connexion
    UI.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleVendorLogin();
    });

    UI.cancelLoginBtn.addEventListener('click', () => {
      this.handleCancelLogin();
    });

    UI.closeLoginBtn.addEventListener('click', () => {
      this.handleCancelLogin();
    });

    // Panier
    document.getElementById('btn-cart').addEventListener('click', () => {
      UI.renderCart(State.cart);
      UI.toggleCartModal(true);
    });
    document.getElementById('close-cart').addEventListener('click', () => {
      UI.toggleCartModal(false);
    });
  },

  // --- AUTHENTIFICATION VENDEUR ---
  handleVendorLogin() {
    const email = UI.loginEmail.value.trim();
    const password = UI.loginPassword.value.trim();
    // Identifiants de test
    if (email === 'admin@admin.com' && password === 'admin123') {
      State.isVendorAuthenticated = true;
      State.role = 'vendor';
      State.view = 'categories';
      this.cancelEdit();
      UI.hideLoginModal();
      // Le toggle est déjà coché, on le laisse
      this._pendingToggle = false;
      this.renderCurrentState();
    } else {
      UI.showLoginError('Email ou mot de passe incorrect.');
    }
  },

  handleCancelLogin() {
    // On décoche le toggle et on revient en mode client
    const toggle = document.getElementById('role-toggle');
    if (toggle.checked) {
      toggle.checked = false;
    }
    this._pendingToggle = false;
    State.role = 'client';
    State.view = 'categories';
    UI.hideLoginModal();
    this.renderCurrentState();
  },

  // --- RENDU ---
  renderCurrentState() {
    // Si le rôle est 'vendor' mais que l'utilisateur n'est pas authentifié,
    // on force le retour en client (cas de sécurité)
    if (State.role === 'vendor' && !State.isVendorAuthenticated) {
      State.role = 'client';
      const toggle = document.getElementById('role-toggle');
      if (toggle.checked) toggle.checked = false;
    }

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

  // --- ACTIONS VENDEUR ---
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
      UI.showError('Erreur lors de l\'ajout : ' + e.message);
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
      UI.showError('Erreur lors de l\'ajout : ' + e.message);
    }
  },

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
      UI.showError('Erreur lors de la mise à jour : ' + e.message);
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
      UI.showError('Erreur lors de la mise à jour : ' + e.message);
    }
  },

  // --- CLOUDINARY ---
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

  // (suppression de l'ancienne fonction switchToVendor)
};

document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
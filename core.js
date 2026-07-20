// Responsable UNIQUEMENT de l'état global, du flux et de la communication.
const State = {
  role: 'client',
  view: 'categories',
  activeCategoryId: null,
  categories: [],
  products: [],
  cart: [],
  currentEdit: null,
  currentUploadedImageUrl: null,
  uploadTarget: null,
  user: null
};

const Core = {
  async init() {
    // Attacher l'écouteur d'authentification
    DB.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = Business.processFacebookUser(user); // on peut renommer plus tard, mais la fonction fonctionne aussi pour Google
        State.user = userData;
        await this.loadData();
        UI.showApp(userData);
        this.renderCurrentState();
        this.setupListeners();
      } else {
        State.user = null;
        UI.showLoginScreen();
        document.getElementById('user-avatar').classList.add('hidden');
        document.getElementById('user-name').classList.add('hidden');
        document.getElementById('btn-logout').classList.add('hidden');
        State.cart = [];
        UI.updateCartCount(0);
      }
    });

    // Bouton de connexion Google
    document.getElementById('btn-login-google').addEventListener('click', () => {
      this.handleLogin();
    });

    // Bouton de déconnexion
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.handleLogout();
    });
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
  },

  setupListeners() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    document.getElementById('role-toggle').addEventListener('change', (e) => {
      State.role = e.target.checked ? 'vendor' : 'client';
      State.view = 'categories';
      this.cancelEdit();
      this.renderCurrentState();
    });

    document.getElementById('btn-cart').addEventListener('click', () => {
      UI.renderCart(State.cart);
      UI.toggleCartModal(true);
    });

    document.getElementById('close-cart').addEventListener('click', () => {
      UI.toggleCartModal(false);
    });
  },

  renderCurrentState() {
    if (!State.user) return;
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

  // --- AUTHENTIFICATION (Google) ---
  async handleLogin() {
    try {
      await DB.loginWithGoogle();
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      alert('Impossible de se connecter avec Google. Veuillez réessayer.');
    }
  },

  async handleLogout() {
    try {
      await DB.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
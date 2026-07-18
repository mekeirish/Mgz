// Responsable UNIQUEMENT de l'état global, du flux et de la communication.
const State = {
  role: 'client',           // 'client' ou 'vendor'
  view: 'categories',       // 'categories' ou 'products'
  activeCategoryId: null,
  categories: [],
  products: [],
  cart: [],
  currentEdit: null,        // { type: 'category'|'product', id, data }
  currentUploadedImageUrl: null, // URL de l'image uploadée via Cloudinary
  uploadTarget: null        // 'category' ou 'product' pour savoir où appliquer l'image
};

const Core = {
  // --- INIT ---
  async init() {
    await this.loadData();
    this.setupListeners();
    this.renderCurrentState();
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
  },

  setupListeners() {
    // Toggle Rôle
    document.getElementById('role-toggle').addEventListener('change', (e) => {
      State.role = e.target.checked ? 'vendor' : 'client';
      State.view = 'categories';
      // Annuler toute édition en cours
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
    // On nettoie l'image uploadée précédente
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
    State.uploadTarget = target; // 'category' ou 'product'
    // Réinitialiser l'URL précédente pour éviter les confusions
    // mais on garde la preview actuelle.
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
        maxFileSize: 5000000 // 5 Mo
      },
      (error, result) => {
        if (error) {
          console.error('Erreur Cloudinary :', error);
          return;
        }
        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          // Stocker l'URL dans l'état
          State.currentUploadedImageUrl = imageUrl;
          // Mettre à jour l'aperçu dans l'UI
          UI.updateImagePreview(imageUrl);
          // On peut aussi re-render pour mettre à jour les champs, mais UI.updateImagePreview le fait
        }
      }
    );
    widget.open();
  }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
// État global
const State = {
  role: 'client',
  view: 'categories',
  activeCategoryId: null,
  categories: [],
  products: [],
  cart: [],
  currentEdit: null,
  currentUploadedImageUrl: null,
  uploadTarget: null
};

const Core = {
  async init() {
    console.log('🚀 Core.init()');
    // Vérifier que DB est chargé
    if (typeof DB === 'undefined') {
      console.error('❌ DB non défini. Vérifiez firebase.js.');
      UI.showError('Erreur de connexion à la base de données.');
      return;
    }
    await this.loadData();
    this.setupListeners();
    this.render();
  },

  async loadData() {
    try {
      State.categories = await DB.getCategories();
      State.products = await DB.getProducts();
      console.log('📦 Catégories:', State.categories.length);
      console.log('📦 Produits:', State.products.length);
    } catch (err) {
      console.error('Erreur chargement données :', err);
      UI.showError('Impossible de charger les données.');
    }
  },

  setupListeners() {
    // Toggle Client / Vendeur
    document.getElementById('role-toggle').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.switchToVendor();
      } else {
        this.switchToClient();
      }
    });

    // Panier
    document.getElementById('btn-cart').addEventListener('click', () => {
      UI.renderCart(State.cart);
      UI.toggleCartModal(true);
    });
    document.getElementById('close-cart').addEventListener('click', () => {
      UI.toggleCartModal(false);
    });

    // Bouton Commander
    document.getElementById('btn-checkout').addEventListener('click', () => {
      this.handleCheckout();
    });
  },

  render() {
    if (State.role === 'vendor') {
      UI.renderVendorView(State.categories, State.products);
    } else {
      if (State.view === 'categories') {
        UI.renderCategories(State.categories);
      } else if (State.view === 'products') {
        const cat = State.categories.find(c => c.id === State.activeCategoryId);
        if (!cat) {
          this.showCategories();
          return;
        }
        const prods = Business.getProductsByCategory(State.products, State.activeCategoryId);
        UI.renderProducts(cat, prods);
      }
    }
  },

  // Navigation client
  selectCategory(categoryId) {
    State.activeCategoryId = categoryId;
    State.view = 'products';
    this.render();
  },

  showCategories() {
    State.view = 'categories';
    this.render();
  },

  addToCart(productId) {
    const product = State.products.find(p => p.id === productId);
    if (product) {
      State.cart = Business.addToCart(State.cart, product);
      UI.updateCartCount(State.cart.reduce((sum, item) => sum + item.quantity, 0));
    }
  },

  // Commande
  async handleCheckout() {
    if (State.cart.length === 0) {
      alert('Panier vide.');
      return;
    }
    try {
      const order = Business.createOrder(State.cart);
      await DB.addOrder(order);
      State.cart = [];
      UI.updateCartCount(0);
      UI.toggleCartModal(false);
      alert('✅ Commande envoyée !');
    } catch (err) {
      console.error(err);
      alert('❌ Erreur.');
    }
  },

  // Basculer rôles
  switchToVendor() {
    State.role = 'vendor';
    State.view = 'categories';
    this.render();
  },

  switchToClient() {
    State.role = 'client';
    State.view = 'categories';
    this.render();
    const toggle = document.getElementById('role-toggle');
    if (toggle.checked) toggle.checked = false;
  },

  // Actions Vendeur
  async handleAddCategory() {
    const name = UI.getInputValue('cat-name');
    const imageUrl = State.currentUploadedImageUrl || null;
    try {
      const newCategory = Business.createCategory(name, imageUrl);
      await DB.addCategory(newCategory);
      State.currentUploadedImageUrl = null;
      await this.loadData();
      this.render();
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
      this.render();
    } catch (e) {
      console.error(e.message);
      alert(e.message);
    }
  },

  // Cloudinary
  openCloudinaryWidget(target) {
    State.uploadTarget = target;
    if (!window.cloudinary) {
      alert('Cloudinary non chargé.');
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
          console.error('Cloudinary error:', error);
          return;
        }
        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          State.currentUploadedImageUrl = imageUrl;
          // Mettre à jour l'aperçu (optionnel)
          const previews = document.querySelectorAll('.vendor-form img');
          if (previews.length) {
            const img = previews[previews.length - 1];
            img.src = imageUrl;
          }
        }
      }
    );
    widget.open();
  }
};

// Exposer globalement
window.Core = Core;

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
// ============================================
// STATE GLOBAL
// ============================================
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
  isVendorAuthenticated: false,
  vendorTab: 'products'
};

// ============================================
// CORE - Version simplifiée
// ============================================
const Core = {
  async init() {
    console.log('🚀 Core.init()');
    await this.loadData();
    this.render();
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
    console.log('📦 Catégories:', State.categories.length);
    console.log('📦 Produits:', State.products.length);
  },

  render() {
    console.log('🎨 render() appelé, role:', State.role, 'view:', State.view);
    if (State.role === 'vendor') {
      UI.renderVendorView(State.categories, State.products);
    } else {
      if (State.view === 'categories') {
        UI.renderCategories(State.categories);
      } else if (State.view === 'products') {
        const cat = State.categories.find(c => c.id === State.activeCategoryId);
        const prods = Business.getProductsByCategory(State.products, State.activeCategoryId);
        UI.renderProducts(cat, prods);
      }
    }
  },

  // 👇 Ces fonctions sont appelées depuis les onclick
  selectCategory(categoryId) {
    console.log('👉 selectCategory() appelé avec:', categoryId);
    State.activeCategoryId = categoryId;
    State.view = 'products';
    this.render();
  },

  showCategories() {
    console.log('🏠 showCategories()');
    State.view = 'categories';
    this.render();
  },

  addToCart(productId) {
    console.log('🛒 addToCart() appelé avec:', productId);
    const product = State.products.find(p => p.id === productId);
    if (product) {
      State.cart = Business.addToCart(State.cart, product);
      UI.updateCartCount(State.cart.reduce((s, i) => s + i.quantity, 0));
    }
  },

  // Pour le vendeur (inchangé)
  switchToVendor() {
    State.role = 'vendor';
    this.render();
  },

  switchToClient() {
    State.role = 'client';
    State.view = 'categories';
    this.render();
  }
};

// EXPOSER GLOBALEMENT
window.Core = Core;

// DÉMARRAGE
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM prêt');
  Core.init();
});
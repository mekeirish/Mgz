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
  isVendorAuthenticated: false,
  vendorTab: 'products'
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
      UI.showError('Impossible de charger les données.');
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
      UI.showError('Impossible de recharger les données.');
    }
  },

  setupListeners() {
    if (this._listenersAttached) return;
    this._listenersAttached = true;

    // Toggle Vendeur
    document.getElementById('role-toggle').addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        UI.showLoginModal();
        this._pendingToggle = true;
      } else {
        State.isVendorAuthenticated = false;
        State.role = 'client';
        State.view = 'categories';
        this.cancelEdit();
        this.renderCurrentState();
      }
    });

    // Formulaire de connexion
    UI.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleVendorLogin();
    });
    UI.cancelLoginBtn.addEventListener('click', () => this.handleCancelLogin());
    UI.closeLoginBtn.addEventListener('click', () => this.handleCancelLogin());

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

    // Utiliser la délégation d'événements pour les catégories et produits
    document.getElementById('app-container').addEventListener('click', (e) => {
      const catBtn = e.target.closest('[data-category-id]');
      if (catBtn) {
        const categoryId = catBtn.dataset.categoryId;
        this.selectCategory(categoryId);
        return;
      }
      const productBtn = e.target.closest('[data-product-id]');
      if (productBtn) {
        const productId = productBtn.dataset.productId;
        this.handleAddToCart(productId);
        return;
      }
    });
  },

  // ... (autres fonctions inchangées)
};

// EXPOSER LES FONCTIONS GLOBALEMENT POUR LES ONCLICK
window.Core = Core;

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
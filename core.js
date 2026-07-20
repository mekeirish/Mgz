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
  vendorTab: 'products' // 'products' ou 'orders'
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
  },

  // --- AUTHENTIFICATION VENDEUR ---
  handleVendorLogin() {
    const email = UI.loginEmail.value.trim();
    const password = UI.loginPassword.value.trim();
    if (email === 'admin@admin.com' && password === 'admin123') {
      State.isVendorAuthenticated = true;
      State.role = 'vendor';
      State.vendorTab = 'products';
      this._pendingToggle = false;
      UI.hideLoginModal();
      this.renderCurrentState();
      // Demander les notifications
      this.requestNotificationPermission();
    } else {
      UI.showLoginError('Email ou mot de passe incorrect.');
    }
  },

  handleCancelLogin() {
    const toggle = document.getElementById('role-toggle');
    if (toggle.checked) toggle.checked = false;
    this._pendingToggle = false;
    State.role = 'client';
    State.view = 'categories';
    UI.hideLoginModal();
    this.renderCurrentState();
  },

  // --- NOTIFICATIONS PUSH ---
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications non supportées.');
      return;
    }
    if (Notification.permission === 'granted') {
      console.log('Notifications déjà autorisées.');
      return;
    }
    if (Notification.permission === 'denied') {
      console.warn('Notifications refusées.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notifications autorisées.');
      // Enregistrer le token FCM
      try {
        const token = await messaging.getToken({ vapidKey: 'VOTRE_CLE_VAPID' });
        await DB.saveVendorToken(token);
      } catch (err) {
        console.error('Erreur FCM :', err);
      }
    }
  },

  // --- RENDU ---
  renderCurrentState() {
    if (State.role === 'vendor' && !State.isVendorAuthenticated) {
      State.role = 'client';
      const toggle = document.getElementById('role-toggle');
      if (toggle.checked) toggle.checked = false;
    }

    if (State.role === 'vendor') {
      // Charger les commandes
      DB.getOrders().then(orders => {
        UI.renderVendorView(State.categories, State.products, orders);
      }).catch(err => {
        console.error(err);
        UI.renderVendorView(State.categories, State.products, []);
      });
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

  // --- COMMANDE ---
  async handleCheckout() {
    if (State.cart.length === 0) return;
    try {
      const order = Business.createOrder(State.cart);
      await DB.addOrder(order);
      // Vider le panier
      State.cart = [];
      UI.updateCartCount(0);
      UI.toggleCartModal(false);
      // Notifier le vendeur
      await DB.sendPushNotification('Nouvelle commande', `Commande #${order.id.slice(0,6)} - Total ${Business.formatPrice(order.total)}`);
      alert('Commande envoyée avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la commande.');
    }
  },

  // --- ACTIONS VENDEUR ---
  switchVendorTab(tab) {
    State.vendorTab = tab;
    this.renderCurrentState();
  },

  async updateOrderStatus(orderId) {
    try {
      const orders = await DB.getOrders();
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      order.status = 'livré';
      await DB.updateOrder(orderId, { status: 'livré' });
      this.renderCurrentState();
    } catch (err) {
      console.error(err);
    }
  },

  // ... (les autres fonctions : handleAddCategory, handleAddProduct, etc. inchangées)
};

document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
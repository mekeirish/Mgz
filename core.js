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
  isVendorAuthenticated: false
};

const Core = {
  async init() {
    console.log('🚀 Core.init()');
    await this.loadData();
    this.setupListeners();
    this.render();
  },

  async loadData() {
    State.categories = await DB.getCategories();
    State.products = await DB.getProducts();
    console.log('📦 Catégories:', State.categories.length);
    console.log('📦 Produits:', State.products.length);
  },

  setupListeners() {
    // Toggle Vendeur / Client
    const toggle = document.getElementById('role-toggle');
    toggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Demander l'authentification avant de passer en vendeur
        UI.showLoginModal();
        this._pendingToggle = true;
      } else {
        State.isVendorAuthenticated = false;
        State.role = 'client';
        State.view = 'categories';
        this.render();
      }
    });

    // Formulaire de connexion
    document.getElementById('vendor-login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
    document.getElementById('cancel-login').addEventListener('click', () => {
      this.cancelLogin();
    });
    document.getElementById('close-login').addEventListener('click', () => {
      this.cancelLogin();
    });

    // Panier
    document.getElementById('btn-cart').addEventListener('click', () => {
      UI.renderCart(State.cart);
      UI.toggleCartModal(true);
    });
    document.getElementById('close-cart').addEventListener('click', () => {
      UI.toggleCartModal(false);
    });
    document.getElementById('btn-checkout').addEventListener('click', () => {
      this.handleCheckout();
    });
  },

  // ===== AUTHENTIFICATION VENDEUR =====
  handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (email === 'admin@admin.com' && password === 'admin123') {
      State.isVendorAuthenticated = true;
      State.role = 'vendor';
      State.view = 'categories';
      this._pendingToggle = false;
      UI.hideLoginModal();
      // Demander les notifications
      this.requestNotifications();
      this.render();
    } else {
      document.getElementById('login-error').textContent = 'Email ou mot de passe incorrect.';
      document.getElementById('login-error').classList.remove('hidden');
    }
  },

  cancelLogin() {
    const toggle = document.getElementById('role-toggle');
    if (toggle.checked) toggle.checked = false;
    this._pendingToggle = false;
    State.role = 'client';
    UI.hideLoginModal();
    this.render();
  },

  async requestNotifications() {
    if (Notification.permission === 'granted') {
      await window.getFCMToken();
    } else if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await window.getFCMToken();
      }
    }
  },

  // ===== RENDU =====
  render() {
    if (State.role === 'vendor' && !State.isVendorAuthenticated) {
      State.role = 'client';
      const toggle = document.getElementById('role-toggle');
      if (toggle.checked) toggle.checked = false;
    }

    if (State.role === 'vendor') {
      // Charger les commandes pour le vendeur
      DB.getOrders().then(orders => {
        UI.renderVendorView(State.categories, State.products, orders);
      }).catch(() => {
        UI.renderVendorView(State.categories, State.products, []);
      });
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

  // ===== NAVIGATION CLIENT =====
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

  // ===== COMMANDE =====
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
      // Envoyer la notification au vendeur
      await window.sendPushNotification(
        '🛍️ Nouvelle commande !',
        `Commande #${order.id.slice(0,6)} - Total ${Business.formatPrice(order.total)}`
      );
      alert('✅ Commande envoyée !');
    } catch (err) {
      console.error(err);
      alert('❌ Erreur lors de la commande.');
    }
  },

  // ===== ACTIONS VENDEUR =====
  switchVendorTab(tab) {
    State.vendorTab = tab;
    this.render();
  },

  async updateOrderStatus(orderId) {
    try {
      await DB.updateOrder(orderId, { status: 'livré' });
      this.render();
    } catch (err) {
      console.error(err);
    }
  },

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
      alert(e.message);
    }
  },

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
          // Mettre à jour l'aperçu
          UI.updateImagePreview(imageUrl);
        }
      }
    );
    widget.open();
  }
};

window.Core = Core;

document.addEventListener('DOMContentLoaded', () => {
  Core.init();
});
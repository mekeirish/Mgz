// Responsable UNIQUEMENT de l'affichage, du HTML et des animations.
const UI = {
  container: document.getElementById('app-container'),
  cartBtn: document.getElementById('btn-cart'),
  cartModal: document.getElementById('cart-modal'),
  cartContent: document.getElementById('cart-content'),
  loginModal: document.getElementById('vendor-login-modal'),
  loginForm: document.getElementById('vendor-login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  cancelLoginBtn: document.getElementById('cancel-login'),
  closeLoginBtn: document.getElementById('close-login'),
  checkoutBtn: document.getElementById('btn-checkout'),

  // ... (showLoading, showError inchangés)

  // --- VUE CLIENT ---
  renderClientCategories(categories) {
    if (!categories || categories.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-10">
          <p class="text-xl opacity-70">Aucune catégorie disponible pour le moment.</p>
        </div>
      `;
      this.cartBtn.classList.add('hidden');
      return;
    }
    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Catégories</h2>
      <div class="flex flex-col gap-6">
        ${categories.map(cat => `
          <button class="glass-panel p-6 rounded-2xl text-left text-xl font-medium hover:bg-white/30 transition-colors flex items-center gap-4 w-full"
                  data-category-id="${cat.id}">
            <img src="${cat.imageUrl}" alt="${cat.name}" class="w-12 h-12 rounded-full object-cover border border-white/30" />
            <span>${cat.name}</span>
          </button>
        `).join('')}
      </div>
    `;
    this.cartBtn.classList.remove('hidden');
  },

  renderClientProducts(category, products) {
    this.container.innerHTML = `
      <button class="glass-btn px-5 py-3 rounded-xl w-fit mb-5 text-base font-medium" data-back="true">
        ← Retour
      </button>
      <h2 class="text-2xl font-bold mb-4">${category.name}</h2>
      <div class="flex flex-col gap-6">
        ${products.length === 0 ? '<p class="opacity-70 text-lg">Aucun produit.</p>' : ''}
        ${products.map(p => `
          <div class="glass-panel product-card rounded-2xl">
            <div class="product-info flex items-center gap-3">
              <img src="${p.imageUrl}" alt="${p.name}" class="w-14 h-14 rounded-full object-cover border border-white/30 flex-shrink-0" />
              <div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">${Business.formatPrice(p.price)}</div>
              </div>
            </div>
            <button class="glass-btn product-action px-5 py-3 text-sm font-medium" data-product-id="${p.id}">
              + Panier
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ... (le reste inchangé)
};
// Responsable UNIQUEMENT de l'affichage, du HTML et des animations.
const UI = {
  container: document.getElementById('app-container'),
  cartBtn: document.getElementById('btn-cart'),
  cartModal: document.getElementById('cart-modal'),
  cartContent: document.getElementById('cart-content'),

  renderClientCategories(categories) {
    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Catégories</h2>
      <div class="flex flex-col gap-6">
        ${categories.map(cat => `
          <button onclick="Core.selectCategory('${cat.id}')" 
                  class="glass-panel p-6 rounded-2xl text-left text-xl font-medium hover:bg-white/30 transition-colors">
            ${cat.name}
          </button>
        `).join('')}
      </div>
    `;
    this.cartBtn.classList.remove('hidden');
  },

  renderClientProducts(category, products) {
    this.container.innerHTML = `
      <button onclick="Core.showCategories()" 
              class="glass-btn px-5 py-3 rounded-xl w-fit mb-5 text-base font-medium">
        ← Retour
      </button>
      <h2 class="text-2xl font-bold mb-4">${category.name}</h2>
      <div class="flex flex-col gap-6">
        ${products.length === 0 ? '<p class="opacity-70 text-lg">Aucun produit.</p>' : ''}
        ${products.map(p => `
          <div class="glass-panel product-card rounded-2xl">
            <div class="product-info">
              <div class="product-name">${p.name}</div>
              <div class="product-price">${Business.formatPrice(p.price)}</div>
            </div>
            <button onclick="Core.handleAddToCart('${p.id}')" 
                    class="glass-btn product-action px-5 py-3 text-sm font-medium">
              + Panier
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderVendorView(categories) {
    this.cartBtn.classList.add('hidden');
    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-5">Espace Vendeur</h2>

      <!-- Ajouter Catégorie -->
      <div class="glass-panel p-6 rounded-2xl mb-7">
        <h3 class="text-xl font-medium mb-4">Nouvelle Catégorie</h3>
        <div class="flex flex-col sm:flex-row gap-4 vendor-form">
          <input type="text" id="cat-name" placeholder="Nom de la catégorie..." 
                 class="glass-input flex-1 w-full">
          <button onclick="Core.handleAddCategory()" 
                  class="glass-btn px-5 py-3 w-full sm:w-auto font-medium">
            Ajouter
          </button>
        </div>
      </div>

      <!-- Ajouter Produit -->
      <div class="glass-panel p-6 rounded-2xl flex flex-col gap-4 vendor-form">
        <h3 class="text-xl font-medium mb-1">Nouveau Produit</h3>
        <select id="prod-cat" class="glass-input w-full">
          <option value="">Choisir une catégorie...</option>
          ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <input type="text" id="prod-name" placeholder="Nom du produit" class="glass-input w-full">
        <input type="number" id="prod-price" placeholder="Prix (€)" class="glass-input w-full">
        <button onclick="Core.handleAddProduct()" 
                class="glass-btn px-5 py-3 w-full font-medium mt-2">
          Créer le produit
        </button>
      </div>
    `;
  },

  updateCartCount(count) {
    document.getElementById('cart-count').innerText = count;
  },

  renderCart(cart) {
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = cart.length === 0
      ? '<p class="opacity-70 text-center text-lg mt-6">Panier vide</p>'
      : cart.map(item => `
          <div class="glass-panel cart-item rounded-xl">
            <div class="item-details">
              <div class="item-name">${item.name}</div>
              <div class="item-quantity">Qté : ${item.quantity}</div>
            </div>
            <span class="item-total">${Business.formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('');
    document.getElementById('cart-total').innerText = Business.formatPrice(
      Business.calculateCartTotal(cart)
    );
  },

  toggleCartModal(show) {
    if (show) {
      this.cartModal.classList.remove('hidden');
      this.cartModal.classList.add('flex');
      // Petit délai pour la transition
      requestAnimationFrame(() => {
        this.cartContent.classList.remove('translate-y-full');
      });
    } else {
      this.cartContent.classList.add('translate-y-full');
      setTimeout(() => {
        this.cartModal.classList.add('hidden');
        this.cartModal.classList.remove('flex');
      }, 300);
    }
  },

  getInputValue(id) {
    const el = document.getElementById(id);
    const val = el ? el.value : '';
    if (el) el.value = ''; // reset après récupération
    return val;
  }
};
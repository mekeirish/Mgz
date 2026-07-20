const UI = {
  container: document.getElementById('app-container'),
  cartBtn: document.getElementById('btn-cart'),
  cartModal: document.getElementById('cart-modal'),
  cartContent: document.getElementById('cart-content'),
  checkoutBtn: document.getElementById('btn-checkout'),

  renderCategories(categories) {
    if (!categories || categories.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-10">
          <p class="text-xl opacity-70">Aucune catégorie disponible.</p>
        </div>
      `;
      this.cartBtn.classList.add('hidden');
      return;
    }

    let html = `<h2 class="text-2xl font-bold mb-4">Catégories</h2><div class="flex flex-col gap-6">`;
    for (const cat of categories) {
      html += `
        <button onclick="Core.selectCategory('${cat.id}')"
                class="glass-panel p-6 rounded-2xl text-left text-xl font-medium hover:bg-white/30 flex items-center gap-4 w-full">
          <img src="${cat.imageUrl}" class="w-12 h-12 rounded-full object-cover border border-white/30" />
          <span>${cat.name}</span>
        </button>
      `;
    }
    html += `</div>`;
    this.container.innerHTML = html;
    this.cartBtn.classList.remove('hidden');
  },

  renderProducts(category, products) {
    if (!category) {
      Core.showCategories();
      return;
    }

    let html = `
      <button onclick="Core.showCategories()" class="glass-btn px-5 py-3 rounded-xl w-fit mb-5">
        ← Retour
      </button>
      <h2 class="text-2xl font-bold mb-4">${category.name}</h2>
      <div class="flex flex-col gap-6">
    `;

    if (products.length === 0) {
      html += `<p class="opacity-70 text-lg">Aucun produit.</p>`;
    } else {
      for (const p of products) {
        html += `
          <div class="glass-panel product-card rounded-2xl flex justify-between items-center p-4">
            <div class="flex items-center gap-3">
              <img src="${p.imageUrl}" class="w-14 h-14 rounded-full object-cover border border-white/30" />
              <div>
                <div class="font-medium">${p.name}</div>
                <div class="text-sm opacity-80">${Business.formatPrice(p.price)}</div>
              </div>
            </div>
            <button onclick="Core.addToCart('${p.id}')" class="glass-btn px-4 py-2 text-sm">
              + Panier
            </button>
          </div>
        `;
      }
    }
    html += `</div>`;
    this.container.innerHTML = html;
  },

  renderVendorView(categories, products) {
    this.cartBtn.classList.add('hidden');

    let html = `
      <h2 class="text-2xl font-bold mb-5">Espace Vendeur</h2>
      <button onclick="Core.switchToClient()" class="glass-btn mb-6 px-4 py-2 text-sm">
        ← Retour Client
      </button>
      <div class="glass-panel p-6 rounded-2xl mb-6">
        <h3 class="text-xl font-medium mb-4">Nouvelle catégorie</h3>
        <div class="flex flex-col gap-4">
          <input type="text" id="cat-name" placeholder="Nom" class="glass-input w-full" />
          <button onclick="Core.handleAddCategory()" class="glass-btn w-full py-3">Ajouter</button>
        </div>
      </div>
      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-xl font-medium mb-4">Nouveau produit</h3>
        <div class="flex flex-col gap-4">
          <select id="prod-cat" class="glass-input w-full">
            <option value="">Choisir une catégorie...</option>
            ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
          <input type="text" id="prod-name" placeholder="Nom" class="glass-input w-full" />
          <input type="number" id="prod-price" placeholder="Prix" class="glass-input w-full" />
          <button onclick="Core.handleAddProduct()" class="glass-btn w-full py-3">Ajouter</button>
        </div>
      </div>
    `;
    this.container.innerHTML = html;
  },

  renderCart(cart) {
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = cart.length === 0
      ? '<p class="opacity-70 text-center text-lg mt-6">Panier vide</p>'
      : cart.map(item => `
          <div class="glass-panel cart-item rounded-xl flex justify-between items-center p-4">
            <div class="flex items-center gap-3">
              <img src="${item.imageUrl}" class="w-10 h-10 rounded-full object-cover border border-white/30" />
              <div>
                <div class="font-medium">${item.name}</div>
                <div class="text-sm opacity-70">Qté : ${item.quantity}</div>
              </div>
            </div>
            <span>${Business.formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('');
    document.getElementById('cart-total').innerText = Business.formatPrice(
      Business.calculateCartTotal(cart)
    );

    const checkoutBtn = document.getElementById('btn-checkout');
    if (cart.length > 0) {
      checkoutBtn.classList.remove('hidden');
    } else {
      checkoutBtn.classList.add('hidden');
    }
  },

  toggleCartModal(show) {
    if (show) {
      this.cartModal.classList.remove('hidden');
      this.cartModal.classList.add('flex');
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

  updateCartCount(count) {
    document.getElementById('cart-count').innerText = count;
  },

  // Utilitaires
  getInputValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    const val = el.value;
    el.value = '';
    return val;
  },

  getInputValueWithoutReset(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
};
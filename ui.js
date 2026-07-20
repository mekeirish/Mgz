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

  showLoading() {
    console.log('⏳ Affichage du chargement');
    this.container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-lg opacity-70">Chargement...</p>
      </div>
    `;
  },

  showError(message) {
    console.error('❌ Erreur affichée :', message);
    this.container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 text-lg font-semibold">⚠️ Erreur</p>
        <p class="opacity-80 mt-2">${message}</p>
        <button class="glass-btn px-5 py-2 mt-4 text-sm font-medium" id="retry-btn">
          Réessayer
        </button>
      </div>
    `;
    document.getElementById('retry-btn')?.addEventListener('click', () => Core.retryLoad());
    this.cartBtn.classList.add('hidden');
  },

  renderClientCategories(categories) {
    console.log('📋 Rendu des catégories client, nombre :', categories?.length);
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
    console.log('✅ Catégories rendues, attributs data-category-id présents');
    this.cartBtn.classList.remove('hidden');
  },

  renderClientProducts(category, products) {
    console.log('📋 Rendu des produits pour la catégorie :', category?.name, 'nombre :', products?.length);
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
    console.log('✅ Produits rendus, attributs data-product-id présents');
  },

  renderVendorView(categories, products, orders = []) {
    console.log('👨‍💼 Rendu vue vendeur');
    this.cartBtn.classList.add('hidden');

    const tabs = `
      <div class="flex gap-2 mb-6">
        <button onclick="Core.switchVendorTab('products')" 
                class="glass-btn px-4 py-2 text-sm font-medium ${State.vendorTab === 'products' ? 'bg-white/30' : ''}" 
                id="tab-products">
          📦 Produits
        </button>
        <button onclick="Core.switchVendorTab('orders')" 
                class="glass-btn px-4 py-2 text-sm font-medium ${State.vendorTab === 'orders' ? 'bg-white/30' : ''}" 
                id="tab-orders">
          📋 Commandes ${orders.length > 0 ? '(' + orders.filter(o => o.status !== 'livré').length + ')' : ''}
        </button>
      </div>
    `;

    let content = '';
    if (State.vendorTab === 'products') {
      content = this._renderProductsTab(categories, products);
    } else {
      content = this._renderOrdersTab(orders);
    }

    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-5">Espace Vendeur</h2>
      ${tabs}
      ${content}
    `;
  },

  _renderProductsTab(categories, products) {
    // ... (même code que précédemment, inchangé)
    const isEditingCategory = State.currentEdit && State.currentEdit.type === 'category';
    const catData = isEditingCategory ? State.currentEdit.data : null;

    const catFormHtml = `
      <div class="glass-panel p-6 rounded-2xl mb-7">
        <h3 class="text-xl font-medium mb-4">${isEditingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
        <div class="flex flex-col gap-4 vendor-form">
          <input type="text" id="cat-name" placeholder="Nom de la catégorie..."
                 class="glass-input w-full" value="${catData ? catData.name : ''}" />
          <div class="flex items-center gap-4">
            <button onclick="Core.openCloudinaryWidget('category')"
                    class="glass-btn px-5 py-3 text-sm font-medium">
              Choisir une image
            </button>
            ${State.currentUploadedImageUrl ? `<img src="${State.currentUploadedImageUrl}" alt="Aperçu" class="w-12 h-12 rounded-full object-cover border border-white/30" />` : ''}
          </div>
          <button onclick="${isEditingCategory ? "Core.submitEditCategory()" : "Core.handleAddCategory()"}"
                  class="glass-btn px-5 py-3 w-full font-medium">
            ${isEditingCategory ? 'Mettre à jour' : 'Ajouter'}
          </button>
          ${isEditingCategory ? `<button onclick="Core.cancelEdit()" class="glass-btn px-5 py-3 w-full font-medium mt-2">Annuler</button>` : ''}
        </div>
      </div>
    `;

    const isEditingProduct = State.currentEdit && State.currentEdit.type === 'product';
    const prodData = isEditingProduct ? State.currentEdit.data : null;

    const prodFormHtml = `
      <div class="glass-panel p-6 rounded-2xl flex flex-col gap-4 vendor-form">
        <h3 class="text-xl font-medium mb-1">${isEditingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
        <select id="prod-cat" class="glass-input w-full">
          <option value="">Choisir une catégorie...</option>
          ${categories.map(c => `<option value="${c.id}" ${prodData && prodData.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        <input type="text" id="prod-name" placeholder="Nom du produit" class="glass-input w-full" value="${prodData ? prodData.name : ''}" />
        <input type="number" id="prod-price" placeholder="Prix (€)" class="glass-input w-full" value="${prodData ? prodData.price : ''}" />
        <div class="flex items-center gap-4">
          <button onclick="Core.openCloudinaryWidget('product')"
                  class="glass-btn px-5 py-3 text-sm font-medium">
            Choisir une image
          </button>
          ${State.currentUploadedImageUrl ? `<img src="${State.currentUploadedImageUrl}" alt="Aperçu" class="w-12 h-12 rounded-full object-cover border border-white/30" />` : ''}
        </div>
        <button onclick="${isEditingProduct ? "Core.submitEditProduct()" : "Core.handleAddProduct()"}"
                class="glass-btn px-5 py-3 w-full font-medium mt-2">
          ${isEditingProduct ? 'Mettre à jour' : 'Créer le produit'}
        </button>
        ${isEditingProduct ? `<button onclick="Core.cancelEdit()" class="glass-btn px-5 py-3 w-full font-medium mt-2">Annuler</button>` : ''}
      </div>
    `;

    const categoriesList = `
      <div class="mb-6">
        <h4 class="text-lg font-medium mb-3">Catégories existantes</h4>
        <div class="flex flex-col gap-3">
          ${categories.map(c => `
            <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img src="${c.imageUrl}" alt="${c.name}" class="w-10 h-10 rounded-full object-cover border border-white/30" />
                <span class="font-medium">${c.name}</span>
              </div>
              <button onclick="Core.startEditCategory('${c.id}')" class="glass-btn px-4 py-2 text-sm font-medium">Modifier</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const productsList = `
      <div>
        <h4 class="text-lg font-medium mb-3">Produits existants</h4>
        <div class="flex flex-col gap-3">
          ${products.map(p => `
            <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img src="${p.imageUrl}" alt="${p.name}" class="w-10 h-10 rounded-full object-cover border border-white/30" />
                <div>
                  <span class="font-medium">${p.name}</span>
                  <span class="text-sm opacity-70 ml-2">${Business.formatPrice(p.price)}</span>
                </div>
              </div>
              <button onclick="Core.startEditProduct('${p.id}')" class="glass-btn px-4 py-2 text-sm font-medium">Modifier</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return `
      ${catFormHtml}
      ${categoriesList}
      ${prodFormHtml}
      ${productsList}
    `;
  },

  _renderOrdersTab(orders) {
    if (!orders || orders.length === 0) {
      return `<p class="opacity-70 text-center py-6">Aucune commande pour le moment.</p>`;
    }
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return `
      <div class="flex flex-col gap-4">
        ${sorted.map(order => `
          <div class="glass-panel p-4 rounded-xl">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium">Commande #${order.id.slice(0, 6)}</p>
                <p class="text-sm opacity-70">Client : ${order.clientName || 'Anonyme'}</p>
                <p class="text-sm opacity-70">Date : ${new Date(order.createdAt).toLocaleString()}</p>
                <p class="text-sm font-medium">Total : ${Business.formatPrice(order.total)}</p>
                <p class="text-sm">Statut : <span class="font-medium ${order.status === 'livré' ? 'text-green-600' : 'text-orange-500'}">${order.status}</span></p>
              </div>
              ${order.status !== 'livré' ? `
                <button onclick="Core.updateOrderStatus('${order.id}')" class="glass-btn px-3 py-1 text-sm">
                  ✅ Livrer
                </button>
              ` : ''}
            </div>
            <details class="mt-2">
              <summary class="text-sm cursor-pointer opacity-70">Voir les articles</summary>
              <ul class="mt-2 space-y-1">
                ${order.items.map(item => `
                  <li class="text-sm flex justify-between">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>${Business.formatPrice(item.price * item.quantity)}</span>
                  </li>
                `).join('')}
              </ul>
            </details>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderCart(cart) {
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = cart.length === 0
      ? '<p class="opacity-70 text-center text-lg mt-6">Panier vide</p>'
      : cart.map(item => `
          <div class="glass-panel cart-item rounded-xl">
            <div class="item-details flex items-center gap-3">
              <img src="${item.imageUrl}" alt="${item.name}" class="w-10 h-10 rounded-full object-cover border border-white/30" />
              <div>
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">Qté : ${item.quantity}</div>
              </div>
            </div>
            <span class="item-total">${Business.formatPrice(item.price * item.quantity)}</span>
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

  showLoginModal() {
    this.loginModal.classList.remove('hidden');
    this.loginModal.classList.add('flex');
    this.loginError.classList.add('hidden');
  },

  hideLoginModal() {
    this.loginModal.classList.add('hidden');
    this.loginModal.classList.remove('flex');
    this.loginError.classList.add('hidden');
  },

  showLoginError(message) {
    this.loginError.textContent = message;
    this.loginError.classList.remove('hidden');
  },

  updateImagePreview(imageUrl) {
    const previews = this.container.querySelectorAll('.vendor-form img');
    if (previews.length) {
      const img = previews[previews.length - 1];
      img.src = imageUrl;
      img.alt = 'Aperçu';
    } else {
      this.renderVendorView(State.categories, State.products);
    }
  },

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
  },

  updateCartCount(count) {
    document.getElementById('cart-count').innerText = count;
  }
};
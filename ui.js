// Responsable UNIQUEMENT de l'affichage, du HTML et des animations.
const UI = {
  container: document.getElementById('app-container'),
  cartBtn: document.getElementById('btn-cart'),
  cartModal: document.getElementById('cart-modal'),
  cartContent: document.getElementById('cart-content'),
  loginScreen: document.getElementById('login-screen'),
  appWrapper: document.getElementById('app-wrapper'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  logoutBtn: document.getElementById('btn-logout'),

  // --- Gestion de l'UI selon l'utilisateur ---
  showLoginScreen() {
    this.loginScreen.classList.remove('hidden');
    this.appWrapper.classList.add('hidden');
  },

  showApp(userData) {
    this.loginScreen.classList.add('hidden');
    this.appWrapper.classList.remove('hidden');
    if (userData) {
      this.userAvatar.src = userData.avatar || 'https://via.placeholder.com/40';
      this.userAvatar.classList.remove('hidden');
      this.userName.textContent = userData.name || 'Utilisateur';
      this.userName.classList.remove('hidden');
      this.logoutBtn.classList.remove('hidden');
    }
  },

  // --- VUE CLIENT ---
  renderClientCategories(categories) {
    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">Catégories</h2>
      <div class="flex flex-col gap-6">
        ${categories.map(cat => `
          <button onclick="Core.selectCategory('${cat.id}')"
                  class="glass-panel p-6 rounded-2xl text-left text-xl font-medium hover:bg-white/30 transition-colors flex items-center gap-4">
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
      <button onclick="Core.showCategories()"
              class="glass-btn px-5 py-3 rounded-xl w-fit mb-5 text-base font-medium">
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
            <button onclick="Core.handleAddToCart('${p.id}')"
                    class="glass-btn product-action px-5 py-3 text-sm font-medium">
              + Panier
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  // --- VUE VENDEUR (inchangée) ---
  renderVendorView(categories, products) {
    this.cartBtn.classList.add('hidden');

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

    this.container.innerHTML = `
      <h2 class="text-2xl font-bold mb-5">Espace Vendeur</h2>
      ${catFormHtml}
      ${categoriesList}
      ${prodFormHtml}
      ${productsList}
    `;
  },

  // --- METTRE À JOUR LA PREVIEW D'IMAGE ---
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

  // --- PANIER ---
  updateCartCount(count) {
    document.getElementById('cart-count').innerText = count;
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
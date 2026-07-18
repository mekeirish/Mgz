// Responsable UNIQUEMENT de l'affichage, du HTML et des animations.

const UI = {
    container: document.getElementById('app-container'),
    cartBtn: document.getElementById('btn-cart'),
    cartModal: document.getElementById('cart-modal'),
    cartContent: document.getElementById('cart-content'),
    
    renderClientCategories(categories) {
        this.container.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Catégories</h2>
            <div class="flex flex-col gap-4">
                ${categories.map(cat => `
                    <button onclick="Core.selectCategory('${cat.id}')" 
                            class="glass-panel p-6 rounded-2xl text-left text-lg font-medium hover:bg-white/30 transition-colors">
                        ${cat.name}
                    </button>
                `).join('')}
            </div>
        `;
        this.cartBtn.classList.remove('hidden');
    },

    renderClientProducts(category, products) {
        this.container.innerHTML = `
            <button onclick="Core.showCategories()" class="glass-btn px-4 py-2 rounded-xl w-fit mb-4 text-sm font-medium">
                ← Retour
            </button>
            <h2 class="text-xl font-bold mb-2">${category.name}</h2>
            <div class="flex flex-col gap-4">
                ${products.length === 0 ? '<p class="opacity-70">Aucun produit.</p>' : ''}
                ${products.map(p => `
                    <div class="glass-panel p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <h3 class="font-medium">${p.name}</h3>
                            <p class="text-sm opacity-80">${Business.formatPrice(p.price)}</p>
                        </div>
                        <button onclick="Core.handleAddToCart('${p.id}')" class="glass-btn px-3 py-1.5 rounded-xl text-sm font-medium">
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
            <h2 class="text-xl font-bold mb-4">Espace Vendeur</h2>
            
            <!-- Ajouter Catégorie -->
            <div class="glass-panel p-5 rounded-2xl mb-6">
                <h3 class="font-medium mb-3">Nouvelle Catégorie</h3>
                <div class="flex gap-2">
                    <input type="text" id="cat-name" placeholder="Nom..." class="glass-input flex-1 px-4 py-2 rounded-xl">
                    <button onclick="Core.handleAddCategory()" class="glass-btn px-4 py-2 rounded-xl font-medium">Ajouter</button>
                </div>
            </div>

            <!-- Ajouter Produit -->
            <div class="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                <h3 class="font-medium mb-1">Nouveau Produit</h3>
                <select id="prod-cat" class="glass-input px-4 py-2 rounded-xl w-full">
                    <option value="">Choisir une catégorie...</option>
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
                <input type="text" id="prod-name" placeholder="Nom du produit" class="glass-input px-4 py-2 rounded-xl w-full">
                <input type="number" id="prod-price" placeholder="Prix" class="glass-input px-4 py-2 rounded-xl w-full">
                <button onclick="Core.handleAddProduct()" class="glass-btn px-4 py-2 rounded-xl font-medium mt-2">Créer le produit</button>
            </div>
        `;
    },

    updateCartCount(count) {
        document.getElementById('cart-count').innerText = count;
    },

    renderCart(cart) {
        const itemsContainer = document.getElementById('cart-items');
        itemsContainer.innerHTML = cart.length === 0 ? '<p class="opacity-70 text-center mt-4">Panier vide</p>' : 
            cart.map(item => `
                <div class="glass-panel p-3 rounded-xl flex justify-between items-center">
                    <div>
                        <p class="font-medium text-sm">${item.name}</p>
                        <p class="text-xs opacity-80">Qté: ${item.quantity}</p>
                    </div>
                    <span class="font-medium text-sm">${Business.formatPrice(item.price * item.quantity)}</span>
                </div>
            `).join('');
            
        document.getElementById('cart-total').innerText = Business.formatPrice(Business.calculateCartTotal(cart));
    },

    toggleCartModal(show) {
        if (show) {
            this.cartModal.classList.remove('hidden');
            this.cartModal.classList.add('flex');
            setTimeout(() => this.cartContent.classList.remove('translate-y-full'), 10);
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
        if (el) el.value = ''; // Reset after get
        return val;
    }
};

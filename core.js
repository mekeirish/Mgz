// Responsable UNIQUEMENT de l'état global, du flux et de la communication entre les fichiers.

const State = {
    role: 'client', // 'client' ou 'vendor'
    view: 'categories', // 'categories' ou 'products'
    activeCategoryId: null,
    categories: [],
    products: [],
    cart: []
};

const Core = {
    async init() {
        await this.loadData();
        this.setupListeners();
        this.renderCurrentState();
    },

    async loadData() {
        State.categories = await DB.getCategories();
        State.products = await DB.getProducts();
    },

    setupListeners() {
        // Toggle Rôle
        document.getElementById('role-toggle').addEventListener('change', (e) => {
            State.role = e.target.checked ? 'vendor' : 'client';
            State.view = 'categories';
            this.renderCurrentState();
        });

        // Modale Panier
        document.getElementById('btn-cart').addEventListener('click', () => {
            UI.renderCart(State.cart);
            UI.toggleCartModal(true);
        });
        document.getElementById('close-cart').addEventListener('click', () => {
            UI.toggleCartModal(false);
        });
    },

    renderCurrentState() {
        if (State.role === 'vendor') {
            UI.renderVendorView(State.categories);
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

    // --- Actions de Navigation Client ---
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

    // --- Actions Vendeur ---
    async handleAddCategory() {
        const name = UI.getInputValue('cat-name');
        try {
            const newCategory = Business.createCategory(name);
            await DB.addCategory(newCategory);
            await this.loadData();
            this.renderCurrentState();
        } catch (e) {
            console.error(e.message);
        }
    },

    async handleAddProduct() {
        const catId = document.getElementById('prod-cat').value;
        const name = UI.getInputValue('prod-name');
        const price = UI.getInputValue('prod-price');
        
        try {
            const newProduct = Business.createProduct(name, price, catId);
            await DB.addProduct(newProduct);
            await this.loadData();
            this.renderCurrentState();
        } catch (e) {
            console.error(e.message);
        }
    }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
    Core.init();
});

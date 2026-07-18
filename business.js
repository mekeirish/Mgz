// Responsable UNIQUEMENT de la logique métier, des calculs et du formatage.

const Business = {
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    formatPrice(price) {
        return parseFloat(price).toFixed(2) + ' €';
    },

    createCategory(name) {
        if (!name.trim()) throw new Error("Le nom de la catégorie est requis.");
        return { id: this.generateId(), name: name.trim() };
    },

    createProduct(name, price, categoryId) {
        if (!name.trim() || price <= 0 || !categoryId) {
            throw new Error("Données du produit invalides.");
        }
        return {
            id: this.generateId(),
            name: name.trim(),
            price: parseFloat(price),
            categoryId: categoryId
        };
    },

    addToCart(cart, product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            return cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        }
        return [...cart, { ...product, quantity: 1 }];
    },

    calculateCartTotal(cart) {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    getProductsByCategory(products, categoryId) {
        return products.filter(p => p.categoryId === categoryId);
    }
};

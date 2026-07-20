const Business = {
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €';
  },

  createCategory(name, imageUrl = null) {
    if (!name || !name.trim()) throw new Error('Le nom de la catégorie est requis.');
    return {
      id: this.generateId(),
      name: name.trim(),
      imageUrl: imageUrl || 'https://via.placeholder.com/150'
    };
  },

  createProduct(name, price, categoryId, imageUrl = null) {
    if (!name || !name.trim()) throw new Error('Le nom du produit est requis.');
    if (isNaN(price) || price <= 0) throw new Error('Le prix doit être un nombre positif.');
    if (!categoryId) throw new Error('La catégorie est requise.');
    return {
      id: this.generateId(),
      name: name.trim(),
      price: parseFloat(price),
      categoryId,
      imageUrl: imageUrl || 'https://via.placeholder.com/150'
    };
  },

  validateCategoryUpdate(name, imageUrl) {
    if (!name || !name.trim()) throw new Error('Le nom de la catégorie est requis.');
    return { name: name.trim(), imageUrl: imageUrl || undefined };
  },

  validateProductUpdate(name, price, categoryId, imageUrl) {
    if (!name || !name.trim()) throw new Error('Le nom du produit est requis.');
    if (isNaN(price) || price <= 0) throw new Error('Le prix doit être un nombre positif.');
    if (!categoryId) throw new Error('La catégorie est requise.');
    return {
      name: name.trim(),
      price: parseFloat(price),
      categoryId,
      imageUrl: imageUrl || undefined
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
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  // ✅ FONCTION MANQUANTE AJOUTÉE
  getProductsByCategory(products, categoryId) {
    return products.filter(p => p.categoryId === categoryId);
  }
};
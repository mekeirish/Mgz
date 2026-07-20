const Business = {
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €';
  },

  createCategory(name, imageUrl = null) {
    if (!name || !name.trim()) throw new Error('Nom requis.');
    return {
      id: this.generateId(),
      name: name.trim(),
      imageUrl: imageUrl || 'https://via.placeholder.com/150'
    };
  },

  createProduct(name, price, categoryId, imageUrl = null) {
    if (!name || !name.trim()) throw new Error('Nom requis.');
    if (isNaN(price) || price <= 0) throw new Error('Prix invalide.');
    if (!categoryId) throw new Error('Catégorie requise.');
    return {
      id: this.generateId(),
      name: name.trim(),
      price: parseFloat(price),
      categoryId,
      imageUrl: imageUrl || 'https://via.placeholder.com/150'
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

  getProductsByCategory(products, categoryId) {
    return products.filter(p => p.categoryId === categoryId);
  },

  validateCategoryUpdate(name, imageUrl) {
    if (!name || !name.trim()) throw new Error('Nom requis.');
    return { name: name.trim(), imageUrl: imageUrl || undefined };
  },

  validateProductUpdate(name, price, categoryId, imageUrl) {
    if (!name || !name.trim()) throw new Error('Nom requis.');
    if (isNaN(price) || price <= 0) throw new Error('Prix invalide.');
    if (!categoryId) throw new Error('Catégorie requise.');
    return {
      name: name.trim(),
      price: parseFloat(price),
      categoryId,
      imageUrl: imageUrl || undefined
    };
  }
};
const Business = {
  // ... (tout le code existant)

  getProductsByCategory(products, categoryId) {
    return products.filter(p => p.categoryId === categoryId);
  },

  // ... (le reste)
};
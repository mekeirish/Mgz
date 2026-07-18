// Responsable UNIQUEMENT des accès aux données.
// Mock en mémoire pour test – remplacer par Firestore plus tard.
const DB = {
  _categories: [
    { id: 'c1', name: 'Vêtements', imageUrl: 'https://via.placeholder.com/150' },
    { id: 'c2', name: 'Électronique', imageUrl: 'https://via.placeholder.com/150' }
  ],
  _products: [
    { id: 'p1', categoryId: 'c1', name: 'T-shirt Minimaliste', price: 25, imageUrl: 'https://via.placeholder.com/150' },
    { id: 'p2', categoryId: 'c2', name: 'Écouteurs sans fil', price: 89, imageUrl: 'https://via.placeholder.com/150' }
  ],

  // --- Lecture ---
  async getCategories() {
    return [...this._categories];
  },
  async getProducts() {
    return [...this._products];
  },
  async getCategoryById(id) {
    return this._categories.find(c => c.id === id);
  },
  async getProductById(id) {
    return this._products.find(p => p.id === id);
  },

  // --- Création ---
  async addCategory(category) {
    this._categories.push(category);
    return category;
  },
  async addProduct(product) {
    this._products.push(product);
    return product;
  },

  // --- Mise à jour ---
  async updateCategory(id, data) {
    const index = this._categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Catégorie introuvable');
    this._categories[index] = { ...this._categories[index], ...data };
    return this._categories[index];
  },
  async updateProduct(id, data) {
    const index = this._products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Produit introuvable');
    this._products[index] = { ...this._products[index], ...data };
    return this._products[index];
  }
};
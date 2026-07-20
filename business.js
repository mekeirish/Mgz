const Business = {
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },
  formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €';
  },
  // ... (autres fonctions inchangées)

  // Nouvelle fonction
  createOrder(cart, clientName = 'Client') {
    if (!cart || cart.length === 0) throw new Error('Panier vide.');
    const total = this.calculateCartTotal(cart);
    const order = {
      id: this.generateId(),
      items: cart.map(item => ({ ...item })),
      total,
      clientName,
      status: 'en attente',
      createdAt: new Date().toISOString()
    };
    return order;
  }
};
// Responsable UNIQUEMENT des accès aux données.
// Note: Utilisation d'un mock en mémoire pour que tu puisses tester le design instantanément
// sans erreur de configuration Firebase. Remplace par les vrais appels Firestore ensuite.

const DB = {
    _categories: [
        { id: 'c1', name: 'Vêtements' },
        { id: 'c2', name: 'Électronique' }
    ],
    _products: [
        { id: 'p1', categoryId: 'c1', name: 'T-shirt Minimaliste', price: 25 },
        { id: 'p2', categoryId: 'c2', name: 'Écouteurs sans fil', price: 89 }
    ],

    async getCategories() {
        // Logique Firestore : getDocs(collection(db, 'categories'))
        return [...this._categories];
    },

    async getProducts() {
        // Logique Firestore : getDocs(collection(db, 'products'))
        return [...this._products];
    },

    async addCategory(category) {
        // Logique Firestore : addDoc(collection(db, 'categories'), category)
        this._categories.push(category);
        return category;
    },

    async addProduct(product) {
        // Logique Firestore : addDoc(collection(db, 'products'), product)
        this._products.push(product);
        return product;
    }
};

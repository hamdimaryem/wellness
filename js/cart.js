/**
 * Cart — panier d'achat stocké en mémoire (reset à chaque déconnexion)
 */
class Cart {
  constructor() {
    this.items = [];   // [{ produit, quantite }]
    this._listeners = [];
  }

  onChange(fn) { this._listeners.push(fn); }
  _notify()    { this._listeners.forEach(fn => fn(this.items)); }

  add(produit, quantite = 1) {
    const existing = this.items.find(i => i.produit.id == produit.id);
    if (existing) {
      existing.quantite = Math.min(existing.quantite + quantite, produit.quantite);
    } else {
      this.items.push({ produit, quantite });
    }
    this._notify();
  }

  remove(produitId) {
    this.items = this.items.filter(i => i.produit.id != produitId);
    this._notify();
  }

  updateQty(produitId, quantite) {
    const item = this.items.find(i => i.produit.id == produitId);
    if (item) {
      if (quantite <= 0) this.remove(produitId);
      else item.quantite = Math.min(quantite, item.produit.quantite);
      this._notify();
    }
  }

  clear() {
    this.items = [];
    this._notify();
  }

  total() {
    return this.items.reduce((s, i) => s + parseFloat(i.produit.prix) * i.quantite, 0);
  }

  count() {
    return this.items.reduce((s, i) => s + i.quantite, 0);
  }

  toOrderItems() {
    return this.items.map(i => ({ id_produit: i.produit.id, quantite: i.quantite }));
  }
}

// Instance globale
const Panier = new Cart();

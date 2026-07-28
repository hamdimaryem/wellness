/**
 * WellnessAPI — couche de communication avec le backend PHP
 * Toutes les méthodes retournent des Promises JSON.
 */
class WellnessAPI {
  static BASE = 'php/';

  static async _req(endpoint, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.BASE + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  }

  // Auth
  static login(email, pwd)      { return this._req('auth.php?action=login',    'POST', { email, mot_de_passe: pwd }); }
  static register(payload)      { return this._req('auth.php?action=register', 'POST', payload); }
  static logout()               { return this._req('auth.php?action=logout'); }
  static me()                   { return this._req('auth.php?action=me'); }

  // Coachings
  static getCoachings(params='')   { return this._req(`coachings.php${params}`); }
  static getCoaching(id)           { return this._req(`coachings.php?id=${id}`); }
  static createCoaching(data)      { return this._req('coachings.php', 'POST', data); }
  static updateCoaching(id, data)  { return this._req(`coachings.php?id=${id}`, 'PUT', data); }
  static deleteCoaching(id)        { return this._req(`coachings.php?id=${id}`, 'DELETE'); }

  // Produits
  static getProduits(params='')    { return this._req(`produits.php${params}`); }
  static getProduit(id)            { return this._req(`produits.php?id=${id}`); }
  static createProduit(data)       { return this._req('produits.php', 'POST', data); }
  static updateProduit(id, data)   { return this._req(`produits.php?id=${id}`, 'PUT', data); }
  static deleteProduit(id)         { return this._req(`produits.php?id=${id}`, 'DELETE'); }

  // Réservations
  static getReservations()           { return this._req('reservations.php'); }
  static createReservation(data)     { return this._req('reservations.php', 'POST', data); }
  static updateReservation(id, data) { return this._req(`reservations.php?id=${id}`, 'PUT', data); }
  static cancelReservation(id)       { return this._req(`reservations.php?id=${id}`, 'DELETE'); }

  // Commandes
  static getCommandes()           { return this._req('commandes.php'); }
  static passerCommande(items)    { return this._req('commandes.php', 'POST', { items }); }
  static updateCommande(id, data) { return this._req(`commandes.php?id=${id}`, 'PUT', data); }

  // Utilisateurs (admin)
  static getUtilisateurs()          { return this._req('utilisateurs.php'); }
  static updateUtilisateur(id, data){ return this._req(`utilisateurs.php?id=${id}`, 'PUT', data); }
  static deleteUtilisateur(id)      { return this._req(`utilisateurs.php?id=${id}`, 'DELETE'); }
}

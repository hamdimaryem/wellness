/**
 * AuthManager — gestion de la session utilisateur côté client
 */
class AuthManager {
  constructor() {
    this.user = null;
    this._listeners = [];
  }

  /** Abonner un callback aux changements d'état */
  onChange(fn) { this._listeners.push(fn); }

  _notify() { this._listeners.forEach(fn => fn(this.user)); }

  /** Charger la session depuis le serveur au démarrage */
  async init() {
    try {
      const data = await WellnessAPI.me();
      this.user = data.authenticated ? data.user : null;
    } catch {
      this.user = null;
    }
    this._notify();
  }

  async login(email, pwd) {
    const data = await WellnessAPI.login(email, pwd);
    this.user = data.user;
    this._notify();
    return this.user;
  }

  async register(payload) {
    const data = await WellnessAPI.register(payload);
    this.user = data.user;
    this._notify();
    return this.user;
  }

  async logout() {
    await WellnessAPI.logout();
    this.user = null;
    this._notify();
  }

  isLoggedIn()  { return !!this.user; }
  isAdmin()     { return this.user?.role === 'admin'; }
  isClient()    { return this.user?.role === 'client'; }
  fullName()    { return this.user ? `${this.user.prenom} ${this.user.nom}` : ''; }
}

// Instance globale
const Auth = new AuthManager();

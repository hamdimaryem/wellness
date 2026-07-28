/**
 * Router — gestion des pages SPA (Single Page Application)
 */
class Router {
  constructor() {
    this.pages      = {};   // id -> HTMLElement
    this.current    = null;
    this._history   = [];
    this._guards    = {};   // id -> fn(user) -> bool
  }

  /** Enregistrer une page par son id */
  register(id, el) { this.pages[id] = el; }

  /** Ajouter un garde d'accès: fn(user) retourne true si accès autorisé */
  guard(pageId, fn) { this._guards[pageId] = fn; }

  /** Naviguer vers une page */
  go(id, options = {}) {
    const guard = this._guards[id];
    if (guard && !guard(Auth.user)) {
      // Rediriger vers login si pas connecté, vers accueil si pas autorisé
      const target = Auth.isLoggedIn() ? 'home' : 'auth';
      this.go(target);
      if (!Auth.isLoggedIn()) Toast.show('Veuillez vous connecter.', 'warn');
      return;
    }

    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const page = this.pages[id] || document.getElementById('page-' + id);
    if (page) {
      page.classList.add('active');
      this.current = id;
      if (!options.noHistory) this._history.push(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Déclencher un événement personnalisé pour init des données
      document.dispatchEvent(new CustomEvent('pageChange', { detail: { id } }));
    }
  }

  back() {
    if (this._history.length > 1) {
      this._history.pop();
      this.go(this._history[this._history.length - 1], { noHistory: true });
    }
  }
}

/**
 * Toast — notifications légères
 */
class Toast {
  static _container = null;

  static _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.id = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  }

  static show(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    this._getContainer().appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 400);
    }, 3500);
  }
}

// Instance globale
const AppRouter = new Router();

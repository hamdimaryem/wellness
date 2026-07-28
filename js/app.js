/**
 * WellnessApp — contrôleur principal de l'application
 */
class WellnessApp {
  constructor() {
    this.coachingsList = [];
    this.produitsList  = [];
    this.reservations  = [];
    this.commandes     = [];
    this.utilisateurs  = [];
    this.selectedCoaching = null;
  }

  async init() {
    await Auth.init();
    Auth.onChange(user => this._onAuthChange(user));
    Panier.onChange(items => this._onCartChange(items));

    AppRouter.guard('account',     u => !!u);
    AppRouter.guard('cart',        u => !!u);
    AppRouter.guard('checkout',    u => !!u);
    AppRouter.guard('reservation', u => !!u);
    AppRouter.guard('admin',       u => u?.role === 'admin');

    await this._loadCoachings();
    await this._loadProduits();

    document.addEventListener('pageChange', e => this._onPageChange(e.detail.id));
    AppRouter.go('home');
    this._bindNavEvents();
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  _onAuthChange(user) {
    this._updateNav(user);
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.display = user?.role === 'admin' ? '' : 'none';
    });
    document.querySelectorAll('[data-role="client"]').forEach(el => {
      el.style.display = user?.role === 'client' ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="true"]').forEach(el => {
      el.style.display = user ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="false"]').forEach(el => {
      el.style.display = user ? 'none' : '';
    });
  }

  _updateNav(user) {
    // Cibler TOUS les éléments de nav (une nav est injectée par page via data-nav)
    document.querySelectorAll('#navBtnLogin').forEach(el  => el.style.display = user ? 'none' : '');
    document.querySelectorAll('#navBtnLogout').forEach(el => el.style.display = user ? '' : 'none');
    document.querySelectorAll('#navUserName').forEach(el  => el.textContent   = user ? `${user.prenom} ${user.nom}` : '');
    document.querySelectorAll('.cart-pill').forEach(el    => el.style.display = user ? '' : 'none');
  }

  async handleLogout() {
    try {
      await Auth.logout();
      Panier.clear();
      AppRouter.go('goodbye');
      Toast.show('Vous avez été déconnecté(e). À bientôt !', 'info');
    } catch (e) {
      Toast.show('Erreur lors de la déconnexion', 'error');
    }
  }

  async handleLogin(email, pwd) {
    try {
      const user = await Auth.login(email, pwd);
      Toast.show(`Bienvenue, ${user.prenom} !`);
      AppRouter.go(user.role === 'admin' ? 'admin' : 'account');
    } catch (e) {
      Toast.show(e.message, 'error');
    }
  }

  async handleRegister(payload) {
    try {
      const user = await Auth.register(payload);
      Toast.show(`Compte créé ! Bienvenue, ${user.prenom} !`);
      AppRouter.go('account');
    } catch (e) {
      Toast.show(e.message, 'error');
    }
  }

  // ─── Données publiques ──────────────────────────────────────────────────
  async _loadCoachings(params = '') {
    try {
      this.coachingsList = await WellnessAPI.getCoachings(params);
      this._renderCoachings();
    } catch (e) {
      console.error('Coachings:', e);
    }
  }

  async _loadProduits(params = '') {
    try {
      this.produitsList = await WellnessAPI.getProduits(params);
      this._renderProduits();
    } catch (e) {
      console.error('Produits:', e);
    }
  }

  _renderCoachings() {
    const grid     = document.getElementById('coachingGrid');
    const homeGrid = document.getElementById('homeCoachings');
    if (grid)     grid.innerHTML     = this.coachingsList.map(c => CoachingCard.render(c)).join('');
    if (homeGrid) homeGrid.innerHTML = this.coachingsList.slice(0, 3).map(c => CoachingCard.render(c)).join('');
  }

  _renderProduits() {
    const grid     = document.getElementById('productGrid');
    const homeGrid = document.getElementById('homeProducts');
    if (grid)     grid.innerHTML     = this.produitsList.map(p => ProduitCard.render(p)).join('');
    if (homeGrid) homeGrid.innerHTML = this.produitsList.slice(0, 4).map(p => ProduitCard.render(p)).join('');
  }

  // ─── Réservation ────────────────────────────────────────────────────────
  openReservation(coachingId) {
    if (!Auth.isLoggedIn()) { AppRouter.go('auth'); Toast.show('Connectez-vous pour réserver.', 'warn'); return; }
    this.selectedCoaching = this.coachingsList.find(c => c.id == coachingId);
    this._fillReservationPage();
    AppRouter.go('reservation');
  }

  _fillReservationPage() {
    const c = this.selectedCoaching;
    if (!c) return;
    const el = id => document.getElementById(id);
    if (el('resCoachingTitle'))   el('resCoachingTitle').textContent  = c.titre;
    if (el('resCoachingTitle2'))  el('resCoachingTitle2').textContent = c.titre;
    if (el('resCoachingCoach'))   el('resCoachingCoach').textContent  = `Coach ${c.coach}`;
    if (el('resCoachingPrice'))   el('resCoachingPrice').textContent  = `${c.prix} DT`;
    if (el('resCoachingImg'))     el('resCoachingImg').src            = c.image || 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800';
    if (el('resTotal'))           el('resTotal').textContent          = `${c.prix} DT`;
    if (el('resCoachingIdInput')) el('resCoachingIdInput').value      = c.id;

    // Afficher la date et l'heure fixées par l'admin (non modifiables)
    const resInfoBox = el('resDateTimeInfo');
    if (resInfoBox) {
      if (c.date_coaching && c.heure_coaching) {
        const dateStr = new Date(c.date_coaching).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        resInfoBox.innerHTML = `
          <div style="background:var(--rose-pale);border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap;">
            <span><i class="fa-solid fa-calendar" style="color:var(--rose);margin-right:6px;"></i><strong>Date :</strong> ${dateStr}</span>
            <span><i class="fa-solid fa-clock" style="color:var(--rose);margin-right:6px;"></i><strong>Heure :</strong> ${c.heure_coaching}</span>
          </div>`;
      } else {
        resInfoBox.innerHTML = `<div style="background:#fff3cd;border-radius:10px;padding:12px 16px;margin-bottom:16px;color:#856404;"><i class="fa-solid fa-circle-exclamation" style="margin-right:6px;"></i>La date de cette séance n'a pas encore été fixée par l'administrateur.</div>`;
      }
    }
  }

  async submitReservation() {
    const c = this.selectedCoaching;
    if (!c) { Toast.show('Aucun coaching sélectionné', 'error'); return; }
    const payload = {
      id_coaching:  document.getElementById('resCoachingIdInput')?.value,
      montant_paye: c.prix || 0,
    };
    try {
      await WellnessAPI.createReservation(payload);
      Toast.show('Réservation envoyée ! Vous recevrez une confirmation.');
      AppRouter.go('account');
    } catch (e) {
      Toast.show(e.message, 'error');
    }
  }

  // ─── Panier ──────────────────────────────────────────────────────────────
  _onCartChange(items) {
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = Panier.count();
    this._renderCart();
  }

  addToCart(produitId) {
    if (!Auth.isLoggedIn()) { AppRouter.go('auth'); Toast.show('Connectez-vous pour commander.', 'warn'); return; }
    const prod = this.produitsList.find(p => p.id == produitId);
    if (!prod) return;
    if (prod.quantite === 0) { Toast.show('Ce produit est épuisé.', 'warn'); return; }
    // Vérifier que la quantité en panier ne dépasse pas le stock
    const inCart = Panier.items.find(i => i.produit.id == produitId)?.quantite || 0;
    if (inCart >= prod.quantite) { Toast.show(`Stock maximum atteint (${prod.quantite}).`, 'warn'); return; }
    Panier.add(prod);
    Toast.show(`${prod.nom} ajouté au panier !`);
    // Rafraîchir la card immédiatement pour refléter la quantité restante réelle
    this._refreshProduitCard(prod);
  }

  _refreshProduitCard(prod) {
    // Calculer quantité restante (stock - ce qui est déjà dans le panier)
    const inCart = Panier.items.find(i => i.produit.id == prod.id)?.quantite || 0;
    const available = Math.max(0, prod.quantite - inCart);
    const fakeP = { ...prod, quantite: available };
    // Mettre à jour toutes les cards de ce produit dans la page
    document.querySelectorAll('[id="produit-card-' + prod.id + '"]').forEach(card => {
      card.outerHTML = ProduitCard.render(fakeP);
    });
  }

  _renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl   = document.getElementById('cartTotal');
    const subEl     = document.getElementById('cartSubtotal');
    if (!container) return;

    if (Panier.items.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);padding:20px 0;text-align:center;"><i class="fa-solid fa-cart-shopping" style="font-size:40px;color:var(--rose-pale);display:block;margin-bottom:12px;"></i>Votre panier est vide.</p>';
    } else {
      container.innerHTML = Panier.items.map(item => {
        const id   = item.produit.id;
        const prix = parseFloat(item.produit.prix) || 0;
        const qty  = item.quantite;
        const img  = item.produit.image || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&q=80';
        return '<div class="cart-line">'
          + '<img src="' + img + '" alt="' + item.produit.nom + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px">'
          + '<div class="cart-line-info"><strong>' + item.produit.nom + '</strong><span>' + prix.toFixed(2) + ' DT / unité</span></div>'
          + '<div class="cart-line-qty">'
          + '<button class="qty-btn" onclick="App.cartQty(' + id + ',' + (qty-1) + ')">−</button>'
          + '<span>' + qty + '</span>'
          + '<button class="qty-btn" onclick="App.cartQty(' + id + ',' + (qty+1) + ')">+</button>'
          + '</div>'
          + '<strong>' + (prix * qty).toFixed(2) + ' DT</strong>'
          + '<button class="btn btn-danger btn-sm" onclick="App.removeFromCart(' + id + ')">✕</button>'
          + '</div>';
      }).join('');
    }
    if (subEl)   subEl.textContent   = Panier.total().toFixed(2) + ' DT';
    if (totalEl) totalEl.textContent = (Panier.total() + 7).toFixed(2) + ' DT';
  }
  cartQty(id, qty)   { Panier.updateQty(id, qty); }
  removeFromCart(id) { Panier.remove(id); }

  async checkout() {
    if (!Auth.isLoggedIn()) { AppRouter.go('auth'); return; }
    if (Panier.items.length === 0) { Toast.show('Panier vide', 'warn'); return; }
    try {
      await WellnessAPI.passerCommande(Panier.toOrderItems());
      Panier.clear();
      Toast.show('Commande confirmée ! Merci pour votre achat.');
      AppRouter.go('account');
      await this._loadProduits(); // Rafraîchir le stock
    } catch (e) {
      Toast.show(e.message, 'error');
    }
  }

  // ─── Compte client ──────────────────────────────────────────────────────
  async loadAccountPage() {
    if (!Auth.isLoggedIn()) return;
    const nameEl  = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    const av      = document.getElementById('accountAvatar');
    if (nameEl)  nameEl.textContent  = Auth.fullName();
    if (emailEl) emailEl.textContent = Auth.user.email;
    if (av && Auth.user) av.textContent = (Auth.user.prenom?.[0] || '') + (Auth.user.nom?.[0] || '');

    try {
      const [res, cmd] = await Promise.all([WellnessAPI.getReservations(), WellnessAPI.getCommandes()]);
      this._renderAccountHistory(res, cmd);
    } catch (e) { /* non connecté */ }
  }

  _renderAccountHistory(reservations, commandes) {
    const el = document.getElementById('accountHistory');
    if (!el) return;
    const rows = [
      ...reservations.map(r => ({ label: r.coaching_titre, statut: r.statut, type: 'Réservation', date: r.date_seance })),
      ...commandes.map(c => ({ label: c.produit_nom, statut: c.statut, type: 'Commande', date: c.date_commande })),
    ];
    if (rows.length === 0) { el.innerHTML = '<p style="color:var(--muted)">Aucun historique.</p>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="line">
        <span>
          <small style="color:var(--muted)">${r.type}</small><br>
          <strong>${r.label}</strong>
          ${r.date && r.date !== '0000-00-00 00:00:00' ? `<br><small style="color:var(--muted)">${new Date(r.date).toLocaleDateString('fr-FR')}</small>` : ''}
        </span>
        <span class="badge ${this._statutClass(r.statut)}">${r.statut}</span>
      </div>
    `).join('');
  }

  _statutClass(s) {
    if (s === 'Confirmee' || s === 'Livree')       return 'success';
    if (s === 'En attente' || s === 'En cours')    return 'warn';
    if (s === 'Annulee')                           return 'danger';
    return '';
  }

  // ─── Admin ───────────────────────────────────────────────────────────────
  async loadAdminPage(section = 'dashboard') {
    if (!Auth.isAdmin()) return;
    const [res, cmd, usr] = await Promise.all([
      WellnessAPI.getReservations(),
      WellnessAPI.getCommandes(),
      WellnessAPI.getUtilisateurs(),
    ]);
    this.reservations  = res;
    this.commandes     = cmd;
    this.utilisateurs  = usr;
    AdminUI.render(section, {
      coachings: this.coachingsList,
      produits:  this.produitsList,
      reservations: res,
      commandes: cmd,
      utilisateurs: usr,
    });
  }

  // ─── Events page ────────────────────────────────────────────────────────
  _onPageChange(id) {
    if (id === 'account') this.loadAccountPage();
    if (id === 'admin')   this.loadAdminPage();
    if (id === 'cart')    this._renderCart();
  }

  _bindNavEvents() {
    document.getElementById('navBtnLogout')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('loginFormBtn')?.addEventListener('click', () => {
      const email = document.getElementById('loginEmail')?.value;
      const pwd   = document.getElementById('loginPwd')?.value;
      this.handleLogin(email, pwd);
    });
    document.getElementById('signupFormBtn')?.addEventListener('click', () => {
      const payload = {
        prenom:       document.getElementById('regPrenom')?.value,
        nom:          document.getElementById('regNom')?.value,
        email:        document.getElementById('regEmail')?.value,
        telephone:    document.getElementById('regTel')?.value,
        mot_de_passe: document.getElementById('regPwd')?.value,
      };
      this.handleRegister(payload);
    });
    document.getElementById('resSubmitBtn')?.addEventListener('click', () => this.submitReservation());
    document.getElementById('checkoutBtn')?.addEventListener('click', () => this.checkout());
  }
}

// ─── Card renderers ──────────────────────────────────────────────────────────
class CoachingCard {
  static render(c) {
    const img    = c.image || 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80';
    const places = parseInt(c.nb_places) || 0;
    const ok     = places > 0;
    const btnDis = ok ? '' : 'disabled style="opacity:.55;cursor:not-allowed"';

    let placeBadge;
    if (!ok) {
      placeBadge = '<span class="badge danger"><i class="fa-solid fa-ban" style="margin-right:3px;"></i>Complet</span>';
    } else if (places <= 3) {
      placeBadge = '<span class="badge warn"><i class="fa-solid fa-users" style="margin-right:3px;"></i>' + places + ' place' + (places > 1 ? 's' : '') + ' restante' + (places > 1 ? 's' : '') + '</span>';
    } else {
      placeBadge = '<span class="badge success"><i class="fa-solid fa-users" style="margin-right:3px;"></i>' + places + ' places disponibles</span>';
    }

    const dateInfo = (c.date_coaching && c.heure_coaching)
      ? '<div style="font-size:12px;color:var(--muted);margin-top:6px;"><i class="fa-solid fa-calendar" style="margin-right:4px;color:var(--rose);"></i>' + new Date(c.date_coaching).toLocaleDateString('fr-FR') + ' <i class="fa-solid fa-clock" style="margin:0 4px;color:var(--rose);"></i>' + c.heure_coaching + '</div>'
      : '<div style="font-size:12px;color:var(--muted);margin-top:6px;"><i class="fa-solid fa-clock" style="margin-right:4px;"></i>Date à confirmer</div>';

    return (
      '<article class="card" id="coaching-card-' + c.id + '">' +
        '<img src="' + img + '" alt="' + c.titre + '" loading="lazy">' +
        '<div class="card-body">' +
          '<span class="badge">' + c.categorie + '</span>' +
          '<h3 style="margin-top:10px">' + c.titre + '</h3>' +
          '<p style="color:var(--muted);font-size:13px;">Coach ' + c.coach + '</p>' +
          '<div class="meta" style="margin-top:8px;gap:8px;flex-wrap:wrap;">' +
            '<span class="badge" style="background:var(--rose-pale);color:var(--rose-dark);">' + c.type + '</span>' +
            placeBadge +
          '</div>' +
          dateInfo +
          '<div class="card-actions" style="margin-top:14px;">' +
            '<span class="price">' + c.prix + ' DT</span>' +
            '<button class="btn btn-primary btn-sm" ' + btnDis + ' onclick="App.openReservation(' + c.id + ')">' +
              '<i class="fa-solid fa-calendar-check" style="margin-right:4px;"></i>Réserver' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }
}
class ProduitCard {
  static render(p) {
    const img = p.image || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80';
    const qty = parseInt(p.quantite) || 0;

    let badge;
    if (qty === 0) {
      badge = '<span class="badge danger"><i class="fa-solid fa-circle-xmark" style="margin-right:3px;"></i>Épuisé</span>';
    } else if (qty <= 3) {
      badge = '<span class="badge warn"><i class="fa-solid fa-triangle-exclamation" style="margin-right:3px;"></i>Plus que ' + qty + ' en stock</span>';
    } else if (qty <= 10) {
      badge = '<span class="badge success"><i class="fa-solid fa-box" style="margin-right:3px;"></i>' + qty + ' en stock</span>';
    } else {
      badge = '<span class="badge success"><i class="fa-solid fa-check" style="margin-right:3px;"></i>En stock (' + qty + ')</span>';
    }

    const dis = qty === 0 ? 'disabled style="opacity:.55;cursor:not-allowed"' : '';
    return (
      '<article class="card" id="produit-card-' + p.id + '">' +
        '<img src="' + img + '" alt="' + p.nom + '" loading="lazy">' +
        '<div class="card-body">' +
          '<span class="badge">' + p.categorie + '</span>' +
          '<h3 style="margin-top:10px">' + p.nom + '</h3>' +
          '<div class="meta" style="margin-top:8px;">' + badge + '</div>' +
          '<div class="card-actions" style="margin-top:14px;">' +
            '<span class="price">' + p.prix + ' DT</span>' +
            '<button class="btn btn-primary btn-sm" ' + dis + ' onclick="App.addToCart(' + p.id + ')">' +
              '<i class="fa-solid fa-cart-plus" style="margin-right:4px;"></i>Ajouter' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }
}

// ─── Admin UI helper ─────────────────────────────────────────────────────────
class AdminUI {
  static render(section = 'dashboard', data) {
    const main = document.getElementById('adminMain');
    if (!main) return;

    const { coachings, produits, reservations, commandes, utilisateurs } = data;
    const stats = {
      clients:      utilisateurs.filter(u => u.role === 'client').length,
      revenus:      commandes.reduce((t, c) => t + parseFloat(c.total || 0), 0).toFixed(0),
      reservations: reservations.filter(r => r.statut !== 'Annulee').length,
      commandes:    commandes.filter(c => c.statut === 'En cours').length,
    };

    this._setActiveSection(section);
    main.innerHTML = this._layout(section, stats, data);

    if (section === 'dashboard') {
      this._renderReservationsTable(reservations.slice(0, 5), 'adminRecentResBody');
      this._renderCommandesTable(commandes.slice(0, 5), 'adminRecentCmdBody');
      return;
    }
    if (section === 'coachings')    this._renderCoachingsTable(coachings);
    if (section === 'produits')     this._renderProduitsTable(produits);
    if (section === 'reservations') this._renderReservationsTable(reservations);
    if (section === 'commandes')    this._renderCommandesTable(commandes);
    if (section === 'utilisateurs') this._renderUsersTable(utilisateurs);
  }

  static _setActiveSection(section) {
    document.querySelectorAll('.admin-side button').forEach(btn => {
      const isActive = btn.getAttribute('onclick')?.includes(`'${section}'`);
      btn.classList.toggle('active', !!isActive);
    });
  }

  static _layout(section, stats, data) {
    const titles = {
      dashboard:    ['Tableau de bord',  'Vue globale de l\'activité du centre'],
      coachings:    ['Coachings',         'Gestion des cours et séances'],
      produits:     ['Produits',          'Gestion du catalogue boutique'],
      reservations: ['Réservations',      'Suivi des demandes clients'],
      commandes:    ['Commandes',         'Suivi des achats et livraisons'],
      utilisateurs: ['Utilisateurs',      'Gestion des comptes clients'],
    };
    const [title, subtitle] = titles[section] || titles.dashboard;

    const header = `
      <div class="admin-topbar">
        <div>
          <span class="eyebrow">Administration</span>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <button class="btn btn-light btn-sm" onclick="AppRouter.go('home')"><i class="fa-solid fa-arrow-left"></i> Retour au site</button>
      </div>`;

    if (section === 'dashboard') {
      return `${header}
        <div class="admin-stats">
          ${this._statCard('fa-users', stats.clients, 'Clients', 'Comptes actifs')}
          ${this._statCard('fa-sack-dollar', stats.revenus + ' DT', 'Revenus', 'Commandes enregistrées')}
          ${this._statCard('fa-calendar-check', stats.reservations, 'Réservations', 'Toutes demandes')}
          ${this._statCard('fa-box', stats.commandes, 'Commandes', 'En cours')}
        </div>
        <div class="admin-grid">
          <section class="admin-panel">
            <div class="table-head"><h3>Réservations récentes</h3><button class="btn btn-light btn-sm" onclick="App.loadAdminPage('reservations')">Voir tout</button></div>
            ${this._table(['Client', 'Coaching', 'Créneau', 'Statut', 'Actions'], 'adminRecentResBody')}
          </section>
          <section class="admin-panel">
            <div class="table-head"><h3>Commandes récentes</h3><button class="btn btn-light btn-sm" onclick="App.loadAdminPage('commandes')">Voir tout</button></div>
            ${this._table(['Client', 'Produit', 'Qté', 'Total', 'Statut', 'Actions'], 'adminRecentCmdBody')}
          </section>
        </div>`;
    }
    if (section === 'coachings') {
      return `${header}<section class="admin-panel"><div class="table-head"><h3>${data.coachings.length} coachings</h3><button class="btn btn-primary btn-sm" onclick="openModal('coaching', null)"><i class="fa-solid fa-plus"></i> Ajouter</button></div>${this._table(['Titre', 'Coach', 'Type', 'Places', 'Date/Heure', 'Prix', 'Actions'], 'adminCoachBody')}</section>`;
    }
    if (section === 'produits') {
      return `${header}<section class="admin-panel"><div class="table-head"><h3>${data.produits.length} produits</h3><button class="btn btn-primary btn-sm" onclick="openModal('produit', null)"><i class="fa-solid fa-plus"></i> Ajouter</button></div>${this._table(['Nom', 'Catégorie', 'Quantité', 'Prix', 'Actions'], 'adminProdBody')}</section>`;
    }
    if (section === 'reservations') {
      return `${header}<section class="admin-panel"><div class="table-head"><h3>${data.reservations.length} réservations</h3></div>${this._table(['Client', 'Coaching', 'Créneau', 'Statut', 'Actions'], 'adminResBody')}</section>`;
    }
    if (section === 'commandes') {
      return `${header}<section class="admin-panel"><div class="table-head"><h3>${data.commandes.length} commandes</h3></div>${this._table(['Client', 'Produit', 'Qté', 'Total', 'Statut', 'Actions'], 'adminCmdBody')}</section>`;
    }
    return `${header}<section class="admin-panel"><div class="table-head"><h3>${data.utilisateurs.length} utilisateurs</h3></div>${this._table(['Nom', 'Email', 'Rôle', 'Statut', 'Actions'], 'adminUsrBody')}</section>`;
  }

  static _statCard(icon, value, label, note) {
    return `<article class="admin-stat-card"><div class="admin-stat-icon"><i class="fa-solid ${icon}"></i></div><div><strong>${value}</strong><span>${label}</span><small>${note}</small></div></article>`;
  }

  static _table(headers, bodyId) {
    return `<div class="admin-table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody id="${bodyId}"></tbody></table></div>`;
  }

  static _emptyRow(tbody, colspan, message) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="admin-empty">${message}</td></tr>`;
  }

  static _renderReservationsTable(reservations, bodyId = 'adminResBody') {
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;
    if (!reservations.length) return this._emptyRow(tbody, 5, 'Aucune réservation.');
    tbody.innerHTML = reservations.map(r => `
      <tr>
        <td><strong>${r.prenom ?? ''} ${r.nom ?? ''}</strong><small>${r.email ?? ''}</small></td>
        <td>${r.coaching_titre}</td>
        <td>${r.creneau && r.creneau !== '0000-00-00 00:00:00' ? r.creneau : '—'}</td>
        <td><span class="badge ${r.statut === 'Confirmee' ? 'success' : r.statut === 'Annulee' ? 'danger' : 'warn'}">${r.statut}</span></td>
        <td class="admin-actions">
          ${r.statut !== 'Confirmee' && r.statut !== 'Annulee' ? `<button class="btn btn-primary btn-sm" onclick="App.adminConfirmRes(${r.id})">Confirmer</button>` : ''}
          ${r.statut !== 'Annulee' ? `<button class="btn btn-danger btn-sm" onclick="App.adminCancelRes(${r.id})">Annuler</button>` : ''}
        </td>
      </tr>`).join('');
  }

  static _renderCommandesTable(commandes, bodyId = 'adminCmdBody') {
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;
    if (!commandes.length) return this._emptyRow(tbody, 6, 'Aucune commande.');
    tbody.innerHTML = commandes.map(c => `
      <tr>
        <td><strong>${c.prenom ?? ''} ${c.nom ?? ''}</strong></td>
        <td>${c.produit_nom}</td>
        <td>${c.quantite_commandee}</td>
        <td>${c.total} DT</td>
        <td><span class="badge ${c.statut === 'Livree' ? 'success' : c.statut === 'Annulee' ? 'danger' : 'warn'}">${c.statut}</span></td>
        <td class="admin-actions">${c.statut === 'En cours' ? `<button class="btn btn-primary btn-sm" onclick="App.adminLivreCmd(${c.id})">Livrée</button>` : ''}</td>
      </tr>`).join('');
  }

  static _renderCoachingsTable(coachings) {
    const tbody = document.getElementById('adminCoachBody');
    if (!tbody) return;
    if (!coachings.length) return this._emptyRow(tbody, 7, 'Aucun coaching.');
    tbody.innerHTML = coachings.map(c => {
      const dateHeure = (c.date_coaching && c.heure_coaching)
        ? `${new Date(c.date_coaching).toLocaleDateString('fr-FR')} ${c.heure_coaching}`
        : '<span style="color:#aaa">Non fixée</span>';
      return `
        <tr>
          <td><strong>${c.titre}</strong><small>${c.categorie}</small></td>
          <td>${c.coach}</td>
          <td>${c.type}</td>
          <td>${c.nb_places}</td>
          <td>${dateHeure}</td>
          <td>${c.prix} DT</td>
          <td class="admin-actions">
            <button class="btn btn-light btn-sm" onclick="App.openAdminModal('coaching', ${c.id})">Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="App.deleteCoaching(${c.id})">Supprimer</button>
          </td>
        </tr>`;
    }).join('');
  }

  static _renderProduitsTable(produits) {
    const tbody = document.getElementById('adminProdBody');
    if (!tbody) return;
    if (!produits.length) return this._emptyRow(tbody, 5, 'Aucun produit.');
    tbody.innerHTML = produits.map(p => `
      <tr>
        <td><strong>${p.nom}</strong><small>${p.description ?? ''}</small></td>
        <td>${p.categorie}</td>
        <td><span class="badge ${p.quantite === 0 ? 'danger' : p.quantite <= 3 ? 'warn' : 'success'}">${p.quantite}</span></td>
        <td>${p.prix} DT</td>
        <td class="admin-actions">
          <button class="btn btn-light btn-sm" onclick="App.openAdminModal('produit', ${p.id})">Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteProduit(${p.id})">Supprimer</button>
        </td>
      </tr>`).join('');
  }

  static _renderUsersTable(utilisateurs) {
    const tbody = document.getElementById('adminUsrBody');
    if (!tbody) return;
    if (!utilisateurs.length) return this._emptyRow(tbody, 5, 'Aucun utilisateur.');
    tbody.innerHTML = utilisateurs.map(u => `
      <tr>
        <td><strong>${u.prenom} ${u.nom}</strong><small>${u.telephone ?? ''}</small></td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? '' : 'success'}">${u.role}</span></td>
        <td><span class="badge ${u.actif ? 'success' : 'danger'}">${u.actif ? 'Actif' : 'Inactif'}</span></td>
        <td class="admin-actions"><button class="btn btn-danger btn-sm" onclick="App.deleteUser(${u.id})">Supprimer</button></td>
      </tr>`).join('');
  }
}

// Méthodes admin inline
WellnessApp.prototype.adminConfirmRes = async function(id) {
  try {
    await WellnessAPI.updateReservation(id, { statut: 'Confirmee' });
    Toast.show('Réservation confirmée');
    await this._loadCoachings(); // Rafraîchir nb_places
    await this.loadAdminPage('reservations');
  } catch(e) { Toast.show(e.message, 'error'); }
};
WellnessApp.prototype.adminCancelRes  = async function(id) { try { await WellnessAPI.cancelReservation(id); Toast.show('Réservation annulée', 'warn'); await this.loadAdminPage('reservations'); } catch(e){ Toast.show(e.message, 'error'); }};
WellnessApp.prototype.adminLivreCmd   = async function(id) { try { await WellnessAPI.updateCommande(id, { statut: 'Livree' }); Toast.show('Commande marquée livrée'); await this.loadAdminPage('commandes'); } catch(e){ Toast.show(e.message, 'error'); }};
WellnessApp.prototype.deleteCoaching  = async function(id) { if (!confirm('Supprimer ce coaching ?')) return; try { await WellnessAPI.deleteCoaching(id); Toast.show('Supprimé'); await this._loadCoachings(); await this.loadAdminPage('coachings'); } catch(e){ Toast.show(e.message, 'error'); }};
WellnessApp.prototype.deleteProduit   = async function(id) { if (!confirm('Supprimer ce produit ?')) return; try { await WellnessAPI.deleteProduit(id); Toast.show('Supprimé'); await this._loadProduits(); await this.loadAdminPage('produits'); } catch(e){ Toast.show(e.message, 'error'); }};
WellnessApp.prototype.deleteUser      = async function(id) { if (!confirm('Supprimer cet utilisateur ?')) return; try { await WellnessAPI.deleteUtilisateur(id); Toast.show('Utilisateur supprimé', 'warn'); await this.loadAdminPage('utilisateurs'); } catch(e){ Toast.show(e.message, 'error'); }};
WellnessApp.prototype.openAdminModal  = function(type, id) { openModal(type, id); };

// Instance globale
const App = new WellnessApp();
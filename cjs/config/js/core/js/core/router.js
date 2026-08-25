// js/core/router.js
import { addListener } from "./auth.js";

export const router = {
    currentPath: '/',
    navigate(path) {
        if (path === this.currentPath) return;
        this.currentPath = path;
        // Mise à jour de l'URL sans rechargement
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    },
    handleRoute(path) {
        // Pour l'instant, on recharge la page si on est sur une page différente
        // Plus tard, on pourra faire du SPA avec chargement dynamique
        const pageMap = {
            '/': 'index.html',
            '/connexion': 'connexion.html',
            '/inscription': 'inscription.html',
            '/profil': 'profil.html',
            // ajouter les autres pages au fur et à mesure
        };
        const page = pageMap[path] || 'index.html';
        // On ne recharge que si on n'est pas déjà sur cette page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (page !== currentPage) {
            window.location.href = page;
        }
    }
};

// Gestion des clics sur les liens avec data-link
document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) router.navigate(href);
    }
});

// Gestion du bouton retour
window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    router.currentPath = path;
    router.handleRoute(path);
});

// Initialisation
export function initRouter() {
    // Gérer le chemin initial
    const path = window.location.pathname;
    router.currentPath = path;
    // On peut aussi vérifier les permissions ici
}

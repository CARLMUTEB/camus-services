// js/components/BottomNav.js
export function initBottomNav() {
    // Aucune logique dynamique pour l'instant, juste le suivi de la page active
    const links = document.querySelectorAll('.bottom-nav a');
    const currentPath = window.location.pathname;
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

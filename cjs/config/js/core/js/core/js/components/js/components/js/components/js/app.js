// js/app.js
import { initAuth } from "./core/auth.js";
import { initRouter } from "./core/router.js";
import { initSidebar } from "./components/Sidebar.js";
import { initBottomNav } from "./components/BottomNav.js";
import { initProfileButton } from "./components/ProfileButton.js";

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initRouter();
    initSidebar();
    initBottomNav();
    initProfileButton();

    // Chargement des catégories, communiqués, annonces (Phase 2+)
    // ...
});

console.log('🚀 CAMU SERVICES - Application démarrée');

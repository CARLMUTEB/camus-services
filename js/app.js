// =========================================================
// CAMU SERVICES — APPLICATION PRINCIPALE
// =========================================================

// Authentification
import {
    initAuth
} from "./core/auth.js";


// Sidebar
import {
    initSidebar
} from "./components/Sidebar.js";


// Navigation mobile
import {
    initBottomNav
} from "./components/BottomNav.js";


// Bouton profil
import {
    initProfileButton
} from "./components/ProfileButton.js";


// =========================================================
// DÉMARRAGE DE L'APPLICATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 CAMU SERVICES — démarrage..."
        );


        // =====================================================
        // AUTHENTIFICATION
        // =====================================================

        try {

            initAuth();

            console.log(
                "✅ Firebase Authentication initialisé"
            );

        } catch (error) {

            console.error(
                "❌ Erreur Authentication :",
                error
            );
        }


        // =====================================================
        // SIDEBAR
        // =====================================================

        try {

            initSidebar();

            console.log(
                "✅ Sidebar initialisée"
            );

        } catch (error) {

            console.error(
                "❌ Erreur Sidebar :",
                error
            );
        }


        // =====================================================
        // BOUTON PROFIL
        // =====================================================

        try {

            initProfileButton();

            console.log(
                "✅ Bouton Profil initialisé"
            );

        } catch (error) {

            console.error(
                "❌ Erreur Profil :",
                error
            );
        }


        // =====================================================
        // NAVIGATION MOBILE
        // =====================================================

        try {

            initBottomNav();

            console.log(
                "✅ Navigation mobile initialisée"
            );

        } catch (error) {

            console.error(
                "❌ Erreur Navigation mobile :",
                error
            );
        }


        // =====================================================
        // APPLICATION PRÊTE
        // =====================================================

        console.log(
            "✅ CAMU SERVICES — application prête"
        );
    }
);

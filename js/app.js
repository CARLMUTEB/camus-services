// =========================================================
// CAMU SERVICES — APPLICATION PRINCIPALE
// =========================================================

import { initAuth } from "./core/auth.js";
import { initSidebar } from "./components/Sidebar.js";
import { initBottomNav } from "./components/BottomNav.js";
import { initProfileButton } from "./components/ProfileButton.js";


// =========================================================
// DÉMARRAGE DE L'APPLICATION
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("🚀 CAMU SERVICES — démarrage");


    // -----------------------------------------------------
    // AUTHENTIFICATION
    // -----------------------------------------------------

    try {

        initAuth();

        console.log("✅ Authentification initialisée");

    } catch (error) {

        console.error(
            "❌ Erreur initialisation authentification :",
            error
        );

    }


    // -----------------------------------------------------
    // SIDEBAR
    // -----------------------------------------------------

    try {

        initSidebar();

        console.log("✅ Sidebar initialisée");

    } catch (error) {

        console.error(
            "❌ Erreur initialisation Sidebar :",
            error
        );

    }


    // -----------------------------------------------------
    // PROFIL
    // -----------------------------------------------------

    try {

        initProfileButton();

        console.log("✅ Bouton Profil initialisé");

    } catch (error) {

        console.error(
            "❌ Erreur initialisation Profil :",
            error
        );

    }


    // -----------------------------------------------------
    // NAVIGATION MOBILE
    // -----------------------------------------------------

    try {

        initBottomNav();

        console.log(
            "✅ Navigation mobile initialisée"
        );

    } catch (error) {

        console.error(
            "❌ Erreur navigation mobile :",
            error
        );

    }


    // -----------------------------------------------------
    // FIN
    // -----------------------------------------------------

    console.log(
        "✅ CAMU SERVICES — application prête"
    );

});
```

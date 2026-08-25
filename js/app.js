// =========================================================
// CAMU SERVICES — APPLICATION PRINCIPALE
// =========================================================

import { initAuth } from "./core/auth.js";
import { initSidebar } from "./components/Sidebar.js";

// =========================================================
// INITIALISATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 CAMU SERVICES — démarrage...");

    // -----------------------------------------------------
    // AUTHENTIFICATION
    // -----------------------------------------------------

    try {

        initAuth();

        console.log("✅ Authentification initialisée");

    } catch (error) {

        console.error(
            "❌ Erreur Authentification :",
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
            "❌ Erreur Sidebar :",
            error
        );
    }


    console.log(
        "✅ CAMU SERVICES — application chargée"
    );

});

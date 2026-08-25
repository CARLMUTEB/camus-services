// =========================================================
// CAMU SERVICES — APPLICATION
// =========================================================

import {
    initAuth
} from "./core/auth.js";

import {
    initSidebar
} from "./components/Sidebar.js";

import {
    initBottomNav
} from "./components/BottomNav.js";

import {
    initProfileButton
} from "./components/ProfileButton.js";


// =========================================================
// DÉMARRAGE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 CAMU SERVICES — démarrage"
        );


        // AUTH
        try {

            initAuth();

            console.log(
                "✅ Authentification OK"
            );

        } catch (error) {

            console.error(
                "❌ Authentification :",
                error
            );
        }


        // SIDEBAR
        try {

            initSidebar();

            console.log(
                "✅ Sidebar OK"
            );

        } catch (error) {

            console.error(
                "❌ Sidebar :",
                error
            );
        }


        // PROFIL
        try {

            initProfileButton();

            console.log(
                "✅ Profil OK"
            );

        } catch (error) {

            console.error(
                "❌ Profil :",
                error
            );
        }


        // NAVIGATION BASSE
        try {

            initBottomNav();

            console.log(
                "✅ Navigation mobile OK"
            );

        } catch (error) {

            console.error(
                "❌ Navigation :",
                error
            );
        }


        console.log(
            "✅ CAMU SERVICES — prêt"
        );

    }
);
```

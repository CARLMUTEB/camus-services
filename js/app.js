// =========================================================
// CAMU SERVICES — APPLICATION PRINCIPALE
// =========================================================

import { initAuth } from "./core/auth.js";
import { router } from "./core/router.js";

import { initSidebar }
from "./components/Sidebar.js";

import { initBottomNav }
from "./components/BottomNav.js";

import { initProfileButton }
from "./components/ProfileButton.js";

import { loadCategories }
from "./services/categories.js";

import { loadRecentListings }
from "./services/annonces.js";


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "🚀 CAMU SERVICES démarrage..."
        );


        // ROUTER
        router.init();


        // AUTHENTIFICATION
        initAuth();


        // SIDEBAR
        initSidebar();


        // NAVIGATION MOBILE
        initBottomNav();


        // BOUTON PROFIL
        initProfileButton();


        // CATÉGORIES
        loadCategories();


        // ANNONCES
        await loadRecentListings();


        // RECHERCHE
        initSearch();


        console.log(
            "✅ CAMU SERVICES opérationnel"
        );
    }
);


// =========================================================
// RECHERCHE
// =========================================================

function initSearch() {

    const button =
        document.getElementById(
            "search-btn"
        );

    const input =
        document.getElementById(
            "search-input"
        );


    if (!button || !input) return;


    function performSearch() {

        const value =
            input.value.trim();


        if (!value) {

            alert(
                "Veuillez saisir ce que vous recherchez."
            );

            input.focus();

            return;
        }


        console.log(
            "Recherche :",
            value
        );


        window.dispatchEvent(
            new CustomEvent(
                "camu-search",
                {
                    detail: value
                }
            )
        );
    }


    button.addEventListener(
        "click",
        performSearch
    );


    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                performSearch();
            }
        }
    );
}

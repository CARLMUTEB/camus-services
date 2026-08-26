// =========================================================
// CAMU SERVICES — BOUTON PROFIL
// =========================================================

import { addListener } from "../core/store.js";


// =========================================================
// INITIALISATION
// =========================================================

export function initProfileButton() {

    const profileButton =
        document.getElementById("profile-btn");


    // Le bouton n'existe pas sur cette page
    if (!profileButton) {
        return;
    }


    // =====================================================
    // CLIC SUR PROFIL
    // =====================================================

    profileButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const currentPath =
                window.location.pathname;


            // ---------------------------------------------
            // Vérifier si l'utilisateur est connecté
            // ---------------------------------------------

            if (
                window.CAMU_STATE &&
                window.CAMU_STATE.isAuthenticated
            ) {

                window.location.href =
                    "profil.html";

                return;
            }


            // ---------------------------------------------
            // Vérification via le store
            // ---------------------------------------------

            window.location.href =
                "connexion.html";
        }
    );


    // =====================================================
    // MISE À JOUR DU BOUTON
    // =====================================================

    addListener(
        state => {

            if (!profileButton) {
                return;
            }


            if (state.isAuthenticated) {

                profileButton.innerHTML =
                    '<i class="fas fa-user"></i> Profil';

                profileButton.setAttribute(
                    "aria-label",
                    "Ouvrir mon profil"
                );

            } else {

                profileButton.innerHTML =
                    '<i class="fas fa-user"></i> Connexion';

                profileButton.setAttribute(
                    "aria-label",
                    "Se connecter"
                );
            }


            // Permettre à l'app de connaître
            // l'état actuel de connexion.
            window.CAMU_STATE = state;
        }
    );
}

// =========================================================
// CAMU SERVICES — NAVIGATION MOBILE
// =========================================================

import { addListener } from "../core/store.js";


// =========================================================
// INITIALISATION
// =========================================================

export function initBottomNav() {

    const bottomNav =
        document.querySelector(".bottom-nav");


    // La navigation n'existe pas sur cette page
    if (!bottomNav) {
        return;
    }


    // =====================================================
    // RÉCUPÉRER LES LIENS
    // =====================================================

    const links =
        bottomNav.querySelectorAll("a");


    // =====================================================
    // GESTION DES CLICS
    // =====================================================

    links.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const href =
                    link.getAttribute("href");


                // ------------------------------------------------
                // ACCUEIL
                // ------------------------------------------------

                if (
                    href === "/" ||
                    href === "index.html"
                ) {

                    window.location.href =
                        "index.html";

                    return;
                }


                // ------------------------------------------------
                // CHAT / PUBLIER / FAVORIS
                // ------------------------------------------------
                // Pour ces fonctions, l'utilisateur doit être
                // connecté.

                const state =
                    window.CAMU_STATE;


                if (
                    !state ||
                    !state.isAuthenticated
                ) {

                    window.location.href =
                        "connexion.html";

                    return;
                }


                // ------------------------------------------------
                // CHAT
                // ------------------------------------------------

                if (
                    href.includes("chat")
                ) {

                    window.location.href =
                        "chat.html";

                    return;
                }


                // ------------------------------------------------
                // PUBLIER
                // ------------------------------------------------

                if (
                    href.includes("publier")
                ) {

                    window.location.href =
                        "publier.html";

                    return;
                }


                // ------------------------------------------------
                // FAVORIS
                // ------------------------------------------------

                if (
                    href.includes("favoris")
                ) {

                    window.location.href =
                        "favoris.html";

                    return;
                }


                // ------------------------------------------------
                // AUTRE LIEN
                // ------------------------------------------------

                if (href) {

                    window.location.href =
                        href;
                }
            }
        );
    });


    // =====================================================
    // ÉTAT DE CONNEXION
    // =====================================================

    addListener(
        state => {

            // Rendre l'état disponible
            // pour les autres composants.

            window.CAMU_STATE =
                state;


            links.forEach(link => {

                const href =
                    link.getAttribute("href");


                // ---------------------------------------------
                // Accueil toujours accessible
                // ---------------------------------------------

                if (
                    href === "/" ||
                    href === "index.html"
                ) {

                    link.classList.remove(
                        "requires-auth"
                    );

                    return;
                }


                // ---------------------------------------------
                // Liens nécessitant une connexion
                // ---------------------------------------------

                link.classList.add(
                    "requires-auth"
                );
            });
        }
    );
}

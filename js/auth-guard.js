/* =========================================================
   CAMU SERVICES
   AUTH GUARD
   Connexion obligatoire pour accéder aux espaces
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   FIREBASE
========================================================= */

let auth = null;

try {

    if (!getApps().length) {
        console.error(
            "AUTH GUARD — Firebase n'est pas initialisé."
        );
    } else {

        const app = getApp();

        auth = getAuth(app);
    }

} catch (error) {

    console.error(
        "AUTH GUARD — Erreur Firebase :",
        error
    );
}


/* =========================================================
   PAGES PUBLIQUES
========================================================= */

const publicPages = [
    "connexion.html",
    "inscription.html",
    "mot-de-passe-oublie.html"
];


/* =========================================================
   PAGE ACTUELLE
========================================================= */

const currentPath =
    window.location.pathname;

const currentPage =
    currentPath
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   EST-CE UNE PAGE PUBLIQUE ?
========================================================= */

if (
    publicPages.includes(currentPage)
) {

    console.log(
        "AUTH GUARD — Page publique :",
        currentPage
    );

} else {

    /* =====================================================
       PROTECTION
    ====================================================== */

    if (!auth) {

        console.error(
            "AUTH GUARD — Auth indisponible."
        );

    } else {

        onAuthStateChanged(
            auth,
            user => {

                if (user) {

                    console.log(
                        "AUTH GUARD — Utilisateur connecté :",
                        user.email
                    );

                    return;
                }


                /* =========================================
                   UTILISATEUR NON CONNECTÉ
                ========================================== */

                console.log(
                    "AUTH GUARD — Accès refusé : connexion obligatoire."
                );


                const currentUrl =
                    window.location.href;


                /*
                 * Empêche une boucle de redirection.
                 */

                const loginUrl =
                    `connexion.html?redirect=${encodeURIComponent(
                        currentUrl
                    )}`;


                window.location.replace(
                    loginUrl
                );

            }
        );
    }
}

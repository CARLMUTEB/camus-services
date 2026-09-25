/* =========================================================
   CAMU SERVICES
   PROTECTION GLOBALE DES PAGES
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
   PAGES PUBLIQUES
========================================================= */

const PUBLIC_PAGES = [
    "connexion.html",
    "inscription.html",
    "mot-de-passe-oublie.html",
    "404.html"
];


/* =========================================================
   PAGE ACTUELLE
========================================================= */

const currentPage =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   NE PAS PROTÉGER LES PAGES PUBLIQUES
========================================================= */

if (PUBLIC_PAGES.includes(currentPage)) {

    console.log(
        "AUTH GUARD — Page publique :",
        currentPage
    );

} else {

    /* =====================================================
       MASQUER LA PAGE PENDANT LA VÉRIFICATION
    ====================================================== */

    document.documentElement.classList.add(
        "auth-checking"
    );


    /* =====================================================
       ATTENDRE FIREBASE
    ====================================================== */

    function waitForFirebase() {

        return new Promise(
            resolve => {

                const maxAttempts = 100;
                let attempts = 0;

                const check = () => {

                    attempts++;

                    if (getApps().length > 0) {

                        resolve(
                            getAuth(getApp())
                        );

                        return;
                    }

                    if (attempts >= maxAttempts) {

                        resolve(null);

                        return;
                    }

                    setTimeout(
                        check,
                        50
                    );
                };

                check();
            }
        );
    }


    /* =====================================================
       PROTECTION
    ====================================================== */

    waitForFirebase()
        .then(
            auth => {

                if (!auth) {

                    console.error(
                        "AUTH GUARD — Firebase indisponible."
                    );

                    window.location.replace(
                        "connexion.html"
                    );

                    return;
                }


                onAuthStateChanged(
                    auth,
                    user => {

                        /* =================================
                           UTILISATEUR CONNECTÉ
                        ================================== */

                        if (user) {

                            console.log(
                                "AUTH GUARD — Accès autorisé :",
                                user.email
                            );

                            document.documentElement
                                .classList.remove(
                                    "auth-checking"
                                );

                            return;
                        }


                        /* =================================
                           PAS CONNECTÉ
                        ================================== */

                        console.log(
                            "AUTH GUARD — Connexion obligatoire."
                        );


                        const requestedUrl =
                            window.location.href;


                        /*
                         * Évite de stocker une ancienne
                         * URL de connexion.
                         */

                        const redirect =
                            encodeURIComponent(
                                requestedUrl
                            );


                        window.location.replace(
                            `connexion.html?redirect=${redirect}`
                        );

                    }
                );
            }
        );
}


/* =========================================================
   STYLE ANTI-FLASH
========================================================= */

const style =
    document.createElement("style");

style.textContent = `
    html.auth-checking body {
        visibility: hidden;
    }
`;

document.head.appendChild(style);

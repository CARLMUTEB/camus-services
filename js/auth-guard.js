/* =========================================================
   CAMU SERVICES
   AUTH GUARD
   CONNEXION OBLIGATOIRE POUR LES ESPACES
========================================================= */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   PAGES QUI RESTENT ACCESSIBLES SANS COMPTE
========================================================= */

const PUBLIC_PAGES = [
    "connexion.html",
    "inscription.html",
    "mot-de-passe-oublie.html"
];


/* =========================================================
   DÉTERMINER LA PAGE ACTUELLE
========================================================= */

const currentPage =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   PAGE PUBLIQUE
========================================================= */

if (PUBLIC_PAGES.includes(currentPage)) {

    console.log(
        "AUTH GUARD — Page publique :",
        currentPage
    );

} else {

    /* =====================================================
       BLOQUER L'AFFICHAGE PENDANT LA VÉRIFICATION
    ====================================================== */

    const guardStyle =
        document.createElement("style");

    guardStyle.textContent = `
        html.camu-auth-checking body {
            visibility: hidden !important;
        }
    `;

    document.head.appendChild(
        guardStyle
    );

    document.documentElement.classList.add(
        "camu-auth-checking"
    );


    /* =====================================================
       VÉRIFICATION DE L'AUTHENTIFICATION
    ====================================================== */

    onAuthStateChanged(
        auth,
        user => {

            /* =============================================
               UTILISATEUR CONNECTÉ
            ============================================== */

            if (user) {

                console.log(
                    "AUTH GUARD — Accès autorisé :",
                    user.email
                );


                document.documentElement.classList.remove(
                    "camu-auth-checking"
                );


                return;
            }


            /* =============================================
               UTILISATEUR NON CONNECTÉ
            ============================================== */

            console.log(
                "AUTH GUARD — Connexion obligatoire."
            );


            const currentUrl =
                window.location.href;


            const redirect =
                encodeURIComponent(
                    currentUrl
                );


            window.location.replace(
                `connexion.html?redirect=${redirect}`
            );
        }
    );
}

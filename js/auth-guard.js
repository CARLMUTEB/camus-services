/* =========================================================
   CAMU SERVICES
   AUTH GUARD
========================================================= */

import { auth } from "./app.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


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

const currentPage =
    window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   NE PAS PROTÉGER LES PAGES PUBLIQUES
========================================================= */

if (publicPages.includes(currentPage)) {

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
       VÉRIFICATION FIREBASE AUTH
    ====================================================== */

    onAuthStateChanged(
        auth,
        user => {

            if (user) {

                console.log(
                    "AUTH GUARD — Utilisateur connecté :",
                    user.email
                );

                document.documentElement.classList.remove(
                    "auth-checking"
                );

                return;
            }


            /* =============================================
               UTILISATEUR NON CONNECTÉ
            ============================================== */

            console.log(
                "AUTH GUARD — Utilisateur non connecté."
            );


            const requestedUrl =
                window.location.href;


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


/* =========================================================
   ANTI FLASH
========================================================= */

const style =
    document.createElement("style");

style.textContent = `
    html.auth-checking body {
        visibility: hidden;
    }
`;

document.head.appendChild(style);

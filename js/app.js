/* =========================================================
   CAMU SERVICES — APP.JS V1
   Interactions générales + Firebase Auth
========================================================= */

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ÉLÉMENTS
    ===================================================== */

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    const sidebarClose =
        document.getElementById("sidebarClose");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    const homeSearchForm =
        document.getElementById("homeSearchForm");

    const searchKeyword =
        document.getElementById("searchKeyword");

    const citySelect =
        document.getElementById("citySelect");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const accountLinks =
        document.querySelectorAll(
            'a[href="compte.html"], #accountLink'
        );


    /* =====================================================
       ADMINISTRATION
    ===================================================== */

    const adminNavItem =
        document.getElementById("adminNavItem");

    const ADMIN_EMAIL =
        "meschackmuteb@gmail.com";


    /* =====================================================
       AUTHENTIFICATION FIREBASE
    ===================================================== */

    let currentUser = null;


    onAuthStateChanged(
        auth,
        user => {

            currentUser = user;


            /* ---------------------------------------------
               UTILISATEUR CONNECTÉ
            --------------------------------------------- */

            if (user) {

                console.log(
                    "Utilisateur connecté :",
                    user.email
                );


                /* -----------------------------------------
                   MON COMPTE
                ----------------------------------------- */

                accountLinks.forEach(
                    link => {

                        link.href =
                            "compte.html";

                    }
                );


                /* -----------------------------------------
                   ADMINISTRATION
                ----------------------------------------- */

                if (
                    adminNavItem &&
                    user.email?.toLowerCase() ===
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    adminNavItem.style.display =
                        "";

                }

                else if (
                    adminNavItem
                ) {

                    adminNavItem.style.display =
                        "none";

                }


                /* -----------------------------------------
                   DÉCONNEXION
                ----------------------------------------- */

                if (logoutBtn) {

                    logoutBtn.style.display =
                        "";

                }

            }


            /* ---------------------------------------------
               UTILISATEUR NON CONNECTÉ
            --------------------------------------------- */

            else {

                console.log(
                    "Aucun utilisateur connecté."
                );


                /* Cacher Administration */

                if (adminNavItem) {

                    adminNavItem.style.display =
                        "none";

                }


                /* -----------------------------------------
                   MON COMPTE → CONNEXION
                ----------------------------------------- */

                accountLinks.forEach(
                    link => {

                        link.href =
                            "connexion.html";

                    }
                );


                /* -----------------------------------------
                   CACHER DÉCONNEXION
                ----------------------------------------- */

                if (logoutBtn) {

                    logoutBtn.style.display =
                        "none";

                }

            }

        }
    );


    /* =====================================================
       MENU
    ===================================================== */

    function openSidebar() {

        if (!sidebar) return;


        sidebar.classList.add(
            "open"
        );


        if (sidebarOverlay) {

            sidebarOverlay.classList.add(
                "active"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    function closeSidebar() {

        if (!sidebar) return;


        sidebar.classList.remove(
            "open"
        );


        if (sidebarOverlay) {

            sidebarOverlay.classList.remove(
                "active"
            );

        }


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       OUVRIR LE MENU
    ===================================================== */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openSidebar
        );

    }


    /* =====================================================
       FERMER LE MENU
    ===================================================== */

    if (sidebarClose) {

        sidebarClose.addEventListener(
            "click",
            closeSidebar
        );

    }


    /* =====================================================
       FERMER AVEC OVERLAY
    ===================================================== */

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    /* =====================================================
       FERMER LE MENU APRÈS UN CLIC
    ===================================================== */

    const navLinks =
        document.querySelectorAll(
            ".sidebar .nav-item"
        );


    navLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 700
                    ) {

                        closeSidebar();

                    }

                }
            );

        }
    );


    /* =====================================================
       FERMER AVEC ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );


    /* =====================================================
       RECHERCHE
    ===================================================== */

    if (homeSearchForm) {

        homeSearchForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                /* -----------------------------------------
                   MOT-CLÉ
                ----------------------------------------- */

                const keyword =
                    searchKeyword?.value.trim()
                    || "";


                /* -----------------------------------------
                   VILLE
                ----------------------------------------- */

                const city =
                    citySelect?.value
                    || "";


                /* -----------------------------------------
                   PARAMÈTRES URL
                ----------------------------------------- */

                const params =
                    new URLSearchParams();


                if (keyword) {

                    params.set(
                        "q",
                        keyword
                    );

                }


                if (city) {

                    params.set(
                        "city",
                        city
                    );

                }


                /* -----------------------------------------
                   REDIRECTION
                ----------------------------------------- */

                const queryString =
                    params.toString();


                if (queryString) {

                    window.location.href =
                        `recherche.html?${queryString}`;

                }

                else {

                    window.location.href =
                        "recherche.html";

                }

            }
        );

    }


    /* =====================================================
       DÉCONNEXION — FIREBASE
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                /* -----------------------------------------
                   VÉRIFIER UTILISATEUR
                ----------------------------------------- */

                if (!currentUser) {

                    window.location.href =
                        "connexion.html";

                    return;

                }


                /* -----------------------------------------
                   CONFIRMATION
                ----------------------------------------- */

                const confirmLogout =
                    confirm(
                        "Voulez-vous vraiment vous déconnecter ?"
                    );


                if (!confirmLogout) {

                    return;

                }


                /* -----------------------------------------
                   DÉCONNEXION
                ----------------------------------------- */

                try {

                    await signOut(
                        auth
                    );


                    if (
                        typeof window.showCamuMessage ===
                        "function"
                    ) {

                        window.showCamuMessage(
                            "Vous êtes déconnecté.",
                            "success"
                        );

                    }


                    setTimeout(
                        () => {

                            window.location.href =
                                "index.html";

                        },
                        700
                    );

                }


                catch (error) {

                    console.error(
                        "Erreur de déconnexion :",
                        error
                    );


                    if (
                        typeof window.showCamuMessage ===
                        "function"
                    ) {

                        window.showCamuMessage(
                            "Impossible de vous déconnecter.",
                            "error"
                        );

                    }

                }

            }
        );

    }


    /* =====================================================
       ANIMATION DES CARTES
    ===================================================== */

    const cards =
        document.querySelectorAll(
            ".category-card, .ad-card"
        );


    cards.forEach(
        (card, index) => {

            card.style.animation =
                `fadeIn 0.35s ease ${index * 0.04}s both`;

        }
    );


    /* =====================================================
       NOTIFICATION CAMU
    ===================================================== */

    window.showCamuMessage =
        function (
            message,
            type = "success"
        ) {

            /* ---------------------------------------------
               SUPPRIMER L'ANCIEN MESSAGE
            --------------------------------------------- */

            const existing =
                document.querySelector(
                    ".camu-message"
                );


            if (existing) {

                existing.remove();

            }


            /* ---------------------------------------------
               CRÉER LA NOTIFICATION
            --------------------------------------------- */

            const notification =
                document.createElement(
                    "div"
                );


            notification.className =
                `camu-message camu-message-${type}`;


            notification.textContent =
                message;


            document.body.appendChild(
                notification
            );


            /* ---------------------------------------------
               MASQUER APRÈS 3 SECONDES
            --------------------------------------------- */

            setTimeout(
                () => {

                    notification.classList.add(
                        "hide"
                    );


                    setTimeout(
                        () => {

                            notification.remove();

                        },
                        300
                    );

                },
                3000
            );

        };


    /* =====================================================
       FIN
    ===================================================== */

    console.log(
        "CAMU SERVICES V1 — application chargée."
    );

});

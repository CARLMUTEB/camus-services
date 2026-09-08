/* =========================================================
   CAMU SERVICES — APP.JS V1
   Interactions générales + Firebase Auth + Favoris Firestore
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


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


    /* =====================================================
       FAVORIS — FIRESTORE
    ===================================================== */

    const favoriteButtons =
        document.querySelectorAll(
            ".favorite-button, .favorite-btn"
        );


    function getListingId(button) {

        return (
            button.dataset.listingId ||
            button.dataset.favoriteId ||
            button.dataset.id ||
            ""
        ).trim();

    }


    function updateFavoriteButton(button, active) {

        if (!button) return;

        button.classList.toggle(
            "is-favorite",
            active
        );

        button.classList.toggle(
            "active",
            active
        );


        const icon =
            button.querySelector("i");


        if (icon) {

            icon.classList.toggle(
                "fa-solid",
                active
            );

            icon.classList.toggle(
                "fa-regular",
                !active
            );

        }


        button.setAttribute(
            "aria-label",
            active
                ? "Retirer des favoris"
                : "Ajouter aux favoris"
        );

    }


    async function toggleFavorite(button) {

        if (!currentUser) {

            window.showCamuMessage(
                "Connectez-vous pour utiliser les favoris.",
                "info"
            );


            setTimeout(() => {

                window.location.href =
                    "connexion.html";

            }, 700);


            return;
        }


        const listingId =
            getListingId(button);


        if (!listingId) {

            console.error(
                "ID de l'annonce manquant.",
                button
            );


            window.showCamuMessage(
                "Impossible d'ajouter cette annonce aux favoris.",
                "error"
            );


            return;
        }


        const favoriteId =
            `${currentUser.uid}-${listingId}`;


        try {

            const favoriteRef =
                doc(
                    db,
                    "favorites",
                    favoriteId
                );


            const favoriteSnapshot =
                await getDoc(
                    favoriteRef
                );


            /* ---------------------------------------------
               LE FAVORI EXISTE
            --------------------------------------------- */

            if (favoriteSnapshot.exists()) {

                await deleteDoc(
                    favoriteRef
                );


                updateFavoriteButton(
                    button,
                    false
                );


                window.showCamuMessage(
                    "Annonce retirée des favoris.",
                    "success"
                );

            }


            /* ---------------------------------------------
               LE FAVORI N'EXISTE PAS
            --------------------------------------------- */

            else {

                await setDoc(
                    favoriteRef,
                    {
                        userId:
                            currentUser.uid,

                        listingId:
                            listingId,

                        createdAt:
                            new Date()
                    }
                );


                updateFavoriteButton(
                    button,
                    true
                );


                window.showCamuMessage(
                    "Annonce ajoutée aux favoris.",
                    "success"
                );

            }


        } catch (error) {

            console.error(
                "Erreur Firestore favoris :",
                error
            );


            window.showCamuMessage(
                "Impossible de modifier les favoris.",
                "error"
            );

        }

    }


    /* =====================================================
       RESTAURATION DES FAVORIS
    ===================================================== */

    async function restoreFavoriteButtons() {

        if (!currentUser) return;


        for (
            const button
            of favoriteButtons
        ) {

            const listingId =
                getListingId(button);


            if (!listingId) continue;


            try {

                const favoriteId =
                    `${currentUser.uid}-${listingId}`;


                const favoriteSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "favorites",
                            favoriteId
                        )
                    );


                updateFavoriteButton(
                    button,
                    favoriteSnapshot.exists()
                );


            } catch (error) {

                console.error(
                    "Erreur restauration favori :",
                    error
                );

            }

        }

    }


    /* =====================================================
       ÉVÉNEMENT DES BOUTONS FAVORIS
    ===================================================== */

    favoriteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    await toggleFavorite(
                        button
                    );

                }
            );

        }
    );


    /* =====================================================
       AUTH STATE
    ===================================================== */

    onAuthStateChanged(
        auth,
        async user => {

            currentUser = user;


            /* ---------------------------------------------
               RESTAURER LES FAVORIS
            --------------------------------------------- */

            if (user) {

                await restoreFavoriteButtons();

            } else {

                favoriteButtons.forEach(
                    button => {

                        updateFavoriteButton(
                            button,
                            false
                        );

                    }
                );

            }


            /* ---------------------------------------------
               UTILISATEUR CONNECTÉ
            --------------------------------------------- */

            if (user) {

                console.log(
                    "Utilisateur connecté :",
                    user.email
                );


                /* Mon compte → compte.html */

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

                } else if (
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


                /* Mon compte → connexion.html */

                accountLinks.forEach(
                    link => {

                        link.href =
                            "connexion.html";

                    }
                );


                /* Déconnexion */

                if (logoutBtn) {

                    logoutBtn.style.display =
                        "none";

                }

            }

        }
    );


    /* =====================================================
       MENU MOBILE
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


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openSidebar
        );

    }


    if (sidebarClose) {

        sidebarClose.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    /* Fermer le menu après clic */

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


    /* Fermer avec ESC */

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


                const keyword =
                    searchKeyword?.value.trim()
                    || "";


                const city =
                    citySelect?.value
                    || "";


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


                const queryString =
                    params.toString();


                if (queryString) {

                    window.location.href =
                        `recherche.html?${queryString}`;

                } else {

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


                if (!currentUser) {

                    window.location.href =
                        "connexion.html";

                    return;

                }


                const confirmLogout =
                    confirm(
                        "Voulez-vous vraiment vous déconnecter ?"
                    );


                if (!confirmLogout) {

                    return;

                }


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

            const existing =
                document.querySelector(
                    ".camu-message"
                );


            if (existing) {

                existing.remove();

            }


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

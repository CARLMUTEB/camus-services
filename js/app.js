// =========================================================
// CAMU SERVICES — APPLICATION PRINCIPALE
// =========================================================

import { initAuth } from "./core/auth.js";


// =========================================================
// DÉMARRAGE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 CAMU SERVICES — démarrage");


    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

    try {

        initAuth();

        console.log("✅ Authentification initialisée");

    } catch (error) {

        console.error(
            "❌ Erreur authentification :",
            error
        );

    }


    // =====================================================
    // SIDEBAR
    // =====================================================

    initSidebar();


    // =====================================================
    // PROFIL
    // =====================================================

    initProfileButton();


    // =====================================================
    // NAVIGATION MOBILE
    // =====================================================

    initBottomNavigation();


    // =====================================================
    // RECHERCHE
    // =====================================================

    initSearch();


    console.log("✅ CAMU SERVICES — prêt");

});


// =========================================================
// SIDEBAR
// =========================================================

function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");

    const menuButton =
        document.getElementById("menu-toggle");


    if (!sidebar) {

        console.error(
            "❌ #sidebar introuvable"
        );

        return;
    }


    if (!menuButton) {

        console.error(
            "❌ #menu-toggle introuvable"
        );

        return;
    }


    function openSidebar() {

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
        }

        document.body.classList.add(
            "sidebar-open"
        );

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        console.log("☰ Sidebar ouverte");

    }


    function closeSidebar() {

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
        }

        document.body.classList.remove(
            "sidebar-open"
        );

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        console.log("☰ Sidebar fermée");

    }


    // Bouton ☰

    menuButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (
                sidebar.classList.contains("open")
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );


    // Overlay

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    // Échap

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeSidebar();

            }

        }
    );


    // Liens de la sidebar

    sidebar
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    closeSidebar();

                }
            );

        });


    // Déconnexion

    const logoutButton =
        document.getElementById(
            "sidebar-logout"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    const { signOutUser } =
                        await import(
                            "./core/auth.js"
                        );


                    const result =
                        await signOutUser();


                    if (result.success) {

                        window.location.href =
                            "connexion.html";

                    } else {

                        alert(
                            result.error ||
                            "Impossible de se déconnecter."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Erreur déconnexion :",
                        error
                    );

                    alert(
                        "Une erreur est survenue."
                    );

                }

            }
        );

    }


    console.log(
        "✅ Sidebar initialisée"
    );

}


// =========================================================
// BOUTON PROFIL
// =========================================================

function initProfileButton() {

    const profileButton =
        document.getElementById(
            "profile-btn"
        );


    if (!profileButton) {

        console.error(
            "❌ #profile-btn introuvable"
        );

        return;

    }


    profileButton.addEventListener(
        "click",
        event => {

            event.preventDefault();


            console.log(
                "👤 Bouton profil cliqué"
            );


            /*
             * Pour le moment, le bouton dirige
             * vers la page de connexion.
             *
             * Quand l'utilisateur sera connecté,
             * nous pourrons automatiquement l'envoyer
             * vers profil.html.
             */

            window.location.href =
                "connexion.html";

        }
    );


    console.log(
        "✅ Bouton Profil initialisé"
    );

}


// =========================================================
// NAVIGATION MOBILE
// =========================================================

function initBottomNavigation() {

    const bottomNav =
        document.querySelector(
            ".bottom-nav"
        );


    if (!bottomNav) {

        console.warn(
            "⚠️ Navigation mobile introuvable"
        );

        return;

    }


    const links =
        bottomNav.querySelectorAll(
            "a"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                links.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );


                link.classList.add(
                    "active"
                );

            }
        );

    });


    console.log(
        "✅ Navigation mobile initialisée"
    );

}


// =========================================================
// RECHERCHE
// =========================================================

function initSearch() {

    const input =
        document.getElementById(
            "search-input"
        );

    const button =
        document.getElementById(
            "search-btn"
        );


    if (!input || !button) {

        console.warn(
            "⚠️ Barre de recherche introuvable"
        );

        return;

    }


    function search() {

        const value =
            input.value.trim();


        if (!value) {

            input.focus();

            return;

        }


        console.log(
            "🔎 Recherche :",
            value
        );


        const annonces =
            document.getElementById(
                "annonces-recentes"
            );


        if (annonces) {

            annonces.scrollIntoView({
                behavior: "smooth"
            });

        }

    }


    button.addEventListener(
        "click",
        search
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                search();

            }

        }
    );


    console.log(
        "✅ Recherche initialisée"
    );

}

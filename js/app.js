/* =========================================================
   CAMU SERVICES — APP.JS V1
   Interactions générales
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ÉLÉMENTS
    ===================================================== */

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const homeSearchForm = document.getElementById("homeSearchForm");
    const searchKeyword = document.getElementById("searchKeyword");
    const citySelect = document.getElementById("citySelect");

    const logoutBtn = document.getElementById("logoutBtn");


    /* =====================================================
       MENU MOBILE
    ===================================================== */

    function openSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("active");
        }

        document.body.style.overflow = "hidden";
    }


    function closeSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

        document.body.style.overflow = "";
    }


    if (menuButton) {
        menuButton.addEventListener("click", openSidebar);
    }


    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }


    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }


    /* Fermer le menu après avoir cliqué sur un lien */

    const navLinks = document.querySelectorAll(".sidebar .nav-item");

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 700) {
                closeSidebar();
            }

        });

    });


    /* Fermer avec la touche ESC */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    /* =====================================================
       RECHERCHE
    ===================================================== */

    if (homeSearchForm) {

        homeSearchForm.addEventListener("submit", event => {

            event.preventDefault();

            const keyword =
                searchKeyword?.value.trim() || "";

            const city =
                citySelect?.value || "";

            /*
             * On construit l'URL de recherche.
             * La vraie recherche Firestore sera ajoutée plus tard.
             */

            const params = new URLSearchParams();

            if (keyword) {
                params.set("q", keyword);
            }

            if (city) {
                params.set("city", city);
            }


            const queryString = params.toString();


            if (queryString) {

                window.location.href =
                    `pages/recherche.html?${queryString}`;

            } else {

                window.location.href =
                    "pages/recherche.html";

            }

        });

    }


    /* =====================================================
       FAVORIS — VERSION TEMPORAIRE
    ===================================================== */

    const favoriteButtons =
        document.querySelectorAll(".favorite-button");


    function getFavorites() {

        try {

            return JSON.parse(
                localStorage.getItem("camu_favorites")
            ) || [];

        } catch (error) {

            console.error(
                "Erreur lors de la lecture des favoris :",
                error
            );

            return [];

        }

    }


    function saveFavorites(favorites) {

        localStorage.setItem(
            "camu_favorites",
            JSON.stringify(favorites)
        );

    }


    favoriteButtons.forEach((button, index) => {

        button.addEventListener("click", event => {

            event.preventDefault();
            event.stopPropagation();


            let favorites = getFavorites();

            const favoriteId =
                `demo-ad-${index + 1}`;


            const existingIndex =
                favorites.indexOf(favoriteId);


            if (existingIndex === -1) {

                favorites.push(favoriteId);

                button.classList.add("is-favorite");

                const icon =
                    button.querySelector("i");

                if (icon) {

                    icon.classList.remove(
                        "fa-regular"
                    );

                    icon.classList.add(
                        "fa-solid"
                    );

                }

            } else {

                favorites.splice(
                    existingIndex,
                    1
                );

                button.classList.remove(
                    "is-favorite"
                );

                const icon =
                    button.querySelector("i");

                if (icon) {

                    icon.classList.remove(
                        "fa-solid"
                    );

                    icon.classList.add(
                        "fa-regular"
                    );

                }

            }


            saveFavorites(favorites);

        });

    });


    /* =====================================================
       RESTAURATION DES FAVORIS
    ===================================================== */

    const savedFavorites =
        getFavorites();


    favoriteButtons.forEach((button, index) => {

        const favoriteId =
            `demo-ad-${index + 1}`;


        if (savedFavorites.includes(favoriteId)) {

            button.classList.add(
                "is-favorite"
            );


            const icon =
                button.querySelector("i");


            if (icon) {

                icon.classList.remove(
                    "fa-regular"
                );

                icon.classList.add(
                    "fa-solid"
                );

            }

        }

    });


    /* =====================================================
       DÉCONNEXION — VERSION TEMPORAIRE
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", event => {

            event.preventDefault();


            /*
             * Pour le moment, aucune authentification
             * Firebase n'est encore connectée.
             */

            const confirmLogout =
                confirm(
                    "Voulez-vous vraiment vous déconnecter ?"
                );


            if (!confirmLogout) {
                return;
            }


            /*
             * Nettoyage temporaire.
             * Firebase Auth prendra le relais plus tard.
             */

            localStorage.removeItem(
                "camu_user"
            );


            window.location.href =
                "index.html";

        });

    }


    /* =====================================================
       ANIMATION DES CARTES
    ===================================================== */

    const cards =
        document.querySelectorAll(
            ".category-card, .ad-card"
        );


    cards.forEach((card, index) => {

        card.style.animation =
            `fadeIn 0.35s ease ${index * 0.04}s both`;

    });


    /* =====================================================
       UTILITAIRE : NOTIFICATION
    ===================================================== */

    window.showCamuMessage = function (
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
            document.createElement("div");


        notification.className =
            `camu-message camu-message-${type}`;


        notification.textContent =
            message;


        document.body.appendChild(
            notification
        );


        setTimeout(() => {

            notification.classList.add(
                "hide"
            );


            setTimeout(() => {

                notification.remove();

            }, 300);

        }, 3000);

    };


    /* =====================================================
       VÉRIFICATION DE LA PAGE
    ===================================================== */

    console.log(
        "CAMU SERVICES V1 — application chargée."
    );

});

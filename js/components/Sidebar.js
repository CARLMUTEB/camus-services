// =========================================================
// CAMU SERVICES — SIDEBAR
// =========================================================

import { addListener } from "../core/store.js";
import { signOutUser } from "../core/auth.js";


// =========================================================
// INITIALISATION
// =========================================================

export function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");

    const menuButton =
        document.getElementById("menu-toggle");

    const logoutButton =
        document.getElementById("sidebar-logout");


    // La page n'a pas de sidebar
    if (!sidebar) {
        return;
    }


    // =====================================================
    // OUVRIR
    // =====================================================

    function openSidebar() {

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
        }

        document.body.classList.add(
            "sidebar-open"
        );

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }


    // =====================================================
    // FERMER
    // =====================================================

    function closeSidebar() {

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
        }

        document.body.classList.remove(
            "sidebar-open"
        );

        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }


    // =====================================================
    // BOUTON MENU
    // =====================================================

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                if (
                    sidebar.classList.contains(
                        "open"
                    )
                ) {

                    closeSidebar();

                } else {

                    openSidebar();
                }
            }
        );
    }


    // =====================================================
    // OVERLAY
    // =====================================================

    if (overlay) {

        overlay.addEventListener(
            "click",
            event => {

                event.preventDefault();

                closeSidebar();
            }
        );
    }


    // =====================================================
    // TOUCHE ESC
    // =====================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                sidebar.classList.contains("open")
            ) {

                closeSidebar();
            }
        }
    );


    // =====================================================
    // LIENS DE LA SIDEBAR
    // =====================================================

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


    // =====================================================
    // DÉCONNEXION
    // =====================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                logoutButton.disabled = true;

                logoutButton.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Déconnexion...';


                const result =
                    await signOutUser();


                if (result.success) {

                    closeSidebar();

                    window.location.href =
                        "connexion.html";

                    return;
                }


                logoutButton.disabled = false;

                logoutButton.innerHTML =
                    '<i class="fas fa-sign-out-alt"></i> Déconnexion';


                alert(
                    result.error ||
                    "Impossible de se déconnecter."
                );
            }
        );
    }


    // =====================================================
    // MISE À JOUR DES INFORMATIONS UTILISATEUR
    // =====================================================

    addListener(
        state => {

            const name =
                document.getElementById(
                    "sidebar-displayName"
                );

            const role =
                document.getElementById(
                    "sidebar-role"
                );

            const avatar =
                document.getElementById(
                    "sidebar-avatar-img"
                );

            const professional =
                document.getElementById(
                    "sidebar-pro-link"
                );

            const admin =
                document.getElementById(
                    "sidebar-admin-link"
                );


            // -------------------------------------------------
            // VISITEUR
            // -------------------------------------------------

            if (!state.isAuthenticated) {

                if (name) {
                    name.textContent =
                        "Invité";
                }

                if (role) {
                    role.textContent =
                        "Visiteur";
                }

                if (avatar) {
                    avatar.src =
                        "assets/default-avatar.png";
                }

                if (professional) {
                    professional.style.display =
                        "none";
                }

                if (admin) {
                    admin.style.display =
                        "none";
                }

                if (logoutButton) {
                    logoutButton.style.display =
                        "none";
                }

                return;
            }


            // -------------------------------------------------
            // UTILISATEUR CONNECTÉ
            // -------------------------------------------------

            const data =
                state.userData || {};


            if (name) {

                name.textContent =
                    data.displayName ||
                    state.user?.displayName ||
                    "Utilisateur";
            }


            // -------------------------------------------------
            // RÔLE
            // -------------------------------------------------

            if (role) {

                const userRole =
                    data.role || "client";


                if (userRole === "admin") {

                    role.textContent =
                        "Administrateur";

                } else if (
                    userRole === "professional"
                ) {

                    role.textContent =
                        "Professionnel";

                } else {

                    role.textContent =
                        "Client";
                }
            }


            // -------------------------------------------------
            // PHOTO
            // -------------------------------------------------

            if (avatar) {

                avatar.src =
                    data.photoURL ||
                    "assets/default-avatar.png";
            }


            // -------------------------------------------------
            // ESPACE PROFESSIONNEL
            // -------------------------------------------------

            if (professional) {

                professional.style.display =
                    data.role === "professional" ||
                    data.role === "admin"
                        ? "block"
                        : "none";
            }


            // -------------------------------------------------
            // ADMINISTRATION
            // -------------------------------------------------

            if (admin) {

                admin.style.display =
                    data.role === "admin"
                        ? "block"
                        : "none";
            }


            // -------------------------------------------------
            // DÉCONNEXION
            // -------------------------------------------------

            if (logoutButton) {

                logoutButton.style.display =
                    "block";
            }
        }
    );
}

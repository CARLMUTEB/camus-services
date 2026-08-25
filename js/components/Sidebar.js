// =========================================================
// CAMU SERVICES — SIDEBAR
// =========================================================

import {
    addListener
} from "../core/store.js";

import {
    signOutUser
} from "../core/auth.js";


// =========================================================
// INITIALISATION
// =========================================================

export function initSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebar-overlay"
        );

    const menu =
        document.getElementById(
            "menu-toggle"
        );

    const logout =
        document.getElementById(
            "sidebar-logout"
        );


    if (!sidebar) {

        console.warn(
            "Sidebar introuvable."
        );

        return;
    }


    // =====================================================
    // OUVRIR
    // =====================================================

    function openSidebar() {

        sidebar.classList.add(
            "open"
        );

        if (overlay) {

            overlay.classList.add(
                "open"
            );
        }

        document.body.classList.add(
            "sidebar-open"
        );
    }


    // =====================================================
    // FERMER
    // =====================================================

    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        if (overlay) {

            overlay.classList.remove(
                "open"
            );
        }

        document.body.classList.remove(
            "sidebar-open"
        );
    }


    // =====================================================
    // BOUTON MENU
    // =====================================================

    if (menu) {

        menu.addEventListener(
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
            closeSidebar
        );
    }


    // =====================================================
    // ESC
    // =====================================================

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


    // =====================================================
    // NAVIGATION
    // =====================================================

    sidebar
        .querySelectorAll(
            "a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        closeSidebar();
                    }
                );

            }
        );


    // =====================================================
    // DÉCONNEXION
    // =====================================================

    if (logout) {

        logout.addEventListener(
            "click",
            async () => {

                logout.disabled =
                    true;

                logout.textContent =
                    "Déconnexion...";


                const result =
                    await signOutUser();


                if (
                    result.success
                ) {

                    window.location.href =
                        "connexion.html";

                } else {

                    alert(
                        result.error
                    );

                    logout.disabled =
                        false;

                    logout.innerHTML =
                        '<i class="fas fa-sign-out-alt"></i> Déconnexion';
                }

            }
        );
    }


    // =====================================================
    // UTILISATEUR
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


            if (
                !state.isAuthenticated
            ) {

                if (name)
                    name.textContent =
                        "Invité";

                if (role)
                    role.textContent =
                        "Visiteur";

                if (avatar)
                    avatar.src =
                        "assets/default-avatar.png";

                if (professional)
                    professional.style.display =
                        "none";

                if (admin)
                    admin.style.display =
                        "none";

                return;
            }


            const data =
                state.userData || {};


            if (name) {

                name.textContent =
                    data.displayName ||
                    state.user?.displayName ||
                    "Utilisateur";
            }


            const userRole =
                data.role ||
                "client";


            if (role) {

                if (
                    userRole === "admin"
                ) {

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


            if (
                avatar &&
                data.photoURL
            ) {

                avatar.src =
                    data.photoURL;
            }


            if (professional) {

                professional.style.display =
                    (
                        userRole === "professional" ||
                        userRole === "admin"
                    )
                        ? "block"
                        : "none";
            }


            if (admin) {

                admin.style.display =
                    userRole === "admin"
                        ? "block"
                        : "none";
            }

        }
    );
}
```

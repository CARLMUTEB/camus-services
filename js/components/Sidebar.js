// =========================================================
// CAMU SERVICES — SIDEBAR
// =========================================================

import { addListener } from "../core/store.js";
import { signOutUser } from "../core/auth.js";
import { router } from "../core/router.js";

export function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");

    const menu =
        document.getElementById("menu-toggle");

    const logout =
        document.getElementById("sidebar-logout");

    if (!sidebar) return;


    function openSidebar() {

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
        }

        document.body.classList.add("sidebar-open");
    }


    function closeSidebar() {

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
        }

        document.body.classList.remove("sidebar-open");
    }


    if (menu) {
        menu.addEventListener(
            "click",
            openSidebar
        );
    }


    if (overlay) {
        overlay.addEventListener(
            "click",
            closeSidebar
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeSidebar();
            }
        }
    );


    sidebar
        .querySelectorAll("[data-link]")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeSidebar
            );
        });


    if (logout) {

        logout.addEventListener(
            "click",
            async () => {

                const result =
                    await signOutUser();

                if (result.success) {

                    closeSidebar();

                    router.navigate(
                        "/connexion"
                    );
                }
            }
        );
    }


    addListener(state => {

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


        if (!state.isAuthenticated) {

            if (name) name.textContent = "Invité";

            if (role) role.textContent = "Visiteur";

            if (avatar) {
                avatar.src =
                    "assets/default-avatar.png";
            }

            if (professional) {
                professional.style.display = "none";
            }

            if (admin) {
                admin.style.display = "none";
            }

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


        if (role) {

            const userRole =
                data.role || "client";

            role.textContent =
                userRole === "admin"
                    ? "Administrateur"
                    : userRole === "professional"
                    ? "Professionnel"
                    : "Client";
        }


        if (avatar && data.photoURL) {

            avatar.src = data.photoURL;
        }


        if (professional) {

            professional.style.display =
                data.role === "professional" ||
                data.role === "admin"
                    ? "block"
                    : "none";
        }


        if (admin) {

            admin.style.display =
                data.role === "admin"
                    ? "block"
                    : "none";
        }

    });
}

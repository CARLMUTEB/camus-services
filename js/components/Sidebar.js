```javascript
// =========================================================
// CAMU SERVICES — SIDEBAR
// Version compatible Firebase + Store + navigation classique
// =========================================================

import { addListener } from "../core/store.js";
import { signOutUser } from "../core/auth.js";

export function initSidebar() {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const menu = document.getElementById("menu-toggle");
    const logout = document.getElementById("sidebar-logout");

    if (!sidebar) {
        console.warn("CAMU SERVICES : sidebar introuvable.");
        return;
    }


    // =====================================================
    // OUVRIR SIDEBAR
    // =====================================================

    function openSidebar() {

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
        }

        document.body.classList.add("sidebar-open");
    }


    // =====================================================
    // FERMER SIDEBAR
    // =====================================================

    function closeSidebar() {

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
        }

        document.body.classList.remove("sidebar-open");
    }


    // =====================================================
    // BOUTON MENU
    // =====================================================

    if (menu) {

        menu.addEventListener("click", (event) => {

            event.preventDefault();
            event.stopPropagation();

            if (sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }

        });
    }


    // =====================================================
    // OVERLAY
    // =====================================================

    if (overlay) {

        overlay.addEventListener("click", () => {
            closeSidebar();
        });
    }


    // =====================================================
    // TOUCHE ESC
    // =====================================================

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    // =====================================================
    // LIENS SIDEBAR
    // =====================================================

    sidebar
        .querySelectorAll("[data-link]")
        .forEach(link => {

            link.addEventListener("click", () => {
                closeSidebar();
            });

        });


    // =====================================================
    // DÉCONNEXION
    // =====================================================

    if (logout) {

        logout.addEventListener("click", async () => {

            logout.disabled = true;

            const oldText = logout.innerHTML;

            logout.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Déconnexion...';


            const result = await signOutUser();


            if (result.success) {

                closeSidebar();

                // Navigation classique volontairement utilisée
                // pour éviter les problèmes du router actuel.
                window.location.href = "connexion.html";

            } else {

                console.error(
                    "Erreur déconnexion :",
                    result.error
                );

                alert(
                    result.error ||
                    "Impossible de vous déconnecter."
                );

                logout.disabled = false;
                logout.innerHTML = oldText;
            }

        });
    }


    // =====================================================
    // ÉTAT UTILISATEUR
    // =====================================================

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


        // -------------------------------------------------
        // VISITEUR
        // -------------------------------------------------

        if (!state.isAuthenticated) {

            if (name) {
                name.textContent = "Invité";
            }

            if (role) {
                role.textContent = "Visiteur";
            }

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


        // -------------------------------------------------
        // UTILISATEUR CONNECTÉ
        // -------------------------------------------------

        const data =
            state.userData || {};

        const user =
            state.user || {};


        if (name) {

            name.textContent =
                data.displayName ||
                user.displayName ||
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

            } else if (userRole === "professional") {

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
                user.photoURL ||
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

    });


    console.log(
        "✅ CAMU SERVICES — Sidebar initialisée"
    );
}
```

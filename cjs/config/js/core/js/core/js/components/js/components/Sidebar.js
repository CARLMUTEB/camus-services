import {
    addListener
} from "../core/store.js";

import {
    signOutUser
} from "../core/auth.js";


export function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

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


    function openSidebar() {

        if (!sidebar) return;

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
        }

    }


    function closeSidebar() {

        if (!sidebar) return;

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
        }

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


    document
        .querySelectorAll(
            ".sidebar a"
        )
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

                    window.location.href =
                        "index.html";

                } else {

                    alert(
                        result.error
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

        const pro =
            document.getElementById(
                "sidebar-pro-link"
            );

        const admin =
            document.getElementById(
                "sidebar-admin-link"
            );


        if (
            state.isAuthenticated &&
            state.userData
        ) {

            if (name) {

                name.textContent =
                    state.userData.displayName
                    || state.user?.email
                    || "Utilisateur";

            }


            const userRole =
                state.userData.role
                || "client";


            if (role) {

                const labels = {

                    client: "Client",

                    professional:
                        "Professionnel",

                    admin:
                        "Administrateur"

                };

                role.textContent =
                    labels[userRole]
                    || "Utilisateur";

            }


            if (
                avatar &&
                state.userData.photoURL
            ) {

                avatar.src =
                    state.userData.photoURL;

            }


            if (pro) {

                pro.classList.toggle(
                    "hidden",
                    userRole !==
                    "professional" &&
                    userRole !== "admin"
                );

            }


            if (admin) {

                admin.classList.toggle(
                    "hidden",
                    userRole !== "admin"
                );

            }


            if (logout) {
                logout.style.display =
                    "flex";
            }


        } else {

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

            if (pro) {
                pro.classList.add("hidden");
            }

            if (admin) {
                admin.classList.add("hidden");
            }

            if (logout) {
                logout.style.display =
                    "none";
            }

        }

    });

}

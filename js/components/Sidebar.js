// =========================================================
// CAMU SERVICES — SIDEBAR
// =========================================================

export function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const menuToggle =
        document.getElementById("menu-toggle");

    const overlay =
        document.getElementById("sidebar-overlay");


    // -----------------------------------------------------
    // VÉRIFICATION
    // -----------------------------------------------------

    if (!sidebar) {

        console.error(
            "❌ Sidebar introuvable : #sidebar"
        );

        return;

    }


    if (!menuToggle) {

        console.error(
            "❌ Bouton Menu introuvable : #menu-toggle"
        );

        return;

    }


    // -----------------------------------------------------
    // OUVRIR
    // -----------------------------------------------------

    function openSidebar() {

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("open");
            overlay.setAttribute(
                "aria-hidden",
                "false"
            );
        }

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "sidebar-open"
        );

    }


    // -----------------------------------------------------
    // FERMER
    // -----------------------------------------------------

    function closeSidebar() {

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("open");
            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "sidebar-open"
        );

    }


    // -----------------------------------------------------
    // BASCULER
    // -----------------------------------------------------

    function toggleSidebar() {

        const isOpen =
            sidebar.classList.contains("open");

        if (isOpen) {

            closeSidebar();

        } else {

            openSidebar();

        }

    }


    // -----------------------------------------------------
    // BOUTON MENU
    // -----------------------------------------------------

    menuToggle.addEventListener(
        "click",
        toggleSidebar
    );


    // -----------------------------------------------------
    // OVERLAY
    // -----------------------------------------------------

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    // -----------------------------------------------------
    // TOUCHE ÉCHAP
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // LIENS DU MENU
    // -----------------------------------------------------

    const links =
        sidebar.querySelectorAll(
            "a"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                /*
                 * Sur mobile, le menu se ferme
                 * après sélection d'une page.
                 */

                if (
                    window.innerWidth < 1024
                ) {

                    closeSidebar();

                }

            }
        );

    });


    // -----------------------------------------------------
    // REDIMENSIONNEMENT
    // -----------------------------------------------------

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >= 1024
            ) {

                closeSidebar();

            }

        }
    );


    console.log(
        "✅ Sidebar fonctionnelle"
    );

}
```

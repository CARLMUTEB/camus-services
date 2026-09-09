// ==========================================
// CAMU SERVICES - GESTION DU MODE
// ==========================================

(function () {
    "use strict";

    const STORAGE_KEY = "camu_theme";

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);

        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }

        // Si aucun choix n'a été enregistré,
        // on suit le thème du système.
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);

        const buttons = document.querySelectorAll(
            "#themeToggle, .theme-toggle"
        );

        buttons.forEach(button => {
            const icon = button.querySelector(".theme-icon");
            const text = button.querySelector(".theme-text");

            if (theme === "dark") {
                if (icon) icon.textContent = "☀️";
                if (text) text.textContent = "Mode clair";

                button.setAttribute(
                    "aria-label",
                    "Activer le mode clair"
                );
                button.setAttribute(
                    "title",
                    "Activer le mode clair"
                );
            } else {
                if (icon) icon.textContent = "🌙";
                if (text) text.textContent = "Mode sombre";

                button.setAttribute(
                    "aria-label",
                    "Activer le mode sombre"
                );
                button.setAttribute(
                    "title",
                    "Activer le mode sombre"
                );
            }
        });
    }

    function toggleTheme() {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") ||
            getPreferredTheme();

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    }

    // Appliquer immédiatement le thème
    applyTheme(getPreferredTheme());

    // Attendre que le HTML soit chargé
    document.addEventListener("DOMContentLoaded", function () {
        applyTheme(getPreferredTheme());

        const buttons = document.querySelectorAll(
            "#themeToggle, .theme-toggle"
        );

        buttons.forEach(button => {
            button.addEventListener("click", toggleTheme);
        });
    });

    // Permet à d'autres scripts d'utiliser ces fonctions
    window.CamuTheme = {
        apply: applyTheme,
        toggle: toggleTheme,
        get: getPreferredTheme
    };
})();

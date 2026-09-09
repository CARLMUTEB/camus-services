// =========================================================
// CAMU SERVICES
// THÈME GLOBAL
// =========================================================

(function () {

    "use strict";


    const THEME_KEY =
        "camu_theme";


    // =====================================================
    // RÉCUPÉRER LE THÈME
    // =====================================================

    function getTheme() {

        const savedTheme =
            localStorage.getItem(
                THEME_KEY
            );


        if (
            savedTheme === "dark" ||
            savedTheme === "light"
        ) {

            return savedTheme;

        }


        return "light";

    }


    // =====================================================
    // APPLIQUER LE THÈME
    // =====================================================

    function applyTheme(theme) {

        if (
            theme !== "dark" &&
            theme !== "light"
        ) {

            theme = "light";

        }


        document.documentElement.setAttribute(
            "data-theme",
            theme
        );


        document.documentElement.style.colorScheme =
            theme;


    }


    // =====================================================
    // INITIALISATION IMMÉDIATE
    // =====================================================

    applyTheme(
        getTheme()
    );


    // =====================================================
    // API CAMU
    // =====================================================

    window.CamuTheme = {

        get: getTheme,

        apply: applyTheme,

        set: function (theme) {

            localStorage.setItem(
                THEME_KEY,
                theme
            );


            applyTheme(
                theme
            );

        },

        toggle: function () {

            const current =
                getTheme();


            const next =
                current === "dark"
                    ? "light"
                    : "dark";


            localStorage.setItem(
                THEME_KEY,
                next
            );


            applyTheme(
                next
            );


            return next;

        }

    };


})();

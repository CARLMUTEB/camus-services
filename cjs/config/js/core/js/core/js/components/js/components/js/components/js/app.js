import {
    initAuth
} from "./core/auth.js";

import {
    initRouter
} from "./core/router.js";

import {
    initSidebar
} from "./components/Sidebar.js";

import {
    initBottomNav
} from "./components/BottomNav.js";

import {
    initProfileButton
} from "./components/ProfileButton.js";


document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 Initialisation CAMU SERVICES..."
        );


        initAuth();

        initRouter();

        initSidebar();

        initBottomNav();

        initProfileButton();


        initHomeSearch();


        console.log(
            "✅ CAMU SERVICES démarré"
        );

    }
);


function initHomeSearch() {

    const searchButton =
        document.getElementById(
            "search-btn"
        );

    const searchInput =
        document.getElementById(
            "search-input"
        );


    if (
        !searchButton ||
        !searchInput
    ) {
        return;
    }


    function search() {

        const value =
            searchInput.value.trim();


        if (!value) {

            alert(
                "Veuillez entrer ce que vous recherchez."
            );

            return;

        }


        const params =
            new URLSearchParams();


        params.set(
            "q",
            value
        );


        const category =
            document.getElementById(
                "filter-category"
            )?.value;


        const city =
            document.getElementById(
                "filter-city"
            )?.value;


        const min =
            document.getElementById(
                "filter-price-min"
            )?.value;


        const max =
            document.getElementById(
                "filter-price-max"
            )?.value;


        if (category)
            params.set(
                "category",
                category
            );

        if (city)
            params.set(
                "city",
                city
            );

        if (min)
            params.set(
                "min",
                min
            );

        if (max)
            params.set(
                "max",
                max
            );


        window.location.href =
            "recherche.html?" +
            params.toString();

    }


    searchButton.addEventListener(
        "click",
        search
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                search();
            }

        }
    );

}

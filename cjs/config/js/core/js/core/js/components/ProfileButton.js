import {
    addListener
} from "../core/store.js";

import {
    router
} from "../core/router.js";


export function initProfileButton() {

    const button =
        document.getElementById(
            "profile-btn"
        );


    if (!button) {
        return;
    }


    addListener(state => {

        if (
            state.isAuthenticated &&
            state.userData
        ) {

            const name =
                state.userData.displayName
                || "Profil";


            button.innerHTML =
                `<i class="fas fa-user"></i>
                 <span>${escapeHtml(name)}</span>`;

        } else {

            button.innerHTML =
                `<i class="fas fa-user"></i>
                 <span>Profil</span>`;

        }

    });


    button.addEventListener(
        "click",
        () => {

            const state =
                getCurrentState();


            if (state.isAuthenticated) {

                router.navigate(
                    "profil.html"
                );

            } else {

                router.navigate(
                    "connexion.html"
                );

            }

        }
    );

}


function getCurrentState() {

    const user =
        localStorage.getItem(
            "camu_authenticated"
        );


    return {

        isAuthenticated:
            user === "true"

    };

}


function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// =========================================================
// CAMU SERVICES — BOUTON PROFIL
// =========================================================

import {
    addListener
} from "../core/store.js";

export function initProfileButton() {

    const button =
        document.getElementById(
            "profile-btn"
        );

    if (!button) return;


    addListener(
        state => {

            if (
                state.isAuthenticated
            ) {

                const name =
                    state.userData?.displayName ||
                    state.user?.displayName ||
                    "Profil";


                button.innerHTML =
                    `<i class="fas fa-user"></i> ${escapeHTML(name)}`;

            } else {

                button.innerHTML =
                    '<i class="fas fa-user"></i> Profil';
            }

        }
    );


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                stateIsConnected()
                    ? "profil.html"
                    : "connexion.html";
        }
    );
}


// =========================================================
// VÉRIFICATION SIMPLE
// =========================================================

function stateIsConnected() {

    return (
        document
            .getElementById(
                "profile-btn"
            )
            ?.dataset.authenticated ===
        "true"
    );
}


// =========================================================
// STORE → DATASET
// =========================================================

import {
    getState
} from "../core/store.js";


const originalInit =
    initProfileButton;


export function setupProfileButton() {

    const button =
        document.getElementById(
            "profile-btn"
        );

    if (!button) return;


    const update =
        state => {

            button.dataset.authenticated =
                state.isAuthenticated
                    ? "true"
                    : "false";
        };


    update(
        getState()
    );

    addListener(
        update
    );

    originalInit();
}
```

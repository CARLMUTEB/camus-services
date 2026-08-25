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

            button.innerHTML =
                state.isAuthenticated
                    ? `<i class="fas fa-user"></i> ${
                        state.userData?.displayName ||
                        state.user?.displayName ||
                        "Profil"
                    }`
                    : '<i class="fas fa-user"></i> Profil';

            button.dataset.authenticated =
                state.isAuthenticated
                    ? "true"
                    : "false";
        }
    );


    button.addEventListener(
        "click",
        () => {

            if (
                button.dataset.authenticated ===
                "true"
            ) {

                window.location.href =
                    "profil.html";

            } else {

                window.location.href =
                    "connexion.html";
            }
        }
    );
}
```

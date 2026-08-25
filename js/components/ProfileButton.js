// =========================================================
// CAMU SERVICES — BOUTON PROFIL
// =========================================================

import { addListener } from "../core/store.js";
import { router } from "../core/router.js";
import { auth } from "../config/firebase.js";

export function initProfileButton() {

    const button =
        document.getElementById("profile-btn");

    if (!button) return;


    addListener(state => {

        if (state.isAuthenticated) {

            const name =
                state.userData?.displayName ||
                state.user?.displayName ||
                "Profil";

            button.innerHTML =
                `<i class="fas fa-user"></i> ${name}`;

        } else {

            button.innerHTML =
                `<i class="fas fa-user"></i> Profil`;
        }
    });


    button.addEventListener(
        "click",
        () => {

            if (auth.currentUser) {

                router.navigate("/profil");

            } else {

                router.navigate("/connexion");
            }
        }
    );
}

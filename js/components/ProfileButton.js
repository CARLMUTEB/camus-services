// =========================================================
// CAMU SERVICES — BOUTON PROFIL
// =========================================================

import { auth } from "../config/firebase.js";


// =========================================================
// INITIALISATION
// =========================================================

export function initProfileButton() {

    const profileButton =
        document.getElementById("profile-btn");


    // -----------------------------------------------------
    // VÉRIFICATION
    // -----------------------------------------------------

    if (!profileButton) {

        console.error(
            "❌ Bouton Profil introuvable : #profile-btn"
        );

        return;

    }


    // -----------------------------------------------------
    // CLIC SUR LE PROFIL
    // -----------------------------------------------------

    profileButton.addEventListener(
        "click",
        () => {

            try {

                const user =
                    auth.currentUser;


                // -----------------------------------------
                // UTILISATEUR CONNECTÉ
                // -----------------------------------------

                if (user) {

                    window.location.href =
                        "profil.html";

                    return;

                }


                // -----------------------------------------
                // UTILISATEUR NON CONNECTÉ
                // -----------------------------------------

                window.location.href =
                    "connexion.html";

            } catch (error) {

                console.error(
                    "❌ Erreur bouton Profil :",
                    error
                );

            }

        }
    );


    console.log(
        "✅ Bouton Profil fonctionnel"
    );

}
```

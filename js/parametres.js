import { auth } from "./firebase-config.js";

import {
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =========================================================
// ÉLÉMENTS
// =========================================================

const changePasswordButton =
    document.getElementById("changePasswordButton");

const notificationsToggle =
    document.getElementById("notificationsToggle");

const languageSelect =
    document.getElementById("languageSelect");

const deleteAccountButton =
    document.getElementById("deleteAccountButton");

const logoutButton =
    document.getElementById("logoutButton");

const settingsMessage =
    document.getElementById("settingsMessage");


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message, type = "success") {

    if (!settingsMessage) {
        return;
    }

    settingsMessage.textContent = message;

    settingsMessage.classList.toggle(
        "error",
        type === "error"
    );

    settingsMessage.hidden = false;

    setTimeout(() => {

        settingsMessage.hidden = true;

    }, 5000);
}


// =========================================================
// UTILISATEUR CONNECTÉ
// =========================================================

let currentUser = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "connexion.html";

        return;
    }

    currentUser = user;

    loadSettings();

});


// =========================================================
// CHARGER LES PARAMÈTRES
// =========================================================

function loadSettings() {

    const notifications =
        localStorage.getItem(
            "camu_notifications"
        );

    if (notifications === "false") {

        notificationsToggle.checked = false;

    } else {

        notificationsToggle.checked = true;

    }


    const language =
        localStorage.getItem(
            "camu_language"
        );

    if (language) {

        languageSelect.value =
            language;

    }

}


// =========================================================
// NOTIFICATIONS
// =========================================================

if (notificationsToggle) {

    notificationsToggle.addEventListener(
        "change",
        () => {

            localStorage.setItem(
                "camu_notifications",
                notificationsToggle.checked
            );

            showMessage(
                notificationsToggle.checked
                    ? "Les notifications sont activées."
                    : "Les notifications sont désactivées."
            );

        }
    );

}


// =========================================================
// LANGUE
// =========================================================

if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        () => {

            const language =
                languageSelect.value;

            localStorage.setItem(
                "camu_language",
                language
            );

            if (language === "en") {

                showMessage(
                    "La version anglaise sera disponible prochainement."
                );

                languageSelect.value = "fr";

                localStorage.setItem(
                    "camu_language",
                    "fr"
                );

                return;
            }

            showMessage(
                "La langue française est sélectionnée."
            );

        }
    );

}


// =========================================================
// MOT DE PASSE
// =========================================================

if (changePasswordButton) {

    changePasswordButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showMessage(
                    "Vous devez être connecté.",
                    "error"
                );

                return;
            }


            if (!currentUser.email) {

                showMessage(
                    "Aucune adresse e-mail n'est associée à ce compte.",
                    "error"
                );

                return;
            }


            const confirmation =
                confirm(
                    `Un lien de réinitialisation sera envoyé à :\n\n${currentUser.email}\n\nContinuer ?`
                );


            if (!confirmation) {
                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    currentUser.email
                );

                showMessage(
                    "Le lien de modification du mot de passe a été envoyé à votre adresse e-mail."
                );

            } catch (error) {

                console.error(
                    "Erreur mot de passe :",
                    error
                );

                showMessage(
                    "Impossible d'envoyer le lien. Veuillez réessayer.",
                    "error"
                );

            }

        }
    );

}


// =========================================================
// DÉCONNEXION
// =========================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmation =
                confirm(
                    "Voulez-vous vraiment vous déconnecter ?"
                );

            if (!confirmation) {
                return;
            }


            try {

                await signOut(auth);

                window.location.href =
                    "connexion.html";

            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );

                showMessage(
                    "Impossible de vous déconnecter.",
                    "error"
                );

            }

        }
    );

}


// =========================================================
// SUPPRESSION DU COMPTE
// =========================================================

if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showMessage(
                    "Vous devez être connecté.",
                    "error"
                );

                return;
            }


            const firstConfirmation =
                confirm(
                    "ATTENTION !\n\nLa suppression de votre compte est une action importante.\n\nVoulez-vous continuer ?"
                );


            if (!firstConfirmation) {
                return;
            }


            const secondConfirmation =
                confirm(
                    "Dernière confirmation : souhaitez-vous réellement supprimer votre compte ?"
                );


            if (!secondConfirmation) {
                return;
            }


            try {

                await deleteUser(currentUser);

                localStorage.removeItem(
                    "camu_notifications"
                );

                localStorage.removeItem(
                    "camu_language"
                );

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Erreur suppression compte :",
                    error
                );


                if (
                    error.code ===
                    "auth/requires-recent-login"
                ) {

                    showMessage(
                        "Pour votre sécurité, reconnectez-vous avant de supprimer votre compte.",
                        "error"
                    );

                    return;
                }


                showMessage(
                    "Impossible de supprimer le compte pour le moment.",
                    "error"
                );

            }

        }
    );

}


// =========================================================
// MENU MOBILE
// =========================================================

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");


if (menuToggle && sidebar) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


// =========================================================
// DÉMARRAGE
// =========================================================

console.log(
    "CAMU SERVICES — parametres.js chargé."
);

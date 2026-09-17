/* =========================================================
   CAMU SERVICES — CONNEXION
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginSubmit =
    document.getElementById("loginSubmit");

const loginMessage =
    document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");

const forgotPassword =
    document.getElementById("forgotPassword");

const loginYear =
    document.getElementById("loginYear");

const loginMenuButton =
    document.getElementById("loginMenuButton");

const loginSidebar =
    document.getElementById("loginSidebar");

const loginOverlay =
    document.getElementById("loginOverlay");


/* =========================================================
   ANNÉE
========================================================= */

if (loginYear) {

    loginYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MENU MOBILE
========================================================= */

if (loginMenuButton) {

    loginMenuButton.addEventListener(
        "click",
        () => {

            loginSidebar.classList.add("open");

            loginOverlay.classList.add("open");

        }
    );

}


if (loginOverlay) {

    loginOverlay.addEventListener(
        "click",
        closeMobileMenu
    );

}


function closeMobileMenu() {

    loginSidebar.classList.remove("open");

    loginOverlay.classList.remove("open");

}


/* =========================================================
   AFFICHER / MASQUER MOT DE PASSE
========================================================= */

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                loginPassword.type === "password"
            ) {

                loginPassword.type = "text";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye-slash"></i>';

                togglePassword.setAttribute(
                    "aria-label",
                    "Masquer le mot de passe"
                );

            } else {

                loginPassword.type = "password";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye"></i>';

                togglePassword.setAttribute(
                    "aria-label",
                    "Afficher le mot de passe"
                );

            }

        }
    );

}


/* =========================================================
   CONNEXION
========================================================= */

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearMessage();


        const email =
            String(
                loginEmail.value || ""
            )
            .trim()
            .toLowerCase();


        const password =
            String(
                loginPassword.value || ""
            );


        if (!email) {

            showMessage(
                "Veuillez saisir votre adresse e-mail.",
                "error"
            );

            loginEmail.focus();

            return;
        }


        if (!password) {

            showMessage(
                "Veuillez saisir votre mot de passe.",
                "error"
            );

            loginPassword.focus();

            return;
        }


        setLoading(true);


        try {

            /* =============================================
               FIREBASE AUTH
            ============================================== */

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            /* =============================================
               RÉCUPÉRER LE PROFIL
            ============================================== */

            const userSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            let accountType =
                "client";


            let accountStatus =
                "active";


            if (userSnapshot.exists()) {

                const userData =
                    userSnapshot.data();


                accountType =
                    String(
                        userData.accountType || "client"
                    )
                    .trim()
                    .toLowerCase();


                accountStatus =
                    String(
                        userData.accountStatus || "active"
                    )
                    .trim()
                    .toLowerCase();

            }


            /* =============================================
               COMPTE PROFESSIONNEL EN ATTENTE
            ============================================== */

            if (
                accountType !== "client"
                &&
                accountStatus === "pending"
            ) {

                showMessage(
                    "Connexion réussie. Votre profil professionnel est encore en attente de validation.",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "compte.html";

                }, 1800);


                return;
            }


            /* =============================================
               SUCCÈS
            ============================================== */

            showMessage(
                "Connexion réussie. Bienvenue sur CAMU SERVICES !",
                "success"
            );


            setTimeout(() => {

                redirectUser(
                    accountType
                );

            }, 900);


        } catch (error) {

            console.error(
                "CAMU CONNEXION — erreur :",
                error
            );


            let message =
                "Impossible de vous connecter.";


            switch (error.code) {

                case "auth/invalid-credential":

                case "auth/wrong-password":

                case "auth/user-not-found":

                    message =
                        "Adresse e-mail ou mot de passe incorrect.";

                    break;


                case "auth/invalid-email":

                    message =
                        "L'adresse e-mail est invalide.";

                    break;


                case "auth/user-disabled":

                    message =
                        "Ce compte a été désactivé.";

                    break;


                case "auth/too-many-requests":

                    message =
                        "Trop de tentatives. Veuillez patienter avant de réessayer.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Problème de connexion Internet.";

                    break;

            }


            showMessage(
                message,
                "error"
            );

        } finally {

            setLoading(false);

        }

    }
);


/* =========================================================
   MOT DE PASSE OUBLIÉ
========================================================= */

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            clearMessage();


            const email =
                String(
                    loginEmail.value || ""
                )
                .trim()
                .toLowerCase();


            if (!email) {

                showMessage(
                    "Saisissez d'abord votre adresse e-mail afin de recevoir le lien de réinitialisation.",
                    "error"
                );

                loginEmail.focus();

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    "Un e-mail de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "CAMU CONNEXION — réinitialisation :",
                    error
                );


                let message =
                    "Impossible d'envoyer l'e-mail de réinitialisation.";


                if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "L'adresse e-mail est invalide.";

                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    message =
                        "Aucun compte ne correspond à cette adresse e-mail.";

                }


                showMessage(
                    message,
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   REDIRECTION
========================================================= */

function redirectUser(accountType) {

    switch (accountType) {

        case "immobilier":

            window.location.href =
                "immobilier.html";

            break;


        case "commerce":

            window.location.href =
                "commerce.html";

            break;


        case "vehicules":

            window.location.href =
                "vehicules.html";

            break;


        case "hotels":

            window.location.href =
                "hotels.html";

            break;


        case "client":

        default:

            window.location.href =
                "compte.html";

            break;

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type
) {

    loginMessage.textContent =
        message;

    loginMessage.className =
        `login-message show ${type}`;

}


function clearMessage() {

    loginMessage.textContent = "";

    loginMessage.className =
        "login-message";

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(loading) {

    loginSubmit.disabled =
        loading;


    const icon =
        loginSubmit.querySelector("i");

    const span =
        loginSubmit.querySelector("span");


    if (loading) {

        if (icon) {

            icon.className =
                "fa-solid fa-spinner fa-spin";

        }

        if (span) {

            span.textContent =
                "Connexion...";

        }

    } else {

        if (icon) {

            icon.className =
                "fa-solid fa-right-to-bracket";

        }

        if (span) {

            span.textContent =
                "Se connecter";

        }

    }

}


console.log(
    "CAMU CONNEXION — système initialisé."
);

// =========================================================
// CAMU SERVICES — CONNEXION
// Gestion des anciens et nouveaux utilisateurs
// Firebase 12.1.0
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// DOM
// =========================================================

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


// =========================================================
// ANNÉE
// =========================================================

if (loginYear) {

    loginYear.textContent =
        new Date().getFullYear();

}


// =========================================================
// MENU MOBILE
// =========================================================

if (loginMenuButton) {

    loginMenuButton.addEventListener(
        "click",
        () => {

            loginSidebar?.classList.add("open");

            loginOverlay?.classList.add("open");

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

    loginSidebar?.classList.remove("open");

    loginOverlay?.classList.remove("open");

}


// =========================================================
// AFFICHER / MASQUER MOT DE PASSE
// =========================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                loginPassword.type === "password"
            ) {

                loginPassword.type =
                    "text";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye-slash"></i>';

                togglePassword.setAttribute(
                    "aria-label",
                    "Masquer le mot de passe"
                );

            } else {

                loginPassword.type =
                    "password";

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


// =========================================================
// CONNEXION
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearMessage();


            // =================================================
            // RÉCUPÉRATION DES VALEURS
            // =================================================

            const email =
                String(
                    loginEmail?.value || ""
                )
                .trim()
                .toLowerCase();


            const password =
                String(
                    loginPassword?.value || ""
                );


            // =================================================
            // VALIDATION EMAIL
            // =================================================

            if (!email) {

                showMessage(
                    "Veuillez saisir votre adresse e-mail.",
                    "error"
                );

                loginEmail?.focus();

                return;

            }


            // =================================================
            // VALIDATION MOT DE PASSE
            // =================================================

            if (!password) {

                showMessage(
                    "Veuillez saisir votre mot de passe.",
                    "error"
                );

                loginPassword?.focus();

                return;

            }


            setLoading(true);


            try {

                // =================================================
                // FIREBASE AUTHENTICATION
                // =================================================

                console.log(
                    "CAMU CONNEXION — tentative de connexion :",
                    email
                );


                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                console.log(
                    "CAMU CONNEXION — utilisateur connecté :",
                    user.uid
                );


                // =================================================
                // RÉCUPÉRER LE PROFIL FIRESTORE
                // =================================================

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const userSnapshot =
                    await getDoc(
                        userRef
                    );


                // =================================================
                // VARIABLES PAR DÉFAUT
                // =================================================

                let accountType = "";

                let accountStatus =
                    "active";


                // =================================================
                // PROFIL EXISTANT
                // =================================================

                if (
                    userSnapshot.exists()
                ) {

                    const userData =
                        userSnapshot.data();


                    console.log(
                        "CAMU CONNEXION — profil trouvé :",
                        userData
                    );


                    accountType =
                        String(
                            userData.accountType || ""
                        )
                        .trim()
                        .toLowerCase();


                    accountStatus =
                        String(
                            userData.accountStatus ||
                            "active"
                        )
                        .trim()
                        .toLowerCase();


                } else {

                    console.warn(
                        "CAMU CONNEXION — aucun profil Firestore trouvé."
                    );

                }


                // =================================================
                // ANCIEN UTILISATEUR
                //
                // Avant la création des espaces,
                // accountType n'existait pas.
                //
                // Ces anciens utilisateurs sont maintenant
                // automatiquement basculés vers IMMOBILIER.
                // =================================================

                if (!accountType) {

                    accountType =
                        "immobilier";


                    console.log(
                        "CAMU CONNEXION — ancien utilisateur détecté."
                    );


                    console.log(
                        "CAMU CONNEXION — migration vers immobilier..."
                    );


                    try {

                        await setDoc(
                            userRef,
                            {
                                accountType:
                                    "immobilier",

                                accountStatus:
                                    accountStatus,

                                updatedAt:
                                    new Date()
                            },
                            {
                                merge: true
                            }
                        );


                        console.log(
                            "CAMU CONNEXION — ancien utilisateur migré vers immobilier."
                        );


                    } catch (migrationError) {

                        console.error(
                            "CAMU CONNEXION — erreur migration :",
                            migrationError
                        );


                        /*
                         * Même si l'écriture échoue,
                         * on garde accountType = immobilier
                         * pour cette connexion.
                         */

                    }

                }


                // =================================================
                // NORMALISATION
                // =================================================

                const allowedAccountTypes = [

                    "immobilier",

                    "commerce",

                    "vehicules",

                    "hotels",

                    "client"

                ];


                if (
                    !allowedAccountTypes.includes(
                        accountType
                    )
                ) {

                    console.warn(
                        "CAMU CONNEXION — type inconnu :",
                        accountType
                    );


                    /*
                     * Si une ancienne valeur inconnue existe,
                     * on la bascule également vers immobilier.
                     */

                    accountType =
                        "immobilier";


                    try {

                        await setDoc(
                            userRef,
                            {
                                accountType:
                                    "immobilier",

                                updatedAt:
                                    new Date()
                            },
                            {
                                merge: true
                            }
                        );


                        console.log(
                            "CAMU CONNEXION — type inconnu corrigé vers immobilier."
                        );

                    } catch (error) {

                        console.error(
                            "CAMU CONNEXION — erreur correction type :",
                            error
                        );

                    }

                }


                // =================================================
                // COMPTE PROFESSIONNEL EN ATTENTE
                // =================================================

                if (
                    accountType !== "client" &&
                    accountStatus === "pending"
                ) {

                    showMessage(
                        "Connexion réussie. Votre profil professionnel est encore en attente de validation.",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "compte.html";

                        },
                        1800
                    );


                    return;

                }


                // =================================================
                // SUCCÈS
                // =================================================

                showMessage(
                    "Connexion réussie. Bienvenue sur CAMU SERVICES !",
                    "success"
                );


                console.log(
                    "CAMU CONNEXION — espace :",
                    accountType
                );


                // =================================================
                // REDIRECTION
                // =================================================

                setTimeout(
                    () => {

                        redirectUser(
                            accountType
                        );

                    },
                    900
                );


            } catch (error) {

                console.error(
                    "CAMU CONNEXION — erreur :",
                    error
                );


                let message =
                    "Impossible de vous connecter.";


                switch (
                    error.code
                ) {

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


                    default:

                        message =
                            "Une erreur est survenue lors de la connexion.";

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

}


// =========================================================
// MOT DE PASSE OUBLIÉ
// =========================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            clearMessage();


            const email =
                String(
                    loginEmail?.value || ""
                )
                .trim()
                .toLowerCase();


            if (!email) {

                showMessage(
                    "Saisissez d'abord votre adresse e-mail afin de recevoir le lien de réinitialisation.",
                    "error"
                );

                loginEmail?.focus();

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


// =========================================================
// REDIRECTION SELON L'ESPACE
// =========================================================

function redirectUser(accountType) {

    console.log(
        "CAMU CONNEXION — redirection vers :",
        accountType
    );


    switch (
        accountType
    ) {

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


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type
) {

    if (!loginMessage) {

        return;

    }


    loginMessage.textContent =
        message;


    loginMessage.className =
        `login-message show ${type}`;

}


// =========================================================
// EFFACER MESSAGE
// =========================================================

function clearMessage() {

    if (!loginMessage) {

        return;

    }


    loginMessage.textContent =
        "";


    loginMessage.className =
        "login-message";

}


// =========================================================
// LOADING
// =========================================================

function setLoading(loading) {

    if (!loginSubmit) {

        return;

    }


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


// =========================================================
// FIN
// =========================================================

console.log(
    "CAMU CONNEXION — système initialisé avec migration des anciens utilisateurs vers Immobilier."
);

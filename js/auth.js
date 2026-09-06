// =====================================================
// CAMU SERVICES
// AUTHENTIFICATION FIREBASE
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    elementId,
    message,
    type = "error"
) {

    const element =
        document.getElementById(elementId);


    if (!element) {

        console.warn(
            "Élément introuvable :",
            elementId
        );

        return;
    }


    element.textContent =
        message;


    element.className =
        `auth-message ${type}`;


    element.style.display =
        "block";
}


// =====================================================
// ERREURS FIREBASE
// =====================================================

function getFirebaseErrorMessage(error) {

    console.error(
        "Firebase Error:",
        error
    );


    switch (error.code) {

        case "auth/invalid-credential":

        case "auth/invalid-login-credentials":

        case "auth/wrong-password":

            return "E-mail ou mot de passe incorrect.";


        case "auth/user-not-found":

            return "Aucun compte ne correspond à cette adresse e-mail.";


        case "auth/invalid-email":

            return "L'adresse e-mail n'est pas valide.";


        case "auth/email-already-in-use":

            return "Cette adresse e-mail est déjà utilisée.";


        case "auth/weak-password":

            return "Le mot de passe doit contenir au moins 6 caractères.";


        case "auth/password-does-not-meet-requirements":

            return "Le mot de passe ne respecte pas les exigences de sécurité.";


        case "auth/network-request-failed":

            return "Problème de connexion Internet.";


        case "auth/too-many-requests":

            return "Trop de tentatives. Veuillez patienter quelques minutes.";


        case "auth/user-disabled":

            return "Ce compte a été désactivé.";


        case "auth/operation-not-allowed":

            return "La connexion par e-mail n'est pas activée dans Firebase.";


        default:

            return "Une erreur est survenue. Veuillez réessayer.";
    }
}


// =====================================================
// AFFICHER / MASQUER MOT DE PASSE
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                ".password-toggle"
            );


        if (!button) return;


        const target =
            button.dataset.target;


        const input =
            document.getElementById(target);


        if (!input) return;


        const icon =
            button.querySelector("i");


        if (input.type === "password") {

            input.type =
                "text";


            if (icon) {

                icon.classList.remove(
                    "fa-eye"
                );

                icon.classList.add(
                    "fa-eye-slash"
                );
            }

        } else {

            input.type =
                "password";


            if (icon) {

                icon.classList.remove(
                    "fa-eye-slash"
                );

                icon.classList.add(
                    "fa-eye"
                );
            }
        }

    }
);


// =====================================================
// INSCRIPTION
// =====================================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "registerName"
                    )
                    ?.value
                    .trim();


            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    ?.value
                    .trim()
                    .toLowerCase();


            const phone =
                document
                    .getElementById(
                        "registerPhone"
                    )
                    ?.value
                    .trim();


            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    ?.value;


            const passwordConfirm =
                document
                    .getElementById(
                        "registerPasswordConfirm"
                    )
                    ?.value;


            const terms =
                document
                    .getElementById(
                        "registerTerms"
                    )
                    ?.checked;


            const button =
                document.getElementById(
                    "registerButton"
                );


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (
                !name ||
                !email ||
                !phone ||
                !password ||
                !passwordConfirm
            ) {

                showMessage(
                    "registerMessage",
                    "Veuillez remplir tous les champs.",
                    "error"
                );

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "registerMessage",
                    "Le mot de passe doit contenir au moins 6 caractères.",
                    "error"
                );

                return;
            }


            if (password !== passwordConfirm) {

                showMessage(
                    "registerMessage",
                    "Les deux mots de passe ne correspondent pas.",
                    "error"
                );

                return;
            }


            if (!terms) {

                showMessage(
                    "registerMessage",
                    "Veuillez accepter les conditions d'utilisation.",
                    "error"
                );

                return;
            }


            // ---------------------------------------------
            // CHARGEMENT
            // ---------------------------------------------

            if (button) {

                button.disabled =
                    true;

                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Création...
                `;
            }


            try {

                // -----------------------------------------
                // CRÉATION FIREBASE
                // -----------------------------------------

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                // -----------------------------------------
                // NOM UTILISATEUR
                // -----------------------------------------

                await updateProfile(
                    user,
                    {
                        displayName:
                            name
                    }
                );


                // -----------------------------------------
                // FIRESTORE
                // -----------------------------------------

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        uid:
                            user.uid,

                        name:
                            name,

                        email:
                            email,

                        phone:
                            phone,

                        photoURL:
                            "",

                        role:
                            "user",

                        status:
                            "active",

                        createdAt:
                            serverTimestamp()
                    }
                );


                // -----------------------------------------
                // SUCCÈS
                // -----------------------------------------

                showMessage(
                    "registerMessage",
                    "Compte créé avec succès ! Redirection...",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "compte.html";

                    },
                    1000
                );


            } catch (error) {

                showMessage(
                    "registerMessage",
                    getFirebaseErrorMessage(error),
                    "error"
                );


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML = `
                        <i class="fa-solid fa-user-plus"></i>
                        Créer mon compte
                    `;
                }

            }

        }
    );
}


// =====================================================
// CONNEXION
// =====================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            console.log(
                "CAMU SERVICES : formulaire de connexion envoyé."
            );


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    ?.value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    ?.value;


            const button =
                document.getElementById(
                    "loginButton"
                );


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (!email || !password) {

                showMessage(
                    "loginMessage",
                    "Veuillez saisir votre e-mail et votre mot de passe.",
                    "error"
                );

                return;
            }


            // ---------------------------------------------
            // CHARGEMENT
            // ---------------------------------------------

            if (button) {

                button.disabled =
                    true;

                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Connexion...</span>
                `;
            }


            try {

                console.log(
                    "Connexion Firebase en cours..."
                );


                // -----------------------------------------
                // CONNEXION
                // -----------------------------------------

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Connexion réussie :",
                    user.email
                );


                // -----------------------------------------
                // MESSAGE
                // -----------------------------------------

                showMessage(
                    "loginMessage",
                    "Connexion réussie ! Redirection...",
                    "success"
                );


                // -----------------------------------------
                // REDIRECTION
                // -----------------------------------------

                setTimeout(
                    function () {

                        window.location.href =
                            "compte.html";

                    },
                    800
                );


            } catch (error) {

                showMessage(
                    "loginMessage",
                    getFirebaseErrorMessage(error),
                    "error"
                );


                if (button) {

                    button.disabled =
                        false;

                    button.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        <span>Se connecter</span>
                    `;
                }

            }

        }
    );
}


// =====================================================
// MOT DE PASSE OUBLIÉ
// =====================================================

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const email =
                emailInput
                    ?.value
                    .trim()
                    .toLowerCase();


            if (!email) {

                showMessage(
                    "loginMessage",
                    "Veuillez d'abord saisir votre adresse e-mail.",
                    "error"
                );

                emailInput?.focus();

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    "loginMessage",
                    "Un e-mail de réinitialisation a été envoyé.",
                    "success"
                );


            } catch (error) {

                showMessage(
                    "loginMessage",
                    getFirebaseErrorMessage(error),
                    "error"
                );

            }

        }
    );
}


// =====================================================
// DÉCONNEXION
// =====================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#logoutButton, .logout-button, [data-action='logout']"
            );


        if (!button) return;


        event.preventDefault();


        try {

            await signOut(auth);

            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "Erreur de déconnexion :",
                error
            );
        }

    }
);


// =====================================================
// ÉTAT DE CONNEXION
// =====================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (user) {

            console.log(
                "CAMU SERVICES : utilisateur connecté.",
                user.email
            );

        } else {

            console.log(
                "CAMU SERVICES : aucun utilisateur connecté."
            );
        }

    }
);


// =====================================================
// CONFIRMATION DU CHARGEMENT
// =====================================================

console.log(
    "CAMU SERVICES : auth.js chargé correctement."
);

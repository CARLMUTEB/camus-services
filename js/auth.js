// =====================================================
// CAMU SERVICES
// AUTHENTIFICATION FIREBASE
// =====================================================

// Firebase
import { auth, db } from "./firebase-config.js";

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
// FONCTION : AFFICHER UN MESSAGE
// =====================================================

function showMessage(elementId, message, type = "error") {

    const element = document.getElementById(elementId);

    if (!element) {
        console.warn(
            `Élément #${elementId} introuvable.`
        );
        return;
    }

    element.textContent = message;

    element.className = `auth-message ${type}`;

    element.style.display = "block";
}


// =====================================================
// FONCTION : TRADUIRE LES ERREURS FIREBASE
// =====================================================

function firebaseErrorMessage(error) {

    console.error("Erreur Firebase :", error);

    switch (error.code) {

        case "auth/invalid-credential":
            return "E-mail ou mot de passe incorrect.";

        case "auth/invalid-login-credentials":
            return "E-mail ou mot de passe incorrect.";

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

        case "auth/internal-error":
            return "Une erreur interne est survenue. Veuillez réessayer.";

        default:
            return error.message ||
                   "Une erreur est survenue. Veuillez réessayer.";
    }
}


// =====================================================
// AFFICHER / MASQUER LE MOT DE PASSE
// =====================================================

document.addEventListener("click", (event) => {

    const button =
        event.target.closest(".password-toggle");

    if (!button) return;

    const targetId =
        button.dataset.target;

    if (!targetId) return;

    const input =
        document.getElementById(targetId);

    if (!input) return;


    if (input.type === "password") {

        input.type = "text";

        const icon =
            button.querySelector("i");

        if (icon) {

            icon.classList.remove(
                "fa-eye"
            );

            icon.classList.add(
                "fa-eye-slash"
            );
        }

    } else {

        input.type = "password";

        const icon =
            button.querySelector("i");

        if (icon) {

            icon.classList.remove(
                "fa-eye-slash"
            );

            icon.classList.add(
                "fa-eye"
            );
        }
    }

});


// =====================================================
// INSCRIPTION
// =====================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // -------------------------------------------------
            // RÉCUPÉRATION DES CHAMPS
            // -------------------------------------------------

            const name =
                document
                    .getElementById("registerName")
                    ?.value
                    .trim();

            const email =
                document
                    .getElementById("registerEmail")
                    ?.value
                    .trim()
                    .toLowerCase();

            const phone =
                document
                    .getElementById("registerPhone")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("registerPassword")
                    ?.value;

            const passwordConfirm =
                document
                    .getElementById("registerPasswordConfirm")
                    ?.value;

            // IMPORTANT :
            // ton HTML utilise registerTerms
            const terms =
                document
                    .getElementById("registerTerms")
                    ?.checked;

            const button =
                document.getElementById(
                    "registerButton"
                );


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

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
                    "Veuillez accepter les conditions d'utilisation et la politique de confidentialité.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // BOUTON : CHARGEMENT
            // -------------------------------------------------

            if (button) {

                button.disabled = true;

                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Création...
                `;
            }


            try {

                console.log(
                    "Création du compte Firebase..."
                );


                // -------------------------------------------------
                // CRÉER LE COMPTE FIREBASE
                // -------------------------------------------------

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Compte Firebase créé :",
                    user.uid
                );


                // -------------------------------------------------
                // AJOUTER LE NOM
                // -------------------------------------------------

                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                // -------------------------------------------------
                // CRÉER LE PROFIL FIRESTORE
                // -------------------------------------------------

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        uid: user.uid,
                        name: name,
                        email: email,
                        phone: phone,
                        photoURL: "",
                        role: "user",
                        status: "active",
                        createdAt: serverTimestamp()
                    }
                );


                console.log(
                    "Profil Firestore créé."
                );


                // -------------------------------------------------
                // SUCCÈS
                // -------------------------------------------------

                showMessage(
                    "registerMessage",
                    "Compte créé avec succès ! Redirection...",
                    "success"
                );


                // -------------------------------------------------
                // REDIRECTION
                // -------------------------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    1000
                );


            } catch (error) {

                showMessage(
                    "registerMessage",
                    firebaseErrorMessage(error),
                    "error"
                );


                // Réactiver le bouton

                if (button) {

                    button.disabled = false;

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
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // -------------------------------------------------
            // RÉCUPÉRER LES INFORMATIONS
            // -------------------------------------------------

            const email =
                document
                    .getElementById("loginEmail")
                    ?.value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("loginPassword")
                    ?.value;

            const button =
                document.getElementById(
                    "loginButton"
                );


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (!email || !password) {

                showMessage(
                    "loginMessage",
                    "Veuillez saisir votre e-mail et votre mot de passe.",
                    "error"
                );

                return;
            }


            // -------------------------------------------------
            // CHARGEMENT
            // -------------------------------------------------

            if (button) {

                button.disabled = true;

                button.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Connexion...
                `;
            }


            try {

                console.log(
                    "Tentative de connexion Firebase..."
                );


                // -------------------------------------------------
                // CONNEXION FIREBASE
                // -------------------------------------------------

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


                // -------------------------------------------------
                // MESSAGE
                // -------------------------------------------------

                showMessage(
                    "loginMessage",
                    "Connexion réussie ! Redirection...",
                    "success"
                );


                // -------------------------------------------------
                // REDIRECTION
                // -------------------------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "compte.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Échec de connexion :",
                    error
                );


                showMessage(
                    "loginMessage",
                    firebaseErrorMessage(error),
                    "error"
                );


                // Réactiver le bouton

                if (button) {

                    button.disabled = false;

                    button.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Se connecter
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
        async (event) => {

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


            // -------------------------------------------------
            // VÉRIFICATION EMAIL
            // -------------------------------------------------

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
                    firebaseErrorMessage(error),
                    "error"
                );

            }

        }
    );
}


// =====================================================
// DÉCONNEXION
// =====================================================

const logoutButtons =
    document.querySelectorAll(
        "#logoutButton, .logout-button, [data-action='logout']"
    );


logoutButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();


                try {

                    await signOut(auth);


                    console.log(
                        "Utilisateur déconnecté."
                    );


                    window.location.href =
                        "index.html";


                } catch (error) {

                    console.error(
                        "Erreur lors de la déconnexion :",
                        error
                    );

                }

            }
        );

    }
);


// =====================================================
// SURVEILLER L'ÉTAT DE CONNEXION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            console.log(
                "Utilisateur actuellement connecté :",
                user.email
            );

        } else {

            console.log(
                "Aucun utilisateur connecté."
            );
        }

    }
);


// =====================================================
// TEST DE CHARGEMENT
// =====================================================

console.log(
    "CAMU SERVICES : auth.js chargé correctement."
);

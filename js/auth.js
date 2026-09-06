// =====================================================
// CAMU SERVICES - AUTHENTIFICATION FIREBASE
// =====================================================

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
// MESSAGES
// =====================================================

function showMessage(elementId, message, type = "error") {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.className = `auth-message ${type}`;
    element.style.display = "block";
}


// =====================================================
// TRADUCTION DES ERREURS FIREBASE
// =====================================================

function firebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "E-mail ou mot de passe incorrect.";

        case "auth/invalid-email":
            return "L'adresse e-mail n'est pas valide.";

        case "auth/email-already-in-use":
            return "Cette adresse e-mail est déjà utilisée.";

        case "auth/weak-password":
            return "Le mot de passe doit contenir au moins 6 caractères.";

        case "auth/network-request-failed":
            return "Problème de connexion Internet.";

        case "auth/too-many-requests":
            return "Trop de tentatives. Veuillez patienter quelques minutes.";

        case "auth/user-disabled":
            return "Ce compte a été désactivé.";

        default:
            console.error("Erreur Firebase :", error);
            return "Une erreur est survenue. Veuillez réessayer.";
    }
}


// =====================================================
// AFFICHER / CACHER MOT DE PASSE
// =====================================================

document.addEventListener("click", (event) => {

    const button = event.target.closest(".password-toggle");

    if (!button) return;

    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) return;

    if (input.type === "password") {

        input.type = "text";

        const icon = button.querySelector("i");

        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }

    } else {

        input.type = "password";

        const icon = button.querySelector("i");

        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
});


// =====================================================
// INSCRIPTION
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name = document
            .getElementById("registerName")
            ?.value.trim();

        const email = document
            .getElementById("registerEmail")
            ?.value.trim();

        const phone = document
            .getElementById("registerPhone")
            ?.value.trim();

        const password = document
            .getElementById("registerPassword")
            ?.value;

        const passwordConfirm = document
            .getElementById("registerPasswordConfirm")
            ?.value;

        const terms = document
            .getElementById("acceptTerms")
            ?.checked;

        const button = document.getElementById("registerButton");


        // Vérifications
        if (!name || !email || !phone || !password || !passwordConfirm) {

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


        try {

            if (button) {
                button.disabled = true;
                button.innerHTML = `
                    <span>Création...</span>
                    <i class="fa-solid fa-spinner fa-spin"></i>
                `;
            }


            // Création du compte Firebase
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // Ajouter le nom dans Firebase Authentication
            await updateProfile(user, {
                displayName: name
            });


            // Créer le profil dans Firestore
            await setDoc(
                doc(db, "users", user.uid),
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


            showMessage(
                "registerMessage",
                "Compte créé avec succès ! Redirection...",
                "success"
            );


            // Redirection
            setTimeout(() => {
                window.location.href = "compte.html";
            }, 1200);


        } catch (error) {

            showMessage(
                "registerMessage",
                firebaseErrorMessage(error),
                "error"
            );


            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <span>Créer mon compte</span>
                    <i class="fa-solid fa-user-plus"></i>
                `;
            }
        }

    });
}


// =====================================================
// CONNEXION
// =====================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email = document
            .getElementById("loginEmail")
            ?.value.trim();

        const password = document
            .getElementById("loginPassword")
            ?.value;

        const button = document.getElementById("loginButton");


        if (!email || !password) {

            showMessage(
                "loginMessage",
                "Veuillez saisir votre e-mail et votre mot de passe.",
                "error"
            );

            return;
        }


        try {

            if (button) {
                button.disabled = true;

                button.innerHTML = `
                    <span>Connexion...</span>
                    <i class="fa-solid fa-spinner fa-spin"></i>
                `;
            }


            // Connexion Firebase
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            showMessage(
                "loginMessage",
                "Connexion réussie ! Redirection...",
                "success"
            );


            // Aller vers Mon compte
            setTimeout(() => {
                window.location.href = "compte.html";
            }, 800);


        } catch (error) {

            showMessage(
                "loginMessage",
                firebaseErrorMessage(error),
                "error"
            );


            if (button) {

                button.disabled = false;

                button.innerHTML = `
                    <span>Se connecter</span>
                    <i class="fa-solid fa-arrow-right"></i>
                `;
            }
        }

    });
}


// =====================================================
// MOT DE PASSE OUBLIÉ
// =====================================================

const forgotPassword =
    document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", async (event) => {

        event.preventDefault();

        const emailInput =
            document.getElementById("loginEmail");

        const email =
            emailInput?.value.trim();


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

    });
}


// =====================================================
// DÉCONNEXION
// =====================================================

const logoutButtons =
    document.querySelectorAll(
        "#logoutButton, .logout-button, [data-action='logout']"
    );

logoutButtons.forEach((button) => {

    button.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            await signOut(auth);

            window.location.href = "index.html";

        } catch (error) {

            console.error(
                "Erreur lors de la déconnexion :",
                error
            );
        }

    });

});


// =====================================================
// SURVEILLER L'ÉTAT DE CONNEXION
// =====================================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        console.log(
            "Utilisateur connecté :",
            user.email
        );

    } else {

        console.log(
            "Aucun utilisateur connecté."
        );
    }

});

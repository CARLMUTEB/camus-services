// js/auth.js

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


// ======================================================
// AFFICHAGE DES MESSAGES
// ======================================================

function showAuthMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.className = `auth-message ${type}`;
  element.style.display = "block";
}


// ======================================================
// TRADUCTION DES ERREURS FIREBASE
// ======================================================

function getFirebaseErrorMessage(error) {

  switch (error.code) {

    case "auth/email-already-in-use":
      return "Cette adresse e-mail est déjà utilisée.";

    case "auth/invalid-email":
      return "L'adresse e-mail n'est pas valide.";

    case "auth/weak-password":
      return "Le mot de passe est trop faible. Utilisez au moins 6 caractères.";

    case "auth/invalid-credential":
      return "E-mail ou mot de passe incorrect.";

    case "auth/user-not-found":
      return "Aucun compte ne correspond à cette adresse e-mail.";

    case "auth/wrong-password":
      return "Mot de passe incorrect.";

    case "auth/too-many-requests":
      return "Trop de tentatives. Veuillez patienter quelques instants.";

    case "auth/network-request-failed":
      return "Problème de connexion Internet.";

    case "auth/user-disabled":
      return "Ce compte a été désactivé.";

    default:
      console.error(error);
      return "Une erreur est survenue. Veuillez réessayer.";
  }
}


// ======================================================
// AFFICHER / MASQUER LE MOT DE PASSE
// ======================================================

document.querySelectorAll(".password-toggle").forEach(button => {

  button.addEventListener("click", () => {

    const inputId = button.dataset.target;
    const input = document.getElementById(inputId);

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      input.type = "password";
      button.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }

  });

});


// ======================================================
// INSCRIPTION
// ======================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document
      .getElementById("registerName")
      .value
      .trim();

    const email = document
      .getElementById("registerEmail")
      .value
      .trim()
      .toLowerCase();

    const phone = document
      .getElementById("registerPhone")
      .value
      .trim();

    const password = document
      .getElementById("registerPassword")
      .value;

    const passwordConfirm = document
      .getElementById("registerPasswordConfirm")
      .value;

    const acceptTerms = document
      .getElementById("acceptTerms")
      .checked;

    const message = document.getElementById("registerMessage");
    const button = document.getElementById("registerButton");


    // -----------------------------
    // VALIDATIONS
    // -----------------------------

    if (!name || !email || !phone || !password || !passwordConfirm) {

      showAuthMessage(
        message,
        "Veuillez remplir tous les champs.",
        "error"
      );

      return;
    }


    if (password.length < 6) {

      showAuthMessage(
        message,
        "Le mot de passe doit contenir au moins 6 caractères.",
        "error"
      );

      return;
    }


    if (password !== passwordConfirm) {

      showAuthMessage(
        message,
        "Les deux mots de passe ne correspondent pas.",
        "error"
      );

      return;
    }


    if (!acceptTerms) {

      showAuthMessage(
        message,
        "Vous devez accepter les CGU et la politique de confidentialité.",
        "error"
      );

      return;
    }


    // -----------------------------
    // BOUTON EN CHARGEMENT
    // -----------------------------

    button.disabled = true;
    button.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Création du compte...';


    try {

      // -----------------------------
      // CRÉATION DU COMPTE FIREBASE
      // -----------------------------

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;


      // -----------------------------
      // NOM DE L'UTILISATEUR
      // -----------------------------

      await updateProfile(user, {
        displayName: name
      });


      // -----------------------------
      // PROFIL PRIVÉ DANS FIRESTORE
      // -----------------------------

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


      // -----------------------------
      // SUCCÈS
      // -----------------------------

      showAuthMessage(
        message,
        "Compte créé avec succès ! Redirection...",
        "success"
      );


      setTimeout(() => {

        window.location.href = "../index.html";

      }, 1200);


    } catch (error) {

      showAuthMessage(
        message,
        getFirebaseErrorMessage(error),
        "error"
      );

      button.disabled = false;

      button.innerHTML =
        '<i class="fa-solid fa-user-plus"></i> Créer mon compte';

    }

  });

}


// ======================================================
// CONNEXION
// ======================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value
      .trim()
      .toLowerCase();

    const password = document
      .getElementById("loginPassword")
      .value;

    const message = document.getElementById("loginMessage");
    const button = document.getElementById("loginButton");


    if (!email || !password) {

      showAuthMessage(
        message,
        "Veuillez remplir tous les champs.",
        "error"
      );

      return;
    }


    button.disabled = true;

    button.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


      showAuthMessage(
        message,
        "Connexion réussie ! Redirection...",
        "success"
      );


      setTimeout(() => {

        window.location.href = "../index.html";

      }, 800);


    } catch (error) {

      showAuthMessage(
        message,
        getFirebaseErrorMessage(error),
        "error"
      );

      button.disabled = false;

      button.innerHTML =
        '<i class="fa-solid fa-right-to-bracket"></i> Se connecter';

    }

  });

}


// ======================================================
// MOT DE PASSE OUBLIÉ
// ======================================================

const forgotPassword =
  document.getElementById("forgotPassword");

if (forgotPassword) {

  forgotPassword.addEventListener("click", async (event) => {

    event.preventDefault();

    const emailInput =
      document.getElementById("loginEmail");

    const message =
      document.getElementById("loginMessage");

    const email =
      emailInput.value.trim().toLowerCase();


    if (!email) {

      showAuthMessage(
        message,
        "Entrez d'abord votre adresse e-mail.",
        "error"
      );

      emailInput.focus();

      return;
    }


    try {

      await sendPasswordResetEmail(
        auth,
        email
      );


      showAuthMessage(
        message,
        "Un e-mail de réinitialisation vient d'être envoyé.",
        "success"
      );


    } catch (error) {

      showAuthMessage(
        message,
        getFirebaseErrorMessage(error),
        "error"
      );

    }

  });

}


// ======================================================
// DÉCONNEXION
// ======================================================

const logoutButton =
  document.getElementById("logoutBtn");

if (logoutButton) {

  logoutButton.addEventListener("click", async (event) => {

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

}


// ======================================================
// SURVEILLER L'ÉTAT DE CONNEXION
// ======================================================

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

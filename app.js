/* =========================================================
   CAMU SERVICES — FIREBASE
   Configuration centrale de l'application
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};


/* =========================================================
   INITIALISATION
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   EXPORTS
   ========================================================= */

export {
  app,
  auth,
  db,
  signOut,
  onAuthStateChanged
};


/* =========================================================
   THÈME
   ========================================================= */

function appliquerTheme() {

  const theme =
    localStorage.getItem("camu_theme");

  if (theme === "dark") {

    document.documentElement.classList.add("dark-mode");

  } else {

    document.documentElement.classList.remove("dark-mode");

  }

}


/* =========================================================
   LANGUE
   ========================================================= */

function appliquerLangue() {

  const language =
    localStorage.getItem("camu_language");

  if (language) {

    document.documentElement.lang =
      language;

  }

}


appliquerTheme();
appliquerLangue();


/* =========================================================
   UTILISATEUR COURANT
   ========================================================= */

export function getCurrentUser() {

  return auth.currentUser;

}


export function isUserConnected() {

  return !!auth.currentUser;

}


/* =========================================================
   ÉTAT AUTHENTIFICATION GLOBAL
   ========================================================= */

onAuthStateChanged(auth, user => {

  window.camuCurrentUser =
    user || null;


  document.dispatchEvent(
    new CustomEvent(
      "camu-auth-changed",
      {
        detail: {
          user: user || null
        }
      }
    )
  );

});


/* =========================================================
   DÉCONNEXION
   ========================================================= */

window.camuLogout = async function () {

  try {

    await signOut(auth);

    window.location.href =
      "profil.html";

  } catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

    alert(
      "Impossible de se déconnecter. Veuillez réessayer."
    );

  }

};


/* =========================================================
   OBJET GLOBAL CAMU
   ========================================================= */

window.CAMU = {

  app,

  auth,

  db,

  getCurrentUser,

  isUserConnected,

  logout: window.camuLogout

};


/* =========================================================
   FIN APP.JS
   ========================================================= */

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

    document.documentElement.classList.add(
      "dark-mode"
    );

  } else {

    document.documentElement.classList.remove(
      "dark-mode"
    );

  }

}

appliquerTheme();


/* =========================================================
   LANGUE
   ========================================================= */

function appliquerLangue() {

  const language =
    localStorage.getItem("camu_language");

  if (language) {

    document.documentElement.lang =
      language;

  } else {

    document.documentElement.lang =
      "fr";

  }

}

appliquerLangue();


/* =========================================================
   UTILITAIRE — UTILISATEUR CONNECTÉ
   ========================================================= */

export function getCurrentUser() {

  return auth.currentUser;

}


/* =========================================================
   UTILITAIRE — VÉRIFIER LA CONNEXION
   ========================================================= */

export function isUserConnected() {

  return !!auth.currentUser;

}


/* =========================================================
   ÉTAT D'AUTHENTIFICATION GLOBAL
   ========================================================= */

onAuthStateChanged(
  auth,
  (user) => {

    window.camuCurrentUser =
      user || null;


    /*
     * Événement global pour les autres pages
     */

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


    /*
     * Événement supplémentaire pour
     * les pages qui veulent écouter Firebase
     */

    document.dispatchEvent(
      new CustomEvent(
        "camu-user-ready",
        {
          detail: {
            user: user || null
          }
        }
      )
    );

  }
);


/* =========================================================
   DÉCONNEXION
   ========================================================= */

window.camuLogout = async function () {

  try {

    await signOut(auth);

    console.log(
      "CAMU SERVICES : utilisateur déconnecté."
    );


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
   CAMU GLOBAL
   ========================================================= */

window.CAMU = {

  app,

  auth,

  db,

  getCurrentUser,

  isUserConnected,

  logout:
    window.camuLogout

};


/* =========================================================
   FONCTIONS THÈME DISPONIBLES PARTOUT
   ========================================================= */

window.camuSetTheme = function(theme) {

  if (
    theme !== "dark" &&
    theme !== "light"
  ) {

    return;

  }


  localStorage.setItem(
    "camu_theme",
    theme
  );


  appliquerTheme();


  document.dispatchEvent(
    new CustomEvent(
      "camu-theme-changed",
      {
        detail: {
          theme
        }
      }
    )
  );

};


/* =========================================================
   FONCTIONS LANGUE DISPONIBLES PARTOUT
   ========================================================= */

window.camuSetLanguage = function(language) {

  if (!language) {

    return;

  }


  localStorage.setItem(
    "camu_language",
    language
  );


  appliquerLangue();


  document.dispatchEvent(
    new CustomEvent(
      "camu-language-changed",
      {
        detail: {
          language
        }
      }
    )
  );

};


/* =========================================================
   FIN APP.JS
   ========================================================= */

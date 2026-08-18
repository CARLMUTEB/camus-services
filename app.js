/**
 * CAMU SERVICES
 * Application : Marketplace de services locaux
 * Version : 1.0
 *
 * Fichier central Firebase
 */

// =====================================================
// IMPORTS FIREBASE
// =====================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// =====================================================
// CONFIGURATION FIREBASE
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};


// =====================================================
// INITIALISATION FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =====================================================
// UTILISATEUR CONNECTÉ
// =====================================================

let currentUser = null;

onAuthStateChanged(auth, (user) => {

  currentUser = user;

  if (user) {

    console.log(
      "Utilisateur connecté :",
      user.uid
    );

  } else {

    console.log(
      "Aucun utilisateur connecté."
    );

  }

});


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  const navLinks =
    document.querySelectorAll(".bottom-nav a");

  navLinks.forEach((link) => {

    const href = link.getAttribute("href");

    if (!href) return;

    const cleanHref =
      href.split("?")[0];

    if (cleanHref === currentPage) {

      link.classList.add("active");

    }

  });

}


// =====================================================
// INITIALISATION APPLICATION
// =====================================================

function initApp() {

  console.log(
    "CAMU SERVICES — Application initialisée"
  );

  setupNavigation();

}


// =====================================================
// DOM READY
// =====================================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

} else {

  initApp();

}


// =====================================================
// EXPORTS
// =====================================================

export {
  app,
  auth,
  db,
  currentUser
};

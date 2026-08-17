/**
 * CAMU SERVICES
 * Application : Marketplace de services locaux
 * Version : 1.0
 *
 * Fichier central Firebase
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth
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
// INITIALISATION
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  const navLinks =
    document.querySelectorAll(".nav-item");

  navLinks.forEach((link) => {

    const href = link.getAttribute("href");

    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {

      link.classList.add("active");

    }

  });

}


// =====================================================
// INITIALISATION APPLICATION
// =====================================================

function initApp() {

  console.log("CAMU SERVICES — Application initialisée");

  setupNavigation();

}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  initApp
);


// =====================================================
// EXPORTS
// =====================================================

export {
  app,
  auth,
  db
};

/**
 * App.js - Point d'entrée pour CAMU SERVICES
 * Application : Marketplace de services locaux
 * Slogan : TROUVER . ACHETER . RÉSERVER
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportation des instances pour utilisation dans les autres pages
export { db, auth };

/**
 * Fonctions utilitaires globales pour l'interface
 */
const App = {
  // Initialisation des listeners de navigation ou éléments UI communs
  init: () => {
    console.log("CAMU SERVICES Initialisé");
    App.setupNavigationHighlights();
  },

  // Highlight de la navigation active basée sur l'URL actuelle
  setupNavigationHighlights: () => {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === "" && href === "index.html")) {
        link.classList.add('active');
      }
    });
  }
};

// Lancer l'app au chargement du DOM
document.addEventListener('DOMContentLoaded', App.init);

export default App;

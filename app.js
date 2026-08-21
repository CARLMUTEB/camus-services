/* =========================================================
   CAMU SERVICES — FIREBASE
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
  getFirestore,
  collection,
  getDocs
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
   GESTION DE L'AFFICHAGE ET DE LA CONNEXION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('services-container');

  // Écouteur d'état de connexion en temps réel
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // L'utilisateur est connecté : on peut charger les services
      if (container) {
        container.innerHTML = "<p>Chargement des services en cours...</p>";
      }
      chargerServices();
    } else {
      // L'utilisateur N'EST PAS connecté : on affiche votre message personnalisé
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; background: #fff; border-radius: 8px; margin: 20px auto; max-width: 400px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px; font-weight: 500;">Connectez-vous ou créez un compte pour continuer</p>
            <div>
              <a href="login.html" style="background: #e53935; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Se connecter</a>
            </div>
          </div>
        `;
      }
    }
  });
});

// Fonction pour récupérer vos services depuis Firestore (quand l'utilisateur est connecté)
async function chargerServices() {
  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    const container = document.getElementById('services-container');
    
    if (querySnapshot.empty) {
      container.innerHTML = "<p style='text-align:center; padding:20px;'>Aucun service disponible pour le moment.</p>";
      return;
    }

    let htmlContent = "";
    querySnapshot.forEach((doc) => {
      const service = doc.data();
      // Adaptez selon les champs de votre base de données (ex: titre, description)
      htmlContent += `
        <div style="background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3>${service.titre || 'Service'}</h3>
          <p>${service.description || ''}</p>
        </div>
      `;
    });
    
    container.innerHTML = htmlContent;
  } catch (error) {
    console.error("Erreur lors du chargement des services :", error);
  }
}


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

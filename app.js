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
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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
   CHARGEMENT DES ANNONCES DEPUIS FIREBASE (TAILLE PROPRE)
   ========================================================= */

async function chargerAnnoncesFirebase() {
  const container = document.getElementById("servicesContainer");
  if (!container) return;

  try {
    // Requête pour récupérer les services/annonces depuis Firestore
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p style='text-align:center; grid-column: 1/-1; padding: 20px;'>Aucune annonce pour le moment.</p>";
      return;
    }

    let htmlContent = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Structure de carte propre et compacte pour mobile
      htmlContent += `
        <article class="annonce-card service-card" data-category="${data.categorie || ''}">
          <div class="service-image">
            ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.titre || ''}" style="width:100%; height:100%; object-fit:cover;">` : `
            <div class="service-placeholder">
              <i class="fa-solid fa-store"></i>
            </div>`}
            <span class="featured-badge">
              <i class="fa-solid fa-star"></i> Sponsorisé
            </span>
          </div>

          <div class="service-card-content">
            <span class="badge-cat">${data.categorie || 'Service'}</span>
            <h3>${data.titre || 'Nom de l\'entreprise'}</h3>
            <p class="service-description">${data.description || 'Aucune description disponible.'}</p>
            
            <p class="location">
              <i class="fa-solid fa-location-dot"></i> ${data.localisation || 'Disponible localement'}
            </p>

            <div class="service-footer">
              <span class="service-status">
                <i class="fa-solid fa-circle"></i> Disponible
              </span>
              <span class="rating">
                <i class="fa-solid fa-star"></i> ${data.note || '4.8'}
              </span>
            </div>

            <div class="card-actions">
              <a href="entreprise.html?id=${doc.id}" class="btn-primary">Voir le profil</a>
              <button type="button" class="favorite-btn" aria-label="Ajouter aux favoris">
                <i class="fa-regular fa-heart"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    container.innerHTML = htmlContent;

  } catch (error) {
    console.error("Erreur lors du chargement des annonces Firebase :", error);
    container.innerHTML = "<p style='text-align:center; grid-column: 1/-1; padding: 20px;'>Erreur de chargement des données.</p>";
  }
}

// Lancer le chargement dès que le DOM est prêt
document.addEventListener("DOMContentLoaded", chargerAnnoncesFirebase);


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

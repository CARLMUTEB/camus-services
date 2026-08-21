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
  orderBy,
  limit
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
   RENDRE FIREBASE DISPONIBLE PARTOUT
   ========================================================= */

window.db = db;


/* =========================================================
   UTILITAIRE — PROTECTION HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

  document.documentElement.lang =
    language || "fr";

}

appliquerLangue();


/* =========================================================
   UTILISATEUR CONNECTÉ
   ========================================================= */

export function getCurrentUser() {

  return auth.currentUser;

}


/* =========================================================
   VÉRIFIER LA CONNEXION
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
   FORMATAGE DATE
   ========================================================= */

function formaterDate(value) {

  if (!value) {
    return "";
  }

  try {

    let date;

    if (
      value &&
      typeof value.toDate === "function"
    ) {

      date = value.toDate();

    } else if (
      value instanceof Date
    ) {

      date = value;

    } else if (
      typeof value === "number"
    ) {

      date = new Date(value);

    } else {

      date = new Date(value);

    }

    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  } catch (error) {

    return "";

  }

}


/* =========================================================
   CHARGEMENT DES COMMUNIQUÉS FIREBASE
   ========================================================= */

async function chargerCommuniquesFirebase() {

  const container =
    document.getElementById(
      "communiquesContainer"
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="announcement-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      Chargement des communiqués...
    </div>
  `;


  try {

    const communiquesRef =
      collection(
        db,
        "communiques"
      );


    let snapshot;


    /*
     * Première tentative :
     * tri par date décroissante.
     */

    try {

      const q =
        query(
          communiquesRef,
          orderBy("date", "desc"),
          limit(10)
        );

      snapshot =
        await getDocs(q);

    } catch (error) {

      /*
       * Si certains documents n'ont pas de champ date
       * ou si l'index Firestore manque, on récupère
       * simplement les documents.
       */

      console.warn(
        "Tri par date impossible, récupération simple :",
        error
      );

      const q =
        query(
          communiquesRef,
          limit(10)
        );

      snapshot =
        await getDocs(q);

    }


    /* =====================================================
       AUCUN COMMUNIQUÉ
       ===================================================== */

    if (snapshot.empty) {

      container.innerHTML = `
        <div class="announcement-empty">

          <i class="fa-solid fa-bullhorn"></i>

          <h3>
            Aucun communiqué
          </h3>

          <p>
            Aucun communiqué n'est disponible pour le moment.
          </p>

        </div>
      `;

      return;

    }


    /* =====================================================
       CRÉATION DES CARTES
       ===================================================== */

    let html = "";


    snapshot.forEach(
      (docSnap) => {

        const data =
          docSnap.data();


        const titre =
          data.titre ||
          data.title ||
          data.nom ||
          "Communiqué";


        const contenu =
          data.contenu ||
          data.message ||
          data.description ||
          data.texte ||
          "";


        const type =
          data.type ||
          data.categorie ||
          "Information";


        const date =
          formaterDate(
            data.date ||
            data.createdAt ||
            data.timestamp
          );


        html += `

          <article
            class="announcement-box"
            data-communique-id="${escapeHTML(docSnap.id)}"
          >

            <div class="announcement-icon">

              <i class="fa-solid fa-bullhorn"></i>

            </div>


            <div class="announcement-content">

              <span class="announcement-label">
                ${escapeHTML(type)}
              </span>


              <h3>
                ${escapeHTML(titre)}
              </h3>


              <p>
                ${escapeHTML(contenu)}
              </p>


              ${
                date
                  ? `
                    <div class="announcement-date">

                      <i class="fa-regular fa-calendar"></i>

                      ${escapeHTML(date)}

                    </div>
                  `
                  : ""
              }

            </div>

          </article>

        `;

      }
    );


    container.innerHTML =
      html;


    /*
     * Informe index.html que les communiqués
     * sont maintenant disponibles.
     */

    document.dispatchEvent(
      new CustomEvent(
        "camu-communiques-loaded"
      )
    );


  } catch (error) {

    console.error(
      "Erreur lors du chargement des communiqués :",
      error
    );


    container.innerHTML = `

      <div class="announcement-error">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Impossible de charger les communiqués.
        </strong>

        <p>
          Vérifiez la connexion à Firebase
          et les règles Firestore.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   CHARGEMENT DES SERVICES / ENTREPRISES
   ========================================================= */

async function chargerAnnoncesFirebase() {

  const container =
    document.getElementById(
      "servicesContainer"
    );

  if (!container) {
    return;
  }


  try {

    const servicesRef =
      collection(
        db,
        "services"
      );


    let snapshot;


    try {

      const q =
        query(
          servicesRef,
          orderBy(
            "createdAt",
            "desc"
          )
        );

      snapshot =
        await getDocs(q);

    } catch (error) {

      console.warn(
        "Tri des services impossible, récupération simple :",
        error
      );

      const q =
        query(
          servicesRef
        );

      snapshot =
        await getDocs(q);

    }


    if (snapshot.empty) {

      container.innerHTML = `
        <p
          style="
            text-align:center;
            grid-column:1/-1;
            padding:20px;
          "
        >
          Aucune annonce pour le moment.
        </p>
      `;

      document.dispatchEvent(
        new CustomEvent(
          "camu-services-loaded"
        )
      );

      return;

    }


    let htmlContent =
      "";


    snapshot.forEach(
      (docSnap) => {

        const data =
          docSnap.data();


        const categorie =
          data.categorie ||
          data.category ||
          "Services";


        const titre =
          data.titre ||
          data.nom ||
          data.title ||
          "Nom de l'entreprise";


        const description =
          data.description ||
          "Aucune description disponible.";


        const localisation =
          data.localisation ||
          data.location ||
          "Disponible localement";


        const note =
          data.note ||
          data.rating ||
          "4.8";


        const imageUrl =
          data.imageUrl ||
          data.image ||
          "";


        const searchText =
          `
            ${categorie}
            ${titre}
            ${description}
            ${localisation}
          `
            .toLowerCase();


        htmlContent += `

          <article
            class="annonce-card service-card"
            data-category="${escapeHTML(categorie)}"
            data-search="${escapeHTML(searchText)}"
          >

            <div class="service-image">

              ${
                imageUrl
                  ? `
                    <img
                      src="${escapeHTML(imageUrl)}"
                      alt="${escapeHTML(titre)}"
                      style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                      "
                      loading="lazy"
                    >
                  `
                  : `
                    <div class="service-placeholder">
                      <i class="fa-solid fa-store"></i>
                    </div>
                  `
              }


              <span class="featured-badge">

                <i class="fa-solid fa-star"></i>

                ${
                  data.featured ||
                  data.sponsorise
                    ? "Sponsorisé"
                    : "Service"
                }

              </span>

            </div>


            <div class="service-card-content">

              <span class="badge-cat">

                ${escapeHTML(categorie)}

              </span>


              <h3>

                ${escapeHTML(titre)}

              </h3>


              <p class="service-description">

                ${escapeHTML(description)}

              </p>


              <p class="location">

                <i class="fa-solid fa-location-dot"></i>

                ${escapeHTML(localisation)}

              </p>


              <div class="service-footer">

                <span class="service-status">

                  <i class="fa-solid fa-circle"></i>

                  Disponible

                </span>


                <span class="rating">

                  <i class="fa-solid fa-star"></i>

                  ${escapeHTML(note)}

                </span>

              </div>


              <div class="card-actions">

                <a
                  href="entreprise.html?id=${encodeURIComponent(docSnap.id)}"
                  class="btn-primary"
                >
                  Voir le profil
                </a>


                <button
                  type="button"
                  class="favorite-btn"
                  aria-label="Ajouter aux favoris"
                  title="Ajouter aux favoris"
                >

                  <i class="fa-regular fa-heart"></i>

                </button>

              </div>

            </div>

          </article>

        `;

      }
    );


    container.innerHTML =
      htmlContent;


    /*
     * Informe index.html que les services
     * sont maintenant disponibles.
     */

    document.dispatchEvent(
      new CustomEvent(
        "camu-services-loaded"
      )
    );

  } catch (error) {

    console.error(
      "Erreur lors du chargement des annonces Firebase :",
      error
    );


    container.innerHTML = `

      <p
        style="
          text-align:center;
          grid-column:1/-1;
          padding:20px;
        "
      >
        Erreur de chargement des données.
      </p>

    `;

  }

}


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
    window.camuLogout,

  chargerCommuniques:
    chargerCommuniquesFirebase,

  chargerServices:
    chargerAnnoncesFirebase

};


/* =========================================================
   FONCTIONS THÈME
   ========================================================= */

window.camuSetTheme =
  function(theme) {

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
   FONCTIONS LANGUE
   ========================================================= */

window.camuSetLanguage =
  function(language) {

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
   CHARGEMENT DES DONNÉES
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    /*
     * Les deux chargements peuvent fonctionner
     * en parallèle.
     */

    await Promise.allSettled([

      chargerCommuniquesFirebase(),

      chargerAnnoncesFirebase()

    ]);

  }
);


/* =========================================================
   FIN APP.JS
   ========================================================= */

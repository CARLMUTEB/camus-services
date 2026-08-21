/* =========================================================
   CAMU SERVICES — APP.JS
   Firebase / Authentification / Firestore
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
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
   INITIALISATION FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   UTILITAIRES
   ========================================================= */

/**
 * Protection contre l'injection HTML
 */
function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/**
 * Nettoyage d'un numéro WhatsApp
 *
 * Exemple :
 * +243 81 234 5678
 * devient :
 * 243812345678
 */
function cleanPhoneNumber(phone) {

  if (!phone) {
    return "";
  }

  return String(phone)
    .replace(/[^\d]/g, "");

}


/**
 * Génère un lien WhatsApp
 */
function getWhatsAppLink(phone, message = "") {

  const cleanPhone = cleanPhoneNumber(phone);

  if (!cleanPhone) {
    return "";
  }

  const text = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}${text ? `?text=${text}` : ""}`;

}


/* =========================================================
   RÉCUPÉRER L'UTILISATEUR PAR OWNER ID
   ========================================================= */

async function getOwnerById(ownerId) {

  if (!ownerId) {
    return null;
  }

  try {

    const ownerRef = doc(
      db,
      "users",
      ownerId
    );

    const ownerSnap = await getDoc(ownerRef);

    if (!ownerSnap.exists()) {
      return null;
    }

    return {
      id: ownerSnap.id,
      ...ownerSnap.data()
    };

  } catch (error) {

    console.error(
      "Erreur récupération propriétaire :",
      error
    );

    return null;

  }

}


/* =========================================================
   RÉCUPÉRER UN SERVICE PAR SON ID
   ========================================================= */

async function getServiceById(serviceId) {

  if (!serviceId) {
    return null;
  }

  try {

    const serviceRef = doc(
      db,
      "services",
      serviceId
    );

    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
      return null;
    }

    return {
      id: serviceSnap.id,
      ...serviceSnap.data()
    };

  } catch (error) {

    console.error(
      "Erreur récupération service :",
      error
    );

    return null;

  }

}


/* =========================================================
   CHARGER TOUS LES SERVICES
   ========================================================= */

async function getServices() {

  try {

    const servicesRef =
      collection(db, "services");

    const snapshot =
      await getDocs(servicesRef);

    const services = [];

    snapshot.forEach((document) => {

      services.push({
        id: document.id,
        ...document.data()
      });

    });

    return services;

  } catch (error) {

    console.error(
      "Erreur récupération services :",
      error
    );

    return [];

  }

}


/* =========================================================
   CHARGER UNIQUEMENT LES SERVICES VALIDÉS
   ========================================================= */

async function getPublicServices() {

  try {

    const servicesRef =
      collection(db, "services");

    const q = query(
      servicesRef,
      where("valide", "==", true)
    );

    const snapshot =
      await getDocs(q);

    const services = [];

    snapshot.forEach((document) => {

      services.push({
        id: document.id,
        ...document.data()
      });

    });

    return services;

  } catch (error) {

    console.error(
      "Erreur récupération services publics :",
      error
    );

    return [];

  }

}


/* =========================================================
   SERVICES D'UN PROPRIÉTAIRE
   ========================================================= */

async function getServicesByOwner(ownerId) {

  if (!ownerId) {
    return [];
  }

  try {

    const servicesRef =
      collection(db, "services");

    const q = query(
      servicesRef,
      where("ownerId", "==", ownerId)
    );

    const snapshot =
      await getDocs(q);

    const services = [];

    snapshot.forEach((document) => {

      services.push({
        id: document.id,
        ...document.data()
      });

    });

    return services;

  } catch (error) {

    console.error(
      "Erreur services propriétaire :",
      error
    );

    return [];

  }

}


/* =========================================================
   CHARGER LES SERVICES AVEC LES INFORMATIONS DU PROPRIÉTAIRE
   ========================================================= */

async function getServicesWithOwners() {

  const services =
    await getPublicServices();

  const ownerCache = {};

  const results = [];

  for (const service of services) {

    let owner = null;

    if (service.ownerId) {

      if (
        Object.prototype.hasOwnProperty.call(
          ownerCache,
          service.ownerId
        )
      ) {

        owner =
          ownerCache[service.ownerId];

      } else {

        owner =
          await getOwnerById(
            service.ownerId
          );

        ownerCache[service.ownerId] =
          owner;

      }

    }

    results.push({

      ...service,

      owner: owner,

      ownerName:
        owner?.nom ||
        owner?.name ||
        owner?.displayName ||
        "Prestataire",

      ownerPhone:
        owner?.telephone ||
        owner?.phone ||
        owner?.whatsapp ||
        "",

      ownerEmail:
        owner?.email ||
        service.ownerEmail ||
        ""

    });

  }

  return results;

}


/* =========================================================
   GÉNÉRER LE LIEN WHATSAPP D'UN SERVICE
   ========================================================= */

function createServiceWhatsAppLink(service) {

  if (!service) {
    return "";
  }

  const phone =
    service.ownerPhone ||
    service.whatsapp ||
    service.telephone ||
    service.phone ||
    "";

  if (!phone) {
    return "";
  }

  const titre =
    service.titre ||
    "votre service";

  const ville =
    service.ville ||
    "";

  const message =
    `Bonjour ${service.ownerName || ""}, je suis intéressé(e) par votre service "${titre}"${ville ? ` à ${ville}` : ""}.`;

  return getWhatsAppLink(
    phone,
    message
  );

}


/* =========================================================
   CRÉER UNE CARTE SERVICE
   ========================================================= */

function createServiceCard(service) {

  const whatsappLink =
    createServiceWhatsAppLink(service);

  const serviceId =
    escapeHTML(service.id || "");

  const ownerId =
    escapeHTML(service.ownerId || "");

  const titre =
    escapeHTML(
      service.titre ||
      "Service"
    );

  const categorie =
    escapeHTML(
      service.categorie ||
      "Service"
    );

  const ville =
    escapeHTML(
      service.ville ||
      "RDC"
    );

  const prix =
    escapeHTML(
      service.prix ||
      "Sur devis"
    );

  const description =
    escapeHTML(
      service.description ||
      ""
    );

  const ownerName =
    escapeHTML(
      service.ownerName ||
      "Prestataire"
    );

  const image =
    service.image
      ? `
        <div class="service-image">
          <img
            src="${escapeHTML(service.image)}"
            alt="${titre}"
            loading="lazy"
          >
        </div>
      `
      : "";


  const whatsappButton =
    whatsappLink
      ? `
        <a
          href="${whatsappLink}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-whatsapp"
          data-service-id="${serviceId}"
          data-owner-id="${ownerId}"
        >
          <i class="fa-brands fa-whatsapp"></i>
          WhatsApp
        </a>
      `
      : `
        <button
          type="button"
          class="btn-whatsapp disabled"
          disabled
          title="WhatsApp non renseigné"
        >
          <i class="fa-brands fa-whatsapp"></i>
          WhatsApp
        </button>
      `;


  return `

    <article
      class="annonce-card"
      data-service-id="${serviceId}"
      data-owner-id="${ownerId}"
    >

      ${image}

      <span class="badge-cat">
        ${categorie}
      </span>

      <h3>
        ${titre}
      </h3>

      <div class="meta">
        <i class="fa-solid fa-user"></i>
        ${ownerName}
      </div>

      <div class="location">
        <i class="fa-solid fa-location-dot"></i>
        ${ville}
      </div>

      <p>
        ${description}
      </p>

      <div class="prix">
        ${prix}
      </div>

      <div class="card-actions">

        ${whatsappButton}

        <a
          href="chat.html?serviceId=${encodeURIComponent(service.id || "")}&ownerId=${encodeURIComponent(service.ownerId || "")}"
          class="btn-primary"
        >
          <i class="fa-solid fa-comments"></i>
          Contacter
        </a>

        <button
          type="button"
          class="favorite-btn"
          data-service-id="${serviceId}"
          aria-label="Ajouter aux favoris"
        >
          <i class="fa-regular fa-star"></i>
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   AFFICHER LES SERVICES DANS UN CONTENEUR
   ========================================================= */

async function afficherServices(
  containerId = "services-container"
) {

  const container =
    document.getElementById(
      containerId
    );

  if (!container) {
    return;
  }

  container.innerHTML = `

    <div class="empty-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <h2>Chargement...</h2>

      <p>
        Nous recherchons les services disponibles.
      </p>

    </div>

  `;


  try {

    const services =
      await getServicesWithOwners();


    if (!services.length) {

      container.innerHTML = `

        <div class="empty-state">

          <i class="fa-solid fa-folder-open"></i>

          <h2>Aucun service disponible</h2>

          <p>
            Aucun service n'a encore été validé.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      services
        .map(createServiceCard)
        .join("");


    initialiserFavoris();

  } catch (error) {

    console.error(error);

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h2>Erreur</h2>

        <p>
          Impossible de charger les services.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   FAVORIS
   ========================================================= */

function getFavorites() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "camuFavorites"
      ) || "[]"
    );

  } catch {

    return [];

  }

}


function saveFavorites(favorites) {

  localStorage.setItem(
    "camuFavorites",
    JSON.stringify(favorites)
  );

}


function toggleFavorite(serviceId) {

  if (!serviceId) {
    return false;
  }

  let favorites =
    getFavorites();

  const index =
    favorites.indexOf(serviceId);


  if (index === -1) {

    favorites.push(serviceId);

    saveFavorites(favorites);

    return true;

  }


  favorites.splice(
    index,
    1
  );

  saveFavorites(favorites);

  return false;

}


function initialiserFavoris() {

  const buttons =
    document.querySelectorAll(
      ".favorite-btn"
    );

  const favorites =
    getFavorites();


  buttons.forEach((button) => {

    const serviceId =
      button.dataset.serviceId;

    if (
      favorites.includes(
        serviceId
      )
    ) {

      button.classList.add(
        "active"
      );

      const icon =
        button.querySelector("i");

      if (icon) {

        icon.className =
          "fa-solid fa-star";

      }

    }


    button.addEventListener(
      "click",
      () => {

        const added =
          toggleFavorite(
            serviceId
          );

        const icon =
          button.querySelector("i");


        if (added) {

          button.classList.add(
            "active"
          );

          if (icon) {

            icon.className =
              "fa-solid fa-star";

          }

        } else {

          button.classList.remove(
            "active"
          );

          if (icon) {

            icon.className =
              "fa-regular fa-star";

          }

        }

      }
    );

  });

}


/* =========================================================
   RECHERCHE LOCALE
   ========================================================= */

function filtrerServices(
  services,
  recherche = ""
) {

  const text =
    recherche
      .toLowerCase()
      .trim();

  if (!text) {
    return services;
  }

  return services.filter(
    (service) => {

      const contenu = [

        service.titre,
        service.categorie,
        service.ville,
        service.description,
        service.ownerName

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenu.includes(text);

    }
  );

}


/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

function attendreUtilisateur() {

  return new Promise(
    (resolve) => {

      const unsubscribe =
        onAuthStateChanged(
          auth,
          (user) => {

            unsubscribe();

            resolve(user);

          }
        );

    }
  );

}


/* =========================================================
   CHARGEMENT AUTOMATIQUE DE LA PAGE INDEX
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const container =
      document.getElementById(
        "services-container"
      );


    if (!container) {
      return;
    }


    onAuthStateChanged(
      auth,
      async (user) => {

        /*
         * Le site public peut afficher
         * les services validés même sans
         * connexion.
         */

        if (user) {

          console.log(
            "Utilisateur connecté :",
            user.uid
          );

        }


        await afficherServices(
          "services-container"
        );

      }
    );

  }
);


/* =========================================================
   MODE SOMBRE
   ========================================================= */

function appliquerTheme() {

  const theme =
    localStorage.getItem(
      "theme"
    );


  if (theme === "dark") {

    document.documentElement
      .classList.add(
        "dark-mode"
      );

    document.body
      .classList.add(
        "dark-mode"
      );

  } else {

    document.documentElement
      .classList.remove(
        "dark-mode"
      );

    document.body
      .classList.remove(
        "dark-mode"
      );

  }

}


/* =========================================================
   INITIALISATION DU THÈME
   ========================================================= */

appliquerTheme();


/* =========================================================
   EXPORTS
   ========================================================= */

export {

  app,

  auth,

  db,

  signOut,

  onAuthStateChanged,

  escapeHTML,

  cleanPhoneNumber,

  getWhatsAppLink,

  getOwnerById,

  getServiceById,

  getServices,

  getPublicServices,

  getServicesByOwner,

  getServicesWithOwners,

  createServiceWhatsAppLink,

  createServiceCard,

  afficherServices,

  getFavorites,

  saveFavorites,

  toggleFavorite,

  filtrerServices,

  attendreUtilisateur,

  appliquerTheme

};

/* =========================================================
   CAMU SERVICES
   APPLICATION PRINCIPALE
   FIREBASE AUTH + FIRESTORE
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";


import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION FIREBASE
   ========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",

  authDomain:
    "camu-services.firebaseapp.com",

  projectId:
    "camu-services",

  storageBucket:
    "camu-services.firebasestorage.app",

  messagingSenderId:
    "879100396449",

  appId:
    "1:879100396449:web:9d7ffe441a3df2daf841e0"

};


/* =========================================================
   INITIALISATION
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const googleProvider =
  new GoogleAuthProvider();


/* =========================================================
   PERSISTANCE
   ========================================================= */

let persistenceReady = false;


const persistencePromise =
  setPersistence(
    auth,
    browserLocalPersistence
  )
  .then(() => {

    persistenceReady = true;

    console.log(
      "CAMU : persistance Firebase activée."
    );

  })
  .catch((error) => {

    console.error(
      "Erreur persistance Firebase :",
      error
    );

  });


/* =========================================================
   VARIABLES GLOBALES
   ========================================================= */

window.db = db;

window.auth = auth;

window.camuCurrentUser = null;


/* =========================================================
   CONSTANTES
   ========================================================= */

const COLLECTIONS = {

  USERS: "users",

  SERVICES: "services",

  COMMUNIQUES: "communiques",

  FAVORIS: "favoris",

  AVIS: "avis"

};


const ROLES = {

  CLIENT: "client",

  VENDEUR: "vendeur",

  PRESTATAIRE: "prestataire",

  ADMIN: "admin"

};


/* =========================================================
   UTILITAIRES
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


function formaterDate(value) {

  if (!value) return "";

  try {

    let date;


    if (
      value &&
      typeof value.toDate === "function"
    ) {

      date = value.toDate();

    } else if (value instanceof Date) {

      date = value;

    } else if (typeof value === "number") {

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

  } catch {

    return "";

  }

}


/* =========================================================
   THÈME
   ========================================================= */

function appliquerTheme() {

  const theme =
    localStorage.getItem("camu_theme");


  if (theme === "dark") {

    document.documentElement
      .classList
      .add("dark-mode");

  } else {

    document.documentElement
      .classList
      .remove("dark-mode");

  }

}


function appliquerLangue() {

  const language =
    localStorage.getItem("camu_language") || "fr";

  document.documentElement.lang =
    language;

}


appliquerTheme();

appliquerLangue();


/* =========================================================
   ATTENDRE FIREBASE AUTH
   ========================================================= */

let authInitialized = false;

let authResolve;

const authReadyPromise =
  new Promise((resolve) => {

    authResolve = resolve;

  });


onAuthStateChanged(
  auth,
  (user) => {

    console.log(
      "Firebase Auth :",
      user
        ? `CONNECTÉ → ${user.email}`
        : "DÉCONNECTÉ"
    );


    window.camuCurrentUser =
      user || null;


    if (!authInitialized) {

      authInitialized = true;

      authResolve(user || null);

    }


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
   ATTENDRE UTILISATEUR CONNECTÉ
   ========================================================= */

export async function attendreUtilisateurConnecte(
  timeout = 10000
) {

  /*
   * Attendre que la persistance soit préparée.
   */

  await persistencePromise;


  /*
   * Si Firebase connaît déjà l'utilisateur.
   */

  if (auth.currentUser) {

    return auth.currentUser;

  }


  /*
   * Attendre onAuthStateChanged.
   */

  const resultat =
    await Promise.race([

      authReadyPromise,

      new Promise((resolve) => {

        setTimeout(
          () => resolve(null),
          timeout
        );

      })

    ]);


  /*
   * Vérification finale.
   */

  return auth.currentUser || resultat || null;

}


/* =========================================================
   INSCRIPTION
   ========================================================= */

export async function inscriptionUtilisateur(
  email,
  password,
  profil = {}
) {

  try {

    await persistencePromise;


    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    console.log(
      "Inscription Firebase réussie :",
      user.uid
    );


    if (
      profil.prenom &&
      profil.nom
    ) {

      await updateProfile(
        user,
        {
          displayName:
            `${profil.prenom} ${profil.nom}`
        }
      );

    }


    const userData = {

      uid: user.uid,

      email: user.email,

      nom: profil.nom || "",

      prenom: profil.prenom || "",

      role:
        profil.role || ROLES.CLIENT,

      telephone:
        profil.telephone || "",

      whatsapp:
        profil.whatsapp ||
        profil.telephone ||
        "",

      localisation:
        profil.localisation || "",

      createdAt:
        new Date(),

      updatedAt:
        new Date()

    };


    await setDoc(

      doc(
        db,
        COLLECTIONS.USERS,
        user.uid
      ),

      userData

    );


    return {

      success: true,

      user,

      userData

    };


  } catch (error) {

    console.error(
      "Erreur inscription :",
      error
    );


    return {

      success: false,

      error:
        error.code ||
        error.message

    };

  }

}


/* =========================================================
   CONNEXION EMAIL / MOT DE PASSE
   ========================================================= */

export async function connexionUtilisateur(
  email,
  password
) {

  try {

    await persistencePromise;


    console.log(
      "Connexion Firebase en cours..."
    );


    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    console.log(
      "Firebase a accepté la connexion :",
      user.uid,
      user.email
    );


    /*
     * Vérification immédiate.
     */

    if (!auth.currentUser) {

      throw new Error(
        "Firebase n'a pas confirmé l'utilisateur connecté."
      );

    }


    /*
     * Récupération du profil Firestore.
     */

    let userData = {};


    try {

      const userDoc =
        await getDoc(
          doc(
            db,
            COLLECTIONS.USERS,
            user.uid
          )
        );


      if (userDoc.exists()) {

        userData =
          userDoc.data();

      } else {

        console.warn(
          "Profil Firestore absent pour :",
          user.uid
        );

      }

    } catch (firestoreError) {

      console.error(
        "Erreur lecture profil Firestore :",
        firestoreError
      );

      /*
       * La connexion Firebase reste valide
       * même si le profil Firestore pose problème.
       */

    }


    return {

      success: true,

      user,

      userData

    };


  } catch (error) {

    console.error(
      "Erreur connexion Firebase :",
      error
    );


    return {

      success: false,

      error:
        error.code ||
        error.message

    };

  }

}


/* =========================================================
   GOOGLE
   ========================================================= */

export async function connexionGoogle() {

  try {

    await persistencePromise;


    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );


    const user =
      result.user;


    const userRef =
      doc(
        db,
        COLLECTIONS.USERS,
        user.uid
      );


    const userDoc =
      await getDoc(userRef);


    if (!userDoc.exists()) {

      await setDoc(
        userRef,
        {

          uid: user.uid,

          email: user.email || "",

          nom:
            user.displayName || "",

          prenom: "",

          role: ROLES.CLIENT,

          telephone: "",

          whatsapp: "",

          localisation: "",

          createdAt: new Date(),

          updatedAt: new Date()

        }
      );

    }


    return {

      success: true,

      user

    };


  } catch (error) {

    console.error(
      "Erreur connexion Google :",
      error
    );


    return {

      success: false,

      error:
        error.code ||
        error.message

    };

  }

}


/* =========================================================
   UTILISATEUR ACTUEL
   ========================================================= */

export function getCurrentUser() {

  return auth.currentUser;

}


export function isUserConnected() {

  return !!auth.currentUser;

}


/* =========================================================
   DÉCONNEXION
   ========================================================= */

export async function deconnexion() {

  try {

    await signOut(auth);


    window.camuCurrentUser =
      null;


    console.log(
      "CAMU : utilisateur déconnecté."
    );


    window.location.replace(
      "connexion.html"
    );


  } catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );


    alert(
      "Impossible de se déconnecter."
    );

  }

}


/* =========================================================
   PROFIL UTILISATEUR
   ========================================================= */

export async function creerProfilUtilisateur(
  uid,
  userData
) {

  try {

    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        uid
      ),
      {
        ...userData,

        uid,

        updatedAt: new Date(),

        createdAt:
          userData.createdAt ||
          new Date()

      },
      {
        merge: true
      }
    );


    return {
      success: true
    };


  } catch (error) {

    console.error(
      "Erreur création profil :",
      error
    );


    return {

      success: false,

      error: error.message

    };

  }

}


export async function obtenirProfil(uid) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          COLLECTIONS.USERS,
          uid
        )
      );


    if (!snapshot.exists()) {

      return {

        success: false,

        error: "Profil non trouvé"

      };

    }


    return {

      success: true,

      data: snapshot.data()

    };


  } catch (error) {

    console.error(
      "Erreur profil :",
      error
    );


    return {

      success: false,

      error: error.message

    };

  }

}


export async function mettreAJourProfil(
  uid,
  updates
) {

  try {

    await updateDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        uid
      ),
      {

        ...updates,

        updatedAt: new Date()

      }
    );


    return {
      success: true
    };


  } catch (error) {

    console.error(
      "Erreur mise à jour profil :",
      error
    );


    return {

      success: false,

      error: error.message

    };

  }

}


/* =========================================================
   SERVICES
   ========================================================= */

export async function creerService(
  serviceData
) {

  try {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        "Utilisateur non connecté"
      );

    }


    const profil =
      await obtenirProfil(user.uid);


    const whatsapp =
      profil.success
        ? (
            profil.data.whatsapp ||
            profil.data.telephone ||
            ""
          )
        : "";


    const docRef =
      await addDoc(
        collection(
          db,
          COLLECTIONS.SERVICES
        ),
        {

          ...serviceData,

          userId: user.uid,

          whatsapp,

          createdAt: new Date(),

          updatedAt: new Date(),

          status: "actif"

        }
      );


    return {

      success: true,

      id: docRef.id

    };


  } catch (error) {

    console.error(
      "Erreur création service :",
      error
    );


    return {

      success: false,

      error: error.message

    };

  }

}


export async function obtenirService(
  serviceId
) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          COLLECTIONS.SERVICES,
          serviceId
        )
      );


    if (!snapshot.exists()) {

      return {

        success: false,

        error: "Service non trouvé"

      };

    }


    return {

      success: true,

      data: {

        id: snapshot.id,

        ...snapshot.data()

      }

    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


export async function mettreAJourService(
  serviceId,
  updates
) {

  try {

    await updateDoc(
      doc(
        db,
        COLLECTIONS.SERVICES,
        serviceId
      ),
      {

        ...updates,

        updatedAt: new Date()

      }
    );


    return {
      success: true
    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


export async function supprimerService(
  serviceId
) {

  try {

    await deleteDoc(
      doc(
        db,
        COLLECTIONS.SERVICES,
        serviceId
      )
    );


    return {
      success: true
    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


/* =========================================================
   FAVORIS
   ========================================================= */

export async function ajouterFavori(
  serviceId
) {

  try {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        "Utilisateur non connecté"
      );

    }


    const q =
      query(
        collection(
          db,
          COLLECTIONS.FAVORIS
        ),

        where(
          "userId",
          "==",
          user.uid
        ),

        where(
          "serviceId",
          "==",
          serviceId
        )
      );


    const snapshot =
      await getDocs(q);


    if (!snapshot.empty) {

      return {

        success: false,

        error:
          "Déjà dans vos favoris"

      };

    }


    await addDoc(
      collection(
        db,
        COLLECTIONS.FAVORIS
      ),
      {

        userId: user.uid,

        serviceId,

        createdAt: new Date()

      }
    );


    return {
      success: true
    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


export async function retirerFavori(
  serviceId
) {

  try {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        "Utilisateur non connecté"
      );

    }


    const q =
      query(
        collection(
          db,
          COLLECTIONS.FAVORIS
        ),

        where(
          "userId",
          "==",
          user.uid
        ),

        where(
          "serviceId",
          "==",
          serviceId
        )
      );


    const snapshot =
      await getDocs(q);


    for (const item of snapshot.docs) {

      await deleteDoc(item.ref);

    }


    return {
      success: true
    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


/* =========================================================
   AVIS
   ========================================================= */

export async function ajouterAvis(
  serviceId,
  note,
  commentaire
) {

  try {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        "Utilisateur non connecté"
      );

    }


    await addDoc(
      collection(
        db,
        COLLECTIONS.AVIS
      ),
      {

        serviceId,

        userId: user.uid,

        note,

        commentaire,

        createdAt: new Date()

      }
    );


    return {
      success: true
    };


  } catch (error) {

    return {

      success: false,

      error: error.message

    };

  }

}


/* =========================================================
   COMMUNIQUÉS
   ========================================================= */

async function chargerCommuniquesFirebase() {

  const container =
    document.getElementById(
      "communiquesContainer"
    );


  if (!container) return;


  try {

    const ref =
      collection(
        db,
        COLLECTIONS.COMMUNIQUES
      );


    let snapshot;


    try {

      const q =
        query(
          ref,
          orderBy(
            "date",
            "desc"
          ),
          limit(10)
        );


      snapshot =
        await getDocs(q);


    } catch {

      snapshot =
        await getDocs(
          query(
            ref,
            limit(10)
          )
        );

    }


    if (snapshot.empty) {

      container.innerHTML = `
        <div class="announcement-empty">
          <i class="fa-solid fa-bullhorn"></i>
          <h3>Aucun communiqué</h3>
          <p>Aucun communiqué disponible.</p>
        </div>
      `;

      return;

    }


    let html = "";


    snapshot.forEach(
      (item) => {

        const data =
          item.data();


        const titre =
          data.titre ||
          data.title ||
          "Communiqué";


        const contenu =
          data.contenu ||
          data.message ||
          data.description ||
          "";


        const type =
          data.type ||
          data.categorie ||
          "Information";


        const date =
          formaterDate(
            data.date ||
            data.createdAt
          );


        html += `

          <article class="announcement-box">

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


    document.dispatchEvent(
      new CustomEvent(
        "camu-communiques-loaded"
      )
    );


  } catch (error) {

    console.error(
      "Erreur communiqués :",
      error
    );


    container.innerHTML = `
      <div class="announcement-error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        Impossible de charger les communiqués.
      </div>
    `;

  }

}


/* =========================================================
   SERVICES PAGE
   ========================================================= */

async function chargerServicesFirebase(
  categorie = null
) {

  const container =
    document.getElementById(
      "servicesContainer"
    );


  if (!container) return;


  try {

    const ref =
      collection(
        db,
        COLLECTIONS.SERVICES
      );


    let q =
      query(
        ref,
        orderBy(
          "createdAt",
          "desc"
        )
      );


    if (
      categorie &&
      categorie !== "tous"
    ) {

      q =
        query(
          ref,

          where(
            "categorie",
            "==",
            categorie
          ),

          orderBy(
            "createdAt",
            "desc"
          )
        );

    }


    let snapshot;


    try {

      snapshot =
        await getDocs(q);

    } catch {

      snapshot =
        await getDocs(
          query(ref)
        );

    }


    if (snapshot.empty) {

      container.innerHTML = `
        <p style="
          text-align:center;
          grid-column:1/-1;
          padding:20px;
        ">
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


    let html = "";


    snapshot.forEach(
      (item) => {

        const data =
          item.data();


        const categorieService =
          data.categorie ||
          data.category ||
          "Services";


        const titre =
          data.titre ||
          data.nom ||
          data.title ||
          "Service";


        const description =
          data.description ||
          "Aucune description disponible.";


        const localisation =
          data.localisation ||
          data.location ||
          "Disponible localement";


        const imageUrl =
          data.imageUrl ||
          data.image ||
          "";


        const whatsapp =
          data.whatsapp ||
          "";


        const searchText =
          `
            ${categorieService}
            ${titre}
            ${description}
            ${localisation}
          `
          .toLowerCase();


        html += `

          <article
            class="annonce-card service-card"
            data-category="${escapeHTML(categorieService)}"
            data-search="${escapeHTML(searchText)}"
            data-service-id="${escapeHTML(item.id)}"
          >

            <div class="service-image">

              ${
                imageUrl
                  ? `
                    <img
                      src="${escapeHTML(imageUrl)}"
                      alt="${escapeHTML(titre)}"
                      loading="lazy"
                    >
                  `
                  : `
                    <div class="service-placeholder">
                      <i class="fa-solid fa-store"></i>
                    </div>
                  `
              }

            </div>


            <div class="service-card-content">

              <span class="badge-cat">

                ${escapeHTML(categorieService)}

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


              <div class="card-actions">

                <a
                  href="entreprise.html?id=${encodeURIComponent(item.id)}"
                  class="btn-primary"
                >
                  Voir le profil
                </a>


                ${
                  whatsapp
                    ? `
                      <a
                        href="https://wa.me/${escapeHTML(whatsapp)}"
                        target="_blank"
                        class="btn-whatsapp"
                      >
                        <i class="fa-brands fa-whatsapp"></i>
                        WhatsApp
                      </a>
                    `
                    : ""
                }

              </div>

            </div>

          </article>

        `;

      }
    );


    container.innerHTML =
      html;


    document.dispatchEvent(
      new CustomEvent(
        "camu-services-loaded"
      )
    );


  } catch (error) {

    console.error(
      "Erreur services :",
      error
    );


    container.innerHTML = `
      <p style="
        text-align:center;
        grid-column:1/-1;
        padding:20px;
      ">
        Erreur de chargement.
      </p>
    `;

  }

}


/* =========================================================
   THÈME / LANGUE
   ========================================================= */

window.camuSetTheme =
  function(theme) {

    if (
      theme !== "dark" &&
      theme !== "light"
    ) return;


    localStorage.setItem(
      "camu_theme",
      theme
    );


    appliquerTheme();


    document.dispatchEvent(
      new CustomEvent(
        "camu-theme-changed",
        {
          detail: { theme }
        }
      )
    );

  };


window.camuSetLanguage =
  function(language) {

    if (!language) return;


    localStorage.setItem(
      "camu_language",
      language
    );


    appliquerLangue();


    document.dispatchEvent(
      new CustomEvent(
        "camu-language-changed",
        {
          detail: { language }
        }
      )
    );

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

  attendreUtilisateurConnecte,


  inscriptionUtilisateur,

  connexionUtilisateur,

  connexionGoogle,

  deconnexion,

  logout: deconnexion,


  creerProfilUtilisateur,

  obtenirProfil,

  mettreAJourProfil,


  creerService,

  obtenirService,

  mettreAJourService,

  supprimerService,


  ajouterFavori,

  retirerFavori,


  ajouterAvis,


  chargerCommuniques:
    chargerCommuniquesFirebase,

  chargerServices:
    chargerServicesFirebase,


  ROLES,

  COLLECTIONS

};


/* =========================================================
   INITIALISATION DES PAGES
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await Promise.allSettled([

      chargerCommuniquesFirebase(),

      chargerServicesFirebase()

    ]);

  }
);


console.log(
  "CAMU SERVICES : app.js chargé correctement."
);

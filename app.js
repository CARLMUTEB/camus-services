/* =========================================================
   CAMU SERVICES — APP.JS
   Firebase Authentication + Firestore
   Version corrigée
   ========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


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

const googleProvider = new GoogleAuthProvider();


/* =========================================================
   COLLECTIONS
   ========================================================= */

const COLLECTIONS = {
  USERS: "users",
  SERVICES: "services",
  COMMUNIQUES: "communiques",
  FAVORIS: "favoris",
  AVIS: "avis"
};


/* =========================================================
   ROLES
   ========================================================= */

const ROLES = {
  CLIENT: "client",
  VENDEUR: "vendeur",
  PRESTATAIRE: "prestataire",
  ADMIN: "admin"
};


/* =========================================================
   PERSISTANCE FIREBASE
   ========================================================= */

let persistenceReady = false;

const persistencePromise = setPersistence(
  auth,
  browserLocalPersistence
)
.then(() => {
  persistenceReady = true;
  console.log("CAMU SERVICES : persistance locale activée.");
})
.catch((error) => {
  console.error(
    "CAMU SERVICES : erreur persistance Firebase :",
    error
  );
});


/* =========================================================
   VARIABLES GLOBALES
   ========================================================= */

window.auth = auth;
window.db = db;

window.camuCurrentUser = null;


/* =========================================================
   UTILITAIRE — PROFIL FIRESTORE
   ========================================================= */

async function recupererOuCreerProfil(user) {

  if (!user) {
    return null;
  }

  const userRef = doc(
    db,
    COLLECTIONS.USERS,
    user.uid
  );

  try {

    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {

      return {
        id: snapshot.id,
        ...snapshot.data()
      };

    }

    /* Profil inexistant : création automatique */

    const profil = {
      uid: user.uid,
      email: user.email || "",
      nom: "",
      prenom: "",
      role: ROLES.CLIENT,
      telephone: "",
      whatsapp: "",
      localisation: "",
      photoURL: user.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(userRef, profil);

    return profil;

  } catch (error) {

    console.error(
      "Erreur profil Firestore :",
      error
    );

    return null;
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

    /* IMPORTANT :
       attendre que Firebase ait terminé
       la configuration de persistance
    */

    await persistencePromise;

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    const user = userCredential.user;

    console.log(
      "Connexion Firebase réussie :",
      user.email
    );

    const userData =
      await recupererOuCreerProfil(user);

    return {
      success: true,
      user: user,
      userData: userData
    };

  } catch (error) {

    console.error(
      "Erreur connexion :",
      error
    );

    return {
      success: false,
      error: error.code || error.message
    };
  }
}


/* =========================================================
   CONNEXION GOOGLE
   ========================================================= */

export async function connexionGoogle() {

  try {

    await persistencePromise;

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    const user = result.user;

    const userData =
      await recupererOuCreerProfil(user);

    return {
      success: true,
      user: user,
      userData: userData
    };

  } catch (error) {

    console.error(
      "Erreur connexion Google :",
      error
    );

    return {
      success: false,
      error: error.code || error.message
    };
  }
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

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    const user = credential.user;

    const prenom =
      profil.prenom || "";

    const nom =
      profil.nom || "";

    if (prenom || nom) {

      await updateProfile(
        user,
        {
          displayName:
            `${prenom} ${nom}`.trim()
        }
      );

    }

    const userData = {

      uid: user.uid,

      email: user.email || email,

      nom: nom,

      prenom: prenom,

      role:
        profil.role ||
        ROLES.CLIENT,

      telephone:
        profil.telephone || "",

      whatsapp:
        profil.whatsapp ||
        profil.telephone ||
        "",

      localisation:
        profil.localisation || "",

      photoURL:
        user.photoURL || "",

      createdAt: new Date(),

      updatedAt: new Date()
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
      user: user,
      userData: userData
    };

  } catch (error) {

    console.error(
      "Erreur inscription :",
      error
    );

    return {
      success: false,
      error: error.code || error.message
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
   OBTENIR PROFIL
   ========================================================= */

export async function obtenirProfil(uid) {

  try {

    const reference =
      doc(
        db,
        COLLECTIONS.USERS,
        uid
      );

    const snapshot =
      await getDoc(reference);

    if (snapshot.exists()) {

      return {
        success: true,
        data: snapshot.data()
      };

    }

    return {
      success: false,
      error: "Profil non trouvé"
    };

  } catch (error) {

    console.error(
      "Erreur récupération profil :",
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


/* =========================================================
   METTRE À JOUR PROFIL
   ========================================================= */

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
   DÉCONNEXION
   ========================================================= */

export async function deconnexion() {

  try {

    await signOut(auth);

    window.camuCurrentUser = null;

    console.log(
      "CAMU SERVICES : utilisateur déconnecté."
    );

    window.location.href =
      "index.html";

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
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    console.log(
      "État Firebase :",
      user
        ? `CONNECTÉ — ${user.email}`
        : "DÉCONNECTÉ"
    );

    window.camuCurrentUser =
      user || null;

    let userData = null;

    if (user) {

      userData =
        await recupererOuCreerProfil(user);

    }

    document.dispatchEvent(
      new CustomEvent(
        "camu-auth-changed",
        {
          detail: {
            user: user || null,
            userData: userData
          }
        }
      )
    );

    document.dispatchEvent(
      new CustomEvent(
        "camu-user-ready",
        {
          detail: {
            user: user || null,
            userData: userData
          }
        }
      )
    );

  }
);


/* =========================================================
   SERVICES
   ========================================================= */

export async function creerService(data) {

  try {

    const user =
      auth.currentUser;

    if (!user) {
      throw new Error(
        "Utilisateur non connecté"
      );
    }

    const profil =
      await recupererOuCreerProfil(user);

    const reference =
      await addDoc(
        collection(
          db,
          COLLECTIONS.SERVICES
        ),
        {
          ...data,
          userId: user.uid,
          whatsapp:
            profil?.whatsapp ||
            profil?.telephone ||
            "",
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "actif"
        }
      );

    return {
      success: true,
      id: reference.id
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
        error: "Déjà dans vos favoris"
      };
    }

    await addDoc(
      collection(
        db,
        COLLECTIONS.FAVORIS
      ),
      {
        userId: user.uid,
        serviceId: serviceId,
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
   COMMUNIQUÉS
   ========================================================= */

export async function chargerCommuniques() {

  const container =
    document.getElementById(
      "communiquesContainer"
    );

  if (!container) {
    return;
  }

  try {

    const reference =
      collection(
        db,
        COLLECTIONS.COMMUNIQUES
      );

    let snapshot;

    try {

      snapshot =
        await getDocs(
          query(
            reference,
            orderBy(
              "date",
              "desc"
            ),
            limit(10)
          )
        );

    } catch {

      snapshot =
        await getDocs(
          query(
            reference,
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

        html += `
          <article class="announcement-box">
            <div class="announcement-icon">
              <i class="fa-solid fa-bullhorn"></i>
            </div>

            <div class="announcement-content">
              <span class="announcement-label">
                ${data.type || "Information"}
              </span>

              <h3>${titre}</h3>

              <p>${contenu}</p>
            </div>
          </article>
        `;

      }
    );

    container.innerHTML = html;

  } catch (error) {

    console.error(
      "Erreur communiqués :",
      error
    );

    container.innerHTML = `
      <div class="announcement-error">
        Impossible de charger les communiqués.
      </div>
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

  COLLECTIONS,

  ROLES,

  getCurrentUser,

  isUserConnected,

  connexionUtilisateur,

  connexionGoogle,

  inscriptionUtilisateur,

  deconnexion,

  logout: deconnexion,

  obtenirProfil,

  mettreAJourProfil,

  creerService,

  ajouterFavori,

  retirerFavori,

  chargerCommuniques
};


/* =========================================================
   CHARGEMENT COMMUNIQUÉS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    chargerCommuniques();

  }
);


/* =========================================================
   FIN APP.JS
   ========================================================= */

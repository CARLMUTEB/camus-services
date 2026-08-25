/* =========================================================
   CAMU SERVICES V2
   CŒUR CENTRAL FIREBASE
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIGURATION
   ========================================================= */

export const firebaseConfig = {
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

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const googleProvider =
  new GoogleAuthProvider();


/* =========================================================
   COLLECTIONS
   ========================================================= */

export const COLLECTIONS = Object.freeze({

  USERS: "users",

  SERVICES: "services",

  FAVORIS: "favoris",

  AVIS: "avis",

  COMMUNIQUES: "communiques"

});


/* =========================================================
   RÔLES
   ========================================================= */

export const ROLES = Object.freeze({

  CLIENT: "client",

  PRESTATAIRE: "prestataire",

  VENDEUR: "vendeur",

  ADMIN: "admin"

});


/* =========================================================
   CATÉGORIES
   ========================================================= */

export const CATEGORIES = Object.freeze([

  "Construction",

  "Transport",

  "Beauté",

  "Restaurant",

  "Informatique",

  "Commerce",

  "Services"

]);


/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

export const authReady =
  setPersistence(
    auth,
    browserLocalPersistence
  ).catch(error => {

    console.error(
      "Erreur persistence Firebase :",
      error
    );

  });


let currentUser = null;


onAuthStateChanged(
  auth,
  user => {

    currentUser = user;

    window.dispatchEvent(
      new CustomEvent(
        "camu-auth",
        {
          detail: user
        }
      )
    );

  }
);


/* =========================================================
   UTILISATEUR COURANT
   ========================================================= */

export function getCurrentUser() {

  return currentUser || auth.currentUser;

}


export function isUserConnected() {

  return !!getCurrentUser();

}


/* =========================================================
   ATTENDRE FIREBASE AUTH
   ========================================================= */

export async function waitForAuth(
  timeout = 10000
) {

  if (auth.currentUser) {

    return auth.currentUser;

  }


  return new Promise(resolve => {

    let finished = false;

    let unsubscribe = null;


    const finish = user => {

      if (finished) return;

      finished = true;

      if (unsubscribe) {

        unsubscribe();

      }

      resolve(user);

    };


    unsubscribe =
      onAuthStateChanged(
        auth,
        finish
      );


    setTimeout(
      () => finish(auth.currentUser),
      timeout
    );

  });

}


/* =========================================================
   OUTILS
   ========================================================= */

function clean(value = "") {

  return String(
    value ?? ""
  ).trim();

}


export function escapeHTML(
  value = ""
) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[character])
  );

}


export function normalizePhone(
  value = ""
) {

  return String(value)
    .replace(/[^\d+]/g, "");

}


export function whatsappUrl(
  phone,
  message = ""
) {

  const normalized =
    normalizePhone(phone)
      .replace(/^\+/, "");


  if (!normalized) {

    return "";

  }


  return (
    `https://wa.me/${normalized}` +
    `?text=${encodeURIComponent(message)}`
  );

}


export function serviceWhatsAppMessage(
  service
) {

  return (
    `Bonjour, je viens de CAMU SERVICES. ` +
    `Je souhaite des informations concernant ` +
    `votre service "${service.titre || "service"}".`
  );

}


/* =========================================================
   INSCRIPTION
   ========================================================= */

export async function registerUser({

  email,

  password,

  nom,

  prenom = "",

  telephone = "",

  role = ROLES.CLIENT

}) {

  try {

    await authReady;


    const credential =
      await createUserWithEmailAndPassword(
        auth,
        clean(email),
        password
      );


    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        credential.user.uid
      ),
      {

        uid:
          credential.user.uid,

        email:
          credential.user.email ||
          clean(email),

        nom:
          clean(nom),

        prenom:
          clean(prenom),

        telephone:
          clean(telephone),

        whatsapp:
          clean(telephone),

        localisation:
          "",

        role:
          role || ROLES.CLIENT,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    return {

      success: true,

      user: credential.user

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
   CONNEXION EMAIL
   ========================================================= */

export async function loginUser(
  email,
  password
) {

  try {

    await authReady;


    const credential =
      await signInWithEmailAndPassword(
        auth,
        clean(email),
        password
      );


    return {

      success: true,

      user: credential.user

    };

  } catch (error) {

    console.error(
      "Erreur connexion :",
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
   CONNEXION GOOGLE
   ========================================================= */

export async function loginGoogle() {

  try {

    await authReady;


    const credential =
      await signInWithPopup(
        auth,
        googleProvider
      );


    const reference =
      doc(
        db,
        COLLECTIONS.USERS,
        credential.user.uid
      );


    const snapshot =
      await getDoc(reference);


    if (!snapshot.exists()) {

      await setDoc(
        reference,
        {

          uid:
            credential.user.uid,

          email:
            credential.user.email ||
            "",

          nom:
            credential.user.displayName ||
            "",

          prenom:
            "",

          telephone:
            "",

          whatsapp:
            "",

          localisation:
            "",

          role:
            ROLES.CLIENT,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );

    }


    return {

      success: true,

      user: credential.user

    };

  } catch (error) {

    console.error(
      "Erreur Google :",
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
   DÉCONNEXION
   ========================================================= */

export async function logout() {

  try {

    await signOut(auth);


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.code ||
        error.message

    };

  }

}


/* =========================================================
   MOT DE PASSE OUBLIÉ
   ========================================================= */

export async function resetPassword(
  email
) {

  try {

    await sendPasswordResetEmail(
      auth,
      clean(email)
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.code ||
        error.message

    };

  }

}


/* =========================================================
   PROFIL
   ========================================================= */

export async function getProfile(
  uid
) {

  try {

    if (!uid) {

      return {

        success: false,

        error:
          "Identifiant utilisateur manquant"

      };

    }


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

        error:
          "Profil non trouvé"

      };

    }


    return {

      success: true,

      data: {

        id:
          snapshot.id,

        ...snapshot.data()

      }

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   MODIFIER PROFIL
   ========================================================= */

export async function updateProfile(
  uid,
  updates
) {

  try {

    if (!uid) {

      return {

        success: false,

        error:
          "Identifiant utilisateur manquant"

      };

    }


    const allowed = [

      "nom",

      "prenom",

      "telephone",

      "whatsapp",

      "localisation"

    ];


    const safe =
      Object.fromEntries(

        Object.entries(
          updates || {}
        ).filter(
          ([key]) =>
            allowed.includes(key)
        )

      );


    await updateDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        uid
      ),
      {

        ...safe,

        updatedAt:
          serverTimestamp()

      }
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   NORMALISER UN SERVICE
   ========================================================= */

export function normalizeService(
  data,
  user
) {

  return {

    titre:
      clean(data.titre),

    description:
      clean(data.description),

    categorie:
      clean(data.categorie),

    localisation:
      clean(data.localisation),

    telephone:
      clean(data.telephone),

    whatsapp:
      clean(
        data.whatsapp ||
        data.telephone
      ),

    imageUrl:
      clean(data.imageUrl),

    prix:
      clean(data.prix),

    /*
     * IMPORTANT :
     * V2 utilise ownerId partout.
     */

    ownerId:
      user.uid,

    status:
      "pending",

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()

  };

}


/* =========================================================
   CRÉER SERVICE
   ========================================================= */

export async function createService(
  data
) {

  const user =
    getCurrentUser();


  if (!user) {

    return {

      success: false,

      error:
        "Utilisateur non connecté"

    };

  }


  try {

    const reference =
      await addDoc(
        collection(
          db,
          COLLECTIONS.SERVICES
        ),
        normalizeService(
          data,
          user
        )
      );


    return {

      success: true,

      id:
        reference.id

    };

  } catch (error) {

    console.error(
      "Erreur création service :",
      error
    );


    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   RÉCUPÉRER UN SERVICE
   ========================================================= */

export async function getService(
  id
) {

  try {

    if (!id) {

      return {

        success: false,

        error:
          "ID du service manquant"

      };

    }


    const snapshot =
      await getDoc(
        doc(
          db,
          COLLECTIONS.SERVICES,
          id
        )
      );


    if (!snapshot.exists()) {

      return {

        success: false,

        error:
          "Service non trouvé"

      };

    }


    return {

      success: true,

      data: {

        id:
          snapshot.id,

        ...snapshot.data()

      }

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   SERVICES APPROUVÉS
   =========================================================
   On évite orderBy Firestore ici afin de limiter
   les problèmes d'index composite.
   ========================================================= */

export async function listApprovedServices(
  max = 50
) {

  try {

    const q =
      query(

        collection(
          db,
          COLLECTIONS.SERVICES
        ),

        where(
          "status",
          "==",
          "approved"
        ),

        limit(max)

      );


    const snapshot =
      await getDocs(q);


    const data =
      snapshot.docs.map(
        document => ({

          id:
            document.id,

          ...document.data()

        })
      );


    data.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis?.() ||
          0;

        const dateB =
          b.createdAt?.toMillis?.() ||
          0;

        return dateB - dateA;

      }
    );


    return {

      success: true,

      data

    };

  } catch (error) {

    console.error(
      "Erreur services approuvés :",
      error
    );


    return {

      success: false,

      error:
        error.message,

      data: []

    };

  }

}


/* =========================================================
   MES SERVICES
   ========================================================= */

export async function listMyServices(
  uid
) {

  try {

    if (!uid) {

      return {

        success: false,

        error:
          "Utilisateur manquant",

        data: []

      };

    }


    const q =
      query(

        collection(
          db,
          COLLECTIONS.SERVICES
        ),

        where(
          "ownerId",
          "==",
          uid
        )

      );


    const snapshot =
      await getDocs(q);


    const data =
      snapshot.docs.map(
        document => ({

          id:
            document.id,

          ...document.data()

        })
      );


    data.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis?.() ||
          0;

        const dateB =
          b.createdAt?.toMillis?.() ||
          0;

        return dateB - dateA;

      }
    );


    return {

      success: true,

      data

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message,

      data: []

    };

  }

}


/* =========================================================
   MODIFIER SERVICE
   ========================================================= */

export async function updateService(
  id,
  updates
) {

  try {

    if (!id) {

      return {

        success: false,

        error:
          "ID du service manquant"

      };

    }


    const allowed = [

      "titre",

      "description",

      "categorie",

      "localisation",

      "telephone",

      "whatsapp",

      "imageUrl",

      "prix"

    ];


    const safe =
      Object.fromEntries(

        Object.entries(
          updates || {}
        ).filter(
          ([key]) =>
            allowed.includes(key)
        )

      );


    await updateDoc(
      doc(
        db,
        COLLECTIONS.SERVICES,
        id
      ),
      {

        ...safe,

        status:
          "pending",

        updatedAt:
          serverTimestamp()

      }
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   SUPPRIMER SERVICE
   ========================================================= */

export async function deleteService(
  id
) {

  try {

    if (!id) {

      return {

        success: false,

        error:
          "ID du service manquant"

      };

    }


    await deleteDoc(
      doc(
        db,
        COLLECTIONS.SERVICES,
        id
      )
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   FAVORIS
   ========================================================= */

export async function getFavorites() {

  const user =
    getCurrentUser();


  if (!user) {

    return {

      success: false,

      error:
        "Utilisateur non connecté",

      ids: []

    };

  }


  try {

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
        )

      );


    const snapshot =
      await getDocs(q);


    return {

      success: true,

      ids:
        snapshot.docs.map(
          document =>
            document.data().serviceId
        )

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message,

      ids: []

    };

  }

}


/* =========================================================
   AJOUT FAVORI
   ========================================================= */

export async function addFavorite(
  serviceId
) {

  const user =
    getCurrentUser();


  if (!user) {

    return {

      success: false,

      error:
        "Connectez-vous d'abord"

    };

  }


  try {

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


    const existing =
      await getDocs(q);


    if (!existing.empty) {

      return {

        success: true,

        exists: true

      };

    }


    await addDoc(
      collection(
        db,
        COLLECTIONS.FAVORIS
      ),
      {

        userId:
          user.uid,

        serviceId,

        createdAt:
          serverTimestamp()

      }
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   RETIRER FAVORI
   ========================================================= */

export async function removeFavorite(
  serviceId
) {

  const user =
    getCurrentUser();


  if (!user) {

    return {

      success: false,

      error:
        "Connectez-vous d'abord"

    };

  }


  try {

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


    await Promise.all(

      snapshot.docs.map(
        document =>
          deleteDoc(
            document.ref
          )
      )

    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   SERVICES FAVORIS
   ========================================================= */

export async function getFavoriteServices() {

  const favorites =
    await getFavorites();


  if (!favorites.success) {

    return favorites;

  }


  const snapshots =
    await Promise.all(

      favorites.ids.map(
        id =>
          getDoc(
            doc(
              db,
              COLLECTIONS.SERVICES,
              id
            )
          )
      )

    );


  return {

    success: true,

    data:
      snapshots
        .filter(
          snapshot =>
            snapshot.exists()
        )
        .map(
          snapshot => ({

            id:
              snapshot.id,

            ...snapshot.data()

          })
        )

  };

}


/* =========================================================
   COMMUNIQUÉS
   ========================================================= */

export async function listCommuniques(
  max = 30
) {

  try {

    const q =
      query(

        collection(
          db,
          COLLECTIONS.COMMUNIQUES
        ),

        where(
          "published",
          "==",
          true
        ),

        limit(max)

      );


    const snapshot =
      await getDocs(q);


    const data =
      snapshot.docs.map(
        document => ({

          id:
            document.id,

          ...document.data()

        })
      );


    data.sort(
      (a, b) => {

        const dateA =
          a.createdAt?.toMillis?.() ||
          0;

        const dateB =
          b.createdAt?.toMillis?.() ||
          0;

        return dateB - dateA;

      }
    );


    return {

      success: true,

      data

    };

  } catch (error) {

    console.error(
      "Erreur communiqués :",
      error
    );


    return {

      success: false,

      error:
        error.message,

      data: []

    };

  }

}


/* =========================================================
   CRÉER COMMUNIQUÉ
   ========================================================= */

export async function createCommunique(
  data
) {

  try {

    const user =
      getCurrentUser();


    if (!user) {

      return {

        success: false,

        error:
          "Utilisateur non connecté"

      };

    }


    const reference =
      await addDoc(
        collection(
          db,
          COLLECTIONS.COMMUNIQUES
        ),
        {

          titre:
            clean(data.titre),

          description:
            clean(data.description),

          type:
            clean(data.type) ||
            "Information",

          published:
            true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          ownerId:
            user.uid

        }
      );


    return {

      success: true,

      id:
        reference.id

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   SUPPRIMER COMMUNIQUÉ
   ========================================================= */

export async function deleteCommunique(
  id
) {

  try {

    await deleteDoc(
      doc(
        db,
        COLLECTIONS.COMMUNIQUES,
        id
      )
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   AVIS
   ========================================================= */

export async function addReview(
  serviceId,
  note,
  commentaire
) {

  const user =
    getCurrentUser();


  if (!user) {

    return {

      success: false,

      error:
        "Connectez-vous d'abord"

    };

  }


  try {

    const profile =
      await getProfile(
        user.uid
      );


    const numericNote =
      Number(note);


    if (
      !Number.isFinite(numericNote) ||
      numericNote < 1 ||
      numericNote > 5
    ) {

      return {

        success: false,

        error:
          "La note doit être comprise entre 1 et 5"

      };

    }


    await addDoc(
      collection(
        db,
        COLLECTIONS.AVIS
      ),
      {

        serviceId,

        userId:
          user.uid,

        userName:
          profile.data?.nom ||
          user.email ||
          "Utilisateur",

        note:
          numericNote,

        commentaire:
          clean(commentaire),

        createdAt:
          serverTimestamp()

      }
    );


    return {

      success: true

    };

  } catch (error) {

    return {

      success: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   THÈME
   ========================================================= */

export function applyTheme() {

  const dark =
    localStorage.getItem(
      "camu-theme"
    ) === "dark";


  document.documentElement
    .classList.toggle(
      "dark",
      dark
    );

}


export function toggleTheme() {

  const dark =
    !document.documentElement
      .classList.contains("dark");


  localStorage.setItem(
    "camu-theme",
    dark
      ? "dark"
      : "light"
  );


  applyTheme();

}


applyTheme();


/* =========================================================
   FIN APP.JS
   ========================================================= */

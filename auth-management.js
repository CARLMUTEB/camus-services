/**
 * CAMU SERVICES
 * Gestion centralisée de l'authentification
 */

import {
  auth,
  db
} from "./app.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// =====================================================
// UTILISATEUR ACTUEL
// =====================================================

let currentUser = null;

let currentUserData = null;


// =====================================================
// SURVEILLANCE AUTHENTIFICATION
// =====================================================

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (!user) {

    currentUserData = null;

    return;

  }


  try {

    const userRef =
      doc(db, "users", user.uid);

    const userSnap =
      await getDoc(userRef);


    // -------------------------------------------------
    // CRÉATION DU PROFIL FIRESTORE
    // -------------------------------------------------

    if (!userSnap.exists()) {

      const newUser = {

        uid: user.uid,

        nom:
          user.displayName ||
          "Utilisateur",

        email:
          user.email ||
          "",

        role: "client",

        status: "actif",

        createdAt:
          serverTimestamp()

      };


      await setDoc(
        userRef,
        newUser
      );

      currentUserData = newUser;

    }

    else {

      currentUserData =
        userSnap.data();

    }


    // -------------------------------------------------
    // COMPTE SUSPENDU
    // -------------------------------------------------

    if (
      currentUserData.status ===
      "suspendu"
    ) {

      alert(
        "Votre compte a été suspendu par l'administrateur."
      );

      await signOut(auth);

      window.location.href =
        "connexion.html";

      return;

    }


    console.log(
      "Utilisateur connecté :",
      user.uid
    );


  } catch (error) {

    console.error(
      "Erreur vérification utilisateur :",
      error
    );

  }

});


// =====================================================
// EXPORTS
// =====================================================

export {
  currentUser,
  currentUserData
};

/* =========================================================
   CAMU SERVICES — AUTHENTIFICATION
   js/auth.js

   Firebase gère uniquement :
   - Inscription
   - Connexion
   - Déconnexion
   - État de connexion
   - Informations utilisateur
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION FIREBASE
   ========================================================= */

/*
   ⚠️ REMPLACE CES VALEURS PAR CELLES DE TON PROJET FIREBASE.
*/

const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "TON_PROJET.firebaseapp.com",
    projectId: "TON_PROJECT_ID",
    storageBucket: "TON_PROJET.firebasestorage.app",
    messagingSenderId: "TON_SENDER_ID",
    appId: "TON_APP_ID"
};


/* =========================================================
   INITIALISATION
   ========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   ÉTAT GLOBAL
   ========================================================= */

let currentUser = null;


/* =========================================================
   OUTILS
   ========================================================= */

function getUser() {
    return currentUser;
}


function isAuthenticated() {
    return currentUser !== null;
}


/* =========================================================
   INSCRIPTION
   ========================================================= */

async function registerUser({
    email,
    password,
    displayName = "",
    role = "client"
}) {

    try {

        if (!email || !password) {
            throw new Error("L'adresse e-mail et le mot de passe sont obligatoires.");
        }

        if (password.length < 6) {
            throw new Error(
                "Le mot de passe doit contenir au moins 6 caractères."
            );
        }


        /* Création du compte */

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );


        const user = credential.user;


        /* Nom affiché */

        if (displayName.trim()) {

            await updateProfile(user, {
                displayName: displayName.trim()
            });

        }


        /* Création du profil Firestore */

        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,

                email: user.email,

                displayName:
                    displayName.trim() ||
                    "Utilisateur",

                role: role,

                photoURL: "",

                createdAt: serverTimestamp(),

                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );


        return {
            success: true,
            user: user
        };


    } catch (error) {

        console.error(
            "Erreur inscription :",
            error
        );


        return {
            success: false,
            error: getAuthErrorMessage(error)
        };

    }

}


/* =========================================================
   CONNEXION
   ========================================================= */

async function loginUser(email, password) {

    try {

        if (!email || !password) {

            throw new Error(
                "Veuillez remplir tous les champs."
            );

        }


        const credential =
            await signInWithEmailAndPassword(
                auth,
                email.trim(),
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
            error: getAuthErrorMessage(error)
        };

    }

}


/* =========================================================
   DÉCONNEXION
   ========================================================= */

async function logoutUser() {

    try {

        await signOut(auth);

        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );


        return {
            success: false,
            error: getAuthErrorMessage(error)
        };

    }

}


/* =========================================================
   SURVEILLER L'ÉTAT DE CONNEXION
   ========================================================= */

function observeAuth(callback) {

    return onAuthStateChanged(
        auth,
        async (user) => {

            currentUser = user;


            /*
               Si un utilisateur est connecté,
               on récupère également son profil Firestore.
            */

            let profile = null;


            if (user) {

                try {

                    const userRef =
                        doc(
                            db,
                            "users",
                            user.uid
                        );

                    const userSnapshot =
                        await getDoc(userRef);


                    if (userSnapshot.exists()) {

                        profile =
                            userSnapshot.data();

                    }

                } catch (error) {

                    console.warn(
                        "Impossible de récupérer le profil Firestore :",
                        error
                    );

                }

            }


            if (typeof callback === "function") {

                callback(
                    user,
                    profile
                );

            }

        }
    );

}


/* =========================================================
   RÉCUPÉRER LE PROFIL UTILISATEUR
   ========================================================= */

async function getUserProfile(uid = null) {

    try {

        const userId =
            uid ||
            currentUser?.uid;


        if (!userId) {
            return null;
        }


        const userRef =
            doc(
                db,
                "users",
                userId
            );


        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {
            return null;
        }


        return {
            id: snapshot.id,
            ...snapshot.data()
        };


    } catch (error) {

        console.error(
            "Erreur récupération profil :",
            error
        );

        return null;

    }

}


/* =========================================================
   TRADUCTION DES ERREURS FIREBASE
   ========================================================= */

function getAuthErrorMessage(error) {

    if (!error) {
        return "Une erreur inconnue est survenue.";
    }


    switch (error.code) {

        case "auth/email-already-in-use":

            return "Cette adresse e-mail est déjà utilisée.";


        case "auth/invalid-email":

            return "L'adresse e-mail n'est pas valide.";


        case "auth/weak-password":

            return "Le mot de passe est trop faible.";


        case "auth/user-not-found":

            return "Aucun compte ne correspond à cette adresse e-mail.";


        case "auth/wrong-password":

            return "Mot de passe incorrect.";


        case "auth/invalid-credential":

            return "E-mail ou mot de passe incorrect.";


        case "auth/too-many-requests":

            return "Trop de tentatives. Veuillez réessayer plus tard.";


        case "auth/network-request-failed":

            return "Problème de connexion Internet.";


        case "auth/user-disabled":

            return "Ce compte a été désactivé.";


        default:

            return (
                error.message ||
                "Une erreur est survenue."
            );

    }

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    auth,

    db,

    getUser,

    isAuthenticated,

    registerUser,

    loginUser,

    logoutUser,

    observeAuth,

    getUserProfile

};
```

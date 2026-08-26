// =========================================================
// CAMU SERVICES — CONFIGURATION FIREBASE
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================================================
// CONFIGURATION DU PROJET FIREBASE
// =========================================================

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
        "1:879100396449:web:9d7ffe441a3df2daf841e0",

    measurementId:
        "G-RQ16SX2SNV"
};


// =========================================================
// INITIALISATION FIREBASE
// =========================================================

const app =
    initializeApp(firebaseConfig);


// =========================================================
// AUTHENTIFICATION
// =========================================================

const auth =
    getAuth(app);


// =========================================================
// FIRESTORE
// =========================================================

const db =
    getFirestore(app);


// =========================================================
// EXPORTS
// =========================================================

export {
    app,
    auth,
    db
};

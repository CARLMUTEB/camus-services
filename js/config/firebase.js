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

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// =========================================================
// CONFIGURATION DU PROJET
// =========================================================

const firebaseConfig = {

    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",

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
// INITIALISATION
// =========================================================

const app =
    initializeApp(firebaseConfig);


// =========================================================
// SERVICES FIREBASE
// =========================================================

export const auth =
    getAuth(app);

export const db =
    getFirestore(app);

export const storage =
    getStorage(app);

export default app;
```

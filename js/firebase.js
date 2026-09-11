// ============================================================
// CAMU SERVICES - FIREBASE
// ============================================================

// Import Firebase App
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


// Import Firebase Analytics
import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";


// Import Firebase Authentication
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// Import Firestore
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Import Firebase Storage
import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// ============================================================
// CONFIGURATION FIREBASE
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
    authDomain: "camu-services.firebaseapp.com",
    projectId: "camu-services",
    storageBucket: "camu-services.appspot.com",
    messagingSenderId: "879100396449",
    appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
    measurementId: "G-RQ16SX2SNV"
};


// ============================================================
// INITIALISATION FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// ANALYTICS
// ============================================================

let analytics = null;

try {

    analytics = getAnalytics(app);

    console.log(
        "CAMU SERVICES : Firebase Analytics chargé."
    );

} catch (error) {

    console.warn(
        "Firebase Analytics non disponible :",
        error
    );

}


// ============================================================
// SERVICES FIREBASE
// ============================================================

export const auth =
    getAuth(app);


export const db =
    getFirestore(app);


export const storage =
    getStorage(app);


// ============================================================
// EXPORT APP
// ============================================================

export {
    app,
    analytics
};


console.log(
    "CAMU SERVICES : Firebase initialisé correctement."
);

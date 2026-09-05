// Import des modules Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration Firebase (tes vraies clés)
const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.appspot.com",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
  measurementId: "G-RQ16SX2SNV"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

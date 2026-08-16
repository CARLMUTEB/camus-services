import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Surveillance de l'état de connexion & Vérification du statut
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // Vérification si le compte est suspendu par l'admin
      if (userData.status === "suspendu") {
        alert("Votre compte a été suspendu par l'administrateur. Accès refusé.");
        await signOut(auth);
        window.location.href = "login.html";
        return;
      }
    } else {
      // Création automatique du document utilisateur dans Firestore s'il n'existe pas
      await setDoc(userRef, {
        uid: user.uid,
        nom: user.displayName || "Entrepreneur",
        email: user.email || "",
        status: "actif",
        createdAt: serverTimestamp()
      });
    }
  }
});

// Exportation des instances pour réutilisation dans d'autres modules
export { auth, db };


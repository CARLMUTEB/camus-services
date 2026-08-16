import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Vérification continue du statut de l'utilisateur
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Expulsion immédiate si le compte est suspendu
      if (userData.status === "suspendu") {
        alert("🚫 VOTRE COMPTE A ÉTÉ SUSPENDU pour non-respect des conditions d'utilisation.\n\nVeuillez contacter le support de CAMU SERVICES.");
        await signOut(auth);
        window.location.href = "index.html";
        return;
      }

      // Bannière d'avertissement
      if (userData.warnings > 0) {
        showWarningBanner(userData.warnings);
      }
    } else {
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName || "Entrepreneur",
        status: "actif",
        warnings: 0,
        createdAt: new Date()
      });
    }
  }
});

// Connexion sécurisée
window.loginUser = async function(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists() && userDoc.data().status === "suspendu") {
      await signOut(auth);
      alert("🚫 Connexion impossible : Ce compte est suspendu.");
      return false;
    }

    alert("Connexion réussie !");
    window.location.href = "profil.html";
    return true;
  } catch (error) {
    alert("Identifiants incorrects ou erreur de connexion.");
    return false;
  }
};

// Déconnexion
window.logoutUser = async function() {
  await signOut(auth);
  window.location.href = "index.html";
};

// Affichage de l'alerte d'avertissement
function showWarningBanner(warningsCount) {
  if (document.getElementById('user-warning-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'user-warning-banner';
  banner.style.cssText = `
    background-color: #fff3e0; color: #e65100; border: 1px solid #ffe0b2;
    padding: 10px 15px; margin: 10px; border-radius: 8px; font-size: 12px;
    font-weight: bold; display: flex; align-items: center; justify-content: space-between;
  `;
  
  banner.innerHTML = `
    <div>⚠️ <strong>Attention :</strong> Votre compte fait l'objet de ${warningsCount} avertissement(s) sur 3.</div>
    <button onclick="document.getElementById('user-warning-banner').remove()" style="background:none; border:none; color:#e65100; font-weight:bold; cursor:pointer;">✕</button>
  `;

  const mainContent = document.querySelector('main') || document.body;
  mainContent.insertBefore(banner, mainContent.firstChild);
    }
        

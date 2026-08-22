/* =========================================================
   CAMU SERVICES — APPLICATION PRINCIPALE
   Version : 2.2 (avec persistance et corrections)
   ========================================================= */

/* =========================================================
   IMPORTS FIREBASE
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


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

// Activer la persistance locale (rester connecté après rechargement)
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistance Firebase activée."))
  .catch((error) => console.error("Erreur de persistance :", error));

// Rendre disponible globalement
window.db = db;
window.auth = auth;


/* =========================================================
   CONSTANTES
   ========================================================= */

const COLLECTIONS = {
  USERS: "users",
  SERVICES: "services",
  COMMUNIQUES: "communiques",
  FAVORIS: "favoris",
  AVIS: "avis"
};

const ROLES = {
  CLIENT: "client",
  VENDEUR: "vendeur",
  PRESTATAIRE: "prestataire",
  ADMIN: "admin"
};


/* =========================================================
   UTILITAIRES
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formaterDate(value) {
  if (!value) return "";
  
  try {
    let date;
    
    if (value && typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "number") {
      date = new Date(value);
    } else {
      date = new Date(value);
    }
    
    if (isNaN(date.getTime())) return "";
    
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    return "";
  }
}

/* =========================================================
   FONCTIONS WHATSAPP
   ========================================================= */

function formaterNumeroWhatsApp(numero) {
  if (!numero) return "";
  let numeroPropre = String(numero).replace(/\D/g, "");
  if (!numeroPropre.startsWith("225") && numeroPropre.length === 10) {
    numeroPropre = "225" + numeroPropre;
  }
  return numeroPropre;
}

function creerLienWhatsApp(numero, message = "") {
  const numeroFormate = formaterNumeroWhatsApp(numero);
  if (!numeroFormate) return "#";
  let lien = `https://wa.me/${numeroFormate}`;
  if (message) {
    lien += `?text=${encodeURIComponent(message)}`;
  }
  return lien;
}

function genererMessageWhatsApp(service, type = "contact") {
  const nomService = service.titre || service.nom || "Service";
  const prestataire = service.prestataire || service.proprietaire || "";
  
  let message = "";
  
  switch (type) {
    case "contact":
      message = `Bonjour${prestataire ? " " + prestataire : ""},\n\nJe vous contacte depuis Camus Services concernant votre service : "${nomService}".\n\nJ'aimerais avoir plus d'informations.\n\nMerci.`;
      break;
    case "devis":
      message = `Bonjour${prestataire ? " " + prestataire : ""},\n\nJe souhaite un devis pour le service : "${nomService}" sur Camus Services.\n\nMerci de me communiquer vos tarifs et disponibilités.`;
      break;
    case "commande":
      message = `Bonjour${prestataire ? " " + prestataire : ""},\n\nJe souhaite commander le service : "${nomService}" via Camus Services.\n\nMerci de me confirmer la disponibilité.`;
      break;
    default:
      message = `Bonjour, je vous contacte depuis Camus Services concernant "${nomService}".`;
  }
  
  return message;
}

function ouvrirWhatsApp(numero, message = "") {
  const lien = creerLienWhatsApp(numero, message);
  if (lien === "#") {
    alert("Numéro WhatsApp non disponible pour ce service.");
    return;
  }
  window.open(lien, "_blank");
}

function partagerSurWhatsApp(service) {
  const urlPage = window.location.href;
  const nomService = service.titre || service.nom || "Service";
  const message = `Découvrez ce service sur Camus Services : ${nomService}\n\n${urlPage}`;
  const lien = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(lien, "_blank");
}

/* =========================================================
   THÈME ET LANGUE
   ========================================================= */

function appliquerTheme() {
  const theme = localStorage.getItem("camu_theme");
  if (theme === "dark") {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }
}

function appliquerLangue() {
  const language = localStorage.getItem("camu_language");
  document.documentElement.lang = language || "fr";
}

appliquerTheme();
appliquerLangue();


/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

// Inscription avec email/password
export async function inscriptionUtilisateur(email, password, profil = {}) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Mettre à jour le profil
    if (profil.prenom && profil.nom) {
      await updateProfile(user, {
        displayName: `${profil.prenom} ${profil.nom}`
      });
    }
    
    // Créer le document utilisateur dans Firestore avec l'UID comme ID
    const userData = {
      uid: user.uid,
      email: email,
      nom: profil.nom || "",
      prenom: profil.prenom || "",
      role: profil.role || ROLES.CLIENT,
      telephone: profil.telephone || "",
      whatsapp: profil.whatsapp || profil.telephone || "",
      localisation: profil.localisation || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Utiliser l'UID comme ID du document
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);
    
    return {
      success: true,
      user: user,
      userData: userData
    };
  } catch (error) {
    console.error("Erreur inscription :", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Connexion avec email/password
export async function connexionUtilisateur(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Récupérer les données utilisateur depuis Firestore (par UID)
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid));
    
    return {
      success: true,
      user: userCredential.user,
      userData: userDoc.data() || {}
    };
  } catch (error) {
    console.error("Erreur connexion :", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Connexion avec Google
export async function connexionGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Vérifier si l'utilisateur existe déjà
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    
    if (!userDoc.exists()) {
      // Créer le profil utilisateur
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        uid: user.uid,
        email: user.email,
        nom: user.displayName || "",
        prenom: "",
        role: ROLES.CLIENT,
        telephone: "",
        whatsapp: "",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error("Erreur connexion Google :", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Déconnexion
export async function deconnexion() {
  try {
    await signOut(auth);
    console.log("CAMU SERVICES : utilisateur déconnecté.");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erreur déconnexion :", error);
    alert("Impossible de se déconnecter. Veuillez réessayer.");
  }
}

// Vérifier l'état de connexion
export function getCurrentUser() {
  return auth.currentUser;
}

export function isUserConnected() {
  return !!auth.currentUser;
}


/* =========================================================
   ÉTAT D'AUTHENTIFICATION GLOBAL
   ========================================================= */

onAuthStateChanged(auth, (user) => {
  console.log("État d'authentification :", user ? user.email : "déconnecté");
  window.camuCurrentUser = user || null;
  
  document.dispatchEvent(new CustomEvent("camu-auth-changed", {
    detail: { user: user || null }
  }));
  
  document.dispatchEvent(new CustomEvent("camu-user-ready", {
    detail: { user: user || null }
  }));
});


/* =========================================================
   GESTION DES UTILISATEURS
   ========================================================= */

export async function creerProfilUtilisateur(uid, userData) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, uid), {
      ...userData,
      uid: uid,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur création profil :", error);
    return { success: false, error: error.message };
  }
}

export async function mettreAJourProfil(uid, updates) {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour profil :", error);
    return { success: false, error: error.message };
  }
}

export async function obtenirProfil(uid) {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: "Profil non trouvé" };
    }
  } catch (error) {
    console.error("Erreur récupération profil :", error);
    return { success: false, error: error.message };
  }
}


/* =========================================================
   GESTION DES SERVICES
   ========================================================= */

export async function creerService(serviceData) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non connecté");
    
    const profil = await obtenirProfil(user.uid);
    const whatsapp = profil.success ? profil.data.whatsapp || profil.data.telephone : "";
    
    const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), {
      ...serviceData,
      userId: user.uid,
      whatsapp: whatsapp,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "actif"
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Erreur création service :", error);
    return { success: false, error: error.message };
  }
}

export async function obtenirService(serviceId) {
  try {
    const serviceDoc = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
    if (serviceDoc.exists()) {
      return { success: true, data: { id: serviceDoc.id, ...serviceDoc.data() } };
    } else {
      return { success: false, error: "Service non trouvé" };
    }
  } catch (error) {
    console.error("Erreur récupération service :", error);
    return { success: false, error: error.message };
  }
}

export async function mettreAJourService(serviceId, updates) {
  try {
    await updateDoc(doc(db, COLLECTIONS.SERVICES, serviceId), {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour service :", error);
    return { success: false, error: error.message };
  }
}

export async function supprimerService(serviceId) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression service :", error);
    return { success: false, error: error.message };
  }
}

export async function obtenirServicesParUtilisateur(userId) {
  try {
    const q = query(collection(db, COLLECTIONS.SERVICES), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const services = [];
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, services };
  } catch (error) {
    console.error("Erreur récupération services :", error);
    return { success: false, error: error.message };
  }
}

export async function chargerServicesPage(limite = 10, dernierDoc = null) {
  try {
    const servicesRef = collection(db, COLLECTIONS.SERVICES);
    let q = query(servicesRef, orderBy("createdAt", "desc"), limit(limite));
    if (dernierDoc) {
      q = query(servicesRef, orderBy("createdAt", "desc"), startAfter(dernierDoc), limit(limite));
    }
    const snapshot = await getDocs(q);
    const services = [];
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return {
      success: true,
      services,
      dernierDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error) {
    console.error("Erreur chargement services :", error);
    return { success: false, error: error.message };
  }
}


/* =========================================================
   GESTION DES FAVORIS
   ========================================================= */

export async function ajouterFavori(serviceId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non connecté");
    
    const q = query(
      collection(db, COLLECTIONS.FAVORIS),
      where("userId", "==", user.uid),
      where("serviceId", "==", serviceId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { success: false, error: "Déjà dans vos favoris" };
    }
    
    await addDoc(collection(db, COLLECTIONS.FAVORIS), {
      userId: user.uid,
      serviceId: serviceId,
      createdAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erreur ajout favori :", error);
    return { success: false, error: error.message };
  }
}

export async function retirerFavori(serviceId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non connecté");
    
    const q = query(
      collection(db, COLLECTIONS.FAVORIS),
      where("userId", "==", user.uid),
      where("serviceId", "==", serviceId)
    );
    const snapshot = await getDocs(q);
    
    const promises = [];
    snapshot.forEach((doc) => {
      promises.push(deleteDoc(doc.ref));
    });
    await Promise.all(promises);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur retrait favori :", error);
    return { success: false, error: error.message };
  }
}

export async function obtenirFavoris() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non connecté");
    
    const q = query(
      collection(db, COLLECTIONS.FAVORIS),
      where("userId", "==", user.uid)
    );
    const snapshot = await getDocs(q);
    const favoris = [];
    snapshot.forEach((doc) => {
      favoris.push(doc.data().serviceId);
    });
    
    return { success: true, favoris };
  } catch (error) {
    console.error("Erreur récupération favoris :", error);
    return { success: false, error: error.message };
  }
}


/* =========================================================
   GESTION DES AVIS
   ========================================================= */

export async function ajouterAvis(serviceId, note, commentaire) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non connecté");
    
    await addDoc(collection(db, COLLECTIONS.AVIS), {
      serviceId: serviceId,
      userId: user.uid,
      note: note,
      commentaire: commentaire,
      createdAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erreur ajout avis :", error);
    return { success: false, error: error.message };
  }
}

export async function obtenirAvis(serviceId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.AVIS),
      where("serviceId", "==", serviceId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const avis = [];
    snapshot.forEach((doc) => {
      avis.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, avis };
  } catch (error) {
    console.error("Erreur récupération avis :", error);
    return { success: false, error: error.message };
  }
}


/* =========================================================
   CHARGEMENT DES COMMUNIQUÉS
   ========================================================= */

async function chargerCommuniquesFirebase() {
  const container = document.getElementById("communiquesContainer");
  if (!container) return;
  
  container.innerHTML = `
    <div class="announcement-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      Chargement des communiqués...
    </div>
  `;
  
  try {
    const communiquesRef = collection(db, COLLECTIONS.COMMUNIQUES);
    let snapshot;
    
    try {
      const q = query(communiquesRef, orderBy("date", "desc"), limit(10));
      snapshot = await getDocs(q);
    } catch (error) {
      console.warn("Tri par date impossible, récupération simple :", error);
      snapshot = await getDocs(query(communiquesRef, limit(10)));
    }
    
    if (snapshot.empty) {
      container.innerHTML = `
        <div class="announcement-empty">
          <i class="fa-solid fa-bullhorn"></i>
          <h3>Aucun communiqué</h3>
          <p>Aucun communiqué n'est disponible pour le moment.</p>
        </div>
      `;
      return;
    }
    
    let html = "";
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const titre = data.titre || data.title || data.nom || "Communiqué";
      const contenu = data.contenu || data.message || data.description || data.texte || "";
      const type = data.type || data.categorie || "Information";
      const date = formaterDate(data.date || data.createdAt || data.timestamp);
      
      html += `
        <article class="announcement-box" data-communique-id="${escapeHTML(docSnap.id)}">
          <div class="announcement-icon">
            <i class="fa-solid fa-bullhorn"></i>
          </div>
          <div class="announcement-content">
            <span class="announcement-label">${escapeHTML(type)}</span>
            <h3>${escapeHTML(titre)}</h3>
            <p>${escapeHTML(contenu)}</p>
            ${date ? `
              <div class="announcement-date">
                <i class="fa-regular fa-calendar"></i>
                ${escapeHTML(date)}
              </div>
            ` : ""}
          </div>
        </article>
      `;
    });
    
    container.innerHTML = html;
    document.dispatchEvent(new CustomEvent("camu-communiques-loaded"));
  } catch (error) {
    console.error("Erreur lors du chargement des communiqués :", error);
    container.innerHTML = `
      <div class="announcement-error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <strong>Impossible de charger les communiqués.</strong>
        <p>Vérifiez la connexion à Firebase et les règles Firestore.</p>
      </div>
    `;
  }
}


/* =========================================================
   CHARGEMENT DES SERVICES
   ========================================================= */

async function chargerServicesFirebase(categorie = null) {
  const container = document.getElementById("servicesContainer");
  if (!container) return;
  
  container.innerHTML = `
    <p style="text-align:center; grid-column:1/-1; padding:20px;">
      Chargement des services...
    </p>
  `;
  
  try {
    const servicesRef = collection(db, COLLECTIONS.SERVICES);
    let q;
    
    if (categorie && categorie !== "tous") {
      q = query(servicesRef, where("categorie", "==", categorie), orderBy("createdAt", "desc"));
    } else {
      q = query(servicesRef, orderBy("createdAt", "desc"));
    }
    
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (error) {
      console.warn("Tri des services impossible, récupération simple :", error);
      snapshot = await getDocs(query(servicesRef));
    }
    
    if (snapshot.empty) {
      container.innerHTML = `
        <p style="text-align:center; grid-column:1/-1; padding:20px;">
          Aucune annonce pour le moment.
        </p>
      `;
      document.dispatchEvent(new CustomEvent("camu-services-loaded"));
      return;
    }
    
    let htmlContent = "";
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const categorie = data.categorie || data.category || "Services";
      const titre = data.titre || data.nom || data.title || "Nom de l'entreprise";
      const description = data.description || "Aucune description disponible.";
      const localisation = data.localisation || data.location || "Disponible localement";
      const note = data.note || data.rating || "4.8";
      const imageUrl = data.imageUrl || data.image || "";
      const whatsapp = data.whatsapp || "";
      const searchText = `${categorie} ${titre} ${description} ${localisation}`.toLowerCase();
      
      const messageContact = genererMessageWhatsApp(data, "contact");
      
      htmlContent += `
        <article class="annonce-card service-card" 
                 data-category="${escapeHTML(categorie)}"
                 data-search="${escapeHTML(searchText)}"
                 data-service-id="${escapeHTML(docSnap.id)}">
          <div class="service-image">
            ${imageUrl ? `
              <img src="${escapeHTML(imageUrl)}" 
                   alt="${escapeHTML(titre)}"
                   style="width:100%; height:100%; object-fit:cover;"
                   loading="lazy">
            ` : `
              <div class="service-placeholder">
                <i class="fa-solid fa-store"></i>
              </div>
            `}
            <span class="featured-badge">
              <i class="fa-solid fa-star"></i>
              ${data.featured || data.sponsorise ? "Sponsorisé" : "Service"}
            </span>
          </div>
          
          <div class="service-card-content">
            <span class="badge-cat">${escapeHTML(categorie)}</span>
            <h3>${escapeHTML(titre)}</h3>
            <p class="service-description">${escapeHTML(description)}</p>
            
            <p class="location">
              <i class="fa-solid fa-location-dot"></i>
              ${escapeHTML(localisation)}
            </p>
            
            <div class="service-footer">
              <span class="service-status">
                <i class="fa-solid fa-circle"></i>
                Disponible
              </span>
              <span class="rating">
                <i class="fa-solid fa-star"></i>
                ${escapeHTML(note)}
              </span>
            </div>
            
            <div class="card-actions">
              <a href="entreprise.html?id=${encodeURIComponent(docSnap.id)}" 
                 class="btn-primary">
                Voir le profil
              </a>
              
              ${whatsapp ? `
                <a href="${creerLienWhatsApp(whatsapp, messageContact)}" 
                   target="_blank"
                   class="btn-whatsapp"
                   title="Contacter sur WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i>
                  WhatsApp
                </a>
              ` : ""}
              
              <button type="button" 
                      class="favorite-btn" 
                      aria-label="Ajouter aux favoris"
                      title="Ajouter aux favoris"
                      onclick="ajouterAuxFavoris('${escapeHTML(docSnap.id)}')">
                <i class="fa-regular fa-heart"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    });
    
    container.innerHTML = htmlContent;
    document.dispatchEvent(new CustomEvent("camu-services-loaded"));
  } catch (error) {
    console.error("Erreur lors du chargement des annonces Firebase :", error);
    container.innerHTML = `
      <p style="text-align:center; grid-column:1/-1; padding:20px;">
        Erreur de chargement des données.
      </p>
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
  
  // Authentification
  getCurrentUser,
  isUserConnected,
  inscriptionUtilisateur,
  connexionUtilisateur,
  connexionGoogle,
  deconnexion,
  logout: deconnexion,
  
  // Utilisateurs
  creerProfilUtilisateur,
  mettreAJourProfil,
  obtenirProfil,
  
  // Services
  creerService,
  obtenirService,
  mettreAJourService,
  supprimerService,
  obtenirServicesParUtilisateur,
  chargerServices: chargerServicesFirebase,
  chargerServicesPage,
  
  // Favoris
  ajouterFavori,
  retirerFavori,
  obtenirFavoris,
  
  // Avis
  ajouterAvis,
  obtenirAvis,
  
  // WhatsApp
  creerLienWhatsApp,
  genererMessageWhatsApp,
  ouvrirWhatsApp,
  partagerSurWhatsApp,
  formaterNumeroWhatsApp,
  
  // Communiqués
  chargerCommuniques: chargerCommuniquesFirebase,
  
  // Utilitaires
  ROLES,
  COLLECTIONS
};


/* =========================================================
   FONCTIONS THÈME ET LANGUE
   ========================================================= */

window.camuSetTheme = function(theme) {
  if (theme !== "dark" && theme !== "light") return;
  
  localStorage.setItem("camu_theme", theme);
  appliquerTheme();
  
  document.dispatchEvent(new CustomEvent("camu-theme-changed", {
    detail: { theme }
  }));
};

window.camuSetLanguage = function(language) {
  if (!language) return;
  
  localStorage.setItem("camu_language", language);
  appliquerLangue();
  
  document.dispatchEvent(new CustomEvent("camu-language-changed", {
    detail: { language }
  }));
};


/* =========================================================
   FONCTIONS GLOBALES POUR LES FAVORIS ET WHATSAPP
   ========================================================= */

window.ajouterAuxFavoris = async function(serviceId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Veuillez vous connecter pour ajouter des favoris.");
      window.location.href = "connexion.html";
      return;
    }
    
    const resultat = await ajouterFavori(serviceId);
    
    if (resultat.success) {
      alert("Service ajouté aux favoris !");
    } else {
      alert("Erreur : " + resultat.error);
    }
  } catch (error) {
    console.error("Erreur ajout favori :", error);
  }
};

window.contacterSurWhatsApp = function(numero, service) {
  const message = genererMessageWhatsApp(service, "contact");
  ouvrirWhatsApp(numero, message);
};

window.demanderDevisSurWhatsApp = function(numero, service) {
  const message = genererMessageWhatsApp(service, "devis");
  ouvrirWhatsApp(numero, message);
};

window.commanderSurWhatsApp = function(numero, service) {
  const message = genererMessageWhatsApp(service, "commande");
  ouvrirWhatsApp(numero, message);
};

window.partagerSurWhatsApp = partagerSurWhatsApp;


/* =========================================================
   INITIALISATION AU CHARGEMENT
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function() {
  await Promise.allSettled([
    chargerCommuniquesFirebase(),
    chargerServicesFirebase()
  ]);
});


/* =========================================================
   FIN APP.JS
   ========================================================= */

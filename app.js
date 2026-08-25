/* =========================================================
   CAMU SERVICES – CŒUR CENTRAL FIREBASE
   Version avec rôles, abonnement et messagerie
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
  sendPasswordResetEmail,
  updatePassword,
  deleteUser
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
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot
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
export const googleProvider = new GoogleAuthProvider();

/* =========================================================
   COLLECTIONS
   ========================================================= */

export const COLLECTIONS = Object.freeze({
  USERS: "users",
  SERVICES: "services",
  FAVORIS: "favoris",
  AVIS: "avis",
  COMMUNIQUES: "communiques",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications"
});

/* =========================================================
   RÔLES
   ========================================================= */

export const ROLES = Object.freeze({
  CLIENT: "client",
  ENTREPRISE: "entreprise",
  ADMIN: "admin"
});

/* =========================================================
   CATÉGORIES (exemple – à adapter)
   ========================================================= */

export const CATEGORIES = Object.freeze([
  "Construction",
  "Transport",
  "Beauté",
  "Restaurant",
  "Informatique",
  "Commerce",
  "Services",
  "Immobilier",
  "Véhicules",
  "Hôtels",
  "Événements"
]);

/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

export const authReady = setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Erreur persistence Firebase :", error);
});

let currentUser = null;

onAuthStateChanged(auth, user => {
  currentUser = user;
  window.dispatchEvent(new CustomEvent("camu-auth", { detail: user }));
});

export function getCurrentUser() {
  return currentUser || auth.currentUser;
}

export function isUserConnected() {
  return !!getCurrentUser();
}

export async function waitForAuth(timeout = 10000) {
  if (auth.currentUser) return auth.currentUser;
  return new Promise(resolve => {
    let finished = false;
    let unsubscribe = null;
    const finish = user => {
      if (finished) return;
      finished = true;
      if (unsubscribe) unsubscribe();
      resolve(user);
    };
    unsubscribe = onAuthStateChanged(auth, finish);
    setTimeout(() => finish(auth.currentUser), timeout);
  });
}

/* =========================================================
   OUTILS
   ========================================================= */

function clean(value = "") {
  return String(value ?? "").trim();
}

export function escapeHTML(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

export function normalizePhone(value = "") {
  return String(value).replace(/[^\d+]/g, "");
}

export function whatsappUrl(phone, message = "") {
  const normalized = normalizePhone(phone).replace(/^\+/, "");
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function serviceWhatsAppMessage(service) {
  return `Bonjour, je viens de CAMU SERVICES. Je souhaite des informations concernant votre service "${service.titre || "service"}".`;
}

/* =========================================================
   ABONNEMENT
   ========================================================= */

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // approximation

export function createTrialSubscription() {
  return {
    statut: "essai",
    dateDebut: serverTimestamp(),
    dateFin: new Date(Date.now() + SIX_MONTHS_MS),
    plan: "gratuit_6mois"
  };
}

export async function checkSubscription(user) {
  if (!user) return { valid: false, error: "Utilisateur non connecté" };
  try {
    const profile = await getProfile(user.uid);
    if (!profile.success || !profile.data) return { valid: false, error: "Profil introuvable" };
    const abonnement = profile.data.abonnement;
    if (!abonnement) return { valid: false, error: "Aucun abonnement" };
    if (abonnement.statut === "expire") return { valid: false, error: "Abonnement expiré" };
    if (abonnement.statut === "suspendu") return { valid: false, error: "Abonnement suspendu" };
    if (abonnement.statut === "essai" || abonnement.statut === "actif") {
      // Vérifier la date d'expiration
      const dateFin = abonnement.dateFin ? new Date(abonnement.dateFin.seconds * 1000) : null;
      if (dateFin && dateFin < new Date()) {
        // Mettre à jour le statut en expiré
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          "abonnement.statut": "expire"
        });
        return { valid: false, error: "Abonnement expiré" };
      }
      return { valid: true, abonnement };
    }
    return { valid: false, error: "Statut inconnu" };
  } catch (error) {
    console.error("Erreur checkSubscription :", error);
    return { valid: false, error: error.message };
  }
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
  localisation = "",
  accountType = ROLES.CLIENT,
  typeActivite = "",
  companyDescription = ""
}) {
  try {
    await authReady;
    const credential = await createUserWithEmailAndPassword(auth, clean(email), password);
    const userData = {
      uid: credential.user.uid,
      email: credential.user.email || clean(email),
      nom: clean(nom),
      prenom: clean(prenom),
      telephone: clean(telephone),
      whatsapp: clean(telephone),
      localisation: clean(localisation),
      role: accountType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (accountType === ROLES.ENTREPRISE) {
      userData.typeActivite = clean(typeActivite);
      userData.companyDescription = clean(companyDescription);
      userData.abonnement = createTrialSubscription();
    }

    await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), userData);
    return { success: true, user: credential.user };
  } catch (error) {
    console.error("Erreur inscription :", error);
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   CONNEXION EMAIL
   ========================================================= */

export async function loginUser(email, password) {
  try {
    await authReady;
    const credential = await signInWithEmailAndPassword(auth, clean(email), password);
    return { success: true, user: credential.user };
  } catch (error) {
    console.error("Erreur connexion :", error);
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   CONNEXION GOOGLE (avec type de compte)
   ========================================================= */

export async function loginGoogle(accountType = ROLES.CLIENT) {
  try {
    await authReady;
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    const reference = doc(db, COLLECTIONS.USERS, user.uid);
    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email || "",
        nom: user.displayName || "",
        prenom: "",
        telephone: "",
        whatsapp: "",
        localisation: "",
        role: accountType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (accountType === ROLES.ENTREPRISE) {
        userData.typeActivite = "";
        userData.companyDescription = "";
        userData.abonnement = createTrialSubscription();
      }
      await setDoc(reference, userData);
    }
    return { success: true, user };
  } catch (error) {
    console.error("Erreur Google :", error);
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   DÉCONNEXION
   ========================================================= */

export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   MOT DE PASSE OUBLIÉ
   ========================================================= */

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, clean(email));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   CHANGER MOT DE PASSE
   ========================================================= */

export async function changePassword(newPassword) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   SUPPRIMER COMPTE
   ========================================================= */

export async function deleteAccount() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    // Supprimer d'abord les données Firestore liées
    await deleteDoc(doc(db, COLLECTIONS.USERS, user.uid));
    // Puis supprimer l'utilisateur Auth
    await deleteUser(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code || error.message };
  }
}

/* =========================================================
   PROFIL
   ========================================================= */

export async function getProfile(uid) {
  try {
    if (!uid) return { success: false, error: "Identifiant utilisateur manquant" };
    const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snapshot.exists()) return { success: false, error: "Profil non trouvé" };
    return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProfile(uid, updates) {
  try {
    if (!uid) return { success: false, error: "Identifiant utilisateur manquant" };
    const allowed = ["nom", "prenom", "telephone", "whatsapp", "localisation", "photoURL", "typeActivite", "companyDescription"];
    const safe = Object.fromEntries(Object.entries(updates || {}).filter(([key]) => allowed.includes(key)));
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { ...safe, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   PASSER CLIENT -> ENTREPRISE
   ========================================================= */

export async function upgradeToEntreprise(data) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    const updateData = {
      role: ROLES.ENTREPRISE,
      typeActivite: clean(data.typeActivite),
      companyDescription: clean(data.companyDescription),
      abonnement: createTrialSubscription(),
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   NORMALISER UNE ANNONCE
   ========================================================= */

export function normalizeService(data, user, typeAnnonce = null) {
  const isEntreprise = user.role === ROLES.ENTREPRISE;
  const finalTypeAnnonce = typeAnnonce || (isEntreprise ? "pro" : "basique");
  return {
    titre: clean(data.titre),
    description: clean(data.description),
    categorie: clean(data.categorie),
    localisation: clean(data.localisation),
    telephone: clean(data.telephone),
    whatsapp: clean(data.whatsapp || data.telephone),
    imageUrl: clean(data.imageUrl),
    prix: clean(data.prix),
    ownerId: user.uid,
    typeAnnonce: finalTypeAnnonce,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

/* =========================================================
   CRÉER UNE ANNONCE
   ========================================================= */

export async function createService(data) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Utilisateur non connecté" };
  try {
    const profile = await getProfile(user.uid);
    if (!profile.success) return { success: false, error: "Profil introuvable" };

    // Vérifier l'abonnement si entreprise
    if (profile.data.role === ROLES.ENTREPRISE) {
      const subCheck = await checkSubscription(user);
      if (!subCheck.valid) return { success: false, error: subCheck.error };
    }
    // Limitation pour clients
    if (profile.data.role === ROLES.CLIENT) {
      const q = query(collection(db, COLLECTIONS.SERVICES), where("ownerId", "==", user.uid), where("status", "in", ["pending", "approved"]));
      const snapshot = await getDocs(q);
      if (snapshot.size >= 3) {
        return { success: false, error: "Limite de 3 annonces actives atteinte. Passez en compte entreprise pour plus." };
      }
    }

    const serviceData = normalizeService(data, user);
    const reference = await addDoc(collection(db, COLLECTIONS.SERVICES), serviceData);
    return { success: true, id: reference.id };
  } catch (error) {
    console.error("Erreur création service :", error);
    return { success: false, error: error.message };
  }
}

/* =========================================================
   RÉCUPÉRER UNE ANNONCE
   ========================================================= */

export async function getService(id) {
  try {
    if (!id) return { success: false, error: "ID du service manquant" };
    const snapshot = await getDoc(doc(db, COLLECTIONS.SERVICES, id));
    if (!snapshot.exists()) return { success: false, error: "Service non trouvé" };
    return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   SERVICES APPROUVÉS (avec filtres)
   ========================================================= */

export async function listApprovedServices({
  max = 20,
  categorie = null,
  typeAnnonce = null,
  localisation = null,
  prixMin = null,
  prixMax = null,
  sortBy = "recent",
  lastVisible = null
} = {}) {
  try {
    const constraints = [where("status", "==", "approved")];
    if (categorie) constraints.push(where("categorie", "==", categorie));
    if (typeAnnonce) constraints.push(where("typeAnnonce", "==", typeAnnonce));
    if (localisation) constraints.push(where("localisation", "==", localisation));
    if (prixMin !== null) constraints.push(where("prix", ">=", prixMin));
    if (prixMax !== null) constraints.push(where("prix", "<=", prixMax));

    if (sortBy === "prixAsc") constraints.push(orderBy("prix", "asc"));
    else if (sortBy === "prixDesc") constraints.push(orderBy("prix", "desc"));
    else constraints.push(orderBy("createdAt", "desc"));

    constraints.push(limit(max));
    if (lastVisible) constraints.push(startAfter(lastVisible));

    const q = query(collection(db, COLLECTIONS.SERVICES), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data, lastVisible: snapshot.docs[snapshot.docs.length - 1] };
  } catch (error) {
    console.error("Erreur listApprovedServices :", error);
    return { success: false, error: error.message, data: [] };
  }
}

/* =========================================================
   MES ANNONCES (toutes, y compris non approuvées)
   ========================================================= */

export async function listMyServices(uid) {
  try {
    if (!uid) return { success: false, error: "Utilisateur manquant", data: [] };
    const q = query(collection(db, COLLECTIONS.SERVICES), where("ownerId", "==", uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

/* =========================================================
   MODIFIER UNE ANNONCE
   ========================================================= */

export async function updateService(id, updates) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    const service = await getService(id);
    if (!service.success) return { success: false, error: "Service introuvable" };
    if (service.data.ownerId !== user.uid && user.role !== ROLES.ADMIN) {
      return { success: false, error: "Non autorisé" };
    }
    const allowed = ["titre", "description", "categorie", "localisation", "telephone", "whatsapp", "imageUrl", "prix"];
    const safe = Object.fromEntries(Object.entries(updates || {}).filter(([key]) => allowed.includes(key)));
    await updateDoc(doc(db, COLLECTIONS.SERVICES, id), { ...safe, status: "pending", updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   SUPPRIMER UNE ANNONCE
   ========================================================= */

export async function deleteService(id) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    const service = await getService(id);
    if (!service.success) return { success: false, error: "Service introuvable" };
    if (service.data.ownerId !== user.uid && user.role !== ROLES.ADMIN) {
      return { success: false, error: "Non autorisé" };
    }
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   FONCTIONS ADMIN : VALIDATION DES ANNONCES
   ========================================================= */

export async function listPendingServices() {
  try {
    const q = query(collection(db, COLLECTIONS.SERVICES), where("status", "==", "pending"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function updateServiceStatus(id, newStatus) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  // Vérifier que l'utilisateur est admin
  const profile = await getProfile(user.uid);
  if (!profile.success || profile.data.role !== ROLES.ADMIN) {
    return { success: false, error: "Non autorisé" };
  }
  try {
    await updateDoc(doc(db, COLLECTIONS.SERVICES, id), { status: newStatus, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   FAVORIS
   ========================================================= */

export async function getFavorites() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Utilisateur non connecté", ids: [] };
  try {
    const q = query(collection(db, COLLECTIONS.FAVORIS), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    return { success: true, ids: snapshot.docs.map(doc => doc.data().serviceId) };
  } catch (error) {
    return { success: false, error: error.message, ids: [] };
  }
}

export async function addFavorite(serviceId) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Connectez-vous d'abord" };
  try {
    const q = query(collection(db, COLLECTIONS.FAVORIS), where("userId", "==", user.uid), where("serviceId", "==", serviceId));
    const existing = await getDocs(q);
    if (!existing.empty) return { success: true, exists: true };
    await addDoc(collection(db, COLLECTIONS.FAVORIS), {
      userId: user.uid,
      serviceId,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeFavorite(serviceId) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Connectez-vous d'abord" };
  try {
    const q = query(collection(db, COLLECTIONS.FAVORIS), where("userId", "==", user.uid), where("serviceId", "==", serviceId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getFavoriteServices() {
  const favorites = await getFavorites();
  if (!favorites.success) return favorites;
  if (favorites.ids.length === 0) return { success: true, data: [] };
  const snapshots = await Promise.all(favorites.ids.map(id => getDoc(doc(db, COLLECTIONS.SERVICES, id))));
  const data = snapshots.filter(snap => snap.exists()).map(snap => ({ id: snap.id, ...snap.data() }));
  return { success: true, data };
}

/* =========================================================
   AVIS
   ========================================================= */

export async function addReview(serviceId, note, commentaire) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Connectez-vous d'abord" };
  try {
    const numericNote = Number(note);
    if (!Number.isFinite(numericNote) || numericNote < 1 || numericNote > 5) {
      return { success: false, error: "La note doit être comprise entre 1 et 5" };
    }
    // Vérifier unicité
    const q = query(collection(db, COLLECTIONS.AVIS), where("serviceId", "==", serviceId), where("userId", "==", user.uid));
    const existing = await getDocs(q);
    if (!existing.empty) return { success: false, error: "Vous avez déjà noté ce service" };

    const profile = await getProfile(user.uid);
    await addDoc(collection(db, COLLECTIONS.AVIS), {
      serviceId,
      userId: user.uid,
      userName: profile.data?.nom || user.email || "Utilisateur",
      note: numericNote,
      commentaire: clean(commentaire),
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function listReviewsByService(serviceId) {
  try {
    const q = query(collection(db, COLLECTIONS.AVIS), where("serviceId", "==", serviceId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function listReviewsByUser(uid) {
  try {
    const q = query(collection(db, COLLECTIONS.AVIS), where("userId", "==", uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function deleteReview(id) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    const profile = await getProfile(user.uid);
    if (profile.data?.role !== ROLES.ADMIN) {
      return { success: false, error: "Non autorisé" };
    }
    await deleteDoc(doc(db, COLLECTIONS.AVIS, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   COMMUNIQUÉS
   ========================================================= */

export async function listCommuniques(max = 30) {
  try {
    const q = query(collection(db, COLLECTIONS.COMMUNIQUES), where("published", "==", true), orderBy("createdAt", "desc"), limit(max));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error("Erreur communiqués :", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createCommunique(data) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Utilisateur non connecté" };
  try {
    const profile = await getProfile(user.uid);
    if (profile.data?.role !== ROLES.ADMIN) {
      return { success: false, error: "Non autorisé" };
    }
    const reference = await addDoc(collection(db, COLLECTIONS.COMMUNIQUES), {
      titre: clean(data.titre),
      description: clean(data.description),
      type: clean(data.type) || "Information",
      published: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: user.uid
    });
    return { success: true, id: reference.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteCommunique(id) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Utilisateur non connecté" };
  try {
    const profile = await getProfile(user.uid);
    if (profile.data?.role !== ROLES.ADMIN) {
      return { success: false, error: "Non autorisé" };
    }
    await deleteDoc(doc(db, COLLECTIONS.COMMUNIQUES, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* =========================================================
   MESSAGERIE
   ========================================================= */

export async function createConversation(otherUserId, initialMessage = "") {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    // Vérifier si une conversation existe déjà
    const q = query(collection(db, COLLECTIONS.CONVERSATIONS), where("participants", "array-contains", user.uid));
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => doc.data().participants.includes(otherUserId));
    if (existing) return { success: true, id: existing.id };

    const ref = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
      participants: [user.uid, otherUserId],
      lastMessage: initialMessage,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    if (initialMessage) {
      await addDoc(collection(db, COLLECTIONS.CONVERSATIONS, ref.id, COLLECTIONS.MESSAGES), {
        senderId: user.uid,
        text: initialMessage,
        createdAt: serverTimestamp(),
        read: false
      });
    }
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getConversations() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté", data: [] };
  try {
    const q = query(collection(db, COLLECTIONS.CONVERSATIONS), where("participants", "array-contains", user.uid), orderBy("lastMessageAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function getMessages(conversationId) {
  try {
    const q = query(collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function sendMessage(conversationId, text) {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté" };
  try {
    await addDoc(collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), {
      senderId: user.uid,
      text: clean(text),
      createdAt: serverTimestamp(),
      read: false
    });
    await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
      lastMessage: clean(text),
      lastMessageAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function listenMessages(conversationId, callback) {
  const q = query(collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), orderBy("createdAt", "asc"));
  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

/* =========================================================
   NOTIFICATIONS (à adapter)
   ========================================================= */

export async function addNotification(userId, type, message, lien = "") {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    userId,
    type,
    message,
    lien,
    read: false,
    createdAt: serverTimestamp()
  });
}

export async function listNotifications() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: "Non connecté", data: [] };
  try {
    const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

/* =========================================================
   THÈME
   ========================================================= */

export function applyTheme() {
  const dark = localStorage.getItem("camu-theme") === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

export function toggleTheme() {
  const dark = !document.documentElement.classList.contains("dark");
  localStorage.setItem("camu-theme", dark ? "dark" : "light");
  applyTheme();
}

applyTheme();

/* =========================================================
   FIN APP.JS
   ========================================================= */

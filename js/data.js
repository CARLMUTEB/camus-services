/* =========================================================
   CAMU SERVICES — DATA (Firestore)
   ========================================================= */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================
// VOS VRAIES CLÉS FIREBASE (identique à auth.js)
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
    authDomain: "camu-services.firebaseapp.com",
    projectId: "camu-services",
    storageBucket: "camu-services.firebasestorage.app",
    messagingSenderId: "879100396449",
    appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
    measurementId: "G-RQ16SX2SNV"
};

// =========================================================
// INITIALISATION
// =========================================================
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================================================
// UTILITAIRES
// =========================================================
function cleanData(data) {
    const result = {};
    Object.keys(data || {}).forEach((key) => {
        if (data[key] !== undefined) result[key] = data[key];
    });
    return result;
}

function convertDocument(snapshot) {
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
}

// =========================================================
// ANNONCES (collection "annonces" dans Firestore)
// =========================================================

async function getListings(options = {}) {
    try {
        const { category = null, city = null, listingLimit = 20 } = options;
        let constraints = [];
        if (category) constraints.push(where("category", "==", category));
        if (city) constraints.push(where("city", "==", city));
        constraints.push(orderBy("createdAt", "desc"));
        constraints.push(limit(listingLimit));

        const q = query(collection(db, "annonces"), ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erreur récupération annonces :", error);
        return [];
    }
}

async function getListing(listingId) {
    try {
        if (!listingId) return null;
        const snapshot = await getDoc(doc(db, "annonces", listingId));
        return convertDocument(snapshot);
    } catch (error) {
        console.error("Erreur annonce :", error);
        return null;
    }
}

async function createListing(data) {
    try {
        const listing = cleanData({
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: data.status || "approved"  // pour que les règles autorisent la lecture
        });
        const ref = await addDoc(collection(db, "annonces"), listing);
        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Erreur création annonce :", error);
        return { success: false, error: error.message };
    }
}

async function updateListing(listingId, data) {
    try {
        if (!listingId) throw new Error("ID manquant.");
        await updateDoc(doc(db, "annonces", listingId), {
            ...cleanData(data),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur modification annonce :", error);
        return { success: false, error: error.message };
    }
}

async function deleteListing(listingId) {
    try {
        await deleteDoc(doc(db, "annonces", listingId));
        return { success: true };
    } catch (error) {
        console.error("Erreur suppression annonce :", error);
        return { success: false, error: error.message };
    }
}

// =========================================================
// FAVORIS
// =========================================================
async function addFavorite(userId, listingId) {
    try {
        if (!userId || !listingId) throw new Error("Utilisateur ou annonce manquant.");
        const favoriteId = `${userId}_${listingId}`;
        await setDoc(doc(db, "favorites", favoriteId), {
            userId,
            listingId,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur ajout favori :", error);
        return { success: false, error: error.message };
    }
}

async function removeFavorite(userId, listingId) {
    try {
        const favoriteId = `${userId}_${listingId}`;
        await deleteDoc(doc(db, "favorites", favoriteId));
        return { success: true };
    } catch (error) {
        console.error("Erreur suppression favori :", error);
        return { success: false, error: error.message };
    }
}

async function isFavorite(userId, listingId) {
    try {
        const favoriteId = `${userId}_${listingId}`;
        const snapshot = await getDoc(doc(db, "favorites", favoriteId));
        return snapshot.exists();
    } catch (error) {
        console.error("Erreur vérification favori :", error);
        return false;
    }
}

// =========================================================
// RÉSERVATIONS
// =========================================================
async function createReservation(data) {
    try {
        const reservation = cleanData({
            ...data,
            status: data.status || "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        const ref = await addDoc(collection(db, "reservations"), reservation);
        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Erreur réservation :", error);
        return { success: false, error: error.message };
    }
}

async function getUserReservations(userId) {
    try {
        if (!userId) return [];
        const q = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erreur réservations :", error);
        return [];
    }
}

// =========================================================
// NOTIFICATIONS
// =========================================================
async function createNotification(data) {
    try {
        const notification = cleanData({
            ...data,
            read: false,
            createdAt: serverTimestamp()
        });
        const ref = await addDoc(collection(db, "notifications"), notification);
        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Erreur notification :", error);
        return { success: false, error: error.message };
    }
}

async function getUserNotifications(userId) {
    try {
        if (!userId) return [];
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erreur notifications :", error);
        return [];
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await updateDoc(doc(db, "notifications", notificationId), { read: true });
        return { success: true };
    } catch (error) {
        console.error("Erreur notification :", error);
        return { success: false, error: error.message };
    }
}

// =========================================================
// COMMUNIQUÉS
// =========================================================
async function getCommuniques() {
    try {
        const q = query(
            collection(db, "communiques"),
            where("active", "==", true),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erreur communiqués :", error);
        return [];
    }
}

// =========================================================
// CONVERSATIONS (collection "chats" dans Firestore)
// =========================================================
async function createConversation(data) {
    try {
        const conversation = cleanData({
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        const ref = await addDoc(collection(db, "chats"), conversation);
        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Erreur conversation :", error);
        return { success: false, error: error.message };
    }
}

async function sendMessage(conversationId, data) {
    try {
        if (!conversationId) throw new Error("Conversation introuvable.");
        const message = cleanData({
            ...data,
            createdAt: serverTimestamp()
        });
        const ref = await addDoc(collection(db, "chats", conversationId, "messages"), message);
        await updateDoc(doc(db, "chats", conversationId), {
            lastMessage: data.text || "",
            updatedAt: serverTimestamp()
        });
        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Erreur message :", error);
        return { success: false, error: error.message };
    }
}

async function getMessages(conversationId) {
    try {
        if (!conversationId) return [];
        const q = query(
            collection(db, "chats", conversationId, "messages"),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erreur messages :", error);
        return [];
    }
}

// =========================================================
// EXPORTS
// =========================================================
export {
    db,
    getListings,
    getListing,
    createListing,
    updateListing,
    deleteListing,
    addFavorite,
    removeFavorite,
    isFavorite,
    createReservation,
    getUserReservations,
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    getCommuniques,
    createConversation,
    sendMessage,
    getMessages
};

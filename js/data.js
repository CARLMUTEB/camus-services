/* =========================================================
   CAMU SERVICES — DATA
   js/data.js

   Couche centrale de communication avec Firestore.

   app.js
      ↓
   data.js
      ↓
   Firebase / Firestore

   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

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


/* =========================================================
   CONFIGURATION
   ========================================================= */

/*
   IMPORTANT :

   Utilise exactement la même configuration Firebase
   que dans auth.js.

   À terme, on pourra centraliser cette configuration
   dans un fichier firebase.js si nécessaire.
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

const app =
    getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);


const db = getFirestore(app);


/* =========================================================
   UTILITAIRES
   ========================================================= */

function cleanData(data) {

    const result = {};

    Object.keys(data || {}).forEach((key) => {

        if (data[key] !== undefined) {
            result[key] = data[key];
        }

    });

    return result;

}


function convertDocument(snapshot) {

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}


/* =========================================================
   ANNONCES
   ========================================================= */


/*
   Récupérer les annonces récentes
*/

async function getListings(options = {}) {

    try {

        const {
            category = null,
            city = null,
            listingLimit = 20
        } = options;


        let constraints = [];


        if (category) {

            constraints.push(
                where(
                    "category",
                    "==",
                    category
                )
            );

        }


        if (city) {

            constraints.push(
                where(
                    "city",
                    "==",
                    city
                )
            );

        }


        constraints.push(
            orderBy(
                "createdAt",
                "desc"
            )
        );


        constraints.push(
            limit(listingLimit)
        );


        const listingsQuery =
            query(
                collection(
                    db,
                    "listings"
                ),
                ...constraints
            );


        const snapshot =
            await getDocs(
                listingsQuery
            );


        return snapshot.docs.map(
            (item) => ({
                id: item.id,
                ...item.data()
            })
        );


    } catch (error) {

        console.error(
            "Erreur récupération annonces :",
            error
        );

        return [];

    }

}


/*
   Récupérer une annonce précise
*/

async function getListing(listingId) {

    try {

        if (!listingId) {
            return null;
        }


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "listings",
                    listingId
                )
            );


        return convertDocument(snapshot);


    } catch (error) {

        console.error(
            "Erreur annonce :",
            error
        );

        return null;

    }

}


/*
   Créer une annonce
*/

async function createListing(data) {

    try {

        const listing =
            cleanData({
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });


        const reference =
            await addDoc(
                collection(
                    db,
                    "listings"
                ),
                listing
            );


        return {
            success: true,
            id: reference.id
        };


    } catch (error) {

        console.error(
            "Erreur création annonce :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Modifier une annonce
*/

async function updateListing(
    listingId,
    data
) {

    try {

        if (!listingId) {

            throw new Error(
                "ID de l'annonce manquant."
            );

        }


        await updateDoc(
            doc(
                db,
                "listings",
                listingId
            ),
            {
                ...cleanData(data),
                updatedAt: serverTimestamp()
            }
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur modification annonce :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Supprimer une annonce
*/

async function deleteListing(
    listingId
) {

    try {

        await deleteDoc(
            doc(
                db,
                "listings",
                listingId
            )
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur suppression annonce :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/* =========================================================
   FAVORIS
   ========================================================= */


/*
   Ajouter une annonce aux favoris
*/

async function addFavorite(
    userId,
    listingId
) {

    try {

        if (!userId || !listingId) {
            throw new Error(
                "Utilisateur ou annonce manquant."
            );
        }


        const favoriteId =
            `${userId}_${listingId}`;


        await setDoc(
            doc(
                db,
                "favorites",
                favoriteId
            ),
            {
                userId,
                listingId,
                createdAt: serverTimestamp()
            }
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur ajout favori :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Retirer un favori
*/

async function removeFavorite(
    userId,
    listingId
) {

    try {

        const favoriteId =
            `${userId}_${listingId}`;


        await deleteDoc(
            doc(
                db,
                "favorites",
                favoriteId
            )
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur suppression favori :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Vérifier si une annonce est favorite
*/

async function isFavorite(
    userId,
    listingId
) {

    try {

        const favoriteId =
            `${userId}_${listingId}`;


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "favorites",
                    favoriteId
                )
            );


        return snapshot.exists();


    } catch (error) {

        console.error(
            "Erreur vérification favori :",
            error
        );

        return false;

    }

}


/* =========================================================
   RÉSERVATIONS
   ========================================================= */


/*
   Créer une réservation
*/

async function createReservation(
    data
) {

    try {

        const reservation =
            cleanData({
                ...data,
                status: data.status || "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });


        const reference =
            await addDoc(
                collection(
                    db,
                    "reservations"
                ),
                reservation
            );


        return {
            success: true,
            id: reference.id
        };


    } catch (error) {

        console.error(
            "Erreur réservation :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Récupérer les réservations d'un utilisateur
*/

async function getUserReservations(
    userId
) {

    try {

        if (!userId) {
            return [];
        }


        const reservationsQuery =
            query(
                collection(
                    db,
                    "reservations"
                ),
                where(
                    "userId",
                    "==",
                    userId
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                reservationsQuery
            );


        return snapshot.docs.map(
            (item) => ({
                id: item.id,
                ...item.data()
            })
        );


    } catch (error) {

        console.error(
            "Erreur réservations :",
            error
        );

        return [];

    }

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */


/*
   Créer une notification
*/

async function createNotification(
    data
) {

    try {

        const notification =
            cleanData({
                ...data,
                read: false,
                createdAt: serverTimestamp()
            });


        const reference =
            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                notification
            );


        return {
            success: true,
            id: reference.id
        };


    } catch (error) {

        console.error(
            "Erreur notification :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Récupérer les notifications
*/

async function getUserNotifications(
    userId
) {

    try {

        if (!userId) {
            return [];
        }


        const notificationsQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                where(
                    "userId",
                    "==",
                    userId
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(50)
            );


        const snapshot =
            await getDocs(
                notificationsQuery
            );


        return snapshot.docs.map(
            (item) => ({
                id: item.id,
                ...item.data()
            })
        );


    } catch (error) {

        console.error(
            "Erreur notifications :",
            error
        );

        return [];

    }

}


/*
   Marquer une notification comme lue
*/

async function markNotificationAsRead(
    notificationId
) {

    try {

        await updateDoc(
            doc(
                db,
                "notifications",
                notificationId
            ),
            {
                read: true
            }
        );


        return {
            success: true
        };


    } catch (error) {

        console.error(
            "Erreur notification :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/* =========================================================
   COMMUNIQUÉS
   ========================================================= */


/*
   Récupérer les communiqués actifs
*/

async function getCommuniques() {

    try {

        const communiquesQuery =
            query(
                collection(
                    db,
                    "communiques"
                ),
                where(
                    "active",
                    "==",
                    true
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(10)
            );


        const snapshot =
            await getDocs(
                communiquesQuery
            );


        return snapshot.docs.map(
            (item) => ({
                id: item.id,
                ...item.data()
            })
        );


    } catch (error) {

        console.error(
            "Erreur communiqués :",
            error
        );

        return [];

    }

}


/* =========================================================
   CONVERSATIONS
   ========================================================= */


/*
   Créer une conversation
*/

async function createConversation(
    data
) {

    try {

        const conversation =
            cleanData({
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });


        const reference =
            await addDoc(
                collection(
                    db,
                    "conversations"
                ),
                conversation
            );


        return {
            success: true,
            id: reference.id
        };


    } catch (error) {

        console.error(
            "Erreur conversation :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Ajouter un message
*/

async function sendMessage(
    conversationId,
    data
) {

    try {

        if (!conversationId) {

            throw new Error(
                "Conversation introuvable."
            );

        }


        const message =
            cleanData({
                ...data,
                createdAt: serverTimestamp()
            });


        const reference =
            await addDoc(
                collection(
                    db,
                    "conversations",
                    conversationId,
                    "messages"
                ),
                message
            );


        await updateDoc(
            doc(
                db,
                "conversations",
                conversationId
            ),
            {
                lastMessage:
                    data.text || "",
                updatedAt:
                    serverTimestamp()
            }
        );


        return {
            success: true,
            id: reference.id
        };


    } catch (error) {

        console.error(
            "Erreur message :",
            error
        );


        return {
            success: false,
            error: error.message
        };

    }

}


/*
   Récupérer les messages
*/

async function getMessages(
    conversationId
) {

    try {

        if (!conversationId) {
            return [];
        }


        const messagesQuery =
            query(
                collection(
                    db,
                    "conversations",
                    conversationId,
                    "messages"
                ),
                orderBy(
                    "createdAt",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                messagesQuery
            );


        return snapshot.docs.map(
            (item) => ({
                id: item.id,
                ...item.data()
            })
        );


    } catch (error) {

        console.error(
            "Erreur messages :",
            error
        );

        return [];

    }

}


/* =========================================================
   EXPORTS
   ========================================================= */

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
```

import { auth, db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =========================================================
// ÉLÉMENTS
// =========================================================

const favoritesContainer =
    document.getElementById("favoritesContainer");

const favoritesEmpty =
    document.getElementById("favoritesEmpty");

const favoritesLoading =
    document.getElementById("favoritesLoading");

const favoritesCount =
    document.getElementById("favoritesCount");


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${price} ${currency}`;
    }

    return (
        new Intl.NumberFormat("fr-FR").format(number)
        + " "
        + currency
    );
}


// =========================================================
// PHOTO
// =========================================================

function getAdImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {
        return ad.images[0];
    }

    if (ad.imageURL) {
        return ad.imageURL;
    }

    if (ad.imageUrl) {
        return ad.imageUrl;
    }

    if (ad.image) {
        return ad.image;
    }

    return "";
}


// =========================================================
// LOCALISATION
// =========================================================

function getLocation(ad) {

    const city =
        ad.city ||
        ad.ville ||
        "";

    const neighborhood =
        ad.neighborhood ||
        ad.quartier ||
        "";

    if (neighborhood && city) {
        return `${neighborhood}, ${city}`;
    }

    return (
        city ||
        neighborhood ||
        "Localisation non précisée"
    );
}


// =========================================================
// RÉCUPÉRER LES FAVORIS FIRESTORE
// =========================================================

async function getFavoriteDocuments() {

    const user = auth.currentUser;

    if (!user) {
        return [];
    }

    const favorisRef =
        collection(db, "favoris");

    const q =
        query(
            favorisRef,
            where("userId", "==", user.uid)
        );

    const snapshot =
        await getDocs(q);

    return snapshot.docs;
}


// =========================================================
// CARTE FAVORI
// =========================================================

function createFavoriteCard(ad, favoriteDocId) {

    const card =
        document.createElement("article");

    card.className = "favorite-card";

    const image =
        getAdImage(ad);

    const title =
        ad.title ||
        ad.titre ||
        "Annonce sans titre";

    const category =
        ad.category ||
        ad.categorie ||
        "Autres";

    const price =
        formatPrice(
            ad.price ??
            ad.prix,
            ad.currency || "USD"
        );

    const location =
        getLocation(ad);


    card.innerHTML = `

        <div class="favorite-image-wrapper">

            ${
                image
                ? `
                    <img
                        class="favorite-image"
                        src="${image}"
                        alt="${title}"
                        loading="lazy"
                    >
                `
                : `
                    <div
                        class="favorite-image"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#9ca3af;
                            font-size:35px;
                        "
                    >
                        <i class="fa-regular fa-image"></i>
                    </div>
                `
            }

            <button
                class="favorite-remove"
                type="button"
                title="Retirer des favoris"
            >
                <i class="fa-solid fa-heart"></i>
            </button>

        </div>

        <div class="favorite-content">

            <span class="favorite-category">
                ${category}
            </span>

            <h2 class="favorite-title">
                ${title}
            </h2>

            <div class="favorite-price">
                ${price}
            </div>

            <div class="favorite-location">

                <i class="fa-solid fa-location-dot"></i>

                <span>
                    ${location}
                </span>

            </div>

            <a
                href="explorer.html?id=${encodeURIComponent(ad.id)}"
                class="favorite-view"
            >
                Voir l'annonce
            </a>

        </div>
    `;


    // =====================================================
    // SUPPRIMER DU FAVORI
    // =====================================================

    const removeButton =
        card.querySelector(".favorite-remove");

    removeButton.addEventListener(
        "click",
        async () => {

            try {

                removeButton.disabled = true;

                await deleteDoc(
                    doc(
                        db,
                        "favoris",
                        favoriteDocId
                    )
                );

                card.remove();

                updateFavoritesCount();

                if (
                    favoritesContainer &&
                    favoritesContainer.children.length === 0
                ) {
                    showEmptyState();
                }

            } catch (error) {

                console.error(
                    "Erreur suppression favori :",
                    error
                );

                alert(
                    "Impossible de retirer ce favori."
                );

                removeButton.disabled = false;
            }

        }
    );


    return card;
}


// =========================================================
// COMPTEUR
// =========================================================

async function updateFavoritesCount() {

    try {

        const favoriteDocs =
            await getFavoriteDocuments();

        if (favoritesCount) {
            favoritesCount.textContent =
                favoriteDocs.length;
        }

    } catch (error) {

        console.error(
            "Erreur compteur favoris :",
            error
        );

    }
}


// =========================================================
// ÉTAT VIDE
// =========================================================

function showEmptyState() {

    if (favoritesContainer) {
        favoritesContainer.innerHTML = "";
    }

    if (favoritesEmpty) {
        favoritesEmpty.hidden = false;
    }

    if (favoritesLoading) {
        favoritesLoading.hidden = true;
    }

    if (favoritesCount) {
        favoritesCount.textContent = "0";
    }
}


// =========================================================
// CHARGEMENT DES FAVORIS
// =========================================================

async function loadFavorites() {

    if (!favoritesContainer) {
        console.error(
            "favoritesContainer introuvable."
        );
        return;
    }

    if (favoritesLoading) {
        favoritesLoading.hidden = false;
    }

    if (favoritesEmpty) {
        favoritesEmpty.hidden = true;
    }

    favoritesContainer.innerHTML = "";


    const user = auth.currentUser;


    // =====================================================
    // UTILISATEUR NON CONNECTÉ
    // =====================================================

    if (!user) {

        if (favoritesLoading) {
            favoritesLoading.hidden = true;
        }

        if (favoritesEmpty) {
            favoritesEmpty.hidden = false;

            const title =
                favoritesEmpty.querySelector("h2");

            const text =
                favoritesEmpty.querySelector("p");

            if (title) {
                title.textContent =
                    "Vous n'êtes pas connecté";
            }

            if (text) {
                text.textContent =
                    "Connectez-vous pour voir vos favoris.";
            }
        }

        return;
    }


    try {

        // Récupérer les documents favoris
        const favoriteDocs =
            await getFavoriteDocuments();


        if (favoritesCount) {
            favoritesCount.textContent =
                favoriteDocs.length;
        }


        // Aucun favori
        if (favoriteDocs.length === 0) {

            showEmptyState();
            return;
        }


        let loadedCount = 0;


        // =================================================
        // CHARGER CHAQUE ANNONCE
        // =================================================

        for (const favoriteDoc of favoriteDocs) {

            const favoriteData =
                favoriteDoc.data();

            const serviceId =
                favoriteData.serviceId;


            if (!serviceId) {

                console.warn(
                    "Favori sans serviceId :",
                    favoriteDoc.id
                );

                continue;
            }


            try {

                const serviceRef =
                    doc(
                        db,
                        "services",
                        serviceId
                    );

                const serviceSnapshot =
                    await getDoc(serviceRef);


                // =========================================
                // ANNONCE EXISTANTE
                // =========================================

                if (serviceSnapshot.exists()) {

                    const ad = {

                        id: serviceSnapshot.id,

                        ...serviceSnapshot.data()

                    };


                    const card =
                        createFavoriteCard(
                            ad,
                            favoriteDoc.id
                        );


                    favoritesContainer.appendChild(
                        card
                    );


                    loadedCount++;

                }


                // =========================================
                // ANNONCE SUPPRIMÉE
                // =========================================

                else {

                    console.warn(
                        `Annonce ${serviceId} introuvable. Suppression du favori.`
                    );


                    await deleteDoc(
                        doc(
                            db,
                            "favoris",
                            favoriteDoc.id
                        )
                    );

                }


            } catch (error) {

                console.error(
                    `Erreur chargement annonce ${serviceId} :`,
                    error
                );

            }

        }


        // =================================================
        // FIN DU CHARGEMENT
        // =================================================

        if (favoritesLoading) {
            favoritesLoading.hidden = true;
        }


        if (loadedCount === 0) {

            showEmptyState();

            return;
        }


        if (favoritesEmpty) {
            favoritesEmpty.hidden = true;
        }


        await updateFavoritesCount();


    } catch (error) {

        console.error(
            "Erreur chargement favoris :",
            error
        );


        if (favoritesLoading) {
            favoritesLoading.hidden = true;
        }


        if (favoritesEmpty) {

            favoritesEmpty.hidden = false;

            const title =
                favoritesEmpty.querySelector("h2");

            const text =
                favoritesEmpty.querySelector("p");

            if (title) {
                title.textContent =
                    "Erreur";
            }

            if (text) {
                text.textContent =
                    "Impossible de charger vos favoris.";
            }

        }

    }

}


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            console.log(
                "Utilisateur connecté :",
                user.uid
            );

            await loadFavorites();

        } else {

            console.log(
                "Aucun utilisateur connecté."
            );

            showEmptyState();

        }

    }
);


// =========================================================
// DÉMARRAGE
// =========================================================

console.log(
    "CAMU SERVICES — favoris.js Firestore chargé."
);

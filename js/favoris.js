import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


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
// FAVORIS
// =========================================================

function getFavoriteIds() {

    const ids = [];

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (
            key &&
            key.startsWith("camu_favorite_") &&
            localStorage.getItem(key) === "true"
        ) {

            const serviceId =
                key.replace("camu_favorite_", "");

            if (serviceId) {
                ids.push(serviceId);
            }
        }
    }

    return ids;
}


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
// CARTE
// =========================================================

function createFavoriteCard(ad) {

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
            ad.price,
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
                data-id="${ad.id}"
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
                href="explorer.html?id=${ad.id}"
                class="favorite-view"
            >
                Voir l'annonce
            </a>

        </div>
    `;


    // =====================================================
    // RETIRER
    // =====================================================

    const removeButton =
        card.querySelector(".favorite-remove");

    removeButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                `camu_favorite_${ad.id}`
            );

            card.remove();

            updateFavoritesCount();

            const remaining =
                favoritesContainer.children.length;

            if (remaining === 0) {
                showEmptyState();
            }

        }
    );


    return card;
}


// =========================================================
// COMPTEUR
// =========================================================

function updateFavoritesCount() {

    const ids =
        getFavoriteIds();

    favoritesCount.textContent =
        ids.length;
}


// =========================================================
// ÉTAT VIDE
// =========================================================

function showEmptyState() {

    favoritesContainer.innerHTML = "";

    favoritesEmpty.hidden = false;

    favoritesLoading.hidden = true;

    updateFavoritesCount();
}


// =========================================================
// CHARGEMENT
// =========================================================

async function loadFavorites() {

    favoritesLoading.hidden = false;

    favoritesEmpty.hidden = true;

    favoritesContainer.innerHTML = "";


    const favoriteIds =
        getFavoriteIds();


    updateFavoritesCount();


    // Aucun favori

    if (favoriteIds.length === 0) {

        showEmptyState();

        return;
    }


    let loadedCount = 0;


    for (const id of favoriteIds) {

        try {

            const adRef =
                doc(db, "services", id);

            const snapshot =
                await getDoc(adRef);


            // L'annonce existe

            if (snapshot.exists()) {

                const ad = {

                    id: snapshot.id,

                    ...snapshot.data()

                };


                const card =
                    createFavoriteCard(ad);

                favoritesContainer.appendChild(card);

                loadedCount++;

            }

            // L'annonce n'existe plus

            else {

                localStorage.removeItem(
                    `camu_favorite_${id}`
                );

            }


        } catch (error) {

            console.error(
                `Erreur avec le favori ${id}:`,
                error
            );

        }

    }


    favoritesLoading.hidden = true;


    // Tous les favoris ont été supprimés
    // ou les annonces n'existent plus

    if (loadedCount === 0) {

        showEmptyState();

        return;
    }


    updateFavoritesCount();
}


// =========================================================
// MENU MOBILE
// =========================================================

const menuToggle =
    document.getElementById("menuToggle");

const sidebar =
    document.getElementById("sidebar");


if (menuToggle && sidebar) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


// =========================================================
// DÉMARRAGE
// =========================================================

loadFavorites();


console.log(
    "CAMU SERVICES — favoris.js chargé."
);

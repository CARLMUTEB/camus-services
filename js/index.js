// =========================================================
// CAMU SERVICES — INDEX.JS
// Affichage des annonces récentes depuis Firestore
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENT HTML
// =========================================================

const recentAds = document.getElementById("recentAds");


// =========================================================
// ÉCHAPPER LE HTML
// =========================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Prix à discuter";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${escapeHtml(price)} ${escapeHtml(currency)}`;
    }

    return `${new Intl.NumberFormat("fr-FR").format(number)} ${escapeHtml(currency)}`;
}


// =========================================================
// IMAGE
// =========================================================

function getImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0 &&
        ad.images[0]
    ) {
        return ad.images[0];
    }

    if (ad.imageURL) {
        return ad.imageURL;
    }

    return "logo.png";
}


// =========================================================
// NOM DE LA CATÉGORIE
// =========================================================

function getCategoryName(category) {

    const categories = {
        immobilier: "Immobilier",
        vehicules: "Véhicules",
        commerce: "Commerce",
        services: "Services",
        emploi: "Emploi",
        autres: "Autres"
    };

    const key = String(category || "").toLowerCase();

    return categories[key] || category || "Autres";
}


// =========================================================
// CHARGER LES ANNONCES
// =========================================================

async function loadRecentAds() {

    if (!recentAds) {
        console.warn(
            "CAMU SERVICES : #recentAds introuvable."
        );
        return;
    }

    try {

        // Message de chargement
        recentAds.innerHTML = `
            <div class="account-empty">
                <div class="account-empty-icon">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </div>

                <h3>Chargement des annonces...</h3>
            </div>
        `;


        // Récupération de la collection services
        const servicesRef = collection(db, "services");

        const snapshot = await getDocs(servicesRef);


        // Transformer les documents
        const ads = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));


        // Trier par date : plus récente en premier
        ads.sort((a, b) => {

            const dateA =
                a.createdAt &&
                typeof a.createdAt.toMillis === "function"
                    ? a.createdAt.toMillis()
                    : 0;

            const dateB =
                b.createdAt &&
                typeof b.createdAt.toMillis === "function"
                    ? b.createdAt.toMillis()
                    : 0;

            return dateB - dateA;
        });


        // Garder seulement les 8 dernières
        const recent = ads.slice(0, 8);


        console.log(
            "CAMU SERVICES : annonces trouvées :",
            ads.length
        );


        // Aucune annonce
        if (recent.length === 0) {

            recentAds.innerHTML = `
                <div class="account-empty">

                    <div class="account-empty-icon">
                        <i class="fa-solid fa-box-open"></i>
                    </div>

                    <h3>Aucune annonce pour le moment</h3>

                    <p>
                        Soyez le premier à publier une annonce
                        sur CAMU SERVICES.
                    </p>

                </div>
            `;

            return;
        }


        // Vider les anciennes annonces statiques
        recentAds.innerHTML = "";


        // =====================================================
        // CRÉATION DES CARTES
        // =====================================================

        recent.forEach((ad) => {

            const image = getImage(ad);

            const title =
                ad.title ||
                "Annonce sans titre";

            const city =
                ad.city ||
                "Ville non précisée";

            const category =
                getCategoryName(ad.category);

            const price =
                formatPrice(
                    ad.price,
                    ad.currency || "USD"
                );


            const card = document.createElement("article");

            card.className = "ad-card";

            card.innerHTML = `

                <div class="ad-image">

                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(title)}"
                        loading="lazy"
                        onerror="this.src='logo.png'"
                    >

                    <button
                        type="button"
                        class="favorite-button"
                        aria-label="Ajouter aux favoris"
                        data-ad-id="${escapeHtml(ad.id)}"
                    >
                        <i class="fa-regular fa-heart"></i>
                    </button>

                    <span class="ad-category">
                        ${escapeHtml(category)}
                    </span>

                </div>


                <div class="ad-content">

                    <h3>
                        ${escapeHtml(title)}
                    </h3>

                    <div class="ad-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(city)}

                    </div>

                    <div class="ad-price">
                        ${price}
                    </div>

                </div>

            `;


            // Cliquer sur la carte
            card.addEventListener("click", (event) => {

                // Ne pas ouvrir l'annonce lorsqu'on clique
                // sur le bouton favoris
                if (
                    event.target.closest(".favorite-button")
                ) {
                    return;
                }

                window.location.href =
                    `explorer.html?id=${encodeURIComponent(ad.id)}`;
            });


            // Bouton favoris
            const favoriteButton =
                card.querySelector(".favorite-button");

            if (favoriteButton) {

                favoriteButton.addEventListener(
                    "click",
                    (event) => {

                        event.stopPropagation();

                        const icon =
                            favoriteButton.querySelector("i");

                        favoriteButton.classList.toggle(
                            "active"
                        );

                        if (
                            favoriteButton.classList.contains(
                                "active"
                            )
                        ) {

                            icon.classList.remove(
                                "fa-regular"
                            );

                            icon.classList.add(
                                "fa-solid"
                            );

                            console.log(
                                "Favori ajouté :",
                                ad.id
                            );

                        } else {

                            icon.classList.remove(
                                "fa-solid"
                            );

                            icon.classList.add(
                                "fa-regular"
                            );

                            console.log(
                                "Favori retiré :",
                                ad.id
                            );
                        }
                    }
                );
            }


            recentAds.appendChild(card);

        });


    } catch (error) {

        console.error(
            "CAMU SERVICES : erreur chargement annonces :",
            error
        );


        recentAds.innerHTML = `

            <div class="account-empty">

                <div class="account-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>Impossible de charger les annonces</h3>

                <p>
                    Une erreur est survenue lors du chargement
                    des annonces.
                </p>

            </div>

        `;
    }
}


// =========================================================
// LANCEMENT
// =========================================================

loadRecentAds();

console.log(
    "CAMU SERVICES — index.js chargé correctement."
);

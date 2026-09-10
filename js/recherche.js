// =========================================================
// CAMU SERVICES — RECHERCHE.JS
// Recherche des annonces Firestore
// Collection utilisée : annonces
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENTS
// =========================================================

const searchForm =
    document.getElementById("searchForm");

const searchKeyword =
    document.getElementById("searchKeyword");

const searchCategory =
    document.getElementById("searchCategory");

const searchCity =
    document.getElementById("searchCity");

const searchResults =
    document.getElementById("searchResults");

const resultsCount =
    document.getElementById("resultsCount");

const resultsTitle =
    document.getElementById("resultsTitle");


// =========================================================
// DONNÉES
// =========================================================

let allAds = [];


// =========================================================
// PROTECTION HTML
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
// NORMALISER LE TEXTE
// =========================================================

function normalize(value) {

    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


// =========================================================
// CATÉGORIE
// =========================================================

function categoryName(category) {

    const categories = {

        immobilier: "Immobilier",

        vehicules: "Véhicules",

        commerce: "Commerce",

        services: "Services",

        emploi: "Emploi",

        autres: "Autres"

    };

    const key = normalize(category);

    return categories[key] ||
        category ||
        "Autres";
}


// =========================================================
// IMAGE
// =========================================================

function getImage(ad) {

    // Tableau d'images Cloudinary
    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0 &&
        ad.images[0]
    ) {
        return ad.images[0];
    }

    // Différents noms possibles
    if (ad.imageURL) {
        return ad.imageURL;
    }

    if (ad.imageUrl) {
        return ad.imageUrl;
    }

    if (ad.imageURLFirst) {
        return ad.imageURLFirst;
    }

    if (ad.photoURL) {
        return ad.photoURL;
    }

    if (ad.photoUrl) {
        return ad.photoUrl;
    }

    // Image par défaut
    return "logo.png";
}


// =========================================================
// PRIX
// =========================================================

function formatPrice(
    price,
    currency = "USD"
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Prix à discuter";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {

        return `
            ${escapeHtml(price)}
            ${escapeHtml(currency)}
        `;
    }

    return `
        ${new Intl.NumberFormat("fr-FR").format(number)}
        ${escapeHtml(currency)}
    `;
}


// =========================================================
// AFFICHER UNE ANNONCE
// =========================================================

function createAdCard(ad) {

    const card =
        document.createElement("article");

    card.className = "ad-card";

    const image =
        getImage(ad);

    const title =
        ad.title ||
        "Annonce sans titre";

    const city =
        ad.city ||
        "Ville non précisée";

    const category =
        categoryName(ad.category);

    const price =
        formatPrice(
            ad.price,
            ad.currency || "USD"
        );


    // =====================================================
    // CONTENU DE LA CARTE
    // =====================================================

    card.innerHTML = `

        <div class="ad-image">

            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='logo.png';"
            >

            <button
                type="button"
                class="favorite-button"
                aria-label="Ajouter aux favoris"
                title="Ajouter aux favoris"
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


    // =====================================================
    // OUVRIR L'ANNONCE
    // =====================================================

    card.addEventListener(
        "click",
        (event) => {

            // Ne pas ouvrir l'annonce si on clique
            // sur le bouton favoris
            if (
                event.target.closest(
                    ".favorite-button"
                )
            ) {
                return;
            }

            if (!ad.id) {
                console.error(
                    "CAMU SERVICES — ID annonce manquant."
                );
                return;
            }

            window.location.href =
                `explorer.html?id=${encodeURIComponent(ad.id)}`;

        }
    );


    // =====================================================
    // FAVORIS — V1
    // =====================================================

    const favoriteButton =
        card.querySelector(
            ".favorite-button"
        );

    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                favoriteButton.classList.toggle(
                    "active"
                );

                const icon =
                    favoriteButton.querySelector("i");

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

                } else {

                    icon.classList.remove(
                        "fa-solid"
                    );

                    icon.classList.add(
                        "fa-regular"
                    );

                }

            }
        );

    }


    return card;
}


// =========================================================
// AFFICHER LES RÉSULTATS
// =========================================================

function displayResults(ads) {

    if (!searchResults) {
        return;
    }

    searchResults.innerHTML = "";


    // =====================================================
    // COMPTEUR
    // =====================================================

    if (resultsCount) {

        resultsCount.textContent =
            ads.length === 1
                ? "1 annonce"
                : `${ads.length} annonces`;

    }


    // =====================================================
    // AUCUN RÉSULTAT
    // =====================================================

    if (ads.length === 0) {

        searchResults.innerHTML = `

            <div class="search-empty">

                <div class="search-empty-icon">

                    <i class="fa-solid fa-magnifying-glass"></i>

                </div>

                <h3>
                    Aucune annonce trouvée
                </h3>

                <p>
                    Essayez de modifier vos critères de recherche.
                </p>

            </div>

        `;

        return;
    }


    // =====================================================
    // AJOUTER LES CARTES
    // =====================================================

    ads.forEach(
        (ad) => {

            searchResults.appendChild(
                createAdCard(ad)
            );

        }
    );

}


// =========================================================
// FILTRER LES ANNONCES
// =========================================================

function filterAds() {

    const keyword =
        normalize(
            searchKeyword?.value
        );

    const category =
        normalize(
            searchCategory?.value
        );

    const city =
        normalize(
            searchCity?.value
        );


    const filtered =
        allAds.filter(
            (ad) => {

                const title =
                    normalize(ad.title);

                const description =
                    normalize(ad.description);

                const adCategory =
                    normalize(ad.category);

                const adCity =
                    normalize(ad.city);


                // =================================================
                // MOT-CLÉ
                // =================================================

                const keywordMatch =
                    !keyword ||
                    title.includes(keyword) ||
                    description.includes(keyword);


                // =================================================
                // CATÉGORIE
                // =================================================

                const categoryMatch =
                    !category ||
                    adCategory === category;


                // =================================================
                // VILLE
                // =================================================

                const cityMatch =
                    !city ||
                    adCity === city;


                return (
                    keywordMatch &&
                    categoryMatch &&
                    cityMatch
                );

            }
        );


    // =====================================================
    // TITRE DES RÉSULTATS
    // =====================================================

    if (resultsTitle) {

        if (
            keyword ||
            category ||
            city
        ) {

            resultsTitle.textContent =
                "Résultats de recherche";

        } else {

            resultsTitle.textContent =
                "Toutes les annonces";

        }

    }


    // =====================================================
    // AFFICHAGE
    // =====================================================

    displayResults(filtered);

}


// =========================================================
// CHARGER LES ANNONCES DEPUIS FIRESTORE
// =========================================================

async function loadAds() {

    if (!searchResults) {
        return;
    }


    try {

        // =================================================
        // COLLECTION FIRESTORE
        // =================================================

        const annoncesRef =
            collection(
                db,
                "annonces"
            );


        // =================================================
        // RÉCUPÉRER LES DOCUMENTS
        // =================================================

        const snapshot =
            await getDocs(
                annoncesRef
            );


        // =================================================
        // TRANSFORMER LES DOCUMENTS
        // =================================================

        allAds =
            snapshot.docs.map(
                (document) => ({

                    id: document.id,

                    ...document.data()

                })
            );


        // =================================================
        // TRIER PAR DATE
        // Plus récente → plus ancienne
        // =================================================

        allAds.sort(
            (a, b) => {

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

            }
        );


        // =================================================
        // CONSOLE
        // =================================================

        console.log(
            "CAMU SERVICES — collection utilisée : annonces"
        );

        console.log(
            "CAMU SERVICES — annonces chargées :",
            allAds.length
        );


        // =================================================
        // AFFICHER TOUTES LES ANNONCES
        // =================================================

        displayResults(
            allAds
        );


        // =================================================
        // FILTRES URL
        // =================================================

        applyUrlFilters();


    } catch (error) {

        console.error(
            "CAMU SERVICES — erreur recherche :",
            error
        );


        // =================================================
        // MESSAGE D'ERREUR
        // =================================================

        searchResults.innerHTML = `

            <div class="search-empty">

                <div class="search-empty-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Erreur de chargement
                </h3>

                <p>
                    Impossible de récupérer les annonces.
                </p>

                <small>
                    Vérifiez votre connexion et les règles Firestore.
                </small>

            </div>

        `;

    }

}


// =========================================================
// FILTRES URL
// Exemple :
// recherche.html?category=immobilier
// recherche.html?city=Lubumbashi
// recherche.html?q=iphone
// =========================================================

function applyUrlFilters() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get("category");

    const city =
        params.get("city");

    const keyword =
        params.get("q");


    // =====================================================
    // CATÉGORIE
    // =====================================================

    if (
        category &&
        searchCategory
    ) {

        searchCategory.value =
            normalize(category);

    }


    // =====================================================
    // VILLE
    // =====================================================

    if (
        city &&
        searchCity
    ) {

        searchCity.value =
            normalize(city);

    }


    // =====================================================
    // MOT-CLÉ
    // =====================================================

    if (
        keyword &&
        searchKeyword
    ) {

        searchKeyword.value =
            keyword;

    }


    // =====================================================
    // APPLIQUER LES FILTRES
    // =====================================================

    if (
        category ||
        city ||
        keyword
    ) {

        filterAds();

    }

}


// =========================================================
// FORMULAIRE DE RECHERCHE
// =========================================================

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            filterAds();

        }
    );

}


// =========================================================
// CHARGEMENT INITIAL
// =========================================================

loadAds();


// =========================================================
// CONFIRMATION
// =========================================================

console.log(
    "CAMU SERVICES — recherche.js chargé correctement."
);

console.log(
    "CAMU SERVICES — source Firestore : annonces"
);

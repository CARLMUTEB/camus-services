// =========================================================
// CAMU SERVICES — HÔTELS & HÉBERGEMENT
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const COLLECTION_NAME = "etablissements_hoteliers";


// =========================================================
// ÉLÉMENTS DOM
// =========================================================

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const cityFilter = document.getElementById("cityFilter");
const categoryFilter = document.getElementById("categoryFilter");

const categoriesGrid = document.getElementById("categoriesGrid");

const establishmentsGrid =
    document.getElementById("establishmentsGrid");

const resultsCount =
    document.getElementById("resultsCount");

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const emptyState =
    document.getElementById("emptyState");

const retryButton =
    document.getElementById("retryButton");

const resetButton =
    document.getElementById("resetButton");

const currentYear =
    document.getElementById("currentYear");


// =========================================================
// ÉTAT
// =========================================================

let establishments = [];

let selectedCategory = "";


// =========================================================
// INITIALISATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log(
        "CAMU HÔTELS — initialisation..."
    );

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }

    setupMenu();
    setupSearch();
    setupCategories();

    loadEstablishments();

});


// =========================================================
// CHARGEMENT FIRESTORE
// =========================================================

async function loadEstablishments() {

    showLoading();

    try {

        console.log(
            `CAMU HÔTELS — lecture de ${COLLECTION_NAME}...`
        );

        const snapshot = await getDocs(
            collection(db, COLLECTION_NAME)
        );

        establishments = [];

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            /*
             * Seuls les établissements actifs sont
             * affichés publiquement.
             *
             * Si le champ active n'existe pas,
             * on conserve l'établissement pour éviter
             * de supprimer accidentellement les données
             * déjà présentes.
             */

            if (
                data.active === false
            ) {
                return;
            }

            establishments.push({
                id: docSnap.id,
                ...data
            });

        });


        console.log(
            "CAMU HÔTELS — établissements :",
            establishments.length
        );


        populateCities();
        populateCategories();

        applyFilters();

        console.log(
            "CAMU HÔTELS — initialisation terminée."
        );

    } catch (error) {

        console.error(
            "CAMU HÔTELS — erreur Firestore :",
            error
        );

        showError(
            "Impossible de charger les établissements. Vérifiez votre connexion et réessayez."
        );

    }

}


// =========================================================
// VILLES
// =========================================================

function populateCities() {

    if (!cityFilter) {
        return;
    }

    const cities = new Set();

    establishments.forEach((hotel) => {

        const city =
            cleanValue(
                hotel.ville
            );

        if (city) {
            cities.add(city);
        }

    });


    const sortedCities =
        [...cities].sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        );


    cityFilter.innerHTML = `
        <option value="">
            Toutes les villes
        </option>
    `;


    sortedCities.forEach((city) => {

        const option =
            document.createElement("option");

        option.value = city;
        option.textContent = city;

        cityFilter.appendChild(option);

    });


    console.log(
        "CAMU HÔTELS — villes :",
        sortedCities.length
    );

}


// =========================================================
// CATÉGORIES DU SELECT
// =========================================================

function populateCategories() {

    if (!categoryFilter) {
        return;
    }

    const categories = new Set();

    establishments.forEach((hotel) => {

        const category =
            cleanValue(
                hotel.category
            );

        if (category) {
            categories.add(category);
        }

    });


    const sortedCategories =
        [...categories].sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        );


    categoryFilter.innerHTML = `
        <option value="">
            Toutes les catégories
        </option>
    `;


    sortedCategories.forEach((category) => {

        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);

    });

}


// =========================================================
// RECHERCHE
// =========================================================

function setupSearch() {

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {
                applyFilters();
            }
        );

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {
                applyFilters();
            }
        );

    }


    if (cityFilter) {

        cityFilter.addEventListener(
            "change",
            () => {
                applyFilters();
            }
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            () => {

                selectedCategory =
                    categoryFilter.value;

                updateCategoryButtons();

                applyFilters();

            }
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadEstablishments
        );

    }

}


// =========================================================
// CATÉGORIES VISUELLES
// =========================================================

function setupCategories() {

    if (!categoriesGrid) {
        return;
    }

    const buttons =
        categoriesGrid.querySelectorAll(
            ".category-card"
        );


    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                selectedCategory =
                    cleanValue(
                        button.dataset.category
                    );

                if (categoryFilter) {
                    categoryFilter.value =
                        selectedCategory;
                }

                updateCategoryButtons();

                applyFilters();

            }
        );

    });

}


function updateCategoryButtons() {

    if (!categoriesGrid) {
        return;
    }

    const buttons =
        categoriesGrid.querySelectorAll(
            ".category-card"
        );


    buttons.forEach((button) => {

        const category =
            cleanValue(
                button.dataset.category
            );

        button.classList.toggle(
            "active",
            category === selectedCategory
        );

    });

}


// =========================================================
// FILTRES
// =========================================================

function applyFilters() {

    const search =
        cleanValue(
            searchInput?.value
        ).toLowerCase();


    const city =
        cleanValue(
            cityFilter?.value
        );


    const category =
        cleanValue(
            categoryFilter?.value ||
            selectedCategory
        );


    const filtered =
        establishments.filter((hotel) => {

            const name =
                cleanValue(
                    hotel.name
                ).toLowerCase();

            const description =
                cleanValue(
                    hotel.description
                ).toLowerCase();

            const hotelCity =
                cleanValue(
                    hotel.ville
                );

            const commune =
                cleanValue(
                    hotel.commune
                ).toLowerCase();

            const hotelCategory =
                cleanValue(
                    hotel.category
                );


            const searchMatch =
                !search ||
                name.includes(search) ||
                description.includes(search) ||
                hotelCity.toLowerCase().includes(search) ||
                commune.includes(search) ||
                hotelCategory.toLowerCase().includes(search);


            const cityMatch =
                !city ||
                hotelCity === city;


            const categoryMatch =
                !category ||
                hotelCategory.toLowerCase() ===
                category.toLowerCase();


            return (
                searchMatch &&
                cityMatch &&
                categoryMatch
            );

        });


    renderEstablishments(filtered);

}


// =========================================================
// AFFICHAGE
// =========================================================

function renderEstablishments(items) {

    if (!establishmentsGrid) {
        return;
    }

    establishmentsGrid.innerHTML = "";


    if (resultsCount) {

        const count = items.length;

        resultsCount.textContent =
            count === 1
                ? "1 établissement"
                : `${count} établissements`;

    }


    if (items.length === 0) {

        establishmentsGrid.classList.add(
            "hidden"
        );

        showEmpty();

        return;

    }


    hideAllStates();

    establishmentsGrid.classList.remove(
        "hidden"
    );


    items.forEach((hotel) => {

        const card =
            createHotelCard(hotel);

        establishmentsGrid.appendChild(card);

    });


    console.log(
        "CAMU HÔTELS — cartes affichées :",
        items.length
    );

}


// =========================================================
// CRÉATION D'UNE CARTE
// =========================================================

function createHotelCard(hotel) {

    const card =
        document.createElement("article");

    card.className =
        "hotel-card";


    const name =
        cleanValue(
            hotel.name
        ) ||
        "Établissement hôtelier";


    const category =
        cleanValue(
            hotel.category
        ) ||
        "Hébergement";


    const city =
        cleanValue(
            hotel.ville
        );


    const commune =
        cleanValue(
            hotel.commune
        );


    const address =
        cleanValue(
            hotel.adresse
        );


    const description =
        cleanValue(
            hotel.description
        ) ||
        "Découvrez les informations de cet établissement sur CAMU SERVICES.";


    const images =
        extractImages(hotel);


    const mainImage =
        images.length > 0
            ? images[0]
            : null;


    const location =
        [city, commune]
            .filter(Boolean)
            .join(" • ") ||
        address ||
        "Localisation non renseignée";


    card.innerHTML = `

        <div class="hotel-card-image">

            ${
                mainImage
                    ? `
                        <img
                            src="${escapeAttribute(mainImage)}"
                            alt="${escapeAttribute(name)}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="image-placeholder">
                            🏨
                        </div>
                    `
            }

            <span class="hotel-card-category">
                ${escapeHtml(category)}
            </span>

            <button
                type="button"
                class="hotel-card-favorite"
                aria-label="Ajouter aux favoris"
                title="Ajouter aux favoris"
            >
                ♡
            </button>

        </div>


        <div class="hotel-card-content">

            <h3 class="hotel-card-title">
                ${escapeHtml(name)}
            </h3>


            <div class="hotel-card-location">
                <span>📍</span>
                <span>
                    ${escapeHtml(location)}
                </span>
            </div>


            <p class="hotel-card-description">
                ${escapeHtml(description)}
            </p>


            <div class="hotel-card-footer">

                <span class="hotel-card-photos">
                    📷 ${
                        images.length
                    } ${
                        images.length > 1
                            ? "photos"
                            : "photo"
                    }
                </span>

                <span class="hotel-card-link">
                    Voir l'établissement →
                </span>

            </div>

        </div>

    `;


    /*
     * Toute la carte ouvre la fiche détaillée.
     */

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `hotel.html?id=${encodeURIComponent(hotel.id)}`;

        }
    );


    /*
     * Empêche le bouton favoris de déclencher
     * l'ouverture de la fiche.
     *
     * La vraie gestion Firestore des favoris pourra
     * être ajoutée séparément sans modifier la carte.
     */

    const favoriteButton =
        card.querySelector(
            ".hotel-card-favorite"
        );


    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                alert(
                    "Connectez-vous pour gérer vos favoris."
                );

            }
        );

    }


    /*
     * Si une image est invalide, on remplace
     * simplement l'image par le placeholder.
     */

    const image =
        card.querySelector(
            ".hotel-card-image img"
        );


    if (image) {

        image.addEventListener(
            "error",
            () => {

                const placeholder =
                    document.createElement("div");

                placeholder.className =
                    "image-placeholder";

                placeholder.textContent =
                    "🏨";

                image.replaceWith(
                    placeholder
                );

            }
        );

    }


    return card;

}


// =========================================================
// EXTRACTION DES IMAGES
// =========================================================

function extractImages(hotel) {

    const images = [];


    /*
     * Photo principale
     */

    const mainPhoto =
        cleanValue(
            hotel.photoURL
        );


    if (isValidImageUrl(mainPhoto)) {

        images.push(
            mainPhoto
        );

    }


    /*
     * Champ images
     *
     * Peut être :
     * - un tableau Firestore
     * - une chaîne JSON
     * - une simple URL
     */

    let gallery =
        hotel.images;


    if (typeof gallery === "string") {

        const value =
            gallery.trim();

        if (value) {

            try {

                gallery =
                    JSON.parse(value);

            } catch {

                gallery =
                    [value];

            }

        }

    }


    if (Array.isArray(gallery)) {

        gallery.forEach((item) => {

            const url =
                typeof item === "string"
                    ? item
                    : item?.url ||
                      item?.secure_url ||
                      item?.src ||
                      item?.imageURL ||
                      "";

            if (
                isValidImageUrl(url) &&
                !images.includes(url)
            ) {

                images.push(url);

            }

        });

    }


    /*
     * Champs photoURL1, photoURL2, etc.
     */

    for (let i = 1; i <= 10; i++) {

        const possibleFields = [
            `photoURL${i}`,
            `image${i}`,
            `photo${i}`
        ];


        possibleFields.forEach((field) => {

            const url =
                cleanValue(
                    hotel[field]
                );


            if (
                isValidImageUrl(url) &&
                !images.includes(url)
            ) {

                images.push(url);

            }

        });

    }


    return images;

}


// =========================================================
// VALIDATION URL IMAGE
// =========================================================

function isValidImageUrl(value) {

    if (!value) {
        return false;
    }

    const url =
        String(value).trim();


    if (
        url === "url1" ||
        url === "url2" ||
        url === "url3" ||
        url === "image" ||
        url === "photo"
    ) {
        return false;
    }


    return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")
    );

}


// =========================================================
// RÉINITIALISER
// =========================================================

function resetFilters() {

    if (searchInput) {
        searchInput.value = "";
    }

    if (cityFilter) {
        cityFilter.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "";
    }

    selectedCategory = "";

    updateCategoryButtons();

    applyFilters();

}


// =========================================================
// ÉTATS
// =========================================================

function hideAllStates() {

    loadingState?.classList.add(
        "hidden"
    );

    errorState?.classList.add(
        "hidden"
    );

    emptyState?.classList.add(
        "hidden"
    );

}


function showLoading() {

    hideAllStates();

    loadingState?.classList.remove(
        "hidden"
    );

    establishmentsGrid?.classList.add(
        "hidden"
    );

}


function showEmpty() {

    loadingState?.classList.add(
        "hidden"
    );

    errorState?.classList.add(
        "hidden"
    );

    emptyState?.classList.remove(
        "hidden"
    );

}


function showError(message) {

    loadingState?.classList.add(
        "hidden"
    );

    emptyState?.classList.add(
        "hidden"
    );

    errorState?.classList.remove(
        "hidden"
    );

    establishmentsGrid?.classList.add(
        "hidden"
    );


    if (errorMessage) {
        errorMessage.textContent =
            message;
    }

}


function hideStates() {

    hideAllStates();

}


// =========================================================
// MENU
// =========================================================

function setupMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const closeMenu =
        document.getElementById(
            "closeMenu"
        );

    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );

    const menuOverlay =
        document.getElementById(
            "menuOverlay"
        );


    if (!menuButton || !mobileMenu) {
        return;
    }


    function openMenu() {

        mobileMenu.classList.add(
            "open"
        );

        menuOverlay?.classList.add(
            "open"
        );

        document.body.style.overflow =
            "hidden";

    }


    function closeMobileMenu() {

        mobileMenu.classList.remove(
            "open"
        );

        menuOverlay?.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";

    }


    menuButton.addEventListener(
        "click",
        openMenu
    );


    closeMenu?.addEventListener(
        "click",
        closeMobileMenu
    );


    menuOverlay?.addEventListener(
        "click",
        closeMobileMenu
    );


    mobileMenu
        .querySelectorAll("a")
        .forEach((link) => {

            link.addEventListener(
                "click",
                closeMobileMenu
            );

        });

}


// =========================================================
// UTILITAIRES
// =========================================================

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();

}


function escapeHtml(value) {

    return cleanValue(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}

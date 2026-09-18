// =========================================================
// CAMU SERVICES — HÔTELS & HÉBERGEMENT
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const HOTELS_COLLECTION =
    "etablissements_hoteliers";

const CITIES_COLLECTION =
    "villes";


// =========================================================
// DOM
// =========================================================

const searchInput =
    document.getElementById("searchInput");

const cityFilter =
    document.getElementById("cityFilter");

const communeFilter =
    document.getElementById("communeFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const searchButton =
    document.getElementById("searchButton");

const hotelCategories =
    document.getElementById("hotelCategories");

const hotelListings =
    document.getElementById("hotelListings");

const hotelCount =
    document.getElementById("hotelCount");

const hotelLoading =
    document.getElementById("hotelLoading");

const hotelError =
    document.getElementById("hotelError");

const hotelErrorMessage =
    document.getElementById("hotelErrorMessage");

const hotelEmpty =
    document.getElementById("hotelEmpty");

const hotelRetryButton =
    document.getElementById("hotelRetryButton");

const hotelResetButton =
    document.getElementById("hotelResetButton");

const hotelYear =
    document.getElementById("hotelYear");


// =========================================================
// VARIABLES
// =========================================================

let hotels = [];

let cities = [];

let selectedCategory = "";


// =========================================================
// INITIALISATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "CAMU HÔTELS — initialisation..."
        );

        if (hotelYear) {

            hotelYear.textContent =
                new Date().getFullYear();

        }

        setupMenu();

        setupFilters();

        setupCategoryButtons();

        await loadCities();

        await loadHotels();

    }
);


// =========================================================
// CHARGER LES VILLES
// SOURCE : COLLECTION villes
// =========================================================

async function loadCities() {

    if (!cityFilter) {
        return;
    }

    try {

        console.log(
            "CAMU HÔTELS — chargement des villes..."
        );

        let snapshot;


        /*
         * On essaie d'abord de respecter
         * le champ order de la collection.
         */

        try {

            const citiesQuery =
                query(
                    collection(
                        db,
                        CITIES_COLLECTION
                    ),
                    orderBy("order", "asc")
                );

            snapshot =
                await getDocs(
                    citiesQuery
                );

        } catch (orderError) {

            console.warn(
                "CAMU HÔTELS — order non disponible, lecture simple de villes.",
                orderError
            );

            snapshot =
                await getDocs(
                    collection(
                        db,
                        CITIES_COLLECTION
                    )
                );

        }


        cities = [];


        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();


            /*
             * Une ville inactive ne doit pas
             * apparaître publiquement.
             */

            if (
                data.active === false
            ) {
                return;
            }


            const name =
                cleanValue(
                    data.name
                );


            if (!name) {
                return;
            }


            cities.push({

                id: docSnap.id,

                name: name,

                order:
                    Number(data.order) || 0

            });

        });


        cities.sort(
            (a, b) =>
                a.order - b.order ||
                a.name.localeCompare(
                    b.name,
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


        cities.forEach((city) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                city.name;

            option.textContent =
                city.name;

            cityFilter.appendChild(
                option
            );

        });


        console.log(
            "CAMU HÔTELS — villes chargées depuis Firestore :",
            cities.length
        );

    } catch (error) {

        console.error(
            "CAMU HÔTELS — erreur chargement villes :",
            error
        );

        /*
         * On ne bloque pas toute la page
         * si les établissements peuvent
         * quand même être chargés.
         */

        cityFilter.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

    }

}


// =========================================================
// CHARGER LES ÉTABLISSEMENTS
// SOURCE : etablissements_hoteliers
// =========================================================

async function loadHotels() {

    showLoading();

    try {

        console.log(
            "CAMU HÔTELS — chargement des établissements..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    HOTELS_COLLECTION
                )
            );


        hotels = [];


        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();


            /*
             * active = false
             * signifie que l'établissement
             * ne doit pas être public.
             */

            if (
                data.active === false
            ) {
                return;
            }


            hotels.push({

                id: docSnap.id,

                ...data

            });

        });


        console.log(
            "CAMU HÔTELS — établissements :",
            hotels.length
        );


        populateHotelCategories();

        /*
         * Après le chargement, on génère
         * les communes correspondant
         * à la ville actuellement sélectionnée.
         */

        loadCommunes(
            cityFilter?.value || ""
        );


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
            "Impossible de charger les établissements. Vérifiez votre connexion."
        );

    }

}


// =========================================================
// COMMUNES
//
// Les villes viennent de "villes".
// Les communes sont récupérées des établissements
// correspondant à la ville sélectionnée.
// =========================================================

function loadCommunes(
    selectedCity = ""
) {

    if (!communeFilter) {
        return;
    }


    communeFilter.innerHTML = `
        <option value="">
            Toutes les communes
        </option>
    `;


    communeFilter.disabled =
        !selectedCity;


    if (!selectedCity) {
        return;
    }


    const communeMap =
        new Map();


    hotels.forEach((hotel) => {

        const hotelCity =
            cleanValue(
                hotel.ville
            );


        const commune =
            cleanValue(
                hotel.commune
            );


        if (
            hotelCity.toLowerCase() ===
            selectedCity.toLowerCase() &&
            commune
        ) {

            const key =
                commune.toLowerCase();


            if (!communeMap.has(key)) {

                communeMap.set(
                    key,
                    commune
                );

            }

        }

    });


    const communes =
        [...communeMap.values()]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "fr",
                        {
                            sensitivity: "base"
                        }
                    )
            );


    communes.forEach((commune) => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            commune;

        option.textContent =
            commune;

        communeFilter.appendChild(
            option
        );

    });


    console.log(
        `CAMU HÔTELS — communes pour ${selectedCity} :`,
        communes.length
    );

}


// =========================================================
// CATÉGORIES DYNAMIQUES DU SELECT
// =========================================================

function populateHotelCategories() {

    if (!categoryFilter) {
        return;
    }


    const categories =
        new Set();


    hotels.forEach((hotel) => {

        const category =
            cleanValue(
                hotel.category
            );


        if (category) {

            categories.add(
                category
            );

        }

    });


    const sorted =
        [...categories]
            .sort(
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


    sorted.forEach((category) => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            category;

        option.textContent =
            category;

        categoryFilter.appendChild(
            option
        );

    });

}


// =========================================================
// FILTRES
// =========================================================

function setupFilters() {

    searchInput?.addEventListener(
        "input",
        applyFilters
    );


    cityFilter?.addEventListener(
        "change",
        () => {

            /*
             * Quand la ville change,
             * on recharge les communes.
             */

            loadCommunes(
                cityFilter.value
            );


            /*
             * Une ancienne commune sélectionnée
             * ne doit pas rester active.
             */

            if (communeFilter) {

                communeFilter.value = "";

            }


            applyFilters();

        }
    );


    communeFilter?.addEventListener(
        "change",
        applyFilters
    );


    categoryFilter?.addEventListener(
        "change",
        () => {

            selectedCategory =
                cleanValue(
                    categoryFilter.value
                );


            updateCategoryButtons();

            applyFilters();

        }
    );


    searchButton?.addEventListener(
        "click",
        applyFilters
    );


    hotelRetryButton?.addEventListener(
        "click",
        loadHotels
    );


    hotelResetButton?.addEventListener(
        "click",
        resetFilters
    );

}


// =========================================================
// BOUTONS CATÉGORIES
// =========================================================

function setupCategoryButtons() {

    if (!hotelCategories) {
        return;
    }


    const buttons =
        hotelCategories.querySelectorAll(
            ".hotel-service-card"
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


// =========================================================
// ACTUALISER LES CATÉGORIES
// =========================================================

function updateCategoryButtons() {

    if (!hotelCategories) {
        return;
    }


    const buttons =
        hotelCategories.querySelectorAll(
            ".hotel-service-card"
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
// APPLICATION DES FILTRES
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


    const commune =
        cleanValue(
            communeFilter?.value
        );


    const category =
        cleanValue(
            categoryFilter?.value ||
            selectedCategory
        );


    const filtered =
        hotels.filter((hotel) => {

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


            const hotelCommune =
                cleanValue(
                    hotel.commune
                );


            const hotelAddress =
                cleanValue(
                    hotel.adresse
                ).toLowerCase();


            const hotelCategory =
                cleanValue(
                    hotel.category
                );


            /*
             * RECHERCHE TEXTE
             */

            const searchMatch =
                !search ||
                name.includes(search) ||
                description.includes(search) ||
                hotelCity
                    .toLowerCase()
                    .includes(search) ||
                hotelCommune
                    .toLowerCase()
                    .includes(search) ||
                hotelAddress.includes(search) ||
                hotelCategory
                    .toLowerCase()
                    .includes(search);


            /*
             * VILLE
             */

            const cityMatch =
                !city ||
                hotelCity.toLowerCase() ===
                city.toLowerCase();


            /*
             * COMMUNE
             */

            const communeMatch =
                !commune ||
                hotelCommune.toLowerCase() ===
                commune.toLowerCase();


            /*
             * CATÉGORIE
             */

            const categoryMatch =
                !category ||
                hotelCategory.toLowerCase() ===
                category.toLowerCase();


            return (
                searchMatch &&
                cityMatch &&
                communeMatch &&
                categoryMatch
            );

        });


    renderHotels(filtered);

}


// =========================================================
// AFFICHAGE
// =========================================================

function renderHotels(items) {

    if (!hotelListings) {
        return;
    }


    hotelListings.innerHTML = "";


    if (hotelCount) {

        const count =
            items.length;


        hotelCount.textContent =
            count === 1
                ? "1 établissement"
                : `${count} établissements`;

    }


    if (items.length === 0) {

        hotelListings.classList.add(
            "hidden"
        );

        showEmpty();

        return;
    }


    hideStates();


    hotelListings.classList.remove(
        "hidden"
    );


    items.forEach((hotel) => {

        hotelListings.appendChild(
            createHotelCard(hotel)
        );

    });


    console.log(
        "CAMU HÔTELS — cartes affichées :",
        items.length
    );

}


// =========================================================
// CARTE
// =========================================================

function createHotelCard(hotel) {

    const card =
        document.createElement(
            "article"
        );


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


    const description =
        cleanValue(
            hotel.description
        ) ||
        "Découvrez cet établissement sur CAMU SERVICES.";


    const images =
        extractImages(hotel);


    const mainImage =
        images.length
            ? images[0]
            : "";


    const location =
        [city, commune]
            .filter(Boolean)
            .join(" • ") ||
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
                        <div class="hotel-card-placeholder">
                            🏨
                        </div>
                    `
            }

            <span class="hotel-card-category">
                ${escapeHtml(category)}
            </span>

        </div>


        <div class="hotel-card-content">

            <h3>
                ${escapeHtml(name)}
            </h3>


            <div class="hotel-card-location">
                📍 ${escapeHtml(location)}
            </div>


            <p class="hotel-card-description">
                ${escapeHtml(description)}
            </p>


            <div class="hotel-card-footer">

                <span class="hotel-card-photos">
                    📷
                    ${images.length}
                    ${images.length === 1 ? "photo" : "photos"}
                </span>


                <span class="hotel-card-link">
                    Voir l'établissement →
                </span>

            </div>

        </div>

    `;


    /*
     * Toute la carte est cliquable.
     */

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `hotel.html?id=${encodeURIComponent(hotel.id)}`;

        }
    );


    /*
     * Gestion d'une image cassée.
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
                    document.createElement(
                        "div"
                    );

                placeholder.className =
                    "hotel-card-placeholder";

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
// EXTRACTION DES PHOTOS
// =========================================================

function extractImages(hotel) {

    const images = [];


    /*
     * photoURL
     */

    const main =
        cleanValue(
            hotel.photoURL
        );


    if (
        isValidImage(
            main
        )
    ) {

        images.push(main);

    }


    /*
     * images
     */

    let gallery =
        hotel.images;


    if (
        typeof gallery ===
        "string"
    ) {

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


    if (
        Array.isArray(
            gallery
        )
    ) {

        gallery.forEach(
            (item) => {

                const url =
                    typeof item === "string"
                        ? item
                        : item?.url ||
                          item?.secure_url ||
                          item?.src ||
                          item?.imageURL ||
                          "";


                if (
                    isValidImage(url) &&
                    !images.includes(url)
                ) {

                    images.push(url);

                }

            }
        );

    }


    /*
     * image1, image2...
     */

    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const fields = [
            `image${i}`,
            `photo${i}`,
            `photoURL${i}`
        ];


        fields.forEach(
            (field) => {

                const url =
                    cleanValue(
                        hotel[field]
                    );


                if (
                    isValidImage(url) &&
                    !images.includes(url)
                ) {

                    images.push(url);

                }

            }
        );

    }


    return images;

}


// =========================================================
// VALIDATION IMAGE
// =========================================================

function isValidImage(value) {

    const url =
        cleanValue(value);


    if (!url) {
        return false;
    }


    const invalidValues = [
        "url1",
        "url2",
        "url3",
        "image",
        "photo"
    ];


    if (
        invalidValues.includes(
            url.toLowerCase()
        )
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
// RESET
// =========================================================

function resetFilters() {

    if (searchInput) {
        searchInput.value = "";
    }


    if (cityFilter) {
        cityFilter.value = "";
    }


    if (communeFilter) {

        communeFilter.innerHTML = `
            <option value="">
                Toutes les communes
            </option>
        `;

        communeFilter.value = "";

        communeFilter.disabled = true;

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

function hideStates() {

    hotelLoading?.classList.add(
        "hidden"
    );

    hotelError?.classList.add(
        "hidden"
    );

    hotelEmpty?.classList.add(
        "hidden"
    );

}


function showLoading() {

    hideStates();

    hotelListings?.classList.add(
        "hidden"
    );

    hotelLoading?.classList.remove(
        "hidden"
    );

}


function showEmpty() {

    hotelLoading?.classList.add(
        "hidden"
    );

    hotelError?.classList.add(
        "hidden"
    );

    hotelEmpty?.classList.remove(
        "hidden"
    );

}


function showError(message) {

    hotelLoading?.classList.add(
        "hidden"
    );

    hotelEmpty?.classList.add(
        "hidden"
    );

    hotelListings?.classList.add(
        "hidden"
    );

    hotelError?.classList.remove(
        "hidden"
    );


    if (hotelErrorMessage) {

        hotelErrorMessage.textContent =
            message;

    }

}


// =========================================================
// MENU MOBILE
// =========================================================

function setupMenu() {

    const menuButton =
        document.getElementById(
            "hotelMenuButton"
        );


    const sidebar =
        document.getElementById(
            "hotelSidebar"
        );


    const overlay =
        document.getElementById(
            "hotelOverlay"
        );


    if (
        !menuButton ||
        !sidebar
    ) {
        return;
    }


    function openMenu() {

        sidebar.classList.add(
            "open"
        );

        overlay?.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";

    }


    function closeMenu() {

        sidebar.classList.remove(
            "open"
        );

        overlay?.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    }


    menuButton.addEventListener(
        "click",
        openMenu
    );


    overlay?.addEventListener(
        "click",
        closeMenu
    );


    sidebar
        .querySelectorAll("a")
        .forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            }
        );

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
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}

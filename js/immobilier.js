// =========================================================
// CAMU IMMO
// IMMOBILIER.JS
// =========================================================

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    db
} from "./firebase.js";


// =========================================================
// ÉLÉMENTS
// =========================================================

const immoAdsContainer =
    document.getElementById("immoAds");

const immoSearchForm =
    document.getElementById("immoSearchForm");

const immoSearchInput =
    document.getElementById("immoSearch");

const immoCitySelect =
    document.getElementById("immoCity");


// =========================================================
// DONNÉES
// =========================================================

let allImmoAds = [];

let currentSearch = "";

let currentCity = "";

let immobilierCategoryId = "";

let immobilierCategoryName = "Immobilier";


// =========================================================
// UTILITAIRES
// =========================================================

function normalizeText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatPrice(price, currency = "") {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${escapeHTML(price)} ${escapeHTML(currency)}`;
    }

    const formatted =
        new Intl.NumberFormat("fr-FR").format(number);

    return `${formatted} ${escapeHTML(currency)}`.trim();

}


function getFirstImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {
        return ad.images[0];
    }

    if (ad.imageURL) {
        return ad.imageURL;
    }

    return "assets/images/no-image.jpg";

}


function getAdId(ad) {

    return ad.id || "";

}


// =========================================================
// CHARGER LA CATÉGORIE IMMOBILIER
// =========================================================

async function loadImmobilierCategory() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "categories")
            );

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            const name =
                String(data.name || "").trim();

            if (
                normalizeText(name) ===
                normalizeText("Immobilier")
            ) {

                immobilierCategoryId =
                    docSnap.id;

                immobilierCategoryName =
                    name || "Immobilier";

            }

        });

    } catch (error) {

        console.error(
            "Erreur chargement catégorie Immobilier :",
            error
        );

    }

}


// =========================================================
// CHARGER LES VILLES
// =========================================================

async function loadCities() {

    if (!immoCitySelect) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(db, "villes")
            );

        const cities = [];

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (data.active === false) {
                return;
            }

            const name =
                String(data.name || "").trim();

            if (!name) {
                return;
            }

            cities.push({
                id: docSnap.id,
                name: name
            });

        });


        cities.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "fr"
            )
        );


        cities.forEach((city) => {

            const option =
                document.createElement("option");

            option.value = city.id;

            option.textContent = city.name;

            option.dataset.name =
                city.name;

            immoCitySelect.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );

    }

}


// =========================================================
// CHARGER LES ANNONCES
// =========================================================

async function loadImmobilierAds() {

    if (!immoAdsContainer) {
        return;
    }

    immoAdsContainer.innerHTML = `

        <div class="immo-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Chargement des biens immobiliers...
            </span>

        </div>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(db, "annonces")
            );

        allImmoAds = [];


        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();


            // -------------------------------------------------
            // Ignorer les annonces désactivées
            // -------------------------------------------------

            if (
                data.status &&
                normalizeText(data.status) !== "active"
            ) {
                return;
            }


            // -------------------------------------------------
            // Vérifier la catégorie
            // -------------------------------------------------

            const adCategory =
                normalizeText(data.category);

            const categoryId =
                normalizeText(immobilierCategoryId);

            const categoryName =
                normalizeText(immobilierCategoryName);


            const isImmobilier =
                adCategory === categoryName ||
                adCategory === categoryId ||
                adCategory === "immobilier";


            if (!isImmobilier) {
                return;
            }


            allImmoAds.push({

                id: docSnap.id,

                ...data

            });

        });


        // -----------------------------------------------------
        // Trier par date
        // -----------------------------------------------------

        allImmoAds.sort((a, b) => {

            const dateA =
                getTimestampValue(a.createdAt);

            const dateB =
                getTimestampValue(b.createdAt);

            return dateB - dateA;

        });


        displayAds(allImmoAds);


    } catch (error) {

        console.error(
            "Erreur chargement annonces immobilières :",
            error
        );


        immoAdsContainer.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Impossible de charger les biens
                </h3>

                <p>
                    Une erreur est survenue lors du chargement
                    des annonces immobilières.
                </p>

            </div>

        `;

    }

}


// =========================================================
// TIMESTAMP FIREBASE
// =========================================================

function getTimestampValue(timestamp) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis === "function"
    ) {
        return timestamp.toMillis();
    }


    if (
        timestamp.seconds !== undefined
    ) {
        return timestamp.seconds * 1000;
    }


    if (
        timestamp instanceof Date
    ) {
        return timestamp.getTime();
    }


    return 0;

}


// =========================================================
// AFFICHER LES ANNONCES
// =========================================================

function displayAds(ads) {

    if (!immoAdsContainer) {
        return;
    }


    if (!ads.length) {

        immoAdsContainer.innerHTML = `

            <div class="immo-empty">

                <div class="immo-empty-icon">

                    <i class="fa-solid fa-house-circle-exclamation"></i>

                </div>

                <h3>
                    Aucun bien immobilier trouvé
                </h3>

                <p>
                    Aucun bien ne correspond actuellement
                    à votre recherche.
                </p>

            </div>

        `;

        return;
    }


    immoAdsContainer.innerHTML = "";


    ads.forEach((ad) => {

        const card =
            createAdCard(ad);

        immoAdsContainer.appendChild(card);

    });

}


// =========================================================
// CRÉER UNE CARTE
// =========================================================

function createAdCard(ad) {

    const card =
        document.createElement("a");


    card.className =
        "immo-ad-card";


    const id =
        getAdId(ad);


    card.href =
        `explorer.html?id=${encodeURIComponent(id)}`;


    const image =
        getFirstImage(ad);


    const title =
        ad.title ||
        "Bien immobilier";


    const city =
        ad.city ||
        "Ville non précisée";


    const neighborhood =
        ad.neighborhood ||
        "";


    const price =
        formatPrice(
            ad.price,
            ad.currency
        );


    const type =
        ad.propertyType ||
        ad.type ||
        ad.subcategory ||
        "";


    const transaction =
        ad.transactionType ||
        ad.operation ||
        ad.offerType ||
        "";


    let badge =
        transaction ||
        type ||
        "Immobilier";


    card.innerHTML = `

        <div class="immo-ad-image">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                onerror="this.src='assets/images/no-image.jpg'"
            >


            <span class="immo-ad-badge">

                ${escapeHTML(badge)}

            </span>

        </div>


        <div class="immo-ad-content">


            <h3 class="immo-ad-title">

                ${escapeHTML(title)}

            </h3>


            <div class="immo-ad-location">

                <i class="fa-solid fa-location-dot"></i>

                <span>

                    ${escapeHTML(city)}

                    ${
                        neighborhood
                            ? ` • ${escapeHTML(neighborhood)}`
                            : ""
                    }

                </span>

            </div>


            <div class="immo-ad-price">

                ${price}

            </div>


        </div>

    `;


    return card;

}


// =========================================================
// FILTRAGE
// =========================================================

function filterAds() {

    currentSearch =
        normalizeText(
            immoSearchInput
                ? immoSearchInput.value
                : ""
        );


    currentCity =
        normalizeText(
            immoCitySelect
                ? immoCitySelect.value
                : ""
        );


    const selectedOption =
        immoCitySelect &&
        immoCitySelect.selectedOptions.length
            ? immoCitySelect.selectedOptions[0]
            : null;


    const selectedCityName =
        selectedOption
            ? normalizeText(
                selectedOption.dataset.name ||
                selectedOption.textContent
            )
            : "";


    const filtered =
        allImmoAds.filter((ad) => {


            // ---------------------------------------------
            // RECHERCHE
            // ---------------------------------------------

            if (currentSearch) {

                const text = normalizeText(

                    [
                        ad.title,
                        ad.description,
                        ad.city,
                        ad.neighborhood,
                        ad.propertyType,
                        ad.type,
                        ad.subcategory,
                        ad.transactionType,
                        ad.operation
                    ]
                        .filter(Boolean)
                        .join(" ")

                );


                if (
                    !text.includes(currentSearch)
                ) {
                    return false;
                }

            }


            // ---------------------------------------------
            // VILLE
            // ---------------------------------------------

            if (currentCity) {

                const adCity =
                    normalizeText(ad.city);


                const adCityId =
                    normalizeText(
                        ad.cityId
                    );


                const matchesCity =
                    adCity === selectedCityName ||
                    adCity === currentCity ||
                    adCityId === currentCity;


                if (!matchesCity) {
                    return false;
                }

            }


            return true;

        });


    displayAds(filtered);

}


// =========================================================
// RECHERCHE
// =========================================================

if (immoSearchForm) {

    immoSearchForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            filterAds();

        }
    );

}


// =========================================================
// RECHERCHE EN DIRECT
// =========================================================

if (immoSearchInput) {

    immoSearchInput.addEventListener(
        "input",
        function () {

            filterAds();

        }
    );

}


// =========================================================
// CHANGEMENT VILLE
// =========================================================

if (immoCitySelect) {

    immoCitySelect.addEventListener(
        "change",
        function () {

            filterAds();

        }
    );

}


// =========================================================
// TYPES DE BIENS
// =========================================================

document
    .querySelectorAll(".immo-type")
    .forEach((button) => {

        button.addEventListener(
            "click",
            function () {

                const type =
                    button.dataset.type || "";


                if (immoSearchInput) {

                    immoSearchInput.value =
                        type;

                }


                filterAds();


                const adsSection =
                    document.getElementById("vente");


                if (adsSection) {

                    adsSection.scrollIntoView({

                        behavior: "smooth",

                        block: "start"

                    });

                }

            }
        );

    });


// =========================================================
// INITIALISATION
// =========================================================

async function initImmobilier() {

    await loadImmobilierCategory();

    await loadCities();

    await loadImmobilierAds();

}


initImmobilier();

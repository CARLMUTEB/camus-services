/* =========================================================
   CAMU IMMO
   IMMOBILIER.JS
========================================================= */

import {
    getListings
} from "./data.js";


/* =========================================================
   ÉLÉMENTS
========================================================= */

const sidebar = document.getElementById("immoSidebar");
const overlay = document.getElementById("immoOverlay");
const menuButton = document.getElementById("immoMenuButton");

const searchForm = document.getElementById("immoSearchForm");

const keywordInput = document.getElementById("immoKeyword");
const typeSelect = document.getElementById("immoType");
const citySelect = document.getElementById("immoCity");
const operationSelect = document.getElementById("immoOperation");

const adsContainer = document.getElementById("immoAds");


/* =========================================================
   ÉTAT
========================================================= */

let allAds = [];


/* =========================================================
   MENU MOBILE
========================================================= */

function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    if (overlay) {
        overlay.classList.add("open");
    }

    document.body.style.overflow = "hidden";
}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    if (overlay) {
        overlay.classList.remove("open");
    }

    document.body.style.overflow = "";
}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openSidebar
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


/* Fermer après clic sur un lien mobile */

document
    .querySelectorAll(".immo-sidebar-nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


/* =========================================================
   NORMALISATION
========================================================= */

function normalize(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* =========================================================
   EXTRAIRE LES IMAGES
========================================================= */

function getImages(ad) {

    if (Array.isArray(ad.images)) {

        return ad.images.filter(Boolean);

    }

    if (ad.imageURL) {

        return [ad.imageURL];

    }

    if (ad.image) {

        return [ad.image];

    }

    return [];

}


/* =========================================================
   FORMAT PRIX
========================================================= */

function formatPrice(ad) {

    if (
        ad.price === undefined ||
        ad.price === null ||
        ad.price === ""
    ) {

        return "Prix sur demande";

    }

    const number = Number(ad.price);

    if (Number.isNaN(number)) {

        return `${ad.price}`;

    }

    const formatted = new Intl.NumberFormat(
        "fr-FR"
    ).format(number);

    const currency =
        ad.currency ||
        "USD";

    return `${formatted} ${currency}`;

}


/* =========================================================
   DÉTECTER L'OPÉRATION
========================================================= */

function getOperation(ad) {

    const values = [

        ad.operation,
        ad.typeOperation,
        ad.transaction,
        ad.offerType,
        ad.operationType

    ];

    const text = normalize(
        values.find(Boolean) || ""
    );

    if (
        text.includes("location") ||
        text.includes("louer") ||
        text.includes("rent")
    ) {

        return "Location";

    }

    return "Vente";

}


/* =========================================================
   VÉRIFIER SI ANNONCE IMMOBILIÈRE
========================================================= */

function isRealEstate(ad) {

    const category = normalize(ad.category);

    const title = normalize(ad.title);

    const description =
        normalize(ad.description);

    return (
        category === "immobilier" ||
        category.includes("immobilier") ||
        title.includes("maison") ||
        title.includes("appartement") ||
        title.includes("terrain") ||
        title.includes("villa") ||
        title.includes("bureau") ||
        description.includes("immobilier")
    );

}


/* =========================================================
   CHARGER LES VILLES
========================================================= */

function loadCities() {

    if (!citySelect) return;


    const cities = new Set();


    allAds.forEach(ad => {

        if (ad.city) {

            cities.add(
                String(ad.city).trim()
            );

        }

    });


    const sortedCities =
        Array.from(cities)
            .sort((a, b) =>
                a.localeCompare(
                    b,
                    "fr"
                )
            );


    citySelect.innerHTML = `
        <option value="">
            Toutes les villes
        </option>
    `;


    sortedCities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;

        option.textContent = city;

        citySelect.appendChild(option);

    });

}


/* =========================================================
   CRÉER UNE CARTE ANNONCE
========================================================= */

function createAdCard(ad) {

    const images =
        getImages(ad);

    const image =
        images[0] ||
        "assets/img/placeholder.jpg";


    const title =
        ad.title ||
        "Bien immobilier";


    const city =
        ad.city ||
        "Ville non précisée";


    const operation =
        getOperation(ad);


    const card =
        document.createElement("article");

    card.className =
        "immo-ad-card";


    card.innerHTML = `

        <div class="immo-ad-image">

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
                onerror="this.src='assets/img/placeholder.jpg'"
            >

            <span class="immo-ad-operation">
                ${escapeHtml(operation)}
            </span>

        </div>


        <div class="immo-ad-body">

            <h3 title="${escapeAttribute(title)}">
                ${escapeHtml(title)}
            </h3>


            <div class="immo-ad-price">
                ${escapeHtml(formatPrice(ad))}
            </div>


            <div class="immo-ad-location">

                <i class="fa-solid fa-location-dot"></i>

                ${escapeHtml(city)}

            </div>


            <a
                href="explorer.html?id=${encodeURIComponent(ad.id)}"
                class="immo-ad-button"
            >

                Voir le bien

            </a>

        </div>

    `;


    return card;

}


/* =========================================================
   AFFICHER LES ANNONCES
========================================================= */

function displayAds(ads) {

    if (!adsContainer) return;


    adsContainer.innerHTML = "";


    if (!ads.length) {

        adsContainer.innerHTML = `

            <div class="immo-loading">

                <i class="fa-solid fa-house-circle-xmark"></i>

                <strong>
                    Aucun bien immobilier trouvé
                </strong>

                <span>
                    Essayez de modifier vos critères.
                </span>

            </div>

        `;

        return;

    }


    ads
        .slice(0, 12)
        .forEach(ad => {

            adsContainer.appendChild(
                createAdCard(ad)
            );

        });

}


/* =========================================================
   FILTRAGE
========================================================= */

function filterAds() {

    const keyword =
        normalize(
            keywordInput?.value
        );


    const type =
        normalize(
            typeSelect?.value
        );


    const city =
        normalize(
            citySelect?.value
        );


    const operation =
        normalize(
            operationSelect?.value
        );


    const filtered =
        allAds.filter(ad => {


            const title =
                normalize(ad.title);


            const description =
                normalize(ad.description);


            const adCity =
                normalize(ad.city);


            const adType =
                normalize(
                    ad.propertyType ||
                    ad.type ||
                    ad.property ||
                    ""
                );


            const adOperation =
                normalize(
                    ad.operation ||
                    ad.typeOperation ||
                    ad.transaction ||
                    ""
                );


            /* MOT-CLÉ */

            if (
                keyword &&
                !title.includes(keyword) &&
                !description.includes(keyword)
            ) {

                return false;

            }


            /* VILLE */

            if (
                city &&
                adCity !== city
            ) {

                return false;

            }


            /* TYPE */

            if (
                type &&
                !adType.includes(type) &&
                !title.includes(type) &&
                !description.includes(type)
            ) {

                return false;

            }


            /* OPÉRATION */

            if (operation) {

                if (
                    adOperation &&
                    !adOperation.includes(operation)
                ) {

                    return false;

                }

            }


            return true;

        });


    displayAds(filtered);

}


/* =========================================================
   FORMULAIRE
========================================================= */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            filterAds();

        }
    );

}


/* Recherche instantanée */

[
    keywordInput,
    typeSelect,
    citySelect,
    operationSelect

].forEach(element => {

    if (!element) return;

    element.addEventListener(
        "change",
        filterAds
    );

});


/* =========================================================
   CHARGEMENT FIRESTORE
========================================================= */

async function loadAds() {

    if (!adsContainer) return;


    try {

        adsContainer.innerHTML = `

            <div class="immo-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Chargement des biens...
                </span>

            </div>

        `;


        /*
         * On récupère les annonces depuis
         * la collection "annonces"
         * via data.js.
         */

        const listings =
            await getListings({
                listingLimit: 50
            });


        allAds =
            listings.filter(
                isRealEstate
            );


        loadCities();

        filterAds();


    } catch (error) {

        console.error(
            "Erreur CAMU IMMO :",
            error
        );


        adsContainer.innerHTML = `

            <div class="immo-loading">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    Impossible de charger les annonces
                </strong>

                <span>
                    Veuillez réessayer plus tard.
                </span>

            </div>

        `;

    }

}


/* =========================================================
   SÉCURITÉ HTML
========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAds();

    }
);

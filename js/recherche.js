/* =========================================================
   CAMU SERVICES — RECHERCHE DYNAMIQUE
========================================================= */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const searchForm =
    document.getElementById("searchForm");

const searchKeyword =
    document.getElementById("searchKeyword");

const searchDomain =
    document.getElementById("searchDomain");

const searchCategory =
    document.getElementById("searchCategory");

const searchVille =
    document.getElementById("searchVille");

const searchCommune =
    document.getElementById("searchCommune");

const searchType =
    document.getElementById("searchType");

const searchMinPrice =
    document.getElementById("searchMinPrice");

const searchMaxPrice =
    document.getElementById("searchMaxPrice");

const searchSubmit =
    document.getElementById("searchSubmit");

const searchReset =
    document.getElementById("searchReset");

const searchSort =
    document.getElementById("searchSort");

const searchProducts =
    document.getElementById("searchProducts");

const searchLoading =
    document.getElementById("searchLoading");

const searchEmpty =
    document.getElementById("searchEmpty");

const searchResultInfo =
    document.getElementById("searchResultInfo");

const searchYear =
    document.getElementById("searchYear");


/* =========================================================
   MENU MOBILE
========================================================= */

const searchMenuButton =
    document.getElementById("searchMenuButton");

const searchSidebar =
    document.getElementById("searchSidebar");

const searchOverlay =
    document.getElementById("searchOverlay");


if (searchMenuButton) {

    searchMenuButton.addEventListener(
        "click",
        () => {

            searchSidebar.classList.add("open");

            searchOverlay.classList.add("open");

        }
    );

}


if (searchOverlay) {

    searchOverlay.addEventListener(
        "click",
        closeMobileMenu
    );

}


function closeMobileMenu() {

    searchSidebar.classList.remove("open");

    searchOverlay.classList.remove("open");

}


/* =========================================================
   ANNÉE
========================================================= */

if (searchYear) {

    searchYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   DONNÉES
========================================================= */

let allAnnouncements = [];

let filteredAnnouncements = [];


/* =========================================================
   CATÉGORIES COMMERCE
========================================================= */

const COMMERCE_CATEGORIES = [

    {
        value: "mode",
        label: "Mode & Vêtements"
    },

    {
        value: "chaussures",
        label: "Chaussures"
    },

    {
        value: "telephones",
        label: "Téléphones & Accessoires"
    },

    {
        value: "informatique",
        label: "Informatique"
    },

    {
        value: "maison",
        label: "Maison & Mobilier"
    },

    {
        value: "beaute",
        label: "Beauté & Cosmétiques"
    },

    {
        value: "alimentation",
        label: "Alimentation"
    },

    {
        value: "boissons",
        label: "Boissons"
    },

    {
        value: "materiaux",
        label: "Matériaux & Bricolage"
    },

    {
        value: "livres",
        label: "Livres & Fournitures"
    },

    {
        value: "enfants",
        label: "Enfants & Jouets"
    },

    {
        value: "bijoux",
        label: "Bijoux & Accessoires"
    },

    {
        value: "autres",
        label: "Autres commerces"
    }

];


/* =========================================================
   CATÉGORIES IMMOBILIER
========================================================= */

const IMMOBILIER_CATEGORIES = [

    {
        value: "maison",
        label: "Maison"
    },

    {
        value: "appartement",
        label: "Appartement"
    },

    {
        value: "terrain",
        label: "Terrain"
    },

    {
        value: "bureau",
        label: "Bureau"
    },

    {
        value: "commerce",
        label: "Local commercial"
    },

    {
        value: "autre",
        label: "Autre"
    }

];


/* =========================================================
   CATÉGORIES VÉHICULES
========================================================= */

const VEHICLE_CATEGORIES = [

    {
        value: "vente_vehicule",
        label: "Vente de véhicules"
    },

    {
        value: "location",
        label: "Location de véhicules"
    },

    {
        value: "transport",
        label: "Transport de personnes"
    },

    {
        value: "marchandises",
        label: "Transport de marchandises"
    },

    {
        value: "taxi",
        label: "Taxi"
    },

    {
        value: "moto_taxi",
        label: "Moto-taxi"
    },

    {
        value: "service_auto",
        label: "Services automobiles"
    },

    {
        value: "autres",
        label: "Autres"
    }

];


/* =========================================================
   CATÉGORIES HÔTELS
========================================================= */

const HOTEL_CATEGORIES = [

    {
        value: "hotel",
        label: "Hôtel"
    },

    {
        value: "residence",
        label: "Résidence"
    },

    {
        value: "appartement",
        label: "Appartement"
    },

    {
        value: "maison_hotes",
        label: "Maison d'hôtes"
    },

    {
        value: "auberge",
        label: "Auberge"
    },

    {
        value: "lodge",
        label: "Lodge"
    },

    {
        value: "courte_duree",
        label: "Courte durée"
    },

    {
        value: "autre",
        label: "Autre"
    }

];


/* =========================================================
   TYPES
========================================================= */

const TYPES_BY_DOMAIN = {

    immobilier: [

        ["vente", "Vente"],
        ["location", "Location"]

    ],

    commerce: [

        ["produit", "Produit"],
        ["service", "Service"]

    ],

    vehicules: [

        ["vente_vehicule", "Vente de véhicule"],
        ["location", "Location"],
        ["transport", "Transport"],
        ["service_auto", "Service automobile"]

    ],

    hotels: [

        ["hebergement", "Hébergement"],
        ["location_courte_duree", "Location courte durée"]

    ],

    autres: [

        ["demande_service", "Demande de service"],
        ["recherche_produit", "Recherche de produit"],
        ["autre_demande", "Autre demande"]

    ]

};


/* =========================================================
   CHARGER LES VILLES
========================================================= */

async function loadCities() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach(
            citySnapshot => {

                const data =
                    citySnapshot.data();


                if (
                    data.active === false
                ) {

                    return;

                }


                const name =
                    String(
                        data.name || ""
                    ).trim();


                if (!name) {

                    return;

                }


                cities.push({

                    name,

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        cities.sort(
            (a, b) => {

                if (
                    a.order !== b.order
                ) {

                    return (
                        a.order -
                        b.order
                    );

                }

                return a.name.localeCompare(
                    b.name,
                    "fr"
                );

            }
        );


        searchVille.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        cities.forEach(
            city => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    city.name;

                option.textContent =
                    city.name;

                searchVille.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "CAMU RECHERCHE — villes :",
            error
        );

    }

}


/* =========================================================
   CHARGER ANNONCES
========================================================= */

async function loadAnnouncements() {

    showLoading(true);


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        allAnnouncements = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                const status =
                    normalizeText(
                        data.status
                    );


                if (
                    status
                    &&
                    status !== "active"
                    &&
                    status !== "approved"
                ) {

                    return;

                }


                allAnnouncements.push({

                    id:
                        documentSnapshot.id,

                    ...data

                });

            }
        );


        filteredAnnouncements =
            [...allAnnouncements];


        sortResults();


        renderResults();


    } catch (error) {

        console.error(
            "CAMU RECHERCHE — annonces :",
            error
        );


        searchResultInfo.textContent =
            "Impossible de charger les annonces.";

        searchProducts.innerHTML = "";

        searchEmpty.classList.remove(
            "hidden"
        );

    } finally {

        showLoading(false);

    }

}


/* =========================================================
   DOMAINE CHANGE
========================================================= */

searchDomain.addEventListener(
    "change",
    () => {

        updateCategories();

        updateTypes();

        performSearch();

    }
);


/* =========================================================
   CATÉGORIES
========================================================= */

function updateCategories() {

    const domain =
        searchDomain.value;


    searchCategory.innerHTML = `
        <option value="">
            Toutes les catégories
        </option>
    `;


    let categories = [];


    if (
        domain ===
        "immobilier"
    ) {

        categories =
            IMMOBILIER_CATEGORIES;

    }

    else if (
        domain ===
        "commerce"
    ) {

        categories =
            COMMERCE_CATEGORIES;

    }

    else if (
        domain ===
        "vehicules"
    ) {

        categories =
            VEHICLE_CATEGORIES;

    }

    else if (
        domain ===
        "hotels"
    ) {

        categories =
            HOTEL_CATEGORIES;

    }


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.value;


            option.textContent =
                category.label;


            searchCategory.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   TYPES
========================================================= */

function updateTypes() {

    const domain =
        searchDomain.value;


    searchType.innerHTML = `
        <option value="">
            Tous les types
        </option>
    `;


    const types =
        TYPES_BY_DOMAIN[domain]
        || [];


    types.forEach(
        type => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                type[0];


            option.textContent =
                type[1];


            searchType.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   FORM SUBMIT
========================================================= */

searchForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        performSearch();

    }
);


/* =========================================================
   RECHERCHE AUTOMATIQUE
========================================================= */

let searchTimer = null;


searchKeyword.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        searchTimer =
            setTimeout(
                performSearch,
                300
            );

    }
);


searchCommune.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        searchTimer =
            setTimeout(
                performSearch,
                300
            );

    }
);


/* =========================================================
   SELECTS
========================================================= */

[
    searchCategory,
    searchVille,
    searchType,
    searchMinPrice,
    searchMaxPrice
].forEach(
    element => {

        element.addEventListener(
            "change",
            performSearch
        );

    }
);


/* =========================================================
   RECHERCHE
========================================================= */

function performSearch() {

    const keyword =
        normalizeText(
            searchKeyword.value
        );


    const domain =
        normalizeText(
            searchDomain.value
        );


    const category =
        normalizeText(
            searchCategory.value
        );


    const ville =
        normalizeText(
            searchVille.value
        );


    const commune =
        normalizeText(
            searchCommune.value
        );


    const type =
        normalizeText(
            searchType.value
        );


    const minPrice =
        Number(
            searchMinPrice.value
        );


    const maxPrice =
        Number(
            searchMaxPrice.value
        );


    filteredAnnouncements =
        allAnnouncements.filter(
            announcement => {


                /* =========================================
                   TEXTE GLOBAL
                ========================================== */

                const searchableText =
                    normalizeText(
                        [
                            announcement.title,
                            announcement.description,
                            announcement.category,
                            announcement.commerceCategory,
                            announcement.propertyType,
                            announcement.vehicleType,
                            announcement.marque,
                            announcement.modele,
                            announcement.hotelType,
                            announcement.publicationType,
                            announcement.transactionType,
                            announcement.vehiclePublicationType,
                            announcement.requestType,
                            announcement.city,
                            announcement.commune,
                            announcement.neighborhood,
                            announcement.ownerName
                        ]
                        .filter(Boolean)
                        .join(" ")
                    );


                if (
                    keyword
                    &&
                    !searchableText.includes(
                        keyword
                    )
                ) {

                    return false;

                }


                /* =========================================
                   DOMAINE
                ========================================== */

                if (
                    domain
                    &&
                    !matchesDomain(
                        announcement,
                        domain
                    )
                ) {

                    return false;

                }


                /* =========================================
                   CATÉGORIE
                ========================================== */

                if (
                    category
                    &&
                    !matchesCategory(
                        announcement,
                        category
                    )
                ) {

                    return false;

                }


                /* =========================================
                   VILLE
                ========================================== */

                if (
                    ville
                    &&
                    normalizeText(
                        announcement.city
                    )
                    !== ville
                ) {

                    return false;

                }


                /* =========================================
                   COMMUNE
                ========================================== */

                if (
                    commune
                    &&
                    !normalizeText(
                        announcement.commune
                    )
                    .includes(
                        commune
                    )
                ) {

                    return false;

                }


                /* =========================================
                   TYPE
                ========================================== */

                if (
                    type
                    &&
                    !matchesType(
                        announcement,
                        type
                    )
                ) {

                    return false;

                }


                /* =========================================
                   PRIX
                ========================================== */

                const price =
                    getPrice(
                        announcement
                    );


                if (
                    Number.isFinite(
                        minPrice
                    )
                    &&
                    minPrice > 0
                    &&
                    price < minPrice
                ) {

                    return false;

                }


                if (
                    Number.isFinite(
                        maxPrice
                    )
                    &&
                    maxPrice > 0
                    &&
                    price > maxPrice
                ) {

                    return false;

                }


                return true;

            }
        );


    sortResults();

    renderResults();

}


/* =========================================================
   DOMAINE
========================================================= */

function matchesDomain(
    announcement,
    domain
) {

    const accountType =
        normalizeText(
            announcement.accountType
        );


    const category =
        normalizeText(
            announcement.category
        );


    const text =
        normalizeText(
            [
                announcement.title,
                announcement.description,
                announcement.typeVehicule,
                announcement.vehicleType,
                announcement.hotelType,
                announcement.propertyType
            ]
            .filter(Boolean)
            .join(" ")
        );


    if (
        accountType === domain
    ) {

        return true;

    }


    if (
        domain === "immobilier"
    ) {

        return (
            category.includes("immobilier")
            ||
            text.includes("maison")
            ||
            text.includes("appartement")
            ||
            text.includes("terrain")
            ||
            text.includes("immobilier")
        );

    }


    if (
        domain === "commerce"
    ) {

        return (
            category.includes("commerce")
            ||
            Boolean(
                announcement.commerceCategory
            )
        );

    }


    if (
        domain === "vehicules"
    ) {

        return (
            category.includes("vehicule")
            ||
            category.includes("transport")
            ||
            Boolean(
                announcement.vehicleType
            )
            ||
            Boolean(
                announcement.marque
            )
        );

    }


    if (
        domain === "hotels"
    ) {

        return (
            category.includes("hotel")
            ||
            category.includes("hebergement")
            ||
            Boolean(
                announcement.hotelType
            )
        );

    }


    if (
        domain === "autres"
    ) {

        return (
            accountType === ""
            ||
            ![
                "immobilier",
                "commerce",
                "vehicules",
                "hotels"
            ].includes(
                accountType
            )
        );

    }


    return false;

}


/* =========================================================
   CATÉGORIE
========================================================= */

function matchesCategory(
    announcement,
    category
) {

    const values = [

        announcement.commerceCategory,

        announcement.propertyType,

        announcement.vehiclePublicationType,

        announcement.vehicleType,

        announcement.hotelType,

        announcement.category,

        announcement.publicationType,

        announcement.transactionType

    ]
    .filter(Boolean)
    .map(normalizeText);


    return values.some(
        value =>
            value === category
            ||
            value.includes(category)
            ||
            category.includes(value)
    );

}


/* =========================================================
   TYPE
========================================================= */

function matchesType(
    announcement,
    type
) {

    const values = [

        announcement.publicationType,

        announcement.transactionType,

        announcement.vehiclePublicationType,

        announcement.requestType

    ]
    .filter(Boolean)
    .map(normalizeText);


    return values.some(
        value =>
            value === type
            ||
            value.includes(type)
            ||
            type.includes(value)
    );

}


/* =========================================================
   PRIX
========================================================= */

function getPrice(
    announcement
) {

    const price =
        Number(
            announcement.price
        );


    if (
        Number.isFinite(price)
    ) {

        return price;

    }


    return 0;

}


/* =========================================================
   TRI
========================================================= */

searchSort.addEventListener(
    "change",
    () => {

        sortResults();

        renderResults();

    }
);


function sortResults() {

    const sort =
        searchSort.value;


    if (
        sort === "priceAsc"
    ) {

        filteredAnnouncements.sort(
            (a, b) =>
                getPrice(a)
                -
                getPrice(b)
        );

        return;

    }


    if (
        sort === "priceDesc"
    ) {

        filteredAnnouncements.sort(
            (a, b) =>
                getPrice(b)
                -
                getPrice(a)
        );

        return;

    }


    if (
        sort === "title"
    ) {

        filteredAnnouncements.sort(
            (a, b) =>
                String(
                    a.title || ""
                )
                .localeCompare(
                    String(
                        b.title || ""
                    ),
                    "fr"
                )
        );

        return;

    }


    filteredAnnouncements.sort(
        (a, b) =>
            getTimestamp(
                b.createdAt
            )
            -
            getTimestamp(
                a.createdAt
            )
    );

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestamp(
    value
) {

    if (
        !value
    ) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        value.seconds
    ) {

        return (
            Number(
                value.seconds
            ) * 1000
        );

    }


    const date =
        new Date(value);


    const time =
        date.getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


/* =========================================================
   AFFICHAGE
========================================================= */

function renderResults() {

    searchProducts.innerHTML = "";


    const count =
        filteredAnnouncements.length;


    searchResultInfo.textContent =
        `${count} annonce${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}.`;


    if (
        count === 0
    ) {

        searchEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    searchEmpty.classList.add(
        "hidden"
    );


    filteredAnnouncements.forEach(
        announcement => {

            searchProducts.appendChild(
                createAnnouncementCard(
                    announcement
                )
            );

        }
    );

}


/* =========================================================
   CARD
========================================================= */

function createAnnouncementCard(
    announcement
) {

    const card =
        document.createElement(
            "a"
        );


    card.className =
        "search-product-card";


    card.href =
        `explorer.html?id=${encodeURIComponent(
            announcement.id
        )}`;


    const image =
        getFirstImage(
            announcement
        );


    const title =
        escapeHtml(
            announcement.title
            ||
            "Annonce sans titre"
        );


    const price =
        formatPrice(
            announcement
        );


    const city =
        escapeHtml(
            cleanValue(
                announcement.city
            )
            ||
            "Ville non indiquée"
        );


    const commune =
        escapeHtml(
            cleanValue(
                announcement.commune
            )
        );


    const owner =
        escapeHtml(
            cleanValue(
                announcement.ownerName
            )
            ||
            "Utilisateur"
        );


    const badge =
        escapeHtml(
            getDomainLabel(
                announcement
            )
        );


    let imageHTML = `

        <div class="search-product-image">

            <div class="search-product-image-placeholder">

                <i class="fa-solid fa-image"></i>

            </div>

            <span class="search-product-badge">
                ${badge}
            </span>

        </div>

    `;


    if (
        image
    ) {

        imageHTML = `

            <div class="search-product-image">

                <img
                    src="${escapeHtml(image)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="search-product-image-placeholder"
                    style="display:none;"
                >

                    <i class="fa-solid fa-image"></i>

                </div>

                <span class="search-product-badge">
                    ${badge}
                </span>

            </div>

        `;

    }


    card.innerHTML = `

        ${imageHTML}


        <div class="search-product-body">

            <h3 class="search-product-title">
                ${title}
            </h3>


            <div class="search-product-price">
                ${price}
            </div>


            <div class="search-product-meta">

                <span>

                    <i class="fa-solid fa-location-dot"></i>

                    ${city}

                </span>


                ${
                    commune
                    ?
                    `
                    <span>

                        <i class="fa-solid fa-map-pin"></i>

                        ${commune}

                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="search-product-footer">

                <span class="search-product-owner">

                    ${owner}

                </span>


                <span class="search-product-arrow">

                    <i class="fa-solid fa-arrow-right"></i>

                </span>

            </div>

        </div>

    `;


    return card;

}


/* =========================================================
   IMAGE
========================================================= */

function getFirstImage(
    announcement
) {

    if (
        Array.isArray(
            announcement.images
        )
    ) {

        return (
            announcement.images[0]
            ||
            announcement.imageURL
            ||
            ""
        );

    }


    if (
        typeof announcement.images ===
        "string"
    ) {

        const value =
            announcement.images.trim();


        if (
            value.startsWith("[")
        ) {

            try {

                const parsed =
                    JSON.parse(value);


                if (
                    Array.isArray(parsed)
                ) {

                    return (
                        parsed[0]
                        ||
                        announcement.imageURL
                        ||
                        ""
                    );

                }

            } catch {

                /* Rien */

            }

        }


        if (
            value.startsWith("http")
        ) {

            return value;

        }

    }


    return (
        announcement.imageURL
        ||
        announcement.imageUrl
        ||
        announcement.image
        ||
        announcement.photoURL
        ||
        ""
    );

}


/* =========================================================
   LABEL DOMAINE
========================================================= */

function getDomainLabel(
    announcement
) {

    const domain =
        normalizeText(
            announcement.accountType
        );


    if (
        domain === "immobilier"
    ) {

        return "IMMOBILIER";

    }


    if (
        domain === "commerce"
    ) {

        return "COMMERCE";

    }


    if (
        domain === "vehicules"
    ) {

        return "VÉHICULES";

    }


    if (
        domain === "hotels"
    ) {

        return "HÔTELS";

    }


    const category =
        normalizeText(
            announcement.category
        );


    if (
        category.includes("immobilier")
    ) {

        return "IMMOBILIER";

    }


    if (
        category.includes("commerce")
    ) {

        return "COMMERCE";

    }


    if (
        category.includes("vehicule")
        ||
        category.includes("transport")
    ) {

        return "VÉHICULES";

    }


    if (
        category.includes("hotel")
        ||
        category.includes("hebergement")
    ) {

        return "HÔTELS";

    }


    return "CAMU SERVICES";

}


/* =========================================================
   PRIX
========================================================= */

function formatPrice(
    announcement
) {

    const price =
        getPrice(
            announcement
        );


    if (
        price <= 0
    ) {

        return "Prix sur demande";

    }


    const currency =
        String(
            announcement.currency
            ||
            "USD"
        )
        .trim()
        .toUpperCase();


    return `${formatNumber(price)} ${escapeHtml(currency)}`;

}


function formatNumber(
    number
) {

    return new Intl.NumberFormat(
        "fr-FR"
    ).format(number);

}


/* =========================================================
   NETTOYAGE
========================================================= */

function cleanValue(
    value
) {

    return String(
        value || ""
    ).trim();

}


function normalizeText(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value || ""
    )
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


/* =========================================================
   RESET
========================================================= */

searchReset.addEventListener(
    "click",
    () => {

        searchForm.reset();

        updateCategories();

        updateTypes();

        filteredAnnouncements =
            [...allAnnouncements];

        sortResults();

        renderResults();

    }
);


/* =========================================================
   LOADING
========================================================= */

function showLoading(
    loading
) {

    if (loading) {

        searchLoading.classList.remove(
            "hidden"
        );

        searchProducts.innerHTML = "";

        searchEmpty.classList.add(
            "hidden"
        );

        searchSubmit.disabled =
            true;

    } else {

        searchLoading.classList.add(
            "hidden"
        );

        searchSubmit.disabled =
            false;

    }

}


/* =========================================================
   INITIALISATION
========================================================= */

async function init() {

    console.log(
        "CAMU RECHERCHE — initialisation..."
    );


    updateCategories();

    updateTypes();


    await loadCities();

    await loadAnnouncements();


    console.log(
        `CAMU RECHERCHE — ${allAnnouncements.length} annonce(s) chargée(s).`
    );

}


init();

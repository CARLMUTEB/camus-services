/* =========================================================
   CAMU SERVICES — SPACE SERVICES
   Fichier : js/services.js

   Fonctionnalités :
   - Chargement Firestore
   - Recherche
   - Filtre catégorie
   - Filtre ville
   - Catégories populaires
   - Favoris
   - Compteur
   - Cartes services
   - État vide
========================================================= */

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

let db = null;

try {

    if (!getApps().length) {
        throw new Error(
            "Firebase n'est pas initialisé par app.js."
        );
    }

    const app = getApp();

    db = getFirestore(app);

} catch (error) {

    console.error(
        "SERVICES — Initialisation Firebase :",
        error
    );

}


/* =========================================================
   DOM
========================================================= */

const keywordInput =
    document.getElementById(
        "serviceKeyword"
    );

const categorySelect =
    document.getElementById(
        "serviceCategory"
    );

const citySelect =
    document.getElementById(
        "serviceCity"
    );

const searchButton =
    document.getElementById(
        "serviceSearchButton"
    );

const categoriesContainer =
    document.getElementById(
        "serviceCategories"
    );

const servicesLoading =
    document.getElementById(
        "servicesLoading"
    );

const servicesList =
    document.getElementById(
        "servicesList"
    );

const servicesCount =
    document.getElementById(
        "servicesCount"
    );

const servicesEmpty =
    document.getElementById(
        "servicesEmpty"
    );


/* =========================================================
   VARIABLES
========================================================= */

let allServices = [];

let filteredServices = [];

const FAVORITES_KEY =
    "camu_services_favorites";


/* =========================================================
   ICONES CATÉGORIES
========================================================= */

const CATEGORY_ICONS = {

    plomberie:
        "fa-solid fa-faucet-drip",

    electricite:
        "fa-solid fa-bolt",

    maconnerie:
        "fa-solid fa-trowel-bricks",

    climatisation:
        "fa-solid fa-snowflake",

    informatique:
        "fa-solid fa-laptop",

    mecanique:
        "fa-solid fa-wrench",

    transport:
        "fa-solid fa-truck",

    nettoyage:
        "fa-solid fa-broom",

    beaute:
        "fa-solid fa-scissors",

    coiffure:
        "fa-solid fa-scissors",

    photographie:
        "fa-solid fa-camera",

    design:
        "fa-solid fa-pen-nib",

    formation:
        "fa-solid fa-graduation-cap",

    topographie:
        "fa-solid fa-map-location-dot",

    marketing:
        "fa-solid fa-bullhorn",

    commerce:
        "fa-solid fa-store",

    construction:
        "fa-solid fa-house-chimney",

    securite:
        "fa-solid fa-shield-halved",

    sante:
        "fa-solid fa-heart-pulse",

    professionnel:
        "fa-solid fa-user-tie",

    autres:
        "fa-solid fa-layer-group"

};


/* =========================================================
   UTILITAIRES
========================================================= */

function normalizeText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function firstValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }

    }

    return "";

}


/* =========================================================
   DATE
========================================================= */

function getDateValue(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "number") {

        const date = new Date(value);

        return isNaN(date.getTime())
            ? null
            : date;

    }

    if (typeof value === "string") {

        const date = new Date(value);

        return isNaN(date.getTime())
            ? null
            : date;

    }

    return null;

}


function getTimestamp(value) {

    const date =
        getDateValue(value);

    return date
        ? date.getTime()
        : 0;

}


function formatDate(value) {

    const date =
        getDateValue(value);

    if (!date) {
        return "Date non précisée";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* =========================================================
   EXTRACTION DES CHAMPS
========================================================= */

function getTitle(service) {

    return firstValue(
        service.title,
        service.name,
        service.serviceName,
        "Service non précisé"
    );

}


function getCategory(service) {

    return firstValue(
        service.category,
        service.categoryName,
        service.categorie,
        service.serviceCategory,
        "Autres"
    );

}


function getDescription(service) {

    return firstValue(
        service.description,
        service.details,
        service.content,
        service.resume,
        "Aucune description disponible."
    );

}


function getCity(service) {

    return firstValue(
        service.city,
        service.ville,
        service.location,
        service.localisation,
        "Ville non précisée"
    );

}


function getProviderName(service) {

    return firstValue(
        service.providerName,
        service.provider,
        service.prestataire,
        service.nameProvider,
        service.ownerName,
        service.company,
        service.entreprise,
        "Prestataire"
    );

}


function getProviderImage(service) {

    return firstValue(
        service.providerImage,
        service.providerPhoto,
        service.avatar,
        service.profileImage,
        service.providerAvatar
    );

}


function getServiceImage(service) {

    return firstValue(
        service.image,
        service.imageUrl,
        service.photo,
        service.cover,
        service.coverImage
    );

}


function getPhone(service) {

    return firstValue(
        service.phone,
        service.telephone,
        service.mobile
    );

}


/* =========================================================
   PRIX
========================================================= */

function formatPrice(service) {

    const directPrice =
        firstValue(
            service.price,
            service.prix
        );

    const priceType =
        firstValue(
            service.priceType,
            service.typePrix
        );

    const currency =
        firstValue(
            service.currency,
            service.devise,
            "USD"
        );


    if (directPrice) {

        let result =
            `${directPrice} ${currency}`;

        if (priceType) {

            const normalized =
                normalizeText(
                    priceType
                );

            if (
                normalized === "heure" ||
                normalized === "par heure"
            ) {
                result += " / h";
            }

            if (
                normalized === "jour" ||
                normalized === "par jour"
            ) {
                result += " / jour";
            }

            if (
                normalized === "mois" ||
                normalized === "par mois"
            ) {
                result += " / mois";
            }

        }

        return result;

    }


    const min =
        firstValue(
            service.priceMin,
            service.prixMin
        );

    const max =
        firstValue(
            service.priceMax,
            service.prixMax
        );


    if (min && max) {

        return `${min} - ${max} ${currency}`;

    }


    if (min) {

        return `À partir de ${min} ${currency}`;

    }


    if (max) {

        return `Jusqu'à ${max} ${currency}`;

    }


    return "Prix à négocier";

}


/* =========================================================
   STATUT
========================================================= */

function isActiveService(service) {

    const status =
        normalizeText(
            service.status
        );

    if (!status) {
        return true;
    }

    return [
        "active",
        "actif",
        "published",
        "publie",
        "publiee",
        "public",
        "visible",
        "valide"
    ].includes(status);

}


/* =========================================================
   FAVORIS
========================================================= */

function getFavorites() {

    try {

        const value =
            localStorage.getItem(
                FAVORITES_KEY
            );

        if (!value) {
            return [];
        }

        const parsed =
            JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.warn(
            "SERVICES — Lecture favoris impossible :",
            error
        );

        return [];

    }

}


function saveFavorites(
    favorites
) {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );

}


function isFavorite(
    serviceId
) {

    return getFavorites().includes(
        serviceId
    );

}


function toggleFavorite(
    serviceId
) {

    const favorites =
        getFavorites();

    const index =
        favorites.indexOf(
            serviceId
        );


    if (index >= 0) {

        favorites.splice(
            index,
            1
        );

    } else {

        favorites.push(
            serviceId
        );

    }


    saveFavorites(
        favorites
    );


    renderServices(
        filteredServices
    );

}


/* =========================================================
   VILLE
========================================================= */

function populateCities() {

    if (!citySelect) {
        return;
    }


    const currentValue =
        citySelect.value;


    const cities = [
        ...new Set(
            allServices
                .map(
                    service =>
                        getCity(service)
                )
                .filter(
                    city =>
                        city &&
                        normalizeText(city) !==
                        "ville non precisee"
                )
                .map(
                    city =>
                        String(city).trim()
                )
        )
    ];


    cities.sort(
        (a, b) =>
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


    cities.forEach(
        city => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                city;

            option.textContent =
                city;

            citySelect.appendChild(
                option
            );

        }
    );


    if (
        cities.includes(
            currentValue
        )
    ) {
        citySelect.value =
            currentValue;
    }

}


/* =========================================================
   CATÉGORIES POPULAIRES
========================================================= */

function getCategoryIcon(
    category
) {

    const normalized =
        normalizeText(
            category
        )
        .replace(/\s+/g, "-");


    if (
        CATEGORY_ICONS[
            normalized
        ]
    ) {
        return CATEGORY_ICONS[
            normalized
        ];
    }


    for (
        const key of Object.keys(
            CATEGORY_ICONS
        )
    ) {

        if (
            normalized.includes(
                key
            )
        ) {

            return CATEGORY_ICONS[
                key
            ];

        }

    }


    return "fa-solid fa-screwdriver-wrench";

}


function renderCategories() {

    if (!categoriesContainer) {
        return;
    }


    const counts =
        new Map();


    allServices.forEach(
        service => {

            const category =
                getCategory(service);


            const key =
                normalizeText(
                    category
                );


            if (!key) {
                return;
            }


            if (
                !counts.has(key)
            ) {

                counts.set(
                    key,
                    {
                        name: category,
                        count: 0
                    }
                );

            }


            counts.get(
                key
            ).count++;

        }
    );


    const categories =
        Array.from(
            counts.values()
        )
        .sort(
            (a, b) =>
                b.count - a.count
        )
        .slice(0, 8);


    if (!categories.length) {

        categoriesContainer.innerHTML = `
            <div class="services-loading">

                <i class="fa-solid fa-screwdriver-wrench"></i>

                Aucun service disponible

            </div>
        `;

        return;

    }


    categoriesContainer.innerHTML = "";


    categories.forEach(
        category => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "services-category-card";


            card.dataset.category =
                category.name;


            const icon =
                getCategoryIcon(
                    category.name
                );


            card.innerHTML = `

                <div class="services-category-icon">

                    <i class="${icon}"></i>

                </div>


                <h3>
                    ${escapeHtml(
                        category.name
                    )}
                </h3>


                <p>
                    ${category.count}
                    service${
                        category.count > 1
                            ? "s"
                            : ""
                    }
                </p>

            `;


            card.addEventListener(
                "click",
                () => {

                    if (categorySelect) {

                        categorySelect.value =
                            findCategoryValue(
                                category.name
                            );

                    }

                    applyFilters();

                    document
                        .getElementById(
                            "servicesList"
                        )
                        ?.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                }
            );


            categoriesContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   TROUVER VALEUR CATÉGORIE SELECT
========================================================= */

function findCategoryValue(
    categoryName
) {

    if (!categorySelect) {
        return "";
    }


    const target =
        normalizeText(
            categoryName
        );


    const options =
        Array.from(
            categorySelect.options
        );


    const exact =
        options.find(
            option =>
                normalizeText(
                    option.value
                ) === target ||
                normalizeText(
                    option.textContent
                ) === target
        );


    if (exact) {
        return exact.value;
    }


    const partial =
        options.find(
            option =>
                target.includes(
                    normalizeText(
                        option.value
                    )
                ) ||
                normalizeText(
                    option.textContent
                ).includes(target)
        );


    return partial
        ? partial.value
        : "";
}


/* =========================================================
   CHARGER SERVICES
========================================================= */

async function loadServices() {

    if (!db) {

        showError(
            "Firebase n'est pas disponible."
        );

        return;

    }


    showLoading(
        true
    );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "services"
                )
            );


        allServices = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                allServices.push({

                    id:
                        documentSnapshot.id,

                    ...data

                });

            }
        );


        /*
         * Ne garder que les services visibles.
         */

        allServices =
            allServices.filter(
                service =>
                    isActiveService(
                        service
                    )
            );


        /*
         * Plus récents en premier.
         */

        allServices.sort(
            (a, b) => {

                const dateB =
                    getTimestamp(
                        firstValue(
                            b.createdAt,
                            b.updatedAt,
                            b.date
                        )
                    );


                const dateA =
                    getTimestamp(
                        firstValue(
                            a.createdAt,
                            a.updatedAt,
                            a.date
                        )
                    );


                return dateB - dateA;

            }
        );


        populateCities();

        renderCategories();

        filteredServices =
            [...allServices];

        applyFilters();


        console.log(
            "SERVICES — Services chargés :",
            allServices
        );


    } catch (error) {

        console.error(
            "SERVICES — Erreur chargement :",
            error
        );


        showError(
            "Impossible de charger les services pour le moment."
        );


    } finally {

        showLoading(
            false
        );

    }

}


/* =========================================================
   FILTRES
========================================================= */

function applyFilters() {

    const keyword =
        normalizeText(
            keywordInput?.value
        );


    const category =
        normalizeText(
            categorySelect?.value
        );


    const city =
        normalizeText(
            citySelect?.value
        );


    filteredServices =
        allServices.filter(
            service => {

                /*
                 * MOT-CLÉ
                 */

                if (keyword) {

                    const skills =
                        Array.isArray(
                            service.skills
                        )
                            ? service.skills.join(" ")
                            : firstValue(
                                service.skills,
                                service.competences
                            );


                    const content =
                        normalizeText(
                            [
                                getTitle(service),
                                getCategory(service),
                                getDescription(service),
                                getProviderName(service),
                                getCity(service),
                                service.phone,
                                skills
                            ].join(" ")
                        );


                    if (
                        !content.includes(
                            keyword
                        )
                    ) {

                        return false;

                    }

                }


                /*
                 * CATÉGORIE
                 */

                if (category) {

                    const serviceCategory =
                        normalizeText(
                            getCategory(
                                service
                            )
                        );


                    if (
                        !serviceCategory.includes(
                            category
                        ) &&
                        !category.includes(
                            serviceCategory
                        )
                    ) {

                        return false;

                    }

                }


                /*
                 * VILLE
                 */

                if (city) {

                    if (
                        normalizeText(
                            getCity(
                                service
                            )
                        ) !== city
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderServices(
        filteredServices
    );

}


/* =========================================================
   RENDU SERVICES
========================================================= */

function renderServices(
    services
) {

    if (!servicesList) {
        return;
    }


    servicesList.innerHTML =
        "";


    updateCount(
        services.length
    );


    if (!services.length) {

        showEmpty(
            true
        );

        return;

    }


    showEmpty(
        false
    );


    services.forEach(
        service => {

            const card =
                createServiceCard(
                    service
                );


            servicesList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CARTE SERVICE
========================================================= */

function createServiceCard(
    service
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "service-card";


    article.dataset.serviceId =
        service.id;


    const title =
        getTitle(
            service
        );


    const category =
        getCategory(
            service
        );


    const description =
        getDescription(
            service
        );


    const city =
        getCity(
            service
        );


    const provider =
        getProviderName(
            service
        );


    const providerImage =
        getProviderImage(
            service
        );


    const serviceImage =
        getServiceImage(
            service
        );


    const price =
        formatPrice(
            service
        );


    const favorite =
        isFavorite(
            service.id
        );


    const date =
        firstValue(
            service.createdAt,
            service.updatedAt,
            service.date
        );


    /* -------------------------------------------------------
       IMAGE
    ------------------------------------------------------- */

    let imageHtml;


    if (serviceImage) {

        imageHtml = `

            <div class="service-card-image">

                <img
                    src="${escapeHtml(
                        serviceImage
                    )}"
                    alt="${escapeHtml(
                        title
                    )}"
                    loading="lazy"
                >

            </div>

        `;

    } else {

        imageHtml = `

            <div class="service-card-image">

                <div
                    class="service-card-image-placeholder"
                >

                    <i class="${
                        getCategoryIcon(
                            category
                        )
                    }"></i>

                </div>

            </div>

        `;

    }


    /* -------------------------------------------------------
       AVATAR
    ------------------------------------------------------- */

    let avatarHtml;


    if (providerImage) {

        avatarHtml = `

            <div class="service-provider-avatar">

                <img
                    src="${escapeHtml(
                        providerImage
                    )}"
                    alt="${escapeHtml(
                        provider
                    )}"
                    loading="lazy"
                >

            </div>

        `;

    } else {

        avatarHtml = `

            <div class="service-provider-avatar">

                <i class="fa-solid fa-user"></i>

            </div>

        `;

    }


    /* -------------------------------------------------------
       HTML
    ------------------------------------------------------- */

    article.innerHTML = `

        ${imageHtml}


        <button
            type="button"
            class="service-favorite ${
                favorite
                    ? "active"
                    : ""
            }"
            data-service-id="${escapeHtml(
                service.id
            )}"
            aria-label="${
                favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
            }"
            title="${
                favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
            }"
        >

            <i class="${
                favorite
                    ? "fa-solid fa-heart"
                    : "fa-regular fa-heart"
            }"></i>

        </button>


        <div class="service-card-content">


            <span class="service-card-category">

                ${escapeHtml(
                    category
                )}

            </span>


            <h3>

                ${escapeHtml(
                    title
                )}

            </h3>


            <p class="service-card-description">

                ${escapeHtml(
                    description
                )}

            </p>


            <div class="service-provider">

                ${avatarHtml}


                <div class="service-provider-info">

                    <span class="service-provider-name">

                        ${escapeHtml(
                            provider
                        )}

                    </span>


                    <span class="service-provider-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(
                            city
                        )}

                    </span>

                </div>

            </div>


            <div class="service-meta">

                <span class="service-meta-item">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(
                        city
                    )}

                </span>


                <span class="service-meta-item">

                    <i class="fa-regular fa-clock"></i>

                    ${escapeHtml(
                        formatDate(
                            date
                        )
                    )}

                </span>

            </div>


            <div class="service-card-footer">


                <div class="service-price">

                    <span class="service-price-label">

                        Tarif

                    </span>


                    <span class="service-price-value">

                        ${escapeHtml(
                            price
                        )}

                    </span>

                </div>


                <a
                    href="service-details.html?id=${encodeURIComponent(
                        service.id
                    )}"
                    class="service-view-button"
                >

                    Voir

                    <i class="fa-solid fa-arrow-right"></i>

                </a>

            </div>

        </div>

    `;


    /* -------------------------------------------------------
       FAVORI
    ------------------------------------------------------- */

    const favoriteButton =
        article.querySelector(
            ".service-favorite"
        );


    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                toggleFavorite(
                    service.id
                );

            }
        );

    }


    /* -------------------------------------------------------
       ERREUR IMAGE
    ------------------------------------------------------- */

    const serviceImageElement =
        article.querySelector(
            ".service-card-image img"
        );


    if (serviceImageElement) {

        serviceImageElement.addEventListener(
            "error",
            () => {

                const parent =
                    serviceImageElement.parentElement;


                if (!parent) {
                    return;
                }


                parent.innerHTML = `

                    <div
                        class="service-card-image-placeholder"
                    >

                        <i class="${
                            getCategoryIcon(
                                category
                            )
                        }"></i>

                    </div>

                `;

            }
        );

    }


    return article;

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateCount(
    count
) {

    if (!servicesCount) {
        return;
    }


    servicesCount.textContent =
        `${count} service${
            count > 1
                ? "s"
                : ""
        }`;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
    show
) {

    if (!servicesLoading) {
        return;
    }


    servicesLoading.style.display =
        show
            ? "flex"
            : "none";


    if (show) {

        if (servicesList) {
            servicesList.innerHTML = "";
        }

        if (servicesEmpty) {
            servicesEmpty.style.display =
                "none";
        }

    }

}


/* =========================================================
   EMPTY
========================================================= */

function showEmpty(
    show
) {

    if (!servicesEmpty) {
        return;
    }


    servicesEmpty.style.display =
        show
            ? "block"
            : "none";

}


/* =========================================================
   ERREUR
========================================================= */

function showError(
    message
) {

    showLoading(
        false
    );


    if (servicesEmpty) {
        servicesEmpty.style.display =
            "none";
    }


    if (servicesList) {

        servicesList.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:35px;
                    border:1px solid #e2e7ee;
                    border-radius:14px;
                    background:#fff;
                    text-align:center;
                    color:#667085;
                "
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="
                        display:block;
                        margin-bottom:12px;
                        color:#d92d20;
                        font-size:30px;
                    "
                ></i>


                <strong
                    style="
                        display:block;
                        margin-bottom:7px;
                        color:#063b73;
                    "
                >
                    Impossible de charger les services
                </strong>


                <span>
                    ${escapeHtml(
                        message
                    )}
                </span>

            </div>

        `;

    }


    updateCount(
        0
    );

}


/* =========================================================
   ÉVÉNEMENTS
========================================================= */

if (keywordInput) {

    keywordInput.addEventListener(
        "input",
        applyFilters
    );

}


if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        applyFilters
    );

}


if (citySelect) {

    citySelect.addEventListener(
        "change",
        applyFilters
    );

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        applyFilters
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

function initServices() {

    loadServices();

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initServices
    );

} else {

    initServices();

}

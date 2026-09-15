// =========================================================
// CAMU IMMO — IMMOBILIER.JS
// ESPACE IMMOBILIER
// =========================================================


import { db } from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const adsContainer =
    document.getElementById("immoAds");

const citySelect =
    document.getElementById("immoCity");

const searchForm =
    document.getElementById("immoSearchForm");

const keywordInput =
    document.getElementById("immoKeyword");

const typeSelect =
    document.getElementById("immoType");

const menuButton =
    document.getElementById("immoMenuButton");

const mobileNav =
    document.getElementById("immoMobileNav");


// =========================================================
// DONNEES
// =========================================================

let allAds = [];


// =========================================================
// MENU MOBILE
// =========================================================

if (menuButton && mobileNav) {

    menuButton.addEventListener(
        "click",
        () => {

            mobileNav.classList.toggle(
                "open"
            );

        }
    );


    mobileNav
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    mobileNav.classList.remove(
                        "open"
                    );

                }
            );

        });

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// NORMALISER
// =========================================================

function normalizeText(value) {

    return String(
        value || ""
    )

        .toLowerCase()

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .trim();

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


    const number =
        Number(price);


    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            price
        );

    }


    const formatted =
        new Intl.NumberFormat(
            "fr-FR",
            {
                maximumFractionDigits: 0
            }
        ).format(number);


    if (
        currency === "USD" ||
        currency === "$"
    ) {

        return `${formatted} $`;

    }


    if (
        currency === "CDF" ||
        currency === "FC"
    ) {

        return `${formatted} FC`;

    }


    return `${formatted} ${escapeHtml(currency)}`;

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


    if (ad.imageUrl) {

        return ad.imageUrl;

    }


    if (ad.image) {

        return ad.image;

    }


    return "assets/logo/camu-services-logo.png";

}


// =========================================================
// VERIFIER CATEGORIE IMMOBILIER
// =========================================================

function isImmobilier(ad) {

    const category =
        normalizeText(
            ad.category
        );


    const title =
        normalizeText(
            ad.title
        );


    const description =
        normalizeText(
            ad.description
        );


    return (

        category === "immobilier" ||

        category.includes(
            "immobilier"
        ) ||

        category === "immo" ||

        title.includes("maison") ||

        title.includes("appartement") ||

        title.includes("terrain") ||

        title.includes("villa") ||

        title.includes("parcelle") ||

        description.includes(
            "immobilier"
        )

    );

}


// =========================================================
// CHARGER VILLES
// =========================================================

async function loadCities() {

    if (!citySelect) {

        return;

    }


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
            document => {

                const data =
                    document.data();


                if (
                    data.active === true
                ) {

                    cities.push({

                        id:
                            document.id,

                        name:
                            data.name || "",

                        order:
                            Number(
                                data.order
                            ) || 999

                    });

                }

            }
        );


        cities.sort(
            (a, b) => {

                if (
                    a.order !==
                    b.order
                ) {

                    return (
                        a.order -
                        b.order
                    );

                }


                return a.name.localeCompare(
                    b.name,
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
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
                    city.id;


                option.textContent =
                    city.name;


                citySelect.appendChild(
                    option
                );

            }
        );


        console.log(
            "CAMU IMMO — villes :",
            cities.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur villes :",
            error
        );

    }

}


// =========================================================
// CHARGER ANNONCES
// =========================================================

async function loadAds() {

    if (!adsContainer) {

        return;

    }


    try {

        adsContainer.innerHTML = `

            <div class="immo-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Chargement des biens...
                </span>

            </div>

        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        allAds =
            snapshot.docs

                .map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                )

                .filter(
                    ad => {

                        if (
                            ad.status ===
                                undefined ||
                            ad.status ===
                                null ||
                            ad.status === ""
                        ) {

                            return true;

                        }


                        return (
                            ad.status ===
                            "active"
                        );

                    }
                )

                .filter(
                    isImmobilier
                );


        allAds.sort(
            (a, b) => {

                const dateA =
                    a.createdAt &&
                    typeof
                        a.createdAt.toMillis ===
                        "function"

                        ? a.createdAt.toMillis()

                        : 0;


                const dateB =
                    b.createdAt &&
                    typeof
                        b.createdAt.toMillis ===
                        "function"

                        ? b.createdAt.toMillis()

                        : 0;


                return (
                    dateB -
                    dateA
                );

            }
        );


        displayAds(
            allAds
        );


        console.log(
            "CAMU IMMO — annonces :",
            allAds.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur annonces :",
            error
        );


        adsContainer.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Impossible de charger les biens
                </h3>

                <p>
                    Une erreur est survenue
                    lors du chargement.
                </p>

            </div>

        `;

    }

}


// =========================================================
// AFFICHER ANNONCES
// =========================================================

function displayAds(
    ads
) {

    if (!adsContainer) {

        return;

    }


    if (
        ads.length === 0
    ) {

        adsContainer.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-house-circle-exclamation"></i>

                <h3>
                    Aucun bien immobilier
                </h3>

                <p>
                    Aucune annonce immobilière
                    n'est actuellement disponible.
                </p>

            </div>

        `;

        return;

    }


    adsContainer.innerHTML =
        "";


    ads
        .slice(
            0,
            12
        )
        .forEach(
            ad => {

                const image =
                    getImage(ad);


                const title =
                    ad.title ||
                    "Bien immobilier";


                const city =
                    ad.city ||
                    "Ville non précisée";


                const price =
                    formatPrice(
                        ad.price,
                        ad.currency ||
                            "USD"
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "immo-ad-card";


                card.innerHTML = `

                    <div class="immo-ad-image">

                        <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(title)}"
                            loading="lazy"
                            onerror="
                                this.src='assets/logo/camu-services-logo.png'
                            "
                        >

                        <span class="immo-ad-badge">
                            Immobilier
                        </span>

                    </div>


                    <div class="immo-ad-content">

                        <h3>
                            ${escapeHtml(title)}
                        </h3>


                        <div class="immo-ad-location">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>
                                ${escapeHtml(city)}
                            </span>

                        </div>


                        <div class="immo-ad-price">

                            ${price}

                        </div>


                        <div class="immo-ad-link">

                            <span>
                                Voir le bien
                            </span>

                            <i class="fa-solid fa-arrow-right"></i>

                        </div>

                    </div>

                `;


                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `explorer.html?id=${encodeURIComponent(
                                ad.id
                            )}`;

                    }
                );


                adsContainer.appendChild(
                    card
                );

            }
        );

}


// =========================================================
// RECHERCHE
// =========================================================

function searchAds() {

    const keyword =
        normalizeText(
            keywordInput
                ? keywordInput.value
                : ""
        );


    const city =
        citySelect
            ? citySelect.value
            : "";


    const type =
        normalizeText(
            typeSelect
                ? typeSelect.value
                : ""
        );


    const results =
        allAds.filter(
            ad => {

                const title =
                    normalizeText(
                        ad.title
                    );


                const description =
                    normalizeText(
                        ad.description
                    );


                const adCity =
                    String(
                        ad.city ||
                        ""
                    );


                const adType =
                    normalizeText(
                        ad.type ||
                        ad.transactionType ||
                        ad.operation ||
                        ad.saleType ||
                        ""
                    );


                const keywordMatch =

                    !keyword ||

                    title.includes(
                        keyword
                    ) ||

                    description.includes(
                        keyword
                    );


                const cityMatch =

                    !city ||

                    adCity === city;


                const typeMatch =

                    !type ||

                    adType === type ||

                    title.includes(
                        type
                    ) ||

                    description.includes(
                        type
                    );


                return (

                    keywordMatch &&

                    cityMatch &&

                    typeMatch

                );

            }
        );


    displayAds(
        results
    );

}


// =========================================================
// FORMULAIRE RECHERCHE
// =========================================================

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            searchAds();

        }
    );

}


// =========================================================
// VILLE
// =========================================================

if (citySelect) {

    citySelect.addEventListener(
        "change",
        searchAds
    );

}


// =========================================================
// TYPE
// =========================================================

if (typeSelect) {

    typeSelect.addEventListener(
        "change",
        searchAds
    );

}


// =========================================================
// TYPES DE BIENS
// =========================================================

document
    .querySelectorAll(
        ".immo-type"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.type;


                    if (!type) {

                        return;

                    }


                    if (keywordInput) {

                        keywordInput.value =
                            type;

                    }


                    searchAds();


                    const listings =
                        document.getElementById(
                            "immoAds"
                        );


                    if (listings) {

                        listings.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }

                }
            );

        }
    );


// =========================================================
// INITIALISATION
// =========================================================

async function initImmobilier() {

    console.log(
        "CAMU IMMO — initialisation..."
    );


    await Promise.allSettled([

        loadCities(),

        loadAds()

    ]);


    console.log(
        "CAMU IMMO — espace chargé."
    );

}


// =========================================================
// LANCER
// =========================================================

initImmobilier();

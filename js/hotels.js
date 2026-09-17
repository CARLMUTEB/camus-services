/* =====================================================
   CAMU SERVICES — HÔTELS & HÉBERGEMENT
   hotels.js
===================================================== */


/* =====================================================
   FIREBASE
===================================================== */

import {
    getApps,
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/*
   IMPORTANT :

   Utilise ici exactement la même configuration
   Firebase que dans ton firebase-config.js.
*/

const firebaseConfig = {

    apiKey: "VOTRE_API_KEY",

    authDomain:
        "camu-services.firebaseapp.com",

    projectId:
        "camu-services",

    storageBucket:
        "camu-services.firebasestorage.app",

    messagingSenderId:
        "VOTRE_MESSAGING_SENDER_ID",

    appId:
        "VOTRE_APP_ID"

};


const app =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp(firebaseConfig);


const db =
    getFirestore(app);


/* =====================================================
   ELEMENTS HTML
===================================================== */

const hotelsCategories =
    document.getElementById(
        "hotelsCategories"
    );


const hotelsProducts =
    document.getElementById(
        "hotelsProducts"
    );


const hotelsBusinesses =
    document.getElementById(
        "hotelsBusinesses"
    );


const hotelsKeyword =
    document.getElementById(
        "hotelsKeyword"
    );


const hotelsCategory =
    document.getElementById(
        "hotelsCategory"
    );


const hotelsVille =
    document.getElementById(
        "hotelsVille"
    );


const hotelsCommune =
    document.getElementById(
        "hotelsCommune"
    );


const hotelsSearchButton =
    document.getElementById(
        "hotelsSearchButton"
    );


const hotelBusinessVille =
    document.getElementById(
        "hotelBusinessVille"
    );


const hotelBusinessCommune =
    document.getElementById(
        "hotelBusinessCommune"
    );


const hotelsCount =
    document.getElementById(
        "hotelsCount"
    );


const hotelsYear =
    document.getElementById(
        "hotelsYear"
    );


/* =====================================================
   MENU MOBILE
===================================================== */

const hotelsMenuButton =
    document.getElementById(
        "hotelsMenuButton"
    );


const hotelsSidebar =
    document.getElementById(
        "hotelsSidebar"
    );


const hotelsOverlay =
    document.getElementById(
        "hotelsOverlay"
    );


if (hotelsYear) {

    hotelsYear.textContent =
        new Date().getFullYear();

}


/* =====================================================
   CATÉGORIES
   Elles sont locales.
   Pas besoin de collection Firestore.
===================================================== */

const HOTEL_CATEGORIES = [

    {
        id: "hotel",

        name: "Hôtels",

        icon: "fa-solid fa-hotel",

        description:
            "Hôtels et établissements classiques."
    },


    {
        id: "residence",

        name: "Résidences",

        icon: "fa-solid fa-building",

        description:
            "Résidences et logements meublés."
    },


    {
        id: "appartement",

        name: "Appartements",

        icon: "fa-solid fa-house",

        description:
            "Appartements pour courts ou longs séjours."
    },


    {
        id: "maison-hotes",

        name: "Maisons d'hôtes",

        icon: "fa-solid fa-house-chimney",

        description:
            "Maisons d'hôtes et hébergements familiaux."
    },


    {
        id: "auberge",

        name: "Auberges",

        icon: "fa-solid fa-bed",

        description:
            "Hébergements simples et économiques."
    },


    {
        id: "lodge",

        name: "Lodges",

        icon: "fa-solid fa-mountain-sun",

        description:
            "Lodges et hébergements touristiques."
    },


    {
        id: "courte-duree",

        name: "Courte durée",

        icon: "fa-solid fa-calendar-days",

        description:
            "Hébergements pour courts séjours."
    },


    {
        id: "autres",

        name: "Autres",

        icon: "fa-solid fa-layer-group",

        description:
            "Autres solutions d'hébergement."
    }

];


/* =====================================================
   DONNÉES
===================================================== */

let allHotels = [];

let allBusinesses = [];


/* =====================================================
   NORMALISER
===================================================== */

function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
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


/* =====================================================
   IMAGE
===================================================== */

function getImage(item) {

    /*
       images = tableau
    */

    if (
        Array.isArray(item.images) &&
        item.images.length > 0 &&
        item.images[0]
    ) {

        return item.images[0];

    }


    /*
       images = JSON string
    */

    if (
        typeof item.images === "string" &&
        item.images.trim() !== ""
    ) {

        try {

            const parsed =
                JSON.parse(item.images);


            if (
                Array.isArray(parsed) &&
                parsed.length > 0 &&
                parsed[0]
            ) {

                return parsed[0];

            }

        } catch {

            // Continuer

        }

    }


    if (item.imageURL) {

        return item.imageURL;

    }


    if (item.imageUrl) {

        return item.imageUrl;

    }


    if (item.image) {

        return item.image;

    }


    if (item.photoURL) {

        return item.photoURL;

    }


    if (item.logoURL) {

        return item.logoURL;

    }


    return "assets/logo/camu-services-logo.png";

}


/* =====================================================
   PRIX
===================================================== */

function formatPrice(
    price,
    currency = "USD"
) {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {

        return "Prix à discuter";

    }


    const number =
        Number(price);


    if (Number.isNaN(number)) {

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


    return `${formatted} ${escapeHtml(
        currency
    )}`;

}


/* =====================================================
   DÉTECTER ANNONCE HÔTEL
===================================================== */

function isHotelAd(ad) {

    const text =
        normalizeText(

            [

                ad.category,

                ad.title,

                ad.description,

                ad.type,

                ad.typeHebergement,

                ad.service

            ].join(" ")

        );


    const keywords = [

        "hotel",

        "hebergement",

        "hebergement",

        "residence",

        "appartement",

        "maison d'hote",

        "maison dhote",

        "auberge",

        "lodge",

        "chambre",

        "guest house",

        "guesthouse"

    ];


    return keywords.some(
        keyword =>
            text.includes(
                normalizeText(
                    keyword
                )
            )
    );

}


/* =====================================================
   NOM CATÉGORIE
===================================================== */

function getHotelCategoryName(
    hotel
) {

    const text =
        normalizeText(

            [

                hotel.category,

                hotel.type,

                hotel.typeHebergement,

                hotel.title

            ].join(" ")

        );


    if (
        text.includes("hotel")
    ) {

        return "Hôtels";

    }


    if (
        text.includes("residence")
    ) {

        return "Résidences";

    }


    if (
        text.includes("appartement")
    ) {

        return "Appartements";

    }


    if (
        text.includes("maison") &&
        text.includes("hote")
    ) {

        return "Maisons d'hôtes";

    }


    if (
        text.includes("auberge")
    ) {

        return "Auberges";

    }


    if (
        text.includes("lodge")
    ) {

        return "Lodges";

    }


    return hotel.category ||
        "Hébergement";

}


/* =====================================================
   AFFICHER CATÉGORIES
===================================================== */

function renderCategories() {

    if (!hotelsCategories) {
        return;
    }


    hotelsCategories.innerHTML = "";


    HOTEL_CATEGORIES.forEach(
        category => {


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "hotels-category-card";


            card.innerHTML = `

                <div
                    class="hotels-category-icon"
                >

                    <i
                        class="${escapeHtml(
                            category.icon
                        )}"
                    ></i>

                </div>


                <h3>

                    ${escapeHtml(
                        category.name
                    )}

                </h3>


                <p>

                    ${escapeHtml(
                        category.description
                    )}

                </p>

            `;


            card.addEventListener(
                "click",
                () => {


                    if (hotelsCategory) {

                        hotelsCategory.value =
                            category.id;

                    }


                    filterHotels();


                    const section =
                        document.getElementById(
                            "hebergements"
                        );


                    if (section) {

                        section.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }
            );


            hotelsCategories.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   SELECT CATÉGORIES
===================================================== */

function loadCategorySelect() {

    if (!hotelsCategory) {
        return;
    }


    hotelsCategory.innerHTML = `

        <option value="">

            Toutes les catégories

        </option>

    `;


    HOTEL_CATEGORIES.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            hotelsCategory.appendChild(
                option
            );

        }
    );

}


/* =====================================================
   CHARGER VILLES
   COLLECTION : villes
===================================================== */

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
            document => {

                const data =
                    document.data();


                if (
                    data.active === true
                ) {

                    cities.push({

                        name:
                            String(
                                data.name || ""
                            ).trim(),

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
                    a.order !== b.order
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
                        sensitivity: "base"
                    }
                );

            }
        );


        const selects = [

            hotelsVille,

            hotelBusinessVille

        ];


        selects.forEach(
            select => {

                if (!select) {
                    return;
                }


                select.innerHTML = `

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


                        select.appendChild(
                            option
                        );

                    }
                );

            }
        );


        console.log(
            "CAMU HÔTELS — villes chargées :",
            cities.length
        );


    } catch (error) {

        console.error(
            "CAMU HÔTELS — erreur villes :",
            error
        );

    }

}


/* =====================================================
   CHARGER ANNONCES
   COLLECTION : annonces
===================================================== */

async function loadHotels() {

    if (!hotelsProducts) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        allHotels =
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

                        const status =
                            normalizeText(
                                ad.status
                            );


                        const isActive =
                            !status ||
                            status === "active" ||
                            status === "approved";


                        return (
                            isActive &&
                            isHotelAd(ad)
                        );

                    }
                );


        console.log(
            "CAMU HÔTELS — annonces trouvées :",
            allHotels.length
        );


        filterHotels();


    } catch (error) {

        console.error(
            "CAMU HÔTELS — erreur annonces :",
            error
        );


        hotelsProducts.innerHTML = `

            <div class="hotels-empty">

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <span>

                    Impossible de charger
                    les hébergements.

                </span>

            </div>

        `;

    }

}


/* =====================================================
   FILTRER HÔTELS
===================================================== */

function filterHotels() {

    if (!hotelsProducts) {
        return;
    }


    const keyword =
        normalizeText(
            hotelsKeyword?.value
        );


    const category =
        normalizeText(
            hotelsCategory?.value
        );


    const ville =
        normalizeText(
            hotelsVille?.value
        );


    const commune =
        normalizeText(
            hotelsCommune?.value
        );


    const results =
        allHotels.filter(
            hotel => {


                const text =
                    normalizeText(

                        [

                            hotel.title,

                            hotel.description,

                            hotel.category,

                            hotel.type,

                            hotel.typeHebergement,

                            hotel.service,

                            hotel.city,

                            hotel.commune

                        ].join(" ")

                    );


                const hotelVille =
                    normalizeText(
                        hotel.city
                    );


                const hotelCommune =
                    normalizeText(
                        hotel.commune
                    );


                /* RECHERCHE */

                if (
                    keyword &&
                    !text.includes(
                        keyword
                    )
                ) {

                    return false;

                }


                /* VILLE */

                if (
                    ville &&
                    hotelVille !== ville
                ) {

                    return false;

                }


                /* COMMUNE */

                if (
                    commune &&
                    !hotelCommune.includes(
                        commune
                    )
                ) {

                    return false;

                }


                /* CATÉGORIE */

                if (
                    category &&
                    category !== "autres"
                ) {

                    const categoryText =
                        normalizeText(

                            [

                                hotel.category,

                                hotel.type,

                                hotel.typeHebergement,

                                hotel.title

                            ].join(" ")

                        );


                    const categoryMap = {

                        hotel:
                            "hotel",

                        residence:
                            "residence",

                        appartement:
                            "appartement",

                        "maison-hotes":
                            "maison",

                        auberge:
                            "auberge",

                        lodge:
                            "lodge",

                        "courte-duree":
                            "location"

                    };


                    const searchValue =
                        categoryMap[
                            category
                        ];


                    if (
                        searchValue &&
                        !categoryText.includes(
                            searchValue
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderHotels(
        results
    );

}


/* =====================================================
   AFFICHER HÔTELS
===================================================== */

function renderHotels(
    hotels
) {

    hotelsProducts.innerHTML = "";


    if (hotelsCount) {

        hotelsCount.textContent =
            `${hotels.length} hébergement${
                hotels.length > 1
                    ? "s"
                    : ""
            }`;

    }


    if (!hotels.length) {

        hotelsProducts.innerHTML = `

            <div class="hotels-empty">

                <i
                    class="fa-solid fa-hotel"
                ></i>

                <strong>

                    Aucun hébergement trouvé

                </strong>

                <span>

                    Essayez une autre ville,
                    commune ou recherche.

                </span>

            </div>

        `;

        return;

    }


    hotels.forEach(
        hotel => {


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "hotels-product-card";


            const image =
                getImage(
                    hotel
                );


            const title =
                hotel.title ||
                "Hébergement";


            const city =
                String(
                    hotel.city ||
                    "Ville non précisée"
                ).trim();


            const commune =
                String(
                    hotel.commune ||
                    ""
                ).trim();


            const category =
                getHotelCategoryName(
                    hotel
                );


            const price =
                formatPrice(
                    hotel.price,
                    hotel.currency ||
                        "USD"
                );


            card.innerHTML = `

                <div
                    class="hotels-product-image"
                >

                    <img
                        src="${escapeHtml(
                            image
                        )}"
                        alt="${escapeHtml(
                            title
                        )}"
                        loading="lazy"
                        onerror="
                            this.src='assets/logo/camu-services-logo.png'
                        "
                    >

                </div>


                <div
                    class="hotels-product-content"
                >


                    <div
                        class="hotels-product-category"
                    >

                        ${escapeHtml(
                            category
                        )}

                    </div>


                    <h3
                        class="hotels-product-title"
                    >

                        ${escapeHtml(
                            title
                        )}

                    </h3>


                    <div
                        class="hotels-product-location"
                    >

                        <i
                            class="fa-solid fa-location-dot"
                        ></i>


                        <span>

                            ${escapeHtml(
                                city
                            )}

                            ${
                                commune
                                    ? " — " +
                                      escapeHtml(
                                          commune
                                      )
                                    : ""
                            }

                        </span>

                    </div>


                    <div
                        class="hotels-product-price"
                    >

                        ${price}

                    </div>


                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `explorer.html?id=${encodeURIComponent(
                            hotel.id
                        )}`;

                }
            );


            hotelsProducts.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   CHARGER ÉTABLISSEMENTS
   COLLECTION :
   etablissements_hoteliers
===================================================== */

async function loadBusinesses() {

    if (!hotelsBusinesses) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "etablissements_hoteliers"
                )
            );


        allBusinesses =
            snapshot.docs
                .map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                )
                .filter(
                    business =>
                        business.active !== false
                );


        console.log(
            "CAMU HÔTELS — établissements :",
            allBusinesses.length
        );


        filterBusinesses();


    } catch (error) {

        console.error(
            "CAMU HÔTELS — erreur établissements :",
            error
        );


        hotelsBusinesses.innerHTML = `

            <div class="hotels-empty">

                <i
                    class="fa-solid fa-building"
                ></i>

                <strong>

                    Aucun établissement disponible

                </strong>

                <span>

                    Les établissements apparaîtront
                    ici lorsqu'ils seront enregistrés.

                </span>

            </div>

        `;

    }

}


/* =====================================================
   FILTRER ÉTABLISSEMENTS
===================================================== */

function filterBusinesses() {

    const ville =
        normalizeText(
            hotelBusinessVille?.value
        );


    const commune =
        normalizeText(
            hotelBusinessCommune?.value
        );


    const results =
        allBusinesses.filter(
            business => {


                const businessVille =
                    normalizeText(
                        business.ville
                    );


                const businessCommune =
                    normalizeText(
                        business.commune
                    );


                if (
                    ville &&
                    businessVille !== ville
                ) {

                    return false;

                }


                if (
                    commune &&
                    !businessCommune.includes(
                        commune
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    renderBusinesses(
        results
    );

}


/* =====================================================
   IMAGE ÉTABLISSEMENT
===================================================== */

function getBusinessImage(
    business
) {

    const image =
        business.photoURL ||
        business.logoURL ||
        business.imageURL;


    if (
        image &&
        String(image).trim() !== ""
    ) {

        return String(
            image
        ).trim();

    }


    return "assets/logo/camu-services-logo.png";

}


/* =====================================================
   WHATSAPP
===================================================== */

function makeWhatsAppLink(
    number,
    name
) {

    if (!number) {
        return "";
    }


    let phone =
        String(number)
            .replace(
                /[^0-9]/g,
                ""
            );


    if (
        phone.startsWith("0")
    ) {

        phone =
            "243" +
            phone.substring(1);

    }


    const message =
        `Bonjour ${name || ""}, je souhaite avoir des informations concernant votre établissement.`;


    return (
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
            message
        )
    );

}


/* =====================================================
   AFFICHER ÉTABLISSEMENTS
===================================================== */

function renderBusinesses(
    businesses
) {

    hotelsBusinesses.innerHTML = "";


    if (!businesses.length) {

        hotelsBusinesses.innerHTML = `

            <div class="hotels-empty">

                <i
                    class="fa-solid fa-building"
                ></i>

                <strong>

                    Aucun établissement trouvé

                </strong>

                <span>

                    Aucun hôtel ou établissement
                    ne correspond aux filtres.

                </span>

            </div>

        `;

        return;

    }


    businesses.forEach(
        business => {


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "hotels-business-card";


            const name =
                String(
                    business.name ||
                    business.nom ||
                    "Établissement"
                ).trim();


            const category =
                String(
                    business.category ||
                    "Hébergement"
                ).trim();


            const ville =
                String(
                    business.ville ||
                    "Ville non précisée"
                ).trim();


            const commune =
                String(
                    business.commune ||
                    ""
                ).trim();


            const description =
                String(
                    business.description ||
                    "Établissement d'hébergement."
                ).trim();


            const image =
                getBusinessImage(
                    business
                );


            const whatsapp =
                business.WhatsApp ||
                business.whatsapp ||
                "";


            const phone =
                business.phone ||
                business.telephone ||
                "";


            const email =
                business.email ||
                "";


            const whatsappLink =
                makeWhatsAppLink(
                    whatsapp,
                    name
                );


            card.innerHTML = `

                <div
                    class="hotels-business-head"
                >


                    <img
                        src="${escapeHtml(
                            image
                        )}"
                        alt="${escapeHtml(
                            name
                        )}"
                        class="hotels-business-photo"
                        loading="lazy"
                        onerror="
                            this.src='assets/logo/camu-services-logo.png'
                        "
                    >


                    <div>

                        <div
                            class="hotels-business-name"
                        >

                            ${escapeHtml(
                                name
                            )}

                        </div>


                        <div
                            class="hotels-business-type"
                        >

                            ${escapeHtml(
                                category
                            )}

                        </div>

                    </div>


                </div>


                <p
                    class="hotels-business-description"
                >

                    ${escapeHtml(
                        description
                    )}

                </p>


                <div
                    class="hotels-business-location"
                >

                    <i
                        class="fa-solid fa-location-dot"
                    ></i>


                    <span>

                        ${escapeHtml(
                            ville
                        )}

                        ${
                            commune
                                ? " — " +
                                  escapeHtml(
                                      commune
                                  )
                                : ""
                        }

                    </span>

                </div>


                <div
                    class="hotels-business-actions"
                >


                    ${
                        whatsappLink
                            ? `
                                <a
                                    href="${escapeHtml(
                                        whatsappLink
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="hotels-whatsapp-small"
                                >

                                    <i
                                        class="fa-brands fa-whatsapp"
                                    ></i>

                                    WhatsApp

                                </a>
                              `
                            : ""
                    }


                    ${
                        phone
                            ? `
                                <a
                                    href="tel:${escapeHtml(
                                        phone
                                    )}"
                                    class="hotels-phone-small"
                                >

                                    <i
                                        class="fa-solid fa-phone"
                                    ></i>

                                    Appeler

                                </a>
                              `
                            : ""
                    }


                    ${
                        email
                            ? `
                                <a
                                    href="mailto:${escapeHtml(
                                        email
                                    )}"
                                    class="hotels-email-small"
                                >

                                    <i
                                        class="fa-solid fa-envelope"
                                    ></i>

                                    E-mail

                                </a>
                              `
                            : ""
                    }


                </div>

            `;


            hotelsBusinesses.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   ÉVÉNEMENTS RECHERCHE
===================================================== */

if (hotelsSearchButton) {

    hotelsSearchButton.addEventListener(
        "click",
        () => {

            filterHotels();

        }
    );

}


/* =====================================================
   RECHERCHE AVEC ENTRÉE
===================================================== */

if (hotelsKeyword) {

    hotelsKeyword.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                filterHotels();

            }

        }
    );

}


/* =====================================================
   FILTRE AUTOMATIQUE
===================================================== */

if (hotelsCategory) {

    hotelsCategory.addEventListener(
        "change",
        filterHotels
    );

}


if (hotelsVille) {

    hotelsVille.addEventListener(
        "change",
        filterHotels
    );

}


if (hotelsCommune) {

    hotelsCommune.addEventListener(
        "input",
        filterHotels
    );

}


if (hotelBusinessVille) {

    hotelBusinessVille.addEventListener(
        "change",
        filterBusinesses
    );

}


if (hotelBusinessCommune) {

    hotelBusinessCommune.addEventListener(
        "input",
        filterBusinesses
    );

}


/* =====================================================
   MENU MOBILE
===================================================== */

function openHotelsMenu() {

    if (hotelsSidebar) {

        hotelsSidebar.classList.add(
            "open"
        );

    }


    if (hotelsOverlay) {

        hotelsOverlay.classList.add(
            "active"
        );

    }


    if (hotelsMenuButton) {

        hotelsMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeHotelsMenu() {

    if (hotelsSidebar) {

        hotelsSidebar.classList.remove(
            "open"
        );

    }


    if (hotelsOverlay) {

        hotelsOverlay.classList.remove(
            "active"
        );

    }


    if (hotelsMenuButton) {

        hotelsMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


if (hotelsMenuButton) {

    hotelsMenuButton.addEventListener(
        "click",
        () => {

            if (
                hotelsSidebar?.classList.contains(
                    "open"
                )
            ) {

                closeHotelsMenu();

            } else {

                openHotelsMenu();

            }

        }
    );

}


if (hotelsOverlay) {

    hotelsOverlay.addEventListener(
        "click",
        closeHotelsMenu
    );

}


document.querySelectorAll(
    ".hotels-nav-link"
).forEach(
    link => {

        link.addEventListener(
            "click",
            closeHotelsMenu
        );

    }
);


/* =====================================================
   INITIALISATION
===================================================== */

async function initHotels() {

    console.log(
        "=========================================="
    );


    console.log(
        "CAMU HÔTELS — initialisation..."
    );


    renderCategories();


    loadCategorySelect();


    await Promise.allSettled([

        loadCities(),

        loadHotels(),

        loadBusinesses()

    ]);


    console.log(
        "CAMU HÔTELS — initialisation terminée."
    );


    console.log(
        "=========================================="
    );

}


/* =====================================================
   LANCER
===================================================== */

initHotels();

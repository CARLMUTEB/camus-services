// ============================================================
// CAMU SERVICES — VÉHICULES & TRANSPORT
// ============================================================
// Catégories : locales dans ce fichier
// Véhicules   : Firestore → annonces
// Chauffeurs  : Firestore → chauffeurs
// Agences     : Firestore → agences_automobiles
// Villes      : Firestore → villes
// ============================================================


import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",

    authDomain:
        "camu-services.firebaseapp.com",

    projectId:
        "camu-services",

    storageBucket:
        "camu-services.appspot.com",

    messagingSenderId:
        "879100396449",

    appId:
        "1:879100396449:web:9d7ffe441a3df2daf841e0",

    measurementId:
        "G-RQ16SX2SNV"

};


let vehiclesApp;


if (
    getApps().some(
        app => app.name === "camu-vehicles"
    )
) {

    vehiclesApp =
        getApp("camu-vehicles");

} else {

    vehiclesApp =
        initializeApp(
            firebaseConfig,
            "camu-vehicles"
        );

}


const db =
    getFirestore(
        vehiclesApp
    );


// ============================================================
// CATÉGORIES
// ============================================================

const categories = [

    {
        id: "vente-vehicules",
        name: "Vente de véhicules",
        icon: "fa-solid fa-car",
        description:
            "Voitures et véhicules à vendre."
    },

    {
        id: "location-vehicules",
        name: "Location de véhicules",
        icon: "fa-solid fa-key",
        description:
            "Véhicules disponibles à la location."
    },

    {
        id: "transport-personnes",
        name: "Transport de personnes",
        icon: "fa-solid fa-users",
        description:
            "Services de transport de personnes."
    },

    {
        id: "transport-marchandises",
        name: "Transport de marchandises",
        icon: "fa-solid fa-truck",
        description:
            "Transport de marchandises et colis."
    },

    {
        id: "taxi",
        name: "Taxi",
        icon: "fa-solid fa-taxi",
        description:
            "Services de taxi."
    },

    {
        id: "moto-taxi",
        name: "Moto-taxi",
        icon: "fa-solid fa-motorcycle",
        description:
            "Services de moto-taxi."
    },

    {
        id: "bus-minibus",
        name: "Bus & Minibus",
        icon: "fa-solid fa-bus",
        description:
            "Bus et minibus."
    },

    {
        id: "camions",
        name: "Camions",
        icon: "fa-solid fa-truck-moving",
        description:
            "Camions et véhicules lourds."
    },

    {
        id: "engins-machines",
        name: "Engins & Machines",
        icon: "fa-solid fa-tractor",
        description:
            "Engins, machines et équipements."
    },

    {
        id: "pieces-accessoires",
        name: "Pièces & Accessoires",
        icon: "fa-solid fa-gears",
        description:
            "Pièces et accessoires automobiles."
    },

    {
        id: "services-automobiles",
        name: "Services automobiles",
        icon: "fa-solid fa-wrench",
        description:
            "Entretien et services automobiles."
    },

    {
        id: "autres",
        name: "Autres",
        icon: "fa-solid fa-ellipsis",
        description:
            "Autres services liés aux véhicules."
    }

];


// ============================================================
// VARIABLES
// ============================================================

let villes = [];

let vehicules = [];

let chauffeurs = [];

let agences = [];


// ============================================================
// OUTILS
// ============================================================

function normalize(value) {

    return String(
        value ?? ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function firstValue(...values) {

    for (
        const value of values
    ) {

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


function escapeHtml(value) {

    return String(
        value ?? ""
    )
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


function getVille(item) {

    return firstValue(
        item?.ville,
        item?.city,
        item?.villeName,
        item?.cityName
    );

}


function getCommune(item) {

    return firstValue(
        item?.commune,
        item?.communeName
    );

}


function getImages(item) {

    if (
        Array.isArray(
            item?.images
        )
    ) {

        return item.images
            .filter(Boolean);

    }


    if (
        typeof item?.images ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    item.images
                );


            if (
                Array.isArray(parsed)
            ) {

                return parsed
                    .filter(Boolean);

            }

        } catch (error) {

            // Rien à faire.

        }

    }


    if (
        item?.imageURL
    ) {

        return [
            item.imageURL
        ];

    }


    return [];

}


function formatPrice(
    price,
    currency
) {

    const value =
        Number(price);


    if (
        !Number.isFinite(value)
    ) {

        return "Prix à négocier";

    }


    const cur =
        normalize(
            currency
        );


    let symbol =
        "$";


    if (
        cur === "cdf" ||
        cur === "fc" ||
        cur.includes(
            "franc congolais"
        )
    ) {

        symbol =
            "FC";

    }


    return `${value.toLocaleString(
        "fr-FR"
    )} ${symbol}`;

}


// ============================================================
// MENU MOBILE
// ============================================================

function setupMobileMenu() {

    const button =
        document.getElementById(
            "vehiclesMenuButton"
        );


    const sidebar =
        document.getElementById(
            "vehiclesSidebar"
        );


    const overlay =
        document.getElementById(
            "vehiclesOverlay"
        );


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    function closeMenu() {

        sidebar.classList.remove(
            "active"
        );


        overlay?.classList.remove(
            "active"
        );


        button.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    function openMenu() {

        sidebar.classList.add(
            "active"
        );


        overlay?.classList.add(
            "active"
        );


        button.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    button.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
                    "active"
                )
            ) {

                closeMenu();

            } else {

                openMenu();

            }

        }
    );


    overlay?.addEventListener(
        "click",
        closeMenu
    );


    sidebar
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            }
        );

}


// ============================================================
// CATÉGORIES
// ============================================================

function renderCategories() {

    const container =
        document.getElementById(
            "vehiclesCategories"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    categories.forEach(
        category => {

            const card =
                document.createElement(
                    "a"
                );


            card.href =
                "#vehicules";


            card.className =
                "vehicles-category-card";


            card.dataset.category =
                category.id;


            card.innerHTML = `

                <div class="vehicles-category-icon">

                    <i class="${escapeHtml(
                        category.icon
                    )}"></i>

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
                event => {

                    event.preventDefault();


                    const select =
                        document.getElementById(
                            "vehiclesCategory"
                        );


                    if (select) {

                        select.value =
                            category.id;

                    }


                    filterVehicules();


                    document
                        .getElementById(
                            "vehicules"
                        )
                        ?.scrollIntoView({

                            behavior:
                                "smooth"

                        });

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


function populateCategorySelect() {

    const select =
        document.getElementById(
            "vehiclesCategory"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">

            Toutes les catégories

        </option>

    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// VILLES
// ============================================================

async function loadVilles() {

    try {

        console.log(
            "CAMU VÉHICULES — chargement des villes..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        villes = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {

                    return;

                }


                const name =
                    firstValue(
                        data.name,
                        data.nom
                    );


                if (!name) {

                    return;

                }


                villes.push({

                    id:
                        docSnap.id,

                    name:
                        String(
                            name
                        ).trim(),

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        villes.sort(
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


                return normalize(
                    a.name
                ).localeCompare(
                    normalize(
                        b.name
                    )
                );

            }
        );


        populateVilleSelect(
            "vehiclesVille"
        );


        populateVilleSelect(
            "driverVille"
        );


        populateVilleSelect(
            "agencyVille"
        );


        console.log(
            `CAMU VÉHICULES — ${villes.length} ville(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "CAMU VÉHICULES — erreur villes :",
            error
        );

    }

}


function populateVilleSelect(
    id
) {

    const select =
        document.getElementById(
            id
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">

            Toutes les villes

        </option>

    `;


    villes.forEach(
        ville => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                ville.id;


            option.textContent =
                ville.name;


            select.appendChild(
                option
            );

        }
    );

}


function getSelectedVilleName(
    selectId
) {

    const select =
        document.getElementById(
            selectId
        );


    if (!select?.value) {

        return "";

    }


    const ville =
        villes.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    select.value
                )
        );


    return normalize(
        ville?.name
    );

}


// ============================================================
// IDENTIFIER UN VÉHICULE
// ============================================================

function isVehicule(
    data
) {

    const category =
        normalize(
            firstValue(
                data?.category,
                data?.categorie
            )
        );


    const title =
        normalize(
            firstValue(
                data?.title,
                data?.titre
            )
        );


    const description =
        normalize(
            data?.description
        );


    const typeVehicule =
        normalize(
            firstValue(
                data?.typeVehicule,
                data?.vehicleType,
                data?.typeVehicle
            )
        );


    const marque =
        normalize(
            firstValue(
                data?.marqueVehicule,
                data?.marque,
                data?.brand
            )
        );


    const text =
        `${category} ${title} ${description} ${typeVehicule} ${marque}`;


    const keywords = [

        "vehicule",
        "voiture",
        "automobile",
        "auto",
        "transport",
        "taxi",
        "moto",
        "mototaxi",
        "camion",
        "bus",
        "minibus",
        "pickup",
        "pick up",
        "truck",
        "machine",
        "engin",
        "nissan",
        "toyota",
        "mitsubishi",
        "mercedes",
        "hyundai",
        "volkswagen",
        "ford",
        "isuzu",
        "honda",
        "suzuki",
        "mazda",
        "kia",
        "bmw",
        "audi",
        "lexus"

    ];


    return keywords.some(
        keyword =>
            text.includes(
                keyword
            )
    );

}


// ============================================================
// CHARGER VÉHICULES
// ============================================================

async function loadVehicules() {

    try {

        console.log(
            "CAMU VÉHICULES — chargement des véhicules..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        vehicules = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const status =
                    normalize(
                        data.status
                    );


                if (
                    status &&
                    status !== "active" &&
                    status !== "approved"
                ) {

                    return;

                }


                if (
                    !isVehicule(
                        data
                    )
                ) {

                    return;

                }


                vehicules.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            `CAMU VÉHICULES — ${vehicules.length} véhicule(s) chargé(s).`
        );


        filterVehicules();


    } catch (error) {

        console.error(
            "CAMU VÉHICULES — erreur véhicules :",
            error
        );


        renderVehicleError();

    }

}


// ============================================================
// FILTRER VÉHICULES
// ============================================================

function filterVehicules() {

    const keyword =
        normalize(
            document.getElementById(
                "vehiclesKeyword"
            )?.value
        );


    const category =
        normalize(
            document.getElementById(
                "vehiclesCategory"
            )?.value
        );


    const ville =
        getSelectedVilleName(
            "vehiclesVille"
        );


    const commune =
        normalize(
            document.getElementById(
                "vehiclesCommune"
            )?.value
        );


    const selectedCategory =
        categories.find(
            item =>
                normalize(
                    item.id
                ) === category
        );


    const categoryName =
        normalize(
            selectedCategory?.name
        );


    const result =
        vehicules.filter(
            vehicle => {

                // Catégorie
                if (category) {

                    const vehicleCategory =
                        normalize(
                            firstValue(
                                vehicle.category,
                                vehicle.categorie
                            )
                        );


                    const vehicleText =
                        normalize(
                            [
                                vehicle.title,
                                vehicle.description,
                                vehicle.typeVehicule,
                                vehicle.marqueVehicule
                            ]
                                .filter(Boolean)
                                .join(" ")
                        );


                    if (
                        vehicleCategory !== category &&
                        vehicleCategory !== categoryName &&
                        !vehicleText.includes(
                            categoryName
                        )
                    ) {

                        return false;

                    }

                }


                // Ville
                if (ville) {

                    if (
                        normalize(
                            getVille(
                                vehicle
                            )
                        ) !== ville
                    ) {

                        return false;

                    }

                }


                // Commune
                if (commune) {

                    if (
                        !normalize(
                            getCommune(
                                vehicle
                            )
                        ).includes(
                            commune
                        )
                    ) {

                        return false;

                    }

                }


                // Mot-clé
                if (keyword) {

                    const text =
                        normalize(
                            [
                                vehicle.title,
                                vehicle.titre,
                                vehicle.description,
                                vehicle.ville,
                                vehicle.city,
                                vehicle.commune,
                                vehicle.category,
                                vehicle.typeVehicule,
                                vehicle.marqueVehicule,
                                vehicle.ownerName
                            ]
                                .filter(Boolean)
                                .join(" ")
                        );


                    if (
                        !text.includes(
                            keyword
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderVehicules(
        result
    );

}


// ============================================================
// CARTE VÉHICULE
// ============================================================

function createVehicleCard(
    vehicle
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "vehicles-product-card";


    const images =
        getImages(
            vehicle
        );


    const image =
        firstValue(
            images[0],
            vehicle.imageURL,
            "assets/logo/camu-services-logo.png"
        );


    const title =
        firstValue(
            vehicle.title,
            vehicle.titre,
            "Véhicule"
        );


    const price =
        formatPrice(
            vehicle.price,
            vehicle.currency
        );


    const ville =
        getVille(
            vehicle
        );


    const commune =
        getCommune(
            vehicle
        );


    const type =
        firstValue(
            vehicle.typeVehicule,
            vehicle.vehicleType,
            vehicle.typeVehicle
        );


    const marque =
        firstValue(
            vehicle.marqueVehicule,
            vehicle.marque,
            vehicle.brand
        );


    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(
                vehicle.id
            )}"
            class="vehicles-product-image-link"
        >

            <img
                src="${escapeHtml(
                    image
                )}"
                alt="${escapeHtml(
                    title
                )}"
                class="vehicles-product-image"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >

        </a>


        <div class="vehicles-product-content">

            <div class="vehicles-product-price">

                ${escapeHtml(
                    price
                )}

            </div>


            <h3 class="vehicles-product-title">

                ${escapeHtml(
                    title
                )}

            </h3>


            ${
                marque || type
                    ? `

                        <div class="vehicles-product-info">

                            <i class="fa-solid fa-car"></i>

                            ${escapeHtml(
                                [
                                    marque,
                                    type
                                ]
                                    .filter(Boolean)
                                    .join(" • ")
                            )}

                        </div>

                    `
                    : ""
            }


            ${
                ville || commune
                    ? `

                        <div class="vehicles-product-info">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHtml(
                                [
                                    commune,
                                    ville
                                ]
                                    .filter(Boolean)
                                    .join(", ")
                            )}

                        </div>

                    `
                    : ""
            }


            <a
                href="explorer.html?id=${encodeURIComponent(
                    vehicle.id
                )}"
                class="vehicles-product-button"
            >

                Voir le véhicule

                <i class="fa-solid fa-arrow-right"></i>

            </a>

        </div>

    `;


    return card;

}


// ============================================================
// AFFICHER VÉHICULES
// ============================================================

function renderVehicules(
    items
) {

    const container =
        document.getElementById(
            "vehiclesProducts"
        );


    const count =
        document.getElementById(
            "vehiclesCount"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${items.length} véhicule${
                items.length > 1
                    ? "s"
                    : ""
            } disponible${
                items.length > 1
                    ? "s"
                    : ""
            }`;

    }


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="vehicles-empty">

                <i class="fa-solid fa-car-side"></i>

                <h3>
                    Aucun véhicule trouvé
                </h3>

                <p>
                    Essayez de modifier vos critères
                    de recherche.
                </p>

            </div>

        `;

        return;

    }


    items.forEach(
        vehicle => {

            container.appendChild(
                createVehicleCard(
                    vehicle
                )
            );

        }
    );

}


function renderVehicleError() {

    const container =
        document.getElementById(
            "vehiclesProducts"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="vehicles-empty">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Véhicules indisponibles
            </h3>

            <p>
                Impossible de charger les véhicules.
            </p>

        </div>

    `;

}


// ============================================================
// CHAUFFEURS
// ============================================================

async function loadChauffeurs() {

    try {

        console.log(
            "CAMU VÉHICULES — chargement des chauffeurs..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "chauffeurs"
                )
            );


        chauffeurs = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {

                    return;

                }


                chauffeurs.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            `CAMU VÉHICULES — ${chauffeurs.length} chauffeur(s) chargé(s).`
        );


        filterChauffeurs();


    } catch (error) {

        console.error(
            "CAMU VÉHICULES — erreur chauffeurs :",
            error
        );


        const container =
            document.getElementById(
                "vehiclesDrivers"
            );


        if (container) {

            container.innerHTML = `

                <div class="vehicles-empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Chauffeurs indisponibles
                    </h3>

                    <p>
                        Impossible de charger les chauffeurs.
                    </p>

                </div>

            `;

        }

    }

}


function filterChauffeurs() {

    const ville =
        getSelectedVilleName(
            "driverVille"
        );


    const commune =
        normalize(
            document.getElementById(
                "driverCommune"
            )?.value
        );


    const result =
        chauffeurs.filter(
            chauffeur => {

                if (ville) {

                    if (
                        normalize(
                            getVille(
                                chauffeur
                            )
                        ) !== ville
                    ) {

                        return false;

                    }

                }


                if (commune) {

                    if (
                        !normalize(
                            getCommune(
                                chauffeur
                            )
                        ).includes(
                            commune
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderChauffeurs(
        result
    );

}


function createDriverCard(
    chauffeur
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "vehicles-business-card";


    const photo =
        firstValue(
            chauffeur.photoURL,
            chauffeur.photo,
            "assets/logo/camu-services-logo.png"
        );


    const name =
        firstValue(
            chauffeur.name,
            chauffeur.nom,
            "Chauffeur"
        );


    const service =
        firstValue(
            chauffeur.service,
            chauffeur.services
        );


    const type =
        firstValue(
            chauffeur.typeVehicule,
            chauffeur.vehicleType
        );


    const marque =
        firstValue(
            chauffeur.marqueVehicule,
            chauffeur.marque
        );


    const ville =
        getVille(
            chauffeur
        );


    const commune =
        getCommune(
            chauffeur
        );


    const whatsapp =
        firstValue(
            chauffeur.WhatsApp,
            chauffeur.whatsapp
        );


    const phone =
        firstValue(
            chauffeur.phone,
            chauffeur.telephone
        );


    let actions = "";


    if (whatsapp) {

        const number =
            String(
                whatsapp
            ).replace(
                /[^\d]/g,
                ""
            );


        if (number) {

            const message =
                encodeURIComponent(
                    `Bonjour ${name}, je vous contacte via CAMU SERVICES concernant votre service de transport.`
                );


            actions += `

                <a
                    href="https://wa.me/${number}?text=${message}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="vehicles-whatsapp"
                >

                    <i class="fa-brands fa-whatsapp"></i>

                    WhatsApp

                </a>

            `;

        }

    }


    if (phone) {

        actions += `

            <a
                href="tel:${escapeHtml(
                    phone
                )}"
                class="vehicles-phone"
            >

                <i class="fa-solid fa-phone"></i>

                Appeler

            </a>

        `;

    }


    card.innerHTML = `

        <div class="vehicles-business-top">

            <img
                src="${escapeHtml(
                    photo
                )}"
                alt="${escapeHtml(
                    name
                )}"
                class="vehicles-business-photo"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >


            <div>

                <h3 class="vehicles-business-name">

                    ${escapeHtml(
                        name
                    )}

                </h3>


                ${
                    service
                        ? `

                            <div class="vehicles-business-category">

                                <i class="fa-solid fa-briefcase"></i>

                                ${escapeHtml(
                                    service
                                )}

                            </div>

                        `
                        : ""
                }


                ${
                    type || marque
                        ? `

                            <div class="vehicles-business-category">

                                <i class="fa-solid fa-car"></i>

                                ${escapeHtml(
                                    [
                                        marque,
                                        type
                                    ]
                                        .filter(Boolean)
                                        .join(" • ")
                                )}

                            </div>

                        `
                        : ""
                }

            </div>

        </div>


        ${
            chauffeur.description
                ? `

                    <p class="vehicles-business-description">

                        ${escapeHtml(
                            chauffeur.description
                        )}

                    </p>

                `
                : ""
        }


        ${
            ville || commune
                ? `

                    <div class="vehicles-business-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(
                            [
                                commune,
                                ville
                            ]
                                .filter(Boolean)
                                .join(", ")
                        )}

                    </div>

                `
                : ""
        }


        <div class="vehicles-business-actions">

            ${actions}

        </div>

    `;


    return card;

}


function renderChauffeurs(
    items
) {

    const container =
        document.getElementById(
            "vehiclesDrivers"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="vehicles-empty">

                <i class="fa-solid fa-user-tie"></i>

                <h3>
                    Aucun chauffeur trouvé
                </h3>

                <p>
                    Aucun chauffeur ne correspond
                    à votre recherche.
                </p>

            </div>

        `;

        return;

    }


    items.forEach(
        chauffeur => {

            container.appendChild(
                createDriverCard(
                    chauffeur
                )
            );

        }
    );

}


// ============================================================
// AGENCES AUTOMOBILES
// ============================================================

async function loadAgences() {

    try {

        console.log(
            "CAMU VÉHICULES — chargement des agences..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "agences_automobiles"
                )
            );


        agences = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {

                    return;

                }


                agences.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            `CAMU VÉHICULES — ${agences.length} agence(s) chargée(s).`
        );


        filterAgences();


    } catch (error) {

        console.error(
            "CAMU VÉHICULES — erreur agences :",
            error
        );


        const container =
            document.getElementById(
                "vehiclesAgencies"
            );


        if (container) {

            container.innerHTML = `

                <div class="vehicles-empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Agences indisponibles
                    </h3>

                    <p>
                        Impossible de charger les agences.
                    </p>

                </div>

            `;

        }

    }

}


function filterAgences() {

    const ville =
        getSelectedVilleName(
            "agencyVille"
        );


    const commune =
        normalize(
            document.getElementById(
                "agencyCommune"
            )?.value
        );


    const result =
        agences.filter(
            agence => {

                if (ville) {

                    if (
                        normalize(
                            getVille(
                                agence
                            )
                        ) !== ville
                    ) {

                        return false;

                    }

                }


                if (commune) {

                    if (
                        !normalize(
                            getCommune(
                                agence
                            )
                        ).includes(
                            commune
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderAgences(
        result
    );

}


function createAgencyCard(
    agence
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "vehicles-business-card";


    const logo =
        firstValue(
            agence.logoURL,
            agence.photoURL,
            "assets/logo/camu-services-logo.png"
        );


    const name =
        firstValue(
            agence.nom,
            agence.name,
            "Agence automobile"
        );


    const description =
        firstValue(
            agence.description
        );


    const ville =
        getVille(
            agence
        );


    const commune =
        getCommune(
            agence
        );


    const adresse =
        firstValue(
            agence.adresse,
            agence.address
        );


    const whatsapp =
        firstValue(
            agence.whatsapp,
            agence.WhatsApp
        );


    const phone =
        firstValue(
            agence.telephone,
            agence.phone
        );


    const email =
        firstValue(
            agence.email
        );


    let actions = "";


    if (whatsapp) {

        const number =
            String(
                whatsapp
            ).replace(
                /[^\d]/g,
                ""
            );


        if (number) {

            const message =
                encodeURIComponent(
                    `Bonjour ${name}, je vous contacte via CAMU SERVICES.`
                );


            actions += `

                <a
                    href="https://wa.me/${number}?text=${message}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="vehicles-whatsapp"
                >

                    <i class="fa-brands fa-whatsapp"></i>

                    WhatsApp

                </a>

            `;

        }

    }


    if (phone) {

        actions += `

            <a
                href="tel:${escapeHtml(
                    phone
                )}"
                class="vehicles-phone"
            >

                <i class="fa-solid fa-phone"></i>

                Appeler

            </a>

        `;

    }


    if (email) {

        actions += `

            <a
                href="mailto:${escapeHtml(
                    email
                )}"
                class="vehicles-phone"
            >

                <i class="fa-solid fa-envelope"></i>

                E-mail

            </a>

        `;

    }


    card.innerHTML = `

        <div class="vehicles-business-top">

            <img
                src="${escapeHtml(
                    logo
                )}"
                alt="${escapeHtml(
                    name
                )}"
                class="vehicles-business-photo"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >


            <div>

                <h3 class="vehicles-business-name">

                    ${escapeHtml(
                        name
                    )}

                </h3>


                <div class="vehicles-business-category">

                    <i class="fa-solid fa-building"></i>

                    Agence automobile

                </div>

            </div>

        </div>


        ${
            description
                ? `

                    <p class="vehicles-business-description">

                        ${escapeHtml(
                            description
                        )}

                    </p>

                `
                : ""
        }


        ${
            ville || commune
                ? `

                    <div class="vehicles-business-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(
                            [
                                commune,
                                ville
                            ]
                                .filter(Boolean)
                                .join(", ")
                        )}

                    </div>

                `
                : ""
        }


        ${
            adresse
                ? `

                    <div class="vehicles-business-location">

                        <i class="fa-solid fa-map-location-dot"></i>

                        ${escapeHtml(
                            adresse
                        )}

                    </div>

                `
                : ""
        }


        <div class="vehicles-business-actions">

            ${actions}

        </div>

    `;


    return card;

}


function renderAgences(
    items
) {

    const container =
        document.getElementById(
            "vehiclesAgencies"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="vehicles-empty">

                <i class="fa-solid fa-building"></i>

                <h3>
                    Aucune agence trouvée
                </h3>

                <p>
                    Aucune agence automobile ne correspond
                    à votre recherche.
                </p>

            </div>

        `;

        return;

    }


    items.forEach(
        agence => {

            container.appendChild(
                createAgencyCard(
                    agence
                )
            );

        }
    );

}


// ============================================================
// ÉVÉNEMENTS
// ============================================================

function setupEvents() {

    const keyword =
        document.getElementById(
            "vehiclesKeyword"
        );


    const category =
        document.getElementById(
            "vehiclesCategory"
        );


    const ville =
        document.getElementById(
            "vehiclesVille"
        );


    const commune =
        document.getElementById(
            "vehiclesCommune"
        );


    const searchButton =
        document.getElementById(
            "vehiclesSearchButton"
        );


    keyword?.addEventListener(
        "input",
        filterVehicules
    );


    category?.addEventListener(
        "change",
        filterVehicules
    );


    ville?.addEventListener(
        "change",
        filterVehicules
    );


    commune?.addEventListener(
        "input",
        filterVehicules
    );


    searchButton?.addEventListener(
        "click",
        () => {

            filterVehicules();


            document
                .getElementById(
                    "vehicules"
                )
                ?.scrollIntoView({

                    behavior:
                        "smooth"

                });

        }
    );


    keyword?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                filterVehicules();

            }

        }
    );


    // Chauffeurs

    document
        .getElementById(
            "driverVille"
        )
        ?.addEventListener(
            "change",
            filterChauffeurs
        );


    document
        .getElementById(
            "driverCommune"
        )
        ?.addEventListener(
            "input",
            filterChauffeurs
        );


    // Agences

    document
        .getElementById(
            "agencyVille"
        )
        ?.addEventListener(
            "change",
            filterAgences
        );


    document
        .getElementById(
            "agencyCommune"
        )
        ?.addEventListener(
            "input",
            filterAgences
        );

}


// ============================================================
// ANNÉE
// ============================================================

function setYear() {

    const element =
        document.getElementById(
            "vehiclesYear"
        );


    if (element) {

        element.textContent =
            new Date().getFullYear();

    }

}


// ============================================================
// INITIALISATION
// ============================================================

async function initVehicles() {

    console.log(
        "=========================================="
    );


    console.log(
        "CAMU VÉHICULES & TRANSPORT — initialisation..."
    );


    try {

        setupMobileMenu();

        setupEvents();

        setYear();

        renderCategories();

        populateCategorySelect();


        await loadVilles();


        await Promise.all([

            loadVehicules(),

            loadChauffeurs(),

            loadAgences()

        ]);


        console.log(
            "CAMU VÉHICULES & TRANSPORT — initialisation terminée."
        );


    } catch (error) {

        console.error(
            "CAMU VÉHICULES & TRANSPORT — erreur :",
            error
        );

    }

}


// ============================================================
// LANCEMENT
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initVehicles
    );

} else {

    initVehicles();

}

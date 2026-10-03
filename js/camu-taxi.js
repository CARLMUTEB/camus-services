/* ============================================================
   CAMU TAXI
   Recherche de chauffeurs + localisation + Leaflet
============================================================ */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


/* ============================================================
   CONFIGURATION
============================================================ */

const CONFIG = {

    firestoreCollection: "chauffeurs",

    citiesCollection: "villes",

    defaultCenter: [-11.6647, 27.4794], // Lubumbashi

    defaultZoom: 12,

    nearbyRadiusKm: 30,

    whatsappCountryCode: "243"

};


/* ============================================================
   ÉTAT
============================================================ */

let map = null;

let userMarker = null;

let userCircle = null;

let driverMarkers = [];

let drivers = [];

let filteredDrivers = [];

let userPosition = null;

let cities = [];

let communeData = {};

let quartierData = {};


/* ============================================================
   ZONES
============================================================ */

const MANUAL_COMMUNES = {

    "Lubumbashi": [
        "Annexe",
        "Kamalondo",
        "Kampemba",
        "Katuba",
        "Kenya",
        "Lubumbashi",
        "Ruashi"
    ],

    "Likasi": [
        "Kikula",
        "Likasi",
        "Panda",
        "Shituru"
    ],

    "Kolwezi": [
        "Dilala",
        "Manika"
    ],

    "Kipushi": [
        "Kipushi"
    ],

    "Kasumbalesa": [
        "Musumali",
        "Musoshi",
        "Lwina"
    ],

    "Fungurume": [
        "Fungurume"
    ]

};


/*
 * Les quartiers peuvent être ajoutés ici plus tard.
 *
 * Exemple :
 *
 * quartierData = {
 *     "Lubumbashi|Kamalondo": [
 *         "Quartier 1",
 *         "Quartier 2"
 *     ]
 * };
 */


/* ============================================================
   DOM
============================================================ */

const $ = (selector) => {
    return document.querySelector(selector);
};


const taxiMapElement = $("#taxiMap");

const taxiMapLoading = $("#taxiMapLoading");

const taxiNearMeButton = $("#taxiNearMeButton");

const taxiTopLocationButton = $("#taxiTopLocationButton");

const taxiAllDriversButton = $("#taxiAllDriversButton");

const taxiVille = $("#taxiVille");

const taxiCommune = $("#taxiCommune");

const taxiQuartier = $("#taxiQuartier");

const taxiSearch = $("#taxiSearch");

const taxiAvailableOnly = $("#taxiAvailableOnly");

const taxiSearchButton = $("#taxiSearchButton");

const taxiResetButton = $("#taxiResetButton");

const taxiLoading = $("#taxiLoading");

const taxiDriversList = $("#taxiDriversList");

const taxiEmpty = $("#taxiEmpty");

const taxiResultsCount = $("#taxiResultsCount");

const taxiResultsStatus = $("#taxiResultsStatus");

const taxiLocationStatus = $("#taxiLocationStatus");

const taxiMenuButton = $("#taxiMenuButton");

const taxiSidebar = $("#taxiSidebar");

const taxiSidebarOverlay = $("#taxiSidebarOverlay");

const menuTaxiNear = $("#menuTaxiNear");

const menuChauffeurs = $("#menuChauffeurs");

const menuSearch = $("#menuSearch");

const taxiCurrentYear = $("#taxiCurrentYear");


/* ============================================================
   INITIALISATION
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("CAMU TAXI — Initialisation...");

    if (taxiCurrentYear) {
        taxiCurrentYear.textContent = new Date().getFullYear();
    }

    initMap();

    initSidebar();

    initEvents();

    await loadCities();

    await loadDrivers();

    renderDrivers();

    console.log("CAMU TAXI — Initialisation terminée.");

});


/* ============================================================
   CARTE
============================================================ */

function initMap() {

    if (!taxiMapElement) {
        console.error("CAMU TAXI — Élément carte introuvable.");
        return;
    }


    if (typeof L === "undefined") {

        console.error(
            "CAMU TAXI — Leaflet n'est pas chargé."
        );

        hideMapLoading();

        return;
    }


    map = L.map("taxiMap", {

        center: CONFIG.defaultCenter,

        zoom: CONFIG.defaultZoom,

        zoomControl: true

    });


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }
    ).addTo(map);


    hideMapLoading();


    console.log(
        "CAMU TAXI — Carte initialisée."
    );

}


/* ============================================================
   CHARGEMENT DES VILLES
============================================================ */

async function loadCities() {

    if (!taxiVille) {
        return;
    }


    try {

        const snapshot = await getDocs(
            collection(db, CONFIG.citiesCollection)
        );


        cities = [];


        snapshot.forEach((docSnap) => {

            const data = docSnap.data();


            const cityName =
                data.nom ||
                data.name ||
                data.ville ||
                data.title;


            if (cityName) {

                cities.push({
                    id: docSnap.id,
                    name: String(cityName).trim()
                });

            }

        });


        /*
         * Si Firestore est vide, on garde les villes
         * principales connues par CAMU TAXI.
         */
        if (cities.length === 0) {

            cities = [
                "Lubumbashi",
                "Likasi",
                "Kipushi",
                "Kasumbalesa",
                "Kolwezi",
                "Fungurume"
            ].map((name) => ({
                id: name.toLowerCase(),
                name
            }));

        }


        cities.sort((a, b) =>
            a.name.localeCompare(
                b.name,
                "fr",
                { sensitivity: "base" }
            )
        );


        populateCities();


        console.log(
            `CAMU TAXI — ${cities.length} ville(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur villes :",
            error
        );


        /*
         * Fallback local.
         */
        cities = [
            "Lubumbashi",
            "Likasi",
            "Kipushi",
            "Kasumbalesa",
            "Kolwezi",
            "Fungurume"
        ].map((name) => ({
            id: name.toLowerCase(),
            name
        }));


        populateCities();

    }

}


/* ============================================================
   REMPLIR VILLES
============================================================ */

function populateCities() {

    if (!taxiVille) {
        return;
    }


    taxiVille.innerHTML = `
        <option value="">
            Toutes les villes
        </option>
    `;


    cities.forEach((city) => {

        const option = document.createElement("option");

        option.value = city.name;

        option.textContent = city.name;

        taxiVille.appendChild(option);

    });

}


/* ============================================================
   COMMUNES
============================================================ */

function populateCommunes(cityName) {

    if (!taxiCommune) {
        return;
    }


    taxiCommune.innerHTML = `
        <option value="">
            Toutes les communes
        </option>
    `;


    taxiQuartier.innerHTML = `
        <option value="">
            Tous les quartiers
        </option>
    `;


    taxiQuartier.disabled = true;


    if (!cityName) {

        taxiCommune.disabled = true;

        return;
    }


    const communes =
        MANUAL_COMMUNES[cityName] ||
        communeData[cityName] ||
        [];


    communes.forEach((commune) => {

        const option = document.createElement("option");

        option.value = commune;

        option.textContent = commune;

        taxiCommune.appendChild(option);

    });


    taxiCommune.disabled = communes.length === 0;

}


/* ============================================================
   QUARTIERS
============================================================ */

function populateQuartiers(cityName, communeName) {

    if (!taxiQuartier) {
        return;
    }


    taxiQuartier.innerHTML = `
        <option value="">
            Tous les quartiers
        </option>
    `;


    if (!cityName || !communeName) {

        taxiQuartier.disabled = true;

        return;
    }


    const key =
        `${cityName}|${communeName}`;


    const quartiers =
        quartierData[key] ||
        [];


    quartiers.forEach((quartier) => {

        const option = document.createElement("option");

        option.value = quartier;

        option.textContent = quartier;

        taxiQuartier.appendChild(option);

    });


    taxiQuartier.disabled =
        quartiers.length === 0;

}


/* ============================================================
   CHARGEMENT CHAUFFEURS
============================================================ */

async function loadDrivers() {

    showDriversLoading();


    try {

        const snapshot = await getDocs(
            collection(
                db,
                CONFIG.firestoreCollection
            )
        );


        drivers = [];


        snapshot.forEach((docSnap) => {

            const data = docSnap.data();


            const driver = {

                id: docSnap.id,

                ...data

            };


            /*
             * NORMALISATION DES CHAMPS
             */

            driver.nom =
                cleanString(
                    data.nom ||
                    data.name ||
                    data.nomComplet
                );


            driver.telephone =
                cleanString(
                    data.telephone ||
                    data.phone ||
                    data.whatsapp
                );


            driver.photo =
                cleanString(
                    data.photo ||
                    data.photoURL ||
                    data.photoUrl ||
                    data.image
                );


            driver.vehicule =
                cleanString(
                    data.vehicule ||
                    data.vehicle ||
                    data.typeVehicule
                );


            driver.marque =
                cleanString(
                    data.marque ||
                    data.vehicleMake
                );


            driver.modele =
                cleanString(
                    data.modele ||
                    data.model
                );


            driver.couleur =
                cleanString(
                    data.couleur ||
                    data.color
                );


            driver.plaque =
                cleanString(
                    data.plaque ||
                    data.immatriculation ||
                    data.plate
                );


            driver.ville =
                cleanString(
                    data.ville ||
                    data.city
                );


            driver.commune =
                cleanString(
                    data.commune
                );


            driver.quartier =
                cleanString(
                    data.quartier
                );


            driver.latitude =
                toNumber(
                    data.latitude ??
                    data.lat
                );


            driver.longitude =
                toNumber(
                    data.longitude ??
                    data.lng ??
                    data.lon
                );


            driver.disponible =
                Boolean(
                    data.disponible ??
                    data.available ??
                    data.isAvailable ??
                    false
                );


            driver.verifie =
                Boolean(
                    data.verifie ??
                    data.verified ??
                    data.isVerified ??
                    false
                );


            driver.lastLocationUpdate =
                data.lastLocationUpdate ||
                null;


            drivers.push(driver);

        });


        console.log(
            `CAMU TAXI — ${drivers.length} chauffeur(s) chargé(s).`
        );


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chargement chauffeurs :",
            error
        );


        drivers = [];


        setResultsStatus(
            "Impossible de charger les chauffeurs pour le moment."
        );

    }


    hideDriversLoading();

}


/* ============================================================
   RENDU DES CHAUFFEURS
============================================================ */

function renderDrivers() {

    if (!taxiDriversList) {
        return;
    }


    filteredDrivers =
        applyFilters(drivers);


    /*
     * Si une position utilisateur existe,
     * calculer les distances.
     */
    if (userPosition) {

        filteredDrivers.forEach((driver) => {

            if (
                isValidCoordinates(
                    driver.latitude,
                    driver.longitude
                )
            ) {

                driver.distance =
                    calculateDistance(
                        userPosition.lat,
                        userPosition.lng,
                        driver.latitude,
                        driver.longitude
                    );

            } else {

                driver.distance = null;

            }

        });


        /*
         * Les chauffeurs avec distance connue
         * sont placés en premier.
         */
        filteredDrivers.sort((a, b) => {

            if (a.distance === null) {
                return 1;
            }

            if (b.distance === null) {
                return -1;
            }

            return a.distance - b.distance;

        });

    }


    updateResultsCount();


    taxiDriversList.innerHTML = "";


    if (filteredDrivers.length === 0) {

        showEmpty();

        updateMapMarkers();

        return;
    }


    hideEmpty();


    filteredDrivers.forEach((driver) => {

        const card =
            createDriverCard(driver);

        taxiDriversList.appendChild(card);

    });


    updateMapMarkers();

}


/* ============================================================
   FILTRAGE
============================================================ */

function applyFilters(sourceDrivers) {

    const city =
        cleanString(
            taxiVille?.value
        ).toLowerCase();


    const commune =
        cleanString(
            taxiCommune?.value
        ).toLowerCase();


    const quartier =
        cleanString(
            taxiQuartier?.value
        ).toLowerCase();


    const search =
        cleanString(
            taxiSearch?.value
        ).toLowerCase();


    const availableOnly =
        Boolean(
            taxiAvailableOnly?.checked
        );


    return sourceDrivers.filter((driver) => {

        if (
            city &&
            driver.ville.toLowerCase() !== city
        ) {

            return false;

        }


        if (
            commune &&
            driver.commune.toLowerCase() !== commune
        ) {

            return false;

        }


        if (
            quartier &&
            driver.quartier.toLowerCase() !== quartier
        ) {

            return false;

        }


        if (
            availableOnly &&
            !driver.disponible
        ) {

            return false;

        }


        if (search) {

            const searchable = [

                driver.nom,

                driver.telephone,

                driver.vehicule,

                driver.marque,

                driver.modele,

                driver.couleur,

                driver.plaque,

                driver.ville,

                driver.commune,

                driver.quartier

            ]
                .join(" ")
                .toLowerCase();


            if (
                !searchable.includes(search)
            ) {

                return false;

            }

        }


        return true;

    });

}


/* ============================================================
   CARTE DES CHAUFFEURS
============================================================ */

function updateMapMarkers() {

    if (!map) {
        return;
    }


    /*
     * Supprimer anciens marqueurs.
     */
    driverMarkers.forEach(
        (marker) => map.removeLayer(marker)
    );


    driverMarkers = [];


    filteredDrivers.forEach((driver) => {

        if (
            !isValidCoordinates(
                driver.latitude,
                driver.longitude
            )
        ) {

            return;

        }


        const markerIcon =
            createTaxiIcon(
                driver.disponible
            );


        const marker =
            L.marker(
                [
                    driver.latitude,
                    driver.longitude
                ],
                {
                    icon: markerIcon
                }
            )
            .addTo(map);


        marker.bindPopup(
            createPopup(driver)
        );


        driverMarkers.push(marker);

    });


    /*
     * Si position utilisateur,
     * afficher le rayon.
     */
    if (userPosition) {

        showUserOnMap();

    }

}


/* ============================================================
   ICÔNE TAXI
============================================================ */

function createTaxiIcon(available) {

    const color =
        available
            ? "#19a463"
            : "#667085";


    return L.divIcon({

        className: "camu-taxi-marker",

        html: `
            <div style="
                width:38px;
                height:38px;
                border-radius:50%;
                background:${color};
                color:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                border:3px solid #fff;
                box-shadow:0 4px 12px rgba(0,0,0,.22);
                font-size:16px;
            ">
                <i class="fa-solid fa-taxi"></i>
            </div>
        `,

        iconSize: [38, 38],

        iconAnchor: [19, 19],

        popupAnchor: [0, -20]

    });

}


/* ============================================================
   POPUP CARTE
============================================================ */

function createPopup(driver) {

    const name =
        escapeHtml(
            driver.nom ||
            "Chauffeur CAMU"
        );


    const city =
        escapeHtml(
            driver.ville ||
            ""
        );


    const vehicle =
        escapeHtml(
            buildVehicleName(driver)
        );


    const phone =
        normalizePhone(
            driver.telephone
        );


    const whatsapp =
        createWhatsAppLink(
            driver,
            "Bonjour, je vous contacte via CAMU TAXI. Êtes-vous disponible ?"
        );


    return `
        <div class="taxi-popup">

            <strong>
                ${name}
                ${
                    driver.verifie
                        ? " ✓"
                        : ""
                }
            </strong>

            <span>
                ${vehicle || "Véhicule CAMU"}
            </span>

            <span>
                ${city || "Localisation non précisée"}
            </span>

            ${
                driver.distance !== null &&
                driver.distance !== undefined
                    ? `
                        <span>
                            ${formatDistance(driver.distance)}
                        </span>
                    `
                    : ""
            }

            ${
                phone
                    ? `
                        <a
                            href="${whatsapp}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i class="fa-brands fa-whatsapp"></i>
                            Contacter sur WhatsApp
                        </a>
                    `
                    : ""
            }

        </div>
    `;

}


/* ============================================================
   CARTE CHAUFFEUR
============================================================ */

function createDriverCard(driver) {

    const article =
        document.createElement("article");


    article.className =
        "taxi-driver-card";


    const photo =
        driver.photo
            ? `
                <img
                    src="${escapeAttribute(driver.photo)}"
                    alt="${escapeAttribute(driver.nom || "Chauffeur")}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >
            `
            : `
                <i class="fa-solid fa-user"></i>
            `;


    const vehicle =
        buildVehicleName(driver) ||
        "Véhicule non précisé";


    const location =
        [
            driver.quartier,
            driver.commune,
            driver.ville
        ]
            .filter(Boolean)
            .join(", ") ||
        "Localisation non précisée";


    const distance =
        driver.distance !== null &&
        driver.distance !== undefined
            ? `
                <div class="taxi-driver-distance">
                    <i class="fa-solid fa-location-arrow"></i>
                    ${formatDistance(driver.distance)}
                </div>
            `
            : "";


    const whatsapp =
        createWhatsAppLink(
            driver,
            "Bonjour, je vous contacte via CAMU TAXI. Êtes-vous disponible pour une course ?"
        );


    const phone =
        normalizePhone(
            driver.telephone
        );


    article.innerHTML = `

        <div class="taxi-driver-status ${
            driver.disponible
                ? "available"
                : "unavailable"
        }">

            ${
                driver.disponible
                    ? "Disponible"
                    : "Indisponible"
            }

        </div>


        <div class="taxi-driver-top">

            <div class="taxi-driver-photo">

                ${photo}

            </div>


            <div class="taxi-driver-name">

                <h3>

                    ${escapeHtml(
                        driver.nom ||
                        "Chauffeur CAMU"
                    )}

                    ${
                        driver.verifie
                            ? `
                                <i
                                    class="fa-solid fa-circle-check taxi-verified"
                                    title="Profil vérifié"
                                ></i>
                            `
                            : ""
                    }

                </h3>


                <div class="taxi-driver-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(location)}

                </div>

            </div>

        </div>


        <div class="taxi-driver-details">

            <div class="taxi-driver-detail">

                <span>Véhicule</span>

                <strong>
                    ${escapeHtml(vehicle)}
                </strong>

            </div>


            <div class="taxi-driver-detail">

                <span>Plaque</span>

                <strong>
                    ${escapeHtml(
                        driver.plaque ||
                        "Non renseignée"
                    )}
                </strong>

            </div>


            <div class="taxi-driver-detail">

                <span>Couleur</span>

                <strong>
                    ${escapeHtml(
                        driver.couleur ||
                        "Non renseignée"
                    )}
                </strong>

            </div>


            <div class="taxi-driver-detail">

                <span>Téléphone</span>

                <strong>
                    ${escapeHtml(
                        driver.telephone ||
                        "Non renseigné"
                    )}
                </strong>

            </div>

        </div>


        ${distance}


        <div class="taxi-driver-actions">

            ${
                whatsapp
                    ? `
                        <a
                            class="taxi-driver-action whatsapp"
                            href="${whatsapp}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <i class="fa-brands fa-whatsapp"></i>

                            WhatsApp

                        </a>
                    `
                    : `
                        <span
                            class="taxi-driver-action whatsapp"
                            style="opacity:.5;cursor:not-allowed;"
                        >

                            <i class="fa-brands fa-whatsapp"></i>

                            WhatsApp

                        </span>
                    `
            }


            ${
                phone
                    ? `
                        <a
                            class="taxi-driver-action call"
                            href="tel:${escapeAttribute(phone)}"
                        >

                            <i class="fa-solid fa-phone"></i>

                            Appeler

                        </a>
                    `
                    : `
                        <span
                            class="taxi-driver-action call"
                            style="opacity:.5;cursor:not-allowed;"
                        >

                            <i class="fa-solid fa-phone"></i>

                            Appeler

                        </span>
                    `
            }

        </div>

    `;


    return article;

}


/* ============================================================
   NOM DU VÉHICULE
============================================================ */

function buildVehicleName(driver) {

    return [

        driver.vehicule,

        driver.marque,

        driver.modele

    ]
        .filter(Boolean)
        .join(" ");

}


/* ============================================================
   WHATSAPP
============================================================ */

function createWhatsAppLink(
    driver,
    message
) {

    const phone =
        normalizePhone(
            driver.telephone
        );


    if (!phone) {
        return "";
    }


    const encodedMessage =
        encodeURIComponent(
            message
        );


    return `
        https://wa.me/${phone}?text=${encodedMessage}
    `;

}


/* ============================================================
   NORMALISER TÉLÉPHONE
============================================================ */

function normalizePhone(phone) {

    if (!phone) {
        return "";
    }


    let value =
        String(phone)
            .trim()
            .replace(/[^\d+]/g, "");


    if (value.startsWith("00")) {

        value =
            "+" +
            value.substring(2);

    }


    if (value.startsWith("+")) {

        return value.substring(1);

    }


    if (
        value.startsWith("243")
    ) {

        return value;

    }


    /*
     * Numéro local RDC :
     * 081xxxxxxx
     * 082xxxxxxx
     * 083xxxxxxx
     * 084xxxxxxx
     */

    if (
        value.startsWith("0")
    ) {

        return (
            CONFIG.whatsappCountryCode +
            value.substring(1)
        );

    }


    return value;

}


/* ============================================================
   GÉOLOCALISATION
============================================================ */

function requestUserLocation() {

    if (!navigator.geolocation) {

        showLocationError(
            "La géolocalisation n'est pas supportée par votre navigateur."
        );

        return;

    }


    setLocationStatus(
        "Recherche de votre position..."
    );


    navigator.geolocation.getCurrentPosition(

        (position) => {

            userPosition = {

                lat:
                    position.coords.latitude,

                lng:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy

            };


            console.log(
                "CAMU TAXI — Position utilisateur :",
                userPosition
            );


            showUserOnMap();


            /*
             * Recalculer distances.
             */
            renderDrivers();


            setLocationStatus(
                `Position trouvée. Recherche des chauffeurs à proximité.`
            );

            taxiResultsStatus.textContent =
                "Les chauffeurs sont classés selon leur distance approximative.";

        },


        (error) => {

            console.warn(
                "CAMU TAXI — Géolocalisation :",
                error
            );


            let message =
                "Impossible de récupérer votre position.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "L'accès à votre position a été refusé. Autorisez la localisation dans votre navigateur.";

            }


            if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                message =
                    "Votre position n'est pas disponible actuellement.";

            }


            if (
                error.code ===
                error.TIMEOUT
            ) {

                message =
                    "La recherche de votre position a expiré.";

            }


            showLocationError(message);

        },


        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );

}


/* ============================================================
   AFFICHER POSITION UTILISATEUR
============================================================ */

function showUserOnMap() {

    if (!map || !userPosition) {
        return;
    }


    const lat =
        userPosition.lat;

    const lng =
        userPosition.lng;


    if (userMarker) {

        map.removeLayer(
            userMarker
        );

    }


    if (userCircle) {

        map.removeLayer(
            userCircle
        );

    }


    userMarker =
        L.marker(
            [lat, lng],
            {

                icon:
                    L.divIcon({

                        className:
                            "camu-user-marker",

                        html: `
                            <div style="
                                width:20px;
                                height:20px;
                                border-radius:50%;
                                background:#0878d1;
                                border:4px solid white;
                                box-shadow:0 2px 8px rgba(0,0,0,.25);
                            "></div>
                        `,

                        iconSize: [20, 20],

                        iconAnchor: [10, 10]

                    })

            }
        )
        .addTo(map);


    userMarker.bindPopup(
        "Vous êtes ici"
    );


    userCircle =
        L.circle(
            [lat, lng],
            {

                radius:
                    userPosition.accuracy ||
                    100,

                color: "#0878d1",

                fillColor: "#0878d1",

                fillOpacity: 0.10,

                weight: 1

            }
        )
        .addTo(map);


    map.setView(
        [lat, lng],
        14
    );

}


/* ============================================================
   DISTANCE
============================================================ */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;


    const dLat =
        toRadians(lat2 - lat1);


    const dLon =
        toRadians(lon2 - lon1);


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            toRadians(lat1)
        ) *
        Math.cos(
            toRadians(lat2)
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


function toRadians(value) {

    return value *
        Math.PI /
        180;

}


/* ============================================================
   FORMAT DISTANCE
============================================================ */

function formatDistance(distance) {

    if (
        distance === null ||
        distance === undefined ||
        Number.isNaN(distance)
    ) {

        return "";

    }


    if (distance < 1) {

        return `${Math.round(distance * 1000)} m`;

    }


    return `${distance.toFixed(1)} km`;

}


/* ============================================================
   EVENTS
============================================================ */

function initEvents() {


    /*
     * Position
     */

    taxiNearMeButton?.addEventListener(
        "click",
        requestUserLocation
    );


    taxiTopLocationButton?.addEventListener(
        "click",
        requestUserLocation
    );


    /*
     * Voir chauffeurs
     */

    taxiAllDriversButton?.addEventListener(
        "click",
        () => {

            scrollToSection(
                "#chauffeurs"
            );

        }
    );


    /*
     * Ville
     */

    taxiVille?.addEventListener(
        "change",
        () => {

            populateCommunes(
                taxiVille.value
            );

            renderDrivers();

        }
    );


    /*
     * Commune
     */

    taxiCommune?.addEventListener(
        "change",
        () => {

            populateQuartiers(
                taxiVille.value,
                taxiCommune.value
            );

            renderDrivers();

        }
    );


    /*
     * Quartier
     */

    taxiQuartier?.addEventListener(
        "change",
        renderDrivers
    );


    /*
     * Recherche
     */

    taxiSearch?.addEventListener(
        "input",
        debounce(
            renderDrivers,
            250
        )
    );


    /*
     * Disponibilité
     */

    taxiAvailableOnly?.addEventListener(
        "change",
        renderDrivers
    );


    /*
     * Bouton recherche
     */

    taxiSearchButton?.addEventListener(
        "click",
        renderDrivers
    );


    /*
     * Reset
     */

    taxiResetButton?.addEventListener(
        "click",
        resetFilters
    );


    /*
     * Menu
     */

    menuTaxiNear?.addEventListener(
        "click",
        () => {

            closeSidebar();

            scrollToSection(
                ".taxi-hero"
            );

        }
    );


    menuChauffeurs?.addEventListener(
        "click",
        () => {

            closeSidebar();

            scrollToSection(
                "#chauffeurs"
            );

        }
    );


    menuSearch?.addEventListener(
        "click",
        () => {

            closeSidebar();

            scrollToSection(
                "#rechercher"
            );

        }
    );


}


/* ============================================================
   SIDEBAR MOBILE
============================================================ */

function initSidebar() {

    taxiMenuButton?.addEventListener(
        "click",
        openSidebar
    );


    taxiSidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );

}


function openSidebar() {

    taxiSidebar?.classList.add(
        "open"
    );


    taxiSidebarOverlay?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


function closeSidebar() {

    taxiSidebar?.classList.remove(
        "open"
    );


    taxiSidebarOverlay?.classList.remove(
        "open"
    );


    document.body.style.overflow =
        "";

}


/* ============================================================
   RESET
============================================================ */

function resetFilters() {

    if (taxiVille) {

        taxiVille.value = "";

    }


    if (taxiCommune) {

        taxiCommune.innerHTML = `
            <option value="">
                Toutes les communes
            </option>
        `;

        taxiCommune.value = "";

        taxiCommune.disabled = true;

    }


    if (taxiQuartier) {

        taxiQuartier.innerHTML = `
            <option value="">
                Tous les quartiers
            </option>
        `;

        taxiQuartier.value = "";

        taxiQuartier.disabled = true;

    }


    if (taxiSearch) {

        taxiSearch.value = "";

    }


    if (taxiAvailableOnly) {

        taxiAvailableOnly.checked =
            false;

    }


    renderDrivers();


    setResultsStatus(
        "Tous les chauffeurs CAMU sont affichés."
    );

}


/* ============================================================
   SCROLL
============================================================ */

function scrollToSection(selector) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    element.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ============================================================
   LOADING
============================================================ */

function showDriversLoading() {

    taxiLoading?.classList.remove(
        "hidden"
    );

}


function hideDriversLoading() {

    taxiLoading?.classList.add(
        "hidden"
    );

}


function hideMapLoading() {

    taxiMapLoading?.classList.add(
        "hidden"
    );

}


function showEmpty() {

    taxiEmpty?.removeAttribute(
        "hidden"
    );

}


function hideEmpty() {

    taxiEmpty?.setAttribute(
        "hidden",
        ""
    );

}


/* ============================================================
   RESULTATS
============================================================ */

function updateResultsCount() {

    if (!taxiResultsCount) {
        return;
    }


    const count =
        filteredDrivers.length;


    taxiResultsCount.textContent =
        count === 0
            ? "Aucun chauffeur trouvé"
            : count === 1
                ? "1 chauffeur trouvé"
                : `${count} chauffeurs trouvés`;

}


function setResultsStatus(message) {

    if (
        taxiResultsStatus
    ) {

        taxiResultsStatus.textContent =
            message;

    }

}


/* ============================================================
   LOCATION STATUS
============================================================ */

function setLocationStatus(message) {

    if (!taxiLocationStatus) {
        return;
    }


    taxiLocationStatus.className =
        "taxi-location-status";


    taxiLocationStatus.textContent =
        message;

}


function showLocationError(message) {

    if (!taxiLocationStatus) {
        return;
    }


    taxiLocationStatus.className =
        "taxi-location-status error";


    taxiLocationStatus.textContent =
        message;

}


/* ============================================================
   UTILITAIRES
============================================================ */

function cleanString(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).trim();

}


function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}


function isValidCoordinates(
    latitude,
    longitude
) {

    return (

        Number.isFinite(latitude) &&

        Number.isFinite(longitude) &&

        latitude >= -90 &&
        latitude <= 90 &&

        longitude >= -180 &&
        longitude <= 180

    );

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}


/* ============================================================
   DEBOUNCE
============================================================ */

function debounce(
    callback,
    delay
) {

    let timeout;


    return (...args) => {

        clearTimeout(timeout);


        timeout =
            setTimeout(
                () => callback(...args),
                delay
            );

    };

}


/* ============================================================
   EXPORTS
============================================================ */

window.CAMUTaxi = {

    getDrivers: () => drivers,

    getFilteredDrivers: () =>
        filteredDrivers,

    getUserPosition: () =>
        userPosition,

    refresh: async () => {

        await loadDrivers();

        renderDrivers();

    },

    locate: () =>
        requestUserLocation(),

    reset: () =>
        resetFilters()

};


console.log(
    "CAMU TAXI — Module chargé."
);

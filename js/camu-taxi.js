/* ============================================================
   CAMU TAXI
   Version autonome
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

    chauffeursCollection: "chauffeurs",

    villesCollection: "villes",

    defaultCenter: [
        -11.6647,
        27.4794
    ],

    defaultZoom: 12,

    whatsappCountryCode: "243"

};


/* ============================================================
   ETAT
============================================================ */

let map = null;

let drivers = [];

let filteredDrivers = [];

let cities = [];

let userPosition = null;

let userMarker = null;

let userCircle = null;

let driverMarkers = [];


/* ============================================================
   COMMUNES
============================================================ */

const COMMUNES = {

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


/* ============================================================
   QUARTIERS
   À compléter plus tard
============================================================ */

const QUARTIERS = {};


/* ============================================================
   DOM
============================================================ */

const $ = (selector) =>
    document.querySelector(selector);


const sidebar =
    $("#camuTaxiSidebar");

const overlay =
    $("#camuTaxiOverlay");

const menuButton =
    $("#camuTaxiMenuButton");

const taxiNearMeButton =
    $("#taxiNearMeButton");

const taxiTopLocationButton =
    $("#taxiTopLocationButton");

const taxiAllDriversButton =
    $("#taxiAllDriversButton");

const taxiVille =
    $("#taxiVille");

const taxiCommune =
    $("#taxiCommune");

const taxiQuartier =
    $("#taxiQuartier");

const taxiSearch =
    $("#taxiSearch");

const taxiAvailableOnly =
    $("#taxiAvailableOnly");

const taxiSearchButton =
    $("#taxiSearchButton");

const taxiResetButton =
    $("#taxiResetButton");

const taxiDriversList =
    $("#taxiDriversList");

const taxiLoading =
    $("#taxiLoading");

const taxiEmpty =
    $("#taxiEmpty");

const taxiResultsCount =
    $("#taxiResultsCount");

const taxiResultsStatus =
    $("#taxiResultsStatus");

const taxiLocationStatus =
    $("#taxiLocationStatus");

const taxiMapLoading =
    $("#taxiMapLoading");

const taxiCurrentYear =
    $("#taxiCurrentYear");


/* ============================================================
   INITIALISATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    console.log(
        "CAMU TAXI — Initialisation..."
    );


    if (taxiCurrentYear) {

        taxiCurrentYear.textContent =
            new Date().getFullYear();

    }


    initMap();

    initSidebar();

    initEvents();

    await loadCities();

    await loadDrivers();

    renderDrivers();


    console.log(
        "CAMU TAXI — Initialisation terminée."
    );

}


/* ============================================================
   CARTE
============================================================ */

function initMap() {

    const mapElement =
        $("#taxiMap");


    if (!mapElement) {

        console.error(
            "CAMU TAXI — Carte introuvable."
        );

        return;

    }


    if (
        typeof L === "undefined"
    ) {

        console.error(
            "CAMU TAXI — Leaflet non chargé."
        );

        hideMapLoading();

        return;

    }


    map = L.map(
        "taxiMap",
        {
            center:
                CONFIG.defaultCenter,

            zoom:
                CONFIG.defaultZoom
        }
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    hideMapLoading();


    console.log(
        "CAMU TAXI — Carte initialisée."
    );

}


/* ============================================================
   VILLES FIRESTORE
============================================================ */

async function loadCities() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    CONFIG.villesCollection
                )
            );


        cities = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                const name =
                    data.nom ||
                    data.name ||
                    data.ville ||
                    data.title;


                if (name) {

                    cities.push(
                        String(name).trim()
                    );

                }

            }
        );


        /*
         * Si aucune ville n'est trouvée,
         * utiliser les villes CAMU.
         */

        if (
            cities.length === 0
        ) {

            cities = [
                "Lubumbashi",
                "Likasi",
                "Kipushi",
                "Kasumbalesa",
                "Kolwezi",
                "Fungurume"
            ];

        }


        cities =
            [...new Set(cities)]
                .sort(
                    (a, b) =>
                        a.localeCompare(
                            b,
                            "fr",
                            {
                                sensitivity:
                                    "base"
                            }
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


        cities = [
            "Lubumbashi",
            "Likasi",
            "Kipushi",
            "Kasumbalesa",
            "Kolwezi",
            "Fungurume"
        ];


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


    cities.forEach(
        (city) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                city;

            option.textContent =
                city;


            taxiVille.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   COMMUNES
============================================================ */

function populateCommunes(
    city
) {

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


    taxiQuartier.disabled =
        true;


    if (!city) {

        taxiCommune.disabled =
            true;

        return;

    }


    const communes =
        COMMUNES[city] || [];


    communes.forEach(
        (commune) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                commune;

            option.textContent =
                commune;


            taxiCommune.appendChild(
                option
            );

        }
    );


    taxiCommune.disabled =
        communes.length === 0;

}


/* ============================================================
   QUARTIERS
============================================================ */

function populateQuartiers(
    city,
    commune
) {

    if (!taxiQuartier) {
        return;
    }


    taxiQuartier.innerHTML = `
        <option value="">
            Tous les quartiers
        </option>
    `;


    if (
        !city ||
        !commune
    ) {

        taxiQuartier.disabled =
            true;

        return;

    }


    const key =
        `${city}|${commune}`;


    const quartiers =
        QUARTIERS[key] || [];


    quartiers.forEach(
        (quartier) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                quartier;

            option.textContent =
                quartier;


            taxiQuartier.appendChild(
                option
            );

        }
    );


    taxiQuartier.disabled =
        quartiers.length === 0;

}


/* ============================================================
   CHAUFFEURS FIRESTORE
============================================================ */

async function loadDrivers() {

    showDriversLoading();


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    CONFIG.chauffeursCollection
                )
            );


        drivers = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                drivers.push(
                    normalizeDriver(
                        docSnap.id,
                        data
                    )
                );

            }
        );


        console.log(
            `CAMU TAXI — ${drivers.length} chauffeur(s) chargé(s).`
        );


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chauffeurs :",
            error
        );


        drivers = [];


        setResultsStatus(
            "Impossible de charger les chauffeurs."
        );

    }


    hideDriversLoading();

}


/* ============================================================
   NORMALISATION
============================================================ */

function normalizeDriver(
    id,
    data
) {

    return {

        id,

        nom:
            clean(
                data.nom ||
                data.name ||
                data.nomComplet
            ),

        telephone:
            clean(
                data.telephone ||
                data.phone ||
                data.whatsapp
            ),

        photo:
            clean(
                data.photo ||
                data.photoURL ||
                data.photoUrl ||
                data.image
            ),

        vehicule:
            clean(
                data.vehicule ||
                data.vehicle ||
                data.typeVehicule
            ),

        marque:
            clean(
                data.marque ||
                data.vehicleMake
            ),

        modele:
            clean(
                data.modele ||
                data.model
            ),

        couleur:
            clean(
                data.couleur ||
                data.color
            ),

        plaque:
            clean(
                data.plaque ||
                data.immatriculation ||
                data.plate
            ),

        ville:
            clean(
                data.ville ||
                data.city
            ),

        commune:
            clean(
                data.commune
            ),

        quartier:
            clean(
                data.quartier
            ),

        latitude:
            number(
                data.latitude ??
                data.lat
            ),

        longitude:
            number(
                data.longitude ??
                data.lng ??
                data.lon
            ),

        disponible:
            Boolean(
                data.disponible ??
                data.available ??
                data.isAvailable ??
                false
            ),

        verifie:
            Boolean(
                data.verifie ??
                data.verified ??
                data.isVerified ??
                false
            ),

        distance:
            null

    };

}


/* ============================================================
   RENDU
============================================================ */

function renderDrivers() {

    filteredDrivers =
        applyFilters(
            drivers
        );


    /*
     * Calcul des distances
     */

    if (userPosition) {

        filteredDrivers.forEach(
            (driver) => {

                if (
                    validCoordinates(
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

                    driver.distance =
                        null;

                }

            }
        );


        filteredDrivers.sort(
            (a, b) => {

                if (
                    a.distance === null
                ) {
                    return 1;
                }

                if (
                    b.distance === null
                ) {
                    return -1;
                }

                return (
                    a.distance -
                    b.distance
                );

            }
        );

    }


    updateCount();


    taxiDriversList.innerHTML =
        "";


    if (
        filteredDrivers.length === 0
    ) {

        showEmpty();

    } else {

        hideEmpty();


        filteredDrivers.forEach(
            (driver) => {

                taxiDriversList.appendChild(
                    createDriverCard(
                        driver
                    )
                );

            }
        );

    }


    updateMapMarkers();

}


/* ============================================================
   FILTRES
============================================================ */

function applyFilters(
    list
) {

    const city =
        clean(
            taxiVille?.value
        ).toLowerCase();


    const commune =
        clean(
            taxiCommune?.value
        ).toLowerCase();


    const quartier =
        clean(
            taxiQuartier?.value
        ).toLowerCase();


    const search =
        clean(
            taxiSearch?.value
        ).toLowerCase();


    const availableOnly =
        Boolean(
            taxiAvailableOnly?.checked
        );


    return list.filter(
        (driver) => {

            if (
                city &&
                driver.ville.toLowerCase()
                    !== city
            ) {

                return false;

            }


            if (
                commune &&
                driver.commune.toLowerCase()
                    !== commune
            ) {

                return false;

            }


            if (
                quartier &&
                driver.quartier.toLowerCase()
                    !== quartier
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

                const text = [

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
                    !text.includes(
                        search
                    )
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}


/* ============================================================
   CARTE MARQUEURS
============================================================ */

function updateMapMarkers() {

    if (!map) {
        return;
    }


    driverMarkers.forEach(
        (marker) => {

            map.removeLayer(
                marker
            );

        }
    );


    driverMarkers = [];


    filteredDrivers.forEach(
        (driver) => {

            if (
                !validCoordinates(
                    driver.latitude,
                    driver.longitude
                )
            ) {

                return;

            }


            const marker =
                L.marker(
                    [
                        driver.latitude,
                        driver.longitude
                    ],
                    {
                        icon:
                            createTaxiIcon(
                                driver.disponible
                            )
                    }
                )
                .addTo(map);


            marker.bindPopup(
                createPopup(
                    driver
                )
            );


            driverMarkers.push(
                marker
            );

        }
    );


    if (userPosition) {

        showUserPosition();

    }

}


/* ============================================================
   ICONE TAXI
============================================================ */

function createTaxiIcon(
    available
) {

    const color =
        available
            ? "#19a463"
            : "#667085";


    return L.divIcon({

        className:
            "camu-taxi-map-marker",

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

        iconSize:
            [38, 38],

        iconAnchor:
            [19, 19]

    });

}


/* ============================================================
   POPUP
============================================================ */

function createPopup(
    driver
) {

    const whatsapp =
        whatsappLink(
            driver,
            "Bonjour, je vous contacte via CAMU TAXI. Êtes-vous disponible ?"
        );


    return `
        <div class="camu-taxi-popup">

            <strong>
                ${escapeHtml(
                    driver.nom ||
                    "Chauffeur CAMU"
                )}

                ${
                    driver.verifie
                        ? " ✓"
                        : ""
                }
            </strong>


            <span>
                ${escapeHtml(
                    vehicleName(
                        driver
                    ) ||
                    "Véhicule non précisé"
                )}
            </span>


            <span>
                ${escapeHtml(
                    driver.ville ||
                    "Localisation non précisée"
                )}
            </span>


            ${
                driver.distance !== null
                    ? `
                        <span>
                            ${formatDistance(
                                driver.distance
                            )}
                        </span>
                    `
                    : ""
            }


            ${
                whatsapp
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

function createDriverCard(
    driver
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "camu-taxi-driver-card";


    const location = [

        driver.quartier,
        driver.commune,
        driver.ville

    ]
        .filter(Boolean)
        .join(", ") ||
        "Localisation non précisée";


    const vehicle =
        vehicleName(
            driver
        ) ||
        "Véhicule non précisé";


    const phone =
        normalizePhone(
            driver.telephone
        );


    const whatsapp =
        whatsappLink(
            driver,
            "Bonjour, je vous contacte via CAMU TAXI. Êtes-vous disponible pour une course ?"
        );


    card.innerHTML = `

        <div class="camu-taxi-driver-status ${
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


        <div class="camu-taxi-driver-top">

            <div class="camu-taxi-driver-photo">

                ${
                    driver.photo
                        ? `
                            <img
                                src="${escapeAttribute(
                                    driver.photo
                                )}"
                                alt="${escapeAttribute(
                                    driver.nom ||
                                    "Chauffeur"
                                )}"
                                loading="lazy"
                            >
                        `
                        : `
                            <i class="fa-solid fa-user"></i>
                        `
                }

            </div>


            <div class="camu-taxi-driver-name">

                <h3>

                    ${escapeHtml(
                        driver.nom ||
                        "Chauffeur CAMU"
                    )}

                    ${
                        driver.verifie
                            ? `
                                <i
                                    class="fa-solid fa-circle-check camu-taxi-verified"
                                    title="Profil vérifié"
                                ></i>
                            `
                            : ""
                    }

                </h3>


                <div class="camu-taxi-driver-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(
                        location
                    )}

                </div>

            </div>

        </div>


        <div class="camu-taxi-driver-details">

            <div class="camu-taxi-driver-detail">

                <span>
                    Véhicule
                </span>

                <strong>
                    ${escapeHtml(
                        vehicle
                    )}
                </strong>

            </div>


            <div class="camu-taxi-driver-detail">

                <span>
                    Plaque
                </span>

                <strong>
                    ${escapeHtml(
                        driver.plaque ||
                        "Non renseignée"
                    )}
                </strong>

            </div>


            <div class="camu-taxi-driver-detail">

                <span>
                    Couleur
                </span>

                <strong>
                    ${escapeHtml(
                        driver.couleur ||
                        "Non renseignée"
                    )}
                </strong>

            </div>


            <div class="camu-taxi-driver-detail">

                <span>
                    Téléphone
                </span>

                <strong>
                    ${escapeHtml(
                        driver.telephone ||
                        "Non renseigné"
                    )}
                </strong>

            </div>

        </div>


        ${
            driver.distance !== null
                ? `
                    <div class="camu-taxi-driver-distance">

                        <i class="fa-solid fa-location-arrow"></i>

                        ${formatDistance(
                            driver.distance
                        )}

                    </div>
                `
                : ""
        }


        <div class="camu-taxi-driver-actions">

            ${
                whatsapp
                    ? `
                        <a
                            class="camu-taxi-driver-action whatsapp"
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
                            class="camu-taxi-driver-action whatsapp"
                            style="opacity:.45;"
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
                            class="camu-taxi-driver-action call"
                            href="tel:${escapeAttribute(
                                phone
                            )}"
                        >

                            <i class="fa-solid fa-phone"></i>

                            Appeler

                        </a>
                    `
                    : `
                        <span
                            class="camu-taxi-driver-action call"
                            style="opacity:.45;"
                        >

                            <i class="fa-solid fa-phone"></i>

                            Appeler

                        </span>
                    `
            }

        </div>

    `;


    return card;

}


/* ============================================================
   VEHICULE
============================================================ */

function vehicleName(
    driver
) {

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

function whatsappLink(
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


    return (
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
            message
        )
    );

}


/* ============================================================
   TELEPHONE
============================================================ */

function normalizePhone(
    phone
) {

    if (!phone) {
        return "";
    }


    let value =
        String(phone)
            .trim()
            .replace(/[^\d+]/g, "");


    if (
        value.startsWith("00")
    ) {

        value =
            "+" +
            value.substring(2);

    }


    if (
        value.startsWith("+")
    ) {

        return value.substring(1);

    }


    if (
        value.startsWith("243")
    ) {

        return value;

    }


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
   GEOLOCALISATION
============================================================ */

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        showLocationError(
            "La géolocalisation n'est pas disponible sur ce navigateur."
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


            showUserPosition();

            renderDrivers();


            setLocationStatus(
                "Position trouvée. Les chauffeurs sont classés par distance."
            );


            setResultsStatus(
                "Les chauffeurs sont classés selon leur distance approximative."
            );

        },


        (error) => {

            console.warn(
                "CAMU TAXI — Erreur GPS :",
                error
            );


            let message =
                "Impossible de récupérer votre position.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "La localisation est refusée. Autorisez la position dans votre navigateur.";

            }


            showLocationError(
                message
            );

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                60000

        }

    );

}


/* ============================================================
   POSITION UTILISATEUR SUR CARTE
============================================================ */

function showUserPosition() {

    if (
        !map ||
        !userPosition
    ) {
        return;
    }


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
            [
                userPosition.lat,
                userPosition.lng
            ],
            {

                icon:
                    L.divIcon({

                        className:
                            "camu-taxi-user-marker",

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

                        iconSize:
                            [20,20],

                        iconAnchor:
                            [10,10]

                    })

            }
        )
        .addTo(map);


    userMarker.bindPopup(
        "Vous êtes ici"
    );


    userCircle =
        L.circle(
            [
                userPosition.lat,
                userPosition.lng
            ],
            {

                radius:
                    userPosition.accuracy ||
                    100,

                color:
                    "#0878d1",

                fillColor:
                    "#0878d1",

                fillOpacity:
                    .10,

                weight:
                    1

            }
        )
        .addTo(map);


    map.setView(
        [
            userPosition.lat,
            userPosition.lng
        ],
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

    const R = 6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );

}


function toRadians(
    value
) {

    return (
        value *
        Math.PI /
        180
    );

}


/* ============================================================
   DISTANCE AFFICHAGE
============================================================ */

function formatDistance(
    distance
) {

    if (
        distance === null ||
        distance === undefined
    ) {

        return "";

    }


    if (
        distance < 1
    ) {

        return (
            Math.round(
                distance * 1000
            ) +
            " m"
        );

    }


    return (
        distance.toFixed(1) +
        " km"
    );

}


/* ============================================================
   EVENTS
============================================================ */

function initEvents() {


    taxiNearMeButton?.addEventListener(
        "click",
        locateUser
    );


    taxiTopLocationButton?.addEventListener(
        "click",
        locateUser
    );


    taxiAllDriversButton?.addEventListener(
        "click",
        () => {

            scrollTo(
                "#chauffeurs"
            );

        }
    );


    taxiVille?.addEventListener(
        "change",
        () => {

            populateCommunes(
                taxiVille.value
            );

            renderDrivers();

        }
    );


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


    taxiQuartier?.addEventListener(
        "change",
        renderDrivers
    );


    taxiSearch?.addEventListener(
        "input",
        debounce(
            renderDrivers,
            250
        )
    );


    taxiAvailableOnly?.addEventListener(
        "change",
        renderDrivers
    );


    taxiSearchButton?.addEventListener(
        "click",
        renderDrivers
    );


    taxiResetButton?.addEventListener(
        "click",
        resetFilters
    );


    $("#menuTaxiNear")
        ?.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                closeSidebar();

                scrollTo(
                    ".camu-taxi-hero"
                );

            }
        );


    $("#menuChauffeurs")
        ?.addEventListener(
            "click",
            closeSidebar
        );


    $("#menuSearch")
        ?.addEventListener(
            "click",
            closeSidebar
        );

}


/* ============================================================
   SIDEBAR
============================================================ */

function initSidebar() {

    menuButton?.addEventListener(
        "click",
        openSidebar
    );


    overlay?.addEventListener(
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

    sidebar?.classList.add(
        "open"
    );

    overlay?.classList.add(
        "open"
    );

    document.body.style.overflow =
        "hidden";

}


function closeSidebar() {

    sidebar?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
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

        taxiVille.value =
            "";

    }


    if (taxiCommune) {

        taxiCommune.innerHTML = `
            <option value="">
                Toutes les communes
            </option>
        `;

        taxiCommune.disabled =
            true;

    }


    if (taxiQuartier) {

        taxiQuartier.innerHTML = `
            <option value="">
                Tous les quartiers
            </option>
        `;

        taxiQuartier.disabled =
            true;

    }


    if (taxiSearch) {

        taxiSearch.value =
            "";

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
   AFFICHAGE
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


function updateCount() {

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


/* ============================================================
   STATUS
============================================================ */

function setResultsStatus(
    message
) {

    if (taxiResultsStatus) {

        taxiResultsStatus.textContent =
            message;

    }

}


function setLocationStatus(
    message
) {

    if (taxiLocationStatus) {

        taxiLocationStatus.className =
            "camu-taxi-location-status";

        taxiLocationStatus.textContent =
            message;

    }

}


function showLocationError(
    message
) {

    if (taxiLocationStatus) {

        taxiLocationStatus.className =
            "camu-taxi-location-status error";

        taxiLocationStatus.textContent =
            message;

    }

}


/* ============================================================
   SCROLL
============================================================ */

function scrollTo(
    selector
) {

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
   UTILITAIRES
============================================================ */

function clean(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    ).trim();

}


function number(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const result =
        Number(value);


    return Number.isFinite(
        result
    )
        ? result
        : null;

}


function validCoordinates(
    lat,
    lng
) {

    return (

        Number.isFinite(lat) &&

        Number.isFinite(lng) &&

        lat >= -90 &&
        lat <= 90 &&

        lng >= -180 &&
        lng <= 180

    );

}


/* ============================================================
   SECURITE HTML
============================================================ */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
   DEBOUNCE
============================================================ */

function debounce(
    callback,
    delay
) {

    let timer;


    return (...args) => {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () => callback(...args),
                delay
            );

    };

}


/* ============================================================
   EXPORT
============================================================ */

window.CAMUTaxi = {

    refresh: async () => {

        await loadDrivers();

        renderDrivers();

    },

    locate:
        locateUser,

    reset:
        resetFilters,

    getDrivers:
        () => drivers,

    getFilteredDrivers:
        () => filteredDrivers,

    getUserPosition:
        () => userPosition

};


console.log(
    "CAMU TAXI — Module chargé."
);

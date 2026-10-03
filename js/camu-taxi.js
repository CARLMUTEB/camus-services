import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CAMU TAXI BOOKING — V1
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const villeSelect =
    document.getElementById("taxiVille");

const communeSelect =
    document.getElementById("taxiCommune");

const quartierSelect =
    document.getElementById("taxiQuartier");

const searchInput =
    document.getElementById("taxiSearch");

const availableOnly =
    document.getElementById("taxiAvailableOnly");

const resetButton =
    document.getElementById("taxiResetButton");

const nearMeButton =
    document.getElementById("taxiNearMeButton");

const driversList =
    document.getElementById("taxiDriversList");

const loading =
    document.getElementById("taxiLoading");

const empty =
    document.getElementById("taxiEmpty");

const resultsCount =
    document.getElementById("taxiResultsCount");

const resultsStatus =
    document.getElementById("taxiResultsStatus");

const locationStatus =
    document.getElementById("taxiLocationStatus");

const mapStatus =
    document.getElementById("taxiMapStatus");

const locationMessage =
    document.getElementById("taxiLocationMessage");


// =====================================================
// VARIABLES
// =====================================================

let chauffeurs = [];

let villes = [];

let userLatitude = null;

let userLongitude = null;

let userAccuracy = null;

let userMarker = null;

let driverMarkers = [];

let taxiMap = null;


// =====================================================
// COMMUNES / QUARTIERS
// =====================================================

const zonesParVille = {

    "Lubumbashi": {

        "Annexe": [],

        "Kamalondo": [],

        "Kampemba": [],

        "Katuba": [],

        "Kenya": [],

        "Lubumbashi": [],

        "Ruashi": []

    },


    "Likasi": {

        "Kikula": [],

        "Likasi": [],

        "Panda": [],

        "Shituru": []

    },


    "Kolwezi": {

        "Dilala": [],

        "Manika": []

    },


    "Kipushi": {

        "Kipushi": []

    },


    "Kasumbalesa": {

        "Musumali": [],

        "Musoshi": [],

        "Lwina": []

    },


    "Fungurume": {

        "Fungurume": []

    }

};


// =====================================================
// INITIALISATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initTaxi
);


async function initTaxi() {

    console.log(
        "CAMU TAXI — Initialisation..."
    );


    initMap();

    setupEvents();

    await loadVilles();

    await loadChauffeurs();

    applyFilters();

}


// =====================================================
// CARTE
// =====================================================

function initMap() {

    const mapElement =
        document.getElementById("taxiMap");


    if (!mapElement) return;


    taxiMap =
        L.map(
            "taxiMap",
            {
                zoomControl: true
            }
        ).setView(
            [-11.6647, 27.4794],
            10
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(taxiMap);


    console.log(
        "CAMU TAXI — Carte initialisée."
    );

}


// =====================================================
// EVENTS
// =====================================================

function setupEvents() {

    villeSelect.addEventListener(
        "change",
        handleVilleChange
    );


    communeSelect.addEventListener(
        "change",
        handleCommuneChange
    );


    quartierSelect.addEventListener(
        "change",
        applyFilters
    );


    searchInput.addEventListener(
        "input",
        applyFilters
    );


    availableOnly.addEventListener(
        "change",
        applyFilters
    );


    resetButton.addEventListener(
        "click",
        resetFilters
    );


    nearMeButton.addEventListener(
        "click",
        activateLocation
    );

}


// =====================================================
// VILLES FIRESTORE
// =====================================================

async function loadVilles() {

    try {

        villeSelect.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;


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


                const nom =
                    data.nom ||
                    data.name ||
                    data.ville ||
                    data.label;


                if (!nom) return;


                villes.push({

                    id: docSnap.id,

                    nom:
                        String(nom).trim()

                });

            }
        );


        const uniqueVilles =
            [
                ...new Map(
                    villes.map(
                        ville => [
                            normalize(
                                ville.nom
                            ),
                            ville
                        ]
                    )
                ).values()
            ];


        uniqueVilles.sort(
            (a, b) =>
                a.nom.localeCompare(
                    b.nom,
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                )
        );


        villeSelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        uniqueVilles.forEach(
            ville => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    ville.nom;


                option.textContent =
                    ville.nom;


                villeSelect.appendChild(
                    option
                );

            }
        );


        console.log(
            `CAMU TAXI — ${uniqueVilles.length} ville(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur villes :",
            error
        );


        villeSelect.innerHTML = `
            <option value="">
                Erreur de chargement
            </option>
        `;

    }

}


// =====================================================
// CHAUFFEURS FIRESTORE
// =====================================================

async function loadChauffeurs() {

    try {

        loading.classList.remove(
            "hidden"
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

                chauffeurs.push({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        console.log(
            `CAMU TAXI — ${chauffeurs.length} chauffeur(s) chargé(s).`
        );


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chauffeurs :",
            error
        );


        resultsStatus.textContent =
            "Impossible de charger les chauffeurs.";


    } finally {

        loading.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// VILLE
// =====================================================

function handleVilleChange() {

    const ville =
        villeSelect.value;


    resetSelect(
        communeSelect,
        "Toutes les communes"
    );


    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    communeSelect.disabled =
        true;


    quartierSelect.disabled =
        true;


    if (!ville) {

        applyFilters();

        return;

    }


    const communes =
        findCommunes(ville);


    if (!communes.length) {

        applyFilters();

        return;

    }


    communeSelect.disabled =
        false;


    communes.forEach(
        commune => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                commune;


            option.textContent =
                commune;


            communeSelect.appendChild(
                option
            );

        }
    );


    applyFilters();

}


// =====================================================
// COMMUNE
// =====================================================

function handleCommuneChange() {

    const ville =
        villeSelect.value;


    const commune =
        communeSelect.value;


    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    quartierSelect.disabled =
        true;


    if (
        !ville ||
        !commune
    ) {

        applyFilters();

        return;

    }


    const quartiers =
        findQuartiers(
            ville,
            commune
        );


    if (!quartiers.length) {

        applyFilters();

        return;

    }


    quartierSelect.disabled =
        false;


    quartiers.forEach(
        quartier => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                quartier;


            option.textContent =
                quartier;


            quartierSelect.appendChild(
                option
            );

        }
    );


    applyFilters();

}


// =====================================================
// ZONES
// =====================================================

function findCommunes(ville) {

    const key =
        findZoneKey(ville);


    if (!key) return [];


    return Object.keys(
        zonesParVille[key]
    );

}


function findQuartiers(
    ville,
    commune
) {

    const key =
        findZoneKey(ville);


    if (!key) return [];


    return (
        zonesParVille[key]?.[
            commune
        ] || []
    );

}


function findZoneKey(ville) {

    const normalized =
        normalize(ville);


    return Object.keys(
        zonesParVille
    ).find(
        key =>
            normalize(key) ===
            normalized
    );

}


// =====================================================
// FILTRES
// =====================================================

function applyFilters() {

    const ville =
        villeSelect.value;


    const commune =
        communeSelect.value;


    const quartier =
        quartierSelect.value;


    const search =
        normalize(
            searchInput.value
        );


    const onlyAvailable =
        availableOnly.checked;


    let results =
        [...chauffeurs];


    if (ville) {

        results =
            results.filter(
                chauffeur =>
                    normalize(
                        chauffeur.ville
                    ) ===
                    normalize(ville)
            );

    }


    if (commune) {

        results =
            results.filter(
                chauffeur =>
                    normalize(
                        chauffeur.commune
                    ) ===
                    normalize(commune)
            );

    }


    if (quartier) {

        results =
            results.filter(
                chauffeur =>
                    normalize(
                        chauffeur.quartier
                    ) ===
                    normalize(quartier)
            );

    }


    if (search) {

        results =
            results.filter(
                chauffeur => {

                    const nom =
                        normalize(
                            chauffeur.nom ||
                            chauffeur.name ||
                            chauffeur.displayName
                        );


                    return nom.includes(
                        search
                    );

                }
            );

    }


    if (onlyAvailable) {

        results =
            results.filter(
                chauffeur =>
                    chauffeur.disponible === true
            );

    }


    // Trier par distance
    if (
        userLatitude !== null &&
        userLongitude !== null
    ) {

        results.sort(
            (a, b) => {

                const distanceA =
                    calculateDistance(
                        userLatitude,
                        userLongitude,
                        a.latitude,
                        a.longitude
                    );


                const distanceB =
                    calculateDistance(
                        userLatitude,
                        userLongitude,
                        b.latitude,
                        b.longitude
                    );


                return (
                    (distanceA ?? Infinity) -
                    (distanceB ?? Infinity)
                );

            }
        );

    }


    renderDrivers(
        results
    );


    renderDriverMarkers(
        results
    );

}


// =====================================================
// AFFICHER CHAUFFEURS
// =====================================================

function renderDrivers(
    results
) {

    driversList.innerHTML =
        "";


    resultsCount.textContent =
        `${results.length} chauffeur(s)`;


    if (!results.length) {

        empty.classList.remove(
            "hidden"
        );

        return;

    }


    empty.classList.add(
        "hidden"
    );


    results.forEach(
        chauffeur => {

            driversList.appendChild(
                createDriverCard(
                    chauffeur
                )
            );

        }
    );

}


// =====================================================
// CARTE CHAUFFEUR
// =====================================================

function createDriverCard(
    chauffeur
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "taxi-driver-card";


    const nom =
        chauffeur.nom ||
        chauffeur.name ||
        chauffeur.displayName ||
        "Chauffeur CAMU";


    const photo =
        validImage(
            chauffeur.photo
        )
            ? chauffeur.photo
            : validImage(
                chauffeur.photoURL
            )
                ? chauffeur.photoURL
                : "";


    const vehicle =
        [
            chauffeur.marque,
            chauffeur.modele
        ]
        .filter(Boolean)
        .join(" ");


    const location =
        [
            chauffeur.ville,
            chauffeur.commune,
            chauffeur.quartier
        ]
        .filter(Boolean)
        .join(" — ");


    const disponible =
        chauffeur.disponible === true;


    const whatsapp =
        chauffeur.whatsapp ||
        chauffeur.telephone ||
        chauffeur.phone ||
        "";


    const phone =
        cleanPhoneNumber(
            whatsapp
        );


    const whatsappLink =
        phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(
                "Bonjour, je vous contacte via CAMU TAXI BOOKING. Je souhaite prendre un taxi."
            )}`
            : "";


    let distanceHTML =
        "";


    if (
        userLatitude !== null &&
        userLongitude !== null
    ) {

        const distance =
            calculateDistance(
                userLatitude,
                userLongitude,
                chauffeur.latitude,
                chauffeur.longitude
            );


        if (distance !== null) {

            distanceHTML = `
                <div class="taxi-distance">
                    <i class="fa-solid fa-location-arrow"></i>
                    ${formatDistance(distance)}
                </div>
            `;

        }

    }


    card.innerHTML = `

        <div class="taxi-driver-photo">

            ${
                photo
                    ? `
                        <img
                            src="${escapeHTML(photo)}"
                            alt="${escapeHTML(nom)}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="taxi-photo-placeholder">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    `
            }


            <span class="
                taxi-availability
                ${disponible
                    ? "available"
                    : "unavailable"}
            ">

                <span></span>

                ${
                    disponible
                        ? "Disponible"
                        : "Indisponible"
                }

            </span>

        </div>


        <div class="taxi-driver-content">

            <div class="taxi-driver-name">

                <h3>
                    ${escapeHTML(nom)}
                </h3>


                ${
                    chauffeur.verified === true
                        ? `
                            <i
                                class="fa-solid fa-circle-check taxi-verified"
                                title="Chauffeur vérifié"
                            ></i>
                        `
                        : ""
                }

            </div>


            ${
                vehicle
                    ? `
                        <div class="taxi-info-line">

                            <i class="fa-solid fa-car"></i>

                            ${escapeHTML(vehicle)}

                        </div>
                    `
                    : ""
            }


            ${
                chauffeur.plaque
                    ? `
                        <div class="taxi-info-line">

                            <i class="fa-solid fa-id-card"></i>

                            ${escapeHTML(
                                chauffeur.plaque
                            )}

                        </div>
                    `
                    : ""
            }


            ${
                location
                    ? `
                        <div class="taxi-info-line">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHTML(
                                location
                            )}

                        </div>
                    `
                    : ""
            }


            ${distanceHTML}


            <div class="taxi-driver-actions">

                ${
                    whatsappLink
                        ? `
                            <a
                                href="${whatsappLink}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="taxi-whatsapp-button"
                            >

                                <i class="fa-brands fa-whatsapp"></i>

                                Contacter sur WhatsApp

                            </a>
                        `
                        : `
                            <button
                                class="taxi-disabled-button"
                                disabled
                            >
                                WhatsApp indisponible
                            </button>
                        `
                }

            </div>

        </div>

    `;


    return card;

}


// =====================================================
// MARQUEURS CHAUFFEURS
// =====================================================

function renderDriverMarkers(
    results
) {

    if (!taxiMap) return;


    driverMarkers.forEach(
        marker => {

            taxiMap.removeLayer(
                marker
            );

        }
    );


    driverMarkers = [];


    results.forEach(
        chauffeur => {

            const lat =
                Number(
                    chauffeur.latitude
                );


            const lon =
                Number(
                    chauffeur.longitude
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
            ) {
                return;
            }


            const nom =
                chauffeur.nom ||
                chauffeur.name ||
                "Chauffeur CAMU";


            const disponible =
                chauffeur.disponible === true;


            const marker =
                L.marker(
                    [lat, lon]
                );


            const whatsapp =
                cleanPhoneNumber(
                    chauffeur.whatsapp ||
                    chauffeur.telephone ||
                    chauffeur.phone ||
                    ""
                );


            const whatsappLink =
                whatsapp
                    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                        "Bonjour, je vous contacte via CAMU TAXI BOOKING."
                    )}`
                    : "#";


            marker.bindPopup(`

                <div class="taxi-popup">

                    <strong>
                        ${escapeHTML(nom)}
                    </strong>

                    <span>
                        ${disponible
                            ? "🟢 Disponible"
                            : "⚪ Indisponible"}
                    </span>

                    ${
                        chauffeur.marque ||
                        chauffeur.modele
                            ? `
                                <small>
                                    ${escapeHTML(
                                        [
                                            chauffeur.marque,
                                            chauffeur.modele
                                        ]
                                        .filter(Boolean)
                                        .join(" ")
                                    )}
                                </small>
                            `
                            : ""
                    }


                    ${
                        whatsapp
                            ? `
                                <a
                                    href="${whatsappLink}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i class="fa-brands fa-whatsapp"></i>
                                    WhatsApp
                                </a>
                            `
                            : ""
                    }

                </div>

            `);


            marker.addTo(
                taxiMap
            );


            driverMarkers.push(
                marker
            );

        }
    );

}


// =====================================================
// GEOLOCALISATION
// =====================================================

function activateLocation() {

    if (
        !navigator.geolocation
    ) {

        showLocationMessage(
            "La géolocalisation n'est pas disponible sur cet appareil.",
            "error"
        );

        return;

    }


    nearMeButton.disabled =
        true;


    nearMeButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Localisation...

    `;


    showLocationMessage(
        "Recherche de votre position...",
        "loading"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            userLatitude =
                position.coords.latitude;


            userLongitude =
                position.coords.longitude;


            userAccuracy =
                position.coords.accuracy;


            console.log(
                "CAMU TAXI — Latitude :",
                userLatitude
            );


            console.log(
                "CAMU TAXI — Longitude :",
                userLongitude
            );


            console.log(
                "CAMU TAXI — Précision :",
                userAccuracy
            );


            showUserPosition();


            centerMapOnUser();


            locationStatus.textContent =
                "Votre position est active. Les chauffeurs sont classés par proximité.";


            mapStatus.textContent =
                "Position active";


            showLocationMessage(
                "Position activée. Les chauffeurs proches sont maintenant affichés en priorité.",
                "success"
            );


            applyFilters();


            nearMeButton.disabled =
                false;


            nearMeButton.innerHTML = `

                <i class="fa-solid fa-location-crosshairs"></i>

                Ma position est active

            `;

        },


        error => {

            console.error(
                "CAMU TAXI — Erreur géolocalisation :",
                error
            );


            let message =
                "Impossible d'obtenir votre position.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                message =
                    "L'accès à la localisation a été refusé. Autorisez la localisation dans votre navigateur.";

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


            showLocationMessage(
                message,
                "error"
            );


            nearMeButton.disabled =
                false;


            nearMeButton.innerHTML = `

                <i class="fa-solid fa-location-crosshairs"></i>

                Utiliser ma position

            `;

        },


        {
            enableHighAccuracy: false,

            timeout: 15000,

            maximumAge: 60000

        }

    );

}


// =====================================================
// POSITION UTILISATEUR
// =====================================================

function showUserPosition() {

    if (!taxiMap) return;


    if (userMarker) {

        taxiMap.removeLayer(
            userMarker
        );

    }


    userMarker =
        L.circleMarker(
            [
                userLatitude,
                userLongitude
            ],
            {
                radius: 9,

                fillColor: "#063b73",

                color: "#ffffff",

                weight: 3,

                opacity: 1,

                fillOpacity: 1
            }
        );


    userMarker
        .addTo(taxiMap)
        .bindPopup(
            "📍 Vous êtes ici"
        );

}


// =====================================================
// CENTRER CARTE
// =====================================================

function centerMapOnUser() {

    if (!taxiMap) return;


    taxiMap.setView(
        [
            userLatitude,
            userLongitude
        ],
        14,
        {
            animate: true
        }
    );

}


// =====================================================
// DISTANCE
// =====================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const latitude2 =
        Number(lat2);


    const longitude2 =
        Number(lon2);


    if (
        !Number.isFinite(
            latitude2
        ) ||
        !Number.isFinite(
            longitude2
        )
    ) {

        return null;

    }


    const R = 6371;


    const dLat =
        toRadians(
            latitude2 - lat1
        );


    const dLon =
        toRadians(
            longitude2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(latitude2)
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


function formatDistance(
    distance
) {

    if (
        distance < 1
    ) {

        return `${Math.round(
            distance * 1000
        )} m`;

    }


    return `${distance.toFixed(1)} km`;

}


// =====================================================
// RESET
// =====================================================

function resetFilters() {

    villeSelect.value =
        "";


    resetSelect(
        communeSelect,
        "Toutes les communes"
    );


    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    communeSelect.disabled =
        true;


    quartierSelect.disabled =
        true;


    searchInput.value =
        "";


    availableOnly.checked =
        false;


    applyFilters();

}


// =====================================================
// SELECT RESET
// =====================================================

function resetSelect(
    select,
    placeholder
) {

    select.innerHTML = `

        <option value="">
            ${placeholder}
        </option>

    `;

}


// =====================================================
// MESSAGE
// =====================================================

function showLocationMessage(
    message,
    type
) {

    locationMessage.textContent =
        message;


    locationMessage.className =
        `taxi-location-message ${type}`;

}


// =====================================================
// NORMALISATION
// =====================================================

function normalize(
    value
) {

    return String(
        value || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLowerCase();

}


// =====================================================
// IMAGE
// =====================================================

function validImage(
    url
) {

    if (!url) return false;


    const value =
        String(url).trim();


    return (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    );

}


// =====================================================
// TELEPHONE
// =====================================================

function cleanPhoneNumber(
    phone
) {

    if (!phone) return "";


    let number =
        String(phone)
            .replace(
                /[^\d+]/g,
                ""
            );


    if (
        number.startsWith("+")
    ) {

        number =
            number.substring(1);

    }


    return number;

}


// =====================================================
// SECURITE HTML
// =====================================================

function escapeHTML(
    value
) {

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

/* =========================================================
   CAMU TAXI — V1
   Annuaire de chauffeurs + géolocalisation + carte
   Firebase Firestore + Leaflet
   ========================================================= */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const CONFIG = {
    defaultCity: "Lubumbashi",

    cities: [
        "Lubumbashi",
        "Likasi",
        "Kipushi",
        "Kasumbalesa",
        "Kolwezi",
        "Fungurume"
    ],

    communes: {
        Lubumbashi: [
            "Annexe",
            "Kamalondo",
            "Kampemba",
            "Katuba",
            "Kenya",
            "Lubumbashi",
            "Ruashi"
        ],

        Likasi: [
            "Kikula",
            "Likasi",
            "Panda",
            "Shituru"
        ],

        Kolwezi: [
            "Dilala",
            "Manika"
        ],

        Kipushi: [
            "Kipushi"
        ],

        Kasumbalesa: [
            "Musumali",
            "Musoshi",
            "Lwina"
        ],

        Fungurume: [
            "Fungurume"
        ]
    }
};


// =========================================================
// VARIABLES
// =========================================================

let map = null;
let userMarker = null;

let driverMarkers = [];

let allDrivers = [];
let filteredDrivers = [];

let userLocation = null;


// =========================================================
// DOM
// =========================================================

const $ = (id) => document.getElementById(id);


// =========================================================
// INITIALISATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("CAMU TAXI — Initialisation...");

    initMap();
    initCities();
    initEvents();

    loadDrivers();

    console.log("CAMU TAXI — Initialisation terminée.");

});


// =========================================================
// CARTE LEAFLET
// =========================================================

function initMap() {

    const mapElement = $("taxiMap");

    if (!mapElement) {
        console.warn("CAMU TAXI — Élément #taxiMap introuvable.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("CAMU TAXI — Leaflet n'est pas chargé.");
        return;
    }

    map = L.map("taxiMap");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }
    ).addTo(map);

    // Lubumbashi par défaut
    map.setView(
        [-11.6647, 27.4794],
        12
    );

    console.log("CAMU TAXI — Carte initialisée.");

}


// =========================================================
// VILLES
// =========================================================

function initCities() {

    const select = $("taxiVille");

    if (!select) return;

    select.innerHTML = `
        <option value="">Toutes les villes</option>
    `;

    CONFIG.cities.forEach(city => {

        const option = document.createElement("option");

        option.value = city;
        option.textContent = city;

        select.appendChild(option);

    });

    select.addEventListener("change", () => {

        updateCommunes(select.value);

        applyFilters();

    });

}


// =========================================================
// COMMUNES
// =========================================================

function updateCommunes(city) {

    const communeSelect = $("taxiCommune");

    if (!communeSelect) return;

    communeSelect.innerHTML = `
        <option value="">Toutes les communes</option>
    `;

    const communes = CONFIG.communes[city] || [];

    communes.forEach(commune => {

        const option = document.createElement("option");

        option.value = commune;
        option.textContent = commune;

        communeSelect.appendChild(option);

    });

}


// =========================================================
// EVENEMENTS
// =========================================================

function initEvents() {

    const searchButton = $("taxiSearchButton");

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            applyFilters
        );

    }


    const resetButton = $("taxiResetButton");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    const searchInput = $("taxiSearch");

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    const availableOnly = $("taxiAvailableOnly");

    if (availableOnly) {

        availableOnly.addEventListener(
            "change",
            applyFilters
        );

    }


    const locationButtons = document.querySelectorAll(
        "[data-taxi-location], #taxiUseLocation"
    );

    locationButtons.forEach(button => {

        button.addEventListener(
            "click",
            getUserLocation
        );

    });

}


// =========================================================
// CHARGER LES CHAUFFEURS
// =========================================================

async function loadDrivers() {

    const loading = $("taxiLoading");
    const empty = $("taxiEmpty");

    try {

        if (loading) {
            loading.style.display = "block";
        }

        console.log(
            "CAMU TAXI — Chargement des chauffeurs..."
        );

        /*
         * IMPORTANT :
         * db vient directement de firebase-config.js
         */

        const driversRef = collection(
            db,
            "chauffeurs"
        );

        const snapshot = await getDocs(driversRef);

        allDrivers = [];

        snapshot.forEach(doc => {

            const data = doc.data();

            allDrivers.push({
                id: doc.id,
                ...data
            });

        });

        console.log(
            `CAMU TAXI — ${allDrivers.length} chauffeur(s) chargé(s).`
        );

        filteredDrivers = [...allDrivers];

        renderDrivers();

        updateMapMarkers();

    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chauffeurs :",
            error
        );

        showDriversError(error);

    } finally {

        if (loading) {
            loading.style.display = "none";
        }

    }

}


// =========================================================
// FILTRES
// =========================================================

function applyFilters() {

    const city = $("taxiVille")?.value || "";

    const commune = $("taxiCommune")?.value || "";

    const quartier = $("taxiQuartier")?.value || "";

    const search =
        ($("taxiSearch")?.value || "")
        .trim()
        .toLowerCase();

    const availableOnly =
        $("taxiAvailableOnly")?.checked || false;


    filteredDrivers = allDrivers.filter(driver => {

        // -----------------------------
        // Ville
        // -----------------------------

        if (
            city &&
            normalize(driver.city) !== normalize(city)
        ) {
            return false;
        }


        // -----------------------------
        // Commune
        // -----------------------------

        if (
            commune &&
            normalize(driver.commune) !== normalize(commune)
        ) {
            return false;
        }


        // -----------------------------
        // Quartier
        // -----------------------------

        if (
            quartier &&
            normalize(driver.quartier) !== normalize(quartier)
        ) {
            return false;
        }


        // -----------------------------
        // Disponibilité
        // -----------------------------

        if (
            availableOnly &&
            !isDriverAvailable(driver)
        ) {
            return false;
        }


        // -----------------------------
        // Recherche
        // -----------------------------

        if (search) {

            const text = [

                driver.name,
                driver.nom,
                driver.firstName,
                driver.lastName,
                driver.phone,
                driver.whatsapp,
                driver.vehicleType,
                driver.vehicle,
                driver.brand,
                driver.model,
                driver.color,
                driver.plate,
                driver.city,
                driver.commune,
                driver.quartier

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            if (!text.includes(search)) {
                return false;
            }

        }


        return true;

    });


    // Trier par distance si position connue
    if (userLocation) {

        filteredDrivers.sort(
            (a, b) =>
                getDriverDistance(a) -
                getDriverDistance(b)
        );

    }


    renderDrivers();

    updateMapMarkers();

}


// =========================================================
// RESET
// =========================================================

function resetFilters() {

    if ($("taxiVille")) {
        $("taxiVille").value = "";
    }

    updateCommunes("");

    if ($("taxiCommune")) {
        $("taxiCommune").value = "";
    }

    if ($("taxiQuartier")) {
        $("taxiQuartier").value = "";
    }

    if ($("taxiSearch")) {
        $("taxiSearch").value = "";
    }

    if ($("taxiAvailableOnly")) {
        $("taxiAvailableOnly").checked = false;
    }

    filteredDrivers = [...allDrivers];

    renderDrivers();

    updateMapMarkers();

}


// =========================================================
// AFFICHER LES CHAUFFEURS
// =========================================================

function renderDrivers() {

    const container = $("taxiDriversList");

    const empty = $("taxiEmpty");

    const count = $("taxiResultsCount");


    if (!container) return;


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${filteredDrivers.length} chauffeur${filteredDrivers.length > 1 ? "s" : ""}`;

    }


    if (filteredDrivers.length === 0) {

        if (empty) {
            empty.style.display = "block";
        }

        return;

    }


    if (empty) {
        empty.style.display = "none";
    }


    filteredDrivers.forEach(driver => {

        container.appendChild(
            createDriverCard(driver)
        );

    });

}


// =========================================================
// CARTE CHAUFFEUR
// =========================================================

function createDriverCard(driver) {

    const card = document.createElement("article");

    card.className =
        "camu-taxi-driver-card";


    const name =
        driver.name ||
        `${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
        "Chauffeur CAMU";


    const phone =
        driver.phone ||
        driver.telephone ||
        "";


    const whatsapp =
        driver.whatsapp ||
        phone;


    const photo =
        driver.photoURL ||
        driver.photo ||
        driver.photoUrl ||
        "assets/images/default-avatar.png";


    const vehicle =
        driver.vehicleType ||
        driver.vehicle ||
        "Véhicule";


    const brand =
        driver.brand ||
        "";


    const model =
        driver.model ||
        "";


    const color =
        driver.color ||
        "";


    const plate =
        driver.plate ||
        driver.immatriculation ||
        "";


    const city =
        driver.city ||
        driver.ville ||
        "";


    const commune =
        driver.commune ||
        "";


    const quartier =
        driver.quartier ||
        "";


    const available =
        isDriverAvailable(driver);


    let distanceHTML = "";

    if (userLocation) {

        const distance =
            getDriverDistance(driver);

        if (Number.isFinite(distance)) {

            distanceHTML = `
                <div class="camu-taxi-driver-distance">
                    <i class="fa-solid fa-location-dot"></i>
                    ${formatDistance(distance)}
                </div>
            `;

        }

    }


    const whatsappLink =
        buildWhatsAppLink(
            whatsapp,
            name
        );


    card.innerHTML = `

        <div class="camu-taxi-driver-status"
             style="${available ? "" : "opacity:.65;"}">

            <span class="camu-taxi-status-dot"></span>

            ${available
                ? "Disponible"
                : "Indisponible"}

        </div>


        <div class="camu-taxi-driver-top">

            <img
                class="camu-taxi-driver-photo"
                src="${escapeAttribute(photo)}"
                alt="${escapeAttribute(name)}"
                onerror="this.src='assets/images/default-avatar.png'"
            >


            <div class="camu-taxi-driver-name">

                <h3>
                    ${escapeHTML(name)}

                    ${
                        driver.verified
                            ? `
                                <span
                                    title="Chauffeur vérifié"
                                    style="color:#16a34a;">
                                    ✓
                                </span>
                              `
                            : ""
                    }

                </h3>


                <div class="camu-taxi-driver-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHTML(
                        [city, commune, quartier]
                            .filter(Boolean)
                            .join(" • ") ||
                        "Localisation non renseignée"
                    )}

                </div>

            </div>

        </div>


        <div class="camu-taxi-driver-details">

            <div class="camu-taxi-driver-detail">

                <i class="fa-solid fa-car"></i>

                <span>
                    <strong>Véhicule :</strong>
                    ${escapeHTML(vehicle)}
                </span>

            </div>


            ${
                brand || model
                    ? `
                        <div class="camu-taxi-driver-detail">

                            <i class="fa-solid fa-car-side"></i>

                            <span>
                                <strong>Modèle :</strong>
                                ${escapeHTML(
                                    [brand, model]
                                        .filter(Boolean)
                                        .join(" ")
                                )}
                            </span>

                        </div>
                      `
                    : ""
            }


            ${
                color
                    ? `
                        <div class="camu-taxi-driver-detail">

                            <i class="fa-solid fa-palette"></i>

                            <span>
                                <strong>Couleur :</strong>
                                ${escapeHTML(color)}
                            </span>

                        </div>
                      `
                    : ""
            }


            ${
                plate
                    ? `
                        <div class="camu-taxi-driver-detail">

                            <i class="fa-solid fa-id-card"></i>

                            <span>
                                <strong>Plaque :</strong>
                                ${escapeHTML(plate)}
                            </span>

                        </div>
                      `
                    : ""
            }


            ${distanceHTML}

        </div>


        <div class="camu-taxi-driver-actions">

            ${
                phone
                    ? `
                        <a
                            class="camu-taxi-driver-action"
                            href="tel:${escapeAttribute(phone)}">

                            <i class="fa-solid fa-phone"></i>

                            Appeler

                        </a>
                      `
                    : ""
            }


            ${
                whatsapp
                    ? `
                        <a
                            class="camu-taxi-driver-action"
                            href="${escapeAttribute(whatsappLink)}"
                            target="_blank"
                            rel="noopener noreferrer">

                            <i class="fa-brands fa-whatsapp"></i>

                            WhatsApp

                        </a>
                      `
                    : ""
            }

        </div>

    `;


    return card;

}


// =========================================================
// GEOLOCALISATION
// =========================================================

function getUserLocation() {

    if (!navigator.geolocation) {

        updateLocationStatus(
            "La géolocalisation n'est pas disponible sur cet appareil."
        );

        return;

    }


    updateLocationStatus(
        "Recherche de votre position..."
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            userLocation = {

                lat:
                    position.coords.latitude,

                lng:
                    position.coords.longitude

            };


            console.log(
                "CAMU TAXI — Position :",
                userLocation
            );


            showUserLocation();

            sortDriversByDistance();

            renderDrivers();

            updateMapMarkers();


            updateLocationStatus(
                "Votre position a été détectée."
            );

        },

        error => {

            console.warn(
                "CAMU TAXI — Géolocalisation :",
                error
            );


            let message =
                "Impossible de récupérer votre position.";


            if (error.code === 1) {

                message =
                    "Autorisation de localisation refusée.";

            }


            updateLocationStatus(message);

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );

}


// =========================================================
// POSITION UTILISATEUR
// =========================================================

function showUserLocation() {

    if (!map || !userLocation) return;


    if (userMarker) {

        map.removeLayer(userMarker);

    }


    userMarker = L.marker([
        userLocation.lat,
        userLocation.lng
    ])
        .addTo(map)
        .bindPopup(
            "<strong>Votre position</strong>"
        );


    map.setView([
        userLocation.lat,
        userLocation.lng
    ], 14);

}


// =========================================================
// MARQUEURS CHAUFFEURS
// =========================================================

function updateMapMarkers() {

    if (!map) return;


    driverMarkers.forEach(marker => {

        map.removeLayer(marker);

    });


    driverMarkers = [];


    filteredDrivers.forEach(driver => {

        const coords =
            getDriverCoordinates(driver);


        if (!coords) return;


        const marker =
            L.marker([
                coords.lat,
                coords.lng
            ])
                .addTo(map);


        const name =
            driver.name ||
            `${driver.firstName || ""} ${driver.lastName || ""}`.trim() ||
            "Chauffeur CAMU";


        marker.bindPopup(`
            <strong>${escapeHTML(name)}</strong><br>
            ${escapeHTML(
                driver.vehicleType ||
                driver.vehicle ||
                "Taxi"
            )}
        `);


        driverMarkers.push(marker);

    });

}


// =========================================================
// TRI PAR DISTANCE
// =========================================================

function sortDriversByDistance() {

    if (!userLocation) return;


    filteredDrivers.sort(
        (a, b) =>
            getDriverDistance(a) -
            getDriverDistance(b)
    );

}


// =========================================================
// COORDONNÉES CHAUFFEUR
// =========================================================

function getDriverCoordinates(driver) {

    const lat = Number(
        driver.latitude ??
        driver.lat
    );


    const lng = Number(
        driver.longitude ??
        driver.lng ??
        driver.lon
    );


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {
        return null;
    }


    return {
        lat,
        lng
    };

}


// =========================================================
// DISTANCE
// =========================================================

function getDriverDistance(driver) {

    if (!userLocation) {

        return Infinity;

    }


    const coords =
        getDriverCoordinates(driver);


    if (!coords) {

        return Infinity;

    }


    return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        coords.lat,
        coords.lng
    );

}


// =========================================================
// CALCUL DISTANCE — KM
// =========================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        toRadians(lat2 - lat1);

    const dLon =
        toRadians(lon2 - lon1);


    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;


    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


function toRadians(value) {

    return value *
        Math.PI /
        180;

}


// =========================================================
// FORMAT DISTANCE
// =========================================================

function formatDistance(distance) {

    if (!Number.isFinite(distance)) {

        return "";

    }


    if (distance < 1) {

        return `${Math.round(distance * 1000)} m`;

    }


    return `${distance.toFixed(1)} km`;

}


// =========================================================
// DISPONIBILITÉ
// =========================================================

function isDriverAvailable(driver) {

    if (
        driver.available === false ||
        driver.disponible === false ||
        driver.status === "offline" ||
        driver.status === "indisponible"
    ) {

        return false;

    }


    return true;

}


// =========================================================
// WHATSAPP
// =========================================================

function buildWhatsAppLink(
    phone,
    driverName
) {

    if (!phone) return "#";


    let number =
        String(phone)
            .replace(/[^\d+]/g, "");


    if (
        number.startsWith("0")
    ) {

        number =
            "243" +
            number.substring(1);

    }


    if (
        number.startsWith("+")
    ) {

        number =
            number.substring(1);

    }


    const message =
        `Bonjour ${driverName}, je vous contacte via CAMU TAXI. Êtes-vous disponible actuellement ?`;


    return (
        "https://wa.me/" +
        number +
        "?text=" +
        encodeURIComponent(message)
    );

}


// =========================================================
// MESSAGE LOCALISATION
// =========================================================

function updateLocationStatus(message) {

    const element =
        $("taxiLocationStatus");


    if (!element) return;


    element.textContent =
        message;

}


// =========================================================
// ERREUR CHAUFFEURS
// =========================================================

function showDriversError(error) {

    const container =
        $("taxiDriversList");


    if (!container) return;


    container.innerHTML = `

        <div class="camu-taxi-empty">

            <div class="camu-taxi-empty-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>
                Impossible de charger les chauffeurs
            </h3>

            <p>
                Vérifiez la connexion Firebase
                et réessayez.
            </p>

        </div>

    `;


    if (
        error?.code ===
        "failed-precondition"
    ) {

        console.warn(
            "CAMU TAXI — Une configuration Firestore est peut-être nécessaire."
        );

    }

}


// =========================================================
// UTILITAIRES
// =========================================================

function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// =========================================================
// EXPORT POUR DEBUG
// =========================================================

window.CAMUTAXI = {

    reload: loadDrivers,

    getDrivers: () =>
        [...allDrivers],

    getFilteredDrivers: () =>
        [...filteredDrivers],

    getUserLocation: () =>
        userLocation

};

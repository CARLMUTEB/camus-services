/* ============================================================
   CAMU TAXI — V1
   Firebase + Firestore + Leaflet
   ============================================================ */

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* ============================================================
   1. CONFIGURATION FIREBASE CAMU SERVICES
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
    authDomain: "camu-services.firebaseapp.com",
    projectId: "camu-services",
    storageBucket: "camu-services.firebasestorage.app",
    messagingSenderId: "879100396449",
    appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
    measurementId: "G-RQ16SX2SNV"
};


/* ============================================================
   2. INITIALISATION FIREBASE
   ============================================================ */

let camuApp;

try {

    const apps = getApps();

    if (apps.length > 0) {

        camuApp = getApp();

    } else {

        camuApp = initializeApp(firebaseConfig);

    }

} catch (error) {

    console.error(
        "CAMU TAXI — Erreur initialisation Firebase :",
        error
    );

}


/* ============================================================
   3. FIRESTORE
   ============================================================ */

let db = null;

try {

    if (camuApp) {

        db = getFirestore(camuApp);

        console.log(
            "CAMU TAXI — Firestore connecté."
        );

    }

} catch (error) {

    console.error(
        "CAMU TAXI — Impossible d'initialiser Firestore :",
        error
    );

}


/* ============================================================
   4. CONFIGURATION
   ============================================================ */

const CONFIG = {

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


/* ============================================================
   5. VARIABLES
   ============================================================ */

let map = null;

let userMarker = null;

let driverMarkers = [];

let allDrivers = [];

let filteredDrivers = [];

let userLocation = null;


/* ============================================================
   6. OUTIL DOM
   ============================================================ */

function $(id) {

    return document.getElementById(id);

}


/* ============================================================
   7. INITIALISATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initTaxi
);


async function initTaxi() {

    console.log(
        "CAMU TAXI — Initialisation..."
    );

    initMap();

    initCities();

    initEvents();

    await loadDrivers();

    console.log(
        "CAMU TAXI — Initialisation terminée."
    );

}


/* ============================================================
   8. CARTE
   ============================================================ */

function initMap() {

    const element = $("taxiMap");

    if (!element) {

        console.warn(
            "CAMU TAXI — #taxiMap introuvable."
        );

        return;

    }

    if (typeof L === "undefined") {

        console.error(
            "CAMU TAXI — Leaflet non chargé."
        );

        return;

    }

    map = L.map("taxiMap");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap"
        }
    ).addTo(map);


    /* Lubumbashi */

    map.setView(
        [-11.6647, 27.4794],
        12
    );


    console.log(
        "CAMU TAXI — Carte initialisée."
    );

}


/* ============================================================
   9. VILLES
   ============================================================ */

function initCities() {

    const select = $("taxiVille");

    if (!select) return;


    select.innerHTML =
        `<option value="">
            Toutes les villes
        </option>`;


    CONFIG.cities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;

        option.textContent = city;

        select.appendChild(option);

    });


    select.addEventListener(
        "change",
        () => {

            updateCommunes(
                select.value
            );

            applyFilters();

        }
    );

}


/* ============================================================
   10. COMMUNES
   ============================================================ */

function updateCommunes(city) {

    const select =
        $("taxiCommune");

    if (!select) return;


    select.innerHTML =
        `<option value="">
            Toutes les communes
        </option>`;


    const communes =
        CONFIG.communes[city] || [];


    communes.forEach(commune => {

        const option =
            document.createElement("option");

        option.value = commune;

        option.textContent = commune;

        select.appendChild(option);

    });

}


/* ============================================================
   11. EVENEMENTS
   ============================================================ */

function initEvents() {

    const searchButton =
        $("taxiSearchButton");

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            applyFilters
        );

    }


    const resetButton =
        $("taxiResetButton");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetFilters
        );

    }


    const search =
        $("taxiSearch");

    if (search) {

        search.addEventListener(
            "input",
            applyFilters
        );

    }


    const available =
        $("taxiAvailableOnly");

    if (available) {

        available.addEventListener(
            "change",
            applyFilters
        );

    }


    document
        .querySelectorAll(
            "[data-taxi-location], #taxiUseLocation"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                getUserLocation
            );

        });

}


/* ============================================================
   12. CHARGER LES CHAUFFEURS
   ============================================================ */

async function loadDrivers() {

    console.log(
        "CAMU TAXI — Chargement des chauffeurs..."
    );


    if (!db) {

        console.error(
            "CAMU TAXI — Firestore DB est null."
        );

        showError(
            "Firebase Firestore n'est pas correctement initialisé."
        );

        return;

    }


    try {

        /*
         * IMPORTANT :
         *
         * Ici db est créé directement avec :
         *
         * getFirestore(camuApp)
         *
         */

        const driversCollection =
            collection(
                db,
                "chauffeurs"
            );


        const snapshot =
            await getDocs(
                driversCollection
            );


        allDrivers = [];


        snapshot.forEach(doc => {

            allDrivers.push({

                id: doc.id,

                ...doc.data()

            });

        });


        console.log(
            `CAMU TAXI — ${allDrivers.length} chauffeur(s) trouvé(s).`
        );


        filteredDrivers =
            [...allDrivers];


        renderDrivers();

        updateMapMarkers();


    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chauffeurs :",
            error
        );


        showError(
            "Impossible de charger les chauffeurs."
        );

    }

}


/* ============================================================
   13. FILTRES
   ============================================================ */

function applyFilters() {

    const city =
        $("taxiVille")?.value || "";

    const commune =
        $("taxiCommune")?.value || "";

    const quartier =
        $("taxiQuartier")?.value || "";

    const search =
        (
            $("taxiSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const availableOnly =
        $("taxiAvailableOnly")?.checked ||
        false;


    filteredDrivers =
        allDrivers.filter(driver => {


            if (
                city &&
                normalize(
                    driver.city ||
                    driver.ville
                ) !== normalize(city)
            ) {

                return false;

            }


            if (
                commune &&
                normalize(
                    driver.commune
                ) !== normalize(commune)
            ) {

                return false;

            }


            if (
                quartier &&
                normalize(
                    driver.quartier
                ) !== normalize(quartier)
            ) {

                return false;

            }


            if (
                availableOnly &&
                !isAvailable(driver)
            ) {

                return false;

            }


            if (search) {

                const content = [

                    driver.name,
                    driver.nom,
                    driver.firstName,
                    driver.lastName,
                    driver.phone,
                    driver.whatsapp,
                    driver.vehicle,
                    driver.vehicleType,
                    driver.brand,
                    driver.model,
                    driver.color,
                    driver.plate,
                    driver.city,
                    driver.ville,
                    driver.commune,
                    driver.quartier

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                if (
                    !content.includes(search)
                ) {

                    return false;

                }

            }


            return true;

        });


    if (userLocation) {

        filteredDrivers.sort(
            (a, b) =>
                getDistance(a) -
                getDistance(b)
        );

    }


    renderDrivers();

    updateMapMarkers();

}


/* ============================================================
   14. RESET
   ============================================================ */

function resetFilters() {

    if ($("taxiVille"))
        $("taxiVille").value = "";


    updateCommunes("");


    if ($("taxiCommune"))
        $("taxiCommune").value = "";


    if ($("taxiQuartier"))
        $("taxiQuartier").value = "";


    if ($("taxiSearch"))
        $("taxiSearch").value = "";


    if ($("taxiAvailableOnly"))
        $("taxiAvailableOnly").checked = false;


    filteredDrivers =
        [...allDrivers];


    renderDrivers();

    updateMapMarkers();

}


/* ============================================================
   15. AFFICHAGE
   ============================================================ */

function renderDrivers() {

    const container =
        $("taxiDriversList");

    const empty =
        $("taxiEmpty");

    const count =
        $("taxiResultsCount");


    if (!container) return;


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${filteredDrivers.length} chauffeur${
                filteredDrivers.length > 1
                    ? "s"
                    : ""
            }`;

    }


    if (
        filteredDrivers.length === 0
    ) {

        if (empty)
            empty.style.display = "block";

        return;

    }


    if (empty)
        empty.style.display = "none";


    filteredDrivers.forEach(
        driver => {

            container.appendChild(
                createDriverCard(driver)
            );

        }
    );

}


/* ============================================================
   16. CARTE CHAUFFEUR
   ============================================================ */

function createDriverCard(driver) {

    const card =
        document.createElement("article");


    card.className =
        "camu-taxi-driver-card";


    const name =
        driver.name ||
        `${driver.firstName || ""} ${
            driver.lastName || ""
        }`.trim() ||
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
        "Taxi";


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


    const available =
        isAvailable(driver);


    const distance =
        userLocation
            ? getDistance(driver)
            : Infinity;


    const whatsappURL =
        buildWhatsApp(
            whatsapp,
            name
        );


    card.innerHTML = `

        <div class="camu-taxi-driver-status">

            <span class="camu-taxi-status-dot"></span>

            ${
                available
                    ? "Disponible"
                    : "Indisponible"
            }

        </div>


        <div class="camu-taxi-driver-top">

            <img
                class="camu-taxi-driver-photo"
                src="${escapeAttr(photo)}"
                alt="${escapeAttr(name)}"
            >


            <div class="camu-taxi-driver-name">

                <h3>
                    ${escapeHTML(name)}

                    ${
                        driver.verified
                            ? `<span
                                style="color:#16a34a"
                                title="Chauffeur vérifié">
                                ✓
                               </span>`
                            : ""
                    }

                </h3>


                <div class="camu-taxi-driver-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHTML(
                        [
                            city,
                            commune,
                            quartier
                        ]
                            .filter(Boolean)
                            .join(" • ")
                    )}

                </div>

            </div>

        </div>


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
                                `${brand} ${model}`.trim()
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


        ${
            Number.isFinite(distance)
                ? `
                    <div class="camu-taxi-driver-distance">

                        <i class="fa-solid fa-location-dot"></i>

                        ${formatDistance(distance)}

                    </div>
                  `
                : ""
        }


        <div class="camu-taxi-driver-actions">

            ${
                phone
                    ? `
                        <a
                            class="camu-taxi-driver-action"
                            href="tel:${escapeAttr(phone)}">

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
                            href="${escapeAttr(whatsappURL)}"
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


/* ============================================================
   17. GEOLOCALISATION
   ============================================================ */

function getUserLocation() {

    if (!navigator.geolocation) {

        updateLocation(
            "La géolocalisation n'est pas disponible."
        );

        return;

    }


    updateLocation(
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
                "CAMU TAXI — Position utilisateur :",
                userLocation
            );


            showUserMarker();


            filteredDrivers.sort(
                (a, b) =>
                    getDistance(a) -
                    getDistance(b)
            );


            renderDrivers();

            updateMapMarkers();


            updateLocation(
                "Votre position a été détectée."
            );

        },


        error => {

            console.warn(
                "CAMU TAXI — Géolocalisation refusée :",
                error
            );


            updateLocation(
                "Autorisation de localisation refusée."
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );

}


/* ============================================================
   18. MARQUEUR UTILISATEUR
   ============================================================ */

function showUserMarker() {

    if (!map || !userLocation)
        return;


    if (userMarker) {

        map.removeLayer(
            userMarker
        );

    }


    userMarker =
        L.marker([
            userLocation.lat,
            userLocation.lng
        ])
        .addTo(map)
        .bindPopup(
            "<strong>Votre position</strong>"
        );


    map.setView(
        [
            userLocation.lat,
            userLocation.lng
        ],
        14
    );

}


/* ============================================================
   19. MARQUEURS CHAUFFEURS
   ============================================================ */

function updateMapMarkers() {

    if (!map)
        return;


    driverMarkers.forEach(
        marker =>
            map.removeLayer(marker)
    );


    driverMarkers = [];


    filteredDrivers.forEach(
        driver => {

            const coordinates =
                getCoordinates(driver);


            if (!coordinates)
                return;


            const marker =
                L.marker([
                    coordinates.lat,
                    coordinates.lng
                ])
                .addTo(map);


            const name =
                driver.name ||
                "Chauffeur CAMU";


            marker.bindPopup(`

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <br>

                ${escapeHTML(
                    driver.vehicleType ||
                    driver.vehicle ||
                    "Taxi"
                )}

            `);


            driverMarkers.push(marker);

        }
    );

}


/* ============================================================
   20. COORDONNÉES
   ============================================================ */

function getCoordinates(driver) {

    const lat =
        Number(
            driver.latitude ??
            driver.lat
        );


    const lng =
        Number(
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


/* ============================================================
   21. DISTANCE
   ============================================================ */

function getDistance(driver) {

    if (!userLocation)
        return Infinity;


    const coordinates =
        getCoordinates(driver);


    if (!coordinates)
        return Infinity;


    return calculateDistance(

        userLocation.lat,
        userLocation.lng,

        coordinates.lat,
        coordinates.lng

    );

}


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
        Math.sin(dLat / 2) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(dLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
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


/* ============================================================
   22. FORMAT DISTANCE
   ============================================================ */

function formatDistance(distance) {

    if (distance < 1) {

        return `${Math.round(
            distance * 1000
        )} m`;

    }


    return `${distance.toFixed(1)} km`;

}


/* ============================================================
   23. DISPONIBILITÉ
   ============================================================ */

function isAvailable(driver) {

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


/* ============================================================
   24. WHATSAPP
   ============================================================ */

function buildWhatsApp(
    phone,
    driverName
) {

    if (!phone)
        return "#";


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
        `Bonjour ${driverName}, je vous contacte via CAMU TAXI. Êtes-vous disponible ?`;


    return (
        `https://wa.me/${number}` +
        `?text=${encodeURIComponent(message)}`
    );

}


/* ============================================================
   25. MESSAGES
   ============================================================ */

function updateLocation(message) {

    const element =
        $("taxiLocationStatus");


    if (element) {

        element.textContent =
            message;

    }

}


function showError(message) {

    const container =
        $("taxiDriversList");


    if (!container)
        return;


    container.innerHTML = `

        <div class="camu-taxi-empty">

            <div class="camu-taxi-empty-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                ${escapeHTML(message)}
            </h3>


            <p>
                Vérifiez votre connexion
                et rechargez la page.
            </p>

        </div>

    `;

}


/* ============================================================
   26. SECURITÉ HTML
   ============================================================ */

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


function escapeAttr(value) {

    return escapeHTML(value);

}


function normalize(value) {

    return String(value ?? "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


/* ============================================================
   27. DEBUG
   ============================================================ */

window.CAMUTAXI = {

    reload: loadDrivers,

    drivers: () =>
        [...allDrivers],

    filtered: () =>
        [...filteredDrivers],

    location: () =>
        userLocation

};

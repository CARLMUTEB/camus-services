/* ============================================================
   CAMU TAXI — V1
   Annuaire des chauffeurs CAMU SERVICES
   Firebase Firestore + Leaflet
   ============================================================ */


/* ============================================================
   1. FIREBASE
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

let camuApp = null;
let db = null;

try {

    if (getApps().length > 0) {

        camuApp = getApp();

    } else {

        camuApp = initializeApp(firebaseConfig);

    }

    db = getFirestore(camuApp);

    console.log(
        "CAMU TAXI — Firestore connecté."
    );

    console.log(
        "CAMU TAXI — Projet Firebase :",
        firebaseConfig.projectId
    );

} catch (error) {

    console.error(
        "CAMU TAXI — Erreur Firebase :",
        error
    );

}


/* ============================================================
   3. CONFIGURATION
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

    retryAttempts: 3,

    retryDelay: 4000

};


/* ============================================================
   4. VARIABLES
============================================================ */

let map = null;

let userMarker = null;

let driverMarkers = [];

let allDrivers = [];

let filteredDrivers = [];

let userLocation = null;

let firestoreConnected = false;


/* ============================================================
   5. DOM
============================================================ */

function $(id) {

    return document.getElementById(id);

}


/* ============================================================
   6. INITIALISATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initTaxi
);


async function initTaxi() {

    console.log(
        "CAMU TAXI — Initialisation..."
    );

    initYear();

    initMap();

    initCities();

    initEvents();

    await loadDriversWithRetry();

    console.log(
        "CAMU TAXI — Initialisation terminée."
    );

}


/* ============================================================
   7. ANNÉE
============================================================ */

function initYear() {

    const year = $("taxiCurrentYear");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


/* ============================================================
   8. CARTE LEAFLET
============================================================ */

function initMap() {

    const element = $("taxiMap");

    if (!element) {

        console.warn(
            "CAMU TAXI — Élément carte introuvable."
        );

        return;

    }

    if (typeof L === "undefined") {

        console.error(
            "CAMU TAXI — Leaflet n'est pas chargé."
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


    /*
     * Lubumbashi par défaut
     */

    map.setView(
        [
            -11.6647,
            27.4794
        ],
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

    if (!select)
        return;


    select.innerHTML = `

        <option value="">
            Toutes les villes
        </option>

    `;


    CONFIG.cities.forEach(
        city => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = city;

            option.textContent = city;

            select.appendChild(
                option
            );

        }
    );


    select.addEventListener(
        "change",
        applyFilters
    );

}


/* ============================================================
   10. EVENEMENTS
============================================================ */

function initEvents() {


    $("taxiSearchButton")
        ?.addEventListener(
            "click",
            applyFilters
        );


    $("taxiResetButton")
        ?.addEventListener(
            "click",
            resetFilters
        );


    $("taxiSearch")
        ?.addEventListener(
            "input",
            applyFilters
        );


    $("taxiCommune")
        ?.addEventListener(
            "input",
            applyFilters
        );


    $("taxiQuartier")
        ?.addEventListener(
            "input",
            applyFilters
        );


    $("taxiAvailableOnly")
        ?.addEventListener(
            "change",
            applyFilters
        );


    $("taxiNearMeButton")
        ?.addEventListener(
            "click",
            getUserLocation
        );


    $("taxiTopLocationButton")
        ?.addEventListener(
            "click",
            getUserLocation
        );


    $("taxiAllDriversButton")
        ?.addEventListener(
            "click",
            () => {

                $("chauffeurs")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

}


/* ============================================================
   11. CHARGEMENT FIRESTORE AVEC RETRY
============================================================ */

async function loadDriversWithRetry() {

    let lastError = null;


    for (
        let attempt = 1;
        attempt <= CONFIG.retryAttempts;
        attempt++
    ) {

        console.log(
            `CAMU TAXI — Tentative Firestore ${attempt}/${CONFIG.retryAttempts}...`
        );


        try {

            await loadDrivers();

            return;

        } catch (error) {

            lastError = error;


            console.error(
                `CAMU TAXI — Erreur tentative ${attempt}:`,
                error
            );


            if (
                attempt <
                CONFIG.retryAttempts
            ) {

                showFirestoreConnecting(
                    attempt
                );


                await sleep(
                    CONFIG.retryDelay
                );

            }

        }

    }


    console.error(
        "CAMU TAXI — Firestore inaccessible.",
        lastError
    );


    showFirestoreOffline();

}


/* ============================================================
   12. CHARGEMENT DES CHAUFFEURS
============================================================ */

async function loadDrivers() {

    console.log(
        "CAMU TAXI — Chargement des chauffeurs..."
    );


    if (!db) {

        throw new Error(
            "Firestore n'est pas initialisé."
        );

    }


    /*
     * COLLECTION FIRESTORE
     */

    const driversRef =
        collection(
            db,
            "chauffeurs"
        );


    console.log(
        "CAMU TAXI — Lecture de la collection : chauffeurs"
    );


    /*
     * REQUÊTE FIRESTORE
     */

    const snapshot =
        await getDocs(
            driversRef
        );


    /*
     * FIRESTORE A RÉPONDU
     */

    firestoreConnected = true;


    console.log(
        "======================================"
    );

    console.log(
        "CAMU TAXI — RÉSULTAT FIRESTORE"
    );

    console.log(
        "Projet Firebase :",
        firebaseConfig.projectId
    );

    console.log(
        "Collection : chauffeurs"
    );

    console.log(
        "Nombre de documents :",
        snapshot.size
    );

    console.log(
        "Collection vide :",
        snapshot.empty
    );

    console.log(
        "======================================"
    );


    /* ========================================================
       SI COLLECTION VIDE
    ======================================================== */

    if (snapshot.empty) {

        console.error(
            "CAMU TAXI — Aucun chauffeur retourné par Firestore."
        );


        console.error(
            "Vérifiez Firebase Console > camu-services > Firestore > chauffeurs."
        );


        allDrivers = [];

        filteredDrivers = [];


        hideLoading();

        renderDrivers();

        updateMapMarkers();

        showFirestoreConnected();


        return;

    }


    /* ========================================================
       LECTURE DE TOUS LES DOCUMENTS
    ======================================================== */

    allDrivers =
        snapshot.docs.map(
            doc => {

                const data =
                    doc.data();


                console.log(
                    "CAMU TAXI — DOCUMENT CHAUFFEUR :",
                    doc.id
                );


                console.log(
                    "CAMU TAXI — DONNÉES :",
                    data
                );


                return {

                    id:
                        doc.id,

                    ...data

                };

            }
        );


    console.log(
        "CAMU TAXI — CHAUFFEURS CHARGÉS :",
        allDrivers
    );


    /*
     * Premier affichage
     */

    filteredDrivers =
        [...allDrivers];


    hideLoading();

    renderDrivers();

    updateMapMarkers();

    showFirestoreConnected();

}


/* ============================================================
   13. LOADING
============================================================ */

function hideLoading() {

    const loading =
        $("taxiLoading");


    if (loading) {

        loading.style.display =
            "none";

    }


    const mapLoading =
        $("taxiMapLoading");


    if (mapLoading) {

        mapLoading.style.display =
            "none";

    }

}


/* ============================================================
   14. FILTRES
============================================================ */

function applyFilters() {

    const city =
        $("taxiVille")
            ?.value
            .trim() || "";


    const commune =
        $("taxiCommune")
            ?.value
            .trim() || "";


    const quartier =
        $("taxiQuartier")
            ?.value
            .trim() || "";


    const search =
        (
            $("taxiSearch")
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    const availableOnly =
        $("taxiAvailableOnly")
            ?.checked || false;


    filteredDrivers =
        allDrivers.filter(
            driver => {


                /* ==================================================
                   VILLE
                ================================================== */

                if (city) {

                    const driverCity =
                        driver.ville ||
                        driver.city ||
                        "";


                    /*
                     * Si le chauffeur possède une ville,
                     * on applique le filtre.
                     *
                     * S'il n'a pas encore de ville,
                     * on ne le supprime pas automatiquement.
                     */

                    if (
                        driverCity &&
                        normalize(driverCity) !==
                        normalize(city)
                    ) {

                        return false;

                    }

                }


                /* ==================================================
                   COMMUNE
                ================================================== */

                if (commune) {

                    const driverCommune =
                        driver.commune ||
                        "";


                    if (
                        !normalize(
                            driverCommune
                        ).includes(
                            normalize(commune)
                        )
                    ) {

                        return false;

                    }

                }


                /* ==================================================
                   QUARTIER
                ================================================== */

                if (quartier) {

                    const driverQuartier =
                        driver.quartier ||
                        "";


                    if (
                        !normalize(
                            driverQuartier
                        ).includes(
                            normalize(quartier)
                        )
                    ) {

                        return false;

                    }

                }


                /* ==================================================
                   DISPONIBILITÉ
                ================================================== */

                if (
                    availableOnly &&
                    driver.active !== true
                ) {

                    return false;

                }


                /* ==================================================
                   RECHERCHE
                ================================================== */

                if (search) {

                    const content = [

                        driver.name,

                        driver.WhatsApp,

                        driver.commune,

                        driver.quartier,

                        driver.description,

                        driver.marqueVehicule,

                        driver.typeVehicule,

                        driver.plaque,

                        driver.service

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                    if (
                        !content.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    /*
     * Tri par distance si position connue
     */

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
   15. RESET FILTRES
============================================================ */

function resetFilters() {

    if ($("taxiVille")) {

        $("taxiVille").value =
            "";

    }


    if ($("taxiCommune")) {

        $("taxiCommune").value =
            "";

    }


    if ($("taxiQuartier")) {

        $("taxiQuartier").value =
            "";

    }


    if ($("taxiSearch")) {

        $("taxiSearch").value =
            "";

    }


    if ($("taxiAvailableOnly")) {

        $("taxiAvailableOnly").checked =
            false;

    }


    filteredDrivers =
        [...allDrivers];


    renderDrivers();

    updateMapMarkers();

}


/* ============================================================
   16. AFFICHAGE DES CHAUFFEURS
============================================================ */

function renderDrivers() {

    const container =
        $("taxiDriversList");


    const empty =
        $("taxiEmpty");


    const count =
        $("taxiResultsCount");


    if (!container)
        return;


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

        if (empty) {

            empty.hidden = false;

        }


        return;

    }


    if (empty) {

        empty.hidden = true;

    }


    filteredDrivers.forEach(
        driver => {

            const card =
                createDriverCard(
                    driver
                );


            container.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   17. CARTE CHAUFFEUR
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


    /*
     * CHAMPS FIRESTORE EXACTS
     */

    const name =
        driver.name ||
        "Chauffeur CAMU";


    const whatsapp =
        driver.WhatsApp ||
        "";


    const active =
        driver.active === true;


    const commune =
        driver.commune ||
        "";


    const quartier =
        driver.quartier ||
        "";


    const description =
        driver.description ||
        "";


    const marque =
        driver.marqueVehicule ||
        "";


    const typeVehicule =
        driver.typeVehicule ||
        "";


    const plaque =
        driver.plaque ||
        "";


    const service =
        driver.service ||
        "";


    const photoChauffeur =
        driver.photoURL ||
        "";


    const photoVehicule =
        driver.photoVehicule ||
        "";


    const distance =
        userLocation
            ? getDistance(driver)
            : Infinity;


    /*
     * IMAGE VÉHICULE
     */

    let vehicleHTML = "";


    if (photoVehicule) {

        vehicleHTML = `

            <div
                class="camu-taxi-vehicle-image-wrapper"
            >

                <img
                    class="camu-taxi-vehicle-image"
                    src="${escapeAttr(
                        photoVehicule
                    )}"
                    alt="Véhicule de ${escapeAttr(
                        name
                    )}"
                    loading="lazy"
                    onerror="
                        this.parentElement.style.display='none';
                    "
                >

            </div>

        `;

    }


    /*
     * PHOTO CHAUFFEUR
     */

    let driverPhotoHTML = "";


    if (
        photoChauffeur &&
        isValidImageURL(
            photoChauffeur
        )
    ) {

        driverPhotoHTML = `

            <img
                class="camu-taxi-driver-photo"
                src="${escapeAttr(
                    photoChauffeur
                )}"
                alt="${escapeAttr(
                    name
                )}"
                loading="lazy"
            >

        `;

    } else {

        driverPhotoHTML = `

            <div
                class="camu-taxi-driver-photo"
                style="
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#eef4f8;
                "
            >

                <i
                    class="fa-solid fa-user"
                    style="
                        font-size:28px;
                        color:#0878d1;
                    "
                ></i>

            </div>

        `;

    }


    /*
     * WHATSAPP
     */

    const whatsappURL =
        buildWhatsApp(
            whatsapp,
            name
        );


    /*
     * LOCALISATION
     */

    const locationText =
        [
            commune,
            quartier
        ]
        .filter(Boolean)
        .join(" • ");


    card.innerHTML = `

        ${vehicleHTML}


        <!-- ============================================
             STATUT
        ============================================= -->

        <div
            class="camu-taxi-driver-status"
        >

            <span
                class="camu-taxi-status-dot"
                style="
                    background:${
                        active
                            ? "#16a34a"
                            : "#9ca3af"
                    };
                "
            ></span>

            ${
                active
                    ? "Disponible"
                    : "Indisponible"
            }

        </div>


        <!-- ============================================
             CHAUFFEUR
        ============================================= -->

        <div
            class="camu-taxi-driver-top"
        >

            ${driverPhotoHTML}


            <div
                class="camu-taxi-driver-name"
            >

                <h3>
                    ${escapeHTML(name)}
                </h3>


                ${
                    locationText
                        ? `

                            <div
                                class="camu-taxi-driver-location"
                            >

                                <i
                                    class="fa-solid fa-location-dot"
                                ></i>

                                ${escapeHTML(
                                    locationText
                                )}

                            </div>

                        `
                        : ""
                }

            </div>

        </div>


        <!-- ============================================
             TYPE VÉHICULE
        ============================================= -->

        ${
            typeVehicule
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-taxi"
                        ></i>

                        <span>

                            <strong>
                                Type :
                            </strong>

                            ${escapeHTML(
                                typeVehicule
                            )}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ============================================
             MARQUE
        ============================================= -->

        ${
            marque
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-car"
                        ></i>

                        <span>

                            <strong>
                                Marque :
                            </strong>

                            ${escapeHTML(
                                marque
                            )}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ============================================
             PLAQUE
        ============================================= -->

        ${
            plaque
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-id-card"
                        ></i>

                        <span>

                            <strong>
                                Plaque :
                            </strong>

                            ${escapeHTML(
                                plaque
                            )}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ============================================
             SERVICE
        ============================================= -->

        ${
            service
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-briefcase"
                        ></i>

                        <span>

                            <strong>
                                Service :
                            </strong>

                            ${escapeHTML(
                                service
                            )}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ============================================
             DESCRIPTION
        ============================================= -->

        ${
            description
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-circle-info"
                        ></i>

                        <span>

                            ${escapeHTML(
                                description
                            )}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ============================================
             DISTANCE
        ============================================= -->

        ${
            Number.isFinite(distance)
                ? `

                    <div
                        class="camu-taxi-driver-distance"
                    >

                        <i
                            class="fa-solid fa-location-dot"
                        ></i>

                        ${formatDistance(
                            distance
                        )}

                    </div>

                `
                : ""
        }


        <!-- ============================================
             ACTIONS
        ============================================= -->

        <div
            class="camu-taxi-driver-actions"
        >

            ${
                whatsapp
                    ? `

                        <a
                            class="camu-taxi-driver-action"
                            href="${escapeAttr(
                                whatsappURL
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
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
                whatsapp
                    ? `

                        <a
                            class="camu-taxi-driver-action"
                            href="tel:${escapeAttr(
                                whatsapp
                            )}"
                        >

                            <i
                                class="fa-solid fa-phone"
                            ></i>

                            Appeler

                        </a>

                    `
                    : ""
            }

        </div>

    `;


    return card;

}


/* ============================================================
   18. VALIDATION URL IMAGE
============================================================ */

function isValidImageURL(
    value
) {

    if (!value)
        return false;


    const text =
        String(value)
            .trim();


    if (!text)
        return false;


    /*
     * "1", "2", etc. ne sont pas des URLs
     */

    if (
        /^\d+$/.test(text)
    ) {

        return false;

    }


    return (
        text.startsWith("http://") ||
        text.startsWith("https://") ||
        text.startsWith("data:image/")
    );

}


/* ============================================================
   19. GÉOLOCALISATION
============================================================ */

function getUserLocation() {

    if (
        !navigator.geolocation
    ) {

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
                "CAMU TAXI — Erreur géolocalisation :",
                error
            );


            updateLocation(
                "Impossible d'obtenir votre position."
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
   20. MARQUEUR UTILISATEUR
============================================================ */

function showUserMarker() {

    if (
        !map ||
        !userLocation
    )
        return;


    if (userMarker) {

        map.removeLayer(
            userMarker
        );

    }


    userMarker =
        L.marker(
            [
                userLocation.lat,
                userLocation.lng
            ]
        )
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
   21. MARQUEURS DES CHAUFFEURS
============================================================ */

function updateMapMarkers() {

    if (!map)
        return;


    /*
     * Supprimer anciens marqueurs
     */

    driverMarkers.forEach(
        marker => {

            map.removeLayer(
                marker
            );

        }
    );


    driverMarkers = [];


    /*
     * Les marqueurs chauffeur nécessitent :
     *
     * latitude
     * longitude
     *
     * Ces champs ne sont pas encore présents
     * dans ton exemple Firestore.
     */

    filteredDrivers.forEach(
        driver => {

            const coordinates =
                getCoordinates(
                    driver
                );


            if (!coordinates)
                return;


            const marker =
                L.marker(
                    [
                        coordinates.lat,
                        coordinates.lng
                    ]
                )
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
                    driver.typeVehicule ||
                    "Taxi"
                )}

            `);


            driverMarkers.push(
                marker
            );

        }
    );

}


/* ============================================================
   22. COORDONNÉES
============================================================ */

function getCoordinates(
    driver
) {

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
   23. DISTANCE
============================================================ */

function getDistance(
    driver
) {

    if (!userLocation)
        return Infinity;


    const coordinates =
        getCoordinates(
            driver
        );


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


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

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


    if (
        number.startsWith("0")
    ) {

        number =
            "243" +
            number.substring(1);

    }


    const message =
        `Bonjour ${driverName}, je vous contacte via CAMU TAXI. Êtes-vous disponible ?`;


    return (
        `https://wa.me/${number}` +
        `?text=${encodeURIComponent(
            message
        )}`
    );

}


/* ============================================================
   25. STATUT FIRESTORE
============================================================ */

function showFirestoreConnecting(
    attempt
) {

    updateLocation(
        `Connexion à CAMU TAXI... tentative ${attempt}/${CONFIG.retryAttempts}`
    );

}


function showFirestoreConnected() {

    if (
        firestoreConnected
    ) {

        updateLocation(
            "CAMU TAXI est connecté."
        );

    }

}


function showFirestoreOffline() {

    firestoreConnected =
        false;


    const container =
        $("taxiDriversList");


    const loading =
        $("taxiLoading");


    if (loading) {

        loading.style.display =
            "none";

    }


    if (!container)
        return;


    container.innerHTML = `

        <div
            class="camu-taxi-empty"
            style="display:block;"
        >

            <div
                class="camu-taxi-empty-icon"
            >

                <i
                    class="fa-solid fa-wifi"
                ></i>

            </div>


            <h3>
                Connexion impossible
            </h3>


            <p>

                CAMU TAXI n'arrive pas à contacter
                le serveur. Vérifiez votre connexion
                Internet puis réessayez.

            </p>


            <button
                type="button"
                class="camu-taxi-button camu-taxi-button-primary"
                id="taxiRetryButton"
            >

                <i
                    class="fa-solid fa-rotate"
                ></i>

                Réessayer

            </button>

        </div>

    `;


    $("taxiRetryButton")
        ?.addEventListener(
            "click",
            async () => {

                container.innerHTML = `

                    <div
                        class="camu-taxi-loading"
                        style="display:block;"
                    >

                        <div
                            class="camu-taxi-spinner"
                        ></div>

                        <p>
                            Reconnexion...
                        </p>

                    </div>

                `;


                await loadDriversWithRetry();

            }
        );

}


/* ============================================================
   26. MESSAGE POSITION
============================================================ */

function updateLocation(
    message
) {

    const element =
        $("taxiLocationStatus");


    if (element) {

        element.textContent =
            message;

    }

}


/* ============================================================
   27. ATTENTE
============================================================ */

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* ============================================================
   28. NORMALISATION
============================================================ */

function normalize(
    value
) {

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


/* ============================================================
   29. SÉCURITÉ HTML
============================================================ */

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


function escapeAttr(
    value
) {

    return escapeHTML(
        value
    );

}


/* ============================================================
   30. DEBUG GLOBAL
============================================================ */

window.CAMUTAXI = {

    reload:
        loadDriversWithRetry,

    drivers:
        () => [
            ...allDrivers
        ],

    filtered:
        () => [
            ...filteredDrivers
        ],

    location:
        () =>
            userLocation,

    firestoreStatus:
        () =>
            firestoreConnected

};

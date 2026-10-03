/* ============================================================
   CAMU TAXI — V1
   Firebase + Firestore + Leaflet
   Adapté à la collection : chauffeurs
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
   1. FIREBASE
============================================================ */

const firebaseConfig = {

    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",

    authDomain:
        "camu-services.firebaseapp.com",

    projectId:
        "camu-services",

    storageBucket:
        "camu-services.firebasestorage.app",

    messagingSenderId:
        "879100396449",

    appId:
        "1:879100396449:web:9d7ffe441a3df2daf841e0",

    measurementId:
        "G-RQ16SX2SNV"

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

        camuApp =
            initializeApp(firebaseConfig);

    }


    db =
        getFirestore(camuApp);


    console.log(
        "CAMU TAXI — Firestore connecté."
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

    const year =
        $("taxiCurrentYear");


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


/* ============================================================
   8. CARTE
============================================================ */

function initMap() {

    const element =
        $("taxiMap");


    if (!element) {

        console.warn(
            "CAMU TAXI — Carte introuvable."
        );

        return;

    }


    if (typeof L === "undefined") {

        console.error(
            "CAMU TAXI — Leaflet non chargé."
        );

        return;

    }


    map =
        L.map("taxiMap");


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap"
        }
    ).addTo(map);


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

    const select =
        $("taxiVille");


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


            option.value =
                city;


            option.textContent =
                city;


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


    /*
     * Commune écrite manuellement
     */

    $("taxiCommune")
        ?.addEventListener(
            "input",
            applyFilters
        );


    /*
     * Quartier écrit manuellement
     */

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
   11. FIRESTORE AVEC RETRY
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

            lastError =
                error;


            console.warn(
                `CAMU TAXI — Échec tentative ${attempt} :`,
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


    const driversRef =
        collection(
            db,
            "chauffeurs"
        );


    const snapshot =
        await getDocs(
            driversRef
        );


    firestoreConnected =
        true;


    /*
     * Firestore a répondu mais la collection
     * est réellement vide.
     */

    if (snapshot.empty) {

        console.log(
            "CAMU TAXI — Aucun chauffeur enregistré."
        );


        allDrivers = [];

        filteredDrivers = [];


        hideLoading();

        renderDrivers();

        updateMapMarkers();

        showFirestoreConnected();

        return;

    }


    /*
     * Récupération des documents.
     */

    allDrivers =
        snapshot.docs.map(
            doc => ({

                id:
                    doc.id,

                ...doc.data()

            })
        );


    console.log(
        `CAMU TAXI — ${allDrivers.length} chauffeur(s) trouvé(s).`
    );


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

    /*
     * VILLE
     */

    const city =
        $("taxiVille")
            ?.value
            .trim() || "";


    /*
     * COMMUNE :
     * saisie manuellement
     */

    const commune =
        $("taxiCommune")
            ?.value
            .trim() || "";


    /*
     * QUARTIER :
     * saisie manuellement
     *
     * Le champ sera utilisable dès que
     * "quartier" sera présent dans Firestore.
     */

    const quartier =
        $("taxiQuartier")
            ?.value
            .trim() || "";


    /*
     * RECHERCHE
     */

    const search =
        (
            $("taxiSearch")
                ?.value || ""
        )
        .trim()
        .toLowerCase();


    /*
     * DISPONIBILITÉ
     */

    const availableOnly =
        $("taxiAvailableOnly")
            ?.checked || false;


    filteredDrivers =
        allDrivers.filter(
            driver => {


                /* =========================
                   VILLE
                ========================= */

                if (
                    city &&
                    driver.city &&
                    normalize(
                        driver.city
                    ) !== normalize(city)
                ) {

                    return false;

                }


                if (
                    city &&
                    !driver.city &&
                    driver.ville &&
                    normalize(
                        driver.ville
                    ) !== normalize(city)
                ) {

                    return false;

                }


                /*
                 * Si le chauffeur n'a pas encore
                 * de ville dans Firestore, on ne
                 * l'exclut pas automatiquement.
                 */


                /* =========================
                   COMMUNE
                ========================= */

                if (
                    commune &&
                    !normalize(
                        driver.commune
                    ).includes(
                        normalize(commune)
                    )
                ) {

                    return false;

                }


                /* =========================
                   QUARTIER
                ========================= */

                if (
                    quartier &&
                    !normalize(
                        driver.quartier
                    ).includes(
                        normalize(quartier)
                    )
                ) {

                    return false;

                }


                /* =========================
                   DISPONIBILITÉ
                ========================= */

                if (
                    availableOnly &&
                    driver.active !== true
                ) {

                    return false;

                }


                /* =========================
                   RECHERCHE
                ========================= */

                if (search) {

                    const content = [

                        driver.name,

                        driver.WhatsApp,

                        driver.description,

                        driver.marqueVehicule,

                        driver.typeVehicule,

                        driver.plaque,

                        driver.service,

                        driver.commune,

                        driver.quartier

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
     * Trier par distance si les
     * coordonnées existent.
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
   15. RESET
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


    container.innerHTML =
        "";


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

            empty.hidden =
                false;

        }

        return;

    }


    if (empty) {

        empty.hidden =
            true;

    }


    filteredDrivers.forEach(
        driver => {

            container.appendChild(
                createDriverCard(
                    driver
                )
            );

        }
    );

}


/* ============================================================
   17. CARTE D'UN CHAUFFEUR
============================================================ */

function createDriverCard(driver) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "camu-taxi-driver-card";


    /* ========================================================
       DONNÉES FIRESTORE RÉELLES
    ======================================================== */


    const name =
        driver.name ||
        "Chauffeur CAMU";


    const whatsapp =
        driver.WhatsApp ||
        "";


    const photoChauffeur =
        driver.photoURL ||
        "";


    const photoVehicule =
        driver.photoVehicule ||
        "";


    const commune =
        driver.commune ||
        "";


    const quartier =
        driver.quartier ||
        "";


    const marque =
        driver.marqueVehicule ||
        "";


    const type =
        driver.typeVehicule ||
        "";


    const plaque =
        driver.plaque ||
        "";


    const service =
        driver.service ||
        "";


    const description =
        driver.description ||
        "";


    const active =
        driver.active === true;


    const distance =
        userLocation
            ? getDistance(driver)
            : Infinity;


    const whatsappURL =
        buildWhatsApp(
            whatsapp,
            name
        );


    /* ========================================================
       PHOTO VÉHICULE
    ======================================================== */

    const vehicleImage =
        photoVehicule ||
        photoChauffeur ||
        "assets/images/default-vehicle.jpg";


    card.innerHTML = `

        <!-- ================================================
             PHOTO DU VÉHICULE
        ================================================= -->

        <div
            class="camu-taxi-vehicle-image-wrapper"
        >

            <img
                class="camu-taxi-vehicle-image"
                src="${escapeAttr(vehicleImage)}"
                alt="Véhicule de ${escapeAttr(name)}"
                loading="lazy"
                onerror="
                    this.style.display='none';
                "
            >

        </div>


        <!-- ================================================
             STATUT
        ================================================= -->

        <div
            class="camu-taxi-driver-status"
            style="${
                active
                    ? ""
                    : "opacity:.65;"
            }"
        >

            <span
                class="camu-taxi-status-dot"
            ></span>

            ${
                active
                    ? "Disponible"
                    : "Indisponible"
            }

        </div>


        <!-- ================================================
             CHAUFFEUR
        ================================================= -->

        <div
            class="camu-taxi-driver-top"
        >

            ${
                photoChauffeur
                    ? `

                        <img
                            class="camu-taxi-driver-photo"
                            src="${escapeAttr(photoChauffeur)}"
                            alt="${escapeAttr(name)}"
                            loading="lazy"
                        >

                    `
                    : `

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

                    `
            }


            <div
                class="camu-taxi-driver-name"
            >

                <h3>

                    ${escapeHTML(name)}

                </h3>


                <div
                    class="camu-taxi-driver-location"
                >

                    <i
                        class="fa-solid fa-location-dot"
                    ></i>

                    ${escapeHTML(
                        [
                            commune,
                            quartier
                        ]
                        .filter(Boolean)
                        .join(" • ")
                    )}

                </div>

            </div>

        </div>


        <!-- ================================================
             TYPE DE VÉHICULE
        ================================================= -->

        ${
            type
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

                            ${escapeHTML(type)}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ================================================
             MARQUE
        ================================================= -->

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

                            ${escapeHTML(marque)}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ================================================
             PLAQUE
        ================================================= -->

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

                            ${escapeHTML(plaque)}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ================================================
             SERVICE
        ================================================= -->

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

                            ${escapeHTML(service)}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ================================================
             DESCRIPTION
        ================================================= -->

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

                            ${escapeHTML(description)}

                        </span>

                    </div>

                `
                : ""
        }


        <!-- ================================================
             DISTANCE
        ================================================= -->

        ${
            Number.isFinite(distance)
                ? `

                    <div
                        class="camu-taxi-driver-distance"
                    >

                        <i
                            class="fa-solid fa-location-dot"
                        ></i>

                        ${formatDistance(distance)}

                    </div>

                `
                : ""
        }


        <!-- ================================================
             ACTIONS
        ================================================= -->

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
   18. GÉOLOCALISATION
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


            if (
                $("taxiResultsStatus")
            ) {

                $("taxiResultsStatus")
                    .textContent =
                    "Les chauffeurs sont classés selon leur proximité.";

            }


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
                "CAMU TAXI — Géolocalisation :",
                error
            );


            updateLocation(
                "Impossible d'obtenir votre position."
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
   19. MARQUEUR UTILISATEUR
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
   20. MARQUEURS CHAUFFEURS
============================================================ */

function updateMapMarkers() {

    if (!map)
        return;


    driverMarkers.forEach(
        marker =>
            map.removeLayer(
                marker
            )
    );


    driverMarkers = [];


    /*
     * Pour l'instant les chauffeurs de ta collection
     * n'ont pas encore latitude / longitude.
     *
     * Le marqueur sera donc créé automatiquement
     * dès que ces champs seront ajoutés.
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
   21. COORDONNÉES
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
   22. DISTANCE
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


/* ============================================================
   23. DISTANCE
============================================================ */

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

    const element =
        $("taxiLocationStatus");


    if (!element)
        return;


    element.textContent =
        `Connexion à CAMU TAXI... tentative ${attempt}/${CONFIG.retryAttempts}`;

}


function showFirestoreConnected() {

    const element =
        $("taxiLocationStatus");


    if (!element)
        return;


    if (
        firestoreConnected
    ) {

        element.textContent =
            "CAMU TAXI est connecté.";

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
   26. STATUT
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
   27. SLEEP
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
   30. DEBUG
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

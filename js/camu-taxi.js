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
            initializeApp(
                firebaseConfig
            );

    }


    db =
        getFirestore(
            camuApp
        );


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
        L.map(
            "taxiMap"
        );


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


    /* RECHERCHER */

    $("taxiSearchButton")
        ?.addEventListener(
            "click",
            applyFilters
        );


    /* RESET */

    $("taxiResetButton")
        ?.addEventListener(
            "click",
            resetFilters
        );


    /* RECHERCHE TEXTE */

    $("taxiSearch")
        ?.addEventListener(
            "input",
            applyFilters
        );


    /* COMMUNE */

    $("taxiCommune")
        ?.addEventListener(
            "input",
            applyFilters
        );


    /* QUARTIER */

    $("taxiQuartier")
        ?.addEventListener(
            "input",
            applyFilters
        );


    /* DISPONIBILITÉ */

    $("taxiAvailableOnly")
        ?.addEventListener(
            "change",
            applyFilters
        );


    /* POSITION */

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


    /* VOIR CHAUFFEURS */

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
   12. CHARGEMENT CHAUFFEURS
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


    /*
     * IMPORTANT :
     *
     * Si Firestore répond :
     *   snapshot.empty = collection réellement vide.
     *
     * Si Firestore ne répond pas :
     *   une erreur est levée.
     *
     * On ne dira donc plus "0 chauffeur"
     * lorsqu'il s'agit d'un problème réseau.
     */

    const snapshot =
        await getDocs(
            driversRef
        );


    firestoreConnected =
        true;


    if (snapshot.empty) {

        console.log(

            "CAMU TAXI — Firestore connecté, mais aucun chauffeur enregistré."

        );


        allDrivers = [];

        filteredDrivers = [];


        hideLoading();


        renderDrivers();

        updateMapMarkers();


        showFirestoreConnected();


        return;

    }


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


    const city =
        $("taxiVille")
            ?.value
            .trim() || "";


    /*
     * COMMUNE :
     * ÉCRITE MANUELLEMENT
     */

    const commune =
        $("taxiCommune")
            ?.value
            .trim() || "";


    /*
     * QUARTIER :
     * ÉCRIT MANUELLEMENT
     */

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


                /* =========================
                   VILLE
                ========================= */

                if (
                    city &&
                    normalize(
                        driver.city ||
                        driver.ville
                    ) !==
                    normalize(city)
                ) {

                    return false;

                }



                /* =========================
                   COMMUNE
                   SAISIE MANUELLEMENT
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
                   SAISI MANUELLEMENT
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
                    !isAvailable(driver)
                ) {

                    return false;

                }



                /* =========================
                   RECHERCHE
                ========================= */

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
     * TRI PAR DISTANCE
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

        $("taxiAvailableOnly")
            .checked =
            false;

    }


    filteredDrivers =
        [...allDrivers];


    renderDrivers();

    updateMapMarkers();

}



/* ============================================================
   16. AFFICHAGE CHAUFFEURS
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
        isAvailable(
            driver
        );


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

        <div
            class="camu-taxi-driver-status"
            style="${
                available
                    ? ""
                    : "opacity:.65;"
            }"
        >

            <span
                class="camu-taxi-status-dot"
            ></span>

            ${
                available
                    ? "Disponible"
                    : "Indisponible"
            }

        </div>



        <div
            class="camu-taxi-driver-top"
        >

            <img
                class="camu-taxi-driver-photo"
                src="${escapeAttr(photo)}"
                alt="${escapeAttr(name)}"
                onerror="
                    this.src='assets/images/default-avatar.png'
                "
            >


            <div
                class="camu-taxi-driver-name"
            >

                <h3>

                    ${escapeHTML(name)}

                    ${
                        driver.verified
                            ? `
                                <span
                                    style="color:#16a34a"
                                    title="Chauffeur vérifié"
                                >
                                    ✓
                                </span>
                            `
                            : ""
                    }

                </h3>


                <div
                    class="camu-taxi-driver-location"
                >

                    <i
                        class="fa-solid fa-location-dot"
                    ></i>

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



        <div
            class="camu-taxi-driver-detail"
        >

            <i
                class="fa-solid fa-car"
            ></i>

            <span>

                <strong>
                    Véhicule :
                </strong>

                ${escapeHTML(vehicle)}

            </span>

        </div>



        ${
            brand || model
                ? `

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-car-side"
                        ></i>

                        <span>

                            <strong>
                                Modèle :
                            </strong>

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

                    <div
                        class="camu-taxi-driver-detail"
                    >

                        <i
                            class="fa-solid fa-palette"
                        ></i>

                        <span>

                            <strong>
                                Couleur :
                            </strong>

                            ${escapeHTML(color)}

                        </span>

                    </div>

                `
                : ""
        }



        ${
            plate
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

                            ${escapeHTML(plate)}

                        </span>

                    </div>

                `
                : ""
        }



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



        <div
            class="camu-taxi-driver-actions"
        >

            ${
                phone
                    ? `

                        <a
                            class="camu-taxi-driver-action"
                            href="tel:${escapeAttr(phone)}"
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

        </div>

    `;


    return card;

}



/* ============================================================
   18. GÉOLOCALISATION
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
                    driver.vehicleType ||
                    driver.vehicle ||
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

            Math.sqrt(
                1 - a
            )

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
   23. FORMAT DISTANCE
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
   24. DISPONIBILITÉ
============================================================ */

function isAvailable(
    driver
) {


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
   25. WHATSAPP
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

        `?text=${encodeURIComponent(
            message
        )}`

    );

}



/* ============================================================
   26. STATUT FIRESTORE
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
   27. STATUT LOCALISATION
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
   28. SLEEP
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
   29. NORMALISATION
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
   30. SÉCURITÉ HTML
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
   31. DEBUG
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
        () => userLocation,

    firestoreStatus:
        () =>
            firestoreConnected

};

/* =========================================================
   CAMU TAXI BOOKING
   js/camu-taxi.js

   V1 :
   - Annuaire des chauffeurs
   - Recherche / filtres
   - Géolocalisation du client
   - Carte Leaflet
   - Distance approximative
   - Contact WhatsApp
   - Sidebar mobile
========================================================= */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   VARIABLES
========================================================= */

let taxiMap = null;

let drivers = [];

let filteredDrivers = [];

let userLatitude = null;
let userLongitude = null;
let userAccuracy = null;

let userLocationMarker = null;
let driverMarkers = [];

let isLoadingDrivers = false;


/* =========================================================
   ELEMENTS HTML
========================================================= */

const taxiVille = document.getElementById("taxiVille");
const taxiCommune = document.getElementById("taxiCommune");
const taxiQuartier = document.getElementById("taxiQuartier");

const taxiSearch = document.getElementById("taxiSearch");
const taxiAvailableOnly = document.getElementById("taxiAvailableOnly");

const taxiResetButton = document.getElementById("taxiResetButton");

const taxiNearMeButton = document.getElementById("taxiNearMeButton");

const taxiDriversList = document.getElementById("taxiDriversList");

const taxiLoading = document.getElementById("taxiLoading");

const taxiEmpty = document.getElementById("taxiEmpty");

const taxiResultsCount = document.getElementById("taxiResultsCount");

const taxiResultsStatus = document.getElementById("taxiResultsStatus");


/* Sidebar */

const taxiSidebar = document.getElementById("taxiSidebar");
const taxiOverlay = document.getElementById("taxiOverlay");
const taxiMenuButton = document.getElementById("taxiMenuButton");

const taxiMenuNearMe = document.getElementById("taxiMenuNearMe");


/* =========================================================
   ZONES MANUELLES
=========================================================

   Les VILLES viennent de Firestore.

   Les communes et quartiers sont configurés ici.

   Pour ajouter des quartiers :
   ["Quartier 1", "Quartier 2"]

========================================================= */

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


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", initTaxi);


async function initTaxi() {

    try {

        initMap();

        setupEvents();

        setupSidebar();

        await loadVilles();

        await loadChauffeurs();

        applyFilters();

    } catch (error) {

        console.error(
            "Erreur initialisation CAMU TAXI :",
            error
        );

        showGlobalError(
            "Impossible de charger CAMU TAXI BOOKING."
        );

    }

}


/* =========================================================
   CARTE LEAFLET
========================================================= */

function initMap() {

    const mapElement = document.getElementById("taxiMap");

    if (!mapElement) {

        console.error(
            "Élément #taxiMap introuvable."
        );

        return;

    }


    /*
       Centre par défaut :
       Lubumbashi
    */

    taxiMap = L.map("taxiMap").setView(
        [-11.6647, 27.4794],
        10
    );


    /*
       OpenStreetMap
    */

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(taxiMap);

}


/* =========================================================
   EVENEMENTS
========================================================= */

function setupEvents() {


    /* -----------------------------------------
       Ville
    ----------------------------------------- */

    taxiVille?.addEventListener(
        "change",
        handleVilleChange
    );


    /* -----------------------------------------
       Commune
    ----------------------------------------- */

    taxiCommune?.addEventListener(
        "change",
        handleCommuneChange
    );


    /* -----------------------------------------
       Recherche
    ----------------------------------------- */

    taxiSearch?.addEventListener(
        "input",
        debounce(() => {

            applyFilters();

        }, 250)
    );


    /* -----------------------------------------
       Disponibilité
    ----------------------------------------- */

    taxiAvailableOnly?.addEventListener(
        "change",
        () => {

            applyFilters();

        }
    );


    /* -----------------------------------------
       Reset
    ----------------------------------------- */

    taxiResetButton?.addEventListener(
        "click",
        resetFilters
    );


    /* -----------------------------------------
       Localisation
    ----------------------------------------- */

    taxiNearMeButton?.addEventListener(
        "click",
        activateLocation
    );


    /* -----------------------------------------
       Resize carte
    ----------------------------------------- */

    window.addEventListener(
        "resize",
        () => {

            if (taxiMap) {

                setTimeout(() => {

                    taxiMap.invalidateSize();

                }, 200);

            }

        }
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {


    /* Bouton menu */

    taxiMenuButton?.addEventListener(
        "click",
        openTaxiSidebar
    );


    /* Overlay */

    taxiOverlay?.addEventListener(
        "click",
        closeTaxiSidebar
    );


    /* Tous les liens du menu */

    document
        .querySelectorAll(".taxi-menu-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    closeTaxiSidebar();

                }
            );

        });


    /* Taxis près de moi */

    taxiMenuNearMe?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeTaxiSidebar();

            activateLocation();

            document
                .getElementById("taxiMapSection")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }
    );

}


function openTaxiSidebar() {

    taxiSidebar?.classList.add("open");

    taxiOverlay?.classList.add("active");

}


function closeTaxiSidebar() {

    taxiSidebar?.classList.remove("open");

    taxiOverlay?.classList.remove("active");

}


/* =========================================================
   CHARGER LES VILLES
========================================================= */

async function loadVilles() {

    if (!taxiVille) {
        return;
    }

    try {

        taxiVille.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;

        const snapshot = await getDocs(
            collection(db, "villes")
        );


        const villes = [];


        snapshot.forEach(docSnap => {

            const data = docSnap.data();


            /*
               Plusieurs noms de champs acceptés
            */

            const ville =
                data.nom ||
                data.name ||
                data.ville ||
                data.label;


            if (
                ville &&
                typeof ville === "string"
            ) {

                const cleanVille =
                    ville.trim();


                if (
                    cleanVille &&
                    !villes.includes(cleanVille)
                ) {

                    villes.push(
                        cleanVille
                    );

                }

            }

        });


        /*
           Tri alphabétique
        */

        villes.sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        );


        taxiVille.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        villes.forEach(ville => {

            const option =
                document.createElement("option");

            option.value = ville;

            option.textContent = ville;

            taxiVille.appendChild(
                option
            );

        });


        /*
           Si aucune ville Firestore
        */

        if (villes.length === 0) {

            console.warn(
                "Aucune ville trouvée dans Firestore."
            );

        }


    } catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );


        taxiVille.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

    }

}


/* =========================================================
   CHARGER LES CHAUFFEURS
========================================================= */

async function loadChauffeurs() {

    if (isLoadingDrivers) {
        return;
    }

    isLoadingDrivers = true;

    showLoading(true);


    try {

        const snapshot = await getDocs(
            collection(db, "chauffeurs")
        );


        drivers = [];


        snapshot.forEach(docSnap => {

            const data = docSnap.data();


            const driver = {

                id: docSnap.id,

                ...data

            };


            /*
               Normalisation des champs
            */

            driver.nom =
                data.nom ||
                data.name ||
                data.nomComplet ||
                "Chauffeur CAMU";


            driver.prenom =
                data.prenom ||
                "";


            driver.telephone =
                data.telephone ||
                data.phone ||
                data.whatsapp ||
                "";


            driver.whatsapp =
                data.whatsapp ||
                data.telephone ||
                data.phone ||
                "";


            driver.ville =
                data.ville ||
                data.city ||
                "";


            driver.commune =
                data.commune ||
                "";


            driver.quartier =
                data.quartier ||
                "";


            driver.photo =
                data.photo ||
                data.photoURL ||
                data.photoUrl ||
                data.image ||
                "";


            driver.vehicule =
                data.vehicule ||
                data.vehicle ||
                data.typeVehicule ||
                "Véhicule";


            driver.marque =
                data.marque ||
                data.make ||
                "";


            driver.modele =
                data.modele ||
                data.model ||
                "";


            driver.couleur =
                data.couleur ||
                data.color ||
                "";


            driver.plaque =
                data.plaque ||
                data.plate ||
                data.immatriculation ||
                "";


            driver.disponible =
                normalizeBoolean(
                    data.disponible ??
                    data.available ??
                    data.isAvailable
                );


            driver.verifie =
                normalizeBoolean(
                    data.verifie ??
                    data.verified ??
                    data.isVerified
                );


            /*
               Coordonnées GPS
            */

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


            driver.lastLocationUpdate =
                data.lastLocationUpdate ||
                null;


            /*
               On conserve le chauffeur
               même sans GPS.
            */

            drivers.push(driver);

        });


        console.log(
            `${drivers.length} chauffeur(s) chargé(s).`
        );


    } catch (error) {

        console.error(
            "Erreur chargement chauffeurs :",
            error
        );


        drivers = [];


        showGlobalError(
            "Impossible de charger les chauffeurs."
        );


    } finally {

        isLoadingDrivers = false;

        showLoading(false);

    }

}


/* =========================================================
   CHANGEMENT DE VILLE
========================================================= */

function handleVilleChange() {

    const ville =
        taxiVille?.value || "";


    resetSelect(
        taxiCommune,
        "Toutes les communes"
    );


    resetSelect(
        taxiQuartier,
        "Tous les quartiers"
    );


    if (!ville) {

        disableSelect(
            taxiCommune,
            true
        );

        disableSelect(
            taxiQuartier,
            true
        );

        applyFilters();

        return;

    }


    const communes =
        zonesParVille[ville] || {};


    Object.keys(communes)
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        )
        .forEach(commune => {

            addOption(
                taxiCommune,
                commune,
                commune
            );

        });


    disableSelect(
        taxiCommune,
        false
    );


    disableSelect(
        taxiQuartier,
        true
    );


    applyFilters();

}


/* =========================================================
   CHANGEMENT DE COMMUNE
========================================================= */

function handleCommuneChange() {

    const ville =
        taxiVille?.value || "";

    const commune =
        taxiCommune?.value || "";


    resetSelect(
        taxiQuartier,
        "Tous les quartiers"
    );


    if (
        !ville ||
        !commune
    ) {

        disableSelect(
            taxiQuartier,
            true
        );

        applyFilters();

        return;

    }


    const quartiers =
        zonesParVille[ville]?.[commune] ||
        [];


    /*
       Si aucun quartier n'a encore
       été configuré, on laisse
       le select désactivé.
    */

    if (
        !Array.isArray(quartiers) ||
        quartiers.length === 0
    ) {

        disableSelect(
            taxiQuartier,
            true
        );

        applyFilters();

        return;

    }


    quartiers
        .slice()
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        )
        .forEach(quartier => {

            addOption(
                taxiQuartier,
                quartier,
                quartier
            );

        });


    disableSelect(
        taxiQuartier,
        false
    );


    applyFilters();

}


/* =========================================================
   FILTRES
========================================================= */

function applyFilters() {

    const ville =
        normalizeText(
            taxiVille?.value
        );


    const commune =
        normalizeText(
            taxiCommune?.value
        );


    const quartier =
        normalizeText(
            taxiQuartier?.value
        );


    const search =
        normalizeText(
            taxiSearch?.value
        );


    const availableOnly =
        Boolean(
            taxiAvailableOnly?.checked
        );


    filteredDrivers =
        drivers.filter(driver => {


            /* Ville */

            if (
                ville &&
                normalizeText(
                    driver.ville
                ) !== ville
            ) {

                return false;

            }


            /* Commune */

            if (
                commune &&
                normalizeText(
                    driver.commune
                ) !== commune
            ) {

                return false;

            }


            /* Quartier */

            if (
                quartier &&
                normalizeText(
                    driver.quartier
                ) !== quartier
            ) {

                return false;

            }


            /* Disponibilité */

            if (
                availableOnly &&
                !driver.disponible
            ) {

                return false;

            }


            /* Recherche */

            if (search) {

                const searchableText = [

                    driver.nom,

                    driver.prenom,

                    driver.telephone,

                    driver.whatsapp,

                    driver.ville,

                    driver.commune,

                    driver.quartier,

                    driver.vehicule,

                    driver.marque,

                    driver.modele,

                    driver.couleur,

                    driver.plaque

                ]
                    .filter(Boolean)
                    .join(" ");


                if (
                    !normalizeText(
                        searchableText
                    ).includes(search)
                ) {

                    return false;

                }

            }


            return true;

        });


    /*
       Calcul distance
    */

    filteredDrivers.forEach(
        driver => {

            driver.distance =
                calculateDriverDistance(
                    driver
                );

        }
    );


    /*
       Si position utilisateur
       disponible :

       1. Chauffeurs avec GPS
       2. plus proches en premier
       3. chauffeurs sans GPS après

       Sinon :

       ordre par nom.
    */

    filteredDrivers.sort(
        (a, b) => {

            const distanceA =
                a.distance;

            const distanceB =
                b.distance;


            if (
                distanceA !== null &&
                distanceB !== null
            ) {

                return (
                    distanceA -
                    distanceB
                );

            }


            if (
                distanceA !== null
            ) {

                return -1;

            }


            if (
                distanceB !== null
            ) {

                return 1;

            }


            return String(
                a.nom || ""
            ).localeCompare(
                String(
                    b.nom || ""
                ),
                "fr",
                {
                    sensitivity: "base"
                }
            );

        }
    );


    renderDrivers(
        filteredDrivers
    );


    renderDriverMarkers(
        filteredDrivers
    );


    updateResultsCount(
        filteredDrivers.length
    );


    updateLocationStatus();

}


/* =========================================================
   RENDRE LES CHAUFFEURS
========================================================= */

function renderDrivers(list) {

    if (!taxiDriversList) {
        return;
    }


    taxiDriversList.innerHTML = "";


    if (!list.length) {

        if (taxiEmpty) {

            taxiEmpty.hidden = false;

        }

        return;

    }


    if (taxiEmpty) {

        taxiEmpty.hidden = true;

    }


    const fragment =
        document.createDocumentFragment();


    list.forEach(driver => {

        const card =
            createDriverCard(
                driver
            );


        fragment.appendChild(
            card
        );

    });


    taxiDriversList.appendChild(
        fragment
    );

}


/* =========================================================
   CARTE D'UN CHAUFFEUR
========================================================= */

function createDriverCard(driver) {

    const article =
        document.createElement("article");


    article.className =
        "taxi-driver-card";


    const fullName =
        [
            driver.prenom,
            driver.nom
        ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
        "Chauffeur CAMU";


    const photo =
        validImage(
            driver.photo
        )
            ? driver.photo
            : createInitialAvatar(
                fullName
            );


    const vehicle =
        [
            driver.vehicule,
            driver.marque,
            driver.modele
        ]
            .filter(Boolean)
            .join(" ")
            .trim();


    const location =
        [
            driver.ville,
            driver.commune,
            driver.quartier
        ]
            .filter(Boolean)
            .join(" • ");


    const statusClass =
        driver.disponible
            ? "available"
            : "unavailable";


    const statusText =
        driver.disponible
            ? "Disponible"
            : "Indisponible";


    const distanceText =
        formatDistance(
            driver.distance
        );


    const verifiedHTML =
        driver.verifie
            ? `
                <span class="taxi-verified">
                    <i class="fa-solid fa-circle-check"></i>
                    Vérifié
                </span>
            `
            : "";


    article.innerHTML = `

        <div class="taxi-driver-header">

            <img
                class="taxi-driver-photo"
                src="${escapeAttribute(photo)}"
                alt="${escapeAttribute(fullName)}"
                loading="lazy"
            >

            <div class="taxi-driver-info">

                <h3 class="taxi-driver-name">
                    ${escapeHTML(fullName)}
                </h3>

                <span class="taxi-driver-status ${statusClass}">

                    <i class="fa-solid fa-circle"></i>

                    ${statusText}

                </span>

                ${verifiedHTML}

            </div>

        </div>


        <div class="taxi-driver-details">

            ${
                vehicle
                    ? `
                        <div class="taxi-detail">

                            <i class="fa-solid fa-car"></i>

                            <span>
                                ${escapeHTML(vehicle)}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                driver.plaque
                    ? `
                        <div class="taxi-detail">

                            <i class="fa-solid fa-id-card"></i>

                            <span>
                                Plaque :
                                ${escapeHTML(
                                    driver.plaque
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                driver.couleur
                    ? `
                        <div class="taxi-detail">

                            <i class="fa-solid fa-palette"></i>

                            <span>
                                ${escapeHTML(
                                    driver.couleur
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                location
                    ? `
                        <div class="taxi-detail">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>
                                ${escapeHTML(location)}
                            </span>

                        </div>
                    `
                    : ""
            }

        </div>


        ${
            distanceText
                ? `
                    <div class="taxi-driver-distance">

                        <i class="fa-solid fa-route"></i>

                        ${escapeHTML(
                            distanceText
                        )}

                    </div>
                `
                : ""
        }


        ${
            driver.whatsapp ||
            driver.telephone
                ? `
                    <a
                        class="taxi-whatsapp-button"
                        href="${escapeAttribute(
                            createWhatsAppLink(
                                driver.whatsapp ||
                                driver.telephone,
                                fullName
                            )
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <i class="fa-brands fa-whatsapp"></i>

                        Contacter sur WhatsApp

                    </a>
                `
                : `
                    <button
                        type="button"
                        class="taxi-whatsapp-button"
                        disabled
                        style="opacity:.55;cursor:not-allowed;"
                    >

                        <i class="fa-solid fa-phone-slash"></i>

                        Contact indisponible

                    </button>
                `
        }

    `;


    return article;

}


/* =========================================================
   MARQUEURS CHAUFFEURS
========================================================= */

function renderDriverMarkers(list) {

    if (!taxiMap) {
        return;
    }


    /*
       Supprimer les anciens marqueurs
    */

    driverMarkers.forEach(
        marker => {

            taxiMap.removeLayer(
                marker
            );

        }
    );


    driverMarkers = [];


    /*
       Ajouter les nouveaux
    */

    list.forEach(driver => {

        if (
            !isValidCoordinates(
                driver.latitude,
                driver.longitude
            )
        ) {

            return;

        }


        const marker =
            L.marker([
                driver.latitude,
                driver.longitude
            ]).addTo(taxiMap);


        const fullName =
            [
                driver.prenom,
                driver.nom
            ]
                .filter(Boolean)
                .join(" ")
                .trim() ||
            "Chauffeur CAMU";


        const vehicle =
            [
                driver.vehicule,
                driver.marque,
                driver.modele
            ]
                .filter(Boolean)
                .join(" ");


        const status =
            driver.disponible
                ? "Disponible"
                : "Indisponible";


        const statusClass =
            driver.disponible
                ? "available"
                : "unavailable";


        const whatsapp =
            driver.whatsapp ||
            driver.telephone;


        const whatsappHTML =
            whatsapp
                ? `
                    <br>
                    <a
                        href="${escapeAttribute(
                            createWhatsAppLink(
                                whatsapp,
                                fullName
                            )
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i class="fa-brands fa-whatsapp"></i>
                        WhatsApp
                    </a>
                `
                : "";


        const popupHTML = `

            <div class="taxi-map-popup">

                <strong>
                    ${escapeHTML(fullName)}
                </strong>

                <br>

                <span class="${statusClass}">
                    ${escapeHTML(status)}
                </span>

                ${
                    vehicle
                        ? `
                            <br>
                            ${escapeHTML(
                                vehicle
                            )}
                        `
                        : ""
                }

                ${
                    driver.plaque
                        ? `
                            <br>
                            Plaque :
                            ${escapeHTML(
                                driver.plaque
                            )}
                        `
                        : ""
                }

                ${
                    driver.ville
                        ? `
                            <br>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(
                                [
                                    driver.ville,
                                    driver.commune,
                                    driver.quartier
                                ]
                                    .filter(Boolean)
                                    .join(" • ")
                            )}
                        `
                        : ""
                }

                ${
                    driver.distance !== null
                        ? `
                            <br>
                            <i class="fa-solid fa-route"></i>
                            ${escapeHTML(
                                formatDistance(
                                    driver.distance
                                )
                            )}
                        `
                        : ""
                }

                ${whatsappHTML}

            </div>

        `;


        marker.bindPopup(
            popupHTML
        );


        driverMarkers.push(
            marker
        );

    });

}


/* =========================================================
   GEOLOCALISATION UTILISATEUR
========================================================= */

function activateLocation() {

    if (
        !navigator.geolocation
    ) {

        updateStatus(
            "La géolocalisation n'est pas disponible sur cet appareil.",
            "error"
        );

        return;

    }


    if (taxiNearMeButton) {

        taxiNearMeButton.disabled =
            true;

        taxiNearMeButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Localisation...
        `;

    }


    updateStatus(
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
                "Position utilisateur :",
                {
                    latitude:
                        userLatitude,

                    longitude:
                        userLongitude,

                    accuracy:
                        userAccuracy
                }
            );


            showUserLocation();


            applyFilters();


            if (taxiMap) {

                taxiMap.setView(
                    [
                        userLatitude,
                        userLongitude
                    ],
                    14
                );

            }


            updateStatus(
                "Votre position a été trouvée. Les chauffeurs sont classés par proximité.",
                "success"
            );


            if (taxiNearMeButton) {

                taxiNearMeButton.disabled =
                    false;

                taxiNearMeButton.innerHTML = `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    Actualiser ma position
                `;

            }

        },

        error => {

            console.error(
                "Erreur géolocalisation :",
                error
            );


            let message =
                "Impossible de récupérer votre position.";


            switch (error.code) {

                case error.PERMISSION_DENIED:

                    message =
                        "Autorisation de localisation refusée. Activez la localisation dans votre navigateur.";

                    break;


                case error.POSITION_UNAVAILABLE:

                    message =
                        "Votre position n'est pas disponible actuellement.";

                    break;


                case error.TIMEOUT:

                    message =
                        "La recherche de votre position a pris trop de temps.";

                    break;

            }


            updateStatus(
                message,
                "error"
            );


            if (taxiNearMeButton) {

                taxiNearMeButton.disabled =
                    false;

                taxiNearMeButton.innerHTML = `
                    <i class="fa-solid fa-location-crosshairs"></i>
                    Utiliser ma position
                `;

            }

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );

}


/* =========================================================
   MARQUEUR POSITION UTILISATEUR
========================================================= */

function showUserLocation() {

    if (
        !taxiMap ||
        userLatitude === null ||
        userLongitude === null
    ) {

        return;

    }


    /*
       Supprimer ancien marqueur
    */

    if (userLocationMarker) {

        taxiMap.removeLayer(
            userLocationMarker
        );

    }


    /*
       Marqueur
    */

    userLocationMarker =
        L.circleMarker(
            [
                userLatitude,
                userLongitude
            ],
            {
                radius: 9,

                color: "#063b73",

                fillColor: "#20a86b",

                fillOpacity: .9,

                weight: 3
            }
        ).addTo(taxiMap);


    userLocationMarker.bindPopup(
        `
            <strong>Votre position</strong>
            <br>
            Précision :
            ${
                userAccuracy
                    ? Math.round(
                        userAccuracy
                    ) + " m"
                    : "inconnue"
            }
        `
    );

}


/* =========================================================
   DISTANCE
========================================================= */

function calculateDriverDistance(
    driver
) {

    if (
        userLatitude === null ||
        userLongitude === null
    ) {

        return null;

    }


    if (
        !isValidCoordinates(
            driver.latitude,
            driver.longitude
        )
    ) {

        return null;

    }


    return calculateDistance(
        userLatitude,
        userLongitude,
        driver.latitude,
        driver.longitude
    );

}


function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;


    const dLat =
        degreesToRadians(
            lat2 - lat1
        );


    const dLon =
        degreesToRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            degreesToRadians(lat1)
        ) *

        Math.cos(
            degreesToRadians(lat2)
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


    return earthRadius * c;

}


function degreesToRadians(
    degrees
) {

    return degrees *
        Math.PI /
        180;

}


/* =========================================================
   FORMAT DISTANCE
========================================================= */

function formatDistance(
    distance
) {

    if (
        distance === null ||
        !Number.isFinite(distance)
    ) {

        return "";

    }


    if (distance < 1) {

        return `${Math.round(
            distance * 1000
        )} m de vous`;

    }


    return `${distance.toFixed(
        1
    )} km de vous`;

}


/* =========================================================
   WHATSAPP
========================================================= */

function createWhatsAppLink(
    phone,
    driverName = ""
) {

    const cleanPhone =
        cleanPhoneNumber(
            phone
        );


    if (!cleanPhone) {

        return "#";

    }


    const message =
        `Bonjour ${driverName}, je vous contacte via CAMU SERVICES - CAMU TAXI BOOKING. Êtes-vous disponible ?`;


    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
    )}`;

}


/* =========================================================
   NETTOYER NUMERO
========================================================= */

function cleanPhoneNumber(
    phone
) {

    if (!phone) {

        return "";

    }


    let cleaned =
        String(phone)
            .trim()
            .replace(
                /[^\d+]/g,
                ""
            );


    /*
       Retirer + au début
    */

    cleaned =
        cleaned.replace(
            /^\+/,
            ""
        );


    /*
       Exemple RDC :
       0812345678
       devient
       243812345678

       Si déjà 243..., on ne touche pas.
    */

    if (
        cleaned.startsWith("0")
    ) {

        cleaned =
            "243" +
            cleaned.substring(1);

    }


    return cleaned;

}


/* =========================================================
   RESET
========================================================= */

function resetFilters() {

    if (taxiVille) {

        taxiVille.value = "";

    }


    resetSelect(
        taxiCommune,
        "Toutes les communes"
    );


    resetSelect(
        taxiQuartier,
        "Tous les quartiers"
    );


    disableSelect(
        taxiCommune,
        true
    );


    disableSelect(
        taxiQuartier,
        true
    );


    if (taxiSearch) {

        taxiSearch.value = "";

    }


    if (taxiAvailableOnly) {

        taxiAvailableOnly.checked =
            false;

    }


    applyFilters();


    /*
       Recentrer la carte
       si la position utilisateur
       existe.
    */

    if (
        taxiMap &&
        userLatitude !== null &&
        userLongitude !== null
    ) {

        taxiMap.setView(
            [
                userLatitude,
                userLongitude
            ],
            14
        );

    }

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateResultsCount(
    count
) {

    if (!taxiResultsCount) {
        return;
    }


    taxiResultsCount.textContent =
        count === 0
            ? "0 chauffeur"
            : count === 1
                ? "1 chauffeur"
                : `${count} chauffeurs`;

}


/* =========================================================
   STATUS
========================================================= */

function updateLocationStatus() {

    if (!taxiResultsStatus) {
        return;
    }


    if (
        userLatitude !== null &&
        userLongitude !== null
    ) {

        taxiResultsStatus.innerHTML = `
            <i class="fa-solid fa-location-dot"></i>
            Chauffeurs classés selon leur distance par rapport à vous.
        `;

        return;

    }


    taxiResultsStatus.innerHTML = `
        <i class="fa-solid fa-location-dot"></i>
        Activez votre position pour trouver les chauffeurs les plus proches.
    `;

}


function updateStatus(
    message,
    type = "normal"
) {

    if (!taxiResultsStatus) {
        return;
    }


    let icon =
        "fa-location-dot";


    if (type === "loading") {

        icon =
            "fa-spinner fa-spin";

    }


    if (type === "error") {

        icon =
            "fa-circle-exclamation";

    }


    if (type === "success") {

        icon =
            "fa-circle-check";

    }


    taxiResultsStatus.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        ${escapeHTML(message)}
    `;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
    visible
) {

    if (taxiLoading) {

        taxiLoading.style.display =
            visible
                ? "flex"
                : "none";

    }

}


/* =========================================================
   SELECT UTILITIES
========================================================= */

function resetSelect(
    select,
    firstLabel
) {

    if (!select) {
        return;
    }


    select.innerHTML = "";


    const option =
        document.createElement("option");


    option.value = "";

    option.textContent =
        firstLabel;


    select.appendChild(
        option
    );

}


function addOption(
    select,
    value,
    label
) {

    if (!select) {
        return;
    }


    const option =
        document.createElement("option");


    option.value =
        value;

    option.textContent =
        label;


    select.appendChild(
        option
    );

}


function disableSelect(
    select,
    disabled
) {

    if (!select) {
        return;
    }


    select.disabled =
        disabled;

}


/* =========================================================
   BOOLEAN
========================================================= */

function normalizeBoolean(
    value
) {

    if (
        value === true ||
        value === 1
    ) {

        return true;

    }


    if (
        typeof value === "string"
    ) {

        return [
            "true",
            "1",
            "oui",
            "yes",
            "available",
            "disponible"
        ].includes(
            normalizeText(value)
        );

    }


    return false;

}


/* =========================================================
   NUMBER
========================================================= */

function toNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* =========================================================
   COORDONNEES VALIDES
========================================================= */

function isValidCoordinates(
    latitude,
    longitude
) {

    return (

        Number.isFinite(
            latitude
        ) &&

        Number.isFinite(
            longitude
        ) &&

        latitude >= -90 &&
        latitude <= 90 &&

        longitude >= -180 &&
        longitude <= 180

    );

}


/* =========================================================
   NORMALISER TEXTE
========================================================= */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


/* =========================================================
   IMAGE
========================================================= */

function validImage(
    url
) {

    if (!url) {
        return false;
    }


    try {

        const parsed =
            new URL(url);


        return (
            parsed.protocol ===
                "http:" ||

            parsed.protocol ===
                "https:"
        );

    } catch {

        return false;

    }

}


/* =========================================================
   AVATAR INITIAL
========================================================= */

function createInitialAvatar(
    name
) {

    const initials =
        String(name || "C")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                word =>
                    word.charAt(0)
                        .toUpperCase()
            )
            .join("") ||
        "C";


    /*
       SVG généré localement
       pour éviter une image externe.
    */

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            viewBox="0 0 120 120"
        >

            <rect
                width="120"
                height="120"
                rx="60"
                fill="#063b73"
            />

            <text
                x="60"
                y="70"
                text-anchor="middle"
                font-family="Arial"
                font-size="42"
                font-weight="700"
                fill="#ffffff"
            >
                ${initials}
            </text>

        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    delay = 250
) {

    let timeout;


    return (...args) => {

        clearTimeout(
            timeout
        );


        timeout =
            setTimeout(
                () => {

                    callback(
                        ...args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   ERREUR GLOBALE
========================================================= */

function showGlobalError(
    message
) {

    if (taxiLoading) {

        taxiLoading.style.display =
            "none";

    }


    if (taxiEmpty) {

        taxiEmpty.hidden =
            false;


        const title =
            taxiEmpty.querySelector(
                "h3"
            );


        const text =
            taxiEmpty.querySelector(
                "p"
            );


        if (title) {

            title.textContent =
                "Une erreur est survenue";

        }


        if (text) {

            text.textContent =
                message;

        }

    }


    updateStatus(
        message,
        "error"
    );

}


/* =========================================================
   EXPORT OPTIONNEL
=========================================================

   Utile si un autre fichier doit accéder
   à la fonction de localisation.

========================================================= */

window.CAMUTaxi = {

    activateLocation,

    resetFilters,

    applyFilters,

    openTaxiSidebar,

    closeTaxiSidebar

};

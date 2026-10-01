import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CAMU TAXI BOOKING — V1
// =====================================================


// -----------------------------------------------------
// ELEMENTS
// -----------------------------------------------------

const villeSelect = document.getElementById("taxiVille");
const communeSelect = document.getElementById("taxiCommune");
const quartierSelect = document.getElementById("taxiQuartier");

const searchInput = document.getElementById("taxiSearch");
const availableOnly = document.getElementById("taxiAvailableOnly");

const resetButton = document.getElementById("taxiResetButton");
const nearMeButton = document.getElementById("taxiNearMeButton");

const driversList = document.getElementById("taxiDriversList");
const loading = document.getElementById("taxiLoading");
const empty = document.getElementById("taxiEmpty");

const resultsCount = document.getElementById("taxiResultsCount");
const resultsStatus = document.getElementById("taxiResultsStatus");

const locationMessage = document.getElementById(
    "taxiLocationMessage"
);


// -----------------------------------------------------
// DONNÉES
// -----------------------------------------------------

let chauffeurs = [];
let villes = [];

let userLatitude = null;
let userLongitude = null;


// -----------------------------------------------------
// COMMUNES ET QUARTIERS
// -----------------------------------------------------

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


// -----------------------------------------------------
// INITIALISATION
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    console.log("CAMU TAXI — Initialisation...");

    setupEvents();

    await loadVilles();

    await loadChauffeurs();

    applyFilters();

});


// -----------------------------------------------------
// EVENEMENTS
// -----------------------------------------------------

function setupEvents() {

    villeSelect.addEventListener(
        "change",
        handleVilleChange
    );

    communeSelect.addEventListener(
        "change",
        handleCommuneChange
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
        findNearbyDrivers
    );

}


// -----------------------------------------------------
// CHARGER LES VILLES FIRESTORE
// -----------------------------------------------------

async function loadVilles() {

    try {

        villeSelect.innerHTML = `
            <option value="">
                Chargement des villes...
            </option>
        `;

        const snapshot = await getDocs(
            collection(db, "villes")
        );

        villes = [];

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            const nom =
                data.nom ||
                data.name ||
                data.ville ||
                data.label;

            if (!nom) return;

            villes.push({
                id: docSnap.id,
                nom: String(nom).trim()
            });

        });


        // Supprimer les doublons
        const uniqueVilles = [
            ...new Map(
                villes.map(v => [
                    v.nom.toLowerCase(),
                    v
                ])
            ).values()
        ];


        uniqueVilles.sort((a, b) =>
            a.nom.localeCompare(
                b.nom,
                "fr",
                { sensitivity: "base" }
            )
        );


        villeSelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        uniqueVilles.forEach(ville => {

            const option =
                document.createElement("option");

            option.value = ville.nom;
            option.textContent = ville.nom;

            villeSelect.appendChild(option);

        });


        console.log(
            `CAMU TAXI — ${uniqueVilles.length} ville(s) chargée(s).`
        );

    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chargement villes :",
            error
        );

        villeSelect.innerHTML = `
            <option value="">
                Impossible de charger les villes
            </option>
        `;

    }

}


// -----------------------------------------------------
// CHARGER LES CHAUFFEURS
// -----------------------------------------------------

async function loadChauffeurs() {

    try {

        loading.classList.remove("hidden");

        const snapshot = await getDocs(
            collection(db, "chauffeurs")
        );

        chauffeurs = [];

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            chauffeurs.push({
                id: docSnap.id,
                ...data
            });

        });


        console.log(
            `CAMU TAXI — ${chauffeurs.length} chauffeur(s) chargé(s).`
        );

    } catch (error) {

        console.error(
            "CAMU TAXI — Erreur chauffeurs :",
            error
        );

        chauffeurs = [];

        resultsStatus.textContent =
            "Impossible de charger les chauffeurs.";

    } finally {

        loading.classList.add("hidden");

    }

}


// -----------------------------------------------------
// CHANGEMENT VILLE
// -----------------------------------------------------

function handleVilleChange() {

    const ville = villeSelect.value;

    resetSelect(
        communeSelect,
        "Toutes les communes"
    );

    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    if (!ville) {

        communeSelect.disabled = true;
        quartierSelect.disabled = true;

        applyFilters();

        return;
    }


    const communes =
        findCommunes(ville);


    if (!communes.length) {

        communeSelect.disabled = true;
        quartierSelect.disabled = true;

        applyFilters();

        return;
    }


    communeSelect.disabled = false;


    communes.forEach(commune => {

        const option =
            document.createElement("option");

        option.value = commune;
        option.textContent = commune;

        communeSelect.appendChild(option);

    });


    applyFilters();

}


// -----------------------------------------------------
// CHANGEMENT COMMUNE
// -----------------------------------------------------

function handleCommuneChange() {

    const ville =
        villeSelect.value;

    const commune =
        communeSelect.value;


    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    if (!ville || !commune) {

        quartierSelect.disabled = true;

        applyFilters();

        return;
    }


    const quartiers =
        findQuartiers(
            ville,
            commune
        );


    if (!quartiers.length) {

        quartierSelect.disabled = true;

        applyFilters();

        return;
    }


    quartierSelect.disabled = false;


    quartiers.forEach(quartier => {

        const option =
            document.createElement("option");

        option.value = quartier;
        option.textContent = quartier;

        quartierSelect.appendChild(option);

    });


    applyFilters();

}


// -----------------------------------------------------
// COMMUNES
// -----------------------------------------------------

function findCommunes(ville) {

    const key =
        findZoneKey(ville);

    if (!key) return [];

    return Object.keys(
        zonesParVille[key]
    );

}


// -----------------------------------------------------
// QUARTIERS
// -----------------------------------------------------

function findQuartiers(
    ville,
    commune
) {

    const key =
        findZoneKey(ville);

    if (!key) return [];

    return (
        zonesParVille[key]?.[commune] ||
        []
    );

}


// -----------------------------------------------------
// NORMALISATION VILLE
// -----------------------------------------------------

function normalize(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

}


function findZoneKey(ville) {

    const normalized =
        normalize(ville);

    return Object.keys(zonesParVille)
        .find(key =>
            normalize(key) === normalized
        );

}


// -----------------------------------------------------
// FILTRAGE
// -----------------------------------------------------

function applyFilters() {

    const ville =
        villeSelect.value;

    const commune =
        communeSelect.value;

    const quartier =
        quartierSelect.value;

    const search =
        normalize(searchInput.value);

    const onlyAvailable =
        availableOnly.checked;


    let results =
        [...chauffeurs];


    // Ville
    if (ville) {

        results =
            results.filter(chauffeur =>
                normalize(
                    chauffeur.ville
                ) === normalize(ville)
            );

    }


    // Commune
    if (commune) {

        results =
            results.filter(chauffeur =>
                normalize(
                    chauffeur.commune
                ) === normalize(commune)
            );

    }


    // Quartier
    if (quartier) {

        results =
            results.filter(chauffeur =>
                normalize(
                    chauffeur.quartier
                ) === normalize(quartier)
            );

    }


    // Nom
    if (search) {

        results =
            results.filter(chauffeur => {

                const nom =
                    normalize(
                        chauffeur.nom ||
                        chauffeur.name ||
                        chauffeur.displayName
                    );

                return nom.includes(search);

            });

    }


    // Disponibilité
    if (onlyAvailable) {

        results =
            results.filter(
                chauffeur =>
                    chauffeur.disponible === true
            );

    }


    // Si une position existe,
    // classer par distance
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


    renderDrivers(results);

}


// -----------------------------------------------------
// AFFICHAGE
// -----------------------------------------------------

function renderDrivers(results) {

    driversList.innerHTML = "";


    resultsCount.textContent =
        `${results.length} chauffeur(s)`;


    if (!results.length) {

        empty.classList.remove("hidden");

        return;

    }


    empty.classList.add("hidden");


    results.forEach(chauffeur => {

        driversList.appendChild(
            createDriverCard(chauffeur)
        );

    });

}


// -----------------------------------------------------
// CARTE CHAUFFEUR
// -----------------------------------------------------

function createDriverCard(chauffeur) {

    const card =
        document.createElement("article");

    card.className =
        "taxi-driver-card";


    const nom =
        chauffeur.nom ||
        chauffeur.name ||
        chauffeur.displayName ||
        "Chauffeur CAMU";


    const photo =
        validImage(chauffeur.photo)
            ? chauffeur.photo
            : validImage(chauffeur.photoURL)
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


    const whatsappNumber =
        cleanPhoneNumber(whatsapp);


    const whatsappLink =
        whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                "Bonjour, je vous contacte via CAMU TAXI BOOKING. Je souhaite prendre un taxi."
            )}`
            : "#";


    let distanceHTML = "";


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
                ${disponible ? "available" : "unavailable"}
            ">
                <span></span>
                ${disponible ? "Disponible" : "Indisponible"}
            </span>

        </div>


        <div class="taxi-driver-content">

            <div class="taxi-driver-name-row">

                <h3>
                    ${escapeHTML(nom)}
                </h3>

                ${
                    chauffeur.verified === true
                        ? `
                            <span
                                class="taxi-verified"
                                title="Chauffeur vérifié"
                            >
                                <i class="fa-solid fa-circle-check"></i>
                            </span>
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
                            ${escapeHTML(chauffeur.plaque)}
                        </div>
                    `
                    : ""
            }


            ${
                location
                    ? `
                        <div class="taxi-info-line">
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(location)}
                        </div>
                    `
                    : ""
            }


            ${distanceHTML}


            <div class="taxi-driver-actions">

                ${
                    whatsappNumber
                        ? `
                            <a
                                href="${whatsappLink}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="taxi-whatsapp-button"
                            >
                                <i class="fa-brands fa-whatsapp"></i>
                                WhatsApp
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


// -----------------------------------------------------
// GEOLOCALISATION
// -----------------------------------------------------

function findNearbyDrivers() {

    if (!navigator.geolocation) {

        showLocationMessage(
            "La géolocalisation n'est pas disponible sur cet appareil.",
            "error"
        );

        return;
    }


    showLocationMessage(
        "Recherche des taxis proches...",
        "loading"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;


            showLocationMessage(
                "Votre position a été utilisée pour classer les chauffeurs par proximité.",
                "success"
            );


            applyFilters();

        },


        error => {

            console.error(
                "CAMU TAXI — Géolocalisation :",
                error
            );


            showLocationMessage(
                "Impossible d'obtenir votre position. Vérifiez l'autorisation de localisation.",
                "error"
            );

        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
        }

    );

}


// -----------------------------------------------------
// DISTANCE
// -----------------------------------------------------

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
        !Number.isFinite(latitude2) ||
        !Number.isFinite(longitude2)
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
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(latitude2)) *
        Math.sin(dLon / 2) ** 2;


    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );

}


function toRadians(value) {

    return value * Math.PI / 180;

}


function formatDistance(distance) {

    if (distance < 1) {

        return `${Math.round(distance * 1000)} m`;

    }

    return `${distance.toFixed(1)} km`;

}


// -----------------------------------------------------
// RESET
// -----------------------------------------------------

function resetFilters() {

    villeSelect.value = "";

    resetSelect(
        communeSelect,
        "Toutes les communes"
    );

    resetSelect(
        quartierSelect,
        "Tous les quartiers"
    );


    communeSelect.disabled = true;
    quartierSelect.disabled = true;

    searchInput.value = "";

    availableOnly.checked = false;


    userLatitude = null;
    userLongitude = null;


    locationMessage.classList.add(
        "hidden"
    );


    resultsStatus.textContent = "";


    applyFilters();

}


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


// -----------------------------------------------------
// UTILITAIRES
// -----------------------------------------------------

function validImage(url) {

    if (!url) return false;

    const value =
        String(url).trim();

    return (
        value.startsWith("http://") ||
        value.startsWith("https://")
    );

}


function cleanPhoneNumber(phone) {

    if (!phone) return "";

    let number =
        String(phone)
            .replace(/[^\d+]/g, "");


    if (number.startsWith("+")) {

        number =
            number.substring(1);

    }


    return number;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showLocationMessage(
    message,
    type
) {

    locationMessage.textContent =
        message;

    locationMessage.className =
        `taxi-location-message ${type}`;

}

/* =========================================================
   CAMU IMMO
   immobilier.js
========================================================= */

import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   VARIABLES
========================================================= */

let allAds = [];

let allAgents = [];

let filteredAds = [];


/* =========================================================
   ELEMENTS
========================================================= */

const venteListings =
    document.getElementById("venteListings");

const locationListings =
    document.getElementById("locationListings");

const venteCount =
    document.getElementById("venteCount");

const locationCount =
    document.getElementById("locationCount");

const immoSearchForm =
    document.getElementById("immoSearchForm");

const immoSearch =
    document.getElementById("immoSearch");

const immoCity =
    document.getElementById("immoCity");

const agentsList =
    document.getElementById("agentsList");

const agentCity =
    document.getElementById("agentCity");

const agentCommune =
    document.getElementById("agentCommune");

const immoRequestForm =
    document.getElementById("immoRequestForm");


/* =========================================================
   UTILITAIRES
========================================================= */

function normalize(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatPrice(price, currency = "USD") {

    const number = Number(price);

    if (!Number.isFinite(number)) {
        return "Prix sur demande";
    }

    const formatted =
        new Intl.NumberFormat("fr-FR").format(number);

    return `${formatted} ${currency}`;

}


/* =========================================================
   DÉTERMINER LE TYPE D'ANNONCE
========================================================= */

function getTransactionType(ad) {

    const values = [

        ad.type,
        ad.transactionType,
        ad.transaction,
        ad.operation,
        ad.listingType,
        ad.offerType,
        ad.saleType,
        ad.mode,
        ad.statusType

    ];

    const text =
        values
            .filter(Boolean)
            .map(value => normalize(value))
            .join(" ");

    /*
       VENTE
    */

    if (
        text.includes("vente") ||
        text.includes("vendre") ||
        text.includes("vendu") ||
        text.includes("sell") ||
        text.includes("sale")
    ) {
        return "vente";
    }


    /*
       LOCATION
    */

    if (
        text.includes("location") ||
        text.includes("louer") ||
        text.includes("louee") ||
        text.includes("locatif") ||
        text.includes("rent") ||
        text.includes("rental")
    ) {
        return "location";
    }


    /*
       On regarde également le titre
    */

    const title =
        normalize(ad.title);


    if (
        title.includes("a vendre") ||
        title.includes("vente") ||
        title.includes("vend")
    ) {
        return "vente";
    }


    if (
        title.includes("a louer") ||
        title.includes("location") ||
        title.includes("lou")
    ) {
        return "location";
    }


    return "";
}


/* =========================================================
   DÉTERMINER SI C'EST UNE ANNONCE IMMOBILIÈRE
========================================================= */

function isRealEstate(ad) {

    const values = [

        ad.category,
        ad.categoryName,
        ad.subcategory,
        ad.type,
        ad.title,
        ad.description

    ];

    const text =
        values
            .filter(Boolean)
            .map(value => normalize(value))
            .join(" ");


    const keywords = [

        "immobilier",
        "immobiliere",
        "immobilières",
        "maison",
        "appartement",
        "terrain",
        "parcelle",
        "villa",
        "bureau",
        "immeuble",
        "logement",
        "chambre",
        "studio",
        "magasin",
        "commerce",
        "ferme",
        "hotel"

    ];


    return keywords.some(
        keyword => text.includes(normalize(keyword))
    );
}


/* =========================================================
   CHARGER LES ANNONCES
   SOURCE : FIRESTORE / ANNONCES
========================================================= */

async function loadAds() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "annonces")
            );


        allAds = [];


        snapshot.forEach(documentSnapshot => {

            const data =
                documentSnapshot.data();


            /*
               On garde uniquement les annonces
               immobilières
            */

            if (!isRealEstate(data)) {
                return;
            }


            allAds.push({

                id: documentSnapshot.id,

                ...data

            });

        });


        filteredAds = [...allAds];


        renderAds();

    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );


        showListingsError(
            venteListings,
            "Impossible de charger les annonces immobilières."
        );


        showListingsError(
            locationListings,
            "Impossible de charger les annonces immobilières."
        );

    }

}


/* =========================================================
   FILTRER LES ANNONCES
========================================================= */

function filterAds() {

    const keyword =
        normalize(immoSearch?.value);

    const city =
        normalize(immoCity?.value);


    filteredAds =
        allAds.filter(ad => {

            const title =
                normalize(ad.title);

            const description =
                normalize(ad.description);

            const category =
                normalize(ad.category);

            const adCity =
                normalize(ad.city);

            const neighborhood =
                normalize(ad.neighborhood);


            const matchesKeyword =
                !keyword ||
                title.includes(keyword) ||
                description.includes(keyword) ||
                category.includes(keyword) ||
                adCity.includes(keyword) ||
                neighborhood.includes(keyword);


            const matchesCity =
                !city ||
                adCity === city ||
                adCity.includes(city);


            return (
                matchesKeyword &&
                matchesCity
            );

        });


    renderAds();

}


/* =========================================================
   AFFICHER LES ANNONCES
========================================================= */

function renderAds() {

    const sales =
        filteredAds.filter(
            ad => getTransactionType(ad) === "vente"
        );


    const rentals =
        filteredAds.filter(
            ad => getTransactionType(ad) === "location"
        );


    renderListingGroup(
        venteListings,
        sales,
        "Aucun bien à vendre."
    );


    renderListingGroup(
        locationListings,
        rentals,
        "Aucun bien à louer."
    );


    updateCount(
        venteCount,
        sales.length,
        "bien"
    );


    updateCount(
        locationCount,
        rentals.length,
        "bien"
    );

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateCount(element, count, singular) {

    if (!element) {
        return;
    }


    if (count === 0) {

        element.textContent =
            `0 ${singular}`;

        return;
    }


    element.textContent =
        `${count} ${count > 1 ? singular + "s" : singular}`;

}


/* =========================================================
   RENDRE UN GROUPE D'ANNONCES
========================================================= */

function renderListingGroup(
    container,
    listings,
    emptyMessage
) {

    if (!container) {
        return;
    }


    if (!listings.length) {

        container.innerHTML = `
            <div class="immo-empty">
                <i class="fa-solid fa-house"></i>
                <br><br>
                ${escapeHtml(emptyMessage)}
            </div>
        `;

        return;
    }


    container.innerHTML =
        listings
            .map(renderPropertyCard)
            .join("");

}


/* =========================================================
   CARTE ANNONCE
========================================================= */

function renderPropertyCard(ad) {

    const image =
        Array.isArray(ad.images) && ad.images.length
            ? ad.images[0]
            : (
                ad.imageURL ||
                ad.imageUrl ||
                "assets/img/placeholder.jpg"
            );


    const city =
        ad.city ||
        "Ville non précisée";


    const neighborhood =
        ad.neighborhood ||
        "";


    const location =
        neighborhood
            ? `${neighborhood}, ${city}`
            : city;


    const transaction =
        getTransactionType(ad);


    const transactionLabel =
        transaction === "vente"
            ? "À vendre"
            : "À louer";


    return `
        <article class="immo-property-card">

            <div class="immo-property-image">

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(ad.title || "Bien immobilier")}"
                    loading="lazy"
                    onerror="this.src='assets/img/placeholder.jpg'"
                >

                <span class="immo-property-type">
                    ${transactionLabel}
                </span>

            </div>


            <div class="immo-property-body">

                <h3>
                    ${escapeHtml(
                        ad.title || "Bien immobilier"
                    )}
                </h3>


                <div class="immo-property-location">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHtml(location)}
                    </span>

                </div>


                <div class="immo-property-price">
                    ${escapeHtml(
                        formatPrice(
                            ad.price,
                            ad.currency || "USD"
                        )
                    )}
                </div>


                <a
                    href="explorer.html?id=${encodeURIComponent(ad.id)}"
                    class="immo-property-link"
                >
                    Voir l'annonce
                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        </article>
    `;

}


/* =========================================================
   ERREUR
========================================================= */

function showListingsError(
    container,
    message
) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="immo-empty">

            <i class="fa-solid fa-circle-exclamation"></i>

            <br><br>

            ${escapeHtml(message)}

        </div>
    `;

}


/* =========================================================
   CHARGER LES AGENTS
   SOURCE : FIRESTORE / USERS
========================================================= */

async function loadAgents() {

    if (!agentsList) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        allAgents = [];


        snapshot.forEach(documentSnapshot => {

            const user =
                documentSnapshot.data();


            /*
               On accepte plusieurs noms de champs
               pour rendre le système compatible
               avec différentes structures USERS.
            */

            const role =
                normalize(
                    user.role ||
                    user.userRole ||
                    user.type ||
                    user.accountType ||
                    ""
                );


            const profession =
                normalize(
                    user.profession ||
                    user.job ||
                    user.metier ||
                    user.category ||
                    ""
                );


            const isAgent =
                role.includes("agent") ||
                role.includes("immobilier") ||
                role.includes("immo") ||
                profession.includes("agent") ||
                profession.includes("immobilier") ||
                profession.includes("immo");


            if (!isAgent) {
                return;
            }


            allAgents.push({

                id: documentSnapshot.id,

                ...user

            });

        });


        renderAgents();


    } catch (error) {

        console.error(
            "Erreur chargement agents :",
            error
        );


        agentsList.innerHTML = `
            <div class="immo-empty">

                <i class="fa-solid fa-circle-exclamation"></i>

                <br><br>

                Impossible de charger les agents immobiliers.

            </div>
        `;

    }

}


/* =========================================================
   EXTRAIRE VILLE
========================================================= */

function getUserCity(user) {

    return (
        user.city ||
        user.ville ||
        user.locationCity ||
        user.locality ||
        ""
    );

}


/* =========================================================
   EXTRAIRE COMMUNE
========================================================= */

function getUserCommune(user) {

    return (
        user.commune ||
        user.Commune ||
        user.locationCommune ||
        user.localityCommune ||
        ""
    );

}


/* =========================================================
   RENDRE LES AGENTS
========================================================= */

function renderAgents() {

    if (!agentsList) {
        return;
    }


    const selectedCity =
        normalize(agentCity?.value);


    const selectedCommune =
        normalize(agentCommune?.value);


    const agents =
        allAgents.filter(agent => {

            const city =
                normalize(
                    getUserCity(agent)
                );


            const commune =
                normalize(
                    getUserCommune(agent)
                );


            const cityMatch =
                !selectedCity ||
                city === selectedCity ||
                city.includes(selectedCity);


            const communeMatch =
                !selectedCommune ||
                commune === selectedCommune ||
                commune.includes(selectedCommune);


            return (
                cityMatch &&
                communeMatch
            );

        });


    if (!agents.length) {

        agentsList.innerHTML = `
            <div class="immo-empty">

                <i class="fa-solid fa-user-tie"></i>

                <br><br>

                Aucun agent immobilier trouvé
                pour cette localisation.

            </div>
        `;

        return;
    }


    agentsList.innerHTML =
        agents
            .map(renderAgentCard)
            .join("");

}


/* =========================================================
   CARTE AGENT
========================================================= */

function renderAgentCard(agent) {

    const name =
        agent.displayName ||
        agent.name ||
        `${agent.firstName || ""} ${agent.lastName || ""}`.trim() ||
        "Agent immobilier";


    const city =
        getUserCity(agent) ||
        "Ville non précisée";


    const commune =
        getUserCommune(agent);


    const phone =
        agent.phone ||
        agent.telephone ||
        agent.phoneNumber ||
        "";


    const photo =
        agent.photoURL ||
        agent.photoUrl ||
        agent.avatar ||
        agent.profileImage ||
        "";


    const location =
        commune
            ? `${commune}, ${city}`
            : city;


    return `
        <article class="immo-agent-card">

            <div class="immo-agent-avatar">

                ${
                    photo
                    ? `
                        <img
                            src="${escapeHtml(photo)}"
                            alt="${escapeHtml(name)}"
                        >
                    `
                    : `
                        <i class="fa-solid fa-user"></i>
                    `
                }

            </div>


            <div class="immo-agent-info">

                <h3>
                    ${escapeHtml(name)}
                </h3>


                <div class="immo-agent-role">
                    AGENT IMMOBILIER
                </div>


                <div class="immo-agent-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(location)}

                </div>


                ${
                    phone
                    ? `
                        <div class="immo-agent-location">

                            <i class="fa-solid fa-phone"></i>

                            ${escapeHtml(phone)}

                        </div>
                    `
                    : ""
                }

            </div>

        </article>
    `;

}


/* =========================================================
   COMMUNES SELON LA VILLE
========================================================= */

function updateCommunes() {

    if (!agentCommune) {
        return;
    }


    const city =
        normalize(agentCity?.value);


    const communes =
        allAgents
            .filter(agent => {

                if (!city) {
                    return true;
                }


                const agentCityValue =
                    normalize(
                        getUserCity(agent)
                    );


                return (
                    agentCityValue === city ||
                    agentCityValue.includes(city)
                );

            })
            .map(agent =>
                getUserCommune(agent)
            )
            .filter(Boolean);


    const uniqueCommunes =
        [...new Set(communes)];


    agentCommune.innerHTML = `
        <option value="">
            Toutes les communes
        </option>
    `;


    uniqueCommunes
        .sort((a, b) =>
            a.localeCompare(
                b,
                "fr",
                { sensitivity: "base" }
            )
        )
        .forEach(commune => {

            const option =
                document.createElement("option");

            option.value = commune;

            option.textContent = commune;

            agentCommune.appendChild(option);

        });


    renderAgents();

}


/* =========================================================
   MENU MOBILE
========================================================= */

function initMobileMenu() {

    const button =
        document.getElementById(
            "immoMenuButton"
        );


    const sidebar =
        document.getElementById(
            "immoSidebar"
        );


    const overlay =
        document.getElementById(
            "immoOverlay"
        );


    if (
        !button ||
        !sidebar ||
        !overlay
    ) {
        return;
    }


    function openMenu() {

        sidebar.classList.add("open");

        overlay.classList.add("active");

        document.body.style.overflow =
            "hidden";

    }


    function closeMenu() {

        sidebar.classList.remove("open");

        overlay.classList.remove("active");

        document.body.style.overflow =
            "";

    }


    button.addEventListener(
        "click",
        openMenu
    );


    overlay.addEventListener(
        "click",
        closeMenu
    );


    document
        .querySelectorAll(".immo-nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMenu
            );

        });

}


/* =========================================================
   NAVIGATION ACTIVE
========================================================= */

function initNavigation() {

    const links =
        document.querySelectorAll(
            ".immo-nav-link"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                links.forEach(item =>
                    item.classList.remove("active")
                );


                link.classList.add("active");

            }
        );

    });

}


/* =========================================================
   FORMULAIRE RECHERCHE
========================================================= */

function initSearch() {

    if (!immoSearchForm) {
        return;
    }


    immoSearchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            filterAds();

            document
                .getElementById("vente")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    immoSearch?.addEventListener(
        "input",
        filterAds
    );


    immoCity?.addEventListener(
        "change",
        filterAds
    );

}


/* =========================================================
   FILTRES AGENTS
========================================================= */

function initAgentFilters() {

    agentCity?.addEventListener(
        "change",
        updateCommunes
    );


    agentCommune?.addEventListener(
        "change",
        renderAgents
    );

}


/* =========================================================
   DEMANDE À LA DIRECTION
========================================================= */

function initRequestForm() {

    if (!immoRequestForm) {
        return;
    }


    immoRequestForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document
                    .getElementById("requestName")
                    ?.value
                    .trim();


            const phone =
                document
                    .getElementById("requestPhone")
                    ?.value
                    .trim();


            const type =
                document
                    .getElementById("requestType")
                    ?.value
                    .trim();


            const message =
                document
                    .getElementById("requestMessage")
                    ?.value
                    .trim();


            if (
                !name ||
                !phone ||
                !type ||
                !message
            ) {

                alert(
                    "Veuillez remplir tous les champs."
                );

                return;
            }


            const button =
                immoRequestForm.querySelector(
                    "button[type='submit']"
                );


            const originalText =
                button?.innerHTML;


            try {

                if (button) {

                    button.disabled = true;

                    button.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Envoi...
                    `;

                }


                await addDoc(
                    collection(
                        db,
                        "demandes_immo"
                    ),
                    {

                        name,

                        phone,

                        type,

                        message,

                        source:
                            "CAMU IMMO",

                        status:
                            "nouvelle",

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Votre demande a été envoyée à la Direction CAMU IMMO."
                );


                immoRequestForm.reset();


            } catch (error) {

                console.error(
                    "Erreur demande :",
                    error
                );


                alert(
                    "Impossible d'envoyer la demande. Veuillez réessayer."
                );


            } finally {

                if (button) {

                    button.disabled = false;

                    button.innerHTML =
                        originalText;

                }

            }

        }
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

async function init() {

    initMobileMenu();

    initNavigation();

    initSearch();

    initAgentFilters();

    initRequestForm();


    /*
       Annonces :
       FIRESTORE → annonces
    */

    await loadAds();


    /*
       Agents :
       FIRESTORE → users
    */

    await loadAgents();

}


/* =========================================================
   START
========================================================= */

init();

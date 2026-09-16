// ============================================================
// CAMU SERVICES — ESPACE IMMOBILIER
// immobilier.js
// ============================================================

import {
    db,
    collection,
    getDocs
} from "./firebase-config.js";


// ============================================================
// CONFIGURATION
// ============================================================

const FIRESTORE_VERSION = "10.12.2";

const state = {
    villes: [],
    communes: [],
    annonces: [],
    agents: []
};


// ============================================================
// UTILITAIRES
// ============================================================

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function firstValue(object, keys, fallback = "") {

    for (const key of keys) {

        if (
            object &&
            object[key] !== undefined &&
            object[key] !== null &&
            String(object[key]).trim() !== ""
        ) {
            return object[key];
        }

    }

    return fallback;
}


function formatPrice(price, currency = "USD") {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return `${price} ${currency}`;
    }

    return (
        new Intl.NumberFormat("fr-FR").format(number) +
        ` ${currency}`
    );
}


function getAnnonceCity(ad) {

    return firstValue(ad, [
        "city",
        "ville",
        "cityName",
        "villeName",
        "localisation"
    ]);

}


function getAnnonceCategory(ad) {

    return firstValue(ad, [
        "category",
        "categorie",
        "categoryName",
        "categorieName"
    ]);

}


function getTransactionType(ad) {

    return normalize(
        firstValue(ad, [
            "typeTransaction",
            "transactionType",
            "type",
            "transaction",
            "operation"
        ])
    );

}


function getUserName(user) {

    const nom = firstValue(
        user,
        ["nom", "lastName", "lastname"]
    );

    const prenom = firstValue(
        user,
        ["prenom", "firstName", "firstname"]
    );

    const displayName = firstValue(
        user,
        ["displayName", "name", "fullName"]
    );

    if (prenom && nom) {
        return `${prenom} ${nom}`;
    }

    if (displayName) {
        return displayName;
    }

    if (prenom) {
        return prenom;
    }

    if (nom) {
        return nom;
    }

    return "Agent immobilier";
}


// ============================================================
// ELEMENTS DOM
// ============================================================

const $ = (id) => document.getElementById(id);

const elements = {

    sidebar: $("immoSidebar"),

    overlay: $("immoOverlay"),

    menuButton: $("immoMenuButton"),

    transaction: $("immoTransaction"),

    ville: $("immoVille"),

    commune: $("immoCommune"),

    keyword: $("immoKeyword"),

    searchButton: $("immoSearchButton"),

    venteListings: $("venteListings"),

    venteCount: $("venteCount"),

    locationListings: $("locationListings"),

    locationCount: $("locationCount"),

    agentVille: $("agentVille"),

    agentCommune: $("agentCommune"),

    agentsGrid: $("agentsGrid"),

    year: $("immoYear")

};


// ============================================================
// VERIFICATION FIREBASE
// ============================================================

function verifyFirebase() {

    console.log("==========================================");

    console.log(
        "CAMU IMMO — Vérification Firebase"
    );

    console.log(
        "Firebase SDK :",
        FIRESTORE_VERSION
    );

    console.log(
        "db :",
        db
    );

    console.log(
        "Type db :",
        db?.constructor?.name
    );

    console.log(
        "collection :",
        collection
    );

    console.log(
        "getDocs :",
        getDocs
    );

    console.log("==========================================");

    if (!db) {

        console.error(
            "CAMU IMMO — db est indisponible."
        );

        return false;
    }

    return true;
}


// ============================================================
// MENU MOBILE
// ============================================================

function openSidebar() {

    elements.sidebar?.classList.add("active");

    elements.overlay?.classList.add("active");

    document.body.classList.add(
        "immo-menu-open"
    );
}


function closeSidebar() {

    elements.sidebar?.classList.remove("active");

    elements.overlay?.classList.remove("active");

    document.body.classList.remove(
        "immo-menu-open"
    );
}


function setupMobileMenu() {

    elements.menuButton?.addEventListener(
        "click",
        openSidebar
    );

    elements.overlay?.addEventListener(
        "click",
        closeSidebar
    );

    document.querySelectorAll(
        ".immoSidebar a"
    ).forEach((link) => {

        link.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 768) {
                    closeSidebar();
                }

            }
        );

    });

}


// ============================================================
// ANNEE
// ============================================================

function setCurrentYear() {

    if (elements.year) {

        elements.year.textContent =
            new Date().getFullYear();

    }

}


// ============================================================
// VILLES
// ============================================================

async function loadVilles() {

    if (!verifyFirebase()) {
        return;
    }

    try {

        const villesRef =
            collection(db, "villes");

        const snapshot =
            await getDocs(villesRef);

        state.villes = [];

        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            if (data.active === false) {
                return;
            }

            state.villes.push({

                id: docSnap.id,

                name:
                    data.name ||
                    docSnap.id,

                province:
                    data.province ||
                    "",

                order:
                    Number(data.order) ||
                    999

            });

        });


        state.villes.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return normalize(a.name)
                .localeCompare(
                    normalize(b.name)
                );

        });


        populateVilleSelect(
            elements.ville
        );

        populateVilleSelect(
            elements.agentVille
        );


        console.log(
            "CAMU IMMO — villes chargées :",
            state.villes.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement villes :",
            error
        );

    }

}


// ============================================================
// SELECT VILLES
// ============================================================

function populateVilleSelect(select) {

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            Toutes les villes
        </option>
    `;


    state.villes.forEach((ville) => {

        const option =
            document.createElement("option");

        option.value =
            ville.id;

        option.textContent =
            ville.name;

        select.appendChild(option);

    });


    if (
        currentValue &&
        [...select.options].some(
            option =>
                option.value === currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


// ============================================================
// COMMUNES
// ============================================================

async function loadCommunesForVille(villeId) {

    if (!villeId) {

        state.communes = [];

        populateCommuneSelect(
            elements.commune
        );

        populateCommuneSelect(
            elements.agentCommune
        );

        return;
    }


    const ville =
        state.villes.find(
            item => item.id === villeId
        );


    if (!ville) {
        return;
    }


    const communesMap =
        new Map();


    // ========================================================
    // 1. SOUS-COLLECTION
    // villes/{villeId}/communes
    // ========================================================

    try {

        const communesRef =
            collection(
                db,
                "villes",
                villeId,
                "communes"
            );

        const snapshot =
            await getDocs(
                communesRef
            );


        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            if (data.active === false) {
                return;
            }

            const name =
                data.name ||
                docSnap.id;

            communesMap.set(
                normalize(name),
                {

                    id:
                        docSnap.id,

                    name:
                        name,

                    villeId:
                        villeId,

                    villeName:
                        ville.name

                }
            );

        });


    } catch (error) {

        console.log(
            "CAMU IMMO — sous-collection communes non disponible :",
            error.message
        );

    }


    // ========================================================
    // 2. COLLECTION RACINE communes
    // ========================================================

    try {

        const communesRef =
            collection(
                db,
                "communes"
            );

        const snapshot =
            await getDocs(
                communesRef
            );


        snapshot.forEach((docSnap) => {

            const data =
                docSnap.data();

            if (data.active === false) {
                return;
            }


            const communeVilleId =
                firstValue(
                    data,
                    [
                        "villeId",
                        "cityId"
                    ]
                );


            const communeVilleName =
                firstValue(
                    data,
                    [
                        "villeName",
                        "cityName",
                        "ville",
                        "city"
                    ]
                );


            const sameVille =
                communeVilleId === villeId ||
                normalize(communeVilleName) ===
                normalize(ville.name);


            if (!sameVille) {
                return;
            }


            const name =
                data.name ||
                docSnap.id;


            communesMap.set(
                normalize(name),
                {

                    id:
                        docSnap.id,

                    name:
                        name,

                    villeId:
                        villeId,

                    villeName:
                        ville.name

                }
            );

        });


    } catch (error) {

        console.log(
            "CAMU IMMO — collection communes non disponible :",
            error.message
        );

    }


    // ========================================================
    // RESULTAT
    // ========================================================

    state.communes =
        [...communesMap.values()].sort(
            (a, b) =>
                normalize(a.name)
                    .localeCompare(
                        normalize(b.name)
                    )
        );


    populateCommuneSelect(
        elements.commune
    );

    populateCommuneSelect(
        elements.agentCommune
    );


    console.log(
        `CAMU IMMO — communes chargées pour ${ville.name} :`,
        state.communes.length
    );

}


// ============================================================
// SELECT COMMUNES
// ============================================================

function populateCommuneSelect(select) {

    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Toutes les communes
        </option>
    `;


    state.communes.forEach(
        (commune) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                commune.id;

            option.dataset.name =
                commune.name;

            option.textContent =
                commune.name;

            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// IMMOBILIER
// ============================================================

function isImmobilierAnnonce(ad) {

    const category =
        normalize(
            getAnnonceCategory(ad)
        );


    return (
        category === "immobilier" ||
        category.includes("immobilier")
    );

}


// ============================================================
// VENTE
// ============================================================

function isVente(ad) {

    const type =
        getTransactionType(ad);


    return (

        type.includes("vente") ||

        type.includes("vendre") ||

        type === "sale" ||

        type === "sell"

    );

}


// ============================================================
// LOCATION
// ============================================================

function isLocation(ad) {

    const type =
        getTransactionType(ad);


    return (

        type.includes("location") ||

        type.includes("louer") ||

        type.includes("locatif") ||

        type === "rent" ||

        type === "rental"

    );

}


// ============================================================
// CHARGER ANNONCES
// ============================================================

async function loadAnnonces() {

    if (!verifyFirebase()) {
        return;
    }


    try {

        const annoncesRef =
            collection(
                db,
                "annonces"
            );


        const snapshot =
            await getDocs(
                annoncesRef
            );


        state.annonces = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                if (
                    data.status &&
                    normalize(data.status) !==
                    "active"
                ) {
                    return;
                }


                if (
                    !isImmobilierAnnonce(data)
                ) {
                    return;
                }


                state.annonces.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            "CAMU IMMO — annonces immobilières :",
            state.annonces.length
        );


        renderVente(
            state.annonces.filter(
                ad => isVente(ad)
            )
        );


        renderLocation(
            state.annonces.filter(
                ad => isLocation(ad)
            )
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement annonces :",
            error
        );


        showError(
            elements.venteListings,
            "Impossible de charger les annonces immobilières."
        );


        showError(
            elements.locationListings,
            "Impossible de charger les annonces immobilières."
        );

    }

}


// ============================================================
// FILTRAGE
// ============================================================

function filterAnnonces(list) {

    const transaction =
        normalize(
            elements.transaction?.value
        );


    const villeId =
        elements.ville?.value || "";


    const communeId =
        elements.commune?.value || "";


    const keyword =
        normalize(
            elements.keyword?.value
        );


    const communeOption =
        elements.commune
            ?.selectedOptions?.[0];


    const communeName =
        normalize(
            communeOption?.dataset?.name ||
            ""
        );


    return list.filter(
        (ad) => {


            // ------------------------------------------------
            // TRANSACTION
            // ------------------------------------------------

            if (
                transaction === "vente" &&
                !isVente(ad)
            ) {
                return false;
            }


            if (
                transaction === "location" &&
                !isLocation(ad)
            ) {
                return false;
            }


            // ------------------------------------------------
            // VILLE
            // ------------------------------------------------

            if (villeId) {

                const ville =
                    state.villes.find(
                        item =>
                            item.id === villeId
                    );


                const adCity =
                    normalize(
                        getAnnonceCity(ad)
                    );


                if (
                    ville &&
                    adCity !==
                        normalize(ville.name) &&
                    adCity !==
                        normalize(ville.id)
                ) {

                    return false;

                }

            }


            // ------------------------------------------------
            // COMMUNE
            // ------------------------------------------------

            if (
                communeId &&
                communeName
            ) {

                const adCommune =
                    normalize(
                        firstValue(
                            ad,
                            [
                                "commune",
                                "communeName"
                            ]
                        )
                    );


                if (
                    adCommune &&
                    adCommune !==
                    communeName
                ) {

                    return false;

                }

            }


            // ------------------------------------------------
            // MOT-CLE
            // ------------------------------------------------

            if (keyword) {

                const searchable =
                    normalize(

                        [

                            ad.title,

                            ad.description,

                            ad.category,

                            ad.city,

                            ad.ville,

                            ad.commune,

                            ad.quartier,

                            ad.typeBien,

                            ad.propertyType,

                            ad.type

                        ].join(" ")

                    );


                if (
                    !searchable.includes(
                        keyword
                    )
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}


// ============================================================
// RECHERCHE
// ============================================================

function performSearch() {

    const filtered =
        filterAnnonces(
            state.annonces
        );


    const transaction =
        normalize(
            elements.transaction?.value
        );


    if (
        transaction === "vente"
    ) {

        renderVente(
            filtered
        );

        renderLocation([]);

        return;

    }


    if (
        transaction === "location"
    ) {

        renderVente([]);

        renderLocation(
            filtered
        );

        return;

    }


    renderVente(
        filtered.filter(
            ad => isVente(ad)
        )
    );


    renderLocation(
        filtered.filter(
            ad => isLocation(ad)
        )
    );

}


// ============================================================
// CARTE ANNONCE
// ============================================================

function createAnnonceCard(ad) {

    const title =
        firstValue(
            ad,
            [
                "title",
                "titre",
                "name"
            ],
            "Bien immobilier"
        );


    const description =
        firstValue(
            ad,
            [
                "description",
                "details",
                "detail"
            ],
            "Aucune description disponible."
        );


    const city =
        getAnnonceCity(ad);


    const commune =
        firstValue(
            ad,
            [
                "commune",
                "communeName"
            ]
        );


    const price =
        firstValue(
            ad,
            [
                "price",
                "prix"
            ]
        );


    const currency =
        firstValue(
            ad,
            [
                "currency",
                "devise"
            ],
            "USD"
        );


    let image = "";


    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {

        image =
            ad.images[0];

    }


    if (!image) {

        image =
            firstValue(
                ad,
                [
                    "imageURL",
                    "imageUrl",
                    "photo",
                    "photoURL"
                ]
            );

    }


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "immo-listing-card";


    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(ad.id)}"
            class="immo-listing-image"
        >

            ${
                image

                    ? `

                        <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(title)}"
                            loading="lazy"
                        >

                    `

                    : `

                        <div class="immo-no-image">

                            <i class="fa-solid fa-house"></i>

                        </div>

                    `
            }

        </a>


        <div class="immo-listing-content">

            <h3>
                ${escapeHtml(title)}
            </h3>


            <div class="immo-listing-price">

                ${escapeHtml(
                    formatPrice(
                        price,
                        currency
                    )
                )}

            </div>


            <div class="immo-listing-location">

                <i class="fa-solid fa-location-dot"></i>

                <span>

                    ${escapeHtml(
                        city ||
                        "Ville non précisée"
                    )}

                    ${
                        commune
                            ? ` — ${escapeHtml(
                                commune
                            )}`
                            : ""
                    }

                </span>

            </div>


            <p class="immo-listing-description">

                ${escapeHtml(
                    description.length > 120
                        ? description.substring(
                            0,
                            120
                        ) + "..."
                        : description
                )}

            </p>


            <a
                href="explorer.html?id=${encodeURIComponent(ad.id)}"
                class="immo-listing-button"
            >

                Voir le bien

                <i class="fa-solid fa-arrow-right"></i>

            </a>

        </div>

    `;


    return card;

}


// ============================================================
// RENDU VENTE
// ============================================================

function renderVente(list) {

    if (!elements.venteListings) {
        return;
    }


    elements.venteListings.innerHTML =
        "";


    if (elements.venteCount) {

        elements.venteCount.textContent =
            list.length;

    }


    if (!list.length) {

        elements.venteListings.innerHTML = `

            <div class="immo-empty-state">

                <i class="fa-solid fa-house-circle-xmark"></i>

                <h3>
                    Aucun bien à vendre
                </h3>

                <p>
                    Aucune annonce immobilière
                    correspondant à vos critères
                    n'est disponible.
                </p>

            </div>

        `;

        return;
    }


    list.forEach(
        (ad) => {

            elements.venteListings.appendChild(
                createAnnonceCard(ad)
            );

        }
    );

}


// ============================================================
// RENDU LOCATION
// ============================================================

function renderLocation(list) {

    if (!elements.locationListings) {
        return;
    }


    elements.locationListings.innerHTML =
        "";


    if (elements.locationCount) {

        elements.locationCount.textContent =
            list.length;

    }


    if (!list.length) {

        elements.locationListings.innerHTML = `

            <div class="immo-empty-state">

                <i class="fa-solid fa-key"></i>

                <h3>
                    Aucun bien à louer
                </h3>

                <p>
                    Aucune annonce immobilière
                    correspondant à vos critères
                    n'est disponible.
                </p>

            </div>

        `;

        return;
    }


    list.forEach(
        (ad) => {

            elements.locationListings.appendChild(
                createAnnonceCard(ad)
            );

        }
    );

}


// ============================================================
// AGENTS IMMOBILIERS
// ============================================================

function isAgentImmobilier(user) {

    const role =
        normalize(
            firstValue(
                user,
                [
                    "role",
                    "userRole",
                    "type",
                    "accountType"
                ]
            )
        );


    const profession =
        normalize(
            firstValue(
                user,
                [
                    "profession",
                    "metier",
                    "job"
                ]
            )
        );


    const specialite =
        normalize(
            firstValue(
                user,
                [
                    "specialite",
                    "speciality",
                    "specialityName"
                ]
            )
        );


    return (

        (
            role.includes("agent") &&
            role.includes("immobilier")
        )

        ||

        profession.includes(
            "agent immobilier"
        )

        ||

        profession.includes(
            "immobilier"
        )

        ||

        specialite.includes(
            "immobilier"
        )

    );

}


// ============================================================
// CHARGER AGENTS
// ============================================================

async function loadAgents() {

    if (!verifyFirebase()) {
        return;
    }


    if (!elements.agentsGrid) {
        return;
    }


    try {

        const usersRef =
            collection(
                db,
                "users"
            );


        const snapshot =
            await getDocs(
                usersRef
            );


        state.agents = [];


        snapshot.forEach(
            (docSnap) => {

                const data =
                    docSnap.data();


                if (
                    normalize(data.status) ===
                    "blocked"
                ) {
                    return;
                }


                if (
                    !isAgentImmobilier(data)
                ) {
                    return;
                }


                state.agents.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            "CAMU IMMO — agents immobiliers :",
            state.agents.length
        );


        renderAgents(
            state.agents
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement agents :",
            error
        );


        elements.agentsGrid.innerHTML = `

            <div class="immo-empty-state">

                <i class="fa-solid fa-user-slash"></i>

                <h3>
                    Agents indisponibles
                </h3>

                <p>
                    Impossible de charger les agents
                    immobiliers pour le moment.
                </p>

            </div>

        `;

    }

}


// ============================================================
// FILTRER AGENTS
// ============================================================

function filterAgents() {

    const villeId =
        elements.agentVille?.value ||
        "";


    const communeId =
        elements.agentCommune?.value ||
        "";


    const ville =
        state.villes.find(
            item =>
                item.id === villeId
        );


    const communeOption =
        elements.agentCommune
            ?.selectedOptions?.[0];


    const communeName =
        normalize(
            communeOption?.dataset?.name ||
            ""
        );


    const filtered =
        state.agents.filter(
            (agent) => {


                if (
                    villeId &&
                    ville
                ) {

                    const agentVille =
                        normalize(
                            firstValue(
                                agent,
                                [
                                    "ville",
                                    "city",
                                    "villeName",
                                    "cityName"
                                ]
                            )
                        );


                    if (
                        agentVille &&
                        agentVille !==
                            normalize(ville.name) &&
                        agentVille !==
                            normalize(ville.id)
                    ) {

                        return false;

                    }

                }


                if (
                    communeId &&
                    communeName
                ) {

                    const agentCommune =
                        normalize(
                            firstValue(
                                agent,
                                [
                                    "commune",
                                    "communeName"
                                ]
                            )
                        );


                    if (
                        agentCommune &&
                        agentCommune !==
                            communeName
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderAgents(
        filtered
    );

}


// ============================================================
// CARTE AGENT
// ============================================================

function createAgentCard(agent) {

    const name =
        getUserName(agent);


    const telephone =
        firstValue(
            agent,
            [
                "telephone",
                "phone",
                "whatsapp"
            ]
        );


    const whatsapp =
        firstValue(
            agent,
            [
                "whatsapp",
                "telephone",
                "phone"
            ]
        );


    const ville =
        firstValue(
            agent,
            [
                "ville",
                "city",
                "villeName",
                "cityName"
            ]
        );


    const commune =
        firstValue(
            agent,
            [
                "commune",
                "communeName"
            ]
        );


    const photo =
        firstValue(
            agent,
            [
                "photoURL",
                "photoUrl",
                "photo",
                "avatar",
                "profileImage"
            ]
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "immo-agent-card";


    let whatsappNumber =
        String(
            whatsapp || ""
        ).replace(
            /[^\d]/g,
            ""
        );


    if (
        whatsappNumber.startsWith("0") &&
        whatsappNumber.length > 1
    ) {

        whatsappNumber =
            "243" +
            whatsappNumber.substring(1);

    }


    card.innerHTML = `

        <div class="immo-agent-photo">

            ${
                photo

                    ? `

                        <img
                            src="${escapeHtml(photo)}"
                            alt="${escapeHtml(name)}"
                            loading="lazy"
                        >

                    `

                    : `

                        <i class="fa-solid fa-user"></i>

                    `
            }

        </div>


        <div class="immo-agent-content">

            <h3>
                ${escapeHtml(name)}
            </h3>


            <div class="immo-agent-role">

                <i class="fa-solid fa-building"></i>

                Agent immobilier

            </div>


            ${
                ville || commune

                    ? `

                        <div class="immo-agent-location">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHtml(ville)}

                            ${
                                commune
                                    ? ` — ${escapeHtml(
                                        commune
                                    )}`
                                    : ""
                            }

                        </div>

                    `

                    : ""
            }


            ${
                telephone

                    ? `

                        <div class="immo-agent-phone">

                            <i class="fa-solid fa-phone"></i>

                            ${escapeHtml(
                                telephone
                            )}

                        </div>

                    `

                    : ""
            }


            ${
                whatsappNumber

                    ? `

                        <a
                            href="https://wa.me/${encodeURIComponent(
                                whatsappNumber
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="immo-agent-whatsapp"
                        >

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


// ============================================================
// RENDU AGENTS
// ============================================================

function renderAgents(list) {

    if (!elements.agentsGrid) {
        return;
    }


    elements.agentsGrid.innerHTML =
        "";


    if (!list.length) {

        elements.agentsGrid.innerHTML = `

            <div class="immo-empty-state">

                <i class="fa-solid fa-users-slash"></i>

                <h3>
                    Aucun agent immobilier trouvé
                </h3>

                <p>
                    Aucun agent ne correspond
                    aux critères sélectionnés.
                </p>

            </div>

        `;

        return;
    }


    list.forEach(
        (agent) => {

            elements.agentsGrid.appendChild(
                createAgentCard(agent)
            );

        }
    );

}


// ============================================================
// ERREUR
// ============================================================

function showError(
    container,
    message
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="immo-empty-state">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Une erreur est survenue
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


// ============================================================
// EVENEMENTS
// ============================================================

function setupEvents() {

    elements.ville?.addEventListener(
        "change",
        async () => {

            await loadCommunesForVille(
                elements.ville.value
            );

            performSearch();

        }
    );


    elements.commune?.addEventListener(
        "change",
        performSearch
    );


    elements.transaction?.addEventListener(
        "change",
        performSearch
    );


    elements.keyword?.addEventListener(
        "input",
        performSearch
    );


    elements.searchButton?.addEventListener(
        "click",
        performSearch
    );


    elements.agentVille?.addEventListener(
        "change",
        async () => {

            await loadCommunesForVille(
                elements.agentVille.value
            );

            filterAgents();

        }
    );


    elements.agentCommune?.addEventListener(
        "change",
        filterAgents
    );

}


// ============================================================
// NAVIGATION
// ============================================================

function setupSmoothNavigation() {

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(
        (link) => {

            link.addEventListener(
                "click",
                (event) => {

                    const targetId =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        !targetId ||
                        targetId === "#"
                    ) {
                        return;
                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });


                    if (
                        window.innerWidth <= 768
                    ) {

                        closeSidebar();

                    }

                }
            );

        }
    );

}


// ============================================================
// INITIALISATION
// ============================================================

async function initImmobilier() {

    console.log(
        "CAMU IMMO — initialisation..."
    );


    try {

        setCurrentYear();

        setupMobileMenu();

        setupEvents();

        setupSmoothNavigation();


        await loadVilles();

        await loadAnnonces();

        await loadAgents();


        console.log(
            "CAMU IMMO — initialisation terminée."
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur initialisation :",
            error
        );

    }

}


// ============================================================
// LANCEMENT
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initImmobilier
    );

} else {

    initImmobilier();

}

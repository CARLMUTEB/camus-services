// ============================================================
// CAMU SERVICES - CAMU IMMO
// immobilier.js
//
// SOURCES FIREBASE
//
// villes                    -> villes
// communes imbriquées       -> villes/{villeId}/communes
// communes racine           -> communes
// annonces                  -> annonces
// agents immobiliers        -> users
//
// Le code accepte plusieurs structures Firestore
// afin de pouvoir faire évoluer les données sans modifier
// ce fichier.
// ============================================================

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


// ============================================================
// ÉLÉMENTS HTML
// ============================================================

const sidebar = document.getElementById("immoSidebar");
const overlay = document.getElementById("immoOverlay");
const menuButton = document.getElementById("immoMenuButton");

const transactionSelect =
    document.getElementById("immoTransaction");

const villeSelect =
    document.getElementById("immoVille");

const communeSelect =
    document.getElementById("immoCommune");

const keywordInput =
    document.getElementById("immoKeyword");

const searchButton =
    document.getElementById("immoSearchButton");

const venteListings =
    document.getElementById("venteListings");

const locationListings =
    document.getElementById("locationListings");

const venteCount =
    document.getElementById("venteCount");

const locationCount =
    document.getElementById("locationCount");

const agentVille =
    document.getElementById("agentVille");

const agentCommune =
    document.getElementById("agentCommune");

const agentsGrid =
    document.getElementById("agentsGrid");

const yearElement =
    document.getElementById("immoYear");


// ============================================================
// DONNÉES
// ============================================================

let villes = [];
let communes = [];
let annonces = [];
let agents = [];

let filteredVente = [];
let filteredLocation = [];


// ============================================================
// UTILITAIRES
// ============================================================

function normalize(value) {

    return String(value ?? "")
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


function getFirstValue(object, fields) {

    for (const field of fields) {

        if (
            object &&
            object[field] !== undefined &&
            object[field] !== null &&
            String(object[field]).trim() !== ""
        ) {

            return object[field];

        }

    }

    return "";

}


function getName(data) {

    const fullName = getFirstValue(
        data,
        [
            "name",
            "displayName",
            "fullName",
            "nomComplet"
        ]
    );

    if (fullName) {
        return String(fullName);
    }

    const nom = getFirstValue(
        data,
        [
            "nom",
            "lastName",
            "lastname"
        ]
    );

    const prenom = getFirstValue(
        data,
        [
            "prenom",
            "firstName",
            "firstname"
        ]
    );

    const result =
        `${prenom} ${nom}`.trim();

    return result || "Agent immobilier";

}


// ============================================================
// MENU MOBILE
// ============================================================

function openMenu() {

    sidebar?.classList.add("open");
    overlay?.classList.add("active");

}


function closeMenu() {

    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");

}


menuButton?.addEventListener(
    "click",
    openMenu
);

overlay?.addEventListener(
    "click",
    closeMenu
);


document
    .querySelectorAll(".immo-menu-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 768) {
                    closeMenu();
                }

            }
        );

    });


// ============================================================
// VILLES
// ============================================================

async function loadVilles() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "villes")
            );

        const result = [];

        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();

            if (data.active === false) {
                return;
            }

            const name =
                String(
                    data.name ||
                    data.nom ||
                    ""
                ).trim();

            if (!name) {
                return;
            }

            result.push({

                id: docSnap.id,

                name,

                province:
                    String(
                        data.province || ""
                    ).trim(),

                order:
                    Number(data.order) || 999,

                // Prévoit une structure :
                // villes/{villeId}.communes = [...]
                communes:
                    Array.isArray(data.communes)
                        ? data.communes
                        : []

            });

        });


        // --------------------------------------------------------
        // Suppression des doublons
        // --------------------------------------------------------

        const unique =
            new Map();

        result.forEach(city => {

            const key =
                normalize(city.name);

            if (!unique.has(key)) {

                unique.set(
                    key,
                    city
                );

            }

        });


        villes =
            Array.from(
                unique.values()
            )
            .sort(
                (a, b) => {

                    if (
                        a.order !==
                        b.order
                    ) {

                        return (
                            a.order -
                            b.order
                        );

                    }

                    return a.name.localeCompare(
                        b.name,
                        "fr"
                    );

                }
            );


        populateVilleSelects();


        console.log(
            "CAMU IMMO — villes chargées :",
            villes.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement villes :",
            error
        );

    }

}


// ============================================================
// REMPLIR LES VILLES
// ============================================================

function populateVilleSelects() {

    if (villeSelect) {

        villeSelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

        villes.forEach(city => {

            const option =
                document.createElement("option");

            option.value =
                city.name;

            option.textContent =
                city.province
                    ? `${city.name} — ${city.province}`
                    : city.name;

            option.dataset.cityId =
                city.id;

            villeSelect.appendChild(
                option
            );

        });

    }


    if (agentVille) {

        agentVille.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

        villes.forEach(city => {

            const option =
                document.createElement("option");

            option.value =
                city.name;

            option.textContent =
                city.province
                    ? `${city.name} — ${city.province}`
                    : city.name;

            option.dataset.cityId =
                city.id;

            agentVille.appendChild(
                option
            );

        });

    }

}


// ============================================================
// COMMUNES
// ============================================================
//
// Structure prévue :
//
// villes
//   └── ID_VILLE
//        ├── name: "Fungurume"
//        └── communes
//             ├── ID_COMMUNE_1
//             │    └── name: "..."
//             └── ID_COMMUNE_2
//                  └── name: "..."
//
// Le code accepte aussi :
//
// communes
//   └── ID_COMMUNE
//        ├── name: "..."
//        ├── villeId: "..."
//        └── villeName: "Fungurume"
// ============================================================

async function loadCommunes() {

    const result = [];

    // --------------------------------------------------------
    // 1. COMMUNES DIRECTEMENT DANS LE DOCUMENT VILLE
    // --------------------------------------------------------

    for (const city of villes) {

        // ----------------------------------------------------
        // Cas A :
        // villes/{id}.communes = ["Commune 1", "Commune 2"]
        // ----------------------------------------------------

        if (
            Array.isArray(
                city.communes
            )
        ) {

            city.communes.forEach(
                (item, index) => {

                    let name = "";
                    let id = "";

                    if (
                        typeof item ===
                        "string"
                    ) {

                        name =
                            item.trim();

                        id =
                            `${city.id}-commune-${index}`;

                    } else if (
                        item &&
                        typeof item ===
                        "object"
                    ) {

                        name =
                            String(
                                item.name ||
                                item.nom ||
                                ""
                            ).trim();

                        id =
                            String(
                                item.id ||
                                ""
                            ).trim();

                    }

                    if (!name) {
                        return;
                    }

                    result.push({

                        id:
                            id ||
                            `${city.id}-${normalize(name)}`,

                        name,

                        villeId:
                            city.id,

                        villeName:
                            city.name

                    });

                }
            );

        }


        // ----------------------------------------------------
        // Cas B :
        // sous-collection villes/{villeId}/communes
        // ----------------------------------------------------

        try {

            const subCollection =
                await getDocs(
                    collection(
                        db,
                        "villes",
                        city.id,
                        "communes"
                    )
                );

            subCollection.forEach(
                communeDoc => {

                    const data =
                        communeDoc.data();

                    if (
                        data.active === false
                    ) {
                        return;
                    }

                    const name =
                        String(
                            data.name ||
                            data.nom ||
                            ""
                        ).trim();

                    if (!name) {
                        return;
                    }

                    result.push({

                        id:
                            communeDoc.id,

                        name,

                        villeId:
                            city.id,

                        villeName:
                            city.name

                    });

                }
            );

        } catch (error) {

            console.warn(
                `CAMU IMMO — sous-collection communes indisponible pour ${city.name}`,
                error
            );

        }

    }


    // --------------------------------------------------------
    // 2. COLLECTION RACINE "communes"
    // --------------------------------------------------------

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "communes"
                )
            );

        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();

                if (
                    data.active === false
                ) {
                    return;
                }

                const name =
                    String(
                        data.name ||
                        data.nom ||
                        ""
                    ).trim();

                if (!name) {
                    return;
                }

                const villeId =
                    String(
                        data.villeId ||
                        data.cityId ||
                        ""
                    ).trim();

                const villeName =
                    String(
                        data.villeName ||
                        data.cityName ||
                        data.ville ||
                        data.city ||
                        ""
                    ).trim();

                result.push({

                    id:
                        docSnap.id,

                    name,

                    villeId,

                    villeName

                });

            }
        );

    } catch (error) {

        console.warn(
            "CAMU IMMO — collection communes non disponible.",
            error
        );

    }


    // --------------------------------------------------------
    // Suppression des doublons
    // --------------------------------------------------------

    const unique =
        new Map();

    result.forEach(
        commune => {

            const key =
                `${commune.villeId || normalize(commune.villeName)}|${normalize(commune.name)}`;

            if (!unique.has(key)) {

                unique.set(
                    key,
                    commune
                );

            }

        }
    );


    communes =
        Array.from(
            unique.values()
        );


    console.log(
        "CAMU IMMO — communes chargées :",
        communes.length
    );


    // Les listes de communes seront activées
    // lorsqu'une ville est choisie.

}


// ============================================================
// REMPLIR LES COMMUNES
// ============================================================

function populateCommunes(
    selectElement,
    villeName,
    villeId = ""
) {

    if (!selectElement) {
        return;
    }


    selectElement.innerHTML = `
        <option value="">
            Toutes les communes
        </option>
    `;


    if (
        !villeName &&
        !villeId
    ) {

        selectElement.disabled =
            true;

        return;

    }


    const cityCommunes =
        communes.filter(
            commune => {

                const sameId =
                    villeId &&
                    commune.villeId &&
                    commune.villeId ===
                        villeId;

                const sameName =
                    villeName &&
                    commune.villeName &&
                    normalize(
                        commune.villeName
                    ) ===
                    normalize(
                        villeName
                    );

                return (
                    sameId ||
                    sameName
                );

            }
        );


    const unique =
        new Map();


    cityCommunes.forEach(
        commune => {

            const key =
                normalize(
                    commune.name
                );

            if (!unique.has(key)) {

                unique.set(
                    key,
                    commune
                );

            }

        }
    );


    Array.from(
        unique.values()
    )
    .sort(
        (a, b) =>
            a.name.localeCompare(
                b.name,
                "fr"
            )
    )
    .forEach(
        commune => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                commune.name;

            option.textContent =
                commune.name;

            option.dataset.communeId =
                commune.id;

            option.dataset.villeId =
                commune.villeId || "";

            selectElement.appendChild(
                option
            );

        }
    );


    selectElement.disabled =
        unique.size === 0;

}


// ============================================================
// CHANGEMENT VILLE - RECHERCHE
// ============================================================

villeSelect?.addEventListener(
    "change",
    () => {

        const option =
            villeSelect.options[
                villeSelect.selectedIndex
            ];

        const cityId =
            option?.dataset.cityId ||
            "";

        populateCommunes(
            communeSelect,
            villeSelect.value,
            cityId
        );

        applyAnnonceFilters();

    }
);


// ============================================================
// CHANGEMENT VILLE - AGENTS
// ============================================================

agentVille?.addEventListener(
    "change",
    () => {

        const option =
            agentVille.options[
                agentVille.selectedIndex
            ];

        const cityId =
            option?.dataset.cityId ||
            "";

        populateCommunes(
            agentCommune,
            agentVille.value,
            cityId
        );

        filterAgents();

    }
);


// ============================================================
// CHANGEMENT COMMUNE - AGENTS
// ============================================================

agentCommune?.addEventListener(
    "change",
    filterAgents
);


// ============================================================
// ANNONCES
// ============================================================

async function loadAnnonces() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        annonces =
            snapshot.docs
                .map(
                    docSnap => ({
                        id:
                            docSnap.id,
                        ...docSnap.data()
                    })
                )
                .filter(
                    ad => {

                        // Les annonces supprimées,
                        // inactives ou désactivées
                        // ne sont pas affichées.

                        if (
                            ad.status &&
                            normalize(
                                ad.status
                            ) !== "active"
                        ) {

                            return false;

                        }

                        return true;

                    }
                );


        filteredVente =
            annonces.filter(
                ad =>
                    isImmobilier(ad) &&
                    isVente(ad)
            );


        filteredLocation =
            annonces.filter(
                ad =>
                    isImmobilier(ad) &&
                    isLocation(ad)
            );


        displayVente(
            filteredVente
        );

        displayLocation(
            filteredLocation
        );

        updateCounts();


        console.log(
            "CAMU IMMO — annonces chargées :",
            annonces.length
        );

        console.log(
            "CAMU IMMO — ventes :",
            filteredVente.length
        );

        console.log(
            "CAMU IMMO — locations :",
            filteredLocation.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement annonces :",
            error
        );


        showListingError(
            venteListings,
            "Impossible de charger les annonces de vente."
        );


        showListingError(
            locationListings,
            "Impossible de charger les annonces de location."
        );

    }

}


// ============================================================
// TYPE TRANSACTION
// ============================================================

function getTransaction(ad) {

    return normalize(
        getFirstValue(
            ad,
            [
                "typeTransaction",
                "transactionType",
                "transaction",
                "listingType",
                "operation",
                "typeOperation"
            ]
        )
    );

}


// ============================================================
// VENTE
// ============================================================

function isVente(ad) {

    const value =
        getTransaction(ad);

    return [
        "vente",
        "vendre",
        "vendu",
        "sale",
        "sell",
        "for sale"
    ].includes(value);

}


// ============================================================
// LOCATION
// ============================================================

function isLocation(ad) {

    const value =
        getTransaction(ad);

    return [
        "location",
        "louer",
        "loué",
        "rent",
        "rental",
        "for rent"
    ].includes(value);

}


// ============================================================
// CATÉGORIE IMMOBILIER
// ============================================================

function isImmobilier(ad) {

    const category =
        normalize(
            getFirstValue(
                ad,
                [
                    "category",
                    "categorie",
                    "categoryName",
                    "categorieName"
                ]
            )
        );


    return [
        "immobilier",
        "immo",
        "real estate",
        "realestate"
    ].includes(category);

}


// ============================================================
// FILTRAGE IMMOBILIER
// ============================================================

function filterImmobilierAds(
    list
) {

    return list.filter(
        ad =>
            isImmobilier(ad)
    );

}


// ============================================================
// FILTRAGE ANNONCES
// ============================================================

function applyAnnonceFilters() {

    const transaction =
        normalize(
            transactionSelect?.value
        );

    const city =
        normalize(
            villeSelect?.value
        );

    const commune =
        normalize(
            communeSelect?.value
        );

    const keyword =
        normalize(
            keywordInput?.value
        );


    let result =
        filterImmobilierAds(
            annonces
        );


    // --------------------------------------------------------
    // Transaction
    // --------------------------------------------------------

    if (
        transaction === "vente"
    ) {

        result =
            result.filter(
                isVente
            );

    }


    if (
        transaction === "location"
    ) {

        result =
            result.filter(
                isLocation
            );

    }


    // --------------------------------------------------------
    // Ville
    // --------------------------------------------------------

    if (city) {

        result =
            result.filter(
                ad => {

                    const adCity =
                        normalize(
                            getFirstValue(
                                ad,
                                [
                                    "city",
                                    "ville",
                                    "cityName",
                                    "villeName"
                                ]
                            )
                        );

                    return (
                        adCity === city
                    );

                }
            );

    }


    // --------------------------------------------------------
    // Commune
    // --------------------------------------------------------

    if (commune) {

        result =
            result.filter(
                ad => {

                    const adCommune =
                        normalize(
                            getFirstValue(
                                ad,
                                [
                                    "commune",
                                    "communeName",
                                    "township"
                                ]
                            )
                        );

                    return (
                        adCommune ===
                        commune
                    );

                }
            );

    }


    // --------------------------------------------------------
    // Mot-clé
    // --------------------------------------------------------

    if (keyword) {

        result =
            result.filter(
                ad => {

                    const text = [

                        ad.title,

                        ad.name,

                        ad.description,

                        ad.category,

                        ad.city,

                        ad.ville,

                        ad.commune,

                        ad.neighborhood,

                        ad.quartier,

                        ad.typeTransaction,

                        ad.transactionType,

                        ad.transaction

                    ]
                        .filter(Boolean)
                        .join(" ");


                    return normalize(
                        text
                    ).includes(
                        keyword
                    );

                }
            );

    }


    // --------------------------------------------------------
    // Séparation
    // --------------------------------------------------------

    filteredVente =
        result.filter(
            isVente
        );


    filteredLocation =
        result.filter(
            isLocation
        );


    displayVente(
        filteredVente
    );


    displayLocation(
        filteredLocation
    );


    updateCounts();

}


// ============================================================
// BOUTON RECHERCHE
// ============================================================

searchButton?.addEventListener(
    "click",
    applyAnnonceFilters
);


keywordInput?.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            applyAnnonceFilters();

        }

    }
);


transactionSelect?.addEventListener(
    "change",
    applyAnnonceFilters
);


communeSelect?.addEventListener(
    "change",
    applyAnnonceFilters
);


// ============================================================
// IMAGE ANNONCE
// ============================================================

function getImage(ad) {

    if (
        Array.isArray(
            ad.images
        ) &&
        ad.images.length > 0
    ) {

        return ad.images[0];

    }


    return (
        ad.imageURL ||
        ad.imageUrl ||
        ad.photo ||
        ad.photoURL ||
        ""
    );

}


// ============================================================
// PRIX
// ============================================================

function formatPrice(ad) {

    const price =
        Number(
            ad.price
        );


    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {

        return "Prix sur demande";

    }


    const currency =
        String(
            ad.currency ||
            "USD"
        ).toUpperCase();


    return (
        new Intl.NumberFormat(
            "fr-FR"
        ).format(price)
    )
    +
    " "
    +
    currency;

}


// ============================================================
// LOCALISATION ANNONCE
// ============================================================

function getAdLocation(ad) {

    const city =
        getFirstValue(
            ad,
            [
                "city",
                "ville",
                "cityName",
                "villeName"
            ]
        );


    const commune =
        getFirstValue(
            ad,
            [
                "commune",
                "communeName"
            ]
        );


    const neighborhood =
        getFirstValue(
            ad,
            [
                "neighborhood",
                "quartier"
            ]
        );


    return [
        commune,
        neighborhood,
        city
    ]
        .filter(Boolean)
        .join(", ")
        ||
        "Localisation non renseignée";

}


// ============================================================
// CARTE ANNONCE
// ============================================================

function createPropertyCard(ad) {

    const image =
        getImage(ad);


    const title =
        getFirstValue(
            ad,
            [
                "title",
                "name"
            ]
        )
        ||
        "Bien immobilier";


    const imageHtml =
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
            `;


    return `
        <article class="immo-property">

            <div class="immo-property-image">
                ${imageHtml}
            </div>

            <div class="immo-property-content">

                <span class="immo-property-type">
                    Immobilier
                </span>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <div class="immo-property-location">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHtml(
                        getAdLocation(ad)
                    )}
                </div>

                <div class="immo-property-price">
                    ${escapeHtml(
                        formatPrice(ad)
                    )}
                </div>

                <a
                    href="explorer.html?id=${encodeURIComponent(ad.id)}"
                    class="immo-property-link"
                >
                    Voir le bien
                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        </article>
    `;

}


// ============================================================
// AFFICHAGE VENTE
// ============================================================

function displayVente(list) {

    if (!venteListings) {
        return;
    }


    if (!list.length) {

        venteListings.innerHTML = `
            <div class="immo-empty">

                <i class="fa-solid fa-house"></i>

                <strong>
                    Aucun bien à vendre
                </strong>

                <p>
                    Aucune annonce de vente
                    ne correspond à votre recherche.
                </p>

            </div>
        `;

        return;

    }


    venteListings.innerHTML =
        list
            .map(
                createPropertyCard
            )
            .join("");

}


// ============================================================
// AFFICHAGE LOCATION
// ============================================================

function displayLocation(list) {

    if (!locationListings) {
        return;
    }


    if (!list.length) {

        locationListings.innerHTML = `
            <div class="immo-empty">

                <i class="fa-solid fa-key"></i>

                <strong>
                    Aucun bien à louer
                </strong>

                <p>
                    Aucune annonce de location
                    ne correspond à votre recherche.
                </p>

            </div>
        `;

        return;

    }


    locationListings.innerHTML =
        list
            .map(
                createPropertyCard
            )
            .join("");

}


// ============================================================
// COMPTEURS
// ============================================================

function updateCounts() {

    if (venteCount) {

        venteCount.textContent =
            `${filteredVente.length} ${
                filteredVente.length > 1
                    ? "annonces"
                    : "annonce"
            }`;

    }


    if (locationCount) {

        locationCount.textContent =
            `${filteredLocation.length} ${
                filteredLocation.length > 1
                    ? "annonces"
                    : "annonce"
            }`;

    }

}


// ============================================================
// ERREUR ANNONCES
// ============================================================

function showListingError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.innerHTML = `
        <div class="immo-empty">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <strong>
                Erreur
            </strong>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;

}


// ============================================================
// AGENTS IMMOBILIERS
// ============================================================

async function loadAgents() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        agents =
            snapshot.docs
                .map(
                    docSnap => ({
                        id:
                            docSnap.id,
                        ...docSnap.data()
                    })
                )
                .filter(
                    isAgentImmobilier
                );


        displayAgents(
            agents
        );


        console.log(
            "CAMU IMMO — agents immobiliers :",
            agents.length
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement agents :",
            error
        );


        if (agentsGrid) {

            agentsGrid.innerHTML = `
                <div class="immo-empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <strong>
                        Impossible de charger les agents
                    </strong>

                    <p>
                        Vérifiez la connexion à Firebase.
                    </p>

                </div>
            `;

        }

    }

}


// ============================================================
// DÉTECTION AGENT IMMOBILIER
// ============================================================

function isAgentImmobilier(user) {

    const role =
        normalize(
            getFirstValue(
                user,
                [
                    "role",
                    "userRole",
                    "type"
                ]
            )
        );


    const profession =
        normalize(
            getFirstValue(
                user,
                [
                    "profession",
                    "metier",
                    "fonction",
                    "job"
                ]
            )
        );


    const accountType =
        normalize(
            getFirstValue(
                user,
                [
                    "accountType",
                    "profileType",
                    "typeCompte"
                ]
            )
        );


    const values = [
        role,
        profession,
        accountType
    ];


    const agentRoles = [

        "agent immobilier",

        "agent_immobilier",

        "agent-immobilier",

        "agentimmobilier",

        "agent immo",

        "agent_immo",

        "agent-immo",

        "immobilier",

        "real estate agent",

        "real_estate_agent"

    ];


    return values.some(
        value =>
            agentRoles.includes(
                value
            )
    );

}


// ============================================================
// FILTRAGE AGENTS
// ============================================================

function filterAgents() {

    const city =
        normalize(
            agentVille?.value
        );


    const commune =
        normalize(
            agentCommune?.value
        );


    let result =
        [...agents];


    // --------------------------------------------------------
    // Ville
    // --------------------------------------------------------

    if (city) {

        const option =
            agentVille?.options[
                agentVille.selectedIndex
            ];


        const cityId =
            option?.dataset.cityId ||
            "";


        result =
            result.filter(
                agent => {

                    const agentCity =
                        normalize(
                            getFirstValue(
                                agent,
                                [
                                    "ville",
                                    "city",
                                    "villeName",
                                    "cityName"
                                ]
                            )
                        );


                    const agentCityId =
                        String(
                            getFirstValue(
                                agent,
                                [
                                    "villeId",
                                    "cityId"
                                ]
                            )
                        ).trim();


                    return (
                        agentCity === city ||
                        (
                            cityId &&
                            agentCityId ===
                                cityId
                        )
                    );

                }
            );

    }


    // --------------------------------------------------------
    // Commune
    // --------------------------------------------------------

    if (commune) {

        const option =
            agentCommune?.options[
                agentCommune.selectedIndex
            ];


        const communeId =
            option?.dataset.communeId ||
            "";


        result =
            result.filter(
                agent => {

                    const agentCommune =
                        normalize(
                            getFirstValue(
                                agent,
                                [
                                    "commune",
                                    "communeName"
                                ]
                            )
                        );


                    const agentCommuneId =
                        String(
                            getFirstValue(
                                agent,
                                [
                                    "communeId"
                                ]
                            )
                        ).trim();


                    return (
                        agentCommune ===
                            commune ||
                        (
                            communeId &&
                            agentCommuneId ===
                                communeId
                        )
                    );

                }
            );

    }


    displayAgents(
        result
    );

}


// ============================================================
// AFFICHAGE AGENTS
// ============================================================

function displayAgents(list) {

    if (!agentsGrid) {
        return;
    }


    if (!list.length) {

        agentsGrid.innerHTML = `
            <div class="immo-empty">

                <i class="fa-solid fa-user-tie"></i>

                <strong>
                    Aucun agent immobilier trouvé
                </strong>

                <p>
                    Aucun agent ne correspond
                    aux critères sélectionnés.
                </p>

            </div>
        `;

        return;

    }


    agentsGrid.innerHTML =
        list
            .map(
                createAgentCard
            )
            .join("");

}


// ============================================================
// CARTE AGENT
// ============================================================

function createAgentCard(
    agent
) {

    const name =
        getName(agent);


    const city =
        getFirstValue(
            agent,
            [
                "ville",
                "city",
                "villeName",
                "cityName"
            ]
        );


    const commune =
        getFirstValue(
            agent,
            [
                "commune",
                "communeName"
            ]
        );


    const phone =
        getFirstValue(
            agent,
            [
                "whatsapp",
                "telephone",
                "phone",
                "tel"
            ]
        );


    const email =
        getFirstValue(
            agent,
            [
                "email"
            ]
        );


    const photo =
        getFirstValue(
            agent,
            [
                "photoURL",
                "photoUrl",
                "photo",
                "avatar"
            ]
        );


    const avatar =
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
            `;


    const location =
        [
            commune,
            city
        ]
            .filter(Boolean)
            .join(", ")
            ||
            "Localisation non renseignée";


    let whatsappHref =
        "";


    if (phone) {

        const cleanedPhone =
            String(phone)
                .replace(
                    /\D/g,
                    ""
                );


        if (cleanedPhone) {

            whatsappHref =
                `https://wa.me/${cleanedPhone}`;

        }

    }


    return `
        <article class="immo-agent">

            <div class="immo-agent-head">

                <div class="immo-agent-avatar">
                    ${avatar}
                </div>

                <div>

                    <h3>
                        ${escapeHtml(name)}
                    </h3>

                    <span class="immo-agent-role">
                        AGENT IMMOBILIER
                    </span>

                </div>

            </div>


            <div class="immo-agent-location">

                <div>
                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(
                        location
                    )}

                </div>

            </div>


            <div class="immo-agent-actions">

                ${
                    whatsappHref
                        ? `
                            <a
                                href="${escapeHtml(
                                    whatsappHref
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


                ${
                    email
                        ? `
                            <a
                                href="mailto:${escapeHtml(email)}"
                                class="immo-agent-contact"
                            >
                                <i class="fa-solid fa-envelope"></i>
                                E-mail
                            </a>
                        `
                        : ""
                }

            </div>

        </article>
    `;

}


// ============================================================
// INITIALISATION
// ============================================================

async function initImmobilier() {

    if (yearElement) {

        yearElement.textContent =
            new Date()
                .getFullYear();

    }


    // --------------------------------------------------------
    // Chargement
    // --------------------------------------------------------

    await loadVilles();

    await loadCommunes();

    await loadAnnonces();

    await loadAgents();


    console.log(
        "CAMU IMMO — initialisation terminée."
    );

}


// ============================================================
// DÉMARRAGE
// ============================================================

initImmobilier()
    .catch(
        error => {

            console.error(
                "CAMU IMMO — erreur initialisation :",
                error
            );

        }
    );

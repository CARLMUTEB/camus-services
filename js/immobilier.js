// ============================================================
// CAMU SERVICES — ESPACE IMMOBILIER
// ============================================================
// Gestion de :
// - Villes dynamiques depuis Firestore
// - Commune saisie manuellement
// - Vente
// - Location
// - Recherche immobilière
// - Agents immobiliers
// - Filtres ville / commune
// ============================================================


import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// 1. CONFIGURATION FIREBASE
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
    authDomain: "camu-services.firebaseapp.com",
    projectId: "camu-services",
    storageBucket: "camu-services.appspot.com",
    messagingSenderId: "879100396449",
    appId: "1:879100396449:web:9d7ffe441a3df2daf841e0",
    measurementId: "G-RQ16SX2SNV"
};


// ============================================================
// 2. INITIALISATION FIREBASE
// ============================================================

let immoApp;

const existingApps = getApps();

if (existingApps.some(app => app.name === "camu-immo")) {

    immoApp = getApp("camu-immo");

} else {

    immoApp = initializeApp(
        firebaseConfig,
        "camu-immo"
    );

}

const db = getFirestore(immoApp);


// ============================================================
// 3. VARIABLES GLOBALES
// ============================================================

let villes = [];
let annonces = [];
let agents = [];


// ============================================================
// 4. OUTILS
// ============================================================

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


function firstValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return "";

}


function formatPrice(price, currency = "USD") {

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
        return "Prix à négocier";
    }

    const currencyNormalized =
        normalize(currency);

    let symbol = "$";

    if (
        currencyNormalized === "cdf" ||
        currencyNormalized === "fc" ||
        currencyNormalized === "franc congolais"
    ) {

        symbol = "FC";

    }

    return `${numericPrice.toLocaleString("fr-FR")} ${symbol}`;

}


function getAnnonceCity(annonce) {

    return firstValue(
        annonce.city,
        annonce.ville,
        annonce.cityName,
        annonce.villeName,
        annonce.localisation,
        annonce.location
    );

}


function getAnnonceCommune(annonce) {

    return firstValue(
        annonce.commune,
        annonce.communeName,
        annonce.quartier
    );

}


function getAnnonceCategory(annonce) {

    return firstValue(
        annonce.category,
        annonce.categorie,
        annonce.categoryName
    );

}


function getTransactionType(annonce) {

    return firstValue(
        annonce.typeTransaction,
        annonce.transactionType,
        annonce.transaction,
        annonce.operation
    );

}


// ============================================================
// 5. MENU MOBILE
// ============================================================

function setupMobileMenu() {

    const menuButton =
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


    if (!menuButton || !sidebar) {
        return;
    }


    function openMenu() {

        sidebar.classList.add("active");

        if (overlay) {
            overlay.classList.add("active");
        }

        document.body.classList.add(
            "immo-menu-open"
        );

    }


    function closeMenu() {

        sidebar.classList.remove("active");

        if (overlay) {
            overlay.classList.remove("active");
        }

        document.body.classList.remove(
            "immo-menu-open"
        );

    }


    menuButton.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
                    "active"
                )
            ) {

                closeMenu();

            } else {

                openMenu();

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMenu
        );

    }


    sidebar
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMenu
            );

        });

}


// ============================================================
// 6. CHARGER LES VILLES
// ============================================================

async function loadVilles() {

    try {

        console.log(
            "CAMU IMMO — chargement des villes..."
        );


        const snapshot =
            await getDocs(
                collection(db, "villes")
            );


        villes = [];


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            if (data.active === false) {
                return;
            }


            villes.push({

                id: docSnap.id,

                name: firstValue(
                    data.name,
                    data.nom
                ),

                province: firstValue(
                    data.province
                ),

                order:
                    Number(data.order) || 999

            });

        });


        villes.sort((a, b) => {

            if (a.order !== b.order) {

                return a.order - b.order;

            }

            return normalize(a.name)
                .localeCompare(
                    normalize(b.name)
                );

        });


        console.log(
            `CAMU IMMO — ${villes.length} ville(s) chargée(s).`
        );


        populateVilleSelect(
            document.getElementById(
                "immoVille"
            )
        );


        populateVilleSelect(
            document.getElementById(
                "agentVille"
            )
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement villes :",
            error
        );

    }

}


// ============================================================
// 7. REMPLIR LES VILLES
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


    villes.forEach(ville => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            ville.id;


        option.textContent =
            ville.name || "Ville";


        select.appendChild(
            option
        );

    });


    if (
        currentValue &&
        [...select.options].some(
            option =>
                option.value ===
                currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


// ============================================================
// 8. COMMUNE — SAISIE MANUELLE
// ============================================================

function setupCommuneFields() {

    const immoCommune =
        document.getElementById(
            "immoCommune"
        );


    const agentCommune =
        document.getElementById(
            "agentCommune"
        );


    if (immoCommune) {

        immoCommune.addEventListener(
            "input",
            filterAnnonces
        );

    }


    if (agentCommune) {

        agentCommune.addEventListener(
            "input",
            filterAgents
        );

    }

}


// ============================================================
// 9. IDENTIFIER UNE ANNONCE IMMOBILIÈRE
// ============================================================

function isImmobilierAnnonce(annonce) {

    const category =
        normalize(
            getAnnonceCategory(
                annonce
            )
        );


    return (
        category === "immobilier" ||
        category.includes("immobilier") ||
        category === "immo"
    );

}


// ============================================================
// 10. IDENTIFIER UNE VENTE
// ============================================================

function isVente(annonce) {

    const type =
        normalize(
            getTransactionType(
                annonce
            )
        );


    return [
        "vente",
        "vendre",
        "sell",
        "sale",
        "achat"
    ].includes(type);

}


// ============================================================
// 11. IDENTIFIER UNE LOCATION
// ============================================================

function isLocation(annonce) {

    const type =
        normalize(
            getTransactionType(
                annonce
            )
        );


    return [
        "location",
        "louer",
        "rent",
        "rental"
    ].includes(type);

}


// ============================================================
// 12. CHARGER LES ANNONCES
// ============================================================

async function loadAnnonces() {

    try {

        console.log(
            "CAMU IMMO — chargement des annonces..."
        );


        const snapshot =
            await getDocs(
                collection(db, "annonces")
            );


        annonces = [];


        snapshot.forEach(docSnap => {

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
                !isImmobilierAnnonce(
                    data
                )
            ) {

                return;

            }


            annonces.push({

                id: docSnap.id,

                ...data

            });

        });


        console.log(
            `CAMU IMMO — ${annonces.length} annonce(s) immobilière(s).`
        );


        filterAnnonces();


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement annonces :",
            error
        );


        showError(
            "Impossible de charger les annonces immobilières."
        );

    }

}


// ============================================================
// 13. FILTRER LES ANNONCES
// ============================================================

function filterAnnonces() {

    const villeSelect =
        document.getElementById(
            "immoVille"
        );


    const communeInput =
        document.getElementById(
            "immoCommune"
        );


    const transactionSelect =
        document.getElementById(
            "immoTransaction"
        );


    const keywordInput =
        document.getElementById(
            "immoKeyword"
        );


    const villeId =
        villeSelect?.value || "";


    const commune =
        normalize(
            communeInput?.value || ""
        );


    const transaction =
        normalize(
            transactionSelect?.value || ""
        );


    const keyword =
        normalize(
            keywordInput?.value || ""
        );


    const selectedVille =
        villes.find(
            ville =>
                String(ville.id) ===
                String(villeId)
        );


    const villeName =
        selectedVille?.name || "";


    const filtered =
        annonces.filter(annonce => {


            // ------------------------------------------------
            // VILLE
            // ------------------------------------------------

            if (villeId) {

                const annonceCity =
                    normalize(
                        getAnnonceCity(
                            annonce
                        )
                    );


                if (
                    annonceCity !==
                    normalize(villeName)
                ) {

                    return false;

                }

            }


            // ------------------------------------------------
            // COMMUNE MANUELLE
            // ------------------------------------------------

            if (commune) {

                const annonceCommune =
                    normalize(
                        getAnnonceCommune(
                            annonce
                        )
                    );


                if (
                    !annonceCommune.includes(
                        commune
                    )
                ) {

                    return false;

                }

            }


            // ------------------------------------------------
            // TRANSACTION
            // ------------------------------------------------

            if (transaction) {

                const type =
                    normalize(
                        getTransactionType(
                            annonce
                        )
                    );


                if (type !== transaction) {

                    return false;

                }

            }


            // ------------------------------------------------
            // MOT-CLÉ
            // ------------------------------------------------

            if (keyword) {

                const searchableText =
                    normalize(
                        [
                            annonce.title,
                            annonce.description,
                            annonce.city,
                            annonce.ville,
                            annonce.commune,
                            annonce.quartier,
                            annonce.typeBien
                        ]
                            .filter(Boolean)
                            .join(" ")
                    );


                if (
                    !searchableText.includes(
                        keyword
                    )
                ) {

                    return false;

                }

            }


            return true;

        });


    renderVente(
        filtered.filter(
            annonce =>
                isVente(annonce)
        )
    );


    renderLocation(
        filtered.filter(
            annonce =>
                isLocation(annonce)
        )
    );

}


// ============================================================
// 14. RECHERCHE
// ============================================================

function performSearch() {

    filterAnnonces();


    const venteSection =
        document.getElementById(
            "vente"
        );


    if (venteSection) {

        venteSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ============================================================
// 15. CARTE ANNONCE
// ============================================================

function createAnnonceCard(annonce) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "immo-listing-card";


    const images =
        Array.isArray(annonce.images)
            ? annonce.images
            : [];


    const imageURL =
        firstValue(
            images[0],
            annonce.imageURL,
            annonce.photo,
            "assets/logo/camu-services-logo.png"
        );


    const title =
        firstValue(
            annonce.title,
            annonce.titre,
            "Bien immobilier"
        );


    const city =
        getAnnonceCity(
            annonce
        );


    const commune =
        getAnnonceCommune(
            annonce
        );


    const price =
        formatPrice(
            annonce.price,
            annonce.currency
        );


    const typeBien =
        firstValue(
            annonce.typeBien,
            annonce.propertyType,
            annonce.typePropriete
        );


    const locationText =
        [commune, city]
            .filter(Boolean)
            .join(", ");


    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(annonce.id)}"
            class="immo-listing-image-link"
        >

            <img
                src="${escapeHtml(imageURL)}"
                alt="${escapeHtml(title)}"
                class="immo-listing-image"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >

        </a>


        <div class="immo-listing-content">

            <div class="immo-listing-price">
                ${escapeHtml(price)}
            </div>


            <h3 class="immo-listing-title">
                ${escapeHtml(title)}
            </h3>


            ${
                typeBien
                    ? `
                        <div class="immo-listing-type">
                            <i class="fa-solid fa-house"></i>
                            ${escapeHtml(typeBien)}
                        </div>
                    `
                    : ""
            }


            ${
                locationText
                    ? `
                        <div class="immo-listing-location">
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHtml(locationText)}
                        </div>
                    `
                    : ""
            }


            <a
                href="explorer.html?id=${encodeURIComponent(annonce.id)}"
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
// 16. AFFICHER LES VENTES
// ============================================================

function renderVente(items) {

    const container =
        document.getElementById(
            "venteListings"
        );


    const count =
        document.getElementById(
            "venteCount"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${items.length} annonce${items.length > 1 ? "s" : ""}`;

    }


    if (items.length === 0) {

        container.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-house-circle-xmark"></i>

                <h3>Aucun bien à vendre</h3>

                <p>
                    Aucune annonce immobilière
                    ne correspond à vos critères.
                </p>

            </div>

        `;

        return;
    }


    items.forEach(annonce => {

        container.appendChild(
            createAnnonceCard(
                annonce
            )
        );

    });

}


// ============================================================
// 17. AFFICHER LES LOCATIONS
// ============================================================

function renderLocation(items) {

    const container =
        document.getElementById(
            "locationListings"
        );


    const count =
        document.getElementById(
            "locationCount"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${items.length} annonce${items.length > 1 ? "s" : ""}`;

    }


    if (items.length === 0) {

        container.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-key"></i>

                <h3>Aucun bien à louer</h3>

                <p>
                    Aucune annonce immobilière
                    ne correspond à vos critères.
                </p>

            </div>

        `;

        return;
    }


    items.forEach(annonce => {

        container.appendChild(
            createAnnonceCard(
                annonce
            )
        );

    });

}


// ============================================================
// 18. CHARGER LES AGENTS IMMOBILIERS
// ============================================================

async function loadAgents() {

    try {

        console.log(
            "CAMU IMMO — chargement des agents..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "agents_immobiliers"
                )
            );


        agents = [];


        snapshot.forEach(docSnap => {

            const data =
                docSnap.data();


            if (data.active === false) {
                return;
            }


            agents.push({

                id: docSnap.id,

                name: firstValue(
                    data.name,
                    "Agent immobilier"
                ),

                phone: firstValue(
                    data.phone
                ),

                WhatsApp: firstValue(
                    data.WhatsApp,
                    data.whatsapp
                ),

                email: firstValue(
                    data.email
                ),

                photoURL: firstValue(
                    data.photoURL
                ),

                ville: firstValue(
                    data.ville
                ),

                commune: firstValue(
                    data.commune
                ),

                description: firstValue(
                    data.description
                ),

                active:
                    data.active !== false

            });

        });


        console.log(
            `CAMU IMMO — ${agents.length} agent(s) immobilier(s).`
        );


        filterAgents();


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur chargement agents :",
            error
        );


        const container =
            document.getElementById(
                "agentsGrid"
            );


        if (container) {

            container.innerHTML = `

                <div class="immo-empty">

                    <i class="fa-solid fa-user-slash"></i>

                    <h3>Agents indisponibles</h3>

                    <p>
                        Impossible de charger
                        les agents immobiliers.
                    </p>

                </div>

            `;

        }

    }

}


// ============================================================
// 19. FILTRER LES AGENTS
// ============================================================

function filterAgents() {

    const villeSelect =
        document.getElementById(
            "agentVille"
        );


    const communeInput =
        document.getElementById(
            "agentCommune"
        );


    const villeId =
        villeSelect?.value || "";


    const commune =
        normalize(
            communeInput?.value || ""
        );


    const selectedVille =
        villes.find(
            ville =>
                String(ville.id) ===
                String(villeId)
        );


    const villeName =
        selectedVille?.name || "";


    const filtered =
        agents.filter(agent => {


            // ------------------------------------------------
            // VILLE
            // ------------------------------------------------

            if (villeId) {

                const agentVille =
                    normalize(
                        agent.ville
                    );


                if (
                    agentVille !==
                    normalize(villeName)
                ) {

                    return false;

                }

            }


            // ------------------------------------------------
            // COMMUNE MANUELLE
            // ------------------------------------------------

            if (commune) {

                const agentCommune =
                    normalize(
                        agent.commune
                    );


                if (
                    !agentCommune.includes(
                        commune
                    )
                ) {

                    return false;

                }

            }


            return true;

        });


    renderAgents(
        filtered
    );

}


// ============================================================
// 20. CARTE AGENT
// ============================================================

function createAgentCard(agent) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "immo-agent-card";


    const name =
        agent.name ||
        "Agent immobilier";


    const photo =
        agent.photoURL ||
        "assets/logo/camu-services-logo.png";


    const ville =
        agent.ville || "";


    const commune =
        agent.commune || "";


    const location =
        [commune, ville]
            .filter(Boolean)
            .join(", ");


    const phone =
        agent.WhatsApp ||
        agent.phone ||
        "";


    const email =
        agent.email ||
        "";


    let contactHTML = "";


    if (phone) {

        const cleanPhone =
            String(phone)
                .replace(/[^\d]/g, "");


        contactHTML += `

            <a
                href="https://wa.me/${cleanPhone}"
                target="_blank"
                rel="noopener noreferrer"
                class="immo-agent-whatsapp"
            >

                <i class="fa-brands fa-whatsapp"></i>

                WhatsApp

            </a>

        `;

    }


    if (email) {

        contactHTML += `

            <a
                href="mailto:${encodeURIComponent(
                    String(email).trim()
                )}"
                class="immo-agent-email"
            >

                <i class="fa-solid fa-envelope"></i>

                E-mail

            </a>

        `;

    }


    card.innerHTML = `

        <div class="immo-agent-photo-wrapper">

            <img
                src="${escapeHtml(photo)}"
                alt="${escapeHtml(name)}"
                class="immo-agent-photo"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >

        </div>


        <div class="immo-agent-content">

            <div class="immo-agent-badge">

                <i class="fa-solid fa-building"></i>

                Agent immobilier

            </div>


            <h3>
                ${escapeHtml(name)}
            </h3>


            ${
                location
                    ? `
                        <div class="immo-agent-location">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHtml(location)}

                        </div>
                    `
                    : ""
            }


            ${
                agent.description
                    ? `
                        <p class="immo-agent-description">
                            ${escapeHtml(
                                agent.description
                            )}
                        </p>
                    `
                    : ""
            }


            <div class="immo-agent-actions">

                ${contactHTML}

            </div>

        </div>

    `;


    return card;

}


// ============================================================
// 21. AFFICHER LES AGENTS
// ============================================================

function renderAgents(items) {

    const container =
        document.getElementById(
            "agentsGrid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (items.length === 0) {

        container.innerHTML = `

            <div class="immo-empty">

                <i class="fa-solid fa-user-group"></i>

                <h3>Aucun agent trouvé</h3>

                <p>
                    Aucun agent immobilier
                    ne correspond à cette localisation.
                </p>

            </div>

        `;

        return;
    }


    items.forEach(agent => {

        container.appendChild(
            createAgentCard(agent)
        );

    });

}


// ============================================================
// 22. AFFICHER UNE ERREUR
// ============================================================

function showError(message) {

    console.error(
        "CAMU IMMO —",
        message
    );


    const containers = [

        document.getElementById(
            "venteListings"
        ),

        document.getElementById(
            "locationListings"
        )

    ];


    containers.forEach(container => {

        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="immo-empty immo-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Une erreur est survenue</h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        `;

    });

}


// ============================================================
// 23. ÉVÉNEMENTS
// ============================================================

function setupEvents() {

    const villeSelect =
        document.getElementById(
            "immoVille"
        );


    const transactionSelect =
        document.getElementById(
            "immoTransaction"
        );


    const keywordInput =
        document.getElementById(
            "immoKeyword"
        );


    const searchButton =
        document.getElementById(
            "immoSearchButton"
        );


    // --------------------------------------------------------
    // VILLE DES ANNONCES
    // --------------------------------------------------------

    if (villeSelect) {

        villeSelect.addEventListener(
            "change",
            filterAnnonces
        );

    }


    // --------------------------------------------------------
    // TRANSACTION
    // --------------------------------------------------------

    if (transactionSelect) {

        transactionSelect.addEventListener(
            "change",
            filterAnnonces
        );

    }


    // --------------------------------------------------------
    // MOT-CLÉ
    // --------------------------------------------------------

    if (keywordInput) {

        keywordInput.addEventListener(
            "input",
            filterAnnonces
        );


        keywordInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch();

                }

            }
        );

    }


    // --------------------------------------------------------
    // RECHERCHE
    // --------------------------------------------------------

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    // --------------------------------------------------------
    // VILLE DES AGENTS
    // --------------------------------------------------------

    const agentVille =
        document.getElementById(
            "agentVille"
        );


    if (agentVille) {

        agentVille.addEventListener(
            "change",
            filterAgents
        );

    }

}


// ============================================================
// 24. NAVIGATION FLUIDE
// ============================================================

function setupSmoothNavigation() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

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

                }
            );

        });

}


// ============================================================
// 25. ANNÉE
// ============================================================

function setCurrentYear() {

    const yearElement =
        document.getElementById(
            "immoYear"
        );


    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

}


// ============================================================
// 26. INITIALISATION
// ============================================================

async function initImmobilier() {

    console.log(
        "=========================================="
    );


    console.log(
        "CAMU IMMO — initialisation..."
    );


    console.log(
        "Firebase SDK : 10.12.2"
    );


    console.log(
        "Firestore :",
        db
    );


    try {

        setupMobileMenu();

        setupEvents();

        setupCommuneFields();

        setupSmoothNavigation();

        setCurrentYear();


        await loadVilles();


        await Promise.all([

            loadAnnonces(),

            loadAgents()

        ]);


        console.log(
            "CAMU IMMO — initialisation terminée."
        );


    } catch (error) {

        console.error(
            "CAMU IMMO — erreur initialisation :",
            error
        );


        showError(
            "Impossible d'initialiser l'espace immobilier."
        );

    }

}


// ============================================================
// 27. LANCEMENT
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initImmobilier
    );

} else {

    initImmobilier();

}

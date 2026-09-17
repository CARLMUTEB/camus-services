// ============================================================
// CAMU SERVICES — ESPACE COMMERCE
// ============================================================
// Gestion de :
// - Catégories Commerce
// - Produits / annonces
// - Recherche
// - Villes
// - Commune saisie manuellement
// - Établissements / vendeurs
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
// 1. FIREBASE
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


let commerceApp;

const existingApps = getApps();

if (
    existingApps.some(
        app => app.name === "camu-commerce"
    )
) {

    commerceApp =
        getApp("camu-commerce");

} else {

    commerceApp =
        initializeApp(
            firebaseConfig,
            "camu-commerce"
        );

}


const db =
    getFirestore(
        commerceApp
    );


// ============================================================
// 2. VARIABLES
// ============================================================

let categories = [];
let villes = [];
let produits = [];
let etablissements = [];


// ============================================================
// 3. OUTILS
// ============================================================

function normalize(value) {

    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function escapeHtml(value) {

    return String(value ?? "")
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


function getCity(item) {

    return firstValue(
        item.city,
        item.ville,
        item.cityName,
        item.villeName
    );

}


function getCommune(item) {

    return firstValue(
        item.commune,
        item.communeName,
        item.quartier
    );

}


function getCategory(item) {

    return firstValue(
        item.category,
        item.categorie,
        item.categoryName
    );

}


function getImages(item) {

    if (
        Array.isArray(
            item.images
        )
    ) {
        return item.images;
    }


    if (
        typeof item.images === "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    item.images
                );

            if (
                Array.isArray(parsed)
            ) {
                return parsed;
            }

        } catch (error) {
            // Image non JSON.
        }

    }


    if (item.imageURL) {
        return [item.imageURL];
    }


    return [];

}


function formatPrice(
    price,
    currency = "USD"
) {

    const number =
        Number(price);


    if (
        !Number.isFinite(number)
    ) {
        return "Prix à négocier";
    }


    const normalizedCurrency =
        normalize(currency);


    let symbol = "$";


    if (
        normalizedCurrency === "cdf" ||
        normalizedCurrency === "fc" ||
        normalizedCurrency === "franc congolais"
    ) {
        symbol = "FC";
    }


    return `${number.toLocaleString("fr-FR")} ${symbol}`;

}


// ============================================================
// 4. MENU MOBILE
// ============================================================

function setupMobileMenu() {

    const button =
        document.getElementById(
            "commerceMenuButton"
        );


    const sidebar =
        document.getElementById(
            "commerceSidebar"
        );


    const overlay =
        document.getElementById(
            "commerceOverlay"
        );


    if (
        !button ||
        !sidebar
    ) {
        return;
    }


    function openMenu() {

        sidebar.classList.add(
            "active"
        );


        overlay?.classList.add(
            "active"
        );


        document.body.classList.add(
            "commerce-menu-open"
        );


        button.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    function closeMenu() {

        sidebar.classList.remove(
            "active"
        );


        overlay?.classList.remove(
            "active"
        );


        document.body.classList.remove(
            "commerce-menu-open"
        );


        button.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    button.addEventListener(
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


    overlay?.addEventListener(
        "click",
        closeMenu
    );


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
// 5. CHARGER LES CATÉGORIES
// ============================================================

async function loadCategories() {

    try {

        console.log(
            "CAMU COMMERCE — chargement des catégories..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        categories = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {
                    return;
                }


                const section =
                    normalize(
                        firstValue(
                            data.section,
                            data.espace,
                            data.type
                        )
                    );


                // ------------------------------------------------
                // Les catégories explicitement Commerce
                // ------------------------------------------------

                const isCommerce =
                    section === "commerce" ||
                    section === "commercial" ||
                    section === "commerces";


                // Si aucune section n'existe,
                // on accepte la catégorie.
                const shouldInclude =
                    !section ||
                    isCommerce;


                if (!shouldInclude) {
                    return;
                }


                categories.push({

                    id: docSnap.id,

                    name:
                        firstValue(
                            data.name,
                            data.nom,
                            "Catégorie"
                        ),

                    icon:
                        firstValue(
                            data.icon,
                            "fa-solid fa-tag"
                        ),

                    description:
                        firstValue(
                            data.description,
                            "Découvrez nos produits."
                        ),

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        categories.sort(
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


                return normalize(
                    a.name
                ).localeCompare(
                    normalize(
                        b.name
                    )
                );

            }
        );


        console.log(
            `CAMU COMMERCE — ${categories.length} catégorie(s) chargée(s).`
        );


        renderCategories();

        populateCategorySelect();

    } catch (error) {

        console.error(
            "CAMU COMMERCE — erreur catégories :",
            error
        );


        const container =
            document.getElementById(
                "commerceCategories"
            );


        if (container) {

            container.innerHTML = `

                <div class="commerce-empty">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Catégories indisponibles
                    </h3>

                    <p>
                        Impossible de charger les catégories.
                    </p>

                </div>

            `;

        }

    }

}


// ============================================================
// 6. AFFICHER LES CATÉGORIES
// ============================================================

function renderCategories() {

    const container =
        document.getElementById(
            "commerceCategories"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        categories.length === 0
    ) {

        container.innerHTML = `

            <div class="commerce-empty">

                <i class="fa-solid fa-tags"></i>

                <h3>
                    Aucune catégorie
                </h3>

                <p>
                    Les catégories Commerce
                    seront bientôt disponibles.
                </p>

            </div>

        `;

        return;
    }


    categories.forEach(
        category => {

            const card =
                document.createElement(
                    "a"
                );


            card.href =
                `#produits`;


            card.className =
                "commerce-category-card";


            card.dataset.category =
                category.id;


            card.innerHTML = `

                <div
                    class="commerce-category-icon"
                >

                    <i class="${escapeHtml(
                        category.icon
                    )}"></i>

                </div>


                <h3>
                    ${escapeHtml(
                        category.name
                    )}
                </h3>


                <p>
                    ${escapeHtml(
                        category.description
                    )}
                </p>

            `;


            card.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const select =
                        document.getElementById(
                            "commerceCategory"
                        );


                    if (select) {

                        select.value =
                            category.id;

                    }


                    filterProduits();


                    document
                        .getElementById(
                            "produits"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 7. SELECT CATÉGORIES
// ============================================================

function populateCategorySelect() {

    const select =
        document.getElementById(
            "commerceCategory"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Toutes les catégories
        </option>

    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category.id;


            option.textContent =
                category.name;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// 8. CHARGER LES VILLES
// ============================================================

async function loadVilles() {

    try {

        console.log(
            "CAMU COMMERCE — chargement des villes..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        villes = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {
                    return;
                }


                villes.push({

                    id:
                        docSnap.id,

                    name:
                        firstValue(
                            data.name,
                            data.nom
                        ),

                    order:
                        Number(
                            data.order
                        ) || 999

                });

            }
        );


        villes.sort(
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


                return normalize(
                    a.name
                ).localeCompare(
                    normalize(
                        b.name
                    )
                );

            }
        );


        populateVilleSelect(
            document.getElementById(
                "commerceVille"
            )
        );


        populateVilleSelect(
            document.getElementById(
                "businessVille"
            )
        );


        console.log(
            `CAMU COMMERCE — ${villes.length} ville(s) chargée(s).`
        );

    } catch (error) {

        console.error(
            "CAMU COMMERCE — erreur villes :",
            error
        );

    }

}


// ============================================================
// 9. SELECT VILLES
// ============================================================

function populateVilleSelect(
    select
) {

    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Toutes les villes
        </option>

    `;


    villes.forEach(
        ville => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                ville.id;


            option.textContent =
                ville.name;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// 10. IDENTIFIER UNE ANNONCE COMMERCE
// ============================================================

function isCommerceProduit(
    annonce
) {

    const category =
        normalize(
            getCategory(
                annonce
            )
        );


    // --------------------------------------------------------
    // Catégorie Commerce
    // --------------------------------------------------------

    const categoryData =
        categories.find(
            categoryItem =>
                normalize(
                    categoryItem.id
                ) === category ||
                normalize(
                    categoryItem.name
                ) === category
        );


    if (
        categoryData
    ) {
        return true;
    }


    // --------------------------------------------------------
    // Catégories commerciales connues
    // --------------------------------------------------------

    const commerceKeywords = [

        "commerce",
        "commercial",
        "alimentation",
        "vetement",
        "mode",
        "chaussure",
        "telephone",
        "electronique",
        "electromenager",
        "cosmetique",
        "beaute",
        "meuble",
        "decoration",
        "agriculture",
        "informatique",
        "accessoire",
        "produit"

    ];


    if (
        commerceKeywords.some(
            keyword =>
                category.includes(
                    keyword
                )
        )
    ) {
        return true;
    }


    // --------------------------------------------------------
    // Compatibilité avec certaines anciennes annonces
    // --------------------------------------------------------

    const title =
        normalize(
            firstValue(
                annonce.title,
                annonce.titre
            )
        );


    const description =
        normalize(
            annonce.description
        );


    if (
        title ||
        description
    ) {

        const text =
            `${title} ${description}`;


        const productKeywords = [

            "telephone",
            "iphone",
            "samsung",
            "ordinateur",
            "ordinateur portable",
            "chaussure",
            "vetement",
            "robe",
            "pantalon",
            "chemise",
            "meuble",
            "canape",
            "refrigerateur",
            "television",
            "tv",
            "cosmetique",
            "parfum",
            "produit"

        ];


        if (
            productKeywords.some(
                keyword =>
                    text.includes(
                        keyword
                    )
            )
        ) {
            return true;
        }

    }


    return false;
}


// ============================================================
// 11. CHARGER LES PRODUITS
// ============================================================

async function loadProduits() {

    try {

        console.log(
            "CAMU COMMERCE — chargement des produits..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        produits = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const status =
                    normalize(
                        data.status
                    );


                // --------------------------------------------
                // Statuts autorisés
                // --------------------------------------------

                if (
                    status &&
                    status !== "active" &&
                    status !== "approved"
                ) {
                    return;
                }


                if (
                    !isCommerceProduit(
                        data
                    )
                ) {
                    return;
                }


                produits.push({

                    id:
                        docSnap.id,

                    ...data

                });

            }
        );


        console.log(
            `CAMU COMMERCE — ${produits.length} produit(s) chargé(s).`
        );


        filterProduits();

    } catch (error) {

        console.error(
            "CAMU COMMERCE — erreur produits :",
            error
        );


        renderProductError();

    }

}


// ============================================================
// 12. FILTRER LES PRODUITS
// ============================================================

function filterProduits() {

    const keywordInput =
        document.getElementById(
            "commerceKeyword"
        );


    const categorySelect =
        document.getElementById(
            "commerceCategory"
        );


    const villeSelect =
        document.getElementById(
            "commerceVille"
        );


    const communeInput =
        document.getElementById(
            "commerceCommune"
        );


    const keyword =
        normalize(
            keywordInput?.value
        );


    const category =
        normalize(
            categorySelect?.value
        );


    const villeId =
        villeSelect?.value || "";


    const commune =
        normalize(
            communeInput?.value
        );


    const selectedVille =
        villes.find(
            ville =>
                String(ville.id) ===
                String(villeId)
        );


    const villeName =
        normalize(
            selectedVille?.name
        );


    const filtered =
        produits.filter(
            produit => {

                // ------------------------------------------
                // CATÉGORIE
                // ------------------------------------------

                if (category) {

                    const productCategory =
                        normalize(
                            getCategory(
                                produit
                            )
                        );


                    const selectedCategory =
                        categories.find(
                            item =>
                                normalize(
                                    item.id
                                ) === category
                        );


                    const categoryName =
                        normalize(
                            selectedCategory?.name
                        );


                    if (
                        productCategory !==
                            category &&
                        productCategory !==
                            categoryName
                    ) {

                        return false;

                    }

                }


                // ------------------------------------------
                // VILLE
                // ------------------------------------------

                if (villeId) {

                    const productVille =
                        normalize(
                            getCity(
                                produit
                            )
                        );


                    if (
                        productVille !==
                        villeName
                    ) {
                        return false;
                    }

                }


                // ------------------------------------------
                // COMMUNE
                // ------------------------------------------

                if (commune) {

                    const productCommune =
                        normalize(
                            getCommune(
                                produit
                            )
                        );


                    if (
                        !productCommune.includes(
                            commune
                        )
                    ) {
                        return false;
                    }

                }


                // ------------------------------------------
                // MOT-CLÉ
                // ------------------------------------------

                if (keyword) {

                    const searchable =
                        normalize(
                            [
                                produit.title,
                                produit.titre,
                                produit.description,
                                produit.city,
                                produit.ville,
                                produit.commune,
                                produit.quartier,
                                produit.category,
                                produit.categorie
                            ]
                                .filter(Boolean)
                                .join(" ")
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


    renderProducts(
        filtered
    );

}


// ============================================================
// 13. CARTE PRODUIT
// ============================================================

function createProductCard(
    produit
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "commerce-product-card";


    const images =
        getImages(
            produit
        );


    const imageURL =
        firstValue(
            images[0],
            produit.imageURL,
            produit.photo,
            "assets/logo/camu-services-logo.png"
        );


    const title =
        firstValue(
            produit.title,
            produit.titre,
            "Produit"
        );


    const price =
        formatPrice(
            produit.price,
            produit.currency
        );


    const city =
        getCity(
            produit
        );


    const commune =
        getCommune(
            produit
        );


    const category =
        getCategory(
            produit
        );


    const location =
        [commune, city]
            .filter(Boolean)
            .join(", ");


    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(
                produit.id
            )}"
            class="commerce-product-image-link"
        >

            <img
                src="${escapeHtml(
                    imageURL
                )}"
                alt="${escapeHtml(
                    title
                )}"
                class="commerce-product-image"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >

        </a>


        <div class="commerce-product-content">

            <div class="commerce-product-price">
                ${escapeHtml(
                    price
                )}
            </div>


            <h3 class="commerce-product-title">
                ${escapeHtml(
                    title
                )}
            </h3>


            ${
                category
                    ? `
                        <div class="commerce-product-category">

                            <i class="fa-solid fa-tag"></i>

                            ${escapeHtml(
                                category
                            )}

                        </div>
                    `
                    : ""
            }


            ${
                location
                    ? `
                        <div class="commerce-product-location">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHtml(
                                location
                            )}

                        </div>
                    `
                    : ""
            }


            <a
                href="explorer.html?id=${encodeURIComponent(
                    produit.id
                )}"
                class="commerce-product-button"
            >

                Voir le produit

                <i class="fa-solid fa-arrow-right"></i>

            </a>

        </div>

    `;


    return card;
}


// ============================================================
// 14. AFFICHER LES PRODUITS
// ============================================================

function renderProducts(
    items
) {

    const container =
        document.getElementById(
            "commerceProducts"
        );


    const count =
        document.getElementById(
            "commerceProductCount"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (count) {

        count.textContent =
            `${items.length} produit${
                items.length > 1
                    ? "s"
                    : ""
            }`;

    }


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="commerce-empty">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    Aucun produit trouvé
                </h3>

                <p>
                    Aucun produit ne correspond
                    à vos critères.
                </p>

            </div>

        `;

        return;
    }


    items.forEach(
        produit => {

            container.appendChild(
                createProductCard(
                    produit
                )
            );

        }
    );

}


// ============================================================
// 15. ERREUR PRODUITS
// ============================================================

function renderProductError() {

    const container =
        document.getElementById(
            "commerceProducts"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="commerce-empty">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Produits indisponibles
            </h3>

            <p>
                Impossible de charger les produits.
            </p>

        </div>

    `;

}


// ============================================================
// 16. CHARGER LES ÉTABLISSEMENTS
// ============================================================

async function loadEtablissements() {

    try {

        console.log(
            "CAMU COMMERCE — chargement des établissements..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "etablissements_commerciaux"
                )
            );


        etablissements = [];


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (
                    data.active === false
                ) {
                    return;
                }


                etablissements.push({

                    id:
                        docSnap.id,

                    name:
                        firstValue(
                            data.name,
                            data.nom,
                            data.nomEtablissement,
                            "Établissement"
                        ),

                    category:
                        firstValue(
                            data.category,
                            data.categorie
                        ),

                    phone:
                        firstValue(
                            data.phone,
                            data.telephone
                        ),

                    WhatsApp:
                        firstValue(
                            data.WhatsApp,
                            data.whatsapp
                        ),

                    email:
                        firstValue(
                            data.email
                        ),

                    logoURL:
                        firstValue(
                            data.logoURL,
                            data.photoURL
                        ),

                    ville:
                        firstValue(
                            data.ville,
                            data.city
                        ),

                    commune:
                        firstValue(
                            data.commune
                        ),

                    adresse:
                        firstValue(
                            data.adresse,
                            data.address
                        ),

                    description:
                        firstValue(
                            data.description
                        ),

                    active:
                        data.active !== false

                });

            }
        );


        console.log(
            `CAMU COMMERCE — ${etablissements.length} établissement(s) chargé(s).`
        );


        filterEtablissements();

    } catch (error) {

        console.error(
            "CAMU COMMERCE — erreur établissements :",
            error
        );


        const container =
            document.getElementById(
                "commerceBusinesses"
            );


        if (container) {

            container.innerHTML = `

                <div class="commerce-empty">

                    <i class="fa-solid fa-store-slash"></i>

                    <h3>
                        Établissements indisponibles
                    </h3>

                    <p>
                        Impossible de charger
                        les établissements.
                    </p>

                </div>

            `;

        }

    }

}


// ============================================================
// 17. FILTRER LES ÉTABLISSEMENTS
// ============================================================

function filterEtablissements() {

    const villeSelect =
        document.getElementById(
            "businessVille"
        );


    const communeInput =
        document.getElementById(
            "businessCommune"
        );


    const villeId =
        villeSelect?.value || "";


    const commune =
        normalize(
            communeInput?.value
        );


    const selectedVille =
        villes.find(
            ville =>
                String(ville.id) ===
                String(villeId)
        );


    const villeName =
        normalize(
            selectedVille?.name
        );


    const filtered =
        etablissements.filter(
            etablissement => {

                if (villeId) {

                    const businessVille =
                        normalize(
                            etablissement.ville
                        );


                    if (
                        businessVille !==
                        villeName
                    ) {
                        return false;
                    }

                }


                if (commune) {

                    const businessCommune =
                        normalize(
                            etablissement.commune
                        );


                    if (
                        !businessCommune.includes(
                            commune
                        )
                    ) {
                        return false;
                    }

                }


                return true;

            }
        );


    renderEtablissements(
        filtered
    );

}


// ============================================================
// 18. CARTE ÉTABLISSEMENT
// ============================================================

function createBusinessCard(
    business
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "commerce-business-card";


    const logo =
        business.logoURL ||
        "assets/logo/camu-services-logo.png";


    const location =
        [
            business.commune,
            business.ville
        ]
            .filter(Boolean)
            .join(", ");


    const phone =
        business.WhatsApp ||
        business.phone ||
        "";


    const email =
        String(
            business.email || ""
        ).trim();


    let actions = "";


    if (phone) {

        const cleanPhone =
            String(phone)
                .replace(
                    /[^\d]/g,
                    ""
                );


        if (cleanPhone) {

            const message =
                encodeURIComponent(
                    `Bonjour ${business.name}, je vous contacte via CAMU SERVICES concernant vos produits.`
                );


            actions += `

                <a
                    href="https://wa.me/${cleanPhone}?text=${message}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="commerce-business-whatsapp"
                >

                    <i class="fa-brands fa-whatsapp"></i>

                    WhatsApp

                </a>

            `;

        }

    }


    if (email) {

        actions += `

            <a
                href="mailto:${encodeURIComponent(
                    email
                )}"
                class="commerce-business-email"
            >

                <i class="fa-solid fa-envelope"></i>

                E-mail

            </a>

        `;

    }


    card.innerHTML = `

        <div class="commerce-business-top">

            <img
                src="${escapeHtml(
                    logo
                )}"
                alt="${escapeHtml(
                    business.name
                )}"
                class="commerce-business-logo"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >


            <div>

                <h3 class="commerce-business-name">
                    ${escapeHtml(
                        business.name
                    )}
                </h3>


                ${
                    business.category
                        ? `
                            <div class="commerce-business-category">

                                <i class="fa-solid fa-tag"></i>

                                ${escapeHtml(
                                    business.category
                                )}

                            </div>
                        `
                        : ""
                }


                ${
                    location
                        ? `
                            <div class="commerce-business-location">

                                <i class="fa-solid fa-location-dot"></i>

                                ${escapeHtml(
                                    location
                                )}

                            </div>
                        `
                        : ""
                }

            </div>

        </div>


        ${
            business.description
                ? `
                    <p class="commerce-business-description">

                        ${escapeHtml(
                            business.description
                        )}

                    </p>
                `
                : ""
        }


        ${
            business.adresse
                ? `
                    <div class="commerce-business-location">

                        <i class="fa-solid fa-map-location-dot"></i>

                        ${escapeHtml(
                            business.adresse
                        )}

                    </div>
                `
                : ""
        }


        <div class="commerce-business-actions">

            ${actions}

        </div>

    `;


    return card;
}


// ============================================================
// 19. AFFICHER LES ÉTABLISSEMENTS
// ============================================================

function renderEtablissements(
    items
) {

    const container =
        document.getElementById(
            "commerceBusinesses"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="commerce-empty">

                <i class="fa-solid fa-store"></i>

                <h3>
                    Aucun établissement trouvé
                </h3>

                <p>
                    Aucun établissement ne correspond
                    à cette localisation.
                </p>

            </div>

        `;

        return;
    }


    items.forEach(
        business => {

            container.appendChild(
                createBusinessCard(
                    business
                )
            );

        }
    );

}


// ============================================================
// 20. ÉVÉNEMENTS
// ============================================================

function setupEvents() {

    const keyword =
        document.getElementById(
            "commerceKeyword"
        );


    const category =
        document.getElementById(
            "commerceCategory"
        );


    const ville =
        document.getElementById(
            "commerceVille"
        );


    const commune =
        document.getElementById(
            "commerceCommune"
        );


    const searchButton =
        document.getElementById(
            "commerceSearchButton"
        );


    keyword?.addEventListener(
        "input",
        filterProduits
    );


    category?.addEventListener(
        "change",
        filterProduits
    );


    ville?.addEventListener(
        "change",
        filterProduits
    );


    commune?.addEventListener(
        "input",
        filterProduits
    );


    searchButton?.addEventListener(
        "click",
        () => {

            filterProduits();


            document
                .getElementById(
                    "produits"
                )
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


    const businessVille =
        document.getElementById(
            "businessVille"
        );


    const businessCommune =
        document.getElementById(
            "businessCommune"
        );


    businessVille?.addEventListener(
        "change",
        filterEtablissements
    );


    businessCommune?.addEventListener(
        "input",
        filterEtablissements
    );

}


// ============================================================
// 21. NAVIGATION
// ============================================================

function setupSmoothNavigation() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

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

            }
        );

}


// ============================================================
// 22. ANNÉE
// ============================================================

function setCurrentYear() {

    const year =
        document.getElementById(
            "commerceYear"
        );


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


// ============================================================
// 23. INITIALISATION
// ============================================================

async function initCommerce() {

    console.log(
        "=========================================="
    );


    console.log(
        "CAMU COMMERCE — initialisation..."
    );


    console.log(
        "Firebase SDK : 10.12.2"
    );


    try {

        setupMobileMenu();

        setupEvents();

        setupSmoothNavigation();

        setCurrentYear();


        // --------------------------------------------
        // Les catégories doivent être chargées avant
        // les annonces.
        // --------------------------------------------

        await loadCategories();


        await loadVilles();


        await Promise.all([

            loadProduits(),

            loadEtablissements()

        ]);


        console.log(
            "CAMU COMMERCE — initialisation terminée."
        );

    } catch (error) {

        console.error(
            "CAMU COMMERCE — erreur initialisation :",
            error
        );

    }

}


// ============================================================
// 24. LANCEMENT
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initCommerce
    );

} else {

    initCommerce();

}

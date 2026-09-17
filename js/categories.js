/* =========================================================
   CAMU SERVICES — CATÉGORIES
========================================================= */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const categoriesGrid =
    document.getElementById(
        "categoriesGrid"
    );

const categoriesLoading =
    document.getElementById(
        "categoriesLoading"
    );

const categoriesEmpty =
    document.getElementById(
        "categoriesEmpty"
    );

const categoriesError =
    document.getElementById(
        "categoriesError"
    );

const categoriesCount =
    document.getElementById(
        "categoriesCount"
    );

const categoriesRetry =
    document.getElementById(
        "categoriesRetry"
    );

const categoriesYear =
    document.getElementById(
        "categoriesYear"
    );


/* =========================================================
   ANNÉE
========================================================= */

if (categoriesYear) {

    categoriesYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MENU MOBILE
========================================================= */

const categoriesMenuButton =
    document.getElementById(
        "categoriesMenuButton"
    );

const categoriesSidebar =
    document.getElementById(
        "categoriesSidebar"
    );

const categoriesOverlay =
    document.getElementById(
        "categoriesOverlay"
    );


if (categoriesMenuButton) {

    categoriesMenuButton.addEventListener(
        "click",
        () => {

            categoriesSidebar.classList.add(
                "open"
            );

            categoriesOverlay.classList.add(
                "open"
            );

        }
    );

}


if (categoriesOverlay) {

    categoriesOverlay.addEventListener(
        "click",
        closeMenu
    );

}


function closeMenu() {

    categoriesSidebar.classList.remove(
        "open"
    );

    categoriesOverlay.classList.remove(
        "open"
    );

}


/* =========================================================
   NORMALISATION
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
   ÉCHAPPEMENT HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value || ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


/* =========================================================
   CHARGEMENT
========================================================= */

async function loadCategories() {

    showState(
        "loading"
    );


    try {

        console.log(
            "CAMU CATÉGORIES — chargement..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        const categories = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                /* -----------------------------------------
                   CATÉGORIE INACTIVE
                ------------------------------------------ */

                if (
                    data.active === false
                ) {

                    return;

                }


                const name =
                    String(
                        data.name || ""
                    ).trim();


                if (!name) {

                    return;

                }


                categories.push({

                    id:
                        documentSnapshot.id,

                    name,

                    icon:
                        data.icon
                        ||
                        "fa-solid fa-layer-group",

                    description:
                        String(
                            data.description
                            ||
                            "Découvrez les annonces disponibles dans cette catégorie."
                        ).trim(),

                    order:
                        Number(
                            data.order
                        )
                        ||
                        999

                });

            }
        );


        /* -----------------------------------------
           TRI
        ------------------------------------------ */

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


                return a.name.localeCompare(
                    b.name,
                    "fr"
                );

            }
        );


        console.log(
            `CAMU CATÉGORIES — ${categories.length} catégorie(s) trouvée(s).`
        );


        if (
            categories.length === 0
        ) {

            showState(
                "empty"
            );

            return;

        }


        renderCategories(
            categories
        );


        categoriesCount.textContent =
            `${categories.length} catégorie${categories.length > 1 ? "s" : ""} disponible${categories.length > 1 ? "s" : ""}.`;


        showState(
            "success"
        );


    } catch (error) {

        console.error(
            "CAMU CATÉGORIES — erreur :",
            error
        );


        categoriesCount.textContent =
            "Erreur de chargement.";


        showState(
            "error"
        );

    }

}


/* =========================================================
   ROUTAGE
========================================================= */

function getCategoryLink(
    category
) {

    const name =
        normalizeText(
            category.name
        );


    /* -----------------------------------------
       IMMOBILIER
    ------------------------------------------ */

    if (
        name === "immobilier"
        ||
        name.includes("immobilier")
    ) {

        return "immobilier.html";

    }


    /* -----------------------------------------
       COMMERCE
    ------------------------------------------ */

    if (
        name === "commerce"
        ||
        name.includes("commerce")
    ) {

        return "commerce.html";

    }


    /* -----------------------------------------
       VÉHICULES
    ------------------------------------------ */

    if (
        name.includes("vehicule")
        ||
        name.includes("transport")
    ) {

        return "vehicules.html";

    }


    /* -----------------------------------------
       HÔTELS
    ------------------------------------------ */

    if (
        name.includes("hotel")
        ||
        name.includes("hebergement")
    ) {

        return "hotels.html";

    }


    /* -----------------------------------------
       AUTRES
    ------------------------------------------ */

    return (
        "recherche.html?category="
        +
        encodeURIComponent(
            category.id
        )
    );

}


/* =========================================================
   AFFICHAGE
========================================================= */

function renderCategories(
    categories
) {

    categoriesGrid.innerHTML = "";


    categories.forEach(
        category => {

            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "category-card";


            card.href =
                getCategoryLink(
                    category
                );


            const icon =
                String(
                    category.icon || ""
                ).trim();


            let iconHTML = `

                <i class="fa-solid fa-layer-group"></i>

            `;


            /*
             * Si icon est une classe Font Awesome :
             * fa-solid fa-house
             */

            if (
                icon.includes(
                    "fa-"
                )
            ) {

                iconHTML = `

                    <i class="${escapeHtml(
                        icon
                    )}"></i>

                `;

            }

            /*
             * Sinon on considère que c'est
             * éventuellement un emoji.
             */

            else if (
                icon
            ) {

                iconHTML = `

                    <span style="
                        font-size:28px;
                        line-height:1;
                    ">
                        ${escapeHtml(icon)}
                    </span>

                `;

            }


            card.innerHTML = `

                <span class="category-card-badge">
                    DISPONIBLE
                </span>


                <div>

                    <div class="category-card-icon">

                        ${iconHTML}

                    </div>


                    <div class="category-card-content">

                        <h3 class="category-card-title">

                            ${escapeHtml(
                                category.name
                            )}

                        </h3>


                        <p class="category-card-description">

                            ${escapeHtml(
                                category.description
                            )}

                        </p>

                    </div>

                </div>


                <div class="category-card-footer">

                    <span class="category-card-link">

                        Explorer

                    </span>


                    <span class="category-card-arrow">

                        <i class="fa-solid fa-arrow-right"></i>

                    </span>

                </div>

            `;


            categoriesGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ÉTATS
========================================================= */

function showState(
    state
) {

    categoriesLoading.classList.add(
        "hidden"
    );

    categoriesEmpty.classList.add(
        "hidden"
    );

    categoriesError.classList.add(
        "hidden"
    );


    if (
        state === "loading"
    ) {

        categoriesLoading.classList.remove(
            "hidden"
        );

        categoriesGrid.innerHTML = "";

        return;

    }


    if (
        state === "empty"
    ) {

        categoriesEmpty.classList.remove(
            "hidden"
        );

        categoriesGrid.innerHTML = "";

        return;

    }


    if (
        state === "error"
    ) {

        categoriesError.classList.remove(
            "hidden"
        );

        categoriesGrid.innerHTML = "";

        return;

    }

}


/* =========================================================
   RETRY
========================================================= */

if (categoriesRetry) {

    categoriesRetry.addEventListener(
        "click",
        loadCategories
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

loadCategories();

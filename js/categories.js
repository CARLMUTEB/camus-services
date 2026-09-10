/* =========================================================
   CAMU SERVICES
   PAGE CATÉGORIES
   Chargement dynamique depuis Firestore
========================================================= */

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ÉLÉMENTS
========================================================= */

const categorySearch =
    document.getElementById("categorySearch");

const categoriesGrid =
    document.getElementById("categoriesGrid");

const categoriesEmpty =
    document.getElementById("categoriesEmpty");

const categoriesCount =
    document.getElementById("categoriesCount");


/* =========================================================
   VARIABLES
========================================================= */

let categoryCards = [];
let allCategories = [];


/* =========================================================
   CHARGER LES CATÉGORIES DEPUIS FIRESTORE
========================================================= */

async function loadCategories() {

    if (!categoriesGrid) return;

    try {

        // État de chargement
        categoriesGrid.innerHTML = `
            <div class="category-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Chargement des catégories...</span>
            </div>
        `;

        /*
         * Collection Firestore :
         * categorie
         */
        const categoriesRef =
            collection(db, "categorie");


        /*
         * Récupérer uniquement
         * les catégories actives.
         */
        let snapshot;

        try {

            const q = query(
                categoriesRef,
                where("active", "==", true),
                orderBy("ordre", "asc")
            );

            snapshot = await getDocs(q);

        } catch (error) {

            /*
             * Si l'index Firestore manque,
             * on récupère quand même les catégories.
             */
            console.warn(
                "Tri/filtre Firestore indisponible. Chargement simple.",
                error
            );

            snapshot =
                await getDocs(categoriesRef);
        }


        allCategories = [];


        snapshot.forEach(documentSnapshot => {

            const data =
                documentSnapshot.data();


            /*
             * Si le premier chargement simple
             * contient des catégories inactives,
             * on les ignore ici.
             */
            if (
                data.active !== undefined &&
                data.active !== true
            ) {
                return;
            }


            allCategories.push({

                id: documentSnapshot.id,

                nom:
                    data.nom ||
                    data.name ||
                    "Catégorie",

                icone:
                    data.icone ||
                    data.icon ||
                    "fa-solid fa-folder",

                description:
                    data.description ||
                    "Découvrez les annonces de cette catégorie.",

                ordre:
                    Number(data.ordre || data.order || 999)

            });

        });


        /*
         * Trier côté navigateur
         * pour garantir l'ordre.
         */
        allCategories.sort(
            (a, b) => a.ordre - b.ordre
        );


        renderCategories(allCategories);

    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );


        categoriesGrid.innerHTML = `
            <div class="category-loading">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>
                    Impossible de charger les catégories.
                </span>
            </div>
        `;

        updateCategoryCount(0);

    }

}


/* =========================================================
   AFFICHER LES CATÉGORIES
========================================================= */

function renderCategories(categories) {

    if (!categoriesGrid) return;


    categoriesGrid.innerHTML = "";


    updateCategoryCount(
        categories.length
    );


    if (categories.length === 0) {

        if (categoriesEmpty) {
            categoriesEmpty.hidden = false;
        }

        return;
    }


    if (categoriesEmpty) {
        categoriesEmpty.hidden = true;
    }


    categories.forEach(category => {

        const card =
            document.createElement("article");


        card.className =
            "category-card";


        /*
         * Permet au système de recherche
         * de retrouver la catégorie.
         */
        card.dataset.category =
            category.nom;


        card.innerHTML = `

            <div class="category-icon">

                <i class="${escapeHTML(category.icone)}"></i>

            </div>

            <div class="category-content">

                <h3>
                    ${escapeHTML(category.nom)}
                </h3>

                <p>
                    ${escapeHTML(category.description)}
                </p>

            </div>

            <div class="category-arrow">

                <i class="fa-solid fa-arrow-right"></i>

            </div>

        `;


        /*
         * Clic sur la catégorie.
         */
        card.addEventListener(
            "click",
            () => {

                const url =
                    `recherche.html?category=${encodeURIComponent(category.nom)}`;

                window.location.href = url;

            }
        );


        categoriesGrid.appendChild(card);

    });


    /*
     * Mettre à jour la liste
     * des cartes après génération.
     */
    categoryCards =
        Array.from(
            categoriesGrid.querySelectorAll(
                ".category-card"
            )
        );

}


/* =========================================================
   RECHERCHE CATÉGORIE
========================================================= */

categorySearch?.addEventListener(
    "input",
    () => {

        const search =
            categorySearch.value
                .trim()
                .toLowerCase();


        let visibleCount = 0;


        categoryCards.forEach(card => {

            const category =
                card.dataset.category
                    ?.toLowerCase() || "";


            const text =
                card.textContent
                    .toLowerCase();


            const matches =
                !search ||
                category.includes(search) ||
                text.includes(search);


            card.style.display =
                matches ? "grid" : "none";


            if (matches) {
                visibleCount++;
            }

        });


        updateCategoryCount(
            visibleCount
        );


        if (categoriesEmpty) {

            categoriesEmpty.hidden =
                visibleCount !== 0;

        }

    }
);


/* =========================================================
   COMPTEUR
========================================================= */

function updateCategoryCount(count) {

    if (!categoriesCount) return;


    if (count === 1) {

        categoriesCount.textContent =
            "1 catégorie";

        return;

    }


    categoriesCount.textContent =
        `${count} catégories`;

}


/* =========================================================
   SÉCURISER LE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   MENU MOBILE
========================================================= */

const categoriesMenuBtn =
    document.getElementById(
        "categoriesMenuBtn"
    );

const categoriesSidebar =
    document.getElementById(
        "categoriesSidebar"
    );

const categoriesSidebarClose =
    document.getElementById(
        "categoriesSidebarClose"
    );

const categoriesOverlay =
    document.getElementById(
        "categoriesOverlay"
    );


categoriesMenuBtn?.addEventListener(
    "click",
    openCategoriesMenu
);


categoriesSidebarClose?.addEventListener(
    "click",
    closeCategoriesMenu
);


categoriesOverlay?.addEventListener(
    "click",
    closeCategoriesMenu
);


function openCategoriesMenu() {

    categoriesSidebar?.classList.add(
        "open"
    );


    if (categoriesOverlay) {

        categoriesOverlay.hidden =
            false;

    }


    document.body.classList.add(
        "categories-menu-open"
    );

}


function closeCategoriesMenu() {

    categoriesSidebar?.classList.remove(
        "open"
    );


    if (categoriesOverlay) {

        categoriesOverlay.hidden =
            true;

    }


    document.body.classList.remove(
        "categories-menu-open"
    );

}


/* =========================================================
   FERMER AVEC ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeCategoriesMenu();

        }

    }
);


/* =========================================================
   INITIALISATION
========================================================= */

loadCategories();

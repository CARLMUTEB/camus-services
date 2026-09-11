// ============================================================
// CAMU SERVICES — categories.js
// Gestion dynamique de la page Catégories
// ============================================================

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


// ============================================================
// ÉLÉMENTS HTML
// ============================================================

const categoriesGrid = document.getElementById("categoriesGrid");
const categoriesCount = document.getElementById("categoriesCount");
const categoriesEmpty = document.getElementById("categoriesEmpty");
const categorySearch = document.getElementById("categorySearch");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeSidebar = document.getElementById("closeSidebar");


// ============================================================
// VARIABLES
// ============================================================

let categories = [];


// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("CAMU SERVICES : categories.js chargé correctement.");

    setupMenu();
    setupSearch();
    loadCategories();

});


// ============================================================
// CHARGER LES CATÉGORIES DEPUIS FIRESTORE
// ============================================================

async function loadCategories() {

    try {

        showLoading();

        console.log("Chargement des catégories depuis Firestore...");

        const snapshot = await getDocs(
            collection(db, "categories")
        );

        categories = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            // On affiche uniquement les catégories actives
            if (data.active === true && data.name) {

                categories.push({
                    id: doc.id,
                    name: data.name,
                    icon: data.icon || "fa-solid fa-layer-group",
                    description: data.description || "",
                    order: Number(data.order) || 9999
                });

            }

        });

        // Trier par ordre
        categories.sort((a, b) => a.order - b.order);

        console.log(
            `${categories.length} catégorie(s) chargée(s).`
        );

        updateCategoriesCount();

        renderCategories(categories);

    } catch (error) {

        console.error(
            "Erreur lors du chargement des catégories :",
            error
        );

        showError();

    }

}


// ============================================================
// AFFICHER LES CATÉGORIES
// ============================================================

function renderCategories(list) {

    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = "";

    // Aucune catégorie
    if (!list || list.length === 0) {

        if (categoriesEmpty) {
            categoriesEmpty.style.display = "block";
        }

        return;

    }

    if (categoriesEmpty) {
        categoriesEmpty.style.display = "none";
    }


    list.forEach((category) => {

        const card = document.createElement("article");

        card.className = "category-card";

        card.dataset.categoryId = category.id;

        card.innerHTML = `
            <div class="category-icon">
                <i class="${escapeAttribute(category.icon)}"></i>
            </div>

            <div class="category-content">

                <h3>
                    ${escapeHTML(category.name)}
                </h3>

                ${
                    category.description
                        ? `
                            <p>
                                ${escapeHTML(category.description)}
                            </p>
                          `
                        : ""
                }

            </div>

            <div class="category-arrow">
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        `;


        // Cliquer sur une catégorie
        card.addEventListener("click", () => {

            const categoryName = encodeURIComponent(
                category.name
            );

            window.location.href =
                `recherche.html?category=${categoryName}`;

        });


        categoriesGrid.appendChild(card);

    });

}


// ============================================================
// RECHERCHE / FILTRE
// ============================================================

function setupSearch() {

    if (!categorySearch) return;

    categorySearch.addEventListener("input", () => {

        const search = categorySearch.value
            .trim()
            .toLowerCase();

        if (!search) {

            renderCategories(categories);

            return;

        }


        const filtered = categories.filter((category) => {

            const name =
                category.name.toLowerCase();

            const description =
                category.description.toLowerCase();

            return (
                name.includes(search) ||
                description.includes(search)
            );

        });


        renderCategories(filtered);

    });

}


// ============================================================
// COMPTEUR DE CATÉGORIES
// ============================================================

function updateCategoriesCount() {

    if (!categoriesCount) return;

    const total = categories.length;

    if (total === 0) {

        categoriesCount.textContent =
            "Aucune catégorie";

    } else if (total === 1) {

        categoriesCount.textContent =
            "1 catégorie";

    } else {

        categoriesCount.textContent =
            `${total} catégories`;

    }

}


// ============================================================
// ÉTAT DE CHARGEMENT
// ============================================================

function showLoading() {

    if (!categoriesGrid) return;

    if (categoriesEmpty) {
        categoriesEmpty.style.display = "none";
    }

    categoriesGrid.innerHTML = `
        <div class="categories-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Chargement des catégories...
            </span>

        </div>
    `;

}


// ============================================================
// AFFICHER UNE ERREUR
// ============================================================

function showError() {

    if (!categoriesGrid) return;

    if (categoriesEmpty) {
        categoriesEmpty.style.display = "none";
    }

    categoriesGrid.innerHTML = `
        <div class="categories-error">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Impossible de charger les catégories
            </h3>

            <p>
                Vérifiez votre connexion Internet
                puis rechargez la page.
            </p>

            <button
                type="button"
                id="retryCategories"
                class="btn-primary">
                <i class="fa-solid fa-rotate-right"></i>
                Réessayer
            </button>

        </div>
    `;


    const retryButton =
        document.getElementById("retryCategories");


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadCategories
        );

    }

}


// ============================================================
// MENU LATÉRAL
// ============================================================

function setupMenu() {

    if (!menuBtn || !sidebar) return;


    // Ouvrir
    menuBtn.addEventListener("click", () => {

        sidebar.classList.add("active");

        if (overlay) {
            overlay.classList.add("active");
        }

        document.body.classList.add("menu-open");

    });


    // Fermer avec le bouton
    if (closeSidebar) {

        closeSidebar.addEventListener("click", closeMenu);

    }


    // Fermer avec l'overlay
    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMenu
        );

    }


    // Fermer avec Échap
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeMenu();

        }

    });


    // Fermer après clic sur un lien
    const sidebarLinks =
        sidebar.querySelectorAll("a");


    sidebarLinks.forEach((link) => {

        link.addEventListener("click", () => {

            closeMenu();

        });

    });

}


// ============================================================
// FERMER LE MENU
// ============================================================

function closeMenu() {

    if (sidebar) {
        sidebar.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }

    document.body.classList.remove("menu-open");

}


// ============================================================
// SÉCURITÉ HTML
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// SÉCURITÉ POUR LES ATTRIBUTS
// ============================================================

function escapeAttribute(value) {

    return String(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

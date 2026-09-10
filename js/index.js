import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const citySelect = document.getElementById("citySelect");
const homeCategories = document.getElementById("homeCategories");
const homeSearchForm = document.getElementById("homeSearchForm");
const searchKeyword = document.getElementById("searchKeyword");


// ======================================================
// CHARGER LES VILLES
// ======================================================

async function loadCities() {

    if (!citySelect) return;

    try {

        const snapshot = await getDocs(
            collection(db, "villes")
        );

        const cities = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            if (data.active === true) {

                cities.push({
                    id: doc.id,
                    name: data.name || "",
                    province: data.province || "",
                    order: Number(data.order) || 999
                });

            }

        });

        // Tri par ordre
        cities.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.name.localeCompare(
                b.name,
                "fr",
                { sensitivity: "base" }
            );

        });


        // Garder "Toutes les villes"
        citySelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        cities.forEach((city) => {

            const option = document.createElement("option");

            option.value = city.id;
            option.textContent = city.name;

            citySelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Erreur lors du chargement des villes :",
            error
        );

        citySelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

    }

}


// ======================================================
// CHARGER LES CATEGORIES
// ======================================================

async function loadCategories() {

    if (!homeCategories) return;

    try {

        const snapshot = await getDocs(
            collection(db, "categories")
        );

        const categories = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            if (data.active === true) {

                categories.push({
                    id: doc.id,
                    name: data.name || "Catégorie",
                    icon: data.icon || "fa-solid fa-layer-group",
                    description:
                        data.description ||
                        "Découvrez nos annonces",
                    order: Number(data.order) || 999
                });

            }

        });


        // Tri
        categories.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.name.localeCompare(
                b.name,
                "fr",
                { sensitivity: "base" }
            );

        });


        // Nettoyage
        homeCategories.innerHTML = "";


        // Aucune catégorie
        if (categories.length === 0) {

            homeCategories.innerHTML = `
                <div class="category-empty">
                    <i class="fa-solid fa-layer-group"></i>
                    <p>Aucune catégorie disponible.</p>
                </div>
            `;

            return;
        }


        // Création des cartes
        categories.forEach((category) => {

            const card = document.createElement("a");

            card.className = "category-card";

            card.href =
                `recherche.html?category=${encodeURIComponent(category.id)}`;


            card.innerHTML = `
                <div class="category-icon">
                    <i class="${escapeAttribute(category.icon)}"></i>
                </div>

                <h3>
                    ${escapeHTML(category.name)}
                </h3>

                <p>
                    ${escapeHTML(category.description)}
                </p>
            `;


            homeCategories.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Erreur lors du chargement des catégories :",
            error
        );

        homeCategories.innerHTML = `
            <div class="category-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>
                    Impossible de charger les catégories.
                </p>
            </div>
        `;

    }

}


// ======================================================
// RECHERCHE DEPUIS L'ACCUEIL
// ======================================================

if (homeSearchForm) {

    homeSearchForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const keyword =
                searchKeyword?.value.trim() || "";

            const city =
                citySelect?.value || "";


            const params =
                new URLSearchParams();


            if (keyword) {
                params.set(
                    "q",
                    keyword
                );
            }


            if (city) {
                params.set(
                    "city",
                    city
                );
            }


            const query =
                params.toString();


            window.location.href =
                query
                    ? `recherche.html?${query}`
                    : "recherche.html";

        }
    );

}


// ======================================================
// SECURITE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return String(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await Promise.all([
            loadCities(),
            loadCategories()
        ]);

    }
);

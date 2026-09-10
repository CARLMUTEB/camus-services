// =========================================================
// CAMU SERVICES — ADMIN CATALOGUE
// Gestion des catégories et des villes
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// CONFIGURATION
// =========================================================

const ADMIN_EMAIL =
    "meschackmuteb@gmail.com";

const CATEGORIES_COLLECTION =
    "categories";

const CITIES_COLLECTION =
    "villes";


// =========================================================
// DONNÉES
// =========================================================

let categories = [];

let cities = [];


// =========================================================
// ÉLÉMENTS — GÉNÉRAUX
// =========================================================

const catalogueMessage =
    document.getElementById(
        "catalogueMessage"
    );

const catalogueRefreshButton =
    document.getElementById(
        "catalogueRefreshButton"
    );


// =========================================================
// ÉLÉMENTS — CATÉGORIES
// =========================================================

const categoriesList =
    document.getElementById(
        "categoriesList"
    );

const categoriesLoading =
    document.getElementById(
        "categoriesLoading"
    );

const categoriesEmpty =
    document.getElementById(
        "categoriesEmpty"
    );

const categoriesCount =
    document.getElementById(
        "categoriesCount"
    );

const categorySearch =
    document.getElementById(
        "categorySearch"
    );

const addCategoryButton =
    document.getElementById(
        "addCategoryButton"
    );


// =========================================================
// ÉLÉMENTS — VILLES
// =========================================================

const citiesList =
    document.getElementById(
        "citiesList"
    );

const citiesLoading =
    document.getElementById(
        "citiesLoading"
    );

const citiesEmpty =
    document.getElementById(
        "citiesEmpty"
    );

const citiesCount =
    document.getElementById(
        "citiesCount"
    );

const citySearch =
    document.getElementById(
        "citySearch"
    );

const addCityButton =
    document.getElementById(
        "addCityButton"
    );


// =========================================================
// STATISTIQUE ACTIVE
// =========================================================

const activeCount =
    document.getElementById(
        "activeCount"
    );


// =========================================================
// MODAL CATÉGORIE
// =========================================================

const categoryModal =
    document.getElementById(
        "categoryModal"
    );

const categoryModalTitle =
    document.getElementById(
        "categoryModalTitle"
    );

const categoryForm =
    document.getElementById(
        "categoryForm"
    );

const categoryId =
    document.getElementById(
        "categoryId"
    );

const categoryName =
    document.getElementById(
        "categoryName"
    );

const categoryIcon =
    document.getElementById(
        "categoryIcon"
    );

const categoryDescription =
    document.getElementById(
        "categoryDescription"
    );

const categoryOrder =
    document.getElementById(
        "categoryOrder"
    );

const categoryActive =
    document.getElementById(
        "categoryActive"
    );

const saveCategoryButton =
    document.getElementById(
        "saveCategoryButton"
    );


// =========================================================
// MODAL VILLE
// =========================================================

const cityModal =
    document.getElementById(
        "cityModal"
    );

const cityModalTitle =
    document.getElementById(
        "cityModalTitle"
    );

const cityForm =
    document.getElementById(
        "cityForm"
    );

const cityId =
    document.getElementById(
        "cityId"
    );

const cityName =
    document.getElementById(
        "cityName"
    );

const cityProvince =
    document.getElementById(
        "cityProvince"
    );

const cityOrder =
    document.getElementById(
        "cityOrder"
    );

const cityActive =
    document.getElementById(
        "cityActive"
    );

const saveCityButton =
    document.getElementById(
        "saveCityButton"
    );


// =========================================================
// OUTILS
// =========================================================

function normalize(value) {

    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();
}


function slugify(value) {

    return normalize(value)
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            "");
}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function showMessage(
    message,
    type = "success"
) {

    if (!catalogueMessage) {
        return;
    }

    catalogueMessage.textContent =
        message;

    catalogueMessage.className =
        `catalogue-message ${type}`;

    catalogueMessage.hidden =
        false;

    setTimeout(
        () => {

            catalogueMessage.hidden =
                true;

        },
        4000
    );
}


// =========================================================
// ADMIN
// =========================================================

function isAdmin(user) {

    return (
        user &&
        user.email &&
        user.email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    );

}


// =========================================================
// PROTECTION ADMIN
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;

        }


        if (!isAdmin(user)) {

            alert(
                "Accès réservé à l'administrateur."
            );

            window.location.href =
                "index.html";

            return;

        }


        console.log(
            "CAMU SERVICES — administrateur connecté."
        );


        await loadCatalogue();

    }
);


// =========================================================
// CHARGER TOUT LE CATALOGUE
// =========================================================

async function loadCatalogue() {

    await Promise.all([
        loadCategories(),
        loadCities()
    ]);

    updateStatistics();

}


// =========================================================
// CHARGER CATÉGORIES
// =========================================================

async function loadCategories() {

    if (categoriesLoading) {

        categoriesLoading.style.display =
            "flex";

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    CATEGORIES_COLLECTION
                )
            );


        categories =
            snapshot.docs.map(
                (item) => ({

                    id: item.id,

                    ...item.data()

                })
            );


        categories.sort(
            (a, b) => {

                const orderA =
                    Number(a.order || 0);

                const orderB =
                    Number(b.order || 0);

                if (
                    orderA !==
                    orderB
                ) {

                    return (
                        orderA -
                        orderB
                    );

                }

                return normalize(
                    a.name
                ).localeCompare(
                    normalize(b.name)
                );

            }
        );


        renderCategories();


    } catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );

        showMessage(
            "Impossible de charger les catégories.",
            "error"
        );

    } finally {

        if (categoriesLoading) {

            categoriesLoading.style.display =
                "none";

        }

    }

}


// =========================================================
// CHARGER VILLES
// =========================================================

async function loadCities() {

    if (citiesLoading) {

        citiesLoading.style.display =
            "flex";

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    CITIES_COLLECTION
                )
            );


        cities =
            snapshot.docs.map(
                (item) => ({

                    id: item.id,

                    ...item.data()

                })
            );


        cities.sort(
            (a, b) => {

                const orderA =
                    Number(a.order || 0);

                const orderB =
                    Number(b.order || 0);

                if (
                    orderA !==
                    orderB
                ) {

                    return (
                        orderA -
                        orderB
                    );

                }

                return normalize(
                    a.name
                ).localeCompare(
                    normalize(b.name)
                );

            }
        );


        renderCities();


    } catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );

        showMessage(
            "Impossible de charger les villes.",
            "error"
        );

    } finally {

        if (citiesLoading) {

            citiesLoading.style.display =
                "none";

        }

    }

}


// =========================================================
// AFFICHER CATÉGORIES
// =========================================================

function renderCategories() {

    if (!categoriesList) {
        return;
    }


    const search =
        normalize(
            categorySearch?.value
        );


    const filtered =
        categories.filter(
            (category) => {

                return (
                    !search ||
                    normalize(
                        category.name
                    ).includes(search) ||
                    normalize(
                        category.description
                    ).includes(search)
                );

            }
        );


    categoriesList.innerHTML =
        "";


    if (
        categoriesEmpty
    ) {

        categoriesEmpty.hidden =
            filtered.length !== 0;

    }


    filtered.forEach(
        (category) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "catalogue-item";


            const icon =
                category.icon ||
                "fa-solid fa-layer-group";


            item.innerHTML = `

                <div class="catalogue-item-icon">

                    <i class="${escapeHtml(icon)}"></i>

                </div>


                <div class="catalogue-item-info">

                    <strong>
                        ${escapeHtml(
                            category.name ||
                            "Sans nom"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            category.description ||
                            "Aucune description"
                        )}
                    </span>

                    <small>
                        Ordre :
                        ${Number(
                            category.order || 0
                        )}
                    </small>

                </div>


                <div class="catalogue-item-status">

                    <span class="${
                        category.active !== false
                            ? "status-active"
                            : "status-inactive"
                    }">

                        ${
                            category.active !== false
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>


                <div class="catalogue-item-actions">

                    <button
                        type="button"
                        class="catalogue-action edit-category"
                        data-id="${escapeHtml(
                            category.id
                        )}"
                        title="Modifier"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        type="button"
                        class="catalogue-action toggle-category"
                        data-id="${escapeHtml(
                            category.id
                        )}"
                        title="${
                            category.active !== false
                                ? "Désactiver"
                                : "Activer"
                        }"
                    >

                        <i class="fa-solid ${
                            category.active !== false
                                ? "fa-toggle-on"
                                : "fa-toggle-off"
                        }"></i>

                    </button>


                    <button
                        type="button"
                        class="catalogue-action danger delete-category"
                        data-id="${escapeHtml(
                            category.id
                        )}"
                        title="Supprimer"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            `;


            categoriesList.appendChild(
                item
            );

        }
    );

}


// =========================================================
// AFFICHER VILLES
// =========================================================

function renderCities() {

    if (!citiesList) {
        return;
    }


    const search =
        normalize(
            citySearch?.value
        );


    const filtered =
        cities.filter(
            (city) => {

                return (
                    !search ||
                    normalize(
                        city.name
                    ).includes(search) ||
                    normalize(
                        city.province
                    ).includes(search)
                );

            }
        );


    citiesList.innerHTML =
        "";


    if (citiesEmpty) {

        citiesEmpty.hidden =
            filtered.length !== 0;

    }


    filtered.forEach(
        (city) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "catalogue-item";


            item.innerHTML = `

                <div class="catalogue-item-icon city">

                    <i class="fa-solid fa-location-dot"></i>

                </div>


                <div class="catalogue-item-info">

                    <strong>
                        ${escapeHtml(
                            city.name ||
                            "Sans nom"
                        )}
                    </strong>

                    <span>

                        ${escapeHtml(
                            city.province ||
                            "Province non précisée"
                        )}

                    </span>

                    <small>
                        Ordre :
                        ${Number(
                            city.order || 0
                        )}
                    </small>

                </div>


                <div class="catalogue-item-status">

                    <span class="${
                        city.active !== false
                            ? "status-active"
                            : "status-inactive"
                    }">

                        ${
                            city.active !== false
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>


                <div class="catalogue-item-actions">

                    <button
                        type="button"
                        class="catalogue-action edit-city"
                        data-id="${escapeHtml(
                            city.id
                        )}"
                        title="Modifier"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        type="button"
                        class="catalogue-action toggle-city"
                        data-id="${escapeHtml(
                            city.id
                        )}"
                        title="${
                            city.active !== false
                                ? "Désactiver"
                                : "Activer"
                        }"
                    >

                        <i class="fa-solid ${
                            city.active !== false
                                ? "fa-toggle-on"
                                : "fa-toggle-off"
                        }"></i>

                    </button>


                    <button
                        type="button"
                        class="catalogue-action danger delete-city"
                        data-id="${escapeHtml(
                            city.id
                        )}"
                        title="Supprimer"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            `;


            citiesList.appendChild(
                item
            );

        }
    );

}


// =========================================================
// STATISTIQUES
// =========================================================

function updateStatistics() {

    if (categoriesCount) {

        categoriesCount.textContent =
            categories.length;

    }


    if (citiesCount) {

        citiesCount.textContent =
            cities.length;

    }


    const activeCategories =
        categories.filter(
            item =>
                item.active !== false
        ).length;


    const activeCities =
        cities.filter(
            item =>
                item.active !== false
        ).length;


    if (activeCount) {

        activeCount.textContent =
            activeCategories +
            activeCities;

    }

}


// =========================================================
// OUVRIR MODAL CATÉGORIE
// =========================================================

function openCategoryModal(
    category = null
) {

    if (!categoryModal) {
        return;
    }


    categoryForm.reset();


    categoryId.value =
        category?.id || "";


    categoryName.value =
        category?.name || "";


    categoryIcon.value =
        category?.icon ||
        "fa-solid fa-layer-group";


    categoryDescription.value =
        category?.description || "";


    categoryOrder.value =
        category?.order ??
        0;


    categoryActive.checked =
        category
            ? category.active !== false
            : true;


    categoryModalTitle.textContent =
        category
            ? "Modifier la catégorie"
            : "Ajouter une catégorie";


    saveCategoryButton.innerHTML =
        category
            ? `
                <i class="fa-solid fa-check"></i>
                Enregistrer
              `
            : `
                <i class="fa-solid fa-plus"></i>
                Ajouter
              `;


    categoryModal.hidden =
        false;

    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            categoryName.focus();

        },
        50
    );

}


// =========================================================
// FERMER MODAL CATÉGORIE
// =========================================================

function closeCategoryModal() {

    if (!categoryModal) {
        return;
    }

    categoryModal.hidden =
        true;

    document.body.classList.remove(
        "modal-open"
    );

}


// =========================================================
// OUVRIR MODAL VILLE
// =========================================================

function openCityModal(
    city = null
) {

    if (!cityModal) {
        return;
    }


    cityForm.reset();


    cityId.value =
        city?.id || "";


    cityName.value =
        city?.name || "";


    cityProvince.value =
        city?.province || "";


    cityOrder.value =
        city?.order ??
        0;


    cityActive.checked =
        city
            ? city.active !== false
            : true;


    cityModalTitle.textContent =
        city
            ? "Modifier la ville"
            : "Ajouter une ville";


    saveCityButton.innerHTML =
        city
            ? `
                <i class="fa-solid fa-check"></i>
                Enregistrer
              `
            : `
                <i class="fa-solid fa-plus"></i>
                Ajouter
              `;


    cityModal.hidden =
        false;

    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            cityName.focus();

        },
        50
    );

}


// =========================================================
// FERMER MODAL VILLE
// =========================================================

function closeCityModal() {

    if (!cityModal) {
        return;
    }

    cityModal.hidden =
        true;

    document.body.classList.remove(
        "modal-open"
    );

}


// =========================================================
// AJOUT / MODIFICATION CATÉGORIE
// =========================================================

categoryForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const id =
            categoryId.value.trim();

        const name =
            categoryName.value.trim();

        const icon =
            categoryIcon.value.trim() ||
            "fa-solid fa-layer-group";

        const description =
            categoryDescription.value.trim();

        const order =
            Number(
                categoryOrder.value || 0
            );

        const active =
            categoryActive.checked;


        if (!name) {

            showMessage(
                "Le nom de la catégorie est obligatoire.",
                "error"
            );

            return;

        }


        // Vérification doublon
        const duplicate =
            categories.find(
                (category) =>
                    normalize(
                        category.name
                    ) === normalize(name) &&
                    category.id !== id
            );


        if (duplicate) {

            showMessage(
                "Cette catégorie existe déjà.",
                "error"
            );

            return;

        }


        saveCategoryButton.disabled =
            true;


        try {

            const data = {

                name,

                slug:
                    slugify(name),

                icon,

                description,

                order,

                active,

                updatedAt:
                    serverTimestamp()

            };


            if (id) {

                await updateDoc(
                    doc(
                        db,
                        CATEGORIES_COLLECTION,
                        id
                    ),
                    data
                );


                showMessage(
                    "Catégorie modifiée avec succès."
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        CATEGORIES_COLLECTION
                    ),
                    {

                        ...data,

                        createdAt:
                            serverTimestamp()

                    }
                );


                showMessage(
                    "Catégorie ajoutée avec succès."
                );

            }


            closeCategoryModal();

            await loadCategories();

            updateStatistics();


        } catch (error) {

            console.error(
                "Erreur catégorie :",
                error
            );

            showMessage(
                "Impossible d'enregistrer la catégorie.",
                "error"
            );

        } finally {

            saveCategoryButton.disabled =
                false;

        }

    }
);


// =========================================================
// AJOUT / MODIFICATION VILLE
// =========================================================

cityForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const id =
            cityId.value.trim();

        const name =
            cityName.value.trim();

        const province =
            cityProvince.value.trim();

        const order =
            Number(
                cityOrder.value || 0
            );

        const active =
            cityActive.checked;


        if (!name) {

            showMessage(
                "Le nom de la ville est obligatoire.",
                "error"
            );

            return;

        }


        if (!province) {

            showMessage(
                "La province est obligatoire.",
                "error"
            );

            return;

        }


        // Vérification doublon
        const duplicate =
            cities.find(
                (city) =>
                    normalize(
                        city.name
                    ) === normalize(name) &&
                    city.id !== id
            );


        if (duplicate) {

            showMessage(
                "Cette ville existe déjà.",
                "error"
            );

            return;

        }


        saveCityButton.disabled =
            true;


        try {

            const data = {

                name,

                slug:
                    slugify(name),

                province,

                order,

                active,

                updatedAt:
                    serverTimestamp()

            };


            if (id) {

                await updateDoc(
                    doc(
                        db,
                        CITIES_COLLECTION,
                        id
                    ),
                    data
                );


                showMessage(
                    "Ville modifiée avec succès."
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        CITIES_COLLECTION
                    ),
                    {

                        ...data,

                        createdAt:
                            serverTimestamp()

                    }
                );


                showMessage(
                    "Ville ajoutée avec succès."
                );

            }


            closeCityModal();

            await loadCities();

            updateStatistics();


        } catch (error) {

            console.error(
                "Erreur ville :",
                error
            );

            showMessage(
                "Impossible d'enregistrer la ville.",
                "error"
            );

        } finally {

            saveCityButton.disabled =
                false;

        }

    }
);


// =========================================================
// ACTIONS CATÉGORIES
// =========================================================

categoriesList?.addEventListener(
    "click",
    async (event) => {

        const editButton =
            event.target.closest(
                ".edit-category"
            );

        const toggleButton =
            event.target.closest(
                ".toggle-category"
            );

        const deleteButton =
            event.target.closest(
                ".delete-category"
            );


        // MODIFIER
        if (editButton) {

            const category =
                categories.find(
                    item =>
                        item.id ===
                        editButton.dataset.id
                );


            if (category) {

                openCategoryModal(
                    category
                );

            }

            return;

        }


        // ACTIVER / DÉSACTIVER
        if (toggleButton) {

            await toggleCategory(
                toggleButton.dataset.id
            );

            return;

        }


        // SUPPRIMER
        if (deleteButton) {

            await deleteCategory(
                deleteButton.dataset.id
            );

        }

    }
);


// =========================================================
// ACTIONS VILLES
// =========================================================

citiesList?.addEventListener(
    "click",
    async (event) => {

        const editButton =
            event.target.closest(
                ".edit-city"
            );

        const toggleButton =
            event.target.closest(
                ".toggle-city"
            );

        const deleteButton =
            event.target.closest(
                ".delete-city"
            );


        // MODIFIER
        if (editButton) {

            const city =
                cities.find(
                    item =>
                        item.id ===
                        editButton.dataset.id
                );


            if (city) {

                openCityModal(
                    city
                );

            }

            return;

        }


        // ACTIVER / DÉSACTIVER
        if (toggleButton) {

            await toggleCity(
                toggleButton.dataset.id
            );

            return;

        }


        // SUPPRIMER
        if (deleteButton) {

            await deleteCity(
                deleteButton.dataset.id
            );

        }

    }
);


// =========================================================
// TOGGLE CATÉGORIE
// =========================================================

async function toggleCategory(
    id
) {

    const category =
        categories.find(
            item =>
                item.id === id
        );


    if (!category) {
        return;
    }


    const newStatus =
        category.active === false;


    try {

        await updateDoc(
            doc(
                db,
                CATEGORIES_COLLECTION,
                id
            ),
            {

                active:
                    newStatus,

                updatedAt:
                    serverTimestamp()

            }
        );


        showMessage(
            newStatus
                ? "Catégorie activée."
                : "Catégorie désactivée."
        );


        await loadCategories();

        updateStatistics();


    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de modifier le statut.",
            "error"
        );

    }

}


// =========================================================
// TOGGLE VILLE
// =========================================================

async function toggleCity(
    id
) {

    const city =
        cities.find(
            item =>
                item.id === id
        );


    if (!city) {
        return;
    }


    const newStatus =
        city.active === false;


    try {

        await updateDoc(
            doc(
                db,
                CITIES_COLLECTION,
                id
            ),
            {

                active:
                    newStatus,

                updatedAt:
                    serverTimestamp()

            }
        );


        showMessage(
            newStatus
                ? "Ville activée."
                : "Ville désactivée."
        );


        await loadCities();

        updateStatistics();


    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de modifier le statut.",
            "error"
        );

    }

}


// =========================================================
// SUPPRIMER CATÉGORIE
// =========================================================

async function deleteCategory(
    id
) {

    const category =
        categories.find(
            item =>
                item.id === id
        );


    if (!category) {
        return;
    }


    const confirmed =
        confirm(
            `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?\n\nCette action est irréversible.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                CATEGORIES_COLLECTION,
                id
            )
        );


        showMessage(
            "Catégorie supprimée."
        );


        await loadCategories();

        updateStatistics();


    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de supprimer la catégorie.",
            "error"
        );

    }

}


// =========================================================
// SUPPRIMER VILLE
// =========================================================

async function deleteCity(
    id
) {

    const city =
        cities.find(
            item =>
                item.id === id
        );


    if (!city) {
        return;
    }


    const confirmed =
        confirm(
            `Voulez-vous vraiment supprimer la ville "${city.name}" ?\n\nCette action est irréversible.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                CITIES_COLLECTION,
                id
            )
        );


        showMessage(
            "Ville supprimée."
        );


        await loadCities();

        updateStatistics();


    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de supprimer la ville.",
            "error"
        );

    }

}


// =========================================================
// RECHERCHE CATÉGORIE
// =========================================================

categorySearch?.addEventListener(
    "input",
    () => {

        renderCategories();

    }
);


// =========================================================
// RECHERCHE VILLE
// =========================================================

citySearch?.addEventListener(
    "input",
    () => {

        renderCities();

    }
);


// =========================================================
// BOUTONS AJOUT
// =========================================================

addCategoryButton?.addEventListener(
    "click",
    () => {

        openCategoryModal();

    }
);


addCityButton?.addEventListener(
    "click",
    () => {

        openCityModal();

    }
);


// =========================================================
// FERMETURE MODAL CATÉGORIE
// =========================================================

document.querySelectorAll(
    "[data-close-category-modal]"
).forEach(
    (element) => {

        element.addEventListener(
            "click",
            closeCategoryModal
        );

    }
);


// =========================================================
// FERMETURE MODAL VILLE
// =========================================================

document.querySelectorAll(
    "[data-close-city-modal]"
).forEach(
    (element) => {

        element.addEventListener(
            "click",
            closeCityModal
        );

    }
);


// =========================================================
// TOUCHE ESCAPE
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeCategoryModal();

            closeCityModal();

        }

    }
);


// =========================================================
// ACTUALISER
// =========================================================

catalogueRefreshButton?.addEventListener(
    "click",
    async () => {

        catalogueRefreshButton.disabled =
            true;

        try {

            await loadCatalogue();

            showMessage(
                "Catalogue actualisé."
            );

        } finally {

            catalogueRefreshButton.disabled =
                false;

        }

    }
);


// =========================================================
// MENU ADMIN MOBILE
// =========================================================

const adminMenuButton =
    document.getElementById(
        "adminMenuButton"
    );

const adminSidebar =
    document.getElementById(
        "adminSidebar"
    );

const adminCloseSidebar =
    document.getElementById(
        "adminCloseSidebar"
    );

const adminOverlay =
    document.getElementById(
        "adminOverlay"
    );


function openAdminSidebar() {

    adminSidebar?.classList.add(
        "active"
    );

    adminOverlay?.classList.add(
        "active"
    );

}


function closeAdminSidebarMenu() {

    adminSidebar?.classList.remove(
        "active"
    );

    adminOverlay?.classList.remove(
        "active"
    );

}


adminMenuButton?.addEventListener(
    "click",
    openAdminSidebar
);


adminCloseSidebar?.addEventListener(
    "click",
    closeAdminSidebarMenu
);


adminOverlay?.addEventListener(
    "click",
    closeAdminSidebarMenu
);


// =========================================================
// CONSOLE
// =========================================================

console.log(
    "CAMU SERVICES — admin-catalogue.js chargé."
);

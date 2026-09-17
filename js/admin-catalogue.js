import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   VARIABLES
========================================================= */

let categories = [];
let villes = [];

let filteredCategories = [];
let filteredVilles = [];


/* =========================================================
   ÉLÉMENTS
========================================================= */

const adminMessage =
    document.getElementById("adminMessage");

const categoriesList =
    document.getElementById("categoriesList");

const citiesList =
    document.getElementById("citiesList");

const categoriesLoading =
    document.getElementById("categoriesLoading");

const citiesLoading =
    document.getElementById("citiesLoading");

const categoriesEmpty =
    document.getElementById("categoriesEmpty");

const citiesEmpty =
    document.getElementById("citiesEmpty");

const categorySearch =
    document.getElementById("categorySearch");

const citySearch =
    document.getElementById("citySearch");

const categoryStatusFilter =
    document.getElementById("categoryStatusFilter");

const cityStatusFilter =
    document.getElementById("cityStatusFilter");

const cityProvinceFilter =
    document.getElementById("cityProvinceFilter");

const categoryModal =
    document.getElementById("categoryModal");

const cityModal =
    document.getElementById("cityModal");

const categoryForm =
    document.getElementById("categoryForm");

const cityForm =
    document.getElementById("cityForm");

const categoryModalTitle =
    document.getElementById("categoryModalTitle");

const cityModalTitle =
    document.getElementById("cityModalTitle");


/* =========================================================
   UTILITAIRES
========================================================= */

function clean(value) {
    return String(value ?? "").trim();
}


function normalize(value) {

    return clean(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function escapeHTML(value) {

    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!adminMessage) {
        return;
    }

    adminMessage.hidden = false;

    adminMessage.textContent =
        message;

    adminMessage.dataset.type =
        type;

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(() => {

            adminMessage.hidden =
                true;

        }, 4000);
}


/* =========================================================
   AUTH ADMIN
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;
        }


        const email =
            clean(user.email)
                .toLowerCase();


        if (
            email !==
            "meschackmuteb@gmail.com"
        ) {

            await signOut(auth);

            window.location.href =
                "connexion.html";

            return;
        }


        console.log(
            "CAMU CATALOGUE — administrateur connecté."
        );


        await loadCatalogue();

    }
);


/* =========================================================
   CHARGEMENT GLOBAL
========================================================= */

async function loadCatalogue() {

    await Promise.all([
        loadCategories(),
        loadVilles()
    ]);

    updateStatistics();

    populateProvinceFilter();

    applyCategoryFilters();

    applyCityFilters();

}


/* =========================================================
   CATÉGORIES
========================================================= */

async function loadCategories() {

    setLoading(
        categoriesLoading,
        true
    );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        categories =
            snapshot.docs.map(
                item => {

                    const data =
                        item.data();


                    return {

                        id:
                            item.id,

                        name:
                            clean(data.name),

                        icon:
                            clean(data.icon),

                        description:
                            clean(
                                data.description
                            ),

                        active:
                            data.active !== false,

                        order:
                            Number(
                                data.order
                            ) || 999

                    };

                }
            );


        categories.sort(
            (a, b) =>
                a.order - b.order ||
                a.name.localeCompare(
                    b.name,
                    "fr"
                )
        );


        console.log(
            `CAMU CATALOGUE — ${categories.length} catégorie(s).`
        );

    }

    catch (error) {

        console.error(
            "Erreur chargement catégories :",
            error
        );

        showMessage(
            "Impossible de charger les catégories.",
            "error"
        );

        categories = [];

    }

    finally {

        setLoading(
            categoriesLoading,
            false
        );

    }
}


/* =========================================================
   VILLES
========================================================= */

async function loadVilles() {

    setLoading(
        citiesLoading,
        true
    );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        villes =
            snapshot.docs.map(
                item => {

                    const data =
                        item.data();


                    return {

                        id:
                            item.id,

                        name:
                            clean(data.name),

                        province:
                            clean(
                                data.province
                            ),

                        active:
                            data.active !== false,

                        order:
                            Number(
                                data.order
                            ) || 999

                    };

                }
            );


        villes.sort(
            (a, b) =>
                a.order - b.order ||
                a.name.localeCompare(
                    b.name,
                    "fr"
                )
        );


        console.log(
            `CAMU CATALOGUE — ${villes.length} ville(s).`
        );

    }

    catch (error) {

        console.error(
            "Erreur chargement villes :",
            error
        );

        showMessage(
            "Impossible de charger les villes.",
            "error"
        );

        villes = [];

    }

    finally {

        setLoading(
            citiesLoading,
            false
        );

    }
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    element,
    state
) {

    if (element) {
        element.hidden = !state;
    }

}


/* =========================================================
   STATISTIQUES
========================================================= */

function updateStatistics() {

    setText(
        "catalogueCategoriesCount",
        categories.length
    );


    setText(
        "catalogueActiveCategoriesCount",
        categories.filter(
            item => item.active
        ).length
    );


    setText(
        "catalogueCitiesCount",
        villes.length
    );


    setText(
        "catalogueActiveCitiesCount",
        villes.filter(
            item => item.active
        ).length
    );
}


/* =========================================================
   PROVINCES
========================================================= */

function populateProvinceFilter() {

    if (!cityProvinceFilter) {
        return;
    }


    const current =
        cityProvinceFilter.value;


    const provinces = [
        ...new Set(
            villes
                .map(
                    ville =>
                        ville.province
                )
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "fr"
            )
    );


    cityProvinceFilter.innerHTML = `
        <option value="all">
            Toutes les provinces
        </option>
    `;


    provinces.forEach(
        province => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                province;

            option.textContent =
                province;

            cityProvinceFilter.appendChild(
                option
            );

        }
    );


    if (
        provinces.includes(current)
    ) {
        cityProvinceFilter.value =
            current;
    }
}


/* =========================================================
   FILTRES CATÉGORIES
========================================================= */

function applyCategoryFilters() {

    const search =
        normalize(
            categorySearch?.value
        );

    const status =
        categoryStatusFilter?.value ||
        "all";


    filteredCategories =
        categories.filter(
            category => {

                if (
                    search &&
                    !normalize(
                        [
                            category.name,
                            category.description
                        ].join(" ")
                    ).includes(search)
                ) {
                    return false;
                }


                if (
                    status === "active" &&
                    !category.active
                ) {
                    return false;
                }


                if (
                    status === "inactive" &&
                    category.active
                ) {
                    return false;
                }


                return true;

            }
        );


    renderCategories();
}


/* =========================================================
   FILTRES VILLES
========================================================= */

function applyCityFilters() {

    const search =
        normalize(
            citySearch?.value
        );

    const province =
        cityProvinceFilter?.value ||
        "all";

    const status =
        cityStatusFilter?.value ||
        "all";


    filteredVilles =
        villes.filter(
            ville => {

                if (
                    search &&
                    !normalize(
                        [
                            ville.name,
                            ville.province
                        ].join(" ")
                    ).includes(search)
                ) {
                    return false;
                }


                if (
                    province !== "all" &&
                    normalize(
                        ville.province
                    ) !== normalize(
                        province
                    )
                ) {
                    return false;
                }


                if (
                    status === "active" &&
                    !ville.active
                ) {
                    return false;
                }


                if (
                    status === "inactive" &&
                    ville.active
                ) {
                    return false;
                }


                return true;

            }
        );


    renderVilles();
}


/* =========================================================
   RENDU CATÉGORIES
========================================================= */

function renderCategories() {

    if (!categoriesList) {
        return;
    }


    categoriesList.innerHTML = "";


    if (
        categoriesEmpty
    ) {
        categoriesEmpty.hidden =
            filteredCategories.length > 0;
    }


    filteredCategories.forEach(
        category => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "catalogue-category-card";


            const icon =
                category.icon ||
                "fa-solid fa-layer-group";


            const iconHTML =
                icon.includes("fa-")
                    ? `
                        <i class="${escapeHTML(icon)}"></i>
                    `
                    : `
                        <span>
                            ${escapeHTML(icon)}
                        </span>
                    `;


            card.innerHTML = `

                <div class="catalogue-card-top">

                    <div class="catalogue-card-icon">
                        ${iconHTML}
                    </div>

                    <span
                        class="catalogue-card-status ${
                            category.active
                                ? "active"
                                : "inactive"
                        }"
                    >
                        ${
                            category.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </div>


                <h3 class="catalogue-card-title">
                    ${escapeHTML(
                        category.name ||
                        "Sans nom"
                    )}
                </h3>


                <p class="catalogue-card-description">
                    ${escapeHTML(
                        category.description ||
                        "Aucune description."
                    )}
                </p>


                <div class="catalogue-card-meta">

                    <span>
                        <i class="fa-solid fa-sort"></i>
                        Ordre :
                        ${category.order}
                    </span>

                    <span>
                        <i class="fa-solid fa-fingerprint"></i>
                        ${escapeHTML(
                            category.id
                        )}
                    </span>

                </div>


                <div class="catalogue-card-actions">

                    <button
                        type="button"
                        class="catalogue-card-action edit"
                        data-action="edit-category"
                        data-id="${escapeHTML(category.id)}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Modifier
                    </button>


                    <button
                        type="button"
                        class="catalogue-card-action toggle"
                        data-action="toggle-category"
                        data-id="${escapeHTML(category.id)}"
                    >
                        <i class="fa-solid ${
                            category.active
                                ? "fa-eye-slash"
                                : "fa-eye"
                        }"></i>

                        ${
                            category.active
                                ? "Désactiver"
                                : "Activer"
                        }
                    </button>


                    <button
                        type="button"
                        class="catalogue-card-action delete"
                        data-action="delete-category"
                        data-id="${escapeHTML(category.id)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Supprimer
                    </button>

                </div>

            `;


            categoriesList.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   RENDU VILLES
========================================================= */

function renderVilles() {

    if (!citiesList) {
        return;
    }


    citiesList.innerHTML = "";


    if (citiesEmpty) {

        citiesEmpty.hidden =
            filteredVilles.length > 0;

    }


    filteredVilles.forEach(
        ville => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "catalogue-city-card";


            card.innerHTML = `

                <div class="catalogue-card-top">

                    <div class="catalogue-card-icon">

                        <i class="fa-solid fa-city"></i>

                    </div>


                    <span
                        class="catalogue-card-status ${
                            ville.active
                                ? "active"
                                : "inactive"
                        }"
                    >
                        ${
                            ville.active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </div>


                <h3 class="catalogue-card-title">

                    ${escapeHTML(
                        ville.name ||
                        "Ville sans nom"
                    )}

                </h3>


                <span class="catalogue-city-province">

                    <i class="fa-solid fa-map"></i>

                    ${
                        escapeHTML(
                            ville.province ||
                            "Province non indiquée"
                        )
                    }

                </span>


                <div class="catalogue-card-meta">

                    <span>
                        <i class="fa-solid fa-sort"></i>
                        Ordre :
                        ${ville.order}
                    </span>

                </div>


                <div class="catalogue-card-actions">

                    <button
                        type="button"
                        class="catalogue-card-action edit"
                        data-action="edit-city"
                        data-id="${escapeHTML(ville.id)}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Modifier
                    </button>


                    <button
                        type="button"
                        class="catalogue-card-action toggle"
                        data-action="toggle-city"
                        data-id="${escapeHTML(ville.id)}"
                    >
                        <i class="fa-solid ${
                            ville.active
                                ? "fa-eye-slash"
                                : "fa-eye"
                        }"></i>

                        ${
                            ville.active
                                ? "Désactiver"
                                : "Activer"
                        }
                    </button>


                    <button
                        type="button"
                        class="catalogue-card-action delete"
                        data-action="delete-city"
                        data-id="${escapeHTML(ville.id)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Supprimer
                    </button>

                </div>

            `;


            citiesList.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   MODAL CATÉGORIE
========================================================= */

function openCategoryModal(
    category = null
) {

    if (!categoryForm) {
        return;
    }


    categoryForm.reset();


    document.getElementById(
        "categoryId"
    ).value =
        category?.id || "";


    document.getElementById(
        "categoryName"
    ).value =
        category?.name || "";


    document.getElementById(
        "categoryIcon"
    ).value =
        category?.icon || "";


    document.getElementById(
        "categoryDescription"
    ).value =
        category?.description || "";


    document.getElementById(
        "categoryOrder"
    ).value =
        category?.order ?? 0;


    document.getElementById(
        "categoryActive"
    ).value =
        category?.active === false
            ? "false"
            : "true";


    if (categoryModalTitle) {

        categoryModalTitle.textContent =
            category
                ? "Modifier la catégorie"
                : "Ajouter une catégorie";

    }


    categoryModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";
}


function closeCategoryModal() {

    if (categoryModal) {
        categoryModal.hidden =
            true;
    }

    document.body.style.overflow =
        "";
}


/* =========================================================
   MODAL VILLE
========================================================= */

function openCityModal(
    ville = null
) {

    if (!cityForm) {
        return;
    }


    cityForm.reset();


    document.getElementById(
        "cityId"
    ).value =
        ville?.id || "";


    document.getElementById(
        "cityName"
    ).value =
        ville?.name || "";


    document.getElementById(
        "cityProvince"
    ).value =
        ville?.province || "";


    document.getElementById(
        "cityOrder"
    ).value =
        ville?.order ?? 0;


    document.getElementById(
        "cityActive"
    ).value =
        ville?.active === false
            ? "false"
            : "true";


    if (cityModalTitle) {

        cityModalTitle.textContent =
            ville
                ? "Modifier la ville"
                : "Ajouter une ville";

    }


    cityModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";
}


function closeCityModal() {

    if (cityModal) {
        cityModal.hidden =
            true;
    }

    document.body.style.overflow =
        "";
}


/* =========================================================
   ENREGISTRER CATÉGORIE
========================================================= */

categoryForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            clean(
                document.getElementById(
                    "categoryId"
                ).value
            );


        const name =
            clean(
                document.getElementById(
                    "categoryName"
                ).value
            );


        const icon =
            clean(
                document.getElementById(
                    "categoryIcon"
                ).value
            );


        const description =
            clean(
                document.getElementById(
                    "categoryDescription"
                ).value
            );


        const order =
            Number(
                document.getElementById(
                    "categoryOrder"
                ).value
            ) || 0;


        const active =
            document.getElementById(
                "categoryActive"
            ).value === "true";


        if (!name) {

            showMessage(
                "Le nom de la catégorie est obligatoire.",
                "error"
            );

            return;
        }


        try {

            const data = {

                name,

                icon:
                    icon ||
                    "fa-solid fa-layer-group",

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
                        "categories",
                        id
                    ),
                    data
                );


                showMessage(
                    "Catégorie modifiée avec succès.",
                    "success"
                );

            }

            else {

                await addDoc(
                    collection(
                        db,
                        "categories"
                    ),
                    {
                        ...data,
                        createdAt:
                            serverTimestamp()
                    }
                );


                showMessage(
                    "Catégorie ajoutée avec succès.",
                    "success"
                );

            }


            closeCategoryModal();

            await loadCategories();

            updateStatistics();

            applyCategoryFilters();

        }

        catch (error) {

            console.error(
                "Erreur catégorie :",
                error
            );

            showMessage(
                "Impossible d'enregistrer la catégorie.",
                "error"
            );

        }

    }
);


/* =========================================================
   ENREGISTRER VILLE
========================================================= */

cityForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            clean(
                document.getElementById(
                    "cityId"
                ).value
            );


        const name =
            clean(
                document.getElementById(
                    "cityName"
                ).value
            );


        const province =
            clean(
                document.getElementById(
                    "cityProvince"
                ).value
            );


        const order =
            Number(
                document.getElementById(
                    "cityOrder"
                ).value
            ) || 0;


        const active =
            document.getElementById(
                "cityActive"
            ).value === "true";


        if (!name) {

            showMessage(
                "Le nom de la ville est obligatoire.",
                "error"
            );

            return;
        }


        try {

            const data = {

                name,

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
                        "villes",
                        id
                    ),
                    data
                );


                showMessage(
                    "Ville modifiée avec succès.",
                    "success"
                );

            }

            else {

                await addDoc(
                    collection(
                        db,
                        "villes"
                    ),
                    {
                        ...data,

                        createdAt:
                            serverTimestamp()
                    }
                );


                showMessage(
                    "Ville ajoutée avec succès.",
                    "success"
                );

            }


            closeCityModal();

            await loadVilles();

            updateStatistics();

            populateProvinceFilter();

            applyCityFilters();

        }

        catch (error) {

            console.error(
                "Erreur ville :",
                error
            );

            showMessage(
                "Impossible d'enregistrer la ville.",
                "error"
            );

        }

    }
);


/* =========================================================
   ACTIONS CATÉGORIES
========================================================= */

categoriesList?.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        const category =
            categories.find(
                item => item.id === id
            );


        if (!category) {
            return;
        }


        if (
            action ===
            "edit-category"
        ) {

            openCategoryModal(
                category
            );

            return;
        }


        if (
            action ===
            "toggle-category"
        ) {

            await toggleCategory(
                category
            );

            return;
        }


        if (
            action ===
            "delete-category"
        ) {

            await deleteCategory(
                category
            );

        }

    }
);


/* =========================================================
   ACTIONS VILLES
========================================================= */

citiesList?.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        const ville =
            villes.find(
                item => item.id === id
            );


        if (!ville) {
            return;
        }


        if (
            action ===
            "edit-city"
        ) {

            openCityModal(
                ville
            );

            return;
        }


        if (
            action ===
            "toggle-city"
        ) {

            await toggleVille(
                ville
            );

            return;
        }


        if (
            action ===
            "delete-city"
        ) {

            await deleteVille(
                ville
            );

        }

    }
);


/* =========================================================
   ACTIVER / DÉSACTIVER CATÉGORIE
========================================================= */

async function toggleCategory(
    category
) {

    const newStatus =
        !category.active;


    try {

        await updateDoc(
            doc(
                db,
                "categories",
                category.id
            ),
            {
                active:
                    newStatus,

                updatedAt:
                    serverTimestamp()
            }
        );


        category.active =
            newStatus;


        updateStatistics();

        applyCategoryFilters();


        showMessage(
            newStatus
                ? "Catégorie activée."
                : "Catégorie désactivée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de modifier la catégorie.",
            "error"
        );

    }
}


/* =========================================================
   ACTIVER / DÉSACTIVER VILLE
========================================================= */

async function toggleVille(
    ville
) {

    const newStatus =
        !ville.active;


    try {

        await updateDoc(
            doc(
                db,
                "villes",
                ville.id
            ),
            {
                active:
                    newStatus,

                updatedAt:
                    serverTimestamp()
            }
        );


        ville.active =
            newStatus;


        updateStatistics();

        applyCityFilters();


        showMessage(
            newStatus
                ? "Ville activée."
                : "Ville désactivée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de modifier la ville.",
            "error"
        );

    }
}


/* =========================================================
   SUPPRIMER CATÉGORIE
========================================================= */

async function deleteCategory(
    category
) {

    const confirmed =
        window.confirm(
            `Supprimer définitivement la catégorie "${category.name}" ?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "categories",
                category.id
            )
        );


        categories =
            categories.filter(
                item =>
                    item.id !==
                    category.id
            );


        updateStatistics();

        applyCategoryFilters();


        showMessage(
            "Catégorie supprimée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de supprimer la catégorie.",
            "error"
        );

    }
}


/* =========================================================
   SUPPRIMER VILLE
========================================================= */

async function deleteVille(
    ville
) {

    const confirmed =
        window.confirm(
            `Supprimer définitivement la ville "${ville.name}" ?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "villes",
                ville.id
            )
        );


        villes =
            villes.filter(
                item =>
                    item.id !==
                    ville.id
            );


        updateStatistics();

        populateProvinceFilter();

        applyCityFilters();


        showMessage(
            "Ville supprimée.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Impossible de supprimer la ville.",
            "error"
        );

    }
}


/* =========================================================
   BOUTONS AJOUT
========================================================= */

document.getElementById(
    "addCategoryButton"
)?.addEventListener(
    "click",
    () => openCategoryModal()
);


document.getElementById(
    "addCityButton"
)?.addEventListener(
    "click",
    () => openCityModal()
);


/* =========================================================
   RECHERCHE
========================================================= */

categorySearch?.addEventListener(
    "input",
    applyCategoryFilters
);


categoryStatusFilter?.addEventListener(
    "change",
    applyCategoryFilters
);


citySearch?.addEventListener(
    "input",
    applyCityFilters
);


cityProvinceFilter?.addEventListener(
    "change",
    applyCityFilters
);


cityStatusFilter?.addEventListener(
    "change",
    applyCityFilters
);


/* =========================================================
   ONGLETS
========================================================= */

document.querySelectorAll(
    ".catalogue-tab"
).forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.tab;


                document
                    .querySelectorAll(
                        ".catalogue-tab"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                tab.classList.add(
                    "active"
                );


                const categoriesPanel =
                    document.getElementById(
                        "categoriesPanel"
                    );

                const villesPanel =
                    document.getElementById(
                        "villesPanel"
                    );


                if (
                    target ===
                    "categories"
                ) {

                    categoriesPanel.hidden =
                        false;

                    villesPanel.hidden =
                        true;

                }

                else {

                    categoriesPanel.hidden =
                        true;

                    villesPanel.hidden =
                        false;

                }

            }
        );

    }
);


/* =========================================================
   FERMETURE MODALS
========================================================= */

document.querySelectorAll(
    "[data-close-category-modal]"
).forEach(
    element => {

        element.addEventListener(
            "click",
            closeCategoryModal
        );

    }
);


document.querySelectorAll(
    "[data-close-city-modal]"
).forEach(
    element => {

        element.addEventListener(
            "click",
            closeCityModal
        );

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeCategoryModal();

            closeCityModal();

        }

    }
);


/* =========================================================
   ACTUALISER
========================================================= */

document.getElementById(
    "catalogueRefreshButton"
)?.addEventListener(
    "click",
    async () => {

        await loadCatalogue();

        showMessage(
            "Catalogue actualisé.",
            "success"
        );

    }
);


/* =========================================================
   MENU MOBILE
========================================================= */

const adminMenuButton =
    document.getElementById(
        "adminMenuButton"
    );

const adminCloseSidebar =
    document.getElementById(
        "adminCloseSidebar"
    );

const adminSidebar =
    document.getElementById(
        "adminSidebar"
    );

const adminOverlay =
    document.getElementById(
        "adminOverlay"
    );


function openSidebar() {

    adminSidebar?.classList.add(
        "open"
    );

    adminOverlay?.classList.add(
        "active"
    );

    adminMenuButton?.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeSidebar() {

    adminSidebar?.classList.remove(
        "open"
    );

    adminOverlay?.classList.remove(
        "active"
    );

    adminMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );
}


adminMenuButton?.addEventListener(
    "click",
    openSidebar
);


adminCloseSidebar?.addEventListener(
    "click",
    closeSidebar
);


adminOverlay?.addEventListener(
    "click",
    closeSidebar
);


/* =========================================================
   DÉCONNEXION
========================================================= */

document.getElementById(
    "adminLogoutButton"
)?.addEventListener(
    "click",
    async () => {

        const confirmed =
            window.confirm(
                "Voulez-vous vous déconnecter ?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await signOut(auth);

            window.location.href =
                "connexion.html";

        }

        catch (error) {

            console.error(
                error
            );

            showMessage(
                "Impossible de vous déconnecter.",
                "error"
            );

        }

    }
);

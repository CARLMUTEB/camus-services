// =========================================================
// CAMU SERVICES — INDEX.JS
// Accueil
// - Annonces Firestore
// - Favoris
// - Catégories dynamiques
// - Villes dynamiques
// - Recherche
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS HTML
// =========================================================

const recentAds = document.getElementById("recentAds");
const citySelect = document.getElementById("citySelect");
const homeCategories = document.getElementById("homeCategories");
const homeSearchForm = document.getElementById("homeSearchForm");
const searchKeyword = document.getElementById("searchKeyword");


// =========================================================
// UTILISATEUR
// =========================================================

let currentUser = null;


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(auth, user => {

    currentUser = user;

    console.log(
        "INDEX — utilisateur :",
        user ? user.email : "non connecté"
    );

    if (currentUser) {
        restoreFavoriteButtons();
    }

});


// =========================================================
// ECHAPPER HTML
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// FORMAT PRIX
// =========================================================

function formatPrice(price, currency = "USD") {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Prix à discuter";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return escapeHtml(price);
    }

    const formatted = new Intl.NumberFormat(
        "fr-FR",
        {
            maximumFractionDigits: 0
        }
    ).format(number);

    if (
        currency === "USD" ||
        currency === "$"
    ) {
        return `${formatted} $`;
    }

    if (
        currency === "CDF" ||
        currency === "FC"
    ) {
        return `${formatted} FC`;
    }

    return `${formatted} ${escapeHtml(currency)}`;
}


// =========================================================
// IMAGE ANNONCE
// =========================================================

function getImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0 &&
        ad.images[0]
    ) {
        return ad.images[0];
    }

    if (ad.imageURL) {
        return ad.imageURL;
    }

    if (ad.imageUrl) {
        return ad.imageUrl;
    }

    if (ad.image) {
        return ad.image;
    }

    return "assets/logo/camu-services-logo.png";
}


// =========================================================
// CATEGORIE
// =========================================================

async function getCategoryName(categoryId) {

    if (!categoryId) {
        return "Autres";
    }

    try {

        const categoryRef = doc(
            db,
            "categories",
            categoryId
        );

        const snapshot = await getDoc(categoryRef);

        if (snapshot.exists()) {

            return (
                snapshot.data().name ||
                categoryId
            );

        }

    } catch (error) {

        console.warn(
            "Impossible de récupérer la catégorie :",
            categoryId,
            error
        );

    }

    return categoryId;
}


// =========================================================
// CHARGER LES VILLES
// =========================================================

async function loadCities() {

    if (!citySelect) {
        return;
    }

    try {

        const snapshot = await getDocs(
            collection(db, "villes")
        );

        const cities = [];

        snapshot.forEach(document => {

            const data = document.data();

            if (data.active === true) {

                cities.push({

                    id: document.id,

                    name: data.name || "",

                    province: data.province || "",

                    order:
                        Number(data.order) || 999

                });

            }

        });


        cities.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.name.localeCompare(
                b.name,
                "fr",
                {
                    sensitivity: "base"
                }
            );

        });


        citySelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        cities.forEach(city => {

            const option =
                document.createElement("option");

            option.value = city.id;

            option.textContent = city.name;

            citySelect.appendChild(option);

        });


        console.log(
            "INDEX — villes chargées :",
            cities.length
        );

    } catch (error) {

        console.error(
            "INDEX — erreur villes :",
            error
        );

        citySelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;

    }
}


// =========================================================
// CHARGER LES CATEGORIES
// =========================================================

async function loadCategories() {

    if (!homeCategories) {
        return;
    }

    try {

        const snapshot = await getDocs(
            collection(db, "categories")
        );

        const categories = [];

        snapshot.forEach(document => {

            const data = document.data();

            if (data.active === true) {

                categories.push({

                    id: document.id,

                    name:
                        data.name ||
                        "Catégorie",

                    icon:
                        data.icon ||
                        "fa-solid fa-layer-group",

                    description:
                        data.description ||
                        "Découvrez nos annonces",

                    order:
                        Number(data.order) || 999

                });

            }

        });


        categories.sort((a, b) => {

            if (a.order !== b.order) {
                return a.order - b.order;
            }

            return a.name.localeCompare(
                b.name,
                "fr",
                {
                    sensitivity: "base"
                }
            );

        });


        homeCategories.innerHTML = "";


        if (categories.length === 0) {

            homeCategories.innerHTML = `
                <div class="category-empty">

                    <i class="fa-solid fa-layer-group"></i>

                    <p>
                        Aucune catégorie disponible.
                    </p>

                </div>
            `;

            return;
        }


        categories.forEach(category => {

            const card =
                document.createElement("a");

            card.className = "category-card";

            card.href =
                `recherche.html?category=${encodeURIComponent(category.id)}`;


            card.innerHTML = `

                <div class="category-icon">

                    <i class="${escapeHtml(category.icon)}"></i>

                </div>


                <h3>
                    ${escapeHtml(category.name)}
                </h3>


                <p>
                    ${escapeHtml(category.description)}
                </p>

            `;


            homeCategories.appendChild(card);

        });


        console.log(
            "INDEX — catégories chargées :",
            categories.length
        );

    } catch (error) {

        console.error(
            "INDEX — erreur catégories :",
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


// =========================================================
// VERIFIER FAVORI
// =========================================================

async function checkFavorite(listingId) {

    if (
        !currentUser ||
        !listingId
    ) {
        return false;
    }

    try {

        const favoriteId =
            `${currentUser.uid}_${listingId}`;

        const favoriteRef =
            doc(
                db,
                "favorites",
                favoriteId
            );

        const snapshot =
            await getDoc(favoriteRef);

        return snapshot.exists();

    } catch (error) {

        console.error(
            "Erreur vérification favori :",
            error
        );

        return false;
    }
}


// =========================================================
// BOUTON FAVORI
// =========================================================

function updateFavoriteButton(
    button,
    isFavorite
) {

    if (!button) {
        return;
    }

    const icon =
        button.querySelector("i");

    if (!icon) {
        return;
    }

    if (isFavorite) {

        icon.className =
            "fa-solid fa-heart";

        button.classList.add("active");

        button.setAttribute(
            "aria-label",
            "Retirer des favoris"
        );

    } else {

        icon.className =
            "fa-regular fa-heart";

        button.classList.remove("active");

        button.setAttribute(
            "aria-label",
            "Ajouter aux favoris"
        );

    }
}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type = "info"
) {

    console.log(
        `[${type}]`,
        message
    );

}


// =========================================================
// AJOUTER / RETIRER FAVORI
// =========================================================

async function toggleFavorite(button) {

    if (!currentUser) {

        showMessage(
            "Connectez-vous pour ajouter une annonce aux favoris.",
            "info"
        );

        window.location.href =
            "connexion.html";

        return;
    }


    const listingId =
        button.dataset.listingId;

    if (!listingId) {
        return;
    }


    try {

        const favoriteId =
            `${currentUser.uid}_${listingId}`;

        const favoriteRef =
            doc(
                db,
                "favorites",
                favoriteId
            );

        const snapshot =
            await getDoc(favoriteRef);


        if (snapshot.exists()) {

            await deleteDoc(
                favoriteRef
            );

            updateFavoriteButton(
                button,
                false
            );

        } else {

            await setDoc(
                favoriteRef,
                {
                    userId:
                        currentUser.uid,

                    listingId:
                        listingId,

                    createdAt:
                        new Date()
                }
            );

            updateFavoriteButton(
                button,
                true
            );
        }

    } catch (error) {

        console.error(
            "Erreur favoris :",
            error
        );

        showMessage(
            "Impossible de modifier les favoris.",
            "error"
        );

    }
}


// =========================================================
// RESTAURER FAVORIS
// =========================================================

async function restoreFavoriteButtons() {

    if (!currentUser) {
        return;
    }

    const buttons =
        document.querySelectorAll(
            ".favorite-button"
        );

    for (const button of buttons) {

        const listingId =
            button.dataset.listingId;

        if (!listingId) {
            continue;
        }

        const isFavorite =
            await checkFavorite(listingId);

        updateFavoriteButton(
            button,
            isFavorite
        );
    }
}


// =========================================================
// CHARGER LES ANNONCES
// COLLECTION : annonces
// =========================================================

async function loadRecentAds() {

    if (!recentAds) {
        return;
    }

    try {

        recentAds.innerHTML = `
            <div class="loading-state">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Chargement des annonces...
                </span>

            </div>
        `;


        // =================================================
        // FIRESTORE
        // =================================================

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "annonces"
                )
            );


        // =================================================
        // TRANSFORMATION
        // =================================================

        const ads =
            snapshot.docs.map(document => ({

                id: document.id,

                ...document.data()

            }));


        // =================================================
        // FILTRER LES ANNONCES ACTIVES
        // =================================================

        const activeAds =
            ads.filter(ad => {

                if (
                    ad.status === undefined ||
                    ad.status === null ||
                    ad.status === ""
                ) {
                    return true;
                }

                return ad.status === "active";

            });


        // =================================================
        // TRI PAR DATE
        // =================================================

        activeAds.sort((a, b) => {

            const dateA =
                a.createdAt &&
                typeof a.createdAt.toMillis === "function"
                    ? a.createdAt.toMillis()
                    : 0;

            const dateB =
                b.createdAt &&
                typeof b.createdAt.toMillis === "function"
                    ? b.createdAt.toMillis()
                    : 0;

            return dateB - dateA;

        });


        // =================================================
        // 8 ANNONCES RECENTES
        // =================================================

        const recent =
            activeAds.slice(0, 8);


        console.log(
            "CAMU SERVICES — annonces trouvées :",
            activeAds.length
        );


        // =================================================
        // AUCUNE ANNONCE
        // =================================================

        if (recent.length === 0) {

            recentAds.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">

                        <i class="fa-solid fa-box-open"></i>

                    </div>

                    <h3>
                        Aucune annonce pour le moment
                    </h3>

                    <p>
                        Soyez le premier à publier
                        une annonce sur CAMU SERVICES.
                    </p>

                </div>
            `;

            return;
        }


        // =================================================
        // VIDER
        // =================================================

        recentAds.innerHTML = "";


        // =================================================
        // CREER LES CARTES
        // =================================================

        for (const ad of recent) {

            const image =
                getImage(ad);

            const title =
                ad.title ||
                "Annonce sans titre";

            const city =
                ad.city ||
                "Ville non précisée";

            const category =
                await getCategoryName(
                    ad.category
                );

            const price =
                formatPrice(
                    ad.price,
                    ad.currency || "USD"
                );


            const card =
                document.createElement("article");

            card.className =
                "ad-card";


            card.innerHTML = `

                <div class="ad-image">

                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(title)}"
                        loading="lazy"
                        onerror="this.src='assets/logo/camu-services-logo.png'"
                    >


                    <button
                        type="button"
                        class="favorite-button"
                        aria-label="Ajouter aux favoris"
                        data-listing-id="${escapeHtml(ad.id)}"
                    >
                        <i class="fa-regular fa-heart"></i>
                    </button>


                    <span class="ad-category">
                        ${escapeHtml(category)}
                    </span>

                </div>


                <div class="ad-content">

                    <h3 class="ad-title">
                        ${escapeHtml(title)}
                    </h3>


                    <div class="ad-location">

                        <i class="fa-solid fa-location-dot"></i>

                        <span>
                            ${escapeHtml(city)}
                        </span>

                    </div>


                    <div class="ad-price">
                        ${price}
                    </div>

                </div>

            `;


            // =================================================
            // OUVRIR ANNONCE
            // =================================================

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".favorite-button"
                        )
                    ) {
                        return;
                    }

                    window.location.href =
                        `explorer.html?id=${encodeURIComponent(ad.id)}`;

                }
            );


            // =================================================
            // FAVORI
            // =================================================

            const favoriteButton =
                card.querySelector(
                    ".favorite-button"
                );

            if (favoriteButton) {

                favoriteButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();

                        await toggleFavorite(
                            favoriteButton
                        );

                    }
                );

            }


            recentAds.appendChild(card);

        }


        // =================================================
        // FAVORIS
        // =================================================

        await restoreFavoriteButtons();


    } catch (error) {

        console.error(
            "CAMU SERVICES — erreur annonces :",
            error
        );

        recentAds.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>
                    Impossible de charger les annonces
                </h3>

                <p>
                    Une erreur est survenue
                    lors du chargement des annonces.
                </p>

            </div>
        `;

    }
}


// =========================================================
// RECHERCHE ACCUEIL
// =========================================================

if (homeSearchForm) {

    homeSearchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const keyword =
                searchKeyword
                    ? searchKeyword.value.trim()
                    : "";


            const city =
                citySelect
                    ? citySelect.value
                    : "";


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


// =========================================================
// INITIALISATION
// =========================================================

async function initHomePage() {

    console.log(
        "CAMU SERVICES — initialisation..."
    );


    await Promise.allSettled([

        loadCities(),

        loadCategories(),

        loadRecentAds()

    ]);


    console.log(
        "CAMU SERVICES — accueil chargé."
    );

}


// =========================================================
// LANCER
// =========================================================

initHomePage();

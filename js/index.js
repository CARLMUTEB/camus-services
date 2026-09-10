// =========================================================
// CAMU SERVICES — INDEX.JS
// Accueil :
// - Annonces
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

const recentAds =
    document.getElementById("recentAds");

const citySelect =
    document.getElementById("citySelect");

const homeCategories =
    document.getElementById("homeCategories");

const homeSearchForm =
    document.getElementById("homeSearchForm");

const searchKeyword =
    document.getElementById("searchKeyword");


// =========================================================
// UTILISATEUR CONNECTE
// =========================================================

let currentUser = null;


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(
    auth,
    user => {

        currentUser = user;

        console.log(
            "INDEX — utilisateur :",
            user
                ? user.email
                : "non connecté"
        );

    }
);


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

function formatPrice(
    price,
    currency = "USD"
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "Prix à discuter";

    }


    const number =
        Number(price);


    if (Number.isNaN(number)) {

        return escapeHtml(price);

    }


    const formatted =
        new Intl.NumberFormat(
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
// IMAGE D'UNE ANNONCE
// =========================================================

function getImage(ad) {

    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {

        return (
            ad.images[0] ||
            "logo.png"
        );

    }


    if (
        ad.imageURL
    ) {

        return ad.imageURL;

    }


    if (
        ad.imageUrl
    ) {

        return ad.imageUrl;

    }


    if (
        ad.image
    ) {

        return ad.image;

    }


    return "logo.png";
}


// =========================================================
// NOM DE CATEGORIE
// =========================================================

async function getCategoryName(
    categoryId
) {

    if (!categoryId) {

        return "Autres";

    }


    try {

        const categoryRef =
            doc(
                db,
                "categories",
                categoryId
            );


        const categorySnapshot =
            await getDoc(
                categoryRef
            );


        if (
            categorySnapshot.exists()
        ) {

            return (
                categorySnapshot.data().name ||
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


    // Si l'annonce contient déjà un nom
    return categoryId;
}


// =========================================================
// CHARGER LES VILLES
// =========================================================

async function loadCities() {

    if (!citySelect) {

        console.warn(
            "INDEX : #citySelect introuvable."
        );

        return;

    }


    try {

        console.log(
            "INDEX : chargement des villes..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "villes"
                )
            );


        const cities = [];


        snapshot.forEach(
            document => {

                const data =
                    document.data();


                // Seulement les villes actives
                if (
                    data.active === true
                ) {

                    cities.push({

                        id:
                            document.id,

                        name:
                            data.name ||
                            "",

                        province:
                            data.province ||
                            "",

                        order:
                            Number(data.order) ||
                            999

                    });

                }

            }
        );


        // Trier
        cities.sort(
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
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        // Réinitialiser
        citySelect.innerHTML = `
            <option value="">
                Toutes les villes
            </option>
        `;


        // Ajouter les villes
        cities.forEach(
            city => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    city.id;


                option.textContent =
                    city.name;


                citySelect.appendChild(
                    option
                );

            }
        );


        console.log(
            "INDEX : villes chargées :",
            cities.length
        );


    } catch (error) {

        console.error(
            "INDEX : erreur chargement villes :",
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

        console.warn(
            "INDEX : #homeCategories introuvable."
        );

        return;

    }


    try {

        console.log(
            "INDEX : chargement des catégories..."
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
            document => {

                const data =
                    document.data();


                // Seulement les catégories actives
                if (
                    data.active === true
                ) {

                    categories.push({

                        id:
                            document.id,

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
                            Number(data.order) ||
                            999

                    });

                }

            }
        );


        // Trier
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
                    "fr",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        // Vider
        homeCategories.innerHTML = "";


        // Aucune catégorie
        if (
            categories.length === 0
        ) {

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


        // Créer les cartes
        categories.forEach(
            category => {

                const card =
                    document.createElement(
                        "a"
                    );


                card.className =
                    "category-card";


                card.href =
                    `recherche.html?category=${encodeURIComponent(category.id)}`;


                // Icône
                const icon =
                    document.createElement(
                        "div"
                    );


                icon.className =
                    "category-icon";


                const iconElement =
                    document.createElement(
                        "i"
                    );


                iconElement.className =
                    category.icon;


                icon.appendChild(
                    iconElement
                );


                // Nom
                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    category.name;


                // Description
                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    category.description;


                // Assemblage
                card.appendChild(
                    icon
                );

                card.appendChild(
                    title
                );

                card.appendChild(
                    description
                );


                homeCategories.appendChild(
                    card
                );

            }
        );


        console.log(
            "INDEX : catégories chargées :",
            categories.length
        );


    } catch (error) {

        console.error(
            "INDEX : erreur chargement catégories :",
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
// VERIFIER SI UNE ANNONCE EST FAVORITE
// =========================================================

async function checkFavorite(
    listingId
) {

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
            await getDoc(
                favoriteRef
            );


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
// METTRE A JOUR LE BOUTON FAVORI
// =========================================================

function updateFavoriteButton(
    button,
    isFavorite
) {

    if (!button) return;


    const icon =
        button.querySelector(
            "i"
        );


    if (!icon) return;


    if (isFavorite) {

        icon.className =
            "fa-solid fa-heart";


        button.classList.add(
            "active"
        );


        button.setAttribute(
            "aria-label",
            "Retirer des favoris"
        );

    } else {

        icon.className =
            "fa-regular fa-heart";


        button.classList.remove(
            "active"
        );


        button.setAttribute(
            "aria-label",
            "Ajouter aux favoris"
        );

    }
}


// =========================================================
// AFFICHER UN MESSAGE
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
// AJOUTER / RETIRER DES FAVORIS
// =========================================================

async function toggleFavorite(
    button
) {

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
            await getDoc(
                favoriteRef
            );


        if (
            snapshot.exists()
        ) {

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
            "Erreur Firestore favoris :",
            error
        );


        showMessage(
            "Impossible de modifier les favoris.",
            "error"
        );

    }
}


// =========================================================
// RESTAURER LES FAVORIS
// =========================================================

async function restoreFavoriteButtons() {

    if (!currentUser) {

        return;

    }


    const buttons =
        document.querySelectorAll(
            ".favorite-button"
        );


    for (
        const button
        of buttons
    ) {

        const listingId =
            button.dataset.listingId;


        if (!listingId) {

            continue;

        }


        const isFavorite =
            await checkFavorite(
                listingId
            );


        updateFavoriteButton(
            button,
            isFavorite
        );

    }
}


// =========================================================
// CHARGER LES ANNONCES
// =========================================================

async function loadRecentAds() {

    if (!recentAds) {

        console.warn(
            "CAMU SERVICES : #recentAds introuvable."
        );

        return;

    }


    try {

        // -------------------------------------------------
        // CHARGEMENT
        // -------------------------------------------------

        recentAds.innerHTML = `
            <div class="account-empty">

                <div class="account-empty-icon">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </div>

                <h3>
                    Chargement des annonces...
                </h3>

            </div>
        `;


        // -------------------------------------------------
        // RECUPERATION DES ANNONCES
        // -------------------------------------------------

        const annoncesRef =
            collection(
                db,
                "annonces"
            );


        const snapshot =
            await getDocs(
                annoncesRef
            );


        // -------------------------------------------------
        // TRANSFORMATION
        // -------------------------------------------------

        const ads =
            snapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        // -------------------------------------------------
        // TRI PAR DATE
        // -------------------------------------------------

        ads.sort(
            (a, b) => {

                const dateA =
                    a.createdAt &&
                    typeof a.createdAt.toMillis ===
                    "function"

                        ? a.createdAt.toMillis()

                        : 0;


                const dateB =
                    b.createdAt &&
                    typeof b.createdAt.toMillis ===
                    "function"

                        ? b.createdAt.toMillis()

                        : 0;


                return dateB - dateA;

            }
        );


        // -------------------------------------------------
        // 8 DERNIERES
        // -------------------------------------------------

        const recent =
            ads.slice(
                0,
                8
            );


        console.log(
            "CAMU SERVICES : annonces trouvées :",
            ads.length
        );


        // -------------------------------------------------
        // AUCUNE ANNONCE
        // -------------------------------------------------

        if (
            recent.length === 0
        ) {

            recentAds.innerHTML = `
                <div class="account-empty">

                    <div class="account-empty-icon">
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


        // -------------------------------------------------
        // VIDER
        // -------------------------------------------------

        recentAds.innerHTML = "";


        // -------------------------------------------------
        // CREER LES CARTES
        // -------------------------------------------------

        for (
            const ad
            of recent
        ) {

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
                    ad.currency ||
                    "USD"
                );


            // -------------------------------------------------
            // CARTE
            // -------------------------------------------------

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "ad-card";


            card.innerHTML = `
                <div class="ad-image">

                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(title)}"
                        loading="lazy"
                        onerror="this.src='logo.png'"
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

                    <h3>
                        ${escapeHtml(title)}
                    </h3>


                    <div class="ad-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHtml(city)}

                    </div>


                    <div class="ad-price">

                        ${price}

                    </div>

                </div>
            `;


            // -------------------------------------------------
            // CLIC SUR LA CARTE
            // -------------------------------------------------

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


            // -------------------------------------------------
            // BOUTON FAVORI
            // -------------------------------------------------

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


            // -------------------------------------------------
            // AJOUTER LA CARTE
            // -------------------------------------------------

            recentAds.appendChild(
                card
            );

        }


        // -------------------------------------------------
        // RESTAURER FAVORIS
        // -------------------------------------------------

        await restoreFavoriteButtons();


    } catch (error) {

        console.error(
            "CAMU SERVICES : erreur chargement annonces :",
            error
        );


        recentAds.innerHTML = `
            <div class="account-empty">

                <div class="account-empty-icon">

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
// RECHERCHE DEPUIS L'ACCUEIL
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
        "CAMU SERVICES — initialisation de l'accueil..."
    );


    // Les trois chargements sont indépendants.
    // Si les catégories ont un problème,
    // les annonces continuent quand même.

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

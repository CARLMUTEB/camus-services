/* =========================================================
   CAMU SERVICES — FAVORIS
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const FALLBACK_IMAGE =
    "assets/logo/camu-services-logo.png";


let currentUser = null;

let favorites = [];


/* =========================================================
   DOM
========================================================= */

const favoritesLoading =
    document.getElementById("favoritesLoading");

const favoritesEmpty =
    document.getElementById("favoritesEmpty");

const favoritesError =
    document.getElementById("favoritesError");

const favoritesGrid =
    document.getElementById("favoritesGrid");

const favoritesCount =
    document.getElementById("favoritesCount");

const favoritesPage =
    document.getElementById("favoritesPage");

const favoritesLogin =
    document.getElementById("favoritesLogin");

const errorMessage =
    document.getElementById("favoritesErrorMessage");


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "CAMU FAVORIS — initialisation..."
        );

        setupMobileMenu();

    }
);


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user || null;


        if (!currentUser) {

            showLoginState();

            return;

        }


        await loadFavorites();

    }
);


/* =========================================================
   CHARGER FAVORIS
========================================================= */

async function loadFavorites() {

    showLoading();


    try {

        const favoritesRef =
            collection(
                db,
                "favorites"
            );


        const snapshot =
            await getDocs(
                favoritesRef
            );


        favorites = [];


        /*
         * Nous récupérons uniquement
         * les favoris appartenant à
         * l'utilisateur connecté.
         */

        for (
            const favoriteDoc of snapshot.docs
        ) {

            const favorite =
                {
                    id:
                        favoriteDoc.id,

                    ...favoriteDoc.data()
                };


            if (
                favorite.userId !==
                currentUser.uid
            ) {

                continue;

            }


            /*
             * L'ID de l'annonce peut être
             * enregistré sous annonceId.
             */

            const annonceId =
                cleanValue(
                    favorite.annonceId ||
                    favorite.adId ||
                    favorite.listingId
                );


            if (!annonceId) {

                console.warn(
                    "CAMU FAVORIS — favori sans annonceId :",
                    favoriteDoc.id
                );

                continue;

            }


            /*
             * Charger l'annonce réelle.
             */

            try {

                const annonceRef =
                    doc(
                        db,
                        "annonces",
                        annonceId
                    );


                const annonceSnapshot =
                    await getDoc(
                        annonceRef
                    );


                if (
                    !annonceSnapshot.exists()
                ) {

                    /*
                     * L'annonce a été supprimée.
                     * On garde le favori pour le moment,
                     * mais on ne l'affiche pas.
                     */

                    console.warn(
                        "CAMU FAVORIS — annonce introuvable :",
                        annonceId
                    );

                    continue;

                }


                const annonce =
                    {
                        id:
                            annonceSnapshot.id,

                        ...annonceSnapshot.data()
                    };


                /*
                 * Ne pas afficher les annonces
                 * désactivées/supprimées.
                 */

                const status =
                    cleanValue(
                        annonce.status
                    ).toLowerCase();


                if (
                    status &&
                    ![
                        "active",
                        "approved"
                    ].includes(status)
                ) {

                    continue;

                }


                favorites.push({

                    favoriteId:
                        favoriteDoc.id,

                    annonceId,

                    annonce

                });


            } catch (error) {

                console.warn(
                    "CAMU FAVORIS — erreur annonce :",
                    annonceId,
                    error
                );

            }

        }


        console.log(
            `CAMU FAVORIS — ${favorites.length} favori(s) chargé(s).`
        );


        renderFavorites();


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur chargement :",
            error
        );


        showError(
            "Impossible de charger vos favoris. Vérifiez votre connexion puis réessayez."
        );

    }

}


/* =========================================================
   AFFICHER FAVORIS
========================================================= */

function renderFavorites() {

    hideAllStates();


    updateCount();


    if (
        !favorites.length
    ) {

        showEmpty();

        return;

    }


    if (!favoritesGrid) {

        console.error(
            "CAMU FAVORIS — #favoritesGrid introuvable dans favoris.html"
        );

        showError(
            "La zone d'affichage des favoris est introuvable."
        );

        return;

    }


    favoritesGrid.innerHTML =
        favorites
            .map(
                item =>
                    createFavoriteCard(
                        item
                    )
            )
            .join("");


    favoritesGrid
        .querySelectorAll(
            "[data-remove-favorite]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const favoriteId =
                            button.dataset
                                .favoriteId;


                        const annonceId =
                            button.dataset
                                .annonceId;


                        await removeFavorite(
                            favoriteId,
                            annonceId,
                            button
                        );

                    }
                );

            }
        );


    showGrid();

}


/* =========================================================
   CARTE FAVORI
========================================================= */

function createFavoriteCard(
    item
) {

    const ad =
        item.annonce;


    const title =
        cleanValue(
            ad.title ||
            "Annonce sans titre"
        );


    const category =
        cleanValue(
            ad.category ||
            ad.publicationType ||
            "Annonce"
        );


    const price =
        formatPrice(
            ad.price,
            ad.currency
        );


    const city =
        cleanValue(
            ad.city ||
            ad.ville
        );


    const commune =
        cleanValue(
            ad.commune
        );


    const location =
        [
            city,
            commune
        ]
        .filter(Boolean)
        .join(" • ") ||
        "Localisation non précisée";


    const image =
        getFirstImage(
            ad
        );


    const ownerName =
        cleanValue(
            ad.ownerName ||
            ad.sellerName ||
            "Vendeur"
        );


    return `

        <article
            class="favorite-card"
            data-annonce-id="${escapeHtml(item.annonceId)}"
        >


            <a
                href="explorer.html?id=${encodeURIComponent(item.annonceId)}"
                class="favorite-card-link"
            >


                <div class="favorite-image">

                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(title)}"
                        loading="lazy"
                    >


                    <span class="favorite-image-badge">

                        <i class="fa-solid fa-heart"></i>

                    </span>

                </div>


                <div class="favorite-content">


                    <span class="favorite-category">

                        ${escapeHtml(category)}

                    </span>


                    <h3 class="favorite-title">

                        ${escapeHtml(title)}

                    </h3>


                    <div class="favorite-price">

                        ${escapeHtml(price)}

                    </div>


                    <div class="favorite-location">

                        <i class="fa-solid fa-location-dot"></i>

                        <span>
                            ${escapeHtml(location)}
                        </span>

                    </div>


                    <div class="favorite-owner">

                        <i class="fa-solid fa-user"></i>

                        <span>
                            ${escapeHtml(ownerName)}
                        </span>

                    </div>

                </div>

            </a>


            <button
                type="button"
                class="favorite-remove"
                data-remove-favorite
                data-favorite-id="${escapeHtml(item.favoriteId)}"
                data-annonce-id="${escapeHtml(item.annonceId)}"
                title="Retirer des favoris"
                aria-label="Retirer des favoris"
            >

                <i class="fa-solid fa-heart"></i>

            </button>

        </article>

    `;

}


/* =========================================================
   RETIRER FAVORI
========================================================= */

async function removeFavorite(
    favoriteId,
    annonceId,
    button
) {

    if (!currentUser) {

        alert(
            "Vous devez être connecté."
        );

        return;

    }


    if (!favoriteId) {

        console.error(
            "CAMU FAVORIS — favoriteId manquant."
        );

        return;

    }


    try {

        if (button) {

            button.disabled =
                true;

            button.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i>`;

        }


        const favoriteRef =
            doc(
                db,
                "favorites",
                favoriteId
            );


        const favoriteSnapshot =
            await getDoc(
                favoriteRef
            );


        /*
         * Vérification de sécurité :
         * on ne supprime que le favori
         * de l'utilisateur connecté.
         */

        if (
            favoriteSnapshot.exists()
        ) {

            const data =
                favoriteSnapshot.data();


            if (
                data.userId !==
                currentUser.uid
            ) {

                throw new Error(
                    "Ce favori ne vous appartient pas."
                );

            }

        }


        await deleteDoc(
            favoriteRef
        );


        /*
         * Mettre à jour la liste
         * sans recharger toute la page.
         */

        favorites =
            favorites.filter(
                item =>
                    item.favoriteId !==
                    favoriteId
            );


        renderFavorites();


        console.log(
            "CAMU FAVORIS — favori supprimé :",
            annonceId
        );


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur suppression :",
            error
        );


        alert(
            "Impossible de retirer cette annonce de vos favoris."
        );


        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                `<i class="fa-solid fa-heart"></i>`;

        }

    }

}


/* =========================================================
   IMAGE
========================================================= */

function getFirstImage(
    ad
) {

    let images = [];


    if (
        Array.isArray(ad.images)
    ) {

        images =
            [...ad.images];

    }


    else if (
        typeof ad.images ===
        "string"
    ) {

        const value =
            ad.images.trim();


        if (value) {

            try {

                const parsed =
                    JSON.parse(value);


                if (
                    Array.isArray(parsed)
                ) {

                    images =
                        [...parsed];

                } else {

                    images = [
                        value
                    ];

                }

            } catch {

                images = [
                    value
                ];

            }

        }

    }


    const alternatives = [

        ...images,

        ad.imageURL,

        ad.imageUrl,

        ad.image,

        ad.photoURL,

        ad.photoUrl

    ];


    for (
        const value of alternatives
    ) {

        const image =
            cleanValue(value);


        if (
            isValidImageUrl(
                image
            )
        ) {

            return image;

        }

    }


    return FALLBACK_IMAGE;

}


/* =========================================================
   ÉTATS
========================================================= */

function hideAllStates() {

    /*
     * IMPORTANT :
     * Chaque élément est vérifié avant
     * d'utiliser classList.
     *
     * Cela corrige l'erreur :
     * Cannot read properties of null
     */

    favoritesLoading?.classList.add(
        "hidden"
    );


    favoritesEmpty?.classList.add(
        "hidden"
    );


    favoritesError?.classList.add(
        "hidden"
    );


    favoritesGrid?.classList.add(
        "hidden"
    );


    favoritesPage?.classList.remove(
        "show-login"
    );


    favoritesLogin?.classList.add(
        "hidden"
    );

}


function showLoading() {

    hideAllStates();


    favoritesLoading?.classList.remove(
        "hidden"
    );

}


function showGrid() {

    favoritesLoading?.classList.add(
        "hidden"
    );


    favoritesEmpty?.classList.add(
        "hidden"
    );


    favoritesError?.classList.add(
        "hidden"
    );


    favoritesLogin?.classList.add(
        "hidden"
    );


    favoritesGrid?.classList.remove(
        "hidden"
    );

}


function showEmpty() {

    hideAllStates();


    favoritesEmpty?.classList.remove(
        "hidden"
    );

}


function showError(
    message
) {

    hideAllStates();


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    favoritesError?.classList.remove(
        "hidden"
    );

}


function showLoginState() {

    hideAllStates();


    favoritesLogin?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateCount() {

    const count =
        favorites.length;


    if (!favoritesCount) {
        return;
    }


    favoritesCount.textContent =
        count === 1
            ? "1 annonce"
            : `${count} annonces`;

}


/* =========================================================
   FORMAT PRIX
========================================================= */

function formatPrice(
    price,
    currency
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "Prix sur demande";

    }


    const numericPrice =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(",", ".")
        );


    if (
        Number.isNaN(
            numericPrice
        )
    ) {

        return (
            cleanValue(price) ||
            "Prix sur demande"
        );

    }


    const formatted =
        new Intl.NumberFormat(
            "fr-FR",
            {
                maximumFractionDigits: 2
            }
        ).format(
            numericPrice
        );


    const currencyValue =
        cleanValue(currency);


    return currencyValue
        ? `${formatted} ${currencyValue}`
        : formatted;

}


/* =========================================================
   IMAGE VALIDE
========================================================= */

function isValidImageUrl(
    url
) {

    if (!url) {
        return false;
    }


    const value =
        cleanValue(url)
            .toLowerCase();


    if (
        [
            "url1",
            "url2",
            "url3",
            "image",
            "photo",
            "1",
            "logo/photo"
        ].includes(value)
    ) {

        return false;

    }


    return (

        value.startsWith(
            "https://"
        )

        ||

        value.startsWith(
            "http://"
        )

        ||

        value.startsWith(
            "assets/"
        )

        ||

        value.startsWith(
            "./"
        )

        ||

        value.startsWith(
            "/"
        )

    );

}


/* =========================================================
   MENU MOBILE
========================================================= */

function setupMobileMenu() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "mobileOverlay"
        );


    const menuButton =
        document.getElementById(
            "mobileMenuButton"
        );


    const closeButton =
        document.getElementById(
            "sidebarClose"
        );


    function openMenu() {

        sidebar?.classList.add(
            "open"
        );


        overlay?.classList.add(
            "show"
        );


        document.body.classList.add(
            "menu-open"
        );

    }


    function closeMenu() {

        sidebar?.classList.remove(
            "open"
        );


        overlay?.classList.remove(
            "show"
        );


        document.body.classList.remove(
            "menu-open"
        );

    }


    menuButton?.addEventListener(
        "click",
        openMenu
    );


    closeButton?.addEventListener(
        "click",
        closeMenu
    );


    overlay?.addEventListener(
        "click",
        closeMenu
    );


    document
        .querySelectorAll(
            ".sidebar-link"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            }
        );

}


/* =========================================================
   HELPERS
========================================================= */

function cleanValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).trim();

}


function escapeHtml(
    value
) {

    return String(value)

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

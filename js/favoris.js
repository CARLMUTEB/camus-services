/* ============================================================
   CAMU SERVICES — FAVORIS
   js/favoris.js
   ============================================================ */

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


/* ============================================================
   CONFIGURATION
   ============================================================ */

const FALLBACK_IMAGE =
    "assets/logo/camu-services-logo.png";

let currentUser = null;
let favorites = [];


/* ============================================================
   DOM
   ============================================================ */

const favoritesLoading =
    document.getElementById("favoritesLoading");

const favoritesEmpty =
    document.getElementById("favoritesEmpty");

const favoritesError =
    document.getElementById("favoritesError");

const favoritesErrorMessage =
    document.getElementById("favoritesErrorMessage");

const favoritesGrid =
    document.getElementById("favoritesGrid");

const favoritesCount =
    document.getElementById("favoritesCount");

const favoritesPage =
    document.getElementById("favoritesPage");

const favoritesLogin =
    document.getElementById("favoritesLogin");


/* ============================================================
   INITIALISATION
   ============================================================ */

console.log("CAMU FAVORIS — initialisation...");


onAuthStateChanged(auth, async (user) => {

    currentUser = user || null;

    if (!currentUser) {

        console.log(
            "CAMU FAVORIS — aucun utilisateur connecté."
        );

        showLoginState();

        return;
    }


    console.log(
        "CAMU FAVORIS — utilisateur connecté :",
        currentUser.uid
    );


    await loadFavorites();

});


/* ============================================================
   CHARGER LES FAVORIS
   ============================================================ */

async function loadFavorites() {

    showLoadingState();

    favorites = [];

    try {

        /*
         * On récupère tous les documents de favorites.
         * Ensuite on garde uniquement ceux de l'utilisateur connecté.
         */

        const snapshot =
            await getDocs(
                collection(db, "favorites")
            );


        console.log(
            "CAMU FAVORIS —",
            snapshot.size,
            "favori(s) trouvé(s) dans Firestore."
        );


        for (const favoriteDoc of snapshot.docs) {

            const favorite =
                favoriteDoc.data();


            /* =================================================
               VÉRIFIER L'UTILISATEUR
               ================================================= */

            if (
                !favorite.userId ||
                favorite.userId !== currentUser.uid
            ) {

                continue;
            }


            const annonceId =
                cleanValue(
                    favorite.annonceId
                );


            /* =================================================
               FAVORI SANS annonceId
               ================================================= */

            if (!annonceId) {

                console.warn(
                    "CAMU FAVORIS — favori sans annonceId :",
                    favoriteDoc.id
                );

                continue;
            }


            /* =================================================
               RÉCUPÉRER L'ANNONCE
               ================================================= */

            let annonce = null;


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
                    annonceSnapshot.exists()
                ) {

                    annonce = {

                        id:
                            annonceSnapshot.id,

                        ...annonceSnapshot.data()

                    };


                    console.log(
                        "CAMU FAVORIS — annonce récupérée :",
                        annonceId
                    );

                } else {

                    /*
                     * L'annonce n'existe plus.
                     *
                     * IMPORTANT :
                     * On ne supprime PAS le favori ici.
                     */

                    console.warn(
                        "CAMU FAVORIS — annonce introuvable :",
                        annonceId
                    );


                    /*
                     * On garde les informations présentes
                     * dans le document favorites.
                     */

                    annonce = {

                        id:
                            annonceId,

                        title:
                            favorite.title ||
                            "Annonce indisponible",

                        imageURL:
                            favorite.imageURL ||
                            "",

                        status:
                            "unavailable",

                        unavailable:
                            true

                    };

                }

            } catch (error) {

                console.error(
                    "CAMU FAVORIS — erreur récupération annonce :",
                    annonceId,
                    error
                );


                /*
                 * Même en cas d'erreur de lecture,
                 * on conserve le favori.
                 */

                annonce = {

                    id:
                        annonceId,

                    title:
                        favorite.title ||
                        "Annonce",

                    imageURL:
                        favorite.imageURL ||
                        "",

                    unavailable:
                        true

                };

            }


            /* =================================================
               AJOUTER LE FAVORI
               ================================================= */

            favorites.push({

                favoriteId:
                    favoriteDoc.id,

                annonceId:
                    annonceId,

                userId:
                    favorite.userId,

                favoriteTitle:
                    favorite.title || "",

                favoriteImageURL:
                    favorite.imageURL || "",

                createdAt:
                    favorite.createdAt || null,

                ...annonce

            });

        }


        renderFavorites();


        console.log(
            "CAMU FAVORIS —",
            favorites.length,
            "favori(s) chargé(s)."
        );


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur de chargement :",
            error
        );


        showErrorState(
            "Impossible de charger vos favoris. Vérifiez votre connexion puis réessayez."
        );

    }

}


/* ============================================================
   AFFICHER LES FAVORIS
   ============================================================ */

function renderFavorites() {

    hideAllStates();


    /* =========================================================
       COMPTEUR
       ========================================================= */

    if (favoritesCount) {

        favoritesCount.textContent =
            String(favorites.length);

    }


    /* =========================================================
       AUCUN FAVORI
       ========================================================= */

    if (favorites.length === 0) {

        favoritesEmpty?.classList.remove(
            "hidden"
        );

        return;
    }


    /* =========================================================
       GRILLE
       ========================================================= */

    if (!favoritesGrid) {

        console.warn(
            "CAMU FAVORIS — #favoritesGrid introuvable."
        );

        return;
    }


    favoritesGrid.innerHTML = "";


    favorites.forEach(
        favorite => {

            const card =
                createFavoriteCard(
                    favorite
                );


            favoritesGrid.appendChild(
                card
            );

        }
    );


    favoritesGrid.classList.remove(
        "hidden"
    );

}


/* ============================================================
   CRÉER UNE CARTE
   ============================================================ */

function createFavoriteCard(favorite) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "favorite-card";


    const annonceId =
        cleanValue(
            favorite.annonceId
        );


    const title =
        cleanValue(
            favorite.title ||
            favorite.favoriteTitle,
            "Annonce"
        );


    const category =
        cleanValue(
            favorite.category,
            "Annonce"
        );


    const city =
        cleanValue(
            favorite.city ||
            favorite.ville
        );


    const commune =
        cleanValue(
            favorite.commune
        );


    const location =
        [
            city,
            commune
        ]
        .filter(Boolean)
        .join(" • ");


    const price =
        formatPrice(
            favorite.price,
            favorite.currency
        );


    const image =
        getFavoriteImage(
            favorite
        );


    const unavailable =
        favorite.unavailable === true;


    article.innerHTML = `

        <div class="favorite-card-image">

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
            >

            <button
                type="button"
                class="favorite-remove"
                data-favorite-id="${escapeAttribute(
                    favorite.favoriteId
                )}"
                aria-label="Retirer des favoris"
                title="Retirer des favoris"
            >

                <i class="fa-solid fa-heart"></i>

            </button>

        </div>


        <div class="favorite-card-content">

            <div class="favorite-card-category">

                ${escapeHTML(category)}

            </div>


            <h3 class="favorite-card-title">

                ${escapeHTML(title)}

            </h3>


            ${
                unavailable
                    ? `
                        <div class="favorite-unavailable">

                            <i class="fa-solid fa-circle-exclamation"></i>

                            <span>
                                Cette annonce n'est plus disponible.
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                price && !unavailable
                    ? `
                        <div class="favorite-card-price">

                            ${escapeHTML(price)}

                        </div>
                    `
                    : ""
            }


            ${
                location && !unavailable
                    ? `
                        <div class="favorite-card-location">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>
                                ${escapeHTML(location)}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                favorite.ownerName && !unavailable
                    ? `
                        <div class="favorite-card-owner">

                            <i class="fa-solid fa-user"></i>

                            <span>
                                ${escapeHTML(
                                    cleanValue(
                                        favorite.ownerName,
                                        "Vendeur"
                                    )
                                )}
                            </span>

                        </div>
                    `
                    : ""
            }


            ${
                unavailable
                    ? `
                        <button
                            type="button"
                            class="favorite-view-button favorite-disabled-button"
                            disabled
                        >

                            <span>
                                Annonce indisponible
                            </span>

                        </button>
                    `
                    : `
                        <a
                            href="explorer.html?id=${encodeURIComponent(
                                annonceId
                            )}"
                            class="favorite-view-button"
                        >

                            <span>
                                Voir l'annonce
                            </span>

                            <i class="fa-solid fa-arrow-right"></i>

                        </a>
                    `
            }

        </div>

    `;


    /* =========================================================
       IMAGE ERROR
       ========================================================= */

    const imageElement =
        article.querySelector(
            ".favorite-card-image img"
        );


    imageElement?.addEventListener(
        "error",
        () => {

            imageElement.onerror = null;

            imageElement.src =
                FALLBACK_IMAGE;

        }
    );


    /* =========================================================
       BOUTON SUPPRIMER
       ========================================================= */

    const removeButton =
        article.querySelector(
            ".favorite-remove"
        );


    removeButton?.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            event.stopPropagation();


            const favoriteId =
                removeButton.dataset.favoriteId;


            await removeFavorite(
                favoriteId,
                article
            );

        }
    );


    return article;
}


/* ============================================================
   IMAGE DU FAVORI
   ============================================================ */

function getFavoriteImage(favorite) {

    const possibleImages = [];


    /* Image de l'annonce */

    if (
        Array.isArray(
            favorite.images
        )
    ) {

        possibleImages.push(
            ...favorite.images
        );

    }


    /* JSON images */

    else if (
        typeof favorite.images === "string" &&
        favorite.images.trim()
    ) {

        try {

            const parsed =
                JSON.parse(
                    favorite.images
                );


            if (
                Array.isArray(parsed)
            ) {

                possibleImages.push(
                    ...parsed
                );

            }

        } catch {

            possibleImages.push(
                favorite.images
            );

        }

    }


    /* Champs image annonce */

    possibleImages.push(
        favorite.imageURL,
        favorite.imageUrl,
        favorite.image,
        favorite.photoURL,
        favorite.photoUrl,
        favorite.photo
    );


    /* Image enregistrée au moment du favori */

    possibleImages.push(
        favorite.favoriteImageURL
    );


    for (
        const image of possibleImages
    ) {

        if (
            typeof image !== "string"
        ) {

            continue;
        }


        const clean =
            image.trim();


        if (!clean) {
            continue;
        }


        if (
            isFakeImageValue(clean)
        ) {

            continue;
        }


        if (
            isValidImageUrl(clean)
        ) {

            return clean;
        }

    }


    return FALLBACK_IMAGE;
}


/* ============================================================
   VÉRIFIER FAUSSE IMAGE
   ============================================================ */

function isFakeImageValue(value) {

    const clean =
        String(value)
            .trim()
            .toLowerCase();


    return [
        "url1",
        "url2",
        "url3",
        "image",
        "photo",
        "logo/photo",
        "1"
    ].includes(clean);

}


/* ============================================================
   URL IMAGE VALIDE
   ============================================================ */

function isValidImageUrl(url) {

    const value =
        cleanValue(url)
            .toLowerCase();


    if (!value) {
        return false;
    }


    return (
        value.startsWith("https://") ||
        value.startsWith("http://") ||
        value.startsWith("/") ||
        value.startsWith("./") ||
        value.startsWith("assets/")
    );

}


/* ============================================================
   SUPPRIMER UN FAVORI
   ============================================================ */

async function removeFavorite(
    favoriteId,
    cardElement
) {

    if (!currentUser) {

        console.warn(
            "CAMU FAVORIS — utilisateur non connecté."
        );

        return;
    }


    if (!favoriteId) {

        console.warn(
            "CAMU FAVORIS — favoriteId manquant."
        );

        return;
    }


    try {

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


        /* =====================================================
           DOCUMENT DÉJÀ SUPPRIMÉ
           ===================================================== */

        if (!snapshot.exists()) {

            favorites =
                favorites.filter(
                    favorite =>
                        favorite.favoriteId !==
                        favoriteId
                );


            cardElement?.remove();


            updateFavoritesCount();


            if (
                favorites.length === 0
            ) {

                showEmptyState();

            }


            return;
        }


        const favorite =
            snapshot.data();


        /* =====================================================
           VÉRIFICATION PROPRIÉTAIRE
           ===================================================== */

        if (
            favorite.userId !==
            currentUser.uid
        ) {

            console.warn(
                "CAMU FAVORIS — suppression refusée."
            );

            return;
        }


        /* =====================================================
           SUPPRESSION FIRESTORE
           ===================================================== */

        await deleteDoc(
            favoriteRef
        );


        /* =====================================================
           SUPPRESSION LOCALE
           ===================================================== */

        favorites =
            favorites.filter(
                item =>
                    item.favoriteId !==
                    favoriteId
            );


        cardElement?.remove();


        updateFavoritesCount();


        console.log(
            "CAMU FAVORIS — favori supprimé :",
            favoriteId
        );


        /* =====================================================
           PLUS AUCUN FAVORI
           ===================================================== */

        if (
            favorites.length === 0
        ) {

            showEmptyState();

        }


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur suppression :",
            error
        );


        alert(
            "Impossible de supprimer ce favori. Veuillez réessayer."
        );

    }

}


/* ============================================================
   COMPTEUR
   ============================================================ */

function updateFavoritesCount() {

    if (favoritesCount) {

        favoritesCount.textContent =
            String(favorites.length);

    }

}


/* ============================================================
   FORMAT PRIX
   ============================================================ */

function formatPrice(
    price,
    currency
) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {

        return "";

    }


    const numericPrice =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(/,/g, "")
        );


    if (
        Number.isNaN(
            numericPrice
        )
    ) {

        return cleanValue(price);

    }


    const formatted =
        new Intl.NumberFormat(
            "fr-FR"
        ).format(
            numericPrice
        );


    const currencyValue =
        cleanValue(
            currency
        );


    return currencyValue
        ? `${formatted} ${currencyValue}`
        : formatted;

}


/* ============================================================
   NETTOYAGE
   ============================================================ */

function cleanValue(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;

    }


    const result =
        String(value).trim();


    return result || fallback;

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ============================================================
   ESCAPE ATTRIBUT
   ============================================================ */

function escapeAttribute(value) {

    return escapeHTML(value);

}


/* ============================================================
   ÉTATS
   ============================================================ */

function hideAllStates() {

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

    favoritesLogin?.classList.add(
        "hidden"
    );

    favoritesPage?.classList.remove(
        "show-login"
    );

}


/* ============================================================
   CHARGEMENT
   ============================================================ */

function showLoadingState() {

    hideAllStates();


    favoritesLoading?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   VIDE
   ============================================================ */

function showEmptyState() {

    hideAllStates();


    favoritesEmpty?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   ERREUR
   ============================================================ */

function showErrorState(message) {

    hideAllStates();


    if (favoritesErrorMessage) {

        favoritesErrorMessage.textContent =
            message;

    }


    favoritesError?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   CONNEXION
   ============================================================ */

function showLoginState() {

    hideAllStates();


    favoritesPage?.classList.add(
        "show-login"
    );


    favoritesLogin?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   MENU MOBILE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const mobileMenuButton =
            document.getElementById(
                "mobileMenuButton"
            );


        const sidebar =
            document.getElementById(
                "sidebar"
            );


        const mobileOverlay =
            document.getElementById(
                "mobileOverlay"
            );


        const sidebarClose =
            document.querySelector(
                ".sidebar-close"
            );


        function openMobileMenu() {

            sidebar?.classList.add(
                "open"
            );


            mobileOverlay?.classList.add(
                "active"
            );


            document.body.classList.add(
                "menu-open"
            );

        }


        function closeMobileMenu() {

            sidebar?.classList.remove(
                "open"
            );


            mobileOverlay?.classList.remove(
                "active"
            );


            document.body.classList.remove(
                "menu-open"
            );

        }


        mobileMenuButton?.addEventListener(
            "click",
            openMobileMenu
        );


        sidebarClose?.addEventListener(
            "click",
            closeMobileMenu
        );


        mobileOverlay?.addEventListener(
            "click",
            closeMobileMenu
        );


        document
            .querySelectorAll(
                ".sidebar-link"
            )
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        closeMobileMenu
                    );

                }
            );

    }
);

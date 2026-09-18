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

        const favoritesSnapshot =
            await getDocs(
                collection(db, "favorites")
            );


        console.log(
            "CAMU FAVORIS —",
            favoritesSnapshot.size,
            "favori(s) trouvé(s) dans Firestore."
        );


        for (
            const favoriteDoc
            of favoritesSnapshot.docs
        ) {

            const favorite =
                favoriteDoc.data();


            /* =================================================
               VÉRIFIER LE PROPRIÉTAIRE
               ================================================= */

            if (
                !favorite.userId ||
                favorite.userId !== currentUser.uid
            ) {

                continue;

            }


            /* =================================================
               RÉCUPÉRER ANNONCE ID
               ================================================= */

            let annonceId =
                cleanValue(
                    favorite.annonceId
                );


            /*
             * Compatibilité avec les anciens favoris.
             *
             * Exemple de document :
             *
             * UID_IDANNONCE
             *
             * Exemple réel :
             *
             * VSXsgjCg1dSMKdLCbkaeXq8xHps2_rVgn90hLdHdKHMFqYwJF
             *
             * devient :
             *
             * UID    = VSXsgjCg1dSMKdLCbkaeXq8xHps2
             * annonce = rVgn90hLdHdKHMFqYwJF
             */

            if (!annonceId) {

                const documentId =
                    favoriteDoc.id;

                const prefix =
                    `${currentUser.uid}_`;


                if (
                    documentId.startsWith(prefix)
                ) {

                    annonceId =
                        documentId.substring(
                            prefix.length
                        );


                    console.log(
                        "CAMU FAVORIS — annonceId récupéré depuis l'ID du favori :",
                        annonceId
                    );

                }

            }


            /* =================================================
               TOUJOURS PAS D'ANNONCE ID
               ================================================= */

            if (!annonceId) {

                console.warn(
                    "CAMU FAVORIS — impossible de déterminer l'annonce :",
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


                /* =================================================
                   ANNONCE TROUVÉE
                   ================================================= */

                if (
                    annonceSnapshot.exists()
                ) {

                    annonce = {

                        id:
                            annonceSnapshot.id,

                        ...annonceSnapshot.data()

                    };


                    console.log(
                        "CAMU FAVORIS — annonce trouvée :",
                        annonceId
                    );

                }


                /* =================================================
                   ANNONCE INTROUVABLE
                   ================================================= */

                else {

                    console.warn(
                        "CAMU FAVORIS — annonce introuvable :",
                        annonceId
                    );


                    /*
                     * On conserve quand même le favori.
                     *
                     * Cela permet d'éviter de perdre
                     * les informations du favori.
                     */

                    annonce = {

                        id:
                            annonceId,

                        title:
                            cleanValue(
                                favorite.title,
                                "Annonce indisponible"
                            ),

                        imageURL:
                            cleanValue(
                                favorite.imageURL
                            ),

                        status:
                            "unavailable",

                        unavailable:
                            true

                    };

                }


            } catch (error) {

                console.error(
                    "CAMU FAVORIS — erreur lecture annonce :",
                    annonceId,
                    error
                );


                /*
                 * Conserver le favori même en cas
                 * d'erreur de lecture.
                 */

                annonce = {

                    id:
                        annonceId,

                    title:
                        cleanValue(
                            favorite.title,
                            "Annonce"
                        ),

                    imageURL:
                        cleanValue(
                            favorite.imageURL
                        ),

                    unavailable:
                        true

                };

            }


            /* =================================================
               AJOUTER À LA LISTE
               ================================================= */

            favorites.push({

                favoriteId:
                    favoriteDoc.id,

                userId:
                    currentUser.uid,

                annonceId:
                    annonceId,

                favoriteTitle:
                    cleanValue(
                        favorite.title
                    ),

                favoriteImageURL:
                    cleanValue(
                        favorite.imageURL
                    ),

                createdAt:
                    favorite.createdAt || null,

                ...annonce

            });

        }


        /* =====================================================
           AFFICHAGE
           ===================================================== */

        renderFavorites();


        console.log(
            "CAMU FAVORIS —",
            favorites.length,
            "favori(s) chargé(s)."
        );


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur générale :",
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

    if (
        favorites.length === 0
    ) {

        favoritesEmpty?.classList.remove(
            "hidden"
        );

        return;

    }


    /* =========================================================
       GRILLE ABSENTE
       ========================================================= */

    if (!favoritesGrid) {

        console.warn(
            "CAMU FAVORIS — élément #favoritesGrid introuvable."
        );

        return;

    }


    /* =========================================================
       VIDER LA GRILLE
       ========================================================= */

    favoritesGrid.innerHTML = "";


    /* =========================================================
       CRÉER LES CARTES
       ========================================================= */

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
   CRÉER UNE CARTE FAVORI
   ============================================================ */

function createFavoriteCard(
    favorite
) {

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
       IMAGE
       ========================================================= */

    const imageElement =
        article.querySelector(
            ".favorite-card-image img"
        );


    imageElement?.addEventListener(
        "error",
        () => {

            imageElement.onerror =
                null;

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
   IMAGE
   ============================================================ */

function getFavoriteImage(
    favorite
) {

    const possibleImages = [];


    /* =========================================================
       TABLEAU images
       ========================================================= */

    if (
        Array.isArray(
            favorite.images
        )
    ) {

        possibleImages.push(
            ...favorite.images
        );

    }


    /* =========================================================
       JSON images
       ========================================================= */

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

            } else {

                possibleImages.push(
                    favorite.images
                );

            }

        } catch {

            possibleImages.push(
                favorite.images
            );

        }

    }


    /* =========================================================
       AUTRES CHAMPS
       ========================================================= */

    possibleImages.push(

        favorite.imageURL,

        favorite.imageUrl,

        favorite.image,

        favorite.photoURL,

        favorite.photoUrl,

        favorite.photo,

        favorite.favoriteImageURL

    );


    /* =========================================================
       TROUVER UNE URL VALIDE
       ========================================================= */

    for (
        const image
        of possibleImages
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
            isFakeImageValue(
                clean
            )
        ) {

            continue;

        }


        if (
            isValidImageUrl(
                clean
            )
        ) {

            return clean;

        }

    }


    return FALLBACK_IMAGE;

}


/* ============================================================
   FAUSSE IMAGE
   ============================================================ */

function isFakeImageValue(
    value
) {

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

    ].includes(
        clean
    );

}


/* ============================================================
   URL IMAGE
   ============================================================ */

function isValidImageUrl(
    url
) {

    const value =
        cleanValue(
            url
        ).toLowerCase();


    if (!value) {

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
            "/"
        )

        ||

        value.startsWith(
            "./"
        )

        ||

        value.startsWith(
            "assets/"
        )

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
           DÉJÀ SUPPRIMÉ
           ===================================================== */

        if (
            !snapshot.exists()
        ) {

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
           VÉRIFIER PROPRIÉTAIRE
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
           SUPPRESSION
           ===================================================== */

        await deleteDoc(
            favoriteRef
        );


        /* =====================================================
           LISTE LOCALE
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
            String(
                favorites.length
            );

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

        return cleanValue(
            price
        );

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
   NETTOYAGE TEXTE
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

function escapeHTML(
    value
) {

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


/* ============================================================
   ESCAPE ATTRIBUT
   ============================================================ */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* ============================================================
   CACHER TOUS LES ÉTATS
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
   ÉTAT CHARGEMENT
   ============================================================ */

function showLoadingState() {

    hideAllStates();


    favoritesLoading?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   ÉTAT VIDE
   ============================================================ */

function showEmptyState() {

    hideAllStates();


    favoritesEmpty?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   ÉTAT ERREUR
   ============================================================ */

function showErrorState(
    message
) {

    hideAllStates();


    if (
        favoritesErrorMessage
    ) {

        favoritesErrorMessage.textContent =
            message;

    }


    favoritesError?.classList.remove(
        "hidden"
    );

}


/* ============================================================
   ÉTAT CONNEXION
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

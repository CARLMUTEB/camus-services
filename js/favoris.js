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

const FALLBACK_IMAGE = "assets/logo/camu-services-logo.png";

let currentUser = null;
let favorites = [];


/* ============================================================
   ÉLÉMENTS HTML
   ============================================================ */

const favoritesLoading = document.getElementById("favoritesLoading");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const favoritesError = document.getElementById("favoritesError");
const favoritesErrorMessage = document.getElementById("favoritesErrorMessage");
const favoritesGrid = document.getElementById("favoritesGrid");
const favoritesCount = document.getElementById("favoritesCount");
const favoritesPage = document.getElementById("favoritesPage");
const favoritesLogin = document.getElementById("favoritesLogin");


/* ============================================================
   INITIALISATION
   ============================================================ */

console.log("CAMU FAVORIS — initialisation...");


onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (!user) {
        console.log("CAMU FAVORIS — aucun utilisateur connecté.");
        showLoginState();
        return;
    }

    console.log(
        "CAMU FAVORIS — utilisateur connecté :",
        user.uid
    );

    await loadFavorites();
});


/* ============================================================
   CHARGEMENT DES FAVORIS
   ============================================================ */

async function loadFavorites() {

    showLoadingState();

    favorites = [];

    try {

        const favoritesSnapshot =
            await getDocs(collection(db, "favorites"));

        console.log(
            "CAMU FAVORIS —",
            favoritesSnapshot.size,
            "favori(s) trouvé(s) dans Firestore."
        );


        for (const favoriteDoc of favoritesSnapshot.docs) {

            const favorite = favoriteDoc.data();


            /* ------------------------------------------------
               Vérifier que le favori appartient à l'utilisateur
               ------------------------------------------------ */

            if (
                !favorite.userId ||
                favorite.userId !== currentUser.uid
            ) {
                continue;
            }


            const annonceId =
                favorite.annonceId;


            if (!annonceId) {

                console.warn(
                    "CAMU FAVORIS — favori sans annonceId :",
                    favoriteDoc.id
                );

                await removeOrphanFavorite(
                    favoriteDoc.id
                );

                continue;
            }


            /* ------------------------------------------------
               Récupérer l'annonce dans annonces
               ------------------------------------------------ */

            try {

                const annonceRef =
                    doc(db, "annonces", annonceId);

                const annonceSnapshot =
                    await getDoc(annonceRef);


                /* --------------------------------------------
                   ANNONCE SUPPRIMÉE / INTROUVABLE
                   -------------------------------------------- */

                if (!annonceSnapshot.exists()) {

                    console.warn(
                        "CAMU FAVORIS — annonce introuvable :",
                        annonceId
                    );

                    await removeOrphanFavorite(
                        favoriteDoc.id
                    );

                    continue;
                }


                const annonce =
                    annonceSnapshot.data();


                /* --------------------------------------------
                   Vérification du statut
                   -------------------------------------------- */

                const status =
                    String(annonce.status || "active")
                        .trim()
                        .toLowerCase();


                if (
                    status !== "active" &&
                    status !== "approved"
                ) {

                    console.log(
                        "CAMU FAVORIS — annonce non disponible :",
                        annonceId,
                        "status:",
                        status
                    );

                    await removeOrphanFavorite(
                        favoriteDoc.id
                    );

                    continue;
                }


                /* --------------------------------------------
                   Ajouter le favori valide
                   -------------------------------------------- */

                favorites.push({

                    id: favoriteDoc.id,

                    favoriteId: favoriteDoc.id,

                    annonceId: annonceId,

                    ...annonce

                });

            } catch (error) {

                console.error(
                    "CAMU FAVORIS — erreur annonce :",
                    annonceId,
                    error
                );

            }
        }


        renderFavorites();

        console.log(
            `CAMU FAVORIS — ${favorites.length} favori(s) chargé(s).`
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
   SUPPRIMER UN FAVORI ORPHELIN
   ============================================================ */

async function removeOrphanFavorite(favoriteId) {

    if (!favoriteId) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "favorites", favoriteId)
        );

        console.log(
            "CAMU FAVORIS — favori orphelin supprimé :",
            favoriteId
        );

    } catch (error) {

        console.warn(
            "CAMU FAVORIS — impossible de supprimer le favori orphelin :",
            favoriteId,
            error
        );
    }
}


/* ============================================================
   AFFICHAGE DES FAVORIS
   ============================================================ */

function renderFavorites() {

    hideAllStates();


    /* --------------------------------------------------------
       Nombre de favoris
       -------------------------------------------------------- */

    if (favoritesCount) {

        favoritesCount.textContent =
            String(favorites.length);
    }


    /* --------------------------------------------------------
       Aucun favori
       -------------------------------------------------------- */

    if (favorites.length === 0) {

        favoritesEmpty?.classList.remove("hidden");

        return;
    }


    /* --------------------------------------------------------
       Grille
       -------------------------------------------------------- */

    if (!favoritesGrid) {

        console.warn(
            "CAMU FAVORIS — #favoritesGrid introuvable."
        );

        return;
    }


    favoritesGrid.innerHTML = "";


    favorites.forEach((annonce) => {

        const card =
            createFavoriteCard(annonce);

        favoritesGrid.appendChild(card);
    });


    favoritesGrid.classList.remove("hidden");
}


/* ============================================================
   CRÉER UNE CARTE FAVORI
   ============================================================ */

function createFavoriteCard(annonce) {

    const article =
        document.createElement("article");

    article.className =
        "favorite-card";


    const image =
        getAnnonceImage(annonce);


    const title =
        cleanValue(
            annonce.title,
            "Annonce sans titre"
        );


    const category =
        cleanValue(
            annonce.category,
            "Autre"
        );


    const city =
        cleanValue(
            annonce.city,
            ""
        );


    const commune =
        cleanValue(
            annonce.commune,
            ""
        );


    const location =
        [city, commune]
            .filter(Boolean)
            .join(" • ");


    const price =
        formatPrice(
            annonce.price,
            annonce.currency
        );


    const annonceId =
        annonce.annonceId;


    article.innerHTML = `

        <div class="favorite-card-image">

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
            >

            <button
                type="button"
                class="favorite-remove"
                data-favorite-id="${escapeAttribute(annonce.favoriteId)}"
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
                price
                    ? `
                    <div class="favorite-card-price">
                        ${escapeHTML(price)}
                    </div>
                    `
                    : ""
            }


            ${
                location
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
                annonce.ownerName
                    ? `
                    <div class="favorite-card-owner">
                        <i class="fa-solid fa-user"></i>
                        <span>
                            ${escapeHTML(
                                cleanValue(
                                    annonce.ownerName,
                                    "Vendeur"
                                )
                            )}
                        </span>
                    </div>
                    `
                    : ""
            }


            <a
                href="explorer.html?id=${encodeURIComponent(annonceId)}"
                class="favorite-view-button"
            >
                <span>Voir l'annonce</span>
                <i class="fa-solid fa-arrow-right"></i>
            </a>

        </div>
    `;


    /* --------------------------------------------------------
       Bouton supprimer
       -------------------------------------------------------- */

    const removeButton =
        article.querySelector(".favorite-remove");


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


        const favoriteSnapshot =
            await getDoc(favoriteRef);


        /* ----------------------------------------------------
           Vérification de propriété
           ---------------------------------------------------- */

        if (!favoriteSnapshot.exists()) {

            cardElement?.remove();

            favorites =
                favorites.filter(
                    item =>
                        item.favoriteId !== favoriteId
                );

            updateFavoritesCount();

            return;
        }


        const favorite =
            favoriteSnapshot.data();


        if (
            favorite.userId !==
            currentUser.uid
        ) {

            console.warn(
                "CAMU FAVORIS — tentative de suppression non autorisée."
            );

            return;
        }


        /* ----------------------------------------------------
           Suppression Firestore
           ---------------------------------------------------- */

        await deleteDoc(favoriteRef);


        /* ----------------------------------------------------
           Suppression de l'affichage
           ---------------------------------------------------- */

        favorites =
            favorites.filter(
                item =>
                    item.favoriteId !== favoriteId
            );


        cardElement?.remove();


        updateFavoritesCount();


        console.log(
            "CAMU FAVORIS — favori supprimé :",
            favoriteId
        );


        /* ----------------------------------------------------
           Si plus aucun favori
           ---------------------------------------------------- */

        if (favorites.length === 0) {

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
   METTRE À JOUR LE COMPTEUR
   ============================================================ */

function updateFavoritesCount() {

    if (favoritesCount) {

        favoritesCount.textContent =
            String(favorites.length);
    }
}


/* ============================================================
   IMAGE
   ============================================================ */

function getAnnonceImage(annonce) {

    let images = [];


    /* --------------------------------------------------------
       Tableau
       -------------------------------------------------------- */

    if (Array.isArray(annonce.images)) {

        images =
            annonce.images;
    }


    /* --------------------------------------------------------
       JSON stocké sous forme de texte
       -------------------------------------------------------- */

    else if (
        typeof annonce.images === "string" &&
        annonce.images.trim()
    ) {

        try {

            const parsed =
                JSON.parse(
                    annonce.images
                );

            if (Array.isArray(parsed)) {

                images = parsed;
            }

        } catch (error) {

            images =
                annonce.images
                    .split(",")
                    .map(item => item.trim());
        }
    }


    /* --------------------------------------------------------
       Autres champs possibles
       -------------------------------------------------------- */

    const possibleImages = [

        ...images,

        annonce.imageURL,

        annonce.imageUrl,

        annonce.image,

        annonce.photoURL,

        annonce.photo,

        annonce.logoURL

    ];


    for (const image of possibleImages) {

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


        /* Ignorer les faux exemples */
        if (
            clean === "url1" ||
            clean === "url2" ||
            clean === "url3" ||
            clean === "image" ||
            clean === "photo"
        ) {
            continue;
        }


        /* Accepter URL Cloudinary */
        if (
            clean.startsWith("http://") ||
            clean.startsWith("https://")
        ) {

            return clean;
        }
    }


    return FALLBACK_IMAGE;
}


/* ============================================================
   PRIX
   ============================================================ */

function formatPrice(price, currency) {

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
        Number.isNaN(numericPrice)
    ) {

        return String(price);
    }


    const formatted =
        new Intl.NumberFormat(
            "fr-FR"
        ).format(numericPrice);


    const currencyValue =
        cleanValue(
            currency,
            "USD"
        );


    return `${formatted} ${currencyValue}`;
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


    const text =
        String(value).trim();


    return text || fallback;
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
   ÉTATS DE LA PAGE
   ============================================================ */

function hideAllStates() {

    favoritesLoading?.classList.add("hidden");

    favoritesEmpty?.classList.add("hidden");

    favoritesError?.classList.add("hidden");

    favoritesGrid?.classList.add("hidden");

    favoritesLogin?.classList.add("hidden");

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
            .querySelectorAll(".sidebar-link")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    closeMobileMenu
                );

            });
    }
);

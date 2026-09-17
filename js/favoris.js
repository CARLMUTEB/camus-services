/* =========================================================
   CAMU SERVICES — FAVORIS
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   DOM
========================================================= */

const favoritesLoading =
    document.getElementById(
        "favoritesLoading"
    );

const favoritesLogin =
    document.getElementById(
        "favoritesLogin"
    );

const favoritesHeader =
    document.getElementById(
        "favoritesHeader"
    );

const favoritesCount =
    document.getElementById(
        "favoritesCount"
    );

const favoritesEmpty =
    document.getElementById(
        "favoritesEmpty"
    );

const favoritesError =
    document.getElementById(
        "favoritesError"
    );

const favoritesGrid =
    document.getElementById(
        "favoritesGrid"
    );

const favoritesRetry =
    document.getElementById(
        "favoritesRetry"
    );

const favoritesRefresh =
    document.getElementById(
        "favoritesRefresh"
    );

const favoritesYear =
    document.getElementById(
        "favoritesYear"
    );


/* =========================================================
   ANNÉE
========================================================= */

if (favoritesYear) {

    favoritesYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MENU MOBILE
========================================================= */

const favoritesMenuButton =
    document.getElementById(
        "favoritesMenuButton"
    );

const favoritesSidebar =
    document.getElementById(
        "favoritesSidebar"
    );

const favoritesOverlay =
    document.getElementById(
        "favoritesOverlay"
    );


if (favoritesMenuButton) {

    favoritesMenuButton.addEventListener(
        "click",
        () => {

            favoritesSidebar.classList.add(
                "open"
            );

            favoritesOverlay.classList.add(
                "open"
            );

        }
    );

}


if (favoritesOverlay) {

    favoritesOverlay.addEventListener(
        "click",
        closeMenu
    );

}


function closeMenu() {

    favoritesSidebar.classList.remove(
        "open"
    );

    favoritesOverlay.classList.remove(
        "open"
    );

}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        hideAllStates();


        if (!user) {

            favoritesLoading.classList.add(
                "hidden"
            );

            favoritesLogin.classList.remove(
                "hidden"
            );

            return;

        }


        await loadFavorites(
            user.uid
        );

    }
);


/* =========================================================
   CHARGER FAVORIS
========================================================= */

async function loadFavorites(
    userId
) {

    hideAllStates();


    favoritesLoading.classList.remove(
        "hidden"
    );


    try {

        console.log(
            "CAMU FAVORIS — chargement..."
        );


        /*
         * On récupère les favoris de
         * l'utilisateur connecté.
         */

        const favoritesQuery =
            query(
                collection(
                    db,
                    "favorites"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const favoritesSnapshot =
            await getDocs(
                favoritesQuery
            );


        if (
            favoritesSnapshot.empty
        ) {

            favoritesLoading.classList.add(
                "hidden"
            );

            favoritesEmpty.classList.remove(
                "hidden"
            );

            favoritesCount.textContent =
                "0 favori";

            return;

        }


        /*
         * Charger les annonces correspondantes.
         */

        const favoriteItems = [];


        for (
            const favoriteDoc
            of favoritesSnapshot.docs
        ) {

            const favoriteData =
                favoriteDoc.data();


            /*
             * Plusieurs noms sont acceptés
             * pour rester compatible avec
             * d'anciens documents.
             */

            const announcementId =
                favoriteData.annonceId
                ||
                favoriteData.adId
                ||
                favoriteData.listingId
                ||
                favoriteData.serviceId;


            if (!announcementId) {

                continue;

            }


            favoriteItems.push({

                favoriteId:
                    favoriteDoc.id,

                announcementId

            });

        }


        /*
         * Récupération des annonces.
         */

        const results = [];


        for (
            const favorite
            of favoriteItems
        ) {

            try {

                const announcementQuery =
                    query(
                        collection(
                            db,
                            "annonces"
                        ),
                        where(
                            "__name__",
                            "==",
                            favorite.announcementId
                        )
                    );


                const announcementSnapshot =
                    await getDocs(
                        announcementQuery
                    );


                if (
                    announcementSnapshot.empty
                ) {

                    /*
                     * L'annonce n'existe plus.
                     * On ne l'affiche pas.
                     */

                    continue;

                }


                const announcementDoc =
                    announcementSnapshot.docs[0];


                const announcementData =
                    announcementDoc.data();


                const status =
                    normalizeText(
                        announcementData.status
                    );


                /*
                 * On garde les annonces actives
                 * ou approuvées.
                 *
                 * Si aucun status n'est présent,
                 * on garde également l'annonce
                 * pour compatibilité.
                 */

                if (
                    status
                    &&
                    status !== "active"
                    &&
                    status !== "approved"
                ) {

                    continue;

                }


                results.push({

                    favoriteId:
                        favorite.favoriteId,

                    id:
                        announcementDoc.id,

                    ...announcementData

                });


            } catch (error) {

                console.warn(
                    "CAMU FAVORIS — annonce introuvable :",
                    favorite.announcementId,
                    error
                );

            }

        }


        favoritesLoading.classList.add(
            "hidden"
        );


        if (
            results.length === 0
        ) {

            favoritesEmpty.classList.remove(
                "hidden"
            );

            favoritesCount.textContent =
                "0 favori";

            return;

        }


        favoritesHeader.classList.remove(
            "hidden"
        );


        favoritesCount.textContent =
            `${results.length} favori${results.length > 1 ? "s" : ""}`;


        renderFavorites(
            results
        );


        console.log(
            `CAMU FAVORIS — ${results.length} favori(s) affiché(s).`
        );


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur :",
            error
        );


        favoritesLoading.classList.add(
            "hidden"
        );


        favoritesError.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   AFFICHAGE
========================================================= */

function renderFavorites(
    favorites
) {

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

}


/* =========================================================
   CARD
========================================================= */

function createFavoriteCard(
    announcement
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "favorite-card";


    const image =
        getFirstImage(
            announcement
        );


    const title =
        escapeHtml(
            cleanValue(
                announcement.title
            )
            ||
            "Annonce sans titre"
        );


    const price =
        formatPrice(
            announcement
        );


    const city =
        escapeHtml(
            cleanValue(
                announcement.city
            )
            ||
            "Ville non indiquée"
        );


    const commune =
        escapeHtml(
            cleanValue(
                announcement.commune
            )
        );


    const owner =
        escapeHtml(
            cleanValue(
                announcement.ownerName
            )
            ||
            "Utilisateur"
        );


    const badge =
        escapeHtml(
            getDomainLabel(
                announcement
            )
        );


    let imageHTML = `

        <div class="favorite-card-image">

            <div class="favorite-image-placeholder">

                <i class="fa-solid fa-image"></i>

            </div>

            <span class="favorite-badge">
                ${badge}
            </span>

        </div>

    `;


    if (
        image
    ) {

        imageHTML = `

            <div class="favorite-card-image">

                <img
                    src="${escapeHtml(image)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="favorite-image-placeholder"
                    style="display:none;"
                >

                    <i class="fa-solid fa-image"></i>

                </div>


                <span class="favorite-badge">
                    ${badge}
                </span>

            </div>

        `;

    }


    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(
                announcement.id
            )}"
            class="favorite-card-link"
        >

            ${imageHTML}


            <div class="favorite-card-body">

                <h3 class="favorite-card-title">

                    ${title}

                </h3>


                <div class="favorite-card-price">

                    ${price}

                </div>


                <div class="favorite-card-meta">

                    <span>

                        <i class="fa-solid fa-location-dot"></i>

                        ${city}

                    </span>


                    ${
                        commune
                        ?
                        `
                        <span>

                            <i class="fa-solid fa-map-pin"></i>

                            ${commune}

                        </span>
                        `
                        :
                        ""
                    }

                </div>


                <div class="favorite-card-footer">

                    <span class="favorite-owner">

                        ${owner}

                    </span>


                    <span class="favorite-arrow">

                        <i class="fa-solid fa-arrow-right"></i>

                    </span>

                </div>

            </div>

        </a>


        <button
            type="button"
            class="favorite-remove"
            data-favorite-id="${escapeHtml(
                announcement.favoriteId
            )}"
            title="Retirer des favoris"
            aria-label="Retirer des favoris"
        >

            <i class="fa-solid fa-heart"></i>

        </button>

    `;


    const removeButton =
        card.querySelector(
            ".favorite-remove"
        );


    removeButton.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            event.stopPropagation();


            await removeFavorite(
                announcement.favoriteId,
                card
            );

        }
    );


    return card;

}


/* =========================================================
   SUPPRIMER FAVORI
========================================================= */

async function removeFavorite(
    favoriteId,
    card
) {

    if (
        !favoriteId
    ) {

        return;

    }


    const removeButton =
        card.querySelector(
            ".favorite-remove"
        );


    if (
        removeButton
    ) {

        removeButton.disabled =
            true;

        removeButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "favorites",
                favoriteId
            )
        );


        card.remove();


        const remaining =
            document.querySelectorAll(
                ".favorite-card"
            ).length;


        favoritesCount.textContent =
            `${remaining} favori${remaining > 1 ? "s" : ""}`;


        if (
            remaining === 0
        ) {

            favoritesHeader.classList.add(
                "hidden"
            );

            favoritesEmpty.classList.remove(
                "hidden"
            );

        }


        console.log(
            "CAMU FAVORIS — favori supprimé."
        );


    } catch (error) {

        console.error(
            "CAMU FAVORIS — suppression impossible :",
            error
        );


        if (
            removeButton
        ) {

            removeButton.disabled =
                false;

            removeButton.innerHTML = `
                <i class="fa-solid fa-heart"></i>
            `;

        }


        alert(
            "Impossible de retirer ce favori. Veuillez réessayer."
        );

    }

}


/* =========================================================
   IMAGE
========================================================= */

function getFirstImage(
    announcement
) {

    if (
        Array.isArray(
            announcement.images
        )
    ) {

        return (
            announcement.images[0]
            ||
            announcement.imageURL
            ||
            ""
        );

    }


    if (
        typeof announcement.images ===
        "string"
    ) {

        const value =
            announcement.images.trim();


        if (
            value.startsWith("[")
        ) {

            try {

                const parsed =
                    JSON.parse(value);


                if (
                    Array.isArray(parsed)
                ) {

                    return (
                        parsed[0]
                        ||
                        announcement.imageURL
                        ||
                        ""
                    );

                }

            } catch {

                /* Rien */

            }

        }


        if (
            value.startsWith("http")
        ) {

            return value;

        }

    }


    return (
        announcement.imageURL
        ||
        announcement.imageUrl
        ||
        announcement.image
        ||
        announcement.photoURL
        ||
        ""
    );

}


/* =========================================================
   DOMAINE
========================================================= */

function getDomainLabel(
    announcement
) {

    const accountType =
        normalizeText(
            announcement.accountType
        );


    if (
        accountType === "immobilier"
    ) {

        return "IMMOBILIER";

    }


    if (
        accountType === "commerce"
    ) {

        return "COMMERCE";

    }


    if (
        accountType === "vehicules"
    ) {

        return "VÉHICULES";

    }


    if (
        accountType === "hotels"
    ) {

        return "HÔTELS";

    }


    const category =
        normalizeText(
            announcement.category
        );


    if (
        category.includes("immobilier")
    ) {

        return "IMMOBILIER";

    }


    if (
        category.includes("commerce")
    ) {

        return "COMMERCE";

    }


    if (
        category.includes("vehicule")
        ||
        category.includes("transport")
    ) {

        return "VÉHICULES";

    }


    if (
        category.includes("hotel")
        ||
        category.includes("hebergement")
    ) {

        return "HÔTELS";

    }


    return "CAMU SERVICES";

}


/* =========================================================
   PRIX
========================================================= */

function formatPrice(
    announcement
) {

    const price =
        Number(
            announcement.price
        );


    if (
        !Number.isFinite(price)
        ||
        price <= 0
    ) {

        return "Prix sur demande";

    }


    const currency =
        String(
            announcement.currency
            ||
            "USD"
        )
        .trim()
        .toUpperCase();


    return `
        ${new Intl.NumberFormat("fr-FR").format(price)}
        ${escapeHtml(currency)}
    `;

}


/* =========================================================
   NETTOYAGE
========================================================= */

function cleanValue(
    value
) {

    return String(
        value || ""
    ).trim();

}


function normalizeText(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value || ""
    )
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


/* =========================================================
   ÉTATS
========================================================= */

function hideAllStates() {

    favoritesLoading.classList.add(
        "hidden"
    );

    favoritesLogin.classList.add(
        "hidden"
    );

    favoritesHeader.classList.add(
        "hidden"
    );

    favoritesEmpty.classList.add(
        "hidden"
    );

    favoritesError.classList.add(
        "hidden"
    );

    favoritesGrid.innerHTML = "";

}


/* =========================================================
   RETRY
========================================================= */

if (favoritesRetry) {

    favoritesRetry.addEventListener(
        "click",
        () => {

            const user =
                auth.currentUser;


            if (user) {

                loadFavorites(
                    user.uid
                );

            }

        }
    );

}


if (favoritesRefresh) {

    favoritesRefresh.addEventListener(
        "click",
        () => {

            const user =
                auth.currentUser;


            if (user) {

                loadFavorites(
                    user.uid
                );

            }

        }
    );

}

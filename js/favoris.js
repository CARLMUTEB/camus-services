// =========================================================
// CAMU SERVICES — FAVORIS
// Version Firebase 12.1.0
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =========================================================
// INITIALISATION
// =========================================================

console.log("CAMU FAVORIS — initialisation...");


// =========================================================
// DOM
// =========================================================

const favoritesLoading =
    document.getElementById("favoritesLoading");

const favoritesLogin =
    document.getElementById("favoritesLogin");

const favoritesEmpty =
    document.getElementById("favoritesEmpty");

const favoritesError =
    document.getElementById("favoritesError");

const favoritesErrorMessage =
    document.getElementById("favoritesErrorMessage");

const favoritesPage =
    document.getElementById("favoritesPage");

const favoritesGrid =
    document.getElementById("favoritesGrid");

const favoritesCount =
    document.getElementById("favoritesCount");

const favoritesYear =
    document.getElementById("favoritesYear");

const favoritesRetryButton =
    document.getElementById("favoritesRetryButton");

const favoritesMenuButton =
    document.getElementById("favoritesMenuButton");

const favoritesSidebar =
    document.getElementById("favoritesSidebar");

const favoritesOverlay =
    document.getElementById("favoritesOverlay");


// =========================================================
// VÉRIFICATION DU DOM
// =========================================================

console.log(
    "CAMU FAVORIS — favoritesGrid :",
    favoritesGrid
);

console.log(
    "CAMU FAVORIS — favoritesPage :",
    favoritesPage
);


// =========================================================
// ANNÉE
// =========================================================

if (favoritesYear) {

    favoritesYear.textContent =
        new Date().getFullYear();

}


// =========================================================
// ÉTATS
// =========================================================

function hideAllStates() {

    favoritesLoading?.classList.add("hidden");

    favoritesLogin?.classList.add("hidden");

    favoritesEmpty?.classList.add("hidden");

    favoritesError?.classList.add("hidden");

    favoritesPage?.classList.add("hidden");

}


function showLoading() {

    hideAllStates();

    favoritesLoading?.classList.remove("hidden");

}


function showLogin() {

    hideAllStates();

    favoritesLogin?.classList.remove("hidden");

}


function showEmpty() {

    hideAllStates();

    favoritesEmpty?.classList.remove("hidden");

}


function showError(message) {

    hideAllStates();

    if (favoritesErrorMessage) {

        favoritesErrorMessage.textContent =
            message ||
            "Impossible de charger vos favoris.";

    }

    favoritesError?.classList.remove("hidden");

}


function showPage() {

    hideAllStates();

    favoritesPage?.classList.remove("hidden");

}


// =========================================================
// NETTOYAGE
// =========================================================

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).trim();

}


// =========================================================
// PROTECTION HTML
// =========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================================
// IMAGE
// =========================================================

function getImage(ad, favorite) {

    const images = [];


    // Favori
    if (favorite?.imageURL) {

        images.push(
            favorite.imageURL
        );

    }


    if (favorite?.imageUrl) {

        images.push(
            favorite.imageUrl
        );

    }


    // Annonce
    if (ad?.imageURL) {

        images.push(
            ad.imageURL
        );

    }


    if (ad?.imageUrl) {

        images.push(
            ad.imageUrl
        );

    }


    if (ad?.photoURL) {

        images.push(
            ad.photoURL
        );

    }


    if (ad?.image) {

        images.push(
            ad.image
        );

    }


    if (ad?.photo) {

        images.push(
            ad.photo
        );

    }


    // Tableau images
    if (Array.isArray(ad?.images)) {

        images.push(
            ...ad.images
        );

    }


    // Images stockées comme JSON
    if (typeof ad?.images === "string") {

        try {

            const parsed =
                JSON.parse(ad.images);

            if (Array.isArray(parsed)) {

                images.push(
                    ...parsed
                );

            } else {

                images.push(
                    ad.images
                );

            }

        } catch {

            images.push(
                ad.images
            );

        }

    }


    // Recherche d'une vraie URL
    const validImage =
        images
            .map(cleanValue)
            .find(url => {

                if (!url) {

                    return false;

                }


                const lower =
                    url.toLowerCase();


                // Faux placeholders
                if (
                    lower === "url1" ||
                    lower === "url2" ||
                    lower === "url3" ||
                    lower === "image" ||
                    lower === "photo"
                ) {

                    return false;

                }


                return (
                    lower.startsWith("http://") ||
                    lower.startsWith("https://") ||
                    lower.startsWith("data:image/") ||
                    lower.startsWith("assets/")
                );

            });


    return validImage || "";

}


// =========================================================
// TITRE
// =========================================================

function getTitle(ad, favorite) {

    return cleanValue(

        ad?.title ||
        ad?.titre ||
        favorite?.title ||
        "Annonce sans titre"

    );

}


// =========================================================
// PRIX
// =========================================================

function formatPrice(ad) {

    const price =
        ad?.price ??
        ad?.prix ??
        "";


    if (price === "") {

        return "Prix non communiqué";

    }


    const numericPrice =
        Number(
            String(price)
                .replace(/\s/g, "")
                .replace(/,/g, "")
        );


    if (!Number.isNaN(numericPrice)) {

        const formatted =
            new Intl.NumberFormat("fr-FR")
                .format(numericPrice);


        const currency =
            cleanValue(
                ad?.currency ||
                ad?.devise ||
                "USD"
            );


        return `${formatted} ${currency}`;

    }


    return escapeHTML(price);

}


// =========================================================
// LOCALISATION
// =========================================================

function getLocation(ad) {

    const city =
        cleanValue(
            ad?.city ||
            ad?.ville
        );


    const neighborhood =
        cleanValue(
            ad?.neighborhood ||
            ad?.commune ||
            ad?.quartier
        );


    if (
        city &&
        neighborhood
    ) {

        return `${city} — ${neighborhood}`;

    }


    return (
        city ||
        neighborhood ||
        "Localisation non précisée"
    );

}


// =========================================================
// CATÉGORIE
// =========================================================

function getCategory(ad) {

    return cleanValue(

        ad?.category ||
        ad?.categorie ||
        "Annonce"

    );

}


// =========================================================
// PROPRIÉTAIRE
// =========================================================

function getOwner(ad, favorite) {

    return cleanValue(

        ad?.ownerName ||
        ad?.owner ||
        ad?.sellerName ||
        ad?.nom ||
        favorite?.ownerName ||
        "Vendeur"

    );

}


// =========================================================
// CHARGEMENT DES FAVORIS
// =========================================================

async function loadFavorites(currentUser) {

    console.log(
        "CAMU FAVORIS — utilisateur connecté :",
        currentUser.uid
    );


    showLoading();


    // Vérification DOM
    if (!favoritesGrid) {

        console.error(
            "CAMU FAVORIS — favoritesGrid introuvable."
        );


        showError(
            "La zone d'affichage des favoris est introuvable."
        );


        return;

    }


    favoritesGrid.innerHTML = "";


    try {

        // =================================================
        // RÉCUPÉRATION DES FAVORIS
        // =================================================

        const favoritesRef =
            collection(
                db,
                "favorites"
            );


        console.log(
            "CAMU FAVORIS — collection favorites prête."
        );


        const favoritesSnapshot =
            await getDocs(
                favoritesRef
            );


        console.log(
            "CAMU FAVORIS — documents favorites récupérés :",
            favoritesSnapshot.size
        );


        const userFavorites = [];


        favoritesSnapshot.forEach(
            favoriteDocument => {

                const data =
                    favoriteDocument.data();


                console.log(
                    "CAMU FAVORIS — document :",
                    favoriteDocument.id,
                    data
                );


                if (
                    data.userId ===
                    currentUser.uid
                ) {

                    userFavorites.push({

                        id:
                            favoriteDocument.id,

                        ...data

                    });

                }

            }
        );


        console.log(
            `CAMU FAVORIS — ${userFavorites.length} favori(s) trouvé(s) dans Firestore.`
        );


        // =================================================
        // AUCUN FAVORI
        // =================================================

        if (
            userFavorites.length === 0
        ) {

            if (favoritesCount) {

                favoritesCount.textContent =
                    "0 annonce";

            }


            showEmpty();

            return;

        }


        // =================================================
        // RÉCUPÉRATION DES ANNONCES
        // =================================================

        const loadedFavorites = [];


        for (
            const favorite
            of userFavorites
        ) {

            let annonceId =
                cleanValue(
                    favorite.annonceId
                );


            // =================================================
            // ANCIENS FAVORIS
            // ID = UID_ANNONCEID
            // =================================================

            if (!annonceId) {

                const prefix =
                    `${currentUser.uid}_`;


                if (
                    favorite.id.startsWith(
                        prefix
                    )
                ) {

                    annonceId =
                        favorite.id.substring(
                            prefix.length
                        );


                    console.log(
                        "CAMU FAVORIS — annonceId récupéré depuis l'ID du favori :",
                        annonceId
                    );

                }

            }


            // =================================================
            // SI ID INTROUVABLE
            // =================================================

            if (!annonceId) {

                console.warn(
                    "CAMU FAVORIS — annonceId introuvable :",
                    favorite.id
                );


                continue;

            }


            // =================================================
            // LECTURE DE L'ANNONCE
            // =================================================

            try {

                const annonceRef =
                    doc(
                        db,
                        "annonces",
                        annonceId
                    );


                console.log(
                    "CAMU FAVORIS — recherche annonce :",
                    annonceId
                );


                const annonceSnapshot =
                    await getDoc(
                        annonceRef
                    );


                if (
                    !annonceSnapshot.exists()
                ) {

                    console.warn(
                        "CAMU FAVORIS — annonce introuvable :",
                        annonceId
                    );


                    continue;

                }


                const annonce =
                    annonceSnapshot.data();


                console.log(
                    "CAMU FAVORIS — annonce trouvée :",
                    annonceId,
                    annonce
                );


                loadedFavorites.push({

                    favoriteId:
                        favorite.id,

                    annonceId:
                        annonceId,

                    favorite:
                        favorite,

                    annonce:
                        annonce

                });


            } catch (error) {

                console.error(
                    "CAMU FAVORIS — erreur lors de la lecture de l'annonce :",
                    annonceId,
                    error
                );

            }

        }


        console.log(
            `CAMU FAVORIS — ${loadedFavorites.length} favori(s) chargé(s).`
        );


        // =================================================
        // AUCUNE ANNONCE VALIDE
        // =================================================

        if (
            loadedFavorites.length === 0
        ) {

            if (favoritesCount) {

                favoritesCount.textContent =
                    "0 annonce";

            }


            showEmpty();

            return;

        }


        // =================================================
        // COMPTEUR
        // =================================================

        if (favoritesCount) {

            favoritesCount.textContent =
                loadedFavorites.length === 1
                    ? "1 annonce"
                    : `${loadedFavorites.length} annonces`;

        }


        // =================================================
        // AFFICHAGE
        // =================================================

        renderFavorites(
            loadedFavorites
        );


        // =================================================
        // AFFICHER LA PAGE
        // =================================================

        showPage();


        console.log(
            "CAMU FAVORIS — page des favoris affichée."
        );

    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur générale :",
            error
        );


        showError(
            "Impossible de charger vos favoris. Vérifiez votre connexion puis réessayez."
        );

    }

}


// =========================================================
// AFFICHAGE DES CARTES
// =========================================================

function renderFavorites(favorites) {

    if (!favoritesGrid) {

        console.error(
            "CAMU FAVORIS — favoritesGrid introuvable pendant renderFavorites."
        );


        return;

    }


    favoritesGrid.innerHTML = "";


    console.log(
        "CAMU FAVORIS — création de",
        favorites.length,
        "carte(s)."
    );


    favorites.forEach(
        item => {

            const ad =
                item.annonce;


            const favorite =
                item.favorite;


            const title =
                getTitle(
                    ad,
                    favorite
                );


            const price =
                formatPrice(ad);


            const location =
                getLocation(ad);


            const category =
                getCategory(ad);


            const owner =
                getOwner(
                    ad,
                    favorite
                );


            const image =
                getImage(
                    ad,
                    favorite
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "favorite-card";


            card.dataset.annonceId =
                item.annonceId;


            // =================================================
            // IMAGE
            // =================================================

            let imageHTML;


            if (image) {

                imageHTML = `

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(title)}"
                        loading="lazy"
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >

                    <div
                        class="favorite-image-placeholder"
                        style="display:none;"
                    >
                        <i class="fa-solid fa-image"></i>
                    </div>

                `;

            } else {

                imageHTML = `

                    <div class="favorite-image-placeholder">

                        <i class="fa-solid fa-image"></i>

                    </div>

                `;

            }


            // =================================================
            // HTML DE LA CARTE
            // =================================================

            card.innerHTML = `

                <div class="favorite-card-image">

                    ${imageHTML}

                    <span class="favorite-badge">
                        ${escapeHTML(category)}
                    </span>

                    <button
                        type="button"
                        class="favorite-remove"
                        data-favorite-id="${escapeHTML(item.favoriteId)}"
                        data-annonce-id="${escapeHTML(item.annonceId)}"
                        title="Retirer des favoris"
                        aria-label="Retirer des favoris"
                    >

                        <i class="fa-solid fa-heart"></i>

                    </button>

                </div>


                <a
                    href="explorer.html?id=${encodeURIComponent(item.annonceId)}"
                    class="favorite-card-link"
                >

                    <div class="favorite-card-body">

                        <h3 class="favorite-card-title">

                            ${escapeHTML(title)}

                        </h3>


                        <div class="favorite-card-price">

                            ${price}

                        </div>


                        <div class="favorite-card-meta">

                            <span>

                                <i class="fa-solid fa-location-dot"></i>

                                ${escapeHTML(location)}

                            </span>


                            <span>

                                <i class="fa-solid fa-tag"></i>

                                ${escapeHTML(category)}

                            </span>

                        </div>


                        <div class="favorite-card-footer">

                            <span class="favorite-owner">

                                ${escapeHTML(owner)}

                            </span>


                            <span class="favorite-arrow">

                                <i class="fa-solid fa-arrow-right"></i>

                            </span>

                        </div>

                    </div>

                </a>

            `;


            favoritesGrid.appendChild(
                card
            );

        }
    );


    // =================================================
    // BOUTONS SUPPRESSION
    // =================================================

    const removeButtons =
        favoritesGrid.querySelectorAll(
            ".favorite-remove"
        );


    removeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const favoriteId =
                        button.dataset.favoriteId;


                    if (!favoriteId) {

                        return;

                    }


                    await removeFavorite(
                        favoriteId,
                        button
                    );

                }
            );

        }
    );


    console.log(
        "CAMU FAVORIS — cartes présentes dans le DOM :",
        favoritesGrid.children.length
    );

}


// =========================================================
// SUPPRESSION D'UN FAVORI
// =========================================================

async function removeFavorite(
    favoriteId,
    button
) {

    const currentUser =
        auth.currentUser;


    if (!currentUser) {

        alert(
            "Vous devez être connecté."
        );


        return;

    }


    try {

        button.disabled = true;


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


        if (
            !favoriteSnapshot.exists()
        ) {

            button
                .closest(
                    ".favorite-card"
                )
                ?.remove();


            return;

        }


        const favoriteData =
            favoriteSnapshot.data();


        if (
            favoriteData.userId !==
            currentUser.uid
        ) {

            console.error(
                "CAMU FAVORIS — suppression refusée."
            );


            button.disabled = false;


            return;

        }


        await deleteDoc(
            favoriteRef
        );


        console.log(
            "CAMU FAVORIS — favori supprimé :",
            favoriteId
        );


        const card =
            button.closest(
                ".favorite-card"
            );


        card?.remove();


        const remaining =
            favoritesGrid
                ?.children
                .length || 0;


        if (favoritesCount) {

            favoritesCount.textContent =
                remaining === 1
                    ? "1 annonce"
                    : `${remaining} annonces`;

        }


        if (
            remaining === 0
        ) {

            showEmpty();

        }


    } catch (error) {

        console.error(
            "CAMU FAVORIS — erreur suppression :",
            error
        );


        alert(
            "Impossible de retirer cette annonce des favoris."
        );


        button.disabled = false;

    }

}


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(
    auth,
    async currentUser => {

        console.log(
            "CAMU FAVORIS — changement authentification :",
            currentUser
                ? currentUser.uid
                : "non connecté"
        );


        if (!currentUser) {

            showLogin();

            return;

        }


        await loadFavorites(
            currentUser
        );

    }
);


// =========================================================
// BOUTON RÉESSAYER
// =========================================================

favoritesRetryButton?.addEventListener(
    "click",
    () => {

        const currentUser =
            auth.currentUser;


        if (currentUser) {

            loadFavorites(
                currentUser
            );

        } else {

            showLogin();

        }

    }
);


// =========================================================
// MENU MOBILE
// =========================================================

function openMobileMenu() {

    favoritesSidebar?.classList.add(
        "open"
    );

    favoritesOverlay?.classList.add(
        "open"
    );

}


function closeMobileMenu() {

    favoritesSidebar?.classList.remove(
        "open"
    );

    favoritesOverlay?.classList.remove(
        "open"
    );

}


favoritesMenuButton?.addEventListener(
    "click",
    openMobileMenu
);


favoritesOverlay?.addEventListener(
    "click",
    closeMobileMenu
);


document
    .querySelectorAll(
        ".favorites-sidebar a"
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                closeMobileMenu
            );

        }
    );


// =========================================================
// FIN
// =========================================================

console.log(
    "CAMU FAVORIS — script chargé avec Firebase 12.1.0."
);

// =========================================================
// CAMU SERVICES — INDEX.JS
// Affichage des annonces récentes depuis Firestore
// Gestion des favoris compatible avec favoris.html
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENT HTML
// =========================================================

const recentAds =
    document.getElementById("recentAds");


// =========================================================
// ÉCHAPPER LE HTML
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


    if (
        Number.isNaN(number)
    ) {

        return `${escapeHtml(price)} ${escapeHtml(currency)}`;

    }


    return `${new Intl.NumberFormat("fr-FR").format(number)} ${escapeHtml(currency)}`;
}


// =========================================================
// IMAGE
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


    return "logo.png";
}


// =========================================================
// NOM DE LA CATÉGORIE
// =========================================================

function getCategoryName(
    category
) {

    const categories = {

        immobilier:
            "Immobilier",

        vehicules:
            "Véhicules",

        commerce:
            "Commerce",

        services:
            "Services",

        emploi:
            "Emploi",

        autres:
            "Autres"

    };


    const key =
        String(
            category || ""
        ).toLowerCase();


    return (
        categories[key] ||
        category ||
        "Autres"
    );
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
        // MESSAGE DE CHARGEMENT
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
        // RÉCUPÉRER LES ANNONCES
        // IMPORTANT :
        // On utilise "annonces" et non "services"
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
        // TRANSFORMER LES DOCUMENTS FIRESTORE
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
        // TRIER PAR DATE
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
        // GARDER LES 8 PLUS RÉCENTES
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
        // VIDER LES ANNONCES STATIQUES
        // -------------------------------------------------

        recentAds.innerHTML = "";


        // =================================================
        // CRÉER LES CARTES
        // =================================================

        recent.forEach(
            ad => {

                // -----------------------------------------
                // DONNÉES
                // -----------------------------------------

                const image =
                    getImage(ad);


                const title =
                    ad.title ||
                    "Annonce sans titre";


                const city =
                    ad.city ||
                    "Ville non précisée";


                const category =
                    getCategoryName(
                        ad.category
                    );


                const price =
                    formatPrice(
                        ad.price,
                        ad.currency ||
                        "USD"
                    );


                // -----------------------------------------
                // CARTE
                // -----------------------------------------

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "ad-card";


                // -----------------------------------------
                // HTML DE LA CARTE
                // -----------------------------------------

                card.innerHTML = `

                    <div class="ad-image">

                        <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(title)}"
                            loading="lazy"
                            onerror="this.src='logo.png'"
                        >


                        <!-- =============================
                             BOUTON FAVORI
                             ============================= -->

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


                // -----------------------------------------
                // CLIQUER SUR LA CARTE
                // -----------------------------------------

                card.addEventListener(
                    "click",
                    event => {

                        // Si le clic vient du cœur,
                        // ne pas ouvrir l'annonce.

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


                // -----------------------------------------
                // BOUTON FAVORI
                // -----------------------------------------

                const favoriteButton =
                    card.querySelector(
                        ".favorite-button"
                    );


                if (
                    favoriteButton
                ) {

                    favoriteButton.addEventListener(
                        "click",
                        event => {

                            // Empêcher le clic
                            // de remonter vers la carte.

                            event.preventDefault();

                            event.stopPropagation();


                            console.log(
                                "Annonce sélectionnée pour favori :",
                                ad.id
                            );


                            /*
                             * Le vrai traitement du favori
                             * est effectué par app.js.
                             *
                             * app.js récupère :
                             *
                             * data-listing-id
                             *
                             * puis utilise :
                             *
                             * favorites
                             *
                             * dans Firestore.
                             */

                        }
                    );

                }


                // -----------------------------------------
                // AJOUTER LA CARTE À LA PAGE
                // -----------------------------------------

                recentAds.appendChild(
                    card
                );

            }
        );


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
// LANCEMENT
// =========================================================

loadRecentAds();


console.log(
    "CAMU SERVICES — index.js chargé correctement."
);

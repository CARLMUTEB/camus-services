// =========================================================
// CAMU SERVICES — INDEX.JS
// Annonces + Favoris Firestore
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
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ÉLÉMENT HTML
// =========================================================

const recentAds = document.getElementById("recentAds");


// =========================================================
// UTILISATEUR CONNECTÉ
// =========================================================

let currentUser = null;

let authReadyResolve;

const authReady = new Promise((resolve) => {
    authReadyResolve = resolve;
});


// =========================================================
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    console.log(
        "INDEX — utilisateur :",
        user ? user.email : "non connecté"
    );

    authReadyResolve(user);
});


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
// CATÉGORIE
// =========================================================

function getCategoryName(category) {

    const categories = {

        immobilier: "Immobilier",

        vehicules: "Véhicules",

        commerce: "Commerce",

        services: "Services",

        emploi: "Emploi",

        autres: "Autres"

    };

    const key = String(
        category || ""
    ).toLowerCase();

    return (
        categories[key] ||
        category ||
        "Autres"
    );
}


// =========================================================
// MESSAGE CAMU
// =========================================================

function showMessage(
    message,
    type = "success"
) {

    if (
        typeof window.showCamuMessage ===
        "function"
    ) {

        window.showCamuMessage(
            message,
            type
        );

        return;
    }

    console.log(
        `CAMU MESSAGE [${type}] :`,
        message
    );

    alert(message);
}


// =========================================================
// MODIFIER L'APPARENCE DU CŒUR
// =========================================================

function updateFavoriteButton(
    button,
    active
) {

    if (!button) {
        return;
    }

    button.classList.toggle(
        "active",
        active
    );

    button.classList.toggle(
        "is-favorite",
        active
    );

    const icon =
        button.querySelector("i");

    if (icon) {

        icon.classList.toggle(
            "fa-solid",
            active
        );

        icon.classList.toggle(
            "fa-regular",
            !active
        );

    }

    button.setAttribute(
        "aria-label",
        active
            ? "Retirer des favoris"
            : "Ajouter aux favoris"
    );
}


// =========================================================
// ID DU FAVORI
// =========================================================

function getFavoriteId(
    userId,
    listingId
) {

    return `${userId}-${listingId}`;
}


// =========================================================
// VÉRIFIER SI UNE ANNONCE EST FAVORITE
// =========================================================

async function checkFavorite(
    listingId
) {

    const user =
        auth.currentUser || currentUser;

    if (
        !user ||
        !listingId
    ) {

        return false;
    }

    try {

        const favoriteId =
            getFavoriteId(
                user.uid,
                listingId
            );

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

    }
    catch (error) {

        console.error(
            "INDEX — erreur vérification favori :",
            error
        );

        return false;
    }
}


// =========================================================
// AJOUTER / RETIRER UN FAVORI
// =========================================================

async function toggleFavorite(
    button
) {

    console.log(
        "INDEX — clic favori détecté."
    );

    const user =
        auth.currentUser || currentUser;

    // -------------------------------------------------------
    // UTILISATEUR NON CONNECTÉ
    // -------------------------------------------------------

    if (!user) {

        console.log(
            "INDEX — aucun utilisateur connecté."
        );

        showMessage(
            "Connectez-vous pour ajouter une annonce aux favoris.",
            "info"
        );

        setTimeout(() => {

            window.location.href =
                "connexion.html";

        }, 700);

        return;
    }


    // -------------------------------------------------------
    // RÉCUPÉRER L'ID DE L'ANNONCE
    // -------------------------------------------------------

    const listingId =
        button.dataset.listingId;

    console.log(
        "INDEX — ID annonce :",
        listingId
    );


    if (!listingId) {

        console.error(
            "INDEX — ID annonce manquant.",
            button
        );

        showMessage(
            "Impossible d'identifier cette annonce.",
            "error"
        );

        return;
    }


    // -------------------------------------------------------
    // ID DU DOCUMENT FAVORI
    // -------------------------------------------------------

    const favoriteId =
        getFavoriteId(
            user.uid,
            listingId
        );

    console.log(
        "INDEX — ID favori :",
        favoriteId
    );


    const favoriteRef =
        doc(
            db,
            "favorites",
            favoriteId
        );


    // -------------------------------------------------------
    // ÉVITER LES CLICS MULTIPLES
    // -------------------------------------------------------

    if (
        button.dataset.loading === "true"
    ) {
        return;
    }

    button.dataset.loading = "true";

    button.disabled = true;


    try {

        // ---------------------------------------------------
        // VÉRIFIER LE FAVORI
        // ---------------------------------------------------

        const snapshot =
            await getDoc(
                favoriteRef
            );


        // ===================================================
        // RETIRER DES FAVORIS
        // ===================================================

        if (
            snapshot.exists()
        ) {

            console.log(
                "INDEX — suppression du favori..."
            );

            await deleteDoc(
                favoriteRef
            );


            updateFavoriteButton(
                button,
                false
            );


            showMessage(
                "Annonce retirée des favoris.",
                "success"
            );


            console.log(
                "INDEX — favori supprimé avec succès :",
                listingId
            );

        }


        // ===================================================
        // AJOUTER AUX FAVORIS
        // ===================================================

        else {

            console.log(
                "INDEX — création du favori..."
            );


            await setDoc(
                favoriteRef,
                {

                    userId:
                        user.uid,

                    listingId:
                        listingId,

                    createdAt:
                        serverTimestamp()

                }
            );


            updateFavoriteButton(
                button,
                true
            );


            showMessage(
                "Annonce ajoutée aux favoris ❤️",
                "success"
            );


            console.log(
                "INDEX — favori ajouté avec succès :",
                listingId
            );

        }

    }
    catch (error) {

        console.error(
            "INDEX — ERREUR FIRESTORE FAVORIS :",
            error
        );

        console.error(
            "INDEX — code erreur :",
            error.code
        );

        console.error(
            "INDEX — message erreur :",
            error.message
        );


        showMessage(
            "Impossible de modifier les favoris. Vérifiez votre connexion et vos autorisations.",
            "error"
        );

    }
    finally {

        button.dataset.loading =
            "false";

        button.disabled = false;
    }

}


// =========================================================
// CLIC SUR LES FAVORIS
// =========================================================
// IMPORTANT :
// Les cartes sont créées dynamiquement.
// On écoute donc #recentAds au lieu de chercher
// les boutons avant leur création.
// =========================================================

if (recentAds) {

    recentAds.addEventListener(
        "click",
        async (event) => {

            const button =
                event.target.closest(
                    ".favorite-button"
                );

            if (!button) {
                return;
            }

            event.preventDefault();

            event.stopPropagation();

            await toggleFavorite(
                button
            );

        }
    );

}


// =========================================================
// RESTAURER LES CŒURS
// =========================================================

async function restoreFavoriteButtons() {

    const user =
        auth.currentUser || currentUser;

    if (!user) {
        return;
    }

    if (!recentAds) {
        return;
    }

    const buttons =
        recentAds.querySelectorAll(
            ".favorite-button"
        );


    console.log(
        "INDEX — restauration de",
        buttons.length,
        "bouton(s) favori(s)."
    );


    for (
        const button of buttons
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

        // ---------------------------------------------------
        // CHARGEMENT
        // ---------------------------------------------------

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


        // ---------------------------------------------------
        // COLLECTION ANNONCES
        // ---------------------------------------------------

        const annoncesRef =
            collection(
                db,
                "annonces"
            );


        const snapshot =
            await getDocs(
                annoncesRef
            );


        // ---------------------------------------------------
        // TRANSFORMATION
        // ---------------------------------------------------

        const ads =
            snapshot.docs.map(
                (document) => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        // ---------------------------------------------------
        // TRI PAR DATE
        // ---------------------------------------------------

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


        // ---------------------------------------------------
        // 8 DERNIÈRES ANNONCES
        // ---------------------------------------------------

        const recent =
            ads.slice(
                0,
                8
            );


        console.log(
            "CAMU SERVICES : annonces trouvées :",
            ads.length
        );


        // ---------------------------------------------------
        // AUCUNE ANNONCE
        // ---------------------------------------------------

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


        // ---------------------------------------------------
        // VIDER LES ANCIENNES CARTES
        // ---------------------------------------------------

        recentAds.innerHTML = "";


        // ===================================================
        // CRÉER LES CARTES
        // ===================================================

        recent.forEach(
            (ad) => {

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


                // ------------------------------------------------
                // CARTE
                // ------------------------------------------------

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "ad-card";


                // ------------------------------------------------
                // HTML
                // ------------------------------------------------

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


                // ------------------------------------------------
                // CLIC SUR LA CARTE
                // ------------------------------------------------

                card.addEventListener(
                    "click",
                    (event) => {

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


                // ------------------------------------------------
                // AJOUTER LA CARTE
                // ------------------------------------------------

                recentAds.appendChild(
                    card
                );

            }
        );


        // ---------------------------------------------------
        // ATTENDRE L'ÉTAT AUTH
        // ---------------------------------------------------

        await authReady;


        // ---------------------------------------------------
        // RESTAURER LES FAVORIS
        // ---------------------------------------------------

        await restoreFavoriteButtons();

    }
    catch (error) {

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

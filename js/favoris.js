import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { auth, db } from "./firebase-config.js";


const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const favoritesLoading = document.getElementById("favoritesLoading");
const favoritesCount = document.getElementById("favoritesCount");


/* =========================================================
   CHARGER LES FAVORIS
========================================================= */

async function loadFavorites(user) {

    try {

        favoritesLoading.hidden = false;
        favoritesContainer.innerHTML = "";
        favoritesEmpty.hidden = true;

        // Collection Firestore : favorites
        const favoritesRef = collection(db, "favorites");

        const q = query(
            favoritesRef,
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        // Nombre total de favoris
        favoritesCount.textContent = snapshot.size;


        // Aucun favori
        if (snapshot.empty) {

            favoritesLoading.hidden = true;
            favoritesEmpty.hidden = false;

            return;
        }


        /* =====================================================
           RÉCUPÉRER CHAQUE ANNONCE
        ===================================================== */

        for (const favoriteDoc of snapshot.docs) {

            const favorite = favoriteDoc.data();

            // IMPORTANT :
            // Les documents favorites utilisent listingId
            const listingId = favorite.listingId;


            if (!listingId) {

                console.warn(
                    "Favori sans listingId :",
                    favoriteDoc.id
                );

                continue;
            }


            // Les annonces sont dans la collection "annonces"
            const listingRef = doc(
                db,
                "annonces",
                listingId
            );

            const listingSnapshot = await getDoc(listingRef);


            // L'annonce n'existe plus
            if (!listingSnapshot.exists()) {

                console.warn(
                    "Annonce introuvable :",
                    listingId
                );

                continue;
            }


            const listing = listingSnapshot.data();


            renderFavorite(
                listingSnapshot.id,
                listing,
                favoriteDoc.id
            );
        }


        favoritesLoading.hidden = true;


        // Aucun document favorite ne correspond
        // à une annonce existante
        if (!favoritesContainer.children.length) {

            favoritesEmpty.hidden = false;
        }


    } catch (error) {

        console.error(
            "Erreur chargement favoris :",
            error
        );

        favoritesLoading.hidden = true;

        favoritesContainer.innerHTML = `
            <div class="favorites-error">

                <i class="fa-solid fa-circle-exclamation"></i>

                <p>
                    Impossible de charger vos favoris.
                </p>

            </div>
        `;
    }
}


/* =========================================================
   AFFICHER UNE ANNONCE FAVORITE
========================================================= */

function renderFavorite(
    listingId,
    listing,
    favoriteId
) {

    const card = document.createElement("article");

    card.className = "favorite-card";


    /* =====================================================
       IMAGE
    ===================================================== */

    const image =
        listing.image ||
        listing.imageUrl ||
        listing.images?.[0] ||
        "assets/images/placeholder.jpg";


    /* =====================================================
       TITRE
    ===================================================== */

    const title =
        listing.title ||
        "Annonce sans titre";


    /* =====================================================
       PRIX
    ===================================================== */

    const price =
        listing.price !== undefined &&
        listing.price !== null &&
        listing.price !== ""
            ? `${listing.price} $`
            : "Prix à discuter";


    /* =====================================================
       LOCALISATION
    ===================================================== */

    const city =
        listing.city ||
        "";


    const neighborhood =
        listing.neighborhood ||
        "";


    const location =
        [city, neighborhood]
            .filter(Boolean)
            .join(" • ");


    /* =====================================================
       CARTE
    ===================================================== */

    card.innerHTML = `

        <div class="favorite-card-image">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                onerror="this.src='assets/images/placeholder.jpg'"
            >

            <button
                class="favorite-remove"
                type="button"
                title="Retirer des favoris"
                data-favorite-id="${escapeHTML(favoriteId)}">

                <i class="fa-solid fa-heart"></i>

            </button>

        </div>


        <div class="favorite-card-content">

            <h3>
                ${escapeHTML(title)}
            </h3>


            <div class="favorite-price">
                ${escapeHTML(price)}
            </div>


            ${
                location
                    ? `
                    <div class="favorite-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHTML(location)}

                    </div>
                    `
                    : ""
            }


            <a
                href="explorer.html?id=${encodeURIComponent(listingId)}"
                class="favorite-view">

                Voir l'annonce

            </a>

        </div>
    `;


    /* =====================================================
       BOUTON RETIRER
    ===================================================== */

    const removeButton =
        card.querySelector(".favorite-remove");


    removeButton.addEventListener(
        "click",
        () => removeFavorite(
            favoriteId,
            card
        )
    );


    favoritesContainer.appendChild(card);
}


/* =========================================================
   RETIRER UN FAVORI
========================================================= */

async function removeFavorite(
    favoriteId,
    card
) {

    try {

        await deleteDoc(
            doc(
                db,
                "favorites",
                favoriteId
            )
        );


        // Supprimer la carte
        card.remove();


        // Mettre à jour le compteur
        const currentCount =
            Number(favoritesCount.textContent) || 0;


        favoritesCount.textContent =
            Math.max(
                0,
                currentCount - 1
            );


        // Afficher le message si plus aucun favori
        if (!favoritesContainer.children.length) {

            favoritesEmpty.hidden = false;
        }


    } catch (error) {

        console.error(
            "Erreur suppression favori :",
            error
        );

        alert(
            "Impossible de retirer cette annonce des favoris."
        );
    }
}


/* =========================================================
   SÉCURITÉ HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "connexion.html";

        return;
    }


    loadFavorites(user);
});

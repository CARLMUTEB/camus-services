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

        // IMPORTANT :
        // La collection s'appelle "favorites"
        const favoritesRef = collection(db, "favorites");

        const q = query(
            favoritesRef,
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        favoritesCount.textContent = snapshot.size;

        if (snapshot.empty) {

            favoritesLoading.hidden = true;
            favoritesEmpty.hidden = false;

            return;
        }


        for (const favoriteDoc of snapshot.docs) {

            const favorite = favoriteDoc.data();

            const serviceId = favorite.serviceId;

            if (!serviceId) continue;


            // Récupérer l'annonce
            const serviceRef = doc(
                db,
                "services",
                serviceId
            );

            const serviceSnapshot = await getDoc(serviceRef);


            if (!serviceSnapshot.exists()) {
                continue;
            }


            const service = serviceSnapshot.data();

            renderFavorite(
                serviceSnapshot.id,
                service,
                favoriteDoc.id
            );
        }


        favoritesLoading.hidden = true;


        // Si aucun document valide
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
                <p>Impossible de charger vos favoris.</p>
            </div>
        `;
    }
}


/* =========================================================
   AFFICHER UNE ANNONCE FAVORITE
========================================================= */

function renderFavorite(
    serviceId,
    service,
    favoriteId
) {

    const card = document.createElement("article");

    card.className = "favorite-card";


    const image =
        service.image ||
        service.imageUrl ||
        service.images?.[0] ||
        "assets/images/placeholder.jpg";


    const title =
        service.title ||
        "Annonce sans titre";


    const price =
        service.price !== undefined &&
        service.price !== null &&
        service.price !== ""
            ? `${service.price} $`
            : "Prix à discuter";


    const city =
        service.city ||
        "";


    const neighborhood =
        service.neighborhood ||
        "";


    const location =
        [city, neighborhood]
            .filter(Boolean)
            .join(" • ");


    card.innerHTML = `

        <div class="favorite-card-image">

            <img
                src="${image}"
                alt="${escapeHTML(title)}"
                onerror="this.src='assets/images/placeholder.jpg'"
            >

            <button
                class="favorite-remove"
                type="button"
                title="Retirer des favoris"
                data-favorite-id="${favoriteId}">

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
                href="explorer.html?id=${encodeURIComponent(serviceId)}"
                class="favorite-view">

                Voir l'annonce

            </a>

        </div>
    `;


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


        card.remove();


        const currentCount =
            Number(favoritesCount.textContent) || 0;


        favoritesCount.textContent =
            Math.max(0, currentCount - 1);


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

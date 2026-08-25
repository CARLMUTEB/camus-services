import { auth, db } from "../config/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";


let currentUser = null;
let unsubscribeFavorites = null;


/* =========================================
   ELEMENTS
========================================= */

const favoritesList =
    document.getElementById("favorites-list");

const favoritesCount =
    document.getElementById("favorites-count");

const messageBox =
    document.getElementById("favorites-message");


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        showError(
            "Vous devez être connecté pour consulter vos favoris."
        );

        setTimeout(() => {

            window.location.href =
                "connexion.html";

        }, 1500);

        return;
    }


    currentUser = user;

    loadFavorites();

});


/* =========================================
   CHARGER FAVORIS
========================================= */

function loadFavorites() {

    if (unsubscribeFavorites) {
        unsubscribeFavorites();
    }


    const favoritesQuery = query(

        collection(
            db,
            "favorites"
        ),

        where(
            "userId",
            "==",
            currentUser.uid
        )

    );


    unsubscribeFavorites =
        onSnapshot(

            favoritesQuery,

            async (snapshot) => {

                favoritesList.innerHTML = "";

                favoritesCount.textContent =
                    snapshot.size;


                if (snapshot.empty) {

                    showEmpty();

                    return;

                }


                for (
                    const favoriteDoc
                    of snapshot.docs
                ) {

                    const favorite =
                        favoriteDoc.data();


                    await displayFavorite(
                        favoriteDoc.id,
                        favorite
                    );

                }

            },

            (error) => {

                console.error(
                    "Erreur favoris :",
                    error
                );


                showError(
                    "Impossible de charger vos favoris."
                );

            }

        );

}


/* =========================================
   AFFICHER FAVORI
========================================= */

async function displayFavorite(
    favoriteId,
    favorite
) {

    let annonce = null;


    try {

        const annonceRef =
            doc(
                db,
                "annonces",
                favorite.annonceId
            );


        const annonceSnap =
            await getDoc(annonceRef);


        if (!annonceSnap.exists()) {

            await deleteDoc(
                doc(
                    db,
                    "favorites",
                    favoriteId
                )
            );

            return;

        }


        annonce =
            annonceSnap.data();


    } catch (error) {

        console.error(error);

        return;

    }


    const card =
        document.createElement("article");


    card.className =
        "favorite-card";


    const image =
        annonce.imageURL ||
        "assets/default-annonce.jpg";


    card.innerHTML = `

        <img
            class="favorite-image"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(annonce.title || "Annonce")}"
            onerror="this.src='assets/default-annonce.jpg'"
        >

        <div class="favorite-body">

            <div class="favorite-title">

                ${escapeHTML(
                    annonce.title ||
                    "Annonce sans titre"
                )}

            </div>

            <div class="favorite-category">

                ${escapeHTML(
                    annonce.category ||
                    "Autre"
                )}

            </div>

            <div class="favorite-price">

                ${formatPrice(
                    annonce.price,
                    annonce.currency
                )}

            </div>

            <div class="favorite-city">

                <i class="fas fa-location-dot"></i>

                ${escapeHTML(
                    annonce.city ||
                    "Ville non indiquée"
                )}

            </div>

            <div class="favorite-actions">

                <button
                    class="view-btn"
                    data-annonce="${favorite.annonceId}"
                >
                    <i class="fas fa-eye"></i>
                    Voir
                </button>

                <button
                    class="remove-btn"
                    data-favorite="${favoriteId}"
                >
                    <i class="fas fa-heart-crack"></i>
                    Retirer
                </button>

            </div>

        </div>

    `;


    /* VOIR */

    card
        .querySelector(".view-btn")
        .addEventListener("click", () => {

            const id =
                favorite.annonceId;

            window.location.href =
                `annonce.html?id=${encodeURIComponent(id)}`;

        });


    /* RETIRER */

    card
        .querySelector(".remove-btn")
        .addEventListener("click", async () => {

            await removeFavorite(
                favoriteId
            );

        });


    favoritesList.appendChild(card);

}


/* =========================================
   RETIRER FAVORI
========================================= */

async function removeFavorite(
    favoriteId
) {

    try {

        await deleteDoc(
            doc(
                db,
                "favorites",
                favoriteId
            )
        );

    } catch (error) {

        console.error(error);

        showError(
            "Impossible de retirer ce favori."
        );

    }

}


/* =========================================
   EMPTY
========================================= */

function showEmpty() {

    favoritesList.innerHTML = `

        <div class="empty-favorites">

            <i class="far fa-heart"></i>

            <h2>
                Aucun favori
            </h2>

            <p>
                Les annonces que vous aimez apparaîtront ici.
            </p>

        </div>

    `;

}


/* =========================================
   PRIX
========================================= */

function formatPrice(
    price,
    currency
) {

    if (
        price === undefined ||
        price === null
    ) {

        return "Prix non indiqué";

    }


    const number =
        Number(price);


    return `${number.toLocaleString("fr-FR")} ${currency || "USD"}`;

}


/* =========================================
   SECURITE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================
   ERREUR
========================================= */

function showError(text) {

    messageBox.textContent =
        text;

    messageBox.className =
        "favorites-message error";

}

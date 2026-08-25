// =========================================================
// CAMU SERVICES — ANNONCES
// =========================================================

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../config/firebase.js";


export async function loadRecentListings() {

    const container =
        document.getElementById(
            "annonces-recentes"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading">
            Chargement des annonces...
        </div>
    `;


    try {

        const annoncesRef =
            collection(db, "annonces");


        const q =
            query(
                annoncesRef,
                where("status", "==", "approved"),
                orderBy("createdAt", "desc"),
                limit(12)
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    Aucune annonce disponible.
                </div>
            `;

            return;
        }


        container.innerHTML = "";


        snapshot.forEach(docSnap => {

            const annonce =
                docSnap.data();

            container.appendChild(
                createAnnonceCard(
                    annonce,
                    docSnap.id
                )
            );
        });


    } catch (error) {

        console.error(
            "Erreur annonces :",
            error
        );


        container.innerHTML = `
            <div class="empty-state">
                Impossible de charger les annonces.
            </div>
        `;
    }
}


function createAnnonceCard(
    annonce,
    id
) {

    const card =
        document.createElement("article");

    card.className =
        "annonce-card";


    const image =
        annonce.image ||
        annonce.images?.[0] ||
        "assets/default-annonce.jpg";


    card.innerHTML = `

        <img
            src="${image}"
            alt="${escapeHTML(
                annonce.title || "Annonce"
            )}"
            onerror="this.src='assets/default-annonce.jpg'"
        >

        <div class="card-body">

            <div class="card-title">
                ${escapeHTML(
                    annonce.title ||
                    "Sans titre"
                )}
            </div>

            <div class="card-price">
                ${escapeHTML(
                    annonce.price
                        ? annonce.price + " USD"
                        : "Prix sur demande"
                )}
            </div>

            <div class="card-meta">

                <span>
                    ${escapeHTML(
                        annonce.city || ""
                    )}
                </span>

                <button
                    class="fav-btn"
                    data-id="${id}"
                    title="Ajouter aux favoris"
                >
                    <i class="far fa-heart"></i>
                </button>

            </div>

        </div>
    `;


    const favorite =
        card.querySelector(".fav-btn");


    favorite.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            favorite.classList.toggle(
                "active"
            );

            const icon =
                favorite.querySelector("i");

            if (
                favorite.classList.contains(
                    "active"
                )
            ) {

                icon.className =
                    "fas fa-heart";

            } else {

                icon.className =
                    "far fa-heart";
            }
        }
    );


    return card;
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

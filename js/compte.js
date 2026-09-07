// =====================================================
// CAMU SERVICES
// COMPTE UTILISATEUR — V1
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


console.log("CAMU SERVICES — compte.js chargé.");


// =====================================================
// ÉLÉMENTS HTML
// =====================================================

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const accountAvatarImage =
    document.getElementById("accountAvatarImage");

const accountAvatarDefault =
    document.getElementById("accountAvatarDefault");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profilePhone =
    document.getElementById("profilePhone");

const profileDescription =
    document.getElementById("profileDescription");

const myAdsContainer =
    document.getElementById("myAdsContainer");

const myAdsCount =
    document.getElementById("myAdsCount");

const myAdsEmpty =
    document.getElementById("myAdsEmpty");

const favoritesCount =
    document.getElementById("favoritesCount");


// =====================================================
// AFFICHER LA PHOTO DE PROFIL
// =====================================================

function displayProfilePhoto(photoURL) {

    if (
        !accountAvatarImage ||
        !accountAvatarDefault
    ) {
        return;
    }

    if (
        photoURL &&
        photoURL.trim() !== ""
    ) {

        accountAvatarImage.src = photoURL;

        accountAvatarImage.style.display =
            "block";

        accountAvatarDefault.style.display =
            "none";

    } else {

        accountAvatarImage.removeAttribute("src");

        accountAvatarImage.style.display =
            "none";

        accountAvatarDefault.style.display =
            "flex";
    }
}


// =====================================================
// CHARGER LE PROFIL
// =====================================================

async function loadUserProfile(user) {

    if (!user) {
        return;
    }

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(userRef);

        let profile = {};

        if (userSnap.exists()) {
            profile = userSnap.data();
        }


        const name =
            profile.name ||
            profile.displayName ||
            user.displayName ||
            "Utilisateur CAMU";


        const email =
            profile.email ||
            user.email ||
            "";


        const phone =
            profile.phone ||
            profile.telephone ||
            user.phoneNumber ||
            "";


        const description =
            profile.description ||
            "";


        const photoURL =
            profile.photoURL ||
            profile.photoUrl ||
            user.photoURL ||
            "";


        // ---------------------------------------------
        // Affichage
        // ---------------------------------------------

        if (accountName) {
            accountName.textContent = name;
        }

        if (accountEmail) {
            accountEmail.textContent = email;
        }

        if (profileName) {
            profileName.textContent = name;
        }

        if (profileEmail) {
            profileEmail.textContent = email;
        }

        if (profilePhone) {
            profilePhone.textContent =
                phone || "Non renseigné";
        }

        if (profileDescription) {
            profileDescription.textContent =
                description ||
                "Aucune description pour le moment.";
        }

        displayProfilePhoto(photoURL);


        console.log(
            "CAMU SERVICES : profil chargé."
        );


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );


        // ---------------------------------------------
        // Solution de secours avec Firebase Auth
        // ---------------------------------------------

        const name =
            user.displayName ||
            "Utilisateur CAMU";

        const email =
            user.email ||
            "";

        const photoURL =
            user.photoURL ||
            "";


        if (accountName) {
            accountName.textContent = name;
        }

        if (accountEmail) {
            accountEmail.textContent = email;
        }

        if (profileName) {
            profileName.textContent = name;
        }

        if (profileEmail) {
            profileEmail.textContent = email;
        }

        displayProfilePhoto(photoURL);
    }
}


// =====================================================
// CHARGER MES ANNONCES
// =====================================================

async function loadMyAds(user) {

    if (
        !user ||
        !myAdsContainer
    ) {
        return;
    }


    try {

        const servicesQuery =
            query(
                collection(
                    db,
                    "services"
                ),
                where(
                    "ownerId",
                    "==",
                    user.uid
                )
            );


        const snapshot =
            await getDocs(
                servicesQuery
            );


        const ads = [];


        snapshot.forEach(
            (document) => {

                ads.push({
                    id: document.id,
                    ...document.data()
                });

            }
        );


        // ---------------------------------------------
        // Trier du plus récent au plus ancien
        // ---------------------------------------------

        ads.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds ||
                    0;

                const dateB =
                    b.createdAt?.seconds ||
                    0;

                return dateB - dateA;
            }
        );


        // ---------------------------------------------
        // Nombre d'annonces
        // ---------------------------------------------

        if (myAdsCount) {

            myAdsCount.textContent =
                ads.length;
        }


        myAdsContainer.innerHTML =
            "";


        // ---------------------------------------------
        // Aucune annonce
        // ---------------------------------------------

        if (ads.length === 0) {

            if (myAdsEmpty) {

                myAdsEmpty.style.display =
                    "block";
            }

            return;
        }


        if (myAdsEmpty) {

            myAdsEmpty.style.display =
                "none";
        }


        // =================================================
        // AFFICHER LES ANNONCES
        // =================================================

        ads.forEach(
            (ad) => {

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "my-ad-card";


                // -----------------------------------------
                // Image
                // -----------------------------------------

                const image =
                    ad.images?.[0] ||
                    ad.imageURL ||
                    ad.imageUrl ||
                    "";


                // -----------------------------------------
                // Titre
                // -----------------------------------------

                const title =
                    ad.title ||
                    "Annonce sans titre";


                // -----------------------------------------
                // Prix
                // -----------------------------------------

                const price =
                    ad.price
                        ? `${formatPrice(ad.price)} ${ad.currency || "USD"}`
                        : "Prix sur demande";


                // -----------------------------------------
                // Localisation
                // -----------------------------------------

                const location =
                    [
                        ad.neighborhood,
                        ad.city
                    ]
                    .filter(Boolean)
                    .join(", ");


                // -----------------------------------------
                // Image HTML
                // -----------------------------------------

                let imageHTML = "";


                if (image) {

                    imageHTML = `
                        <img
                            class="my-ad-image"
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(title)}"
                        >
                    `;

                } else {

                    imageHTML = `
                        <div
                            class="my-ad-image"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#f1f5f9;
                                color:#94a3b8;
                            "
                        >
                            <i
                                class="fa-solid fa-image"
                                style="font-size:35px;"
                            ></i>
                        </div>
                    `;
                }


                // =================================================
                // CARTE
                // =================================================

                card.innerHTML = `

                    ${imageHTML}

                    <div class="my-ad-content">

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <div class="my-ad-price">
                            ${escapeHTML(price)}
                        </div>

                        <div class="my-ad-location">

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHTML(
                                location ||
                                "Localisation non renseignée"
                            )}

                        </div>


                        <!-- ACTIONS -->

                        <div class="my-ad-actions">

                            <a
                                class="my-ad-view"
                                href="explorer.html?id=${encodeURIComponent(ad.id)}"
                            >
                                👁️ Voir
                            </a>


                            <a
                                class="my-ad-edit"
                                href="modifier.html?id=${encodeURIComponent(ad.id)}"
                            >
                                ✏️ Modifier
                            </a>


                            <button
                                type="button"
                                class="my-ad-delete"
                                data-id="${escapeHTML(ad.id)}"
                            >
                                🗑️ Supprimer
                            </button>

                        </div>

                    </div>
                `;


                myAdsContainer.appendChild(
                    card
                );


                // =================================================
                // BOUTON SUPPRIMER
                // =================================================

                const deleteButton =
                    card.querySelector(
                        ".my-ad-delete"
                    );


                if (deleteButton) {

                    deleteButton.addEventListener(
                        "click",
                        async () => {

                            const serviceId =
                                deleteButton.dataset.id;


                            // -------------------------------------
                            // Confirmation
                            // -------------------------------------

                            const confirmation =
                                confirm(
                                    "Voulez-vous vraiment supprimer cette annonce ?\n\nCette action est définitive."
                                );


                            if (!confirmation) {
                                return;
                            }


                            try {

                                deleteButton.disabled =
                                    true;

                                deleteButton.textContent =
                                    "Suppression...";


                                // ---------------------------------
                                // Récupérer l'annonce
                                // ---------------------------------

                                const serviceRef =
                                    doc(
                                        db,
                                        "services",
                                        serviceId
                                    );


                                const serviceSnap =
                                    await getDoc(
                                        serviceRef
                                    );


                                if (
                                    !serviceSnap.exists()
                                ) {

                                    alert(
                                        "Cette annonce n'existe plus."
                                    );

                                    await loadMyAds(
                                        auth.currentUser
                                    );

                                    return;
                                }


                                const serviceData =
                                    serviceSnap.data();


                                // ---------------------------------
                                // Vérification du propriétaire
                                // ---------------------------------

                                if (
                                    serviceData.ownerId !==
                                    auth.currentUser.uid
                                ) {

                                    alert(
                                        "Vous ne pouvez supprimer que vos propres annonces."
                                    );

                                    deleteButton.disabled =
                                        false;

                                    deleteButton.textContent =
                                        "🗑️ Supprimer";

                                    return;
                                }


                                // ---------------------------------
                                // Suppression Firebase
                                // ---------------------------------

                                await deleteDoc(
                                    serviceRef
                                );


                                console.log(
                                    "Annonce supprimée :",
                                    serviceId
                                );


                                alert(
                                    "Annonce supprimée avec succès."
                                );


                                // ---------------------------------
                                // Actualiser la liste
                                // ---------------------------------

                                await loadMyAds(
                                    auth.currentUser
                                );


                            } catch (error) {

                                console.error(
                                    "Erreur suppression annonce :",
                                    error
                                );


                                alert(
                                    "Impossible de supprimer l'annonce."
                                );


                                deleteButton.disabled =
                                    false;

                                deleteButton.textContent =
                                    "🗑️ Supprimer";
                            }

                        }
                    );
                }

            }
        );


        console.log(
            `CAMU SERVICES : ${ads.length} annonce(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );


        myAdsContainer.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#dc2626;
                "
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="
                        font-size:30px;
                        margin-bottom:10px;
                    "
                ></i>

                <p>
                    Impossible de charger vos annonces.
                </p>

            </div>

        `;
    }
}


// =====================================================
// COMPTER LES FAVORIS
// =====================================================

function loadFavoritesCount() {

    if (!favoritesCount) {
        return;
    }


    try {

        const stored =
            localStorage.getItem(
                "camuFavorites"
            );


        const favorites =
            stored
                ? JSON.parse(stored)
                : [];


        if (
            Array.isArray(
                favorites
            )
        ) {

            favoritesCount.textContent =
                favorites.length;

        } else {

            favoritesCount.textContent =
                "0";
        }


    } catch (error) {

        console.error(
            "Erreur favoris :",
            error
        );

        favoritesCount.textContent =
            "0";
    }
}


// =====================================================
// AUTHENTIFICATION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ---------------------------------------------
        // Utilisateur non connecté
        // ---------------------------------------------

        if (!user) {

            console.log(
                "CAMU SERVICES : utilisateur non connecté."
            );


            window.location.href =
                "connexion.html";

            return;
        }


        console.log(
            "CAMU SERVICES : utilisateur connecté :",
            user.email
        );


        // ---------------------------------------------
        // Charger les données
        // ---------------------------------------------

        await loadUserProfile(
            user
        );


        await loadMyAds(
            user
        );


        loadFavoritesCount();

    }
);


// =====================================================
// OUTILS
// =====================================================

function formatPrice(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return String(value);
    }


    return number.toLocaleString(
        "fr-FR"
    );
}


function escapeHTML(value) {

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

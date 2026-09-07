// =========================================================
// CAMU SERVICES — COMPTE.JS
// Gestion de la page Mon compte
// =========================================================

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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const accountLoading =
    document.getElementById("accountLoading");

const accountContent =
    document.getElementById("accountContent");

const accountMessage =
    document.getElementById("accountMessage");

const accountAvatarImage =
    document.getElementById("accountAvatarImage");

const accountAvatarDefault =
    document.getElementById("accountAvatarDefault");

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const accountPhone =
    document.getElementById("accountPhone");

const accountDescription =
    document.getElementById("accountDescription");

const accountInfoName =
    document.getElementById("accountInfoName");

const accountInfoEmail =
    document.getElementById("accountInfoEmail");

const accountInfoPhone =
    document.getElementById("accountInfoPhone");

const myAdsContainer =
    document.getElementById("myAdsContainer");

const myAdsEmpty =
    document.getElementById("myAdsEmpty");

const myAdsCount =
    document.getElementById("myAdsCount");

const myFavoritesContainer =
    document.getElementById("myFavoritesContainer");

const myFavoritesEmpty =
    document.getElementById("myFavoritesEmpty");

const myFavoritesCount =
    document.getElementById("myFavoritesCount");


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message) {

    if (!accountMessage) return;

    accountMessage.textContent = message;
    accountMessage.hidden = false;
}


// =========================================================
// PHOTO DE PROFIL
// =========================================================

function displayProfilePhoto(photoURL) {

    if (!accountAvatarImage ||
        !accountAvatarDefault) {
        return;
    }

    if (photoURL) {

        accountAvatarImage.src = photoURL;
        accountAvatarImage.style.display = "block";

        accountAvatarDefault.style.display = "none";

    } else {

        accountAvatarImage.src = "";
        accountAvatarImage.style.display = "none";

        accountAvatarDefault.style.display = "flex";
    }
}


// =========================================================
// CHARGER LE PROFIL
// =========================================================

async function loadProfile(user) {

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        let profile = {};

        if (userSnap.exists()) {
            profile = userSnap.data();
        }


        // =====================================================
        // INFORMATIONS
        // =====================================================

        const name =
            profile.name ||
            user.displayName ||
            "Utilisateur";


        const email =
            profile.email ||
            user.email ||
            "—";


        const phone =
            profile.phone ||
            user.phoneNumber ||
            "—";


        const description =
            profile.description ||
            "Aucune description pour le moment.";


        const photoURL =
            profile.photoURL ||
            profile.photoUrl ||
            user.photoURL ||
            "";


        // =====================================================
        // AFFICHAGE
        // =====================================================

        if (accountName) {
            accountName.textContent = name;
        }

        if (accountEmail) {
            accountEmail.textContent = email;
        }

        if (accountPhone) {
            accountPhone.textContent = phone;
        }

        if (accountDescription) {
            accountDescription.textContent = description;
        }


        if (accountInfoName) {
            accountInfoName.textContent = name;
        }

        if (accountInfoEmail) {
            accountInfoEmail.textContent = email;
        }

        if (accountInfoPhone) {
            accountInfoPhone.textContent = phone;
        }


        // Photo

        console.log(
            "CAMU SERVICES — Photo de profil :",
            photoURL || "Aucune photo"
        );

        displayProfilePhoto(photoURL);


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );

        showMessage(
            "Impossible de charger certaines informations du profil."
        );
    }
}


// =========================================================
// CHARGER MES ANNONCES
// =========================================================

async function loadMyAds(user) {

    if (!myAdsContainer) return;

    try {

        const servicesRef =
            collection(db, "services");

        const q =
            query(
                servicesRef,
                where("ownerId", "==", user.uid)
            );

        const snapshot =
            await getDocs(q);

        const ads = [];

        snapshot.forEach((item) => {

            ads.push({
                id: item.id,
                ...item.data()
            });

        });


        // Trier du plus récent au plus ancien

        ads.sort((a, b) => {

            const dateA =
                a.createdAt?.seconds ||
                0;

            const dateB =
                b.createdAt?.seconds ||
                0;

            return dateB - dateA;
        });


        // Nombre

        if (myAdsCount) {
            myAdsCount.textContent = ads.length;
        }


        // Vider

        myAdsContainer.innerHTML = "";


        // Aucun résultat

        if (ads.length === 0) {

            myAdsContainer.hidden = true;

            if (myAdsEmpty) {
                myAdsEmpty.hidden = false;
            }

            return;
        }


        myAdsContainer.hidden = false;

        if (myAdsEmpty) {
            myAdsEmpty.hidden = true;
        }


        // Afficher maximum 8

        ads.slice(0, 8).forEach((ad) => {

            myAdsContainer.appendChild(
                createAdCard(ad)
            );

        });


    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );

        if (myAdsCount) {
            myAdsCount.textContent = "0";
        }

        myAdsContainer.innerHTML = `
            <p>
                Impossible de charger vos annonces.
            </p>
        `;
    }
}


// =========================================================
// CREER CARTE ANNONCE
// =========================================================

function createAdCard(ad) {

    const card =
        document.createElement("article");

    card.className =
        "account-ad-card";


    // =====================================================
    // IMAGE
    // =====================================================

    let imageURL =
        "https://placehold.co/600x400?text=CAMU+SERVICES";


    if (
        Array.isArray(ad.images) &&
        ad.images.length > 0
    ) {

        imageURL =
            ad.images[0];

    } else if (ad.imageURL) {

        imageURL =
            ad.imageURL;

    } else if (ad.imageUrl) {

        imageURL =
            ad.imageUrl;
    }


    // =====================================================
    // PRIX
    // =====================================================

    let price = "";

    if (
        ad.price !== undefined &&
        ad.price !== null &&
        ad.price !== ""
    ) {

        const number =
            Number(ad.price);

        if (!isNaN(number)) {

            price =
                number.toLocaleString("fr-FR");

        } else {

            price = ad.price;
        }


        if (ad.currency) {
            price += ` ${ad.currency}`;
        }
    }


    // =====================================================
    // STATUS
    // =====================================================

    const status =
        ad.status ||
        "active";


    // =====================================================
    // HTML
    // =====================================================

    card.innerHTML = `

        <a
            href="explorer.html?id=${encodeURIComponent(ad.id)}"
            class="account-ad-link"
        >

            <img
                src="${escapeHTML(imageURL)}"
                alt="${escapeHTML(ad.title || "Annonce")}"
                class="account-ad-image"
                loading="lazy"
                onerror="this.src='https://placehold.co/600x400?text=CAMU+SERVICES'"
            >


            <div class="account-ad-content">

                ${
                    ad.category
                    ?
                    `
                    <div class="account-ad-category">
                        ${escapeHTML(ad.category)}
                    </div>
                    `
                    :
                    ""
                }


                <h3 class="account-ad-title">
                    ${escapeHTML(
                        ad.title ||
                        "Sans titre"
                    )}
                </h3>


                ${
                    price
                    ?
                    `
                    <div class="account-ad-price">
                        ${escapeHTML(price)}
                    </div>
                    `
                    :
                    ""
                }


                <div class="account-ad-location">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHTML(
                            ad.city ||
                            "Localisation non précisée"
                        )}
                    </span>

                </div>


                ${
                    ad.neighborhood
                    ?
                    `
                    <div class="account-ad-location">

                        <i class="fa-solid fa-map-pin"></i>

                        <span>
                            ${escapeHTML(ad.neighborhood)}
                        </span>

                    </div>
                    `
                    :
                    ""
                }


                <span class="account-ad-status">
                    ${escapeHTML(status)}
                </span>

            </div>

        </a>
    `;


    return card;
}


// =========================================================
// FAVORIS
// =========================================================

function loadFavorites() {

    if (!myFavoritesContainer) {
        return;
    }


    let favorites = [];

    try {

        favorites =
            JSON.parse(
                localStorage.getItem("camuFavorites")
            ) || [];

    } catch (error) {

        favorites = [];
    }


    if (myFavoritesCount) {
        myFavoritesCount.textContent =
            favorites.length;
    }


    myFavoritesContainer.innerHTML = "";


    if (favorites.length === 0) {

        myFavoritesContainer.hidden = true;

        if (myFavoritesEmpty) {
            myFavoritesEmpty.hidden = false;
        }

        return;
    }


    myFavoritesContainer.hidden = false;

    if (myFavoritesEmpty) {
        myFavoritesEmpty.hidden = true;
    }


    /*
     * Pour la V1, les favoris sont conservés
     * dans localStorage.
     *
     * Le système pourra ensuite être remplacé
     * par une collection Firestore "favoris".
     */


    favorites.slice(0, 4).forEach((favorite) => {

        const id =
            typeof favorite === "string"
                ? favorite
                : favorite.id;


        if (!id) return;


        const card =
            document.createElement("article");

        card.className =
            "account-ad-card";


        card.innerHTML = `

            <a
                href="explorer.html?id=${encodeURIComponent(id)}"
                class="account-ad-link"
            >

                <div
                    class="account-ad-image"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:30px;
                        color:#64748b;
                    "
                >
                    <i class="fa-solid fa-heart"></i>
                </div>


                <div class="account-ad-content">

                    <h3 class="account-ad-title">
                        Annonce enregistrée
                    </h3>

                    <div class="account-ad-location">

                        <i class="fa-solid fa-arrow-right"></i>

                        <span>
                            Voir l'annonce
                        </span>

                    </div>

                </div>

            </a>

        `;


        myFavoritesContainer.appendChild(card);

    });
}


// =========================================================
// SECURITE HTML
// =========================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

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
// AUTHENTIFICATION
// =========================================================

onAuthStateChanged(auth, async (user) => {

    console.log(
        "CAMU SERVICES — compte.js :",
        user
            ? `Utilisateur connecté : ${user.email}`
            : "Aucun utilisateur connecté"
    );


    // =====================================================
    // PAS CONNECTE
    // =====================================================

    if (!user) {

        window.location.href =
            "connexion.html";

        return;
    }


    try {

        // Charger profil

        await loadProfile(user);


        // Charger annonces

        await loadMyAds(user);


        // Charger favoris

        loadFavorites();


        // Afficher page

        if (accountLoading) {
            accountLoading.hidden = true;
        }

        if (accountContent) {
            accountContent.hidden = false;
        }


    } catch (error) {

        console.error(
            "Erreur compte :",
            error
        );

        if (accountLoading) {
            accountLoading.hidden = true;
        }

        showMessage(
            "Une erreur est survenue lors du chargement du compte."
        );
    }

});


// =========================================================
// MODIFIER LE PROFIL
// =========================================================

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );


if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        () => {

            /*
             * La modification complète du profil
             * reste gérée par auth.js.
             *
             * Cette partie pourra ensuite être remplacée
             * par une vraie fenêtre de modification.
             */

            const name =
                prompt(
                    "Entrez votre nouveau nom :",
                    accountName?.textContent || ""
                );


            if (
                name !== null &&
                name.trim() !== ""
            ) {

                /*
                 * Pour le moment, on demande à auth.js
                 * de gérer la mise à jour.
                 *
                 * La fonctionnalité complète sera centralisée
                 * ensuite si nécessaire.
                 */

                window.dispatchEvent(
                    new CustomEvent(
                        "camu-edit-profile",
                        {
                            detail: {
                                name: name.trim()
                            }
                        }
                    )
                );
            }

        }
    );
}


// =========================================================
// PHOTO DE PROFIL
// =========================================================

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async (event) => {

            /*
             * La gestion réelle de l'upload est effectuée
             * dans auth.js.
             *
             * On affiche simplement un aperçu local
             * immédiatement.
             */

            const file =
                event.target.files?.[0];


            if (!file) return;


            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Veuillez sélectionner une image."
                );

                profilePhotoInput.value = "";

                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "La photo ne doit pas dépasser 5 MB."
                );

                profilePhotoInput.value = "";

                return;
            }


            const localURL =
                URL.createObjectURL(file);


            displayProfilePhoto(localURL);


            console.log(
                "CAMU SERVICES — aperçu photo chargé."
            );

        }
    );
}


console.log(
    "CAMU SERVICES — compte.js chargé correctement."
);

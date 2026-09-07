/* =========================================================
   CAMU SERVICES — COMPTE.JS
========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


console.log("CAMU SERVICES — compte.js chargé.");


/* =========================================================
   ÉLÉMENTS
========================================================= */

const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");

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

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const editProfileButton =
    document.getElementById("editProfileButton");

const logoutButton =
    document.getElementById("logoutButton");

const myAdsContainer =
    document.getElementById("myAdsContainer");

const myAdsCount =
    document.getElementById("myAdsCount");

const favoritesCount =
    document.getElementById("favoritesCount");

const myAdsEmpty =
    document.getElementById("myAdsEmpty");


/* =========================================================
   AFFICHER PHOTO
========================================================= */

function displayProfilePhoto(photoURL) {

    if (!accountAvatarImage ||
        !accountAvatarDefault) {
        return;
    }

    if (photoURL && photoURL.trim() !== "") {

        accountAvatarImage.src = photoURL;

        accountAvatarImage.style.display = "block";

        accountAvatarDefault.style.display = "none";

    } else {

        accountAvatarImage.removeAttribute("src");

        accountAvatarImage.style.display = "none";

        accountAvatarDefault.style.display = "flex";
    }
}


/* =========================================================
   CHARGER PROFIL
========================================================= */

async function loadUserProfile(user) {

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        let data = {};

        if (userSnap.exists()) {
            data = userSnap.data();
        }


        const name =
            data.name ||
            data.displayName ||
            user.displayName ||
            "Utilisateur CAMU";


        const email =
            data.email ||
            user.email ||
            "";


        const phone =
            data.phone ||
            data.telephone ||
            "Non renseigné";


        const description =
            data.description ||
            "Non renseignée";


        const photoURL =
            data.photoURL ||
            data.photoUrl ||
            user.photoURL ||
            "";


        /* Nom */

        if (accountName) {
            accountName.textContent = name;
        }

        if (profileName) {
            profileName.textContent = name;
        }


        /* Email */

        if (accountEmail) {
            accountEmail.textContent = email;
        }

        if (profileEmail) {
            profileEmail.textContent = email;
        }


        /* Téléphone */

        if (profilePhone) {
            profilePhone.textContent = phone;
        }


        /* Description */

        if (profileDescription) {
            profileDescription.textContent =
                description;
        }


        /* Photo */

        displayProfilePhoto(photoURL);


        console.log(
            "Photo de profil :",
            photoURL || "Aucune photo"
        );


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );

        if (accountName) {
            accountName.textContent =
                user.displayName ||
                "Utilisateur CAMU";
        }

        if (accountEmail) {
            accountEmail.textContent =
                user.email || "";
        }

        displayProfilePhoto(
            user.photoURL || ""
        );
    }
}


/* =========================================================
   CHARGER MES ANNONCES
========================================================= */

async function loadMyAds(user) {

    if (!myAdsContainer) {
        return;
    }

    try {

        const servicesRef =
            collection(db, "services");

        const servicesQuery =
            query(
                servicesRef,
                where("ownerId", "==", user.uid)
            );

        const snapshot =
            await getDocs(servicesQuery);


        const ads = [];


        snapshot.forEach((item) => {

            ads.push({
                id: item.id,
                ...item.data()
            });

        });


        /* Tri par date */

        ads.sort((a, b) => {

            const dateA =
                a.createdAt?.seconds || 0;

            const dateB =
                b.createdAt?.seconds || 0;

            return dateB - dateA;

        });


        if (myAdsCount) {
            myAdsCount.textContent =
                ads.length;
        }


        myAdsContainer.innerHTML = "";


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


        ads.forEach((ad) => {

            const card =
                document.createElement("article");

            card.className =
                "my-ad-card";


            const image =
                ad.images?.[0] ||
                ad.imageURL ||
                ad.imageUrl ||
                "";


            const imageHTML =
                image
                    ? `
                        <img
                            class="my-ad-image"
                            src="${image}"
                            alt="${escapeHTML(ad.title || "Annonce")}"
                        >
                      `
                    : `
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
                            <i class="fa-solid fa-image"
                               style="font-size:35px;">
                            </i>
                        </div>
                      `;


            const price =
                ad.price
                    ? `${formatPrice(ad.price)} ${ad.currency || "USD"}`
                    : "Prix sur demande";


            const location =
                [
                    ad.neighborhood,
                    ad.city
                ]
                .filter(Boolean)
                .join(", ");


            card.innerHTML = `

                ${imageHTML}

                <div class="my-ad-content">

                    <h3>
                        ${escapeHTML(
                            ad.title || "Sans titre"
                        )}
                    </h3>

                    <div class="my-ad-price">
                        ${escapeHTML(price)}
                    </div>

                    <div class="my-ad-location">

                        <i class="fa-solid fa-location-dot"></i>

                        ${escapeHTML(
                            location || "Localisation non renseignée"
                        )}

                    </div>

                    <div class="my-ad-actions">

                        <a
                            href="explorer.html?id=${encodeURIComponent(ad.id)}"
                        >
                            Voir
                        </a>

                    </div>

                </div>
            `;


            myAdsContainer.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );

        myAdsContainer.innerHTML = `
            <p style="
                padding:20px;
                color:#dc2626;
            ">
                Impossible de charger vos annonces.
            </p>
        `;
    }
}


/* =========================================================
   FAVORIS
========================================================= */

function loadFavoritesCount() {

    if (!favoritesCount) {
        return;
    }

    try {

        const favorites =
            JSON.parse(
                localStorage.getItem("camuFavorites")
            ) || [];

        favoritesCount.textContent =
            Array.isArray(favorites)
                ? favorites.length
                : 0;

    } catch (error) {

        favoritesCount.textContent = "0";

    }
}


/* =========================================================
   MODIFIER PROFIL
========================================================= */

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;

            if (!user) {
                return;
            }


            const currentName =
                user.displayName || "";


            const newName =
                prompt(
                    "Votre nom :",
                    currentName
                );


            if (
                newName === null ||
                newName.trim() === ""
            ) {
                return;
            }


            try {

                await updateProfile(
                    user,
                    {
                        displayName:
                            newName.trim()
                    }
                );


                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name:
                            newName.trim(),

                        displayName:
                            newName.trim(),

                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                await loadUserProfile(user);


                alert(
                    "Votre profil a été mis à jour."
                );


            } catch (error) {

                console.error(
                    "Erreur modification profil :",
                    error
                );

                alert(
                    "Impossible de modifier votre profil."
                );

            }

        }
    );
}


/* =========================================================
   CHANGER PHOTO
   NOTE :
   L'UPLOAD CLOUDINARY EST GÉRÉ DANS auth.js
   SI auth.js ÉCOUTE profilePhotoInput.
========================================================= */

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        () => {

            const file =
                profilePhotoInput.files?.[0];

            if (!file) {
                return;
            }

            console.log(
                "Nouvelle photo sélectionnée :",
                file.name
            );

        }
    );
}


/* =========================================================
   DÉCONNEXION
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await auth.signOut();

                window.location.href =
                    "connexion.html";

            } catch (error) {

                console.error(
                    "Erreur déconnexion :",
                    error
                );

                alert(
                    "Impossible de se déconnecter."
                );
            }

        }
    );
}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "connexion.html";

            return;
        }


        console.log(
            "Compte connecté :",
            user.email
        );


        await loadUserProfile(user);

        await loadMyAds(user);

        loadFavoritesCount();

    }
);


/* =========================================================
   OUTILS
========================================================= */

function formatPrice(value) {

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return number.toLocaleString(
        "fr-FR"
    );
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

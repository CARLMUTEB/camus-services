// =====================================================
// CAMU SERVICES
// COMPTE UTILISATEUR — V1
// =====================================================

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


/* =====================================================
   ÉLÉMENTS HTML
===================================================== */

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

const editProfileButton =
    document.getElementById("editProfileButton");


/* =====================================================
   AFFICHER LA PHOTO
===================================================== */

function displayProfilePhoto(photoURL) {

    if (!accountAvatarImage ||
        !accountAvatarDefault) {
        return;
    }

    if (photoURL && photoURL.trim() !== "") {

        accountAvatarImage.src = photoURL;
        accountAvatarImage.style.display = "block";

        accountAvatarDefault.style.display = "none";

        console.log(
            "Photo de profil affichée."
        );

    } else {

        accountAvatarImage.removeAttribute("src");
        accountAvatarImage.style.display = "none";

        accountAvatarDefault.style.display = "flex";

        console.log(
            "Aucune photo de profil."
        );
    }
}


/* =====================================================
   CHARGER LE PROFIL
===================================================== */

async function loadUserProfile(user) {

    if (!user) return;

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        let profile = {};

        if (userSnap.exists()) {
            profile = userSnap.data();
        }


        /* Nom */

        const name =
            profile.name ||
            profile.displayName ||
            user.displayName ||
            "Utilisateur CAMU";


        /* Email */

        const email =
            profile.email ||
            user.email ||
            "";


        /* Téléphone */

        const phone =
            profile.phone ||
            profile.telephone ||
            user.phoneNumber ||
            "";


        /* Description */

        const description =
            profile.description ||
            "";


        /* Photo */

        const photoURL =
            profile.photoURL ||
            profile.photoUrl ||
            user.photoURL ||
            "";


        /* =========================
           AFFICHAGE
        ========================= */

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
            "CAMU SERVICES : profil chargé.",
            {
                name,
                email,
                phone,
                photoURL
            }
        );


    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );


        /* Même si Firestore échoue,
           on utilise Firebase Auth */

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


/* =====================================================
   CHARGER MES ANNONCES
===================================================== */

async function loadMyAds(user) {

    if (!user || !myAdsContainer) {
        return;
    }

    try {

        const servicesQuery = query(
            collection(db, "services"),
            where("ownerId", "==", user.uid)
        );


        const snapshot =
            await getDocs(servicesQuery);


        const ads = [];


        snapshot.forEach((document) => {

            ads.push({
                id: document.id,
                ...document.data()
            });

        });


        /* Tri : plus récente en premier */

        ads.sort((a, b) => {

            const dateA =
                a.createdAt?.seconds || 0;

            const dateB =
                b.createdAt?.seconds || 0;

            return dateB - dateA;
        });


        /* Nombre d'annonces */

        if (myAdsCount) {
            myAdsCount.textContent =
                ads.length;
        }


        myAdsContainer.innerHTML = "";


        /* Aucune annonce */

        if (ads.length === 0) {

            if (myAdsEmpty) {
                myAdsEmpty.style.display =
                    "block";
            }

            return;
        }


        /* Il y a des annonces */

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


            const title =
                ad.title ||
                "Annonce sans titre";


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


            myAdsContainer.appendChild(card);

        });


        console.log(
            `CAMU SERVICES : ${ads.length} annonce(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "Erreur chargement annonces :",
            error
        );


        myAdsContainer.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
                color:#dc2626;
            ">

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="font-size:30px;margin-bottom:10px;"
                ></i>

                <p>
                    Impossible de charger vos annonces.
                </p>

            </div>

        `;
    }
}


/* =====================================================
   COMPTER LES FAVORIS
===================================================== */

function loadFavoritesCount() {

    if (!favoritesCount) {
        return;
    }

    try {

        const stored =
            localStorage.getItem("camuFavorites");

        const favorites =
            stored
                ? JSON.parse(stored)
                : [];


        if (Array.isArray(favorites)) {

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


/* =====================================================
   MODIFIER LE PROFIL
===================================================== */

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) {

                window.location.href =
                    "connexion.html";

                return;
            }


            try {

                /* Récupérer les données actuelles */

                const snapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );


                const profile =
                    snapshot.exists()
                        ? snapshot.data()
                        : {};


                const currentName =
                    profile.name ||
                    user.displayName ||
                    "";


                const currentPhone =
                    profile.phone ||
                    "";


                const currentDescription =
                    profile.description ||
                    "";


                /* Nom */

                const newName =
                    prompt(
                        "Votre nom :",
                        currentName
                    );


                if (newName === null) {
                    return;
                }


                const cleanName =
                    newName.trim();


                if (!cleanName) {

                    alert(
                        "Le nom ne peut pas être vide."
                    );

                    return;
                }


                /* Téléphone */

                const newPhone =
                    prompt(
                        "Votre numéro WhatsApp / téléphone :",
                        currentPhone
                    );


                if (newPhone === null) {
                    return;
                }


                /* Description */

                const newDescription =
                    prompt(
                        "Votre description :",
                        currentDescription
                    );


                if (newDescription === null) {
                    return;
                }


                /* Firebase Auth */

                await updateProfile(
                    user,
                    {
                        displayName:
                            cleanName
                    }
                );


                /* Firestore */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name:
                            cleanName,

                        displayName:
                            cleanName,

                        phone:
                            newPhone.trim(),

                        description:
                            newDescription.trim(),

                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                /* Rafraîchir */

                await loadUserProfile(user);


                alert(
                    "Votre profil a été mis à jour avec succès."
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


/* =====================================================
   AUTHENTIFICATION
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

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


        /*
         * Charger les différentes données
         */

        await loadUserProfile(user);

        await loadMyAds(user);

        loadFavoritesCount();

    }
);


/* =====================================================
   OUTILS
===================================================== */

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

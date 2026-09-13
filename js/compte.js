// =====================================================
// CAMU SERVICES
// COMPTE UTILISATEUR — V3
// Profil + Annonces + Favoris + Abonnement
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
    deleteDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// INITIALISATION
// =====================================================

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
// ÉLÉMENTS ABONNEMENT
// =====================================================

const subscriptionCard =
    document.getElementById("subscriptionCard");

const subscriptionPlan =
    document.getElementById("subscriptionPlan");

const subscriptionInfo =
    document.getElementById("subscriptionInfo");

const subscriptionDays =
    document.getElementById("subscriptionDays");

const subscriptionButton =
    document.getElementById("subscriptionButton");


// =====================================================
// NAVIGATION PREMIUM
// =====================================================

function goToPremium(event) {

    if (event) {
        event.preventDefault();
    }

    console.log(
        "CAMU SERVICES : ouverture de la page Premium..."
    );

    window.location.href = "premium.html";
}


// =====================================================
// CONFIGURER LE BOUTON PREMIUM
// =====================================================

function setupPremiumButton() {

    if (!subscriptionButton) {

        console.warn(
            "CAMU SERVICES : bouton Premium introuvable."
        );

        return;
    }

    // Toujours conserver l'adresse correcte
    subscriptionButton.setAttribute(
        "href",
        "premium.html"
    );

    // Éviter plusieurs écouteurs
    subscriptionButton.onclick = goToPremium;

}


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
        String(photoURL).trim() !== ""
    ) {

        accountAvatarImage.src =
            photoURL;

        accountAvatarImage.style.display =
            "block";

        accountAvatarDefault.style.display =
            "none";

    } else {

        accountAvatarImage.removeAttribute(
            "src"
        );

        accountAvatarImage.style.display =
            "none";

        accountAvatarDefault.style.display =
            "flex";
    }
}


// =====================================================
// FORMATTER UNE DATE
// =====================================================

function formatDate(date) {

    if (!date) {
        return "";
    }

    const dateObject =
        date instanceof Date
            ? date
            : new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {
        return "";
    }

    return dateObject.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// =====================================================
// CONVERTIR UNE DATE FIRESTORE
// =====================================================

function firestoreDateToDate(value) {

    if (!value) {
        return null;
    }

    // Timestamp Firestore
    if (
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    // Date JavaScript
    if (
        value instanceof Date
    ) {
        return value;
    }

    // Millisecondes
    if (
        typeof value === "number"
    ) {

        const date =
            new Date(value);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    // String / autre
    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


// =====================================================
// CALCULER LES JOURS RESTANTS
// =====================================================

function getRemainingDays(endDate) {

    if (!endDate) {
        return 0;
    }

    const now =
        new Date();

    const end =
        firestoreDateToDate(
            endDate
        );

    if (!end) {
        return 0;
    }

    const difference =
        end.getTime() -
        now.getTime();

    if (difference <= 0) {
        return 0;
    }

    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );
}


// =====================================================
// AFFICHER L'ABONNEMENT
// =====================================================

async function displaySubscription(
    profile,
    user
) {

    if (!subscriptionCard) {

        console.warn(
            "CAMU SERVICES : carte abonnement introuvable."
        );

        return;
    }

    let plan =
        profile.plan ||
        "basic";

    let status =
        profile.subscriptionStatus ||
        "none";

    const trialEnd =
        profile.trialEnd ||
        null;

    const trialStart =
        profile.trialStart ||
        null;


    // =================================================
    // CONVERSION DES DATES
    // =================================================

    const endDate =
        firestoreDateToDate(
            trialEnd
        );

    const startDate =
        firestoreDateToDate(
            trialStart
        );


    // =================================================
    // VÉRIFIER EXPIRATION ESSAI
    // =================================================

    if (
        status === "trial" &&
        endDate
    ) {

        const now =
            new Date();

        if (
            now.getTime() >=
            endDate.getTime()
        ) {

            console.log(
                "CAMU SERVICES : essai Premium expiré."
            );

            plan =
                "basic";

            status =
                "expired";

            try {

                await updateDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        plan: "basic",

                        subscriptionStatus:
                            "expired",

                        updatedAt:
                            serverTimestamp()
                    }
                );

                console.log(
                    "CAMU SERVICES : utilisateur passé en Basic."
                );

            } catch (error) {

                console.error(
                    "Impossible de mettre à jour le statut :",
                    error
                );
            }
        }
    }


    // =================================================
    // PREMIUM — ESSAI GRATUIT
    // =================================================

    if (
        plan === "premium" &&
        status === "trial"
    ) {

        const remainingDays =
            getRemainingDays(
                endDate
            );

        subscriptionPlan.textContent =
            "Premium";


        subscriptionInfo.innerHTML = `

            <div class="subscription-status premium-status">

                <i class="fa-solid fa-gift"></i>

                <span>
                    Essai Premium gratuit de 3 mois
                </span>

            </div>

            ${
                startDate
                    ? `
                        <div class="subscription-date">

                            Début :

                            <strong>
                                ${formatDate(startDate)}
                            </strong>

                        </div>
                    `
                    : ""
            }

            ${
                endDate
                    ? `
                        <div class="subscription-date">

                            Expire le :

                            <strong>
                                ${formatDate(endDate)}
                            </strong>

                        </div>
                    `
                    : ""
            }

        `;


        // JOURS RESTANTS

        if (
            remainingDays > 0
        ) {

            subscriptionDays.innerHTML = `

                <i class="fa-solid fa-clock"></i>

                <strong>
                    ${remainingDays}
                </strong>

                ${
                    remainingDays === 1
                        ? "jour restant"
                        : "jours restants"
                }

            `;

        } else {

            subscriptionDays.innerHTML = `

                <i class="fa-solid fa-circle-exclamation"></i>

                Essai Premium terminé

            `;
        }


        // BOUTON

        if (subscriptionButton) {

            subscriptionButton.innerHTML = `

                <i class="fa-solid fa-crown"></i>

                Découvrir Premium

            `;

            setupPremiumButton();
        }


        subscriptionCard.classList.add(
            "subscription-premium"
        );

        return;
    }


    // =================================================
    // PREMIUM PAYANT
    // =================================================

    if (
        plan === "premium" &&
        (
            status === "active" ||
            status === "paid"
        )
    ) {

        subscriptionPlan.textContent =
            "Premium";


        subscriptionInfo.innerHTML = `

            <div class="subscription-status premium-status">

                <i class="fa-solid fa-circle-check"></i>

                <span>
                    Abonnement Premium actif
                </span>

            </div>

        `;


        subscriptionDays.innerHTML = `

            <i class="fa-solid fa-crown"></i>

            Vous bénéficiez actuellement
            des avantages Premium.

        `;


        if (subscriptionButton) {

            subscriptionButton.innerHTML = `

                <i class="fa-solid fa-gear"></i>

                Gérer mon abonnement

            `;

            setupPremiumButton();
        }


        subscriptionCard.classList.add(
            "subscription-premium"
        );

        return;
    }


    // =================================================
    // BASIC
    // =================================================

    subscriptionPlan.textContent =
        "Basic";


    subscriptionInfo.innerHTML = `

        <div class="subscription-status basic-status">

            <i class="fa-solid fa-circle-check"></i>

            <span>
                Formule gratuite
            </span>

        </div>

        <div class="subscription-date">

            Vous utilisez actuellement
            la formule Basic.

        </div>

    `;


    subscriptionDays.innerHTML = `

        <i class="fa-solid fa-star"></i>

        Passez à Premium pour obtenir
        plus de fonctionnalités.

    `;


    if (subscriptionButton) {

        subscriptionButton.innerHTML = `

            <i class="fa-solid fa-crown"></i>

            Passer à Premium

        `;

        setupPremiumButton();
    }


    subscriptionCard.classList.add(
        "subscription-basic"
    );
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
            await getDoc(
                userRef
            );

        let profile = {};

        if (
            userSnap.exists()
        ) {

            profile =
                userSnap.data();
        }


        // =================================================
        // DONNÉES
        // =================================================

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


        // =================================================
        // AFFICHAGE
        // =================================================

        if (accountName) {

            accountName.textContent =
                name;
        }

        if (accountEmail) {

            accountEmail.textContent =
                email;
        }

        if (profileName) {

            profileName.textContent =
                name;
        }

        if (profileEmail) {

            profileEmail.textContent =
                email;
        }

        if (profilePhone) {

            profilePhone.textContent =
                phone ||
                "Non renseigné";
        }

        if (profileDescription) {

            profileDescription.textContent =
                description ||
                "Aucune description pour le moment.";
        }


        // =================================================
        // PHOTO
        // =================================================

        displayProfilePhoto(
            photoURL
        );


        // =================================================
        // ABONNEMENT
        // =================================================

        await displaySubscription(
            profile,
            user
        );


        console.log(
            "CAMU SERVICES : profil chargé."
        );

    } catch (error) {

        console.error(
            "Erreur chargement profil :",
            error
        );


        // =================================================
        // SECOURS
        // =================================================

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

            accountName.textContent =
                name;
        }

        if (accountEmail) {

            accountEmail.textContent =
                email;
        }

        if (profileName) {

            profileName.textContent =
                name;
        }

        if (profileEmail) {

            profileEmail.textContent =
                email;
        }


        displayProfilePhoto(
            photoURL
        );


        // =================================================
        // ABONNEMENT PAR DÉFAUT
        // =================================================

        if (subscriptionPlan) {

            subscriptionPlan.textContent =
                "Basic";
        }

        if (subscriptionInfo) {

            subscriptionInfo.innerHTML = `

                <div class="subscription-status basic-status">

                    <i class="fa-solid fa-circle-check"></i>

                    <span>
                        Formule gratuite
                    </span>

                </div>

            `;
        }

        if (subscriptionDays) {

            subscriptionDays.textContent =
                "Passez à Premium pour plus de fonctionnalités.";
        }

        // Même en cas d'erreur Firestore,
        // le bouton Premium reste fonctionnel.
        setupPremiumButton();
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

        const annoncesQuery =
            query(
                collection(
                    db,
                    "annonces"
                ),
                where(
                    "ownerId",
                    "==",
                    user.uid
                )
            );

        const snapshot =
            await getDocs(
                annoncesQuery
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


        // =================================================
        // TRI
        // =================================================

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


        // =================================================
        // NOMBRE
        // =================================================

        if (myAdsCount) {

            myAdsCount.textContent =
                ads.length;
        }


        myAdsContainer.innerHTML =
            "";


        // =================================================
        // AUCUNE ANNONCE
        // =================================================

        if (
            ads.length === 0
        ) {

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


                // IMAGE

                const image =
                    ad.images?.[0] ||
                    ad.imageURL ||
                    ad.imageUrl ||
                    "";


                // TITRE

                const title =
                    ad.title ||
                    "Annonce sans titre";


                // PRIX

                const price =
                    ad.price !== undefined &&
                    ad.price !== null &&
                    ad.price !== ""
                        ? `${formatPrice(ad.price)} ${ad.currency || "USD"}`
                        : "Prix sur demande";


                // LOCALISATION

                const location =
                    [
                        ad.neighborhood,
                        ad.city
                    ]
                    .filter(Boolean)
                    .join(", ");


                // =================================================
                // IMAGE HTML
                // =================================================

                let imageHTML =
                    "";

                if (image) {

                    imageHTML = `

                        <img
                            class="my-ad-image"
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(title)}"
                            loading="lazy"
                            onerror="this.style.display='none';"
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
                // SUPPRESSION
                // =================================================

                const deleteButton =
                    card.querySelector(
                        ".my-ad-delete"
                    );

                if (deleteButton) {

                    deleteButton.addEventListener(
                        "click",
                        async () => {

                            const annonceId =
                                deleteButton.dataset.id;


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


                                const annonceRef =
                                    doc(
                                        db,
                                        "annonces",
                                        annonceId
                                    );


                                const annonceSnap =
                                    await getDoc(
                                        annonceRef
                                    );


                                if (
                                    !annonceSnap.exists()
                                ) {

                                    alert(
                                        "Cette annonce n'existe plus."
                                    );

                                    await loadMyAds(
                                        auth.currentUser
                                    );

                                    return;
                                }


                                const annonceData =
                                    annonceSnap.data();


                                if (
                                    annonceData.ownerId !==
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


                                await deleteDoc(
                                    annonceRef
                                );


                                console.log(
                                    "Annonce supprimée :",
                                    annonceId
                                );


                                alert(
                                    "Annonce supprimée avec succès."
                                );


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

        // =================================================
        // NON CONNECTÉ
        // =================================================

        if (!user) {

            console.log(
                "CAMU SERVICES : utilisateur non connecté."
            );

            window.location.href =
                "connexion.html";

            return;
        }


        // =================================================
        // CONNECTÉ
        // =================================================

        console.log(
            "CAMU SERVICES : utilisateur connecté :",
            user.email
        );


        // Garantir que le bouton Premium
        // fonctionne immédiatement.
        setupPremiumButton();


        // =================================================
        // PROFIL
        // =================================================

        await loadUserProfile(
            user
        );


        // =================================================
        // ANNONCES
        // =================================================

        await loadMyAds(
            user
        );


        // =================================================
        // FAVORIS
        // =================================================

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

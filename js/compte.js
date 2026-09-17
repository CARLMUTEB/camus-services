/* =========================================================
   CAMU SERVICES — COMPTE
   ========================================================= */

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;
let currentUserData = null;


/* =========================================================
   ÉLÉMENTS
   ========================================================= */

const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileDescription = document.getElementById("profileDescription");

const accountAvatarImage =
    document.getElementById("accountAvatarImage");

const accountAvatarDefault =
    document.getElementById("accountAvatarDefault");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const editProfileButton =
    document.getElementById("editProfileButton");

const cancelEditProfileButton =
    document.getElementById("cancelEditProfileButton");

const profileEditSection =
    document.getElementById("profileEditSection");

const profileForm =
    document.getElementById("profileForm");

const editName =
    document.getElementById("editName");

const editPhone =
    document.getElementById("editPhone");

const editDescription =
    document.getElementById("editDescription");

const myAdsContainer =
    document.getElementById("myAdsContainer");

const myAdsEmpty =
    document.getElementById("myAdsEmpty");

const myAdsCount =
    document.getElementById("myAdsCount");

const subscriptionPlan =
    document.getElementById("subscriptionPlan");

const subscriptionInfo =
    document.getElementById("subscriptionInfo");

const subscriptionDays =
    document.getElementById("subscriptionDays");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================================
   UTILITAIRES
   ========================================================= */

function safeText(value, fallback = "") {

    if (value === null || value === undefined) {
        return fallback;
    }

    return String(value).trim() || fallback;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPrice(price, currency = "USD") {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "Prix sur demande";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
        return escapeHTML(String(price));
    }

    let currencyCode = safeText(currency, "USD").toUpperCase();

    const currencyMap = {
        USD: "USD",
        CDF: "CDF",
        EUR: "EUR"
    };

    if (!currencyMap[currencyCode]) {
        currencyCode = "USD";
    }

    try {

        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(number);

    } catch {

        return `${number.toLocaleString("fr-FR")} ${currencyCode}`;
    }
}


function getFirstImage(ad) {

    let images = ad?.images;

    if (typeof images === "string") {

        try {
            images = JSON.parse(images);
        } catch {
            images = [];
        }
    }

    if (Array.isArray(images) && images.length > 0) {

        const valid = images.find(
            image =>
                typeof image === "string" &&
                image.trim() !== "" &&
                image.startsWith("http")
        );

        if (valid) {
            return valid;
        }
    }

    const candidates = [
        ad?.imageURL,
        ad?.imageUrl,
        ad?.image,
        ad?.photoURL,
        ad?.photoUrl
    ];

    const found = candidates.find(
        image =>
            typeof image === "string" &&
            image.trim() !== "" &&
            image.startsWith("http")
    );

    if (found) {
        return found;
    }

    return "assets/logo/camu-services-logo.png";
}


function getAdDate(ad) {

    if (!ad?.createdAt) {
        return "";
    }

    try {

        let date;

        if (
            typeof ad.createdAt === "object" &&
            typeof ad.createdAt.toDate === "function"
        ) {
            date = ad.createdAt.toDate();
        } else {
            date = new Date(ad.createdAt);
        }

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    } catch {

        return "";
    }
}


/* =========================================================
   AUTHENTIFICATION
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "connexion.html";
        return;
    }

    currentUser = user;

    await loadAccount();
});


/* =========================================================
   CHARGEMENT DU COMPTE
   ========================================================= */

async function loadAccount() {

    try {

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            currentUserData = userSnap.data();
        } else {
            currentUserData = {};
        }

        renderProfile();

        renderSubscription();

        await loadMyAds();

        console.log(
            "CAMU SERVICES — compte chargé."
        );

    } catch (error) {

        console.error(
            "CAMU SERVICES — erreur chargement compte :",
            error
        );

        /*
         * Même si Firestore rencontre une erreur,
         * les informations Firebase Auth restent affichées.
         */

        currentUserData = {};

        renderProfile();
        renderSubscription();
    }
}


/* =========================================================
   PROFIL
   ========================================================= */

function renderProfile() {

    const name =
        safeText(
            currentUserData?.name,
            safeText(
                currentUser?.displayName,
                "Utilisateur"
            )
        );

    const email =
        safeText(
            currentUserData?.email,
            safeText(
                currentUser?.email,
                "—"
            )
        );

    const phone =
        safeText(
            currentUserData?.phone,
            "Non renseigné"
        );

    const description =
        safeText(
            currentUserData?.description,
            "Aucune description renseignée."
        );


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
        profilePhone.textContent = phone;
    }

    if (profileDescription) {
        profileDescription.textContent = description;
    }


    if (editName) {
        editName.value = name;
    }

    if (editPhone) {
        editPhone.value =
            phone === "Non renseigné" ? "" : phone;
    }

    if (editDescription) {
        editDescription.value =
            description === "Aucune description renseignée."
                ? ""
                : description;
    }


    const photoURL =
        safeText(
            currentUserData?.photoURL,
            safeText(
                currentUser?.photoURL,
                ""
            )
        );


    if (
        accountAvatarImage &&
        accountAvatarDefault
    ) {

        if (
            photoURL &&
            photoURL.startsWith("http")
        ) {

            accountAvatarImage.src = photoURL;
            accountAvatarImage.style.display = "block";

            accountAvatarDefault.style.display = "none";

        } else {

            accountAvatarImage.removeAttribute("src");
            accountAvatarImage.style.display = "none";

            accountAvatarDefault.style.display = "flex";
        }
    }
}


/* =========================================================
   ÉDITION PROFIL
   ========================================================= */

editProfileButton?.addEventListener(
    "click",
    () => {

        profileEditSection?.classList.remove("hidden");

        profileEditSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
);


cancelEditProfileButton?.addEventListener(
    "click",
    () => {

        profileEditSection?.classList.add("hidden");

        renderProfile();
    }
);


profileForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) {
            return;
        }

        const name =
            safeText(
                editName?.value,
                ""
            );

        const phone =
            safeText(
                editPhone?.value,
                ""
            );

        const description =
            safeText(
                editDescription?.value,
                ""
            );


        if (!name) {

            alert(
                "Veuillez renseigner votre nom complet."
            );

            return;
        }


        const submitButton =
            profileForm.querySelector(
                'button[type="submit"]'
            );

        const originalHTML =
            submitButton?.innerHTML;


        try {

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML =
                    `<i class="fa-solid fa-spinner fa-spin"></i>
                     Enregistrement...`;
            }


            const userRef =
                doc(db, "users", currentUser.uid);


            await updateDoc(
                userRef,
                {
                    name,
                    phone,
                    description,
                    updatedAt: new Date()
                }
            );


            await updateProfile(
                currentUser,
                {
                    displayName: name
                }
            );


            currentUserData = {
                ...currentUserData,
                name,
                phone,
                description
            };


            renderProfile();

            profileEditSection?.classList.add(
                "hidden"
            );


            alert(
                "Votre profil a été mis à jour."
            );


        } catch (error) {

            console.error(
                "CAMU SERVICES — erreur modification profil :",
                error
            );

            alert(
                "Impossible de mettre à jour votre profil. Vérifiez votre connexion et réessayez."
            );


        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalHTML ||
                    `<i class="fa-solid fa-check"></i>
                     Enregistrer`;
            }
        }
    }
);


/* =========================================================
   PHOTO DE PROFIL
   ========================================================= */

profilePhotoInput?.addEventListener(
    "change",
    async () => {

        const file =
            profilePhotoInput.files?.[0];

        if (!file || !currentUser) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert(
                "Veuillez sélectionner une image."
            );

            profilePhotoInput.value = "";
            return;
        }


        /*
         * Prévisualisation locale.
         *
         * La sauvegarde définitive de la photo peut être
         * raccordée à Cloudinary comme pour les annonces.
         */

        const previewURL =
            URL.createObjectURL(file);


        if (accountAvatarImage) {

            accountAvatarImage.src = previewURL;
            accountAvatarImage.style.display = "block";
        }

        if (accountAvatarDefault) {

            accountAvatarDefault.style.display = "none";
        }


        /*
         * Pour éviter de prétendre que la photo est déjà
         * sauvegardée dans Firebase sans upload Cloudinary,
         * on conserve ici uniquement la prévisualisation.
         */

        alert(
            "La photo est prévisualisée. Pour la sauvegarder définitivement, il faut utiliser le même système Cloudinary que celui des annonces."
        );
    }
);


/* =========================================================
   MES ANNONCES
========================================================= */

async function loadMyAds() {

    if (!myAdsContainer || !currentUser) {
        return;
    }


    myAdsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
            <h3>Chargement...</h3>
            <p>Nous récupérons vos annonces.</p>
        </div>
    `;


    try {

        const adsQuery =
            query(
                collection(db, "annonces"),
                where(
                    "ownerId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(adsQuery);


        const ads = [];

        snapshot.forEach((documentSnapshot) => {

            ads.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });
        });


        ads.sort((a, b) => {

            const aDate =
                a.createdAt?.toDate?.()
                || new Date(0);

            const bDate =
                b.createdAt?.toDate?.()
                || new Date(0);

            return bDate - aDate;
        });


        if (myAdsCount) {
            myAdsCount.textContent = ads.length;
        }


        if (ads.length === 0) {

            myAdsContainer.innerHTML = "";

            if (myAdsEmpty) {
                myAdsEmpty.hidden = false;
            }

            return;
        }


        if (myAdsEmpty) {
            myAdsEmpty.hidden = true;
        }


        renderMyAds(ads);


        console.log(
            `CAMU SERVICES — ${ads.length} annonce(s) chargée(s).`
        );


    } catch (error) {

        console.error(
            "CAMU SERVICES — erreur chargement annonces :",
            error
        );


        if (myAdsCount) {
            myAdsCount.textContent = "0";
        }


        myAdsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>Impossible de charger les annonces</h3>

                <p>
                    Une erreur est survenue lors de la récupération
                    de vos publications.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   AFFICHAGE DES ANNONCES
========================================================= */

function renderMyAds(ads) {

    myAdsContainer.innerHTML = "";


    ads.forEach((ad) => {

        const card =
            document.createElement("article");

        card.className = "my-ad-card";


        const image =
            getFirstImage(ad);

        const title =
            safeText(
                ad.title,
                "Annonce sans titre"
            );

        const price =
            formatPrice(
                ad.price,
                ad.currency
            );

        const city =
            safeText(
                ad.city,
                "Ville non renseignée"
            );

        const status =
            safeText(
                ad.status,
                "active"
            );


        const date =
            getAdDate(ad);


        let statusLabel =
            "Active";

        if (status === "approved") {
            statusLabel = "Approuvée";
        }

        if (status === "pending") {
            statusLabel = "En attente";
        }

        if (status === "inactive") {
            statusLabel = "Inactive";
        }


        card.innerHTML = `

            <img
                class="my-ad-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                onerror="this.src='assets/logo/camu-services-logo.png'"
            >

            <div class="my-ad-content">

                <h3 class="my-ad-title">
                    ${escapeHTML(title)}
                </h3>

                <div class="my-ad-price">
                    ${price}
                </div>

                <div class="my-ad-meta">

                    <i class="fa-solid fa-location-dot"></i>

                    <span>
                        ${escapeHTML(city)}
                    </span>

                </div>

                ${
                    date
                        ? `
                            <div
                                class="my-ad-meta"
                                style="margin-top:5px;"
                            >
                                <i class="fa-regular fa-calendar"></i>
                                <span>${escapeHTML(date)}</span>
                            </div>
                        `
                        : ""
                }

                <div style="margin-top:10px;">
                    <span class="my-ad-status">
                        ${escapeHTML(statusLabel)}
                    </span>
                </div>


                <div class="my-ad-actions">

                    <a
                        href="explorer.html?id=${encodeURIComponent(ad.id)}"
                    >
                        <i class="fa-solid fa-eye"></i>
                        Voir
                    </a>

                    <a
                        href="modifier.html?id=${encodeURIComponent(ad.id)}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Modifier
                    </a>

                    <button
                        type="button"
                        class="delete-ad"
                        data-id="${escapeHTML(ad.id)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Supprimer
                    </button>

                </div>

            </div>
        `;


        myAdsContainer.appendChild(card);
    });


    document
        .querySelectorAll(".delete-ad")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const adId =
                        button.dataset.id;

                    await deleteMyAd(adId);
                }
            );
        });
}


/* =========================================================
   SUPPRESSION ANNONCE
========================================================= */

async function deleteMyAd(adId) {

    if (!currentUser || !adId) {
        return;
    }


    const confirmed =
        confirm(
            "Voulez-vous vraiment supprimer cette annonce ? Cette action est définitive."
        );


    if (!confirmed) {
        return;
    }


    try {

        const adRef =
            doc(
                db,
                "annonces",
                adId
            );


        const adSnap =
            await getDoc(adRef);


        if (!adSnap.exists()) {

            alert(
                "Cette annonce n'existe plus."
            );

            await loadMyAds();

            return;
        }


        const adData =
            adSnap.data();


        /*
         * Vérification côté interface.
         * Les règles Firestore restent la vraie protection.
         */

        if (
            adData.ownerId !==
            currentUser.uid
        ) {

            alert(
                "Vous ne pouvez pas supprimer cette annonce."
            );

            return;
        }


        await deleteDoc(adRef);


        alert(
            "Annonce supprimée avec succès."
        );


        await loadMyAds();


    } catch (error) {

        console.error(
            "CAMU SERVICES — erreur suppression annonce :",
            error
        );


        alert(
            "Impossible de supprimer cette annonce. Vérifiez vos permissions Firestore."
        );
    }
}


/* =========================================================
   ABONNEMENT
========================================================= */

function renderSubscription() {

    const plan =
        safeText(
            currentUserData?.plan,
            "Gratuit"
        );

    const subscriptionStatus =
        safeText(
            currentUserData?.subscriptionStatus,
            "active"
        );


    if (subscriptionPlan) {
        subscriptionPlan.textContent = plan;
    }


    if (subscriptionInfo) {

        if (
            subscriptionStatus === "active"
        ) {

            subscriptionInfo.textContent =
                "Votre compte utilise actuellement la formule gratuite.";

        } else {

            subscriptionInfo.textContent =
                `Statut de l'abonnement : ${subscriptionStatus}`;
        }
    }


    if (subscriptionDays) {

        const end =
            currentUserData?.subscriptionEnd;

        if (end) {

            let endDate;

            try {

                endDate =
                    typeof end.toDate === "function"
                        ? end.toDate()
                        : new Date(end);

            } catch {

                endDate = null;
            }


            if (
                endDate &&
                !Number.isNaN(endDate.getTime())
            ) {

                const now =
                    new Date();

                const difference =
                    endDate.getTime()
                    - now.getTime();

                const days =
                    Math.ceil(
                        difference /
                        (1000 * 60 * 60 * 24)
                    );


                if (days > 0) {

                    subscriptionDays.textContent =
                        `${days} jour(s) restant(s)`;

                } else {

                    subscriptionDays.textContent =
                        "Abonnement arrivé à échéance.";
                }
            }
        }
    }
}


/* =========================================================
   DÉCONNEXION
========================================================= */

logoutButton?.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Voulez-vous vraiment vous déconnecter ?"
            );


        if (!confirmed) {
            return;
        }


        try {

            logoutButton.disabled = true;

            logoutButton.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i>
                 Déconnexion...`;


            await signOut(auth);


            window.location.href =
                "connexion.html";


        } catch (error) {

            console.error(
                "CAMU SERVICES — erreur déconnexion :",
                error
            );


            alert(
                "Impossible de vous déconnecter. Veuillez réessayer."
            );


            logoutButton.disabled = false;

            logoutButton.innerHTML =
                `<i class="fa-solid fa-right-from-bracket"></i>
                 Se déconnecter`;
        }
    }
);

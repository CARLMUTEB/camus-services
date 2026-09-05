import { auth, db } from "./firebase.js";
import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";

// Ajouter une annonce aux favoris
async function ajouterFavori(annonceId, annonceData) {
  const user = auth.currentUser;
  if (!user) {
    alert("Veuillez vous connecter pour ajouter aux favoris.");
    return;
  }

  const favRef = doc(db, "favoris", `${user.uid}_${annonceId}`);
  await setDoc(favRef, {
    userId: user.uid,
    annonceId: annonceId,
    annonce: annonceData,
    addedAt: new Date()
  });
  alert("Annonce ajoutée aux favoris !");
}

// Supprimer une annonce des favoris
async function supprimerFavori(annonceId) {
  const user = auth.currentUser;
  if (!user) return;

  const favRef = doc(db, "favoris", `${user.uid}_${annonceId}`);
  await deleteDoc(favRef);
  alert("Annonce retirée des favoris !");
}

// Charger les favoris de l’utilisateur
async function chargerFavoris() {
  const user = auth.currentUser;
  if (!user) return;

  const favorisGrid = document.getElementById("favorisGrid");
  favorisGrid.innerHTML = "";

  const q = query(collection(db, "favoris"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const fav = docSnap.data();
    favorisGrid.innerHTML += `
      <div class="listing-card">
        <div class="user">👤 ${fav.annonce.user}</div>
        <img src="${fav.annonce.image}" alt="${fav.annonce.titre}">
        <h3>${fav.annonce.titre}</h3>
        <p class="price">${fav.annonce.prix} $</p>
        <p class="city">📍 ${fav.annonce.ville}</p>
        <div class="actions">
          <button onclick="supprimerFavori('${fav.annonceId}')">❌ Retirer</button>
        </div>
      </div>
    `;
  });
}

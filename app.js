let currentSelectedCategory = "Toutes";
let uploadedImageBase64 = "";

// 1. Gestion du menu latéral
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }
}

// 2. Prévisualisation de l'image lors de la publication
function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImageBase64 = e.target.result;
      const previewImg = document.getElementById("imagePreview");
      const container = document.getElementById("imagePreviewContainer");
      if (previewImg && container) {
        previewImg.src = uploadedImageBase64;
        container.style.display = "block";
      }
    };
    reader.readAsDataURL(file);
  }
}

// 3. Enregistrement d'une nouvelle annonce
function saveAd(e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const city = document.getElementById("city").value;
  const price = document.getElementById("price").value;
  const whatsapp = document.getElementById("whatsapp").value;

  const newAd = {
    id: Date.now(),
    title,
    category,
    city,
    price,
    whatsapp,
    image: uploadedImageBase64 || "https://via.placeholder.com/300x180?text=Camu+Services"
  };

  const existingAds = JSON.parse(localStorage.getItem("user_ads") || "[]");
  existingAds.unshift(newAd);
  localStorage.setItem("user_ads", JSON.stringify(existingAds));

  alert("Annonce publiée avec succès !");
  window.location.href = "index.html";
}

// 4. Filtrage par catégorie
function filterCategory(catName) {
  currentSelectedCategory = catName;
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.includes(catName) || (catName === "Toutes" && btn.textContent === "Toutes"));
  });
  displayAds();
}

// 5. Affichage dynamique des annonces sur l'accueil
function displayAds() {
  const grid = document.getElementById("annoncesGrid");
  if (!grid) return;

  let ads = JSON.parse(localStorage.getItem("user_ads") || "[]");
  const favorites = JSON.parse(localStorage.getItem("user_favorites") || "[]");

  // Filtre par catégorie si nécessaire
  if (currentSelectedCategory !== "Toutes") {
    ads = ads.filter(ad => ad.category === currentSelectedCategory);
  }

  if (ads.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: white; border-radius: 8px;">
        <p style="color: #666; font-size: 14px;">Aucune publication disponible dans cette catégorie.</p>
        <a href="publier.html" style="color: #e53935; font-weight: bold; font-size: 14px; text-decoration: none; margin-top: 8px; display: inline-block;">+ Publier une annonce</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = ads.map(ad => {
    const isFav = favorites.some(fav => fav.id === ad.id);
    return `
      <article class="card-annonce" style="position: relative;">
        <button onclick="toggleFavorite(${ad.id})" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 16px;">
          ${isFav ? "⭐" : "☆"}
        </button>
        ${ad.image ? `<img src="${ad.image}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">` : ""}
        <div>
          <span class="category-badge">${ad.category || "Général"}</span>
          <h3>${ad.title}</h3>
          <p class="city">📍 ${ad.city || "Non spécifiée"}</p>
          <p class="price">${ad.price ? ad.price + " $" : "Sur devis"}</p>
        </div>
        <a href="https://wa.me/${ad.whatsapp}" target="_blank" class="btn-contact" style="margin-top: 10px;">
          <i class="fa-brands fa-whatsapp"></i> Contacter
        </a>
      </article>
    `;
  }).join("");
}

// 6. Gestion de l'ajout / retrait des Favoris
function toggleFavorite(adId) {
  const ads = JSON.parse(localStorage.getItem("user_ads") || "[]");
  let favorites = JSON.parse(localStorage.getItem("user_favorites") || "[]");

  const targetAd = ads.find(a => a.id === adId);
  if (!targetAd) return;

  const index = favorites.findIndex(f => f.id === adId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(targetAd);
  }

  localStorage.setItem("user_favorites", JSON.stringify(favorites));
  displayAds();
}

document.addEventListener("DOMContentLoaded", displayAds);
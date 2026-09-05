// === SIDEBAR ===
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

// === PROFIL ===
const profileBtn = document.querySelector(".profile-btn");
profileBtn.addEventListener("click", () => {
  window.location.href = "profil.html"; // redirection vers la page profil
});

// === BOTTOM NAV ===
const bottomNav = document.querySelector(".bottom-nav");
const navButtons = bottomNav.querySelectorAll("button");

// 🏠 Accueil
navButtons[0].addEventListener("click", () => window.location.href = "index.html");

// 💬 Chat
navButtons[1].addEventListener("click", () => window.location.href = "chat.html");

// ➕ Publier
navButtons[2].addEventListener("click", () => window.location.href = "publier.html");

// ❤️ Favoris
navButtons[3].addEventListener("click", () => window.location.href = "favoris.html");

// === DÉCONNEXION (dans la sidebar) ===
const logoutLink = document.querySelector("a[href='#']");
if (logoutLink) {
  logoutLink.addEventListener("click", () => {
    // Exemple avec Firebase Auth
    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().signOut().then(() => {
        alert("Vous êtes déconnecté !");
        window.location.href = "index.html";
      }).catch((error) => {
        console.error("Erreur de déconnexion:", error);
      });
    } else {
      alert("Déconnexion simulée (Firebase non configuré)");
    }
  });
}

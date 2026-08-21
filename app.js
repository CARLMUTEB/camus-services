/* =========================================================
   CAMU SERVICES — FIREBASE APP
   Auth + Firestore + fonctions globales
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   CONFIGURATION FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};


/* =========================================================
   INITIALISATION
   ========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   MODE SOMBRE
   ========================================================= */

function appliquerTheme() {

  const theme = localStorage.getItem("theme");

  if (theme === "dark") {

    document.documentElement.classList.add("dark-mode");

    if (document.body) {
      document.body.classList.add("dark-mode");
    }

  } else {

    document.documentElement.classList.remove("dark-mode");

    if (document.body) {
      document.body.classList.remove("dark-mode");
    }

  }

}


/* =========================================================
   INITIALISATION DU THÈME
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  appliquerTheme();

});


/* =========================================================
   ÉCOUTE DU CHANGEMENT DE THÈME
   ========================================================= */

window.addEventListener("storage", (event) => {

  if (event.key === "theme") {
    appliquerTheme();
  }

});


/* =========================================================
   UTILITAIRE — ÉCHAPPEMENT HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   UTILITAIRE — NUMÉRO WHATSAPP
   ========================================================= */

function nettoyerNumeroWhatsApp(numero) {

  if (!numero) {
    return "";
  }

  let value = String(numero)
    .trim()
    .replace(/[^\d+]/g, "");

  /*
   * Si le numéro commence par 0,
   * on suppose que le pays est la RDC (+243).
   */

  if (value.startsWith("0")) {
    value = "243" + value.substring(1);
  }

  value = value.replace("+", "");

  return value;

}


/* =========================================================
   LIEN WHATSAPP
   ========================================================= */

function creerLienWhatsApp(numero, message = "") {

  const telephone = nettoyerNumeroWhatsApp(numero);

  if (!telephone) {
    return "#";
  }

  const texte = encodeURIComponent(message);

  return `https://wa.me/${telephone}?text=${texte}`;

}


/* =========================================================
   LIEN TÉLÉPHONE
   ========================================================= */

function creerLienTelephone(numero) {

  if (!numero) {
    return "#";
  }

  const telephone = String(numero)
    .trim()
    .replace(/[^\d+]/g, "");

  return `tel:${telephone}`;

}


/* =========================================================
   UTILITAIRE — NOTIFICATION
   ========================================================= */

function afficherNotification(message, type = "info") {

  let notification =
    document.getElementById("camuNotification");

  if (!notification) {

    notification = document.createElement("div");

    notification.id = "camuNotification";

    notification.style.position = "fixed";
    notification.style.left = "50%";
    notification.style.bottom = "90px";
    notification.style.transform = "translateX(-50%)";
    notification.style.zIndex = "99999";
    notification.style.padding = "12px 16px";
    notification.style.borderRadius = "12px";
    notification.style.fontSize = "13px";
    notification.style.fontWeight = "700";
    notification.style.maxWidth = "90%";
    notification.style.textAlign = "center";
    notification.style.boxShadow =
      "0 8px 25px rgba(0,0,0,.20)";

    document.body.appendChild(notification);

  }

  notification.textContent = message;

  if (type === "success") {

    notification.style.background = "#e8f5e9";
    notification.style.color = "#2e7d32";

  } else if (type === "error") {

    notification.style.background = "#ffebee";
    notification.style.color = "#c62828";

  } else {

    notification.style.background = "#111";
    notification.style.color = "#fff";

  }

  notification.style.display = "block";

  clearTimeout(notification._timer);

  notification._timer = setTimeout(() => {

    notification.style.display = "none";

  }, 3000);

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

  app,

  auth,

  db,

  signOut,

  onAuthStateChanged,

  collection,

  getDocs,

  getDoc,

  doc,

  addDoc,

  updateDoc,

  deleteDoc,

  setDoc,

  query,

  where,

  orderBy,

  serverTimestamp,

  escapeHTML,

  nettoyerNumeroWhatsApp,

  creerLienWhatsApp,

  creerLienTelephone,

  afficherNotification

};

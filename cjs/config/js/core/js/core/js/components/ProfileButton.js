// js/components/ProfileButton.js
import { addListener } from "../core/auth.js";
import { router } from "../core/router.js";

export function initProfileButton() {
    const btn = document.getElementById('profile-btn');
    if (!btn) return;

    // Mise à jour du texte en fonction de l'état
    addListener((store) => {
        if (store.isAuthenticated) {
            const name = store.userData?.displayName || 'Profil';
            btn.innerHTML = `<i class="fas fa-user"></i> ${name}`;
        } else {
            btn.innerHTML = `<i class="fas fa-user"></i> Profil`;
        }
    });

    btn.addEventListener('click', () => {
        // Vérifier l'état via le store (mais on peut aussi utiliser auth.currentUser)
        // On va utiliser une fonction pour vérifier
        import("../core/auth.js").then(({ auth }) => {
            if (auth.currentUser) {
                router.navigate('/profil');
            } else {
                router.navigate('/connexion');
            }
        });
    });
}

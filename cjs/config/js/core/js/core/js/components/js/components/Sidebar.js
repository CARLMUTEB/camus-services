// js/components/Sidebar.js
import { addListener, signOutUser } from "../core/auth.js";

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const logoutBtn = document.getElementById('sidebar-logout');

    // Ouvrir / fermer
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    menuToggle.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Mettre à jour les infos utilisateur
    addListener((store) => {
        const avatarImg = document.getElementById('sidebar-avatar-img');
        const displayName = document.getElementById('sidebar-displayName');
        const roleBadge = document.getElementById('sidebar-role');
        const proLink = document.getElementById('sidebar-pro-link');
        const adminLink = document.getElementById('sidebar-admin-link');

        if (store.isAuthenticated && store.userData) {
            const data = store.userData;
            avatarImg.src = data.photoURL || 'assets/default-avatar.png';
            displayName.textContent = data.displayName || 'Utilisateur';
            roleBadge.textContent = data.role || 'Client';
            // Afficher les liens selon le rôle
            if (data.role === 'professional') {
                proLink.style.display = 'block';
            } else {
                proLink.style.display = 'none';
            }
            if (data.role === 'admin') {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
            logoutBtn.style.display = 'flex';
        } else {
            avatarImg.src = 'assets/default-avatar.png';
            displayName.textContent = 'Invité';
            roleBadge.textContent = 'Visiteur';
            proLink.style.display = 'none';
            adminLink.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    });

    // Déconnexion
    logoutBtn.addEventListener('click', async () => {
        await signOutUser();
        closeSidebar();
    });

    // Fermer le sidebar lors du clic sur un lien
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
}

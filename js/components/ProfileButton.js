// =========================================================
// CAMU SERVICES — BOUTON PROFIL
// =========================================================

export function initProfileButton() {

    const profileButton =
        document.getElementById("profile-btn");

    if (!profileButton) {
        return;
    }


    profileButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            window.location.href =
                "profil.html";
        }
    );
}

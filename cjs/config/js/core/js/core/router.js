const routes = {

    "/":
        "index.html",

    "/index.html":
        "index.html",

    "/connexion":
        "connexion.html",

    "/connexion.html":
        "connexion.html",

    "/inscription":
        "inscription.html",

    "/inscription.html":
        "inscription.html",

    "/profil":
        "profil.html",

    "/profil.html":
        "profil.html",

    "/recherche":
        "recherche.html",

    "/categories":
        "categories.html",

    "/chat":
        "chat.html",

    "/publier":
        "publier.html",

    "/favoris":
        "favoris.html",

    "/reservations":
        "reservations.html",

    "/notifications":
        "notifications.html",

    "/parametres":
        "parametres.html",

    "/admin":
        "admin.html"

};


export const router = {

    navigate(path) {

        const target =
            routes[path] || path;


        const current =
            window.location.pathname
                .split("/")
                .pop();


        const targetFile =
            target.split("/")
                .pop();


        if (current === targetFile) {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;

        }


        window.location.href =
            target;

    },


    handleRoute() {

        // GitHub Pages utilise les vrais fichiers HTML.
        // Aucune réécriture complexe nécessaire.

    }

};


document.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                "[data-link]"
            );


        if (!link) {
            return;
        }


        const href =
            link.getAttribute("href");


        if (!href) {
            return;
        }


        if (
            href.startsWith("http") ||
            href.startsWith("#")
        ) {
            return;
        }


        event.preventDefault();

        router.navigate(href);

    }
);


export function initRouter() {

    router.handleRoute();

}

// =========================================================
// CAMU SERVICES — ROUTER
// =========================================================

const pageMap = {

    "/":
        "index.html",

    "/connexion":
        "connexion.html",

    "/inscription":
        "inscription.html",

    "/profil":
        "profil.html"

};


export const router = {

    navigate(path) {

        if (!path) return;

        const page =
            pageMap[path] || path.replace("/", "") + ".html";

        const current =
            window.location.pathname.split("/").pop();

        const target =
            page.split("/").pop();

        if (current === target) {
            return;
        }

        window.location.href = page;
    },

    init() {

        document.addEventListener(
            "click",
            event => {

                const link =
                    event.target.closest("[data-link]");

                if (!link) return;

                event.preventDefault();

                const href =
                    link.getAttribute("href");

                if (!href) return;

                this.navigate(href);
            }
        );
    }
};

/* =========================================================
   CAMU SERVICES
   PAGE CATÉGORIES
========================================================= */


/* =========================================================
   ÉLÉMENTS
========================================================= */

const categorySearch =
    document.getElementById("categorySearch");

const categoriesGrid =
    document.getElementById("categoriesGrid");

const categoriesEmpty =
    document.getElementById("categoriesEmpty");

const categoriesCount =
    document.getElementById("categoriesCount");


/* =========================================================
   CATÉGORIES
========================================================= */

const categoryCards =
    Array.from(
        document.querySelectorAll(".category-card")
    );


/* =========================================================
   RECHERCHE CATÉGORIE
========================================================= */

categorySearch?.addEventListener(
    "input",
    () => {

        const search =
            categorySearch.value
                .trim()
                .toLowerCase();


        let visibleCount = 0;


        categoryCards.forEach(card => {

            const category =
                card.dataset.category
                    ?.toLowerCase() || "";


            const text =
                card.textContent
                    .toLowerCase();


            const matches =
                !search ||
                category.includes(search) ||
                text.includes(search);


            card.style.display =
                matches ? "grid" : "none";


            if (matches) {
                visibleCount++;
            }
        });


        updateCategoryCount(
            visibleCount
        );


        if (categoriesEmpty) {

            categoriesEmpty.hidden =
                visibleCount !== 0;
        }
    }
);


/* =========================================================
   COMPTEUR
========================================================= */

function updateCategoryCount(count) {

    if (!categoriesCount) return;


    if (count === 1) {

        categoriesCount.textContent =
            "1 catégorie";

        return;
    }


    categoriesCount.textContent =
        `${count} catégories`;
}


/* =========================================================
   CLIQUER SUR UNE CATÉGORIE
========================================================= */

categoryCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const category =
                card.dataset.category;

            if (!category) return;


            /*
             * On transmet la catégorie
             * à la page de recherche.
             */

            const url =
                `recherche.html?category=${encodeURIComponent(category)}`;


            window.location.href = url;
        }
    );
});


/* =========================================================
   MENU MOBILE
========================================================= */

const categoriesMenuBtn =
    document.getElementById(
        "categoriesMenuBtn"
    );

const categoriesSidebar =
    document.getElementById(
        "categoriesSidebar"
    );

const categoriesSidebarClose =
    document.getElementById(
        "categoriesSidebarClose"
    );

const categoriesOverlay =
    document.getElementById(
        "categoriesOverlay"
    );


categoriesMenuBtn?.addEventListener(
    "click",
    openCategoriesMenu
);


categoriesSidebarClose?.addEventListener(
    "click",
    closeCategoriesMenu
);


categoriesOverlay?.addEventListener(
    "click",
    closeCategoriesMenu
);


function openCategoriesMenu() {

    categoriesSidebar?.classList.add(
        "open"
    );

    if (categoriesOverlay) {
        categoriesOverlay.hidden = false;
    }

    document.body.classList.add(
        "categories-menu-open"
    );
}


function closeCategoriesMenu() {

    categoriesSidebar?.classList.remove(
        "open"
    );

    if (categoriesOverlay) {
        categoriesOverlay.hidden = true;
    }

    document.body.classList.remove(
        "categories-menu-open"
    );
}


/* =========================================================
   FERMER AVEC ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeCategoriesMenu();
        }
    }
);

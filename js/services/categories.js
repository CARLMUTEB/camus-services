// =========================================================
// CAMU SERVICES — CATÉGORIES
// =========================================================

const categories = [

    {
        name: "Maisons",
        icon: "fa-house"
    },

    {
        name: "Terrains",
        icon: "fa-map"
    },

    {
        name: "Voitures",
        icon: "fa-car"
    },

    {
        name: "Motos",
        icon: "fa-motorcycle"
    },

    {
        name: "Commerces",
        icon: "fa-shop"
    },

    {
        name: "Services",
        icon: "fa-briefcase"
    }

];


export function loadCategories() {

    const grid =
        document.getElementById(
            "category-grid"
        );

    const select =
        document.getElementById(
            "filter-category"
        );

    if (!grid) return;


    grid.innerHTML = "";


    categories.forEach(category => {

        const card =
            document.createElement("div");

        card.className =
            "category-item";

        card.innerHTML = `
            <i class="fas ${category.icon}"></i>
            <span>${category.name}</span>
        `;


        card.addEventListener(
            "click",
            () => {

                if (select) {

                    select.value =
                        category.name;
                }

                window.dispatchEvent(
                    new CustomEvent(
                        "camu-category-selected",
                        {
                            detail: category.name
                        }
                    )
                );
            }
        );


        grid.appendChild(card);


        if (select) {

            const option =
                document.createElement("option");

            option.value =
                category.name;

            option.textContent =
                category.name;

            select.appendChild(option);
        }

    });
}

export function initBottomNav() {

    const links =
        document.querySelectorAll(
            ".bottom-nav a"
        );


    if (!links.length) {
        return;
    }


    const current =
        window.location.pathname
            .split("/")
            .pop()
            || "index.html";


    links.forEach(link => {

        const href =
            link.getAttribute("href");


        if (href === current) {

            link.classList.add(
                "active"
            );

        } else {

            link.classList.remove(
                "active"
            );

        }


        link.addEventListener(
            "click",
            () => {

                links.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });

                link.classList.add(
                    "active"
                );

            }
        );

    });

}

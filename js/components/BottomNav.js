// =========================================================
// CAMU SERVICES — NAVIGATION MOBILE
// =========================================================

import {
    addListener
} from "../core/store.js";

export function initBottomNav() {

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    if (!nav) return;


    nav
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const href =
                            link.getAttribute(
                                "href"
                            );

                        if (!href) return;


                        if (
                            href === "/"
                        ) {

                            event.preventDefault();

                            window.location.href =
                                "index.html";

                            return;
                        }


                        if (
                            href ===
                            "/connexion"
                        ) {

                            event.preventDefault();

                            window.location.href =
                                "connexion.html";
                        }

                    }
                );

            }
        );


    updateActive();
}


// =========================================================
// LIEN ACTIF
// =========================================================

function updateActive() {

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    if (!nav) return;


    const current =
        window.location.pathname
            .split("/")
            .pop();


    nav
        .querySelectorAll("a")
        .forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                link.classList.remove(
                    "active"
                );


                if (
                    (
                        current ===
                            "index.html" ||
                        current === ""
                    ) &&
                    href === "/"
                ) {

                    link.classList.add(
                        "active"
                    );
                }

            }
        );
}
```

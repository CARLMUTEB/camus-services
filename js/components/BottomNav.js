// =========================================================
// CAMU SERVICES — BOTTOM NAVIGATION
// =========================================================

export function initBottomNav() {

    const nav =
        document.querySelector(".bottom-nav");

    if (!nav) return;

    const links =
        nav.querySelectorAll("a");

    links.forEach(link => {

        link.addEventListener(
            "click",
            () => {

                links.forEach(item =>
                    item.classList.remove("active")
                );

                link.classList.add("active");
            }
        );
    });
}

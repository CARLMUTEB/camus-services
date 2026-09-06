/* =========================================================
   CAMU SERVICES — AUTH.JS V1
   Interface d'authentification
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       AFFICHER / MASQUER LE MOT DE PASSE
    ===================================================== */

    const passwordToggles =
        document.querySelectorAll(".password-toggle");


    passwordToggles.forEach(button => {

        button.addEventListener("click", () => {

            const targetId =
                button.dataset.target;

            const input =
                document.getElementById(targetId);

            if (!input) return;


            const icon =
                button.querySelector("i");


            if (input.type === "password") {

                input.type = "text";

                if (icon) {

                    icon.classList.remove(
                        "fa-eye"
                    );

                    icon.classList.add(
                        "fa-eye-slash"
                    );

                }

                button.setAttribute(
                    "aria-label",
                    "Masquer le mot de passe"
                );

            } else {

                input.type = "password";

                if (icon) {

                    icon.classList.remove(
                        "fa-eye-slash"
                    );

                    icon.classList.add(
                        "fa-eye"
                    );

                }

                button.setAttribute(
                    "aria-label",
                    "Afficher le mot de passe"
                );

            }

        });

    });


    /* =====================================================
       CONNEXION — TEMPORAIRE
    ===================================================== */

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const email =
                    document.getElementById(
                        "loginEmail"
                    )?.value.trim();


                const password =
                    document.getElementById(
                        "loginPassword"
                    )?.value;


                const message =
                    document.getElementById(
                        "loginMessage"
                    );


                if (!email || !password) {

                    showAuthMessage(
                        message,
                        "Veuillez remplir tous les champs.",
                        "error"
                    );

                    return;
                }


                /*
                 * Firebase Authentication sera
                 * connecté à cette partie.
                 */

                showAuthMessage(
                    message,
                    "L'authentification Firebase sera connectée à cette étape.",
                    "success"
                );

            }
        );

    }


    /* =====================================================
       INSCRIPTION — TEMPORAIRE
    ===================================================== */

    const registerForm =
        document.getElementById(
            "registerForm"
        );


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const name =
                    document.getElementById(
                        "registerName"
                    )?.value.trim();


                const email =
                    document.getElementById(
                        "registerEmail"
                    )?.value.trim();


                const phone =
                    document.getElementById(
                        "registerPhone"
                    )?.value.trim();


                const password =
                    document.getElementById(
                        "registerPassword"
                    )?.value;


                const passwordConfirm =
                    document.getElementById(
                        "registerPasswordConfirm"
                    )?.value;


                const terms =
                    document.getElementById(
                        "acceptTerms"
                    )?.checked;


                const message =
                    document.getElementById(
                        "registerMessage"
                    );


                if (
                    !name ||
                    !email ||
                    !phone ||
                    !password ||
                    !passwordConfirm
                ) {

                    showAuthMessage(
                        message,
                        "Veuillez remplir tous les champs.",
                        "error"
                    );

                    return;
                }


                if (password.length < 6) {

                    showAuthMessage(
                        message,
                        "Le mot de passe doit contenir au moins 6 caractères.",
                        "error"
                    );

                    return;
                }


                if (password !== passwordConfirm) {

                    showAuthMessage(
                        message,
                        "Les deux mots de passe ne correspondent pas.",
                        "error"
                    );

                    return;
                }


                if (!terms) {

                    showAuthMessage(
                        message,
                        "Vous devez accepter les conditions d'utilisation.",
                        "error"
                    );

                    return;
                }


                /*
                 * Firebase Authentication sera
                 * connecté ici.
                 */

                showAuthMessage(
                    message,
                    "Le formulaire est valide. Firebase sera connecté à cette étape.",
                    "success"
                );

            }
        );

    }


    /* =====================================================
       MOT DE PASSE OUBLIÉ
    ===================================================== */

    const forgotPassword =
        document.getElementById(
            "forgotPassword"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const email =
                    document.getElementById(
                        "loginEmail"
                    )?.value.trim();


                const message =
                    document.getElementById(
                        "loginMessage"
                    );


                if (!email) {

                    showAuthMessage(
                        message,
                        "Entrez d'abord votre adresse e-mail.",
                        "error"
                    );

                    return;
                }


                showAuthMessage(
                    message,
                    "La récupération du mot de passe sera connectée à Firebase.",
                    "success"
                );

            }
        );

    }


    /* =====================================================
       FONCTION MESSAGE
    ===================================================== */

    function showAuthMessage(
        element,
        text,
        type
    ) {

        if (!element) return;


        element.textContent = text;

        element.className =
            `auth-message ${type}`;

    }

});

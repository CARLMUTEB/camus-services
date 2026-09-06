<!DOCTYPE html>

<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

```
<title>Créer un compte — CAMU SERVICES</title>

<meta
    name="description"
    content="Créez votre compte CAMU SERVICES."
>

<link rel="stylesheet" href="../css/style.css">

<link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
>
```

</head>

<body class="auth-page">

```
<main class="auth-container">

    <!-- RETOUR -->
    <a href="../index.html" class="auth-back">
        <i class="fa-solid fa-arrow-left"></i>
        Retour à l'accueil
    </a>

    <!-- CARTE -->
    <section class="auth-card register-card">

        <!-- LOGO -->
        <div class="auth-logo">
            <span class="logo-main">CAMU</span>
            <span class="logo-sub">SERVICES</span>
        </div>

        <!-- TITRE -->
        <div class="auth-header">
            <h1>Créer votre compte</h1>
            <p>
                Rejoignez CAMU SERVICES gratuitement.
            </p>
        </div>

        <!-- FORMULAIRE -->
        <form id="registerForm" class="auth-form">

            <!-- NOM -->
            <div class="form-group">
                <label for="registerName">
                    Nom complet
                </label>

                <div class="input-wrapper">
                    <i class="fa-regular fa-user"></i>

                    <input
                        type="text"
                        id="registerName"
                        placeholder="Votre nom complet"
                        autocomplete="name"
                        required
                    >
                </div>
            </div>

            <!-- EMAIL -->
            <div class="form-group">
                <label for="registerEmail">
                    Adresse e-mail
                </label>

                <div class="input-wrapper">
                    <i class="fa-regular fa-envelope"></i>

                    <input
                        type="email"
                        id="registerEmail"
                        placeholder="exemple@email.com"
                        autocomplete="email"
                        required
                    >
                </div>
            </div>

            <!-- TELEPHONE -->
            <div class="form-group">
                <label for="registerPhone">
                    Numéro de téléphone
                </label>

                <div class="input-wrapper">
                    <i class="fa-solid fa-phone"></i>

                    <input
                        type="tel"
                        id="registerPhone"
                        placeholder="+243..."
                        autocomplete="tel"
                        required
                    >
                </div>
            </div>

            <!-- MOT DE PASSE -->
            <div class="form-group">
                <label for="registerPassword">
                    Mot de passe
                </label>

                <div class="input-wrapper">
                    <i class="fa-solid fa-lock"></i>

                    <input
                        type="password"
                        id="registerPassword"
                        placeholder="Minimum 6 caractères"
                        autocomplete="new-password"
                        minlength="6"
                        required
                    >

                    <!-- BOUTON AFFICHER MOT DE PASSE -->
                    <button
                        type="button"
                        class="password-toggle"
                        data-target="registerPassword"
                        aria-label="Afficher le mot de passe"
                    >
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <!-- CONFIRMATION -->
            <div class="form-group">
                <label for="registerPasswordConfirm">
                    Confirmer le mot de passe
                </label>

                <div class="input-wrapper">
                    <i class="fa-solid fa-lock"></i>

                    <input
                        type="password"
                        id="registerPasswordConfirm"
                        placeholder="Confirmez votre mot de passe"
                        autocomplete="new-password"
                        minlength="6"
                        required
                    >

                    <!-- BOUTON AFFICHER CONFIRMATION -->
                    <button
                        type="button"
                        class="password-toggle"
                        data-target="registerPasswordConfirm"
                        aria-label="Afficher le mot de passe"
                    >
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </div>
            </div>

            <!-- CONDITIONS -->
            <div class="terms-checkbox">
                <label>

                    <input
                        type="checkbox"
                        id="acceptTerms"
                        required
                    >

                    <span>
                        J'accepte les
                        <a href="cgu.html">
                            Conditions d'utilisation
                        </a>
                        et la
                        <a href="confidentialite.html">
                            Politique de confidentialité
                        </a>.
                    </span>

                </label>
            </div>

            <!-- MESSAGE -->
            <div
                id="registerMessage"
                class="auth-message"
                role="alert"
            ></div>

            <!-- BOUTON INSCRIPTION -->
            <button
                type="submit"
                class="auth-submit"
                id="registerButton"
            >
                <span>Créer mon compte</span>
                <i class="fa-solid fa-user-plus"></i>
            </button>

        </form>

        <!-- CONNEXION -->
        <div class="auth-switch">
            <span>
                Vous avez déjà un compte ?
            </span>

            <a href="connexion.html">
                Se connecter
            </a>
        </div>

    </section>

    <!-- FOOTER -->
    <div class="auth-footer">

        <a href="mentions-legales.html">
            Mentions légales
        </a>

        <a href="cgu.html">
            Conditions d'utilisation
        </a>

        <a href="confidentialite.html">
            Confidentialité
        </a>

    </div>

</main>

<!-- AUTHENTIFICATION FIREBASE -->
<script
    type="module"
    src="../js/auth.js"
></script>
```

</body>
</html>

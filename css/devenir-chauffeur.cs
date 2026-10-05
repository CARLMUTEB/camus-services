/* =========================================================
   CAMU SERVICES — DEVENIR CHAUFFEUR
   CAMU TAXI
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

:root {
    --driver-blue: #063b73;
    --driver-blue-dark: #04294f;
    --driver-blue-light: #eaf2fb;

    --driver-green: #20a86b;
    --driver-green-dark: #168653;
    --driver-green-light: #eaf8f1;

    --driver-white: #ffffff;
    --driver-bg: #f5f7fa;

    --driver-text: #1d2939;
    --driver-muted: #667085;

    --driver-border: #e2e7ee;

    --driver-danger: #d92d20;
    --driver-success: #168653;

    --driver-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);

    --driver-radius: 14px;

    --driver-sidebar-width: 245px;
    --driver-topbar-height: 82px;
}


/* =========================================================
   RESET
========================================================= */

.driver-main *,
.driver-main *::before,
.driver-main *::after,
.driver-sidebar *,
.driver-sidebar *::before,
.driver-sidebar *::after {
    box-sizing: border-box;
}


.driver-main {
    min-width: 0;
}


.driver-main img {
    max-width: 100%;
}


.driver-main button,
.driver-main input,
.driver-main select,
.driver-main textarea {
    font: inherit;
}


/* =========================================================
   SIDEBAR
========================================================= */

.driver-sidebar {
    position: fixed;

    top: 0;
    left: 0;

    width: var(--driver-sidebar-width);
    height: 100vh;

    background: var(--driver-blue);

    z-index: 2000;

    display: flex;
    flex-direction: column;

    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.12);

    overflow-y: auto;
    overflow-x: hidden;

    transition: transform 0.3s ease;
}


/* LOGO */

.driver-sidebar-logo {
    width: 100%;
    height: 105px;

    background: var(--driver-white);

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 12px 18px;

    flex-shrink: 0;
}


.driver-sidebar-logo a {
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
}


.driver-sidebar-logo img {
    display: block;

    width: 175px;
    max-width: 100%;
    height: auto;

    object-fit: contain;
}


/* NAVIGATION */

.driver-sidebar-nav {
    display: flex;
    flex-direction: column;

    padding: 20px 12px;

    gap: 5px;
}


.driver-sidebar-nav a {
    display: flex;
    align-items: center;

    width: 100%;

    min-height: 48px;

    padding: 11px 14px;

    border-radius: 10px;

    color: rgba(255, 255, 255, 0.88);

    text-decoration: none;

    font-size: 15px;
    font-weight: 500;

    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}


.driver-sidebar-nav a i {
    width: 24px;

    margin-right: 12px;

    font-size: 17px;

    text-align: center;

    flex-shrink: 0;
}


.driver-sidebar-nav a:hover {
    background: rgba(255, 255, 255, 0.1);

    color: var(--driver-white);

    transform: translateX(2px);
}


.driver-sidebar-nav a.active {
    background: var(--driver-green);

    color: var(--driver-white);

    font-weight: 700;

    box-shadow: 0 5px 15px rgba(32, 168, 107, 0.25);
}


/* SEPARATEUR */

.driver-sidebar-divider {
    height: 1px;

    background: rgba(255, 255, 255, 0.16);

    margin: 12px 8px;
}


/* =========================================================
   OVERLAY MOBILE
========================================================= */

.driver-overlay {
    position: fixed;

    inset: 0;

    background: rgba(0, 0, 0, 0.48);

    z-index: 1900;

    opacity: 0;
    visibility: hidden;

    transition:
        opacity 0.3s ease,
        visibility 0.3s ease;
}


.driver-overlay.active {
    opacity: 1;

    visibility: visible;
}


/* =========================================================
   MAIN
========================================================= */

.driver-main {
    min-height: 100vh;

    margin-left: var(--driver-sidebar-width);

    background: var(--driver-bg);
}


/* =========================================================
   TOPBAR
========================================================= */

.driver-topbar {
    position: sticky;

    top: 0;

    width: 100%;

    height: var(--driver-topbar-height);

    background: var(--driver-white);

    border-bottom: 1px solid var(--driver-border);

    display: flex;
    align-items: center;

    padding: 0 25px;

    z-index: 1500;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}


/* MENU MOBILE */

.driver-menu-button {
    display: none;

    width: 44px;
    height: 44px;

    border: 0;

    border-radius: 10px;

    background: var(--driver-blue-light);

    color: var(--driver-blue);

    align-items: center;
    justify-content: center;

    cursor: pointer;

    font-size: 20px;
}


.driver-menu-button:hover {
    background: #dceaf8;
}


/* LOGO TOPBAR */

.driver-top-logo {
    position: absolute;

    left: 50%;
    top: 50%;

    transform: translate(-50%, -50%);

    width: 190px;
    height: 70px;

    display: flex;
    align-items: center;
    justify-content: center;
}


.driver-top-logo img {
    display: block;

    width: 175px;
    max-width: 100%;
    max-height: 62px;

    object-fit: contain;
}


/* ACTIONS */

.driver-top-actions {
    margin-left: auto;

    display: flex;
    align-items: center;

    gap: 8px;
}


.driver-top-icon {
    width: 42px;
    height: 42px;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--driver-blue);

    background: #f1f5f9;

    text-decoration: none;

    font-size: 18px;

    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}


.driver-top-icon:hover {
    background: var(--driver-blue-light);

    color: var(--driver-green);

    transform: translateY(-1px);
}


/* =========================================================
   CONTAINER
========================================================= */

.driver-container {
    width: min(1200px, calc(100% - 40px));

    margin: 0 auto;
}


/* =========================================================
   HERO
========================================================= */

.driver-hero {
    background:
        linear-gradient(
            135deg,
            var(--driver-blue),
            var(--driver-blue-dark)
        );

    color: var(--driver-white);

    padding: 45px 0;
}


.driver-hero-content {
    display: flex;

    align-items: center;

    gap: 22px;
}


.driver-hero-icon {
    width: 72px;
    height: 72px;

    border-radius: 18px;

    background: rgba(255, 255, 255, 0.12);

    border: 1px solid rgba(255, 255, 255, 0.16);

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    font-size: 30px;

    color: var(--driver-green);
}


.driver-kicker {
    display: inline-block;

    margin-bottom: 7px;

    color: #78e0ad;

    font-size: 13px;

    font-weight: 800;

    letter-spacing: 1.5px;

    text-transform: uppercase;
}


.driver-hero h1 {
    margin: 0 0 8px;

    color: var(--driver-white);

    font-size: clamp(30px, 4vw, 44px);

    line-height: 1.15;

    font-weight: 800;
}


.driver-hero p {
    max-width: 720px;

    margin: 0;

    color: rgba(255, 255, 255, 0.86);

    font-size: 16px;

    line-height: 1.7;
}


/* =========================================================
   SECTION
========================================================= */

.driver-section {
    padding: 38px 0 50px;
}


/* =========================================================
   LOADING
========================================================= */

.driver-loading {
    min-height: 120px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 12px;

    color: var(--driver-muted);

    font-size: 15px;
}


.driver-loading i {
    color: var(--driver-green);

    font-size: 20px;
}


/* =========================================================
   MESSAGE
========================================================= */

.driver-message {
    display: none;

    margin-bottom: 20px;

    padding: 14px 16px;

    border-radius: 10px;

    font-size: 14px;

    line-height: 1.5;
}


.driver-message.show {
    display: block;
}


.driver-message.success {
    color: #126b43;

    background: var(--driver-green-light);

    border: 1px solid #b7e5cf;
}


.driver-message.error {
    color: #a61b13;

    background: #fff1f0;

    border: 1px solid #f4c7c3;
}


.driver-message.info {
    color: var(--driver-blue);

    background: var(--driver-blue-light);

    border: 1px solid #c8dcef;
}


/* =========================================================
   FORM CARD
========================================================= */

.driver-card {
    width: 100%;

    background: var(--driver-white);

    border: 1px solid var(--driver-border);

    border-radius: var(--driver-radius);

    box-shadow: var(--driver-shadow);

    overflow: hidden;
}


.hidden {
    display: none !important;
}


/* =========================================================
   FORM SECTION
========================================================= */

.driver-form-section {
    padding: 30px;

    border-bottom: 1px solid var(--driver-border);
}


.driver-form-section:last-of-type {
    border-bottom: 0;
}


/* =========================================================
   SECTION TITLE
========================================================= */

.driver-section-title {
    display: flex;

    align-items: flex-start;

    gap: 15px;

    margin-bottom: 25px;
}


.driver-section-title-icon {
    width: 46px;
    height: 46px;

    border-radius: 12px;

    background: var(--driver-blue-light);

    color: var(--driver-blue);

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    font-size: 18px;
}


.driver-section-title h2 {
    margin: 0 0 5px;

    color: var(--driver-text);

    font-size: 20px;

    line-height: 1.3;
}


.driver-section-title p {
    margin: 0;

    color: var(--driver-muted);

    font-size: 14px;

    line-height: 1.5;
}


/* =========================================================
   FORM GRID
========================================================= */

.driver-fields-grid {
    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 20px;
}


.driver-form-group {
    min-width: 0;
}


.driver-full {
    grid-column: 1 / -1;
}


/* =========================================================
   LABEL
========================================================= */

.driver-form-group label {
    display: block;

    margin-bottom: 8px;

    color: var(--driver-text);

    font-size: 14px;

    font-weight: 650;
}


.driver-form-group label span {
    color: var(--driver-danger);
}


/* =========================================================
   INPUTS
========================================================= */

.driver-form-group input,
.driver-form-group select,
.driver-form-group textarea {
    width: 100%;

    border: 1px solid var(--driver-border);

    border-radius: 10px;

    background: var(--driver-white);

    color: var(--driver-text);

    outline: none;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;
}


.driver-form-group input,
.driver-form-group select {
    height: 48px;

    padding: 0 14px;
}


.driver-form-group textarea {
    min-height: 130px;

    padding: 13px 14px;

    resize: vertical;

    line-height: 1.55;
}


.driver-form-group input::placeholder,
.driver-form-group textarea::placeholder {
    color: #98a2b3;
}


.driver-form-group input:focus,
.driver-form-group select:focus,
.driver-form-group textarea:focus {
    border-color: var(--driver-blue);

    box-shadow: 0 0 0 3px rgba(6, 59, 115, 0.1);
}


.driver-form-group small {
    display: block;

    margin-top: 7px;

    color: var(--driver-muted);

    font-size: 12px;
}


/* =========================================================
   LOCALISATION BOX
========================================================= */

.driver-location-box {
    min-width: 0;

    display: grid;

    grid-template-columns: auto minmax(0, 1fr) auto;

    align-items: center;

    gap: 15px;

    padding: 18px;

    border-radius: 12px;

    background: #f8fafc;

    border: 1px solid var(--driver-border);
}


.driver-location-icon {
    width: 46px;
    height: 46px;

    border-radius: 12px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: var(--driver-green-light);

    color: var(--driver-green);

    font-size: 19px;
}


.driver-location-content {
    min-width: 0;
}


.driver-location-content strong {
    display: block;

    margin-bottom: 4px;

    color: var(--driver-text);

    font-size: 14px;
}


.driver-location-content p {
    margin: 0;

    color: var(--driver-muted);

    font-size: 13px;

    line-height: 1.5;
}


/* =========================================================
   SECONDARY BUTTON
========================================================= */

.driver-secondary-button {
    min-height: 44px;

    padding: 0 15px;

    border: 1px solid var(--driver-blue);

    border-radius: 9px;

    background: var(--driver-white);

    color: var(--driver-blue);

    display: inline-flex;

    align-items: center;
    justify-content: center;

    gap: 8px;

    cursor: pointer;

    font-size: 13px;

    font-weight: 700;

    white-space: nowrap;

    transition:
        background 0.2s ease,
        color 0.2s ease;
}


.driver-secondary-button:hover {
    background: var(--driver-blue);

    color: var(--driver-white);
}


/* =========================================================
   PHOTO GRID
========================================================= */

.driver-photo-grid {
    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 20px;
}


.driver-photo-card {
    min-width: 0;

    padding: 15px;

    border: 1px solid var(--driver-border);

    border-radius: 12px;

    background: #fafbfc;
}


.driver-photo-preview {
    position: relative;

    width: 100%;

    height: 230px;

    overflow: hidden;

    border-radius: 10px;

    background: #edf1f5;

    display: flex;
    align-items: center;
    justify-content: center;
}


.driver-photo-preview img {
    display: none;

    width: 100%;
    height: 100%;

    object-fit: cover;
}


.driver-photo-preview img.show {
    display: block;
}


.driver-photo-placeholder {
    display: flex;

    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 10px;

    color: var(--driver-muted);

    font-size: 14px;
}


.driver-photo-placeholder i {
    font-size: 35px;

    color: #98a2b3;
}


.driver-photo-button {
    width: 100%;

    min-height: 44px;

    margin-top: 12px;

    border: 1px solid var(--driver-border);

    border-radius: 9px;

    background: var(--driver-white);

    color: var(--driver-blue);

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    cursor: pointer;

    font-size: 13px;

    font-weight: 700;

    transition:
        background 0.2s ease,
        border-color 0.2s ease;
}


.driver-photo-button:hover {
    background: var(--driver-blue-light);

    border-color: #bfd3e8;
}


/* =========================================================
   DISPONIBILITE
========================================================= */

.driver-availability {
    position: relative;

    display: grid;

    grid-template-columns: auto minmax(0, 1fr) auto;

    align-items: center;

    gap: 15px;

    padding: 18px;

    border: 1px solid var(--driver-border);

    border-radius: 12px;

    cursor: pointer;

    background: var(--driver-white);

    transition:
        border-color 0.2s ease,
        background 0.2s ease;
}


.driver-availability:hover {
    border-color: #b9d6c8;

    background: #fbfefc;
}


.driver-availability-icon {
    width: 46px;
    height: 46px;

    border-radius: 12px;

    background: var(--driver-green-light);

    color: var(--driver-green);

    display: flex;
    align-items: center;
    justify-content: center;
}


.driver-availability-text {
    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 4px;
}


.driver-availability-text strong {
    color: var(--driver-text);

    font-size: 15px;
}


.driver-availability-text span {
    color: var(--driver-muted);

    font-size: 13px;

    line-height: 1.5;
}


/* HIDE CHECKBOX */

.driver-availability input {
    position: absolute;

    opacity: 0;

    pointer-events: none;
}


/* SWITCH */

.driver-switch {
    position: relative;

    width: 50px;
    height: 28px;

    border-radius: 50px;

    background: #d0d5dd;

    transition: background 0.2s ease;
}


.driver-switch::after {
    content: "";

    position: absolute;

    top: 4px;
    left: 4px;

    width: 20px;
    height: 20px;

    border-radius: 50%;

    background: var(--driver-white);

    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);

    transition: transform 0.2s ease;
}


.driver-availability input:checked + .driver-switch {
    background: var(--driver-green);
}


.driver-availability input:checked + .driver-switch::after {
    transform: translateX(22px);
}


/* =========================================================
   CONDITIONS
========================================================= */

.driver-terms {
    margin: 0 30px;

    padding: 20px 0;

    border-bottom: 1px solid var(--driver-border);
}


.driver-terms label {
    display: flex;

    align-items: flex-start;

    gap: 10px;

    cursor: pointer;

    color: var(--driver-muted);

    font-size: 13px;

    line-height: 1.55;
}


.driver-terms input {
    width: 18px;
    height: 18px;

    margin-top: 1px;

    flex-shrink: 0;

    accent-color: var(--driver-green);

    cursor: pointer;
}


/* =========================================================
   ACTIONS
========================================================= */

.driver-form-actions {
    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 15px;

    padding: 25px 30px;
}


.driver-cancel-button,
.driver-submit-button {
    min-height: 48px;

    border-radius: 10px;

    display: inline-flex;

    align-items: center;
    justify-content: center;

    gap: 9px;

    padding: 0 20px;

    text-decoration: none;

    font-size: 14px;

    font-weight: 700;

    cursor: pointer;

    transition:
        transform 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
}


.driver-cancel-button {
    border: 1px solid var(--driver-border);

    background: var(--driver-white);

    color: var(--driver-text);
}


.driver-cancel-button:hover {
    background: #f8fafc;

    transform: translateY(-1px);
}


.driver-submit-button {
    border: 0;

    background: var(--driver-green);

    color: var(--driver-white);

    box-shadow: 0 6px 16px rgba(32, 168, 107, 0.22);
}


.driver-submit-button:hover {
    background: var(--driver-green-dark);

    transform: translateY(-1px);

    box-shadow: 0 8px 20px rgba(32, 168, 107, 0.28);
}


.driver-submit-button:disabled {
    opacity: 0.65;

    cursor: not-allowed;

    transform: none;

    box-shadow: none;
}


/* =========================================================
   FOOTER
========================================================= */

.driver-footer {
    padding: 25px 20px 35px;

    text-align: center;

    color: var(--driver-muted);

    font-size: 13px;
}


.driver-footer p {
    margin: 0;
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 1000px) {

    :root {
        --driver-sidebar-width: 220px;
    }


    .driver-sidebar-logo img {
        width: 155px;
    }


    .driver-container {
        width: min(100% - 30px, 900px);
    }


    .driver-location-box {
        grid-template-columns: auto minmax(0, 1fr);
    }


    .driver-secondary-button {
        grid-column: 1 / -1;

        width: 100%;
    }

}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 768px) {

    :root {
        --driver-topbar-height: 68px;
    }


    /* SIDEBAR */

    .driver-sidebar {
        width: min(285px, 82vw);

        transform: translateX(-105%);

        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
    }


    .driver-sidebar.open {
        transform: translateX(0);
    }


    /* MAIN */

    .driver-main {
        margin-left: 0;

        width: 100%;

        min-width: 0;

        overflow-x: hidden;
    }


    /* TOPBAR */

    .driver-topbar {
        height: var(--driver-topbar-height);

        padding: 0 12px;
    }


    .driver-menu-button {
        display: flex;

        flex-shrink: 0;
    }


    .driver-top-logo {
        width: 145px;
        height: 55px;
    }


    .driver-top-logo img {
        width: 135px;

        max-height: 48px;
    }


    .driver-top-actions {
        gap: 4px;
    }


    .driver-top-icon {
        width: 38px;
        height: 38px;

        font-size: 16px;
    }


    /* CONTAINER */

    .driver-container {
        width: calc(100% - 24px);

        max-width: none;
    }


    /* HERO */

    .driver-hero {
        padding: 28px 0;
    }


    .driver-hero-content {
        align-items: flex-start;

        gap: 14px;
    }


    .driver-hero-icon {
        width: 52px;
        height: 52px;

        border-radius: 13px;

        font-size: 22px;
    }


    .driver-kicker {
        font-size: 11px;

        letter-spacing: 1.2px;
    }


    .driver-hero h1 {
        font-size: 28px;
    }


    .driver-hero p {
        font-size: 14px;

        line-height: 1.55;
    }


    /* SECTION */

    .driver-section {
        padding: 22px 0 35px;
    }


    /* FORM CARD */

    .driver-card {
        border-radius: 12px;
    }


    /* FORM SECTION */

    .driver-form-section {
        padding: 22px 16px;
    }


    /* TITLE */

    .driver-section-title {
        gap: 11px;

        margin-bottom: 20px;
    }


    .driver-section-title-icon {
        width: 40px;
        height: 40px;

        border-radius: 10px;

        font-size: 16px;
    }


    .driver-section-title h2 {
        font-size: 17px;
    }


    .driver-section-title p {
        font-size: 12px;
    }


    /* FORM GRID */

    .driver-fields-grid {
        grid-template-columns: 1fr;

        gap: 16px;
    }


    .driver-full {
        grid-column: auto;
    }


    /* INPUTS */

    .driver-form-group input,
    .driver-form-group select {
        height: 46px;

        font-size: 14px;
    }


    .driver-form-group textarea {
        font-size: 14px;
    }


    /* LOCATION */

    .driver-location-box {
        grid-template-columns: auto minmax(0, 1fr);

        gap: 12px;

        padding: 14px;
    }


    .driver-location-icon {
        width: 40px;
        height: 40px;
    }


    .driver-location-content p {
        font-size: 12px;
    }


    .driver-secondary-button {
        grid-column: 1 / -1;

        min-height: 44px;

        font-size: 13px;
    }


    /* PHOTOS */

    .driver-photo-grid {
        grid-template-columns: 1fr;

        gap: 16px;
    }


    .driver-photo-preview {
        height: 210px;
    }


    /* AVAILABILITY */

    .driver-availability {
        grid-template-columns: auto minmax(0, 1fr) auto;

        gap: 10px;

        padding: 14px;
    }


    .driver-availability-icon {
        width: 40px;
        height: 40px;
    }


    .driver-availability-text strong {
        font-size: 14px;
    }


    .driver-availability-text span {
        font-size: 12px;
    }


    /* TERMS */

    .driver-terms {
        margin: 0 16px;

        padding: 18px 0;
    }


    /* ACTIONS */

    .driver-form-actions {
        flex-direction: column-reverse;

        padding: 20px 16px;

        align-items: stretch;
    }


    .driver-cancel-button,
    .driver-submit-button {
        width: 100%;
    }


    /* FOOTER */

    .driver-footer {
        padding: 20px 15px 30px;

        font-size: 12px;
    }

}


/* =========================================================
   PETIT MOBILE
========================================================= */

@media (max-width: 480px) {

    .driver-top-logo {
        left: 50%;

        width: 125px;
    }


    .driver-top-logo img {
        width: 120px;
    }


    .driver-top-actions .driver-top-icon {
        width: 35px;
        height: 35px;

        font-size: 15px;
    }


    .driver-hero {
        padding: 24px 0;
    }


    .driver-hero-content {
        display: block;
    }


    .driver-hero-icon {
        margin-bottom: 13px;
    }


    .driver-hero h1 {
        font-size: 25px;
    }


    .driver-hero p {
        font-size: 13px;
    }


    .driver-form-section {
        padding: 20px 13px;
    }


    .driver-location-box {
        grid-template-columns: 1fr;
    }


    .driver-location-icon {
        width: 42px;
        height: 42px;
    }


    .driver-secondary-button {
        grid-column: auto;
    }


    .driver-availability {
        grid-template-columns: auto minmax(0, 1fr);

        position: relative;

        padding-right: 65px;
    }


    .driver-switch {
        position: absolute;

        right: 14px;

        top: 50%;

        transform: translateY(-50%);
    }


    .driver-availability input:checked + .driver-switch {
        background: var(--driver-green);
    }


    .driver-availability input:checked + .driver-switch::after {
        transform: translateX(22px);
    }

}


/* =========================================================
   ACCESSIBILITE
========================================================= */

@media (prefers-reduced-motion: reduce) {

    .driver-sidebar,
    .driver-overlay,
    .driver-top-icon,
    .driver-submit-button,
    .driver-cancel-button,
    .driver-switch,
    .driver-switch::after {
        transition: none;
    }

}


/* =========================================================
   SECURITE CONTRE LES DEBORDEMENTS
========================================================= */

html,
body {
    max-width: 100%;

    overflow-x: hidden;
}


.driver-main,
.driver-container,
.driver-card,
.driver-form-section,
.driver-fields-grid,
.driver-photo-grid {
    min-width: 0;
}

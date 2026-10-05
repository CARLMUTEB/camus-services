/* =========================================================
   CAMU SERVICES — DEVENIR CHAUFFEUR CAMU TAXI
   css/devenir-chauffeur.css
   ========================================================= */

:root {
    --driver-blue: #063b73;
    --driver-blue-dark: #04294f;
    --driver-blue-light: #eef5fc;

    --driver-green: #20a86b;
    --driver-green-dark: #168653;
    --driver-green-light: #eaf8f1;

    --driver-white: #ffffff;
    --driver-light: #f5f7fa;
    --driver-border: #e2e7ee;

    --driver-text: #1d2939;
    --driver-muted: #667085;
    --driver-danger: #d92d20;
    --driver-warning: #f79009;

    --driver-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    --driver-radius: 14px;

    --driver-sidebar-width: 245px;
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

.driver-main img {
    max-width: 100%;
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

    z-index: 1000;

    display: flex;
    flex-direction: column;

    box-shadow: 4px 0 18px rgba(0, 0, 0, 0.08);
}

.driver-sidebar-logo {
    height: 105px;

    background: var(--driver-white);

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 15px 20px;

    flex-shrink: 0;
}

.driver-sidebar-logo a {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
}

.driver-sidebar-logo img {
    display: block;

    width: 175px;
    max-width: 100%;
    max-height: 70px;

    object-fit: contain;
}

.driver-sidebar-nav {
    display: flex;
    flex-direction: column;

    padding: 20px 13px;

    gap: 5px;

    overflow-y: auto;
}

.driver-sidebar-nav a {
    min-height: 48px;

    display: flex;
    align-items: center;
    gap: 13px;

    padding: 11px 14px;

    color: rgba(255, 255, 255, 0.82);

    text-decoration: none;

    border-radius: 10px;

    font-size: 14px;
    font-weight: 600;

    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

.driver-sidebar-nav a i {
    width: 21px;

    text-align: center;

    font-size: 16px;
}

.driver-sidebar-nav a:hover {
    color: var(--driver-white);
    background: rgba(255, 255, 255, 0.1);

    transform: translateX(2px);
}

.driver-sidebar-nav a.active {
    color: var(--driver-blue);
    background: var(--driver-white);
}

.driver-sidebar-divider {
    height: 1px;

    margin: 12px 8px;

    background: rgba(255, 255, 255, 0.15);
}


/* =========================================================
   OVERLAY
   ========================================================= */

.driver-overlay {
    display: none;

    position: fixed;
    inset: 0;

    background: rgba(0, 0, 0, 0.45);

    z-index: 950;
}


/* =========================================================
   MAIN
   ========================================================= */

.driver-main {
    min-height: 100vh;

    margin-left: var(--driver-sidebar-width);

    background: var(--driver-light);

    color: var(--driver-text);
}


/* =========================================================
   TOPBAR
   ========================================================= */

.driver-topbar {
    position: sticky;
    top: 0;

    height: 82px;

    display: flex;
    align-items: center;

    padding: 0 25px;

    background: var(--driver-white);

    border-bottom: 1px solid var(--driver-border);

    z-index: 900;
}

.driver-top-logo {
    position: absolute;

    left: 50%;
    top: 50%;

    transform: translate(-50%, -50%);

    width: 190px;
    height: 72px;

    display: flex;
    align-items: center;
    justify-content: center;
}

.driver-top-logo img {
    width: 170px;
    max-height: 60px;

    object-fit: contain;
}

.driver-top-actions {
    margin-left: auto;

    display: flex;
    align-items: center;

    gap: 9px;
}

.driver-top-icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--driver-blue);

    background: var(--driver-blue-light);

    border-radius: 11px;

    text-decoration: none;

    font-size: 17px;

    transition:
        background 0.2s ease,
        transform 0.2s ease;
}

.driver-top-icon:hover {
    background: #dfeefa;

    transform: translateY(-1px);
}

.driver-menu-button {
    display: none;

    width: 42px;
    height: 42px;

    border: 0;
    border-radius: 10px;

    background: var(--driver-blue-light);
    color: var(--driver-blue);

    cursor: pointer;

    font-size: 18px;
}


/* =========================================================
   HERO
   ========================================================= */

.driver-hero {
    background:
        linear-gradient(
            135deg,
            var(--driver-blue) 0%,
            #0b4d8d 100%
        );

    color: var(--driver-white);

    padding: 42px 25px;
}

.driver-container {
    width: min(1200px, calc(100% - 40px));

    margin: 0 auto;
}

.driver-hero .driver-container {
    display: flex;
    align-items: center;

    gap: 20px;
}

.driver-hero-icon {
    width: 70px;
    height: 70px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 18px;

    background: rgba(255, 255, 255, 0.14);

    font-size: 30px;
}

.driver-kicker {
    display: block;

    margin-bottom: 5px;

    font-size: 12px;
    font-weight: 800;

    letter-spacing: 1.2px;

    text-transform: uppercase;

    opacity: 0.8;
}

.driver-hero h1 {
    margin: 0;

    font-size: clamp(27px, 4vw, 38px);

    line-height: 1.15;

    font-weight: 800;
}

.driver-hero p {
    max-width: 680px;

    margin: 9px 0 0;

    color: rgba(255, 255, 255, 0.86);

    font-size: 15px;

    line-height: 1.6;
}


/* =========================================================
   SECTION
   ========================================================= */

.driver-section {
    padding: 35px 0 55px;
}


/* =========================================================
   LOADING
   ========================================================= */

.driver-loading {
    min-height: 220px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 12px;

    color: var(--driver-muted);

    font-size: 14px;
}

.driver-loading i {
    color: var(--driver-blue);

    font-size: 25px;
}


/* =========================================================
   HIDDEN
   ========================================================= */

.hidden {
    display: none !important;
}


/* =========================================================
   MESSAGE
   ========================================================= */

.driver-message {
    display: none;

    margin-bottom: 20px;

    padding: 13px 16px;

    border-radius: 10px;

    font-size: 14px;
    line-height: 1.5;
}

.driver-message.success {
    display: block;

    color: #12633f;

    background: var(--driver-green-light);

    border: 1px solid #b7e6ce;
}

.driver-message.error {
    display: block;

    color: #a32118;

    background: #fff1f0;

    border: 1px solid #f5c2be;
}

.driver-message.info {
    display: block;

    color: var(--driver-blue-dark);

    background: var(--driver-blue-light);

    border: 1px solid #cfe1f3;
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


/* =========================================================
   FORM SECTION
   ========================================================= */

.driver-form-section {
    padding: 28px;

    border-bottom: 1px solid var(--driver-border);
}

.driver-section-title {
    display: flex;
    align-items: flex-start;

    gap: 14px;

    margin-bottom: 24px;
}

.driver-section-title-icon {
    width: 43px;
    height: 43px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: var(--driver-blue-light);

    color: var(--driver-blue);

    font-size: 17px;
}

.driver-section-title h2 {
    margin: 0 0 4px;

    color: var(--driver-text);

    font-size: 18px;

    line-height: 1.3;
}

.driver-section-title p {
    margin: 0;

    color: var(--driver-muted);

    font-size: 13px;

    line-height: 1.5;
}


/* =========================================================
   FIELDS GRID
   ========================================================= */

.driver-fields-grid {
    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 20px;
}

.driver-full {
    grid-column: 1 / -1;
}


/* =========================================================
   FORM GROUP
   ========================================================= */

.driver-form-group {
    display: flex;
    flex-direction: column;

    gap: 7px;
}

.driver-form-group label {
    color: var(--driver-text);

    font-size: 13px;

    font-weight: 700;
}

.driver-form-group label span {
    color: var(--driver-danger);
}

.driver-form-group input,
.driver-form-group select,
.driver-form-group textarea {
    width: 100%;

    min-height: 46px;

    padding: 11px 13px;

    border: 1px solid var(--driver-border);

    border-radius: 10px;

    background: var(--driver-white);

    color: var(--driver-text);

    outline: none;

    font-family: inherit;

    font-size: 14px;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.driver-form-group textarea {
    min-height: 125px;

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

    box-shadow: 0 0 0 3px rgba(6, 59, 115, 0.09);
}

.driver-form-group small {
    color: var(--driver-muted);

    font-size: 11px;
}


/* =========================================================
   LOCATION BOX
   ========================================================= */

.driver-location-box {
    display: flex;
    align-items: center;

    gap: 14px;

    padding: 16px;

    background: #f8fafc;

    border: 1px solid var(--driver-border);

    border-radius: 12px;
}

.driver-location-icon {
    width: 45px;
    height: 45px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 12px;

    background: var(--driver-green-light);

    color: var(--driver-green);

    font-size: 18px;
}

.driver-location-content {
    flex: 1;

    min-width: 0;
}

.driver-location-content strong {
    display: block;

    margin-bottom: 3px;

    color: var(--driver-text);

    font-size: 14px;
}

.driver-location-content p {
    margin: 0;

    color: var(--driver-muted);

    font-size: 12px;

    line-height: 1.5;
}

.driver-secondary-button {
    min-height: 42px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    padding: 9px 13px;

    flex-shrink: 0;

    border: 1px solid var(--driver-blue);

    border-radius: 9px;

    background: var(--driver-white);

    color: var(--driver-blue);

    cursor: pointer;

    font-family: inherit;

    font-size: 12px;
    font-weight: 700;

    transition: all 0.2s ease;
}

.driver-secondary-button:hover {
    background: var(--driver-blue);

    color: var(--driver-white);
}


/* =========================================================
   PHOTOS
   ========================================================= */

.driver-photo-grid {
    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 20px;
}

.driver-photo-card {
    padding: 15px;

    border: 1px solid var(--driver-border);

    border-radius: 12px;

    background: #fafbfc;
}

.driver-photo-preview {
    position: relative;

    width: 100%;
    height: 220px;

    margin-bottom: 12px;

    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 10px;

    background: #eef2f6;

    border: 1px dashed #cbd5e1;
}

.driver-photo-preview img {
    display: none;

    width: 100%;
    height: 100%;

    object-fit: cover;
}

.driver-photo-preview img[src]:not([src=""]) {
    display: block;
}

.driver-photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 9px;

    color: #98a2b3;

    font-size: 13px;
}

.driver-photo-placeholder i {
    font-size: 32px;
}

.driver-photo-button {
    min-height: 43px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    padding: 10px 15px;

    border: 1px solid var(--driver-blue);

    border-radius: 9px;

    background: var(--driver-white);

    color: var(--driver-blue);

    cursor: pointer;

    font-size: 13px;
    font-weight: 700;

    transition: all 0.2s ease;
}

.driver-photo-button:hover {
    background: var(--driver-blue);

    color: var(--driver-white);
}


/* =========================================================
   AVAILABILITY
   ========================================================= */

.driver-availability {
    position: relative;

    display: flex;
    align-items: center;

    gap: 14px;

    padding: 16px;

    border: 1px solid var(--driver-border);

    border-radius: 12px;

    background: #fafbfc;

    cursor: pointer;

    user-select: none;
}

.driver-availability-icon {
    width: 45px;
    height: 45px;

    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 12px;

    background: var(--driver-green-light);

    color: var(--driver-green);

    font-size: 18px;
}

.driver-availability-text {
    flex: 1;

    min-width: 0;
}

.driver-availability-text strong {
    display: block;

    margin-bottom: 3px;

    color: var(--driver-text);

    font-size: 14px;
}

.driver-availability-text span {
    display: block;

    color: var(--driver-muted);

    font-size: 12px;

    line-height: 1.5;
}

.driver-availability input {
    position: absolute;

    opacity: 0;

    pointer-events: none;
}

.driver-switch {
    position: relative;

    width: 48px;
    height: 27px;

    flex-shrink: 0;

    border-radius: 30px;

    background: #cbd5e1;

    transition: background 0.2s ease;
}

.driver-switch::after {
    content: "";

    position: absolute;

    top: 3px;
    left: 3px;

    width: 21px;
    height: 21px;

    border-radius: 50%;

    background: var(--driver-white);

    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);

    transition: transform 0.2s ease;
}

.driver-availability input:checked + .driver-switch {
    background: var(--driver-green);
}

.driver-availability input:checked + .driver-switch::after {
    transform: translateX(21px);
}


/* =========================================================
   TERMS
   ========================================================= */

.driver-terms {
    padding: 22px 28px;

    background: #fafbfc;

    border-bottom: 1px solid var(--driver-border);
}

.driver-terms label {
    display: flex;
    align-items: flex-start;

    gap: 10px;

    cursor: pointer;

    color: var(--driver-muted);

    font-size: 12px;

    line-height: 1.6;
}

.driver-terms input {
    width: 17px;
    height: 17px;

    margin-top: 2px;

    flex-shrink: 0;

    accent-color: var(--driver-blue);

    cursor: pointer;
}


/* =========================================================
   FORM ACTIONS
   ========================================================= */

.driver-form-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    padding: 22px 28px;

    background: var(--driver-white);
}

.driver-cancel-button,
.driver-submit-button {
    min-height: 47px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 9px;

    padding: 11px 18px;

    border-radius: 10px;

    font-family: inherit;

    font-size: 13px;
    font-weight: 700;

    text-decoration: none;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.driver-cancel-button {
    border: 1px solid var(--driver-border);

    background: var(--driver-white);

    color: var(--driver-muted);
}

.driver-cancel-button:hover {
    background: #f8fafc;

    color: var(--driver-text);
}

.driver-submit-button {
    min-width: 190px;

    border: 1px solid var(--driver-green);

    background: var(--driver-green);

    color: var(--driver-white);
}

.driver-submit-button:hover {
    background: var(--driver-green-dark);

    box-shadow: 0 5px 14px rgba(32, 168, 107, 0.2);

    transform: translateY(-1px);
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
    padding: 22px 25px;

    text-align: center;

    color: var(--driver-muted);

    font-size: 12px;
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

    .driver-sidebar-logo {
        height: 92px;
    }

    .driver-sidebar-logo img {
        width: 155px;
    }

    .driver-sidebar-nav a {
        font-size: 13px;
    }

    .driver-topbar {
        padding: 0 18px;
    }

    .driver-hero {
        padding: 35px 20px;
    }

    .driver-section {
        padding-top: 28px;
    }

    .driver-container {
        width: min(100% - 30px, 1100px);
    }

    .driver-form-section {
        padding: 24px;
    }

}


/* =========================================================
   MOBILE — SIDEBAR
   ========================================================= */

@media (max-width: 800px) {

    .driver-sidebar {
        width: 270px;

        transform: translateX(-100%);

        transition: transform 0.25s ease;

        box-shadow: 8px 0 25px rgba(0, 0, 0, 0.15);
    }

    .driver-sidebar.open {
        transform: translateX(0);
    }

    .driver-overlay {
        display: block;

        opacity: 0;
        visibility: hidden;

        transition:
            opacity 0.25s ease,
            visibility 0.25s ease;
    }

    .driver-overlay.open {
        opacity: 1;
        visibility: visible;
    }

    .driver-main {
        margin-left: 0;
    }

    .driver-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .driver-topbar {
        height: 70px;

        padding: 0 14px;
    }

    .driver-top-logo {
        width: 150px;
        height: 58px;
    }

    .driver-top-logo img {
        width: 140px;
        max-height: 50px;
    }

    .driver-top-actions {
        gap: 5px;
    }

    .driver-top-icon {
        width: 38px;
        height: 38px;

        font-size: 15px;
    }

}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 600px) {

    .driver-container {
        width: calc(100% - 24px);
    }

    .driver-hero {
        padding: 28px 12px;
    }

    .driver-hero .driver-container {
        align-items: flex-start;

        gap: 13px;
    }

    .driver-hero-icon {
        width: 50px;
        height: 50px;

        border-radius: 13px;

        font-size: 22px;
    }

    .driver-kicker {
        font-size: 10px;
    }

    .driver-hero h1 {
        font-size: 25px;
    }

    .driver-hero p {
        margin-top: 7px;

        font-size: 13px;

        line-height: 1.5;
    }

    .driver-section {
        padding: 18px 0 35px;
    }

    .driver-card {
        border-radius: 12px;
    }

    .driver-form-section {
        padding: 20px 15px;
    }

    .driver-section-title {
        gap: 11px;

        margin-bottom: 19px;
    }

    .driver-section-title-icon {
        width: 38px;
        height: 38px;

        border-radius: 9px;

        font-size: 15px;
    }

    .driver-section-title h2 {
        font-size: 16px;
    }

    .driver-section-title p {
        font-size: 11px;
    }

    .driver-fields-grid {
        grid-template-columns: 1fr;

        gap: 15px;
    }

    .driver-full {
        grid-column: auto;
    }

    .driver-form-group input,
    .driver-form-group select,
    .driver-form-group textarea {
        min-height: 45px;

        font-size: 13px;
    }

    .driver-location-box {
        align-items: flex-start;

        flex-wrap: wrap;

        padding: 13px;
    }

    .driver-location-content {
        flex: 1 1 calc(100% - 60px);
    }

    .driver-secondary-button {
        width: 100%;

        margin-top: 2px;
    }

    .driver-photo-grid {
        grid-template-columns: 1fr;

        gap: 15px;
    }

    .driver-photo-preview {
        height: 200px;
    }

    .driver-availability {
        padding: 13px;

        gap: 10px;
    }

    .driver-availability-icon {
        width: 40px;
        height: 40px;
    }

    .driver-availability-text strong {
        font-size: 13px;
    }

    .driver-availability-text span {
        font-size: 11px;
    }

    .driver-terms {
        padding: 17px 15px;
    }

    .driver-form-actions {
        flex-direction: column-reverse;

        align-items: stretch;

        padding: 18px 15px;
    }

    .driver-cancel-button,
    .driver-submit-button {
        width: 100%;
    }

    .driver-submit-button {
        min-width: 0;
    }

    .driver-footer {
        padding: 18px 12px;

        font-size: 11px;
    }

}


/* =========================================================
   SMALL MOBILE
   ========================================================= */

@media (max-width: 380px) {

    .driver-top-logo {
        left: 54%;
    }

    .driver-top-logo img {
        width: 125px;
    }

    .driver-top-icon {
        width: 35px;
        height: 35px;
    }

    .driver-hero h1 {
        font-size: 22px;
    }

    .driver-hero p {
        font-size: 12px;
    }

    .driver-form-section {
        padding: 18px 12px;
    }

}


/* =========================================================
   ACCESSIBILITÉ
   ========================================================= */

.driver-sidebar-nav a:focus-visible,
.driver-top-icon:focus-visible,
.driver-menu-button:focus-visible,
.driver-secondary-button:focus-visible,
.driver-photo-button:focus-visible,
.driver-submit-button:focus-visible,
.driver-cancel-button:focus-visible {
    outline: 3px solid rgba(32, 168, 107, 0.35);

    outline-offset: 2px;
}


/* =========================================================
   RÉDUCTION DES ANIMATIONS
   ========================================================= */

@media (prefers-reduced-motion: reduce) {

    .driver-sidebar,
    .driver-overlay,
    .driver-sidebar-nav a,
    .driver-top-icon,
    .driver-secondary-button,
    .driver-photo-button,
    .driver-submit-button,
    .driver-switch,
    .driver-switch::after {
        transition: none !important;
    }

}

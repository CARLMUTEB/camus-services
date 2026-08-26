// =========================================================
// CAMU SERVICES — STORE GLOBAL
// =========================================================

const state = {
    user: null,
    userData: null,
    isAuthenticated: false,
    listeners: []
};


// =========================================================
// RÉCUPÉRER L'ÉTAT
// =========================================================

export function getState() {
    return {
        user: state.user,
        userData: state.userData,
        isAuthenticated: state.isAuthenticated
    };
}


// =========================================================
// DÉFINIR L'UTILISATEUR
// =========================================================

export function setUser(user, userData = null) {

    state.user = user;

    state.userData = userData;

    state.isAuthenticated = !!user;

    notify();
}


// =========================================================
// AJOUTER UN ÉCOUTEUR
// =========================================================

export function addListener(callback) {

    if (typeof callback !== "function") {
        return () => {};
    }

    state.listeners.push(callback);

    // Envoyer immédiatement l'état actuel
    callback(getState());


    // Fonction permettant de supprimer l'écouteur
    return function unsubscribe() {

        state.listeners =
            state.listeners.filter(
                listener => listener !== callback
            );
    };
}


// =========================================================
// NOTIFIER LES COMPOSANTS
// =========================================================

function notify() {

    const currentState =
        getState();

    state.listeners.forEach(
        listener => {

            try {

                listener(currentState);

            } catch (error) {

                console.error(
                    "CAMU SERVICES — erreur listener :",
                    error
                );
            }
        }
    );
}

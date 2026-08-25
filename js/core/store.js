// =========================================================
// CAMU SERVICES — STORE GLOBAL
// =========================================================

const state = {
    user: null,
    userData: null,
    isAuthenticated: false,
    listeners: []
};

export function getState() {
    return { ...state };
}

export function setUser(user, userData = null) {
    state.user = user;
    state.userData = userData;
    state.isAuthenticated = !!user;

    notify();
}

export function addListener(callback) {
    if (typeof callback !== "function") return;

    state.listeners.push(callback);

    callback({ ...state });

    return () => {
        state.listeners = state.listeners.filter(
            listener => listener !== callback
        );
    };
}

function notify() {
    state.listeners.forEach(listener => {
        try {
            listener({ ...state });
        } catch (error) {
            console.error("Erreur listener :", error);
        }
    });
}

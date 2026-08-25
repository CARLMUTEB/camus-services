```javascript
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
// OBTENIR L'ÉTAT
// =========================================================

export function getState() {

    return {

        user: state.user,

        userData: state.userData,

        isAuthenticated:
            state.isAuthenticated
    };
}


// =========================================================
// UTILISATEUR
// =========================================================

export function setUser(
    user,
    userData = null
) {

    state.user =
        user;

    state.userData =
        userData;

    state.isAuthenticated =
        !!user;

    notify();
}


// =========================================================
// LISTENERS
// =========================================================

export function addListener(
    callback
) {

    if (
        typeof callback !==
        "function"
    ) {
        return () => {};
    }

    state.listeners.push(
        callback
    );

    callback(
        getState()
    );

    return () => {

        state.listeners =
            state.listeners.filter(
                listener =>
                    listener !== callback
            );
    };
}


// =========================================================
// NOTIFICATION
// =========================================================

function notify() {

    const currentState =
        getState();

    state.listeners.forEach(
        listener => {

            try {

                listener(
                    currentState
                );

            } catch (error) {

                console.error(
                    "Erreur listener :",
                    error
                );
            }

        }
    );
}
```

function getAuthErrorMessage(error) {
    if (!error) return "Une erreur inconnue est survenue.";
    switch (error.code) {
        case "auth/email-already-in-use": return "Cette adresse e-mail est déjà utilisée.";
        case "auth/invalid-email": return "L'adresse e-mail n'est pas valide.";
        case "auth/weak-password": return "Le mot de passe est trop faible.";
        case "auth/user-not-found": return "Aucun compte ne correspond à cette adresse e-mail.";
        case "auth/wrong-password": return "Mot de passe incorrect.";
        case "auth/invalid-credential": return "E-mail ou mot de passe incorrect.";
        case "auth/too-many-requests": return "Trop de tentatives. Réessayez plus tard.";
        case "auth/network-request-failed": return "Problème de connexion Internet.";
        case "auth/user-disabled": return "Ce compte a été désactivé.";
        default: return error.message || "Une erreur est survenue.";
    }
}

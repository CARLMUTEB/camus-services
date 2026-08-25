# CAMU SERVICES V2

Cette version centralise Firebase dans `js/app.js`.

## Déploiement
1. Remplacer les anciens fichiers par ceux de ce dossier.
2. Conserver votre projet Firebase `camu-services`.
3. Publier `firestore.rules` dans Firestore Rules.
4. Publier `storage.rules` dans Storage Rules si Storage est activé.
5. Dans Firestore, utiliser les collections : users, services, favoris, avis, communiques.
6. Le compte `meschackmuteb@gmail.com` est l'administrateur prévu par les règles.

## Statuts services
`pending` → `approved`.

## Important
Les requêtes `orderBy` peuvent demander des index Firestore. Si Firebase fournit un lien de création d'index, utilisez-le.

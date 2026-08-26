import{initializeApp}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import{getAuth,signOut}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import{getFirestore}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",authDomain:"camu-services.firebaseapp.com",projectId:"camu-services",storageBucket:"camu-services.firebasestorage.app",messagingSenderId:"879100396449",appId:"1:879100396449:web:9d7ffe441a3df2daf841e0"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);export{app,auth,db,signOut};

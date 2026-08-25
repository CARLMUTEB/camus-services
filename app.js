/* CAMU SERVICES V2 — cœur unique Firebase */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc,
  deleteDoc, getDocs, query, where, orderBy, limit, serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyB9zYQHEYVPJ1nGGx_TEzjQ8a7MyXCWdrg",
  authDomain: "camu-services.firebaseapp.com",
  projectId: "camu-services",
  storageBucket: "camu-services.firebasestorage.app",
  messagingSenderId: "879100396449",
  appId: "1:879100396449:web:9d7ffe441a3df2daf841e0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const COLLECTIONS = Object.freeze({
  USERS: "users", SERVICES: "services", FAVORIS: "favoris",
  AVIS: "avis", COMMUNIQUES: "communiques"
});
export const ROLES = Object.freeze({
  CLIENT: "client", PRESTATAIRE: "prestataire", VENDEUR: "vendeur", ADMIN: "admin"
});
export const CATEGORIES = Object.freeze([
  "Construction","Transport","Beauté","Restaurant","Informatique",
  "Commerce","Services"
]);

export const authReady = setPersistence(auth, browserLocalPersistence).catch(console.error);
let currentUser = null;
onAuthStateChanged(auth, user => {
  currentUser = user;
  window.dispatchEvent(new CustomEvent("camu-auth", { detail: user }));
});
export function getCurrentUser(){ return currentUser || auth.currentUser; }
export function isUserConnected(){ return !!getCurrentUser(); }

export async function waitForAuth(timeout=10000){
  if (auth.currentUser) return auth.currentUser;
  return new Promise(resolve => {
    let done = false;
    const finish = u => { if(done) return; done=true; unsub(); resolve(u); };
    const unsub = onAuthStateChanged(auth, finish);
    setTimeout(() => finish(auth.currentUser), timeout);
  });
}

function clean(v=""){ return String(v).trim(); }
export function escapeHTML(v=""){
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
export function normalizePhone(v=""){ return String(v).replace(/[^\d+]/g,""); }
export function whatsappUrl(phone, message=""){
  const p = normalizePhone(phone).replace(/^\+/, "");
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(message)}` : "";
}
export function serviceWhatsAppMessage(service){
  return `Bonjour, je viens de CAMU SERVICES. Je souhaite des informations concernant votre service "${service.titre || "service"}".`;
}

export async function registerUser({email,password,nom,prenom="",telephone="",role=ROLES.CLIENT}){
  try{
    await authReady;
    const cred = await createUserWithEmailAndPassword(auth, clean(email), password);
    await setDoc(doc(db,COLLECTIONS.USERS,cred.user.uid), {
      uid: cred.user.uid, email: cred.user.email || clean(email),
      nom: clean(nom), prenom: clean(prenom), telephone: clean(telephone),
      whatsapp: clean(telephone), localisation:"", role: ROLES.CLIENT,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    return {success:true,user:cred.user};
  }catch(error){ return {success:false,error:error.code || error.message}; }
}

export async function loginUser(email,password){
  try{
    await authReady;
    const cred = await signInWithEmailAndPassword(auth, clean(email), password);
    return {success:true,user:cred.user};
  }catch(error){ return {success:false,error:error.code || error.message}; }
}

export async function loginGoogle(){
  try{
    await authReady;
    const cred = await signInWithPopup(auth, googleProvider);
    const ref = doc(db,COLLECTIONS.USERS,cred.user.uid);
    const snap = await getDoc(ref);
    if(!snap.exists()){
      await setDoc(ref,{
        uid:cred.user.uid,email:cred.user.email||"",
        nom:cred.user.displayName||"",prenom:"",
        telephone:"",whatsapp:"",localisation:"",
        role:ROLES.CLIENT,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
    }
    return {success:true,user:cred.user};
  }catch(error){ return {success:false,error:error.code || error.message}; }
}

export async function logout(){
  try{ await signOut(auth); return {success:true}; }
  catch(error){ return {success:false,error:error.code || error.message}; }
}
export async function resetPassword(email){
  try{ await sendPasswordResetEmail(auth,clean(email)); return {success:true}; }
  catch(error){ return {success:false,error:error.code || error.message}; }
}

export async function getProfile(uid){
  try{
    const snap = await getDoc(doc(db,COLLECTIONS.USERS,uid));
    return snap.exists()?{success:true,data:{id:snap.id,...snap.data()}}:
      {success:false,error:"Profil non trouvé"};
  }catch(error){return {success:false,error:error.message};}
}
export async function updateProfile(uid,updates){
  try{
    const allowed = ["nom","prenom","telephone","whatsapp","localisation"];
    const safe = Object.fromEntries(Object.entries(updates).filter(([k])=>allowed.includes(k)));
    await updateDoc(doc(db,COLLECTIONS.USERS,uid),{...safe,updatedAt:serverTimestamp()});
    return {success:true};
  }catch(error){return {success:false,error:error.message};}
}

export function normalizeService(data,user){
  return {
    titre:clean(data.titre), description:clean(data.description),
    categorie:clean(data.categorie), localisation:clean(data.localisation),
    telephone:clean(data.telephone), whatsapp:clean(data.whatsapp || data.telephone),
    imageUrl:clean(data.imageUrl), prix:clean(data.prix),
    userId:user.uid, status:"pending",
    createdAt:serverTimestamp(), updatedAt:serverTimestamp()
  };
}
export async function createService(data){
  const user=getCurrentUser();
  if(!user) return {success:false,error:"Utilisateur non connecté"};
  try{
    const ref=await addDoc(collection(db,COLLECTIONS.SERVICES),normalizeService(data,user));
    return {success:true,id:ref.id};
  }catch(error){return {success:false,error:error.message};}
}
export async function getService(id){
  try{
    const snap=await getDoc(doc(db,COLLECTIONS.SERVICES,id));
    return snap.exists()?{success:true,data:{id:snap.id,...snap.data()}}:
      {success:false,error:"Service non trouvé"};
  }catch(error){return {success:false,error:error.message};}
}
export async function listApprovedServices(max=50){
  try{
    const q=query(collection(db,COLLECTIONS.SERVICES),
      where("status","==","approved"),orderBy("createdAt","desc"),limit(max));
    const snap=await getDocs(q);
    return {success:true,data:snap.docs.map(d=>({id:d.id,...d.data()}))};
  }catch(error){return {success:false,error:error.message};}
}
export async function listMyServices(uid){
  try{
    const q=query(collection(db,COLLECTIONS.SERVICES),where("userId","==",uid),orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    return {success:true,data:snap.docs.map(d=>({id:d.id,...d.data()}))};
  }catch(error){return {success:false,error:error.message};}
}
export async function updateService(id,updates){
  try{
    const allowed=["titre","description","categorie","localisation","telephone","whatsapp","imageUrl","prix"];
    const safe=Object.fromEntries(Object.entries(updates).filter(([k])=>allowed.includes(k)));
    await updateDoc(doc(db,COLLECTIONS.SERVICES,id),{...safe,status:"pending",updatedAt:serverTimestamp()});
    return {success:true};
  }catch(error){return {success:false,error:error.message};}
}
export async function deleteService(id){
  try{ await deleteDoc(doc(db,COLLECTIONS.SERVICES,id)); return {success:true}; }
  catch(error){return {success:false,error:error.message};}
}

export async function getFavorites(){
  const user=getCurrentUser();
  if(!user) return {success:false,error:"Utilisateur non connecté",ids:[]};
  try{
    const q=query(collection(db,COLLECTIONS.FAVORIS),where("userId","==",user.uid));
    const snap=await getDocs(q);
    return {success:true,ids:snap.docs.map(d=>d.data().serviceId)};
  }catch(error){return {success:false,error:error.message,ids:[]};}
}
export async function addFavorite(serviceId){
  const user=getCurrentUser();
  if(!user) return {success:false,error:"Connectez-vous d'abord"};
  try{
    const q=query(collection(db,COLLECTIONS.FAVORIS),where("userId","==",user.uid),where("serviceId","==",serviceId));
    if(!(await getDocs(q)).empty) return {success:true,exists:true};
    await addDoc(collection(db,COLLECTIONS.FAVORIS),{userId:user.uid,serviceId,createdAt:serverTimestamp()});
    return {success:true};
  }catch(error){return {success:false,error:error.message};}
}
export async function removeFavorite(serviceId){
  const user=getCurrentUser();
  if(!user) return {success:false,error:"Connectez-vous d'abord"};
  try{
    const q=query(collection(db,COLLECTIONS.FAVORIS),where("userId","==",user.uid),where("serviceId","==",serviceId));
    const snap=await getDocs(q);
    await Promise.all(snap.docs.map(d=>deleteDoc(d.ref)));
    return {success:true};
  }catch(error){return {success:false,error:error.message};}
}
export async function getFavoriteServices(){
  const f=await getFavorites(); if(!f.success) return f;
  const snaps=await Promise.all(f.ids.map(id=>getDoc(doc(db,COLLECTIONS.SERVICES,id))));
  return {success:true,data:snaps.filter(s=>s.exists()).map(s=>({id:s.id,...s.data()}))};
}

export async function listCommuniques(max=30){
  try{
    const q=query(collection(db,COLLECTIONS.COMMUNIQUES),
      where("published","==",true),orderBy("createdAt","desc"),limit(max));
    const snap=await getDocs(q);
    return {success:true,data:snap.docs.map(d=>({id:d.id,...d.data()}))};
  }catch(error){return {success:false,error:error.message};}
}
export async function createCommunique(data){
  try{
    const ref=await addDoc(collection(db,COLLECTIONS.COMMUNIQUES),{
      titre:clean(data.titre),description:clean(data.description),
      type:clean(data.type)||"Information",published:true,
      createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    return {success:true,id:ref.id};
  }catch(error){return {success:false,error:error.message};}
}
export async function deleteCommunique(id){
  try{await deleteDoc(doc(db,COLLECTIONS.COMMUNIQUES,id));return {success:true};}
  catch(error){return {success:false,error:error.message};}
}

export async function addReview(serviceId,note,commentaire){
  const user=getCurrentUser(); if(!user)return {success:false,error:"Connectez-vous d'abord"};
  try{
    const profile=await getProfile(user.uid);
    await addDoc(collection(db,COLLECTIONS.AVIS),{
      serviceId,userId:user.uid,userName:profile.data?.nom || user.email || "Utilisateur",
      note:Number(note),commentaire:clean(commentaire),createdAt:serverTimestamp()
    });
    return {success:true};
  }catch(error){return {success:false,error:error.message};}
}

export function applyTheme(){
  const dark=localStorage.getItem("camu-theme")==="dark";
  document.documentElement.classList.toggle("dark",dark);
}
export function toggleTheme(){
  const dark=!document.documentElement.classList.contains("dark");
  localStorage.setItem("camu-theme",dark?"dark":"light"); applyTheme();
}
applyTheme();

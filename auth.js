// js/auth.js
import { app } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const auth = getAuth(app);

export async function login(email, password) {
  if (!email || !password) throw new Error("Correo y contraseña son obligatorios");
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
